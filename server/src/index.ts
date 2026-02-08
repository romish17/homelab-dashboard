import express from 'express';
import cors from 'cors';
import { config } from './config';
import { migrate } from './migrate';
import authRoutes from './routes/auth';
import categoriesRoutes from './routes/categories';
import linksRoutes from './routes/links';

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api', linksRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

async function start() {
  // Run migrations on startup
  await migrate();

  app.listen(config.port, () => {
    console.log(`Backend running on port ${config.port}`);
  });
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
