import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import { LocalScanner } from './services/localScanner';

const app = express();
const PORT = process.env.PORT || 3001;
const scanner = new LocalScanner();

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
      'GET /api/docs - API Documentation',
      'POST /api/scan - Scan local directory for IT assets'
    ]
  });
});

// Local Scanner Endpoint
app.post('/api/scan', async (req, res) => {
  try {
    const {
      path,
      maxDepth = 3,
      includeExtensions,
      excludePatterns,
      includeStatistics = true
    } = req.body;

    if (!path) {
      return res.status(400).json({
        error: 'Path is required',
        message: 'Bitte gib einen Pfad zum Scannen an (z.B. C:\\Users\\...)',
      });
    }

    console.log(`Scanning directory: ${path}`);

    // Führe Scan durch
    const results = await scanner.scanDirectory(path, {
      maxDepth,
      includeExtensions,
      excludePatterns,
    });

    // Generiere Statistiken
    const statistics = includeStatistics ? scanner.generateStatistics(results) : null;

    res.json({
      success: true,
      path,
      scannedAt: new Date().toISOString(),
      results,
      statistics,
    });
  } catch (error) {
    console.error('Scan error:', error);
    res.status(500).json({
      error: 'Scan failed',
      message: error instanceof Error ? error.message : 'Unbekannter Fehler',
    });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
  console.log(`API docs available at http://localhost:${PORT}/api/docs`);
});