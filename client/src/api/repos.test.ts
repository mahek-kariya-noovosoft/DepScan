import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchRepos, scanRepo, getRepoResults } from './repos'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

const apiRepo = {
  id: 'repo-1',
  userId: 'user-1',
  githubRepoId: 42,
  name: 'my-repo',
  fullName: 'user/my-repo',
  defaultBranch: 'main',
  language: 'TypeScript',
  stars: 10,
  lastScannedAt: null,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
}

const apiScanResult = {
  id: 'scan-1',
  repoId: 'repo-1',
  overallScore: 40,
  grade: 'B',
  riskCounts: '{"critical":0,"high":1,"medium":1,"low":0}',
  dependencies: '[]',
  scannedAt: '2024-01-01T00:00:00Z',
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ── fetchRepos ─────────────────────────────────────────────────────────

describe('fetchRepos', () => {
  it('should return repos on success', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: [apiRepo] }),
    })

    const result = await fetchRepos()
    expect(result.success).toBe(true)
    expect(result.data).toHaveLength(1)
    expect(result.data![0].name).toBe('my-repo')
  })

  it('should return error when server returns non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Unauthorized' }),
    })

    const result = await fetchRepos()
    expect(result.success).toBe(false)
    expect(result.error).toContain('Unauthorized')
  })

  it('should return error when fetch throws (network error)', async () => {
    mockFetch.mockRejectedValueOnce(new Error('network error'))

    const result = await fetchRepos()
    expect(result.success).toBe(false)
    expect(result.error).toBe('network error')
  })
})

// ── scanRepo ───────────────────────────────────────────────────────────

describe('scanRepo', () => {
  it('should return scan result on success', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: apiScanResult }),
    })

    const result = await scanRepo('repo-1')
    expect(result.success).toBe(true)
    expect(result.data?.id).toBe('scan-1')
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/repos/repo-1/scan',
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('should return error when scan fails (no package.json)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ error: 'No package.json found in this repository' }),
    })

    const result = await scanRepo('repo-1')
    expect(result.success).toBe(false)
    expect(result.error).toContain('No package.json')
  })

  it('should return error when fetch throws', async () => {
    mockFetch.mockRejectedValueOnce(new Error('connection refused'))

    const result = await scanRepo('repo-1')
    expect(result.success).toBe(false)
  })
})

// ── getRepoResults ─────────────────────────────────────────────────────

describe('getRepoResults', () => {
  it('should return results array on success', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: [apiScanResult] }),
    })

    const result = await getRepoResults('repo-1')
    expect(result.success).toBe(true)
    expect(result.data).toHaveLength(1)
  })

  it('should return error when server fails', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Internal Server Error' }),
    })

    const result = await getRepoResults('repo-1')
    expect(result.success).toBe(false)
  })
})