import cron from 'node-cron';
import dayjs from 'dayjs';
import Tracker from '../models/Tracker.js';
import { runCheck } from '../services/checker.js';

async function tick() {
  const all = await Tracker.find({ active: true });
  for (const t of all) {
    const due = !t.lastCheckedAt ||
      dayjs().diff(dayjs(t.lastCheckedAt), 'minute') >= (t.checkIntervalMins || 15);
    if (!due) continue;
    try {
      const out = await runCheck(t);
      const tag = out.ok ? (out.changed ? 'CHANGED' : 'ok') : 'error';
      console.log(`[cron] ${tag} ${t.mode} → ${t.url} via:${out.via ?? '-'} val:${out.newVal ?? '-'} err:${out.error ?? '-'}`);
    } catch (e) {
      console.error('[cron] runCheck error', e.message);
    }
  }
}

// every minute
cron.schedule('* * * * *', () => {
  tick().catch(err => console.error('tick failed', err.message));
});
