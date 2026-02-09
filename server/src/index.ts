import express from 'express';
import path from 'path';
import cors from 'cors';
import { config } from './config';
import { migrate } from './migrate';
import authRoutes from './routes/auth';
import categoriesRoutes from './routes/categories';
import linksRoutes from './routes/links';
import faviconRoutes from './routes/favicon';
import profileRoutes from './routes/profile';
import feedsRoutes from './routes/feeds';
import subredditsRoutes from './routes/subreddits';

const app = express();

app.use(cors());
app.use(express.json());

// Static files (avatars)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Routes (favicon before auth-protected routes)
app.use('/api/favicon', faviconRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/feeds', feedsRoutes);
app.use('/api/subreddits', subredditsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api', linksRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

async function start() {
  await migrate();
  app.listen(config.port, () => {
    console.log(`Backend running on port ${config.port}`);
  });
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
