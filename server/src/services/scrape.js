import axios from 'axios';
import * as cheerio from 'cheerio';
import crypto from 'crypto';

let browser; // lazy init a single Chromium
async function getBrowser() {
  if (!browser) {
    const { chromium } = await import('playwright');
    browser = await chromium.launch({ headless: true });
  }
  return browser;
}

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/119.0 Safari/537.36';

function isAmazon(url) {
  try {
    const u = new URL(url);
    return /amazon\./i.test(u.hostname);
  } catch {
    return false;
  }
}

async function fetchHtmlHttp(url) {
  const res = await axios.get(url, {
    headers: { 'User-Agent': UA, 'Accept-Language': 'en-IN,en;q=0.9' },
    timeout: 20000,
  });
  return res.data;
}

async function fetchHtmlBrowser(url, selectorHint) {
  const b = await getBrowser();
  const page = await b.newPage();
  await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-IN,en;q=0.9' });

  // Amazon sometimes needs a little idle time after DOMContentLoaded
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

  // If we know a selector, wait for it; otherwise use good defaults for Amazon
  try {
    if (selectorHint) {
      await page.waitForSelector(selectorHint, { timeout: 10000 });
    } else if (isAmazon(url)) {
      const amazonPriceCandidates = [
        '#corePrice_feature_div .a-price .a-offscreen',
        '#apex_desktop .a-price .a-offscreen',
        '#tp_price_block_total_price_ww',
        '#priceblock_dealprice',
        '#priceblock_ourprice',
        '.a-price .a-offscreen',
      ];
      await page.waitForSelector(amazonPriceCandidates.join(', '), { timeout: 10000 });
    } else {
      await page.waitForLoadState('networkidle', { timeout: 5000 });
    }
  } catch {
    // continue; we’ll just grab whatever HTML is there
  }

  const html = await page.content();
  await page.close();
  return html;
}

function cheerioText(html, selector) {
  const $ = cheerio.load(html);
  if (!selector) return $('body').text();
  return $(selector).text();
}

function cleanText(str = '') {
  // normalize non-breaking spaces etc.
  return str.replace(/\u00A0|\u202F|\u2009/g, ' ').replace(/\s+/g, ' ').trim();
}

// Robust price parser: handles ₹, $, €, non-breaking spaces, grouped digits.
function parsePriceFromText(text) {
  if (!text) return null;
  const t = text
    .replace(/\u00A0|\u202F|\u2009/g, ' ') // non-breaking spaces to normal space
    .replace(/[^\d,.\s₹$€]/g, ''); // keep digits, separators, and currency symbols

  // Try currency + amount first (₹ 19,999.00)
  let m = t.match(/(?:₹|\$|€)\s*([\d\s.,]+)/);
  if (!m) {
    // Try plain grouped number (19,999.00)
    m = t.match(/(\d{1,3}(?:[,\s]\d{2,3})+(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)/);
    if (!m) return null;
  }
  // remove spaces and commas used as thousands separators
  const numeric = m[1].replace(/[,\s]/g, '');
  const n = Number(numeric);
  return Number.isFinite(n) ? n : null;
}

export async function getPageHtml(url, selectorHint) {
  // Try HTTP first (fast); fallback to browser for dynamic pages
  try {
    const html = await fetchHtmlHttp(url);
    return { html, via: 'http' };
  } catch (e) {
    if (process.env.USE_PLAYWRIGHT === 'true') {
      const html = await fetchHtmlBrowser(url, selectorHint);
      return { html, via: 'browser' };
    }
    throw e;
  }
}

export function extractContentHash(html, selector) {
  const txt = cleanText(cheerioText(html, selector));
  const hash = crypto.createHash('sha256').update(txt).digest('hex').slice(0, 16);
  return { value: hash, preview: txt.slice(0, 160) };
}

function extractPriceFrom(html, selector) {
  const txt = cleanText(cheerioText(html, selector));
  const price = parsePriceFromText(txt);
  return { value: price == null ? null : String(price), preview: txt.slice(0, 160) };
}

export function extractContentText(html, selector) {
  // Reuse cheerioText + basic cleanup
  const txt = cheerioText(html, selector);
  return cleanText(txt);
}


export function extractPrice(html, selector, url = '') {
  // 1) if a selector is provided, try it first
  if (selector) {
    const out = extractPriceFrom(html, selector);
    if (out.value != null) return out;
  }

  // 2) Try Amazon-specific fallbacks
  if (isAmazon(url)) {
    const fallbacks = [
      '#corePrice_feature_div .a-price .a-offscreen',
      '#apex_desktop .a-price .a-offscreen',
      '#tp_price_block_total_price_ww',
      '#priceblock_dealprice',
      '#priceblock_ourprice',
      '.a-price .a-offscreen',
    ];
    for (const sel of fallbacks) {
      const out = extractPriceFrom(html, sel);
      if (out.value != null) return out;
    }
  }

  // 3) Generic fallback — scan whole body text
  const out = extractPriceFrom(html, null);
  return out;
}
