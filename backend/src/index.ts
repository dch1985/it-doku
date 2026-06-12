import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import documentsRouter from './routes/documents.js'
import assetsRouter from './routes/assets.js'
import agentRouter from './routes/agent.js'
import statsRouter from './routes/stats.js'

dotenv.config()

const app = express()
const PORT = Number(process.env.PORT) || 3001

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }))
app.use(express.json({ limit: '2mb' }))

app.get('/api/health', (_req, res) => {
  res.json({ status: 'OK', name: 'Trust Doc API', timestamp: new Date().toISOString() })
})

app.use('/api/documents', documentsRouter)
app.use('/api/assets', assetsRouter)
app.use('/api/agent', agentRouter)
app.use('/api/stats', statsRouter)

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' })
})

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[TrustDoc]', err)
  res.status(500).json({ error: 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`Trust Doc API running on http://localhost:${PORT}`)
})
