import express from 'express'
import cors from 'cors'
import { analyzeRouter } from './routes/analyze.route.js'

export const app = express()

app.use(cors())
app.use(express.json({ limit: '1mb' }))

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api', analyzeRouter)
