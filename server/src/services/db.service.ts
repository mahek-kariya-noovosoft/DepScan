import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'
import { prisma } from '../db/prisma.js'
import type { User, Repo, ScanResult } from '../generated/prisma/client.js'
import type { ServiceResult, AnalysisResult } from '@shared/types/index.js'

// ── Token encryption (AES-256-GCM) ───────────────────────────────────
// Key must be TOKEN_ENCRYPTION_KEY env var: 64-char hex string (32 bytes)

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16

function getEncryptionKey(): Buffer {
  const raw = process.env.TOKEN_ENCRYPTION_KEY
  if (!raw || raw.length !== 64) {
    throw new Error('TOKEN_ENCRYPTION_KEY must be a 64-character hex string (32 bytes)')
  }
  return Buffer.from(raw, 'hex')
}

function encryptToken(token: string): string {
  const key = getEncryptionKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  // Stored format: iv:authTag:ciphertext (all hex)
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`
}

function decryptToken(stored: string): string {
  const key = getEncryptionKey()
  const parts = stored.split(':')
  if (parts.length !== 3) throw new Error('Invalid encrypted token format')
  const [ivHex, authTagHex, encryptedHex] = parts
  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')
  const encrypted = Buffer.from(encryptedHex, 'hex')
  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)
  return decipher.update(encrypted).toString('utf8') + decipher.final('utf8')
}

// ── User ─────────────────────────────────────────────────────────────

export interface CreateOrUpdateUserData {
  githubId: number
  githubUsername: string
  avatarUrl: string
  accessToken: string
}

export async function createOrUpdateUser(data: CreateOrUpdateUserData): Promise<ServiceResult<User>> {
  try {
    const encryptedToken = encryptToken(data.accessToken)
    const user = await prisma.user.upsert({
      where: { githubId: data.githubId },
      create: {
        githubId: data.githubId,
        githubUsername: data.githubUsername,
        avatarUrl: data.avatarUrl,
        accessToken: encryptedToken,
      },
      update: {
        githubUsername: data.githubUsername,
        avatarUrl: data.avatarUrl,
        accessToken: encryptedToken,
      },
    })
    // Return the plaintext token so callers can use it immediately
    return { success: true, data: { ...user, accessToken: data.accessToken } }
  } catch (error) {
    return { success: false, error: String(error), status: 500 }
  }
}

export async function getUserById(id: string): Promise<ServiceResult<User>> {
  try {
    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) return { success: false, error: 'User not found', status: 404 }
    return { success: true, data: { ...user, accessToken: decryptToken(user.accessToken) } }
  } catch (error) {
    return { success: false, error: String(error), status: 500 }
  }
}

export async function getUserByGithubId(githubId: number): Promise<ServiceResult<User>> {
  try {
    const user = await prisma.user.findUnique({ where: { githubId } })
    if (!user) return { success: false, error: 'User not found', status: 404 }
    return { success: true, data: { ...user, accessToken: decryptToken(user.accessToken) } }
  } catch (error) {
    return { success: false, error: String(error), status: 500 }
  }
}

// ── Repos ────────────────────────────────────────────────────────────

export interface UpsertRepoData {
  githubRepoId: number
  name: string
  fullName: string
  defaultBranch?: string
  language?: string | null
  stars?: number
}

export async function upsertRepos(userId: string, repos: UpsertRepoData[]): Promise<ServiceResult<Repo[]>> {
  try {
    const upserted = await Promise.all(
      repos.map((repo) =>
        prisma.repo.upsert({
          where: { githubRepoId: repo.githubRepoId },
          create: {
            userId,
            githubRepoId: repo.githubRepoId,
            name: repo.name,
            fullName: repo.fullName,
            defaultBranch: repo.defaultBranch ?? 'main',
            language: repo.language ?? null,
            stars: repo.stars ?? 0,
          },
          update: {
            name: repo.name,
            fullName: repo.fullName,
            defaultBranch: repo.defaultBranch ?? 'main',
            language: repo.language ?? null,
            stars: repo.stars ?? 0,
          },
        }),
      ),
    )
    return { success: true, data: upserted }
  } catch (error) {
    return { success: false, error: String(error), status: 500 }
  }
}

export async function getReposByUserId(userId: string): Promise<ServiceResult<Repo[]>> {
  try {
    const repos = await prisma.repo.findMany({ where: { userId } })
    return { success: true, data: repos }
  } catch (error) {
    return { success: false, error: String(error), status: 500 }
  }
}

export async function getRepoById(id: string): Promise<ServiceResult<Repo>> {
  try {
    const repo = await prisma.repo.findUnique({ where: { id } })
    if (!repo) return { success: false, error: 'Repo not found', status: 404 }
    return { success: true, data: repo }
  } catch (error) {
    return { success: false, error: String(error), status: 500 }
  }
}

// ── Scan results ─────────────────────────────────────────────────────

export async function saveScanResult(
  repoId: string,
  analysisResult: AnalysisResult,
): Promise<ServiceResult<ScanResult>> {
  try {
    const scanResult = await prisma.scanResult.create({
      data: {
        repoId,
        overallScore: analysisResult.overallScore,
        grade: analysisResult.grade,
        riskCounts: JSON.stringify(analysisResult.riskCounts),
        dependencies: JSON.stringify(analysisResult.dependencies),
      },
    })
    // Update lastScannedAt on the repo
    await prisma.repo.update({
      where: { id: repoId },
      data: { lastScannedAt: scanResult.scannedAt },
    })
    return { success: true, data: scanResult }
  } catch (error) {
    return { success: false, error: String(error), status: 500 }
  }
}

export async function getScanResultsByRepoId(repoId: string): Promise<ServiceResult<ScanResult[]>> {
  try {
    const results = await prisma.scanResult.findMany({
      where: { repoId },
      orderBy: [{ scannedAt: 'desc' }, { id: 'desc' }],
    })
    return { success: true, data: results }
  } catch (error) {
    return { success: false, error: String(error), status: 500 }
  }
}

export async function getLatestScanResult(repoId: string): Promise<ServiceResult<ScanResult | null>> {
  try {
    const result = await prisma.scanResult.findFirst({
      where: { repoId },
      orderBy: [{ scannedAt: 'desc' }, { id: 'desc' }],
    })
    return { success: true, data: result }
  } catch (error) {
    return { success: false, error: String(error), status: 500 }
  }
}
