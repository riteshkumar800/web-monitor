import Tracker from '../models/Tracker.js';
import { getPageHtml, extractPrice, extractContentHash } from './scrape.js';
import { sendAlert } from './notify.js';

export async function runCheck(tracker) {
  const { url, mode, selector, targetPrice } = tracker;
  let html, via;
  try {
    const got = await getPageHtml(url, selector);
    html = got.html; via = got.via;
  } catch (e) {
    tracker.error = `fetch-failed: ${e.message}`;
    tracker.lastCheckedAt = new Date();
    await tracker.save();
    return { ok: false, error: tracker.error };
  }

  let newVal, preview;
  if (mode === 'price') {
    const out = extractPrice(html, selector, url);
    newVal = out.value; preview = out.preview;
    if (newVal == null) {
      tracker.error = 'price-not-found';
      tracker.lastCheckedAt = new Date();
      tracker.usedBrowserLast = via;
      await tracker.save();
      return { ok: false, error: tracker.error };
    }
  } else {
    const out = extractContentHash(html, selector);
    newVal = out.value; preview = out.preview;
  }

  const changed = tracker.lastValue !== String(newVal);
  tracker.error = undefined;
  tracker.lastValue = String(newVal);
  tracker.lastCheckedAt = new Date();
  tracker.usedBrowserLast = via;
  if (changed) {
    tracker.history.push({ value: String(newVal), note: `${mode}-changed` });
    // Notify rules
    let shouldNotify = true;
    let subject = `[Monitor] ${mode} changed`;
    let text = `URL: ${url}\nSelector: ${selector || '(none)'}\nNew: ${newVal}\nPreview: ${preview}`;
    if (mode === 'price' && typeof targetPrice === 'number') {
      shouldNotify = Number(newVal) <= targetPrice;
      subject = `[Monitor] Price ${shouldNotify ? 'reached target' : 'changed'}`;
    }
    if (shouldNotify) {
      await sendAlert({ subject, text, html: `<pre>${text}</pre>` });
    }
  }
  await tracker.save();
  return { ok: true, changed, newVal, via };
}
