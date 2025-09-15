Web Monitor & Price Tracker (MERN)

Track prices (Amazon, Flipkart, etc.) or content changes (news, blogs, LinkedIn) with a simple UI.
Includes a scheduler, smart parsers, and per-browser isolation so every visitor gets a fresh watchlist.

Repo: https://github.com/riteshkumar800/web-monitor

Features

MERN: MongoDB · Express · React (Vite) · Node

Modes

Price – selling price (not MRP/fees); Amazon & Flipkart tuned (JSON-LD + DOM)

Content – change detection + “View” summary in a modal

Per-browser isolation – each browser/tab has its own watchlist

Scheduler – periodic checks per item

Single port – UI + API served from http://localhost:4000

Quick Start
1) Requirements

Node.js ≥ 18 (v22+ works great)

npm ≥ 9

MongoDB connection string

Atlas (recommended), or local Mongo (e.g. mongodb://127.0.0.1:27017/webmonitor)

2) Install
git clone https://github.com/riteshkumar800/web-monitor.git
cd web-monitor
npm --prefix server ci
npm --prefix client ci

3) Configure server/.env
MONGO_URI=mongodb+srv://<user>:<pass>@<cluster>/<db>?retryWrites=true&w=majority
USE_PLAYWRIGHT=false   # set true if you want headless Chromium fallback
PORT=4000


If you set USE_PLAYWRIGHT=true, install Chromium once:

npx playwright install chromium

4) Build UI & run server
npm --prefix client run build
rm -rf server/public && mkdir -p server/public
cp -r client/dist/* server/public/
npm --prefix server start


Open http://localhost:4000
.

How to Use

Paste a URL

Choose Mode: price or content

(Optional) add Selector to target a specific element

(Optional, price) set Target Price

Set the Interval (mins) → Add

Click Check to fetch immediately (scheduler also runs in background)

For content items, click View to open the summary modal

Use Reset to clear rows for this browser only

Selector tips (optional):

Flipkart price: ._30jeq3 (auto-handled in most cases via JSON-LD)

Amazon price: #corePrice_feature_div .a-price .a-offscreen

Scripts

Client

npm --prefix client run dev
npm --prefix client run build


Server

npm --prefix server run dev   # nodemon
npm --prefix server start     # node src/index.js


Build + serve (one-liner)

npm --prefix client run build && \
rm -rf server/public && mkdir -p server/public && \
cp -r client/dist/* server/public/ && \
npm --prefix server start

Project Structure
web-monitor/
├─ client/                     # React (Vite)
│  ├─ src/
│  │  ├─ api.js               # axios; sends x-tenant header
│  │  ├─ App.jsx              # UI (form, table, modal)
│  │  └─ ...
│  └─ public/                 # favicon/logo
├─ server/                     # Node + Express
│  ├─ src/
│  │  ├─ index.js             # serve client build + API, connect Mongo
│  │  ├─ routes/trackers.js
│  │  ├─ jobs/scheduler.js
│  │  ├─ models/Tracker.js
│  │  └─ services/
│  │     ├─ checker.js        # orchestrates fetch/parse/update
│  │     ├─ scrape.js         # HTTP/Playwright + price/content extractors
│  │     └─ notify.js         # (hooks ready, optional)
│  ├─ public/                 # built client copied here
│  └─ .env


