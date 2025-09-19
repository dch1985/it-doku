import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Backend API is running!',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

app.get('/api/docs', (req, res) => {
  res.json({
    title: 'IT-Dokumentation API',
    version: '1.0.0',
    endpoints: [
      'GET /api/health - Health Check',
      'GET /api/docs - API Documentation'
    ]
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
  console.log(`API docs available at http://localhost:${PORT}/api/docs`);
});