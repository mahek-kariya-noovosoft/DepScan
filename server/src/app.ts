import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { analyzeRouter } from './routes/analyze.route.js'
import { authRouter } from './routes/auth.route.js'

export const app = express()

app.use(cors({ origin: process.env.FRONTEND_URL ?? 'http://localhost:5173', credentials: true }))
app.use(express.json({ limit: '1mb' }))
app.use(cookieParser())

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api', analyzeRouter)
app.use('/api/auth', authRouter)
