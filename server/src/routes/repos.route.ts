import { Router } from 'express'
import type { Request, Response } from 'express'
import { requireAuth } from '../middleware/requireAuth.js'
import { fetchUserRepos, syncReposToDb, scanRepo } from '../services/repos.service.js'
import { getUserById, getScanResultsByRepoId } from '../services/db.service.js'

export const reposRouter = Router()

// GET /api/repos — fetch repos from GitHub, sync to DB, return list
reposRouter.get('/', requireAuth, async (req: Request, res: Response) => {
  const userResult = await getUserById(req.userId!)
  if (!userResult.success) {
    res.status(userResult.status).json({ success: false, error: userResult.error })
    return
  }
  const fetchResult = await fetchUserRepos(userResult.data.accessToken)
  if (!fetchResult.success) {
    res.status(fetchResult.status).json({ success: false, error: fetchResult.error })
    return
  }
  const syncResult = await syncReposToDb(req.userId!, fetchResult.data)
  if (!syncResult.success) {
    res.status(syncResult.status).json({ success: false, error: syncResult.error })
    return
  }
  res.json({ success: true, data: syncResult.data })
})

// POST /api/repos/:id/scan — scan a specific repo
reposRouter.post('/:id/scan', requireAuth, async (req: Request<{ id: string }>, res: Response) => {
  const userResult = await getUserById(req.userId!)
  if (!userResult.success) {
    res.status(userResult.status).json({ success: false, error: userResult.error })
    return
  }
  const result = await scanRepo(req.params.id, userResult.data.accessToken)
  if (!result.success) {
    res.status(result.status).json({ success: false, error: result.error })
    return
  }
  res.json({ success: true, data: result.data })
})

// GET /api/repos/:id/results — get all scan results for a repo
reposRouter.get('/:id/results', requireAuth, async (req: Request<{ id: string }>, res: Response) => {
  const result = await getScanResultsByRepoId(req.params.id)
  if (!result.success) {
    res.status(result.status).json({ success: false, error: result.error })
    return
  }
  res.json({ success: true, data: result.data })
})
