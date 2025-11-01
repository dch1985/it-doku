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
import analyticsRouter from './routes/analytics.js';
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
import { devAuthenticate } from './middleware/auth.dev.middleware.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || process.env.WEBSITES_PORT || 8080

// Security & CORS
// Allow multiple origins for development (Vite can use different ports)
const allowedOrigins = process.env.FRONTEND_URL 
  ? [process.env.FRONTEND_URL]
  : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // In development, log the origin for debugging
      if (process.env.NODE_ENV === 'development') {
        console.log(`[CORS] Blocked origin: ${origin}. Allowed origins: ${allowedOrigins.join(', ')}`);
      }
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID', 'X-Tenant-Slug'],
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
// Apply rate limiter to auth routes except dev-login
app.use('/api/auth', (req, res, next) => {
  // Skip rate limiting for dev-login if dev auth is enabled
  const isDevLogin = req.path === '/dev-login' || req.path.endsWith('/dev-login');
  const isDevMode = process.env.NODE_ENV === 'development' || process.env.DEV_AUTH_ENABLED === 'true';
  
  if (isDevLogin && isDevMode) {
    console.log('[Auth] Skipping rate limiter for dev-login (dev mode enabled)');
    return next();
  }
  // Apply rate limiter for other auth routes
  return authLimiter(req, res, next);
});
app.use('/api/auth', authRouter);

// Development Mode: Use dev authentication if enabled
// Works if NODE_ENV=development OR DEV_AUTH_ENABLED=true
const useDevAuth = process.env.NODE_ENV === 'development' || process.env.DEV_AUTH_ENABLED === 'true';
if (useDevAuth) {
  console.log('⚠️  Development Auth Mode ENABLED - Using mock authentication');
  // Apply dev auth to all authenticated routes
  app.use('/api/tenants', devAuthenticate, tenantsRouter);
  app.use('/api/documents', devAuthenticate, documentsRouter);
  app.use('/api/templates', devAuthenticate, templatesRouter);
  app.use('/api/analytics', devAuthenticate, analyticsRouter);
  app.use('/api/github', devAuthenticate, githubRouter);
  app.use('/api/upload', devAuthenticate, uploadRouter);
  app.use('/api/chat', devAuthenticate, chatRouter);
} else {
  // Production: Use real Azure AD authentication
  app.use('/api/tenants', authenticate, tenantsRouter);
  app.use('/api/documents', authenticate, documentsRouter);
  app.use('/api/templates', authenticate, templatesRouter);
  app.use('/api/analytics', authenticate, analyticsRouter);
  app.use('/api/github', authenticate, githubRouter);
  app.use('/api/upload', authenticate, uploadRouter);
  app.use('/api/chat', authenticate, chatRouter);
}

// Routes are applied above in dev/prod mode blocks
// (Routes are conditionally applied based on dev mode above)

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