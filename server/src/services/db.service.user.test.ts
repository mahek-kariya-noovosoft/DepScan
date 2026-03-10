import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest'
import { execSync } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'
import { createOrUpdateUser, getUserById, getUserByGithubId } from './db.service.js'
import { prisma } from '../db/prisma.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const serverDir = path.resolve(__dirname, '../../')

const TEST_USER = {
  githubId: 11111,
  githubUsername: 'testuser',
  avatarUrl: 'https://example.com/avatar.png',
  accessToken: 'plaintext_token_abc',
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

describe('createOrUpdateUser', () => {
  it('should create a new user and return success', async () => {
    const result = await createOrUpdateUser(TEST_USER)
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.githubId).toBe(TEST_USER.githubId)
    expect(result.data.githubUsername).toBe(TEST_USER.githubUsername)
    expect(result.data.id).toBeTruthy()
  })

  it('should return the plaintext access token (not the encrypted form)', async () => {
    const result = await createOrUpdateUser(TEST_USER)
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.accessToken).toBe(TEST_USER.accessToken)
  })

  it('should update an existing user on duplicate githubId', async () => {
    await createOrUpdateUser(TEST_USER)
    const updated = await createOrUpdateUser({
      ...TEST_USER,
      githubUsername: 'updated_username',
      accessToken: 'new_token',
    })
    expect(updated.success).toBe(true)
    if (!updated.success) return
    expect(updated.data.githubUsername).toBe('updated_username')
    expect(updated.data.accessToken).toBe('new_token')
    expect(updated.data.githubId).toBe(TEST_USER.githubId)
  })
})

describe('getUserById', () => {
  it('should return the user with decrypted access token', async () => {
    const created = await createOrUpdateUser(TEST_USER)
    if (!created.success) throw new Error('Setup failed')
    const result = await getUserById(created.data.id)
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.id).toBe(created.data.id)
    expect(result.data.accessToken).toBe(TEST_USER.accessToken)
  })

  it('should return 404 for a non-existent id', async () => {
    const result = await getUserById('non-existent-id')
    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.status).toBe(404)
  })
})

describe('getUserByGithubId', () => {
  it('should return the user with decrypted access token', async () => {
    await createOrUpdateUser(TEST_USER)
    const result = await getUserByGithubId(TEST_USER.githubId)
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.githubId).toBe(TEST_USER.githubId)
    expect(result.data.accessToken).toBe(TEST_USER.accessToken)
  })

  it('should return 404 for a non-existent githubId', async () => {
    const result = await getUserByGithubId(0)
    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.status).toBe(404)
  })
})
