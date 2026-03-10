import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import request from 'supertest'
import { app } from '../app.js'

// Mock auth service
vi.mock('../services/auth.service.js', () => ({
  COOKIE_NAME: 'auth_token',
  getGithubAuthUrl: vi.fn(),
  loginOrCreateUser: vi.fn(),
  verifyJwt: vi.fn(),
  generateJwt: vi.fn(),
}))

// Mock db service
vi.mock('../services/db.service.js', () => ({
  getUserById: vi.fn(),
}))

import * as authService from '../services/auth.service.js'
import * as dbService from '../services/db.service.js'

const mockGetGithubAuthUrl = vi.mocked(authService.getGithubAuthUrl)
const mockLoginOrCreateUser = vi.mocked(authService.loginOrCreateUser)
const mockVerifyJwt = vi.mocked(authService.verifyJwt)
const mockGetUserById = vi.mocked(dbService.getUserById)

describe('auth routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.SESSION_SECRET = 'test-secret'
    process.env.GITHUB_CLIENT_ID = 'test-client-id'
  })

  afterEach(() => {
    delete process.env.SESSION_SECRET
    delete process.env.GITHUB_CLIENT_ID
  })

  // ── GET /api/auth/github ──────────────────────────────────────────────

  describe('GET /api/auth/github', () => {
    it('should redirect to GitHub OAuth URL', async () => {
      mockGetGithubAuthUrl.mockReturnValue({
        success: true,
        data: 'https://github.com/login/oauth/authorize?client_id=test',
      })

      const response = await request(app).get('/api/auth/github').expect(302)

      expect(response.headers.location).toBe('https://github.com/login/oauth/authorize?client_id=test')
    })

    it('should return 500 when GitHub client ID is not configured', async () => {
      mockGetGithubAuthUrl.mockReturnValue({
        success: false,
        error: 'GITHUB_CLIENT_ID not configured',
        status: 500,
      })

      const response = await request(app).get('/api/auth/github').expect(500)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('GITHUB_CLIENT_ID')
    })
  })

  // ── GET /api/auth/callback ────────────────────────────────────────────

  describe('GET /api/auth/callback', () => {
    it('should set JWT cookie and redirect to frontend on success', async () => {
      mockLoginOrCreateUser.mockResolvedValue({
        success: true,
        data: {
          user: { id: 'user-123', githubUsername: 'testuser', avatarUrl: 'https://avatar.example.com' },
          token: 'jwt.token.here',
        },
      })

      const response = await request(app).get('/api/auth/callback?code=valid-code').expect(302)

      expect(response.headers['set-cookie']).toBeDefined()
      const cookies = response.headers['set-cookie'] as unknown as string[]
      expect(cookies.some((c: string) => c.includes('auth_token=jwt.token.here'))).toBe(true)
      expect(response.headers.location).toContain('localhost:5173')
    })

    it('should return 400 when code is missing', async () => {
      const response = await request(app).get('/api/auth/callback').expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('code')
    })

    it('should return error status when loginOrCreateUser fails', async () => {
      mockLoginOrCreateUser.mockResolvedValue({
        success: false,
        error: 'GitHub token exchange failed: 401',
        status: 401,
      })

      const response = await request(app).get('/api/auth/callback?code=bad-code').expect(401)

      expect(response.body.success).toBe(false)
    })
  })

  // ── POST /api/auth/logout ─────────────────────────────────────────────

  describe('POST /api/auth/logout', () => {
    it('should clear the auth cookie and return success', async () => {
      const response = await request(app).post('/api/auth/logout').expect(200)

      expect(response.body.success).toBe(true)
      const cookies = response.headers['set-cookie'] as unknown as string[] | undefined
      if (cookies) {
        expect(cookies.some((c: string) => c.includes('auth_token=;') || c.includes('auth_token=;') || c.includes('Expires=Thu, 01 Jan 1970'))).toBe(true)
      }
    })
  })

  // ── GET /api/auth/me ──────────────────────────────────────────────────

  describe('GET /api/auth/me', () => {
    it('should return user profile for authenticated request', async () => {
      mockVerifyJwt.mockReturnValue({ success: true, data: { userId: 'user-123' } })
      mockGetUserById.mockResolvedValue({
        success: true,
        data: {
          id: 'user-123',
          githubId: 42,
          githubUsername: 'testuser',
          avatarUrl: 'https://avatar.example.com',
          accessToken: 'ghp_token',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      })

      const response = await request(app)
        .get('/api/auth/me')
        .set('Cookie', 'auth_token=valid.jwt.token')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toMatchObject({
        id: 'user-123',
        githubUsername: 'testuser',
        avatarUrl: 'https://avatar.example.com',
      })
    })

    it('should return 401 when no auth cookie', async () => {
      const response = await request(app).get('/api/auth/me').expect(401)

      expect(response.body.success).toBe(false)
    })

    it('should return 401 when JWT is invalid', async () => {
      mockVerifyJwt.mockReturnValue({ success: false, error: 'Invalid token', status: 401 })

      const response = await request(app)
        .get('/api/auth/me')
        .set('Cookie', 'auth_token=bad.jwt.token')
        .expect(401)

      expect(response.body.success).toBe(false)
    })

    it('should return 404 when user not found in DB', async () => {
      mockVerifyJwt.mockReturnValue({ success: true, data: { userId: 'ghost-user' } })
      mockGetUserById.mockResolvedValue({ success: false, error: 'User not found', status: 404 })

      const response = await request(app)
        .get('/api/auth/me')
        .set('Cookie', 'auth_token=valid.jwt.token')
        .expect(404)

      expect(response.body.success).toBe(false)
    })
  })
})
