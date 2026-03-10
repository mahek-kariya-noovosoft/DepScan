import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest'
import { execSync } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'
import { createOrUpdateUser, upsertRepos, getReposByUserId, getRepoById } from './db.service.js'
import { prisma } from '../db/prisma.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const serverDir = path.resolve(__dirname, '../../')

const TEST_USER = {
  githubId: 22222,
  githubUsername: 'testuser',
  avatarUrl: 'https://example.com/avatar.png',
  accessToken: 'plaintext_token_abc',
}

const TEST_REPO = {
  githubRepoId: 88888,
  name: 'my-repo',
  fullName: 'testuser/my-repo',
  defaultBranch: 'main',
  language: 'TypeScript',
  stars: 42,
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

describe('upsertRepos', () => {
  it('should create repos for a user', async () => {
    const userResult = await createOrUpdateUser(TEST_USER)
    if (!userResult.success) throw new Error('Setup failed')
    const result = await upsertRepos(userResult.data.id, [TEST_REPO])
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data).toHaveLength(1)
    expect(result.data[0].name).toBe(TEST_REPO.name)
    expect(result.data[0].stars).toBe(42)
  })

  it('should update an existing repo on duplicate githubRepoId', async () => {
    const userResult = await createOrUpdateUser(TEST_USER)
    if (!userResult.success) throw new Error('Setup failed')
    await upsertRepos(userResult.data.id, [TEST_REPO])
    const result = await upsertRepos(userResult.data.id, [{ ...TEST_REPO, stars: 100 }])
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data[0].stars).toBe(100)
  })

  it('should handle an empty repos array', async () => {
    const userResult = await createOrUpdateUser(TEST_USER)
    if (!userResult.success) throw new Error('Setup failed')
    const result = await upsertRepos(userResult.data.id, [])
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data).toHaveLength(0)
  })
})

describe('getReposByUserId', () => {
  it('should return all repos for a user', async () => {
    const userResult = await createOrUpdateUser(TEST_USER)
    if (!userResult.success) throw new Error('Setup failed')
    const secondRepo = { ...TEST_REPO, githubRepoId: 77777, name: 'other-repo', fullName: 'testuser/other-repo' }
    await upsertRepos(userResult.data.id, [TEST_REPO, secondRepo])
    const result = await getReposByUserId(userResult.data.id)
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data).toHaveLength(2)
  })

  it('should return empty array for user with no repos', async () => {
    const userResult = await createOrUpdateUser(TEST_USER)
    if (!userResult.success) throw new Error('Setup failed')
    const result = await getReposByUserId(userResult.data.id)
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data).toHaveLength(0)
  })
})

describe('getRepoById', () => {
  it('should return repo for a valid id', async () => {
    const userResult = await createOrUpdateUser(TEST_USER)
    if (!userResult.success) throw new Error('Setup failed')
    const reposResult = await upsertRepos(userResult.data.id, [TEST_REPO])
    if (!reposResult.success) throw new Error('Setup failed')
    const result = await getRepoById(reposResult.data[0].id)
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.fullName).toBe(TEST_REPO.fullName)
  })

  it('should return 404 for a non-existent id', async () => {
    const result = await getRepoById('non-existent-id')
    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.status).toBe(404)
  })
})
