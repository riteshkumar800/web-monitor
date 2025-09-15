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

How Price Parsing Works (short)

Flipkart: prefer JSON-LD offers.price; fallback to price-block DOM; ignore MRP/discount/fees.

Amazon: known price selectors first; fallback to generic parser.

All parsers enforce a sensible range and skip discount/fee text.

If a page misreads, supply a Selector when adding the tracker.

Per-Browser Isolation

Client creates a random tenant id in localStorage and sends it via x-tenant on every request.

Server stores/queries by tenantId.

New visitors always see an empty list.

Troubleshooting

“Cannot GET /”
You didn’t copy the client build:

npm --prefix client run build
rm -rf server/public && mkdir -p server/public
cp -r client/dist/* server/public/
npm --prefix server start


Express v5 catch-all route error
Use this:

app.use(express.static(staticDir));
app.get('/*', (req, res) => res.sendFile(path.join(staticDir, 'index.html')));


Playwright issues
Set USE_PLAYWRIGHT=false (default) or install Chromium:

npx playwright install chromium


Mongo connection fails
Check MONGO_URI credentials, DB name, and Atlas IP allow-list.

Minimal API Examples
# list (sample tenant)
curl -H "x-tenant: t_demo" http://localhost:4000/api/trackers

# create
curl -X POST -H "Content-Type: application/json" -H "x-tenant: t_demo" \
  -d '{"url":"https://www.flipkart.com/...","mode":"price","checkIntervalMins":15}' \
  http://localhost:4000/api/trackers

# check one
curl -X POST -H "x-tenant: t_demo" http://localhost:4000/api/trackers/<id>/check

# delete one / all
curl -X DELETE -H "x-tenant: t_demo" http://localhost:4000/api/trackers/<id>
curl -X DELETE -H "x-tenant: t_demo" http://localhost:4000/api/trackers

Notes

Use respectfully (rate-limit if deploying publicly). For production, consider auth, caching, queues, retry/backoff, and security hardening.

License: MIT — PRs welcome!
