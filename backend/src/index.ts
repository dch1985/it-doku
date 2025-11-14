import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import chatRouter from './routes/chat.js';
import documentsRouter from './routes/documents.js'
import templatesRouter from './routes/templates.js'
import githubRouter from './routes/github.js';
import uploadRouter from './routes/upload.js';
import authRouter from './routes/auth.js';
import tenantsRouter from './routes/tenants.js';
import automationRouter from './routes/automation.js';
import complianceRouter from './routes/compliance.js';
import assistantRouter from './routes/assistant.js';
import analyticsRouter from './routes/analytics.js';
import searchRouter from './routes/search.js';
import knowledgeRouter from './routes/knowledge.js';
import {
  loggerMiddleware,
  errorLogger,
  errorHandler,
  notFoundHandler,
  apiLimiter,
  authLimiter,
  chatLimiter,
  uploadLimiter,
  authenticate
} from './middleware/index.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || process.env.WEBSITES_PORT || 8080

// Security & CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Request logging
app.use(loggerMiddleware);

// Rate limiting
app.use('/api/', apiLimiter);
app.use('/api/chat', chatLimiter);
app.use('/api/upload', uploadLimiter);

// Routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Backend API is running!',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    azureOpenAI: !!process.env.AZURE_OPENAI_KEY
  });
});

app.get('/api/docs', (req, res) => {
  res.json({
    title: 'IT-Dokumentation API',
    version: '1.0.0',
    endpoints: [
      'GET /api/health - Health Check',
      'GET /api/docs - API Documentation',
      'POST /api/chat - AI Chat Endpoint'
    ]
  });
});

// Auth Routes (before other routes)
app.use('/api/auth', authLimiter, authRouter);

// Tenant Routes (after auth, before tenant-specific routes)
app.use('/api/tenants', authenticate, tenantsRouter);

// Chat Route
app.use('/api/chat', chatRouter);

// Documents Routes
app.use('/api/documents', documentsRouter)

// Templates Routes
app.use('/api/templates', templatesRouter)

// GitHub Routes
app.use('/api/github', githubRouter)

// Upload Routes
app.use('/api/upload', uploadRouter)

// Analytics & Knowledge Routes
app.use('/api/analytics', analyticsRouter)
app.use('/api/search', searchRouter)

// AI & Automation Routes
app.use('/api/assistant', assistantRouter)
app.use('/api/automation', automationRouter)

// Compliance Routes
app.use('/api/compliance', complianceRouter)

// Knowledge Node Management
app.use('/api/knowledge', knowledgeRouter)

// Error handling - must be last
app.use(notFoundHandler);
app.use(errorLogger);
app.use(errorHandler);

// Start Server
const server = app.listen(PORT, () => {
  console.log('Backend server running on http://localhost:' + PORT);
  console.log('Azure OpenAI configured:', !!process.env.AZURE_OPENAI_KEY);
  console.log('Chat endpoint: http://localhost:' + PORT + '/api/chat');
});

// Handle server errors (e.g., port already in use)
server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`\n❌ Port ${PORT} is already in use!`);
    console.error('Please either:');
    console.error(`  1. Stop the process using port ${PORT}`);
    console.error('  2. Change PORT in .env file');
    console.error(`  3. Use a different port: PORT=3002 npm run dev\n`);
    process.exit(1);
  } else {
    console.error('Server error:', error);
    process.exit(1);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});