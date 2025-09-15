Web Monitor & Price Tracker (MERN)

Track price drops or content changes on any web page.
Supports price mode (Amazon, Flipkart, etc.) and content mode (summarizes pages like LinkedIn, news, blogs).
Includes a simple UI, periodic checks, notifications-ready hooks, and per-browser isolation so every visitor sees a fresh, private watchlist.

Repo: https://github.com/riteshkumar800/web-monitor

✨ Features

MERN stack: MongoDB + Express + React (Vite) + Node

Two modes

Price – smart parsers for Amazon & Flipkart (selling price, not MRP/discount/fees)

Content – change detection + quick summary in a modal

Per-browser isolation – each browser/tab gets its own tenant, no old rows on first visit

Scheduler – background cron job triggers checks based on your interval

Single port – UI and API served from http://localhost:4000

🧪 Demo (How it works)

Paste a product/article URL → choose price or content → set interval → Add

Click Check to fetch now (or let the scheduler run)

For price, you’ll see the fetched price; for content, click View to open the summary modal

Click Reset to clear all rows just for your browser

🚀QUICK START (Local)
# Prerequisites

Node.js ≥ 18 (v22+ works great)

npm ≥ 9

# MongoDB connection string

Atlas (recommended): https://www.mongodb.com/atlas/database
 → create cluster → copy connection string

Or local MongoDB (e.g. mongodb://127.0.0.1:27017/webmonitor)

# Clone & install
git clone https://github.com/riteshkumar800/web-monitor.git
cd web-monitor

# install dependencies
npm --prefix server ci
npm --prefix client ci

#Configure environment (server/.env)

Create a file server/.env with:

# Mongo connection string (Atlas or local)
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>/<db>?retryWrites=true&w=majority

# Optional: enable Playwright (Chromium) fallback for dynamic pages
# Leave false if you don't need it.
USE_PLAYWRIGHT=false

# Server port
PORT=4000


If you set USE_PLAYWRIGHT=true, install Chromium once:

npx playwright install chromium

Build the UI & start the server
# build the React app
npm --prefix client run build

# copy client build into server/public
rm -rf server/public && mkdir -p server/public
cp -r client/dist/* server/public/

# run the API + static UI server
npm --prefix server start


Now open: http://localhost:4000

🧭 Usage Tips

Selectors (optional):
If a site layout is tricky, specify a CSS selector when adding a tracker:

Flipkart selling price: ._30jeq3 (we auto-handle most cases, incl. JSON-LD)

Amazon price: #corePrice_feature_div .a-price .a-offscreen

Intervals: the cron job runs every minute and respects your selected interval

Reset: clears only the current browser’s items; new visitors always see an empty table

🗂️ Project Structure
web-monitor/
├─ client/                # React (Vite)
│  ├─ src/
│  │  ├─ api.js          # axios instance (adds x-tenant header)
│  │  ├─ App.jsx         # UI: form, table, modal
│  │  └─ ...
│  └─ public/            # favicon/logo
├─ server/                # Node + Express
│  ├─ src/
│  │  ├─ index.js        # express app, serve client build, connect Mongo
│  │  ├─ routes/trackers.js
│  │  ├─ jobs/scheduler.js
│  │  ├─ models/Tracker.js
│  │  └─ services/
│  │     ├─ checker.js   # orchestrates fetch/parse/update
│  │     ├─ scrape.js    # HTTP/Playwright fetch + price/content extractors
│  │     └─ notify.js    # email/SMS hooks (optional)
│  ├─ public/            # <-- built client copied here
│  └─ .env
└─ README.md

🔧 Scripts

Client

npm --prefix client run dev     # vite dev server (5173)
npm --prefix client run build   # production build


Server

npm --prefix server run dev     # nodemon (auto-reload API)
npm --prefix server start       # node src/index.js


One-liner (build + run)

npm --prefix client run build && \
rm -rf server/public && mkdir -p server/public && \
cp -r client/dist/* server/public/ && \
npm --prefix server start

⚙️ Environment Variables (server/.env)
Name	Required	Default	Description
MONGO_URI	✅	—	MongoDB Atlas or local URI
PORT	❌	4000	Server port
USE_PLAYWRIGHT	❌	false	true enables Chromium fallback for dynamic UIs
💡 How Price Parsing Works

Amazon: Tries known price nodes first; falls back to a generic parser.

Flipkart:

Reads JSON-LD (offers.price) — most accurate selling price

Falls back to DOM (._25b18c ._30jeq3, ._30jeq3, ._16Jk6d)

Ignores MRP/strike-through, discount text, and tiny fee amounts

Enforces sensible price range; picks correct value

If a page misreads, add a Selector in the UI for that site.

🔐 Per-Browser Isolation (Private Lists)

Client generates a random tenant id and sends it in x-tenant header (stored in localStorage)

Server stores and filters trackers by tenantId

Result: a new visitor always sees an empty table

🆘 Troubleshooting

“Cannot GET /”
You ran the server without copying the client build. Do:

npm --prefix client run build
rm -rf server/public && mkdir -p server/public
cp -r client/dist/* server/public/
npm --prefix server start


Path error like Missing parameter name at index
Use this catch-all with Express v5:

app.use(express.static(staticDir));
app.get('/*', (req, res) => {
  res.sendFile(path.join(staticDir, 'index.html'));
});


Playwright not installed / timeouts
Set USE_PLAYWRIGHT=false (default), or install Chromium:

npx playwright install chromium


MongoDB connection fails
Double-check MONGO_URI (user/pass, database name), and IP allow-list for Atlas.

🧭 Minimal API Examples (optional)

List (uses a sample tenant id):

curl -H "x-tenant: t_demo" http://localhost:4000/api/trackers


Create:

curl -X POST -H "Content-Type: application/json" \
     -H "x-tenant: t_demo" \
     -d '{"url":"https://www.flipkart.com/...","mode":"price","checkIntervalMins":15}' \
     http://localhost:4000/api/trackers


Check one:

curl -X POST -H "x-tenant: t_demo" \
     http://localhost:4000/api/trackers/<id>/check


Delete one / all:

curl -X DELETE -H "x-tenant: t_demo" http://localhost:4000/api/trackers/<id>
curl -X DELETE -H "x-tenant: t_demo" http://localhost:4000/api/trackers

✅ Ethics & Notes

Scrape responsibly (low frequency, respect robots/TOS)

For public deployment consider: rate limiting, caching, queues, auth, security hardening

📄 License

MIT — PRs welcome! If you add site fallbacks or graphs/alerts, open an issue or pull request.
