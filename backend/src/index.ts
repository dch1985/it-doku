import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

import documentsRouter from './routes/documents.js'
import templatesRouter from './routes/templates.js'
import uploadRouter from './routes/upload.js'
import authRouter from './routes/auth.js'
import tenantsRouter from './routes/tenants.js'
import analyticsRouter from './routes/analytics.js'
import searchRouter from './routes/search.js'
import assetsRouter from './routes/assets.js'
import agentRouter from './routes/agent.js'
import auditRouter from './routes/audit.js'
import commentsRouter from './routes/comments.js'
import notificationsRouter from './routes/notifications.js'
import {
  loggerMiddleware,
  errorLogger,
  errorHandler,
  notFoundHandler,
  apiLimiter,
  authLimiter,
  uploadLimiter,
  authenticate,
} from './middleware/index.js'
import { devAuthenticate } from './middleware/auth.dev.middleware.js'

const app = express()
const PORT = process.env.PORT || process.env.WEBSITES_PORT || 3001
const isDevMode = process.env.NODE_ENV === 'development' || process.env.DEV_AUTH_ENABLED === 'true'

// Security & CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
)
app.use(express.json({ limit: '5mb' }))

// Request logging
app.use(loggerMiddleware)

// Rate limiting
app.use('/api/', apiLimiter)
app.use('/api/upload', uploadLimiter)

// In dev mode, resolve the demo user for every request so the API is fully
// usable without Azure AD.
if (isDevMode) {
  app.use('/api', devAuthenticate)
}

// Health & API docs
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'OK',
    name: 'TrustDoc API',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
  })
})

app.get('/api/docs', (_req, res) => {
  res.json({
    title: 'TrustDoc API',
    version: '2.0.0',
    endpoints: [
      'GET  /api/health - Health check',
      'CRUD /api/documents - Documentation',
      'CRUD /api/templates - Templates (+ /seed, /:id/use)',
      'CRUD /api/assets - Infrastructure inventory',
      'GET  /api/agent/skills - Agent capabilities',
      'POST /api/agent/run - Run an agent skill',
      'GET  /api/agent/findings - Agent findings',
      'POST /api/agent/findings/:id/apply - Apply remediation',
      'GET  /api/analytics - Workspace overview',
      'GET  /api/search - Global search',
    ],
  })
})

// Auth & tenants
app.use('/api/auth', authLimiter, authRouter)
app.use('/api/tenants', isDevMode ? devAuthenticate : authenticate, tenantsRouter)

// Core resources
app.use('/api/documents', documentsRouter)
app.use('/api/templates', templatesRouter)
app.use('/api/assets', assetsRouter)
app.use('/api/upload', uploadRouter)

// Agent, analytics & search
app.use('/api/agent', agentRouter)
app.use('/api/analytics', analyticsRouter)
app.use('/api/search', searchRouter)

// Collaboration & history
app.use('/api/comments', commentsRouter)
app.use('/api/audit', auditRouter)
app.use('/api/notifications', notificationsRouter)

// Error handling - must be last
app.use(notFoundHandler)
app.use(errorLogger)
app.use(errorHandler)

// Start server
const server = app.listen(PORT, () => {
  console.log(`TrustDoc API running on http://localhost:${PORT}`)
  console.log(`Dev mode: ${isDevMode}`)
})

server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`\nPort ${PORT} is already in use. Stop the other process or set PORT in .env.\n`)
    process.exit(1)
  } else {
    console.error('Server error:', error)
    process.exit(1)
  }
})

process.on('SIGTERM', () => {
  console.log('SIGTERM received: closing HTTP server')
  server.close(() => {
    console.log('HTTP server closed')
  })
})
