import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import documentRoutes from './routes/document.routes';
import analyzeRouter from './routes/analyze';
import chatRouter from './routes/chat';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString() 
  });
});

app.use('/api/documents', documentRoutes);
app.use('/api', analyzeRouter);
app.use('/api', chatRouter);

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
  console.log('AI Service:', process.env.AZURE_OPENAI_API_KEY ? '✅ Configured' : '❌ Not configured');
  console.log('Deployment:', process.env.AZURE_OPENAI_DEPLOYMENT);
});