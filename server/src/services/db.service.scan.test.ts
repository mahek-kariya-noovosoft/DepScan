import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest'
import { execSync } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'
import {
  createOrUpdateUser,
  upsertRepos,
  getRepoById,
  saveScanResult,
  getScanResultsByRepoId,
  getLatestScanResult,
  getReposByUserId,
} from './db.service.js'
import { prisma } from '../db/prisma.js'
import type { AnalysisResult } from '@shared/types/index.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const serverDir = path.resolve(__dirname, '../../')

const TEST_USER = {
  githubId: 33333,
  githubUsername: 'testuser',
  avatarUrl: 'https://example.com/avatar.png',
  accessToken: 'plaintext_token_abc',
}

const TEST_REPO = {
  githubRepoId: 66666,
  name: 'my-repo',
  fullName: 'testuser/my-repo',
  defaultBranch: 'main',
  language: 'TypeScript',
  stars: 42,
}

const MOCK_ANALYSIS: AnalysisResult = {
  overallScore: 72.5,
  grade: 'B',
  totalDependencies: 10,
  analyzedCount: 10,
  wasTruncated: false,
  riskCounts: { critical: 0, high: 1, medium: 3, low: 6 },
  dependencies: [],
  aiRecommendation: 'Looks mostly fine.',
}

beforeAll(() => {
  execSync('npx prisma migrate deploy', {
    cwd: serverDir,
    env: { ...process.env },
    stdio: 'pipe',
  })
})

beforeEach(async () => {
  await prisma.scanResult.deleteMany()
  await prisma.repo.deleteMany()
  await prisma.user.deleteMany()
})

afterAll(async () => {
  await prisma.scanResult.deleteMany()
  await prisma.repo.deleteMany()
  await prisma.user.deleteMany()
  await prisma.$disconnect()
})

async function setupUserAndRepo() {
  const userResult = await createOrUpdateUser(TEST_USER)
  if (!userResult.success) throw new Error('User setup failed')
  const reposResult = await upsertRepos(userResult.data.id, [TEST_REPO])
  if (!reposResult.success) throw new Error('Repo setup failed')
  return { userId: userResult.data.id, repoId: reposResult.data[0].id }
}

describe('saveScanResult', () => {
  it('should save a scan result and update repo lastScannedAt', async () => {
    const { repoId } = await setupUserAndRepo()
    const result = await saveScanResult(repoId, MOCK_ANALYSIS)
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.overallScore).toBe(72.5)
    expect(result.data.grade).toBe('B')
    expect(JSON.parse(result.data.riskCounts)).toMatchObject({ high: 1 })
    // Verify lastScannedAt was updated on repo
    const repoResult = await getRepoById(repoId)
    if (!repoResult.success) return
    expect(repoResult.data.lastScannedAt).toBeTruthy()
  })

  it('should return 500 for an invalid repoId', async () => {
    const result = await saveScanResult('non-existent-repo-id', MOCK_ANALYSIS)
    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.status).toBe(500)
  })
})

describe('getScanResultsByRepoId', () => {
  it('should return all scan results ordered by date desc', async () => {
    const { repoId } = await setupUserAndRepo()
    await saveScanResult(repoId, MOCK_ANALYSIS)
    await saveScanResult(repoId, { ...MOCK_ANALYSIS, overallScore: 55, grade: 'C' })
    const result = await getScanResultsByRepoId(repoId)
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data).toHaveLength(2)
    // Most recent (second save, grade C) comes first
    expect(result.data[0].overallScore).toBe(55)
  })

  it('should return empty array for repo with no scans', async () => {
    const { repoId } = await setupUserAndRepo()
    const result = await getScanResultsByRepoId(repoId)
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data).toHaveLength(0)
  })
})

describe('getLatestScanResult', () => {
  it('should return the most recent scan result', async () => {
    const { repoId } = await setupUserAndRepo()
    await saveScanResult(repoId, MOCK_ANALYSIS)
    await saveScanResult(repoId, { ...MOCK_ANALYSIS, overallScore: 33, grade: 'D' })
    const result = await getLatestScanResult(repoId)
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data).not.toBeNull()
    expect(result.data?.grade).toBe('D')
  })

  it('should return null for a repo with no scan results', async () => {
    const { repoId } = await setupUserAndRepo()
    const result = await getLatestScanResult(repoId)
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data).toBeNull()
  })
})

describe('user → repos → scanResults relationships', () => {
  it('should correctly link user → repos → scanResults', async () => {
    const { userId, repoId } = await setupUserAndRepo()
    await saveScanResult(repoId, MOCK_ANALYSIS)
    // User owns repo
    const reposByUser = await getReposByUserId(userId)
    expect(reposByUser.success).toBe(true)
    if (!reposByUser.success) return
    expect(reposByUser.data[0].userId).toBe(userId)
    // Repo has scan results
    const scans = await getScanResultsByRepoId(repoId)
    expect(scans.success).toBe(true)
    if (!scans.success) return
    expect(scans.data[0].repoId).toBe(repoId)
  })
})
