import { z } from 'zod'

export const analyzeRequestSchema = z.object({
  content: z.string().min(1, 'content must not be empty'),
})

export type AnalyzeRequestBody = z.infer<typeof analyzeRequestSchema>
