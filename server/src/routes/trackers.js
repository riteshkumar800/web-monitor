import express from 'express';
import Tracker from '../models/Tracker.js';
import { runCheck } from '../services/checker.js';

const router = express.Router();

// list
router.get('/', async (req, res) => {
  const items = await Tracker.find().sort({ updatedAt: -1 });
  res.json(items);
});

// create
router.post('/', async (req, res) => {
  const { url, mode, selector, targetPrice, checkIntervalMins, notifyEmail, active } = req.body;
  if (!url || !mode) return res.status(400).json({ error: 'url and mode required' });
  const doc = await Tracker.create({
    url, mode, selector: selector || undefined,
    targetPrice: mode === 'price' ? Number(targetPrice) || undefined : undefined,
    checkIntervalMins: checkIntervalMins || 15,
    notifyEmail: notifyEmail || process.env.ALERT_TO || undefined,
    active: active !== false
  });
  res.status(201).json(doc);
});

// manual check
router.post('/:id/check', async (req, res) => {
  const t = await Tracker.findById(req.params.id);
  if (!t) return res.status(404).json({ error: 'not found' });
  const out = await runCheck(t);
  res.json(out);
});

// update
router.patch('/:id', async (req, res) => {
  const t = await Tracker.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!t) return res.status(404).json({ error: 'not found' });
  res.json(t);
});

// delete
router.delete('/:id', async (req, res) => {
  await Tracker.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

export default router;
