import { describe, it, expect, vi, beforeEach } from 'vitest'
import { analyzePackageJson } from './analyze'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

const mockAnalysisResult = {
  overallScore: 45,
  grade: 'C',
  totalDependencies: 3,
  analyzedCount: 3,
  wasTruncated: false,
  riskCounts: { critical: 0, high: 1, medium: 1, low: 1 },
  dependencies: [],
  aiRecommendation: 'Test recommendation',
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('analyzePackageJson', () => {
  it('should return analysis result on success', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockAnalysisResult }),
    })

    const result = await analyzePackageJson('{"dependencies":{}}')

    expect(result.success).toBe(true)
    expect(result.data?.overallScore).toBe(45)
    expect(result.data?.grade).toBe('C')
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/analyze',
      expect.objectContaining({ method: 'POST', headers: { 'Content-Type': 'application/json' } }),
    )
  })

  it('should send content as JSON body', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockAnalysisResult }),
    })

    await analyzePackageJson('{"name":"test"}')

    const [, options] = mockFetch.mock.calls[0]
    const body = JSON.parse(options.body as string)
    expect(body.content).toBe('{"name":"test"}')
  })

  it('should return error when server returns non-ok with JSON error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Invalid package.json' }),
    })

    const result = await analyzePackageJson('not-json')

    expect(result.success).toBe(false)
    expect(result.error).toBe('Invalid package.json')
  })

  it('should return generic error when server returns non-ok with no body', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => { throw new Error('no body') },
    })

    const result = await analyzePackageJson('{}')

    expect(result.success).toBe(false)
    expect(result.error).toContain('500')
  })

  it('should return error when fetch throws (network error)', async () => {
    mockFetch.mockRejectedValueOnce(new Error('ECONNREFUSED'))

    const result = await analyzePackageJson('{}')

    expect(result.success).toBe(false)
    expect(result.error).toBe('ECONNREFUSED')
  })

  it('should return timeout error when request is aborted', async () => {
    mockFetch.mockImplementationOnce((_url: string, options: RequestInit) => {
      const signal = options?.signal as AbortSignal
      if (signal) {
        const abortError = new DOMException('Aborted', 'AbortError')
        return Promise.reject(abortError)
      }
      return Promise.reject(new Error('no signal'))
    })

    const result = await analyzePackageJson('{}')

    expect(result.success).toBe(false)
    expect(result.error).toContain('timed out')
  })

  it('should return unknown error message for non-Error throws', async () => {
    mockFetch.mockRejectedValueOnce('string error')

    const result = await analyzePackageJson('{}')

    expect(result.success).toBe(false)
    expect(result.error).toBe('An unexpected error occurred')
  })
})
