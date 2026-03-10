import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  getGithubAuthUrl,
  exchangeCodeForToken,
  fetchGithubProfile,
  generateJwt,
  verifyJwt,
} from './auth.service.js'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// Mock db.service so loginOrCreateUser doesn't hit the database
vi.mock('./db.service.js', () => ({
  createOrUpdateUser: vi.fn().mockResolvedValue({
    success: true,
    data: {
      id: 'user-123',
      githubId: 42,
      githubUsername: 'testuser',
      avatarUrl: 'https://github.com/avatar.png',
      accessToken: 'token',
      createdAt: new Date(),
      updatedAt: new Date(),
      repos: [],
    },
  }),
}))

describe('auth.service', () => {
  beforeEach(() => {
    process.env.GITHUB_CLIENT_ID = 'test-client-id'
    process.env.GITHUB_CLIENT_SECRET = 'test-client-secret'
    process.env.SESSION_SECRET = 'test-session-secret-that-is-long-enough'
    process.env.TOKEN_ENCRYPTION_KEY = 'a'.repeat(64)
    vi.clearAllMocks()
  })

  afterEach(() => {
    delete process.env.GITHUB_CLIENT_ID
    delete process.env.GITHUB_CLIENT_SECRET
    delete process.env.SESSION_SECRET
  })

  // ── getGithubAuthUrl ─────────────────────────────────────────────────

  describe('getGithubAuthUrl', () => {
    it('should return a valid GitHub OAuth URL', () => {
      const result = getGithubAuthUrl()
      expect(result.success).toBe(true)
      if (!result.success) return
      expect(result.data).toContain('https://github.com/login/oauth/authorize')
      expect(result.data).toContain('client_id=test-client-id')
      expect(result.data).toContain('scope=read%3Auser')
    })

    it('should fail when GITHUB_CLIENT_ID is missing', () => {
      delete process.env.GITHUB_CLIENT_ID
      const result = getGithubAuthUrl()
      expect(result.success).toBe(false)
      if (result.success) return
      expect(result.status).toBe(500)
      expect(result.error).toContain('GITHUB_CLIENT_ID')
    })
  })

  // ── exchangeCodeForToken ──────────────────────────────────────────────

  describe('exchangeCodeForToken', () => {
    it('should return access token on success', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'ghp_abc123' }),
      })
      const result = await exchangeCodeForToken('auth-code-123')
      expect(result.success).toBe(true)
      if (!result.success) return
      expect(result.data).toBe('ghp_abc123')
    })

    it('should fail when GitHub returns an error field', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ error: 'bad_verification_code' }),
      })
      const result = await exchangeCodeForToken('bad-code')
      expect(result.success).toBe(false)
      if (result.success) return
      expect(result.status).toBe(401)
      expect(result.error).toBe('bad_verification_code')
    })

    it('should fail when GitHub returns non-ok response', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 500 })
      const result = await exchangeCodeForToken('code')
      expect(result.success).toBe(false)
      if (result.success) return
      expect(result.status).toBe(502)
    })

    it('should fail when credentials are missing', async () => {
      delete process.env.GITHUB_CLIENT_ID
      const result = await exchangeCodeForToken('code')
      expect(result.success).toBe(false)
      if (result.success) return
      expect(result.status).toBe(500)
    })

    it('should fail when fetch throws (network error)', async () => {
      mockFetch.mockRejectedValueOnce(new Error('network error'))
      const result = await exchangeCodeForToken('code')
      expect(result.success).toBe(false)
    })
  })

  // ── fetchGithubProfile ────────────────────────────────────────────────

  describe('fetchGithubProfile', () => {
    it('should return mapped GithubProfile on success', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 42, login: 'testuser', avatar_url: 'https://avatar.example.com' }),
      })
      const result = await fetchGithubProfile('ghp_token')
      expect(result.success).toBe(true)
      if (!result.success) return
      expect(result.data).toEqual({ id: 42, login: 'testuser', avatarUrl: 'https://avatar.example.com' })
    })

    it('should fail when GitHub returns non-ok response', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 401 })
      const result = await fetchGithubProfile('bad-token')
      expect(result.success).toBe(false)
      if (result.success) return
      expect(result.status).toBe(502)
    })

    it('should fail on invalid profile response (missing id)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ login: 'testuser' }),
      })
      const result = await fetchGithubProfile('token')
      expect(result.success).toBe(false)
    })

    it('should fail when fetch throws', async () => {
      mockFetch.mockRejectedValueOnce(new Error('timeout'))
      const result = await fetchGithubProfile('token')
      expect(result.success).toBe(false)
    })
  })

  // ── generateJwt / verifyJwt ───────────────────────────────────────────

  describe('generateJwt', () => {
    it('should generate a valid JWT for a userId', () => {
      const result = generateJwt('user-abc')
      expect(result.success).toBe(true)
      if (!result.success) return
      expect(result.data).toBeTruthy()
      const parts = result.data.split('.')
      expect(parts).toHaveLength(3) // header.payload.signature
    })

    it('should fail when SESSION_SECRET is missing', () => {
      delete process.env.SESSION_SECRET
      const result = generateJwt('user-abc')
      expect(result.success).toBe(false)
      if (result.success) return
      expect(result.status).toBe(500)
    })
  })

  describe('verifyJwt', () => {
    it('should return userId for a valid JWT', () => {
      const genResult = generateJwt('user-xyz')
      expect(genResult.success).toBe(true)
      if (!genResult.success) return

      const verResult = verifyJwt(genResult.data)
      expect(verResult.success).toBe(true)
      if (!verResult.success) return
      expect(verResult.data.userId).toBe('user-xyz')
    })

    it('should fail for an invalid token', () => {
      const result = verifyJwt('not.a.valid.jwt')
      expect(result.success).toBe(false)
      if (result.success) return
      expect(result.status).toBe(401)
    })

    it('should fail for a token signed with wrong secret', () => {
      const genResult = generateJwt('user-xyz')
      expect(genResult.success).toBe(true)
      if (!genResult.success) return

      process.env.SESSION_SECRET = 'different-secret'
      const result = verifyJwt(genResult.data)
      expect(result.success).toBe(false)
    })

    it('should fail when SESSION_SECRET is missing', () => {
      delete process.env.SESSION_SECRET
      const result = verifyJwt('some.token.here')
      expect(result.success).toBe(false)
      if (result.success) return
      expect(result.status).toBe(500)
    })
  })
})
