import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import { app } from '../app.js'

// ── Mocks ─────────────────────────────────────────────────────────────

vi.mock('../services/auth.service.js', () => ({
  COOKIE_NAME: 'auth_token',
  verifyJwt: vi.fn(),
}))

vi.mock('../services/db.service.js', () => ({
  getUserById: vi.fn(),
  getScanResultsByRepoId: vi.fn(),
}))

vi.mock('../services/repos.service.js', () => ({
  fetchUserRepos: vi.fn(),
  syncReposToDb: vi.fn(),
  scanRepo: vi.fn(),
}))

import * as authService from '../services/auth.service.js'
import * as dbService from '../services/db.service.js'
import * as reposService from '../services/repos.service.js'

const mockVerifyJwt = vi.mocked(authService.verifyJwt)
const mockGetUserById = vi.mocked(dbService.getUserById)
const mockGetScanResultsByRepoId = vi.mocked(dbService.getScanResultsByRepoId)
const mockFetchUserRepos = vi.mocked(reposService.fetchUserRepos)
const mockSyncReposToDb = vi.mocked(reposService.syncReposToDb)
const mockScanRepo = vi.mocked(reposService.scanRepo)

const authedCookie = 'auth_token=valid.jwt.token'

const dbUser = {
  id: 'user-abc',
  githubId: 42,
  githubUsername: 'testuser',
  avatarUrl: 'https://avatar.example.com',
  accessToken: 'ghp_plaintext',
  createdAt: new Date(),
  updatedAt: new Date(),
}

const dbRepo = {
  id: 'repo-123',
  userId: 'user-abc',
  githubRepoId: 1,
  name: 'my-repo',
  fullName: 'user/my-repo',
  defaultBranch: 'main',
  language: 'TypeScript',
  stars: 42,
  lastScannedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const dbScanResult = {
  id: 'scan-1',
  repoId: 'repo-123',
  overallScore: 35,
  grade: 'B',
  riskCounts: '{"critical":0,"high":1,"medium":1,"low":1}',
  dependencies: '[]',
  scannedAt: new Date(),
}

beforeEach(() => {
  vi.clearAllMocks()
  mockVerifyJwt.mockReturnValue({ success: true, data: { userId: 'user-abc' } })
  mockGetUserById.mockResolvedValue({ success: true, data: dbUser })
})

// ── GET /api/repos ─────────────────────────────────────────────────────

describe('GET /api/repos', () => {
  it('should return repos on success', async () => {
    mockFetchUserRepos.mockResolvedValueOnce({ success: true, data: [] })
    mockSyncReposToDb.mockResolvedValueOnce({ success: true, data: [dbRepo] })

    const response = await request(app).get('/api/repos').set('Cookie', authedCookie).expect(200)

    expect(response.body.success).toBe(true)
    expect(response.body.data).toHaveLength(1)
  })

  it('should return 401 when not authenticated', async () => {
    const response = await request(app).get('/api/repos').expect(401)
    expect(response.body.success).toBe(false)
  })

  it('should return error when getUserById fails', async () => {
    mockGetUserById.mockResolvedValueOnce({ success: false, error: 'User not found', status: 404 })

    const response = await request(app).get('/api/repos').set('Cookie', authedCookie).expect(404)
    expect(response.body.success).toBe(false)
  })

  it('should return error when fetchUserRepos fails', async () => {
    mockFetchUserRepos.mockResolvedValueOnce({ success: false, error: 'GitHub API error: 403', status: 502 })

    const response = await request(app).get('/api/repos').set('Cookie', authedCookie).expect(502)
    expect(response.body.success).toBe(false)
    expect(response.body.error).toContain('403')
  })

  it('should return error when syncReposToDb fails', async () => {
    mockFetchUserRepos.mockResolvedValueOnce({ success: true, data: [] })
    mockSyncReposToDb.mockResolvedValueOnce({ success: false, error: 'DB error', status: 500 })

    const response = await request(app).get('/api/repos').set('Cookie', authedCookie).expect(500)
    expect(response.body.success).toBe(false)
  })
})

// ── POST /api/repos/:id/scan ───────────────────────────────────────────

describe('POST /api/repos/:id/scan', () => {
  it('should return scan result on success', async () => {
    mockScanRepo.mockResolvedValueOnce({ success: true, data: dbScanResult })

    const response = await request(app).post('/api/repos/repo-123/scan').set('Cookie', authedCookie).expect(200)

    expect(response.body.success).toBe(true)
    expect(response.body.data.id).toBe('scan-1')
  })

  it('should return 401 when not authenticated', async () => {
    const response = await request(app).post('/api/repos/repo-123/scan').expect(401)
    expect(response.body.success).toBe(false)
  })

  it('should return 404 when repo has no package.json', async () => {
    mockScanRepo.mockResolvedValueOnce({
      success: false,
      error: 'No package.json found in this repository',
      status: 404,
    })

    const response = await request(app).post('/api/repos/repo-123/scan').set('Cookie', authedCookie).expect(404)
    expect(response.body.success).toBe(false)
    expect(response.body.error).toContain('No package.json')
  })

  it('should return error when scanRepo fails', async () => {
    mockScanRepo.mockResolvedValueOnce({ success: false, error: 'Scan failed', status: 500 })

    const response = await request(app).post('/api/repos/repo-123/scan').set('Cookie', authedCookie).expect(500)
    expect(response.body.success).toBe(false)
  })
})

// ── GET /api/repos/:id/results ─────────────────────────────────────────

describe('GET /api/repos/:id/results', () => {
  it('should return scan results for a repo', async () => {
    mockGetScanResultsByRepoId.mockResolvedValueOnce({ success: true, data: [dbScanResult] })

    const response = await request(app).get('/api/repos/repo-123/results').set('Cookie', authedCookie).expect(200)

    expect(response.body.success).toBe(true)
    expect(response.body.data).toHaveLength(1)
    expect(response.body.data[0].id).toBe('scan-1')
  })

  it('should return 401 when not authenticated', async () => {
    const response = await request(app).get('/api/repos/repo-123/results').expect(401)
    expect(response.body.success).toBe(false)
  })

  it('should return error when getScanResultsByRepoId fails', async () => {
    mockGetScanResultsByRepoId.mockResolvedValueOnce({ success: false, error: 'DB error', status: 500 })

    const response = await request(app).get('/api/repos/repo-123/results').set('Cookie', authedCookie).expect(500)
    expect(response.body.success).toBe(false)
  })
})