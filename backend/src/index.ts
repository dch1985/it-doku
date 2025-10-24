import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import documentRoutes from './routes/document.routes';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/documents', documentRoutes);

app.listen(PORT, () => {
  console.log('Backend running on port ' + PORT);
  console.log('Frontend URL: http://localhost:5173');
});
