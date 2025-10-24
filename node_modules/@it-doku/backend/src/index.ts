import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import chatRouter from './routes/chat.js';
import documentsRouter from './routes/documents.js'
import templatesRouter from './routes/templates.js'
import githubRouter from './routes/github.js';
import uploadRouter from './routes/upload.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Logging
app.use((req, res, next) => {
  console.log('[' + new Date().toISOString() + '] ' + req.method + ' ' + req.url);
  next();
});

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

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.url
  });
});

// Start Server
app.listen(PORT, () => {
  console.log('Backend server running on http://localhost:' + PORT);
  console.log('Azure OpenAI configured:', !!process.env.AZURE_OPENAI_KEY);
  console.log('Chat endpoint: http://localhost:' + PORT + '/api/chat');
});