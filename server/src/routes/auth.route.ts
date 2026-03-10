import { Router } from 'express'
import type { Request, Response } from 'express'
import {
  getGithubAuthUrl,
  loginOrCreateUser,
  COOKIE_NAME,
} from '../services/auth.service.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { getUserById } from '../services/db.service.js'

export const authRouter = Router()

const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:5173'
const COOKIE_OPTS = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, maxAge: 7 * 24 * 60 * 60 * 1000 }

authRouter.get('/github', (_req: Request, res: Response) => {
  const result = getGithubAuthUrl()
  if (!result.success) {
    res.status(result.status).json({ success: false, error: result.error })
    return
  }
  res.redirect(result.data)
})

authRouter.get('/callback', async (req: Request, res: Response) => {
  const code = req.query.code as string | undefined
  if (!code) {
    res.status(400).json({ success: false, error: 'Missing OAuth code' })
    return
  }
  const result = await loginOrCreateUser(code)
  if (!result.success) {
    res.status(result.status).json({ success: false, error: result.error })
    return
  }
  res.cookie(COOKIE_NAME, result.data.token, COOKIE_OPTS)
  res.redirect(FRONTEND_URL)
})

authRouter.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie(COOKIE_NAME)
  res.json({ success: true })
})

authRouter.get('/me', requireAuth, async (req: Request, res: Response) => {
  const result = await getUserById(req.userId!)
  if (!result.success) {
    res.status(result.status).json({ success: false, error: result.error })
    return
  }
  const { id, githubUsername, avatarUrl } = result.data
  res.json({ success: true, data: { id, githubUsername, avatarUrl } })
})
