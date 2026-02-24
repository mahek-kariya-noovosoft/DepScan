import { Router } from 'express'
import type { Request, Response } from 'express'
import { analyzeRequestSchema } from '../validation/analyze.schema.js'
import { analyzeDependencies } from '../orchestrator/analyzer.js'

export const analyzeRouter = Router()

analyzeRouter.post('/analyze', async (req: Request, res: Response) => {
  try {
    const validation = analyzeRequestSchema.safeParse(req.body)

    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: validation.error.issues.map((issue) => issue.message).join(', '),
      })
      return
    }

    const result = await analyzeDependencies(validation.data.content)

    res.json({
      success: true,
      data: result,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'

    // Parser errors are client errors (bad input)
    if (message.startsWith('Invalid JSON') || message.startsWith('No dependencies found')) {
      res.status(400).json({
        success: false,
        error: message,
      })
      return
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error',
    })
  }
})
