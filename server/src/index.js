// server/src/index.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import trackersRouter from './routes/trackers.js';
import './jobs/scheduler.js';

import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const staticDir = path.resolve(__dirname, '../public'); // we'll copy client build here

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (_, res) => res.json({ ok: true }));
app.use('/api/trackers', trackersRouter);

// serve React build
app.use(express.static(staticDir));
app.get('*', (req, res) => {
  res.sendFile(path.join(staticDir, 'index.html'));
});

const { MONGO_URI, PORT = 4000 } = process.env;

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`API on http://localhost:${PORT}`));
  })
  .catch(err => {
    console.error('MongoDB error:', err.message);
    process.exit(1);
  });
