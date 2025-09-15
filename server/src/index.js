import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import trackersRouter from './routes/trackers.js';
import './jobs/scheduler.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const staticDir = path.resolve(__dirname, '../public');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// API routes
app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/trackers', trackersRouter);

// Static + SPA fallback (Express v5-safe)
app.use(express.static(staticDir));
app.get(/^(?!\/api).*/, (_req, res) => {
  res.sendFile(path.join(staticDir, 'index.html'));
});

// Boot
const { MONGO_URI, PORT } = process.env;
const port = Number(PORT) || 4000;

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(port, () => console.log(`API on http://localhost:${port}`));
  })
  .catch((err) => {
    console.error('MongoDB error:', err.message);
    process.exit(1);
  });
