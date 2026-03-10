import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchUserRepos, syncReposToDb, getRepoPackageJson, scanRepo } from './repos.service.js'

// ── Mocks ─────────────────────────────────────────────────────────────

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

vi.mock('./db.service.js', () => ({
  upsertRepos: vi.fn(),
  getRepoById: vi.fn(),
  saveScanResult: vi.fn(),
}))

vi.mock('../orchestrator/analyzer.js', () => ({
  analyzeDependencies: vi.fn(),
}))

import * as dbService from './db.service.js'
import * as analyzer from '../orchestrator/analyzer.js'

const mockUpsertRepos = vi.mocked(dbService.upsertRepos)
const mockGetRepoById = vi.mocked(dbService.getRepoById)
const mockSaveScanResult = vi.mocked(dbService.saveScanResult)
const mockAnalyzeDependencies = vi.mocked(analyzer.analyzeDependencies)

const rawRepo = {
  id: 1,
  name: 'my-repo',
  full_name: 'user/my-repo',
  default_branch: 'main',
  language: 'TypeScript',
  stargazers_count: 42,
  updated_at: '2024-01-01T00:00:00Z',
}

const githubRepo = {
  id: 1,
  name: 'my-repo',
  fullName: 'user/my-repo',
  defaultBranch: 'main',
  language: 'TypeScript',
  stars: 42,
  updatedAt: '2024-01-01T00:00:00Z',
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

beforeEach(() => {
  vi.clearAllMocks()
})

// ── fetchUserRepos ─────────────────────────────────────────────────────

describe('fetchUserRepos', () => {
  it('should return mapped repos on success', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [rawRepo],
      headers: { get: () => null },
    })

    const result = await fetchUserRepos('ghp_token')
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data).toHaveLength(1)
    expect(result.data[0]).toEqual(githubRepo)
  })

  it('should paginate when Link header contains rel="next"', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [rawRepo],
        headers: { get: () => '<https://api.github.com/user/repos?page=2>; rel="next"' },
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ ...rawRepo, id: 2, name: 'repo-2', full_name: 'user/repo-2' }],
        headers: { get: () => null },
      })

    const result = await fetchUserRepos('ghp_token')
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data).toHaveLength(2)
  })

  it('should return error when GitHub API returns non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 403 })

    const result = await fetchUserRepos('bad_token')
    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.status).toBe(502)
    expect(result.error).toContain('403')
  })

  it('should return error when fetch throws (network error)', async () => {
    mockFetch.mockRejectedValueOnce(new Error('network failure'))

    const result = await fetchUserRepos('token')
    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.status).toBe(500)
  })
})

// ── syncReposToDb ──────────────────────────────────────────────────────

describe('syncReposToDb', () => {
  it('should call upsertRepos with mapped data', async () => {
    mockUpsertRepos.mockResolvedValueOnce({ success: true, data: [dbRepo] })

    const result = await syncReposToDb('user-abc', [githubRepo])
    expect(result.success).toBe(true)
    expect(mockUpsertRepos).toHaveBeenCalledWith('user-abc', [
      {
        githubRepoId: 1,
        name: 'my-repo',
        fullName: 'user/my-repo',
        defaultBranch: 'main',
        language: 'TypeScript',
        stars: 42,
      },
    ])
  })

  it('should propagate db errors', async () => {
    mockUpsertRepos.mockResolvedValueOnce({ success: false, error: 'DB error', status: 500 })

    const result = await syncReposToDb('user-abc', [githubRepo])
    expect(result.success).toBe(false)
  })
})

// ── getRepoPackageJson ─────────────────────────────────────────────────

describe('getRepoPackageJson', () => {
  it('should return decoded package.json content', async () => {
    const content = JSON.stringify({ name: 'test', version: '1.0.0' })
    const encoded = Buffer.from(content, 'utf-8').toString('base64')

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ content: encoded, encoding: 'base64' }),
    })

    const result = await getRepoPackageJson('user', 'my-repo', 'token')
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data).toBe(content)
  })

  it('should return 404 error when package.json not found', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 404 })

    const result = await getRepoPackageJson('user', 'repo', 'token')
    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.status).toBe(404)
    expect(result.error).toContain('No package.json')
  })

  it('should return error when GitHub API fails', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 502 })

    const result = await getRepoPackageJson('user', 'repo', 'token')
    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.status).toBe(502)
  })

  it('should return error on unexpected encoding', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ content: 'raw', encoding: 'utf-8' }),
    })

    const result = await getRepoPackageJson('user', 'repo', 'token')
    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.status).toBe(500)
  })
})

// ── scanRepo ───────────────────────────────────────────────────────────

describe('scanRepo', () => {
  const mockAnalysis = {
    overallScore: 35,
    grade: 'B' as const,
    totalDependencies: 3,
    analyzedCount: 3,
    wasTruncated: false,
    riskCounts: { critical: 0, high: 1, medium: 1, low: 1 },
    dependencies: [],
    aiRecommendation: '',
  }

  const mockScanResult = {
    id: 'scan-1',
    repoId: 'repo-123',
    overallScore: 35,
    grade: 'B',
    riskCounts: JSON.stringify(mockAnalysis.riskCounts),
    dependencies: '[]',
    scannedAt: new Date(),
  }

  it('should scan a repo and save result on success', async () => {
    mockGetRepoById.mockResolvedValueOnce({ success: true, data: dbRepo })
    const content = JSON.stringify({ dependencies: { express: '^4.18.0' } })
    const encoded = Buffer.from(content, 'utf-8').toString('base64')
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ content: encoded, encoding: 'base64' }),
    })
    mockAnalyzeDependencies.mockResolvedValueOnce(mockAnalysis)
    mockSaveScanResult.mockResolvedValueOnce({ success: true, data: mockScanResult })

    const result = await scanRepo('repo-123', 'token')
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.repoId).toBe('repo-123')
  })

  it('should return error when repo is not found', async () => {
    mockGetRepoById.mockResolvedValueOnce({ success: false, error: 'Repo not found', status: 404 })

    const result = await scanRepo('bad-id', 'token')
    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.status).toBe(404)
  })

  it('should return 404 when repo has no package.json', async () => {
    mockGetRepoById.mockResolvedValueOnce({ success: true, data: dbRepo })
    mockFetch.mockResolvedValueOnce({ ok: false, status: 404 })

    const result = await scanRepo('repo-123', 'token')
    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.status).toBe(404)
  })

  it('should return error when analyzeDependencies throws', async () => {
    mockGetRepoById.mockResolvedValueOnce({ success: true, data: dbRepo })
    const content = JSON.stringify({ dependencies: {} })
    const encoded = Buffer.from(content).toString('base64')
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ content: encoded, encoding: 'base64' }),
    })
    mockAnalyzeDependencies.mockRejectedValueOnce(new Error('analyzer crashed'))

    const result = await scanRepo('repo-123', 'token')
    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.status).toBe(500)
  })
})
