import type { Request, Response, NextFunction } from 'express'
import { verifyJwt, COOKIE_NAME } from '../services/auth.service.js'

declare global {
  namespace Express {
    interface Request {
      userId?: string
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.[COOKIE_NAME] as string | undefined
  if (!token) {
    res.status(401).json({ success: false, error: 'Unauthorized' })
    return
  }
  const result = verifyJwt(token)
  if (!result.success) {
    res.status(401).json({ success: false, error: 'Unauthorized' })
    return
  }
  req.userId = result.data.userId
  next()
}
