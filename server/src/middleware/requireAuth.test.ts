import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { Request, Response, NextFunction } from 'express'
import { requireAuth } from './requireAuth.js'
import * as authService from '../services/auth.service.js'

vi.mock('../services/auth.service.js', () => ({
  COOKIE_NAME: 'auth_token',
  verifyJwt: vi.fn(),
}))

const mockVerifyJwt = vi.mocked(authService.verifyJwt)

function makeReq(cookies: Record<string, string> = {}): Partial<Request> {
  return { cookies }
}

function makeRes(): { res: Partial<Response>; status: ReturnType<typeof vi.fn>; json: ReturnType<typeof vi.fn> } {
  const json = vi.fn()
  const status = vi.fn().mockReturnValue({ json })
  const res = { status, json } as unknown as Partial<Response>
  // Make res.status().json() work AND res.json() work
  ;(res as { json: typeof json }).json = json
  return { res, status, json }
}

describe('requireAuth middleware', () => {
  const next = vi.fn() as unknown as NextFunction

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.SESSION_SECRET = 'test-secret'
  })

  afterEach(() => {
    delete process.env.SESSION_SECRET
  })

  it('should call next and attach userId for a valid JWT cookie', () => {
    mockVerifyJwt.mockReturnValue({ success: true, data: { userId: 'user-123' } })
    const req = makeReq({ auth_token: 'valid.jwt.token' }) as Request
    const { res } = makeRes()

    requireAuth(req, res as Response, next)

    expect(next).toHaveBeenCalledOnce()
    expect(req.userId).toBe('user-123')
  })

  it('should return 401 when no cookie is present', () => {
    const req = makeReq() as Request
    const { res, status, json } = makeRes()

    requireAuth(req, res as Response, next)

    expect(status).toHaveBeenCalledWith(401)
    expect(json).toHaveBeenCalledWith({ success: false, error: 'Unauthorized' })
    expect(next).not.toHaveBeenCalled()
  })

  it('should return 401 when JWT is invalid', () => {
    mockVerifyJwt.mockReturnValue({ success: false, error: 'Invalid token', status: 401 })
    const req = makeReq({ auth_token: 'bad.jwt.token' }) as Request
    const { res, status, json } = makeRes()

    requireAuth(req, res as Response, next)

    expect(status).toHaveBeenCalledWith(401)
    expect(json).toHaveBeenCalledWith({ success: false, error: 'Unauthorized' })
    expect(next).not.toHaveBeenCalled()
  })

  it('should return 401 when JWT is expired', () => {
    mockVerifyJwt.mockReturnValue({ success: false, error: 'jwt expired', status: 401 })
    const req = makeReq({ auth_token: 'expired.jwt.token' }) as Request
    const { res, status, json } = makeRes()

    requireAuth(req, res as Response, next)

    expect(status).toHaveBeenCalledWith(401)
    expect(next).not.toHaveBeenCalled()
  })
})
