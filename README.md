# Trade Blotter

A real-time trading blotter UI — a single-screen dashboard for monitoring and
acting on trades as they move through their lifecycle (partial fill →
executed/cancelled), with live updates streamed to the grid as they happen,
wired to a real Spring Boot backend (with a mock fallback if it's down).

## Tech stack

- **React 19** + **Vite** — app shell and dev/build tooling (code-split:
  the blotter route is lazy-loaded with `React.lazy` + `Suspense`, and
  `ag-grid`/`@mui/material`/`@reduxjs/toolkit` are split into separate
  vendor chunks)
- **MUI v6** (`@mui/material`, Emotion) — layout, dialogs, form controls,
  loading/error states
- **AG Grid Community** (`ag-grid-community` / `ag-grid-react`) — the trade
  table: sorting, filtering, custom cell renderers, cell-level flash on
  update
- **Redux Toolkit** + **react-redux** — single source of truth for trade
  state, updated by the initial fetch, user actions, and the live stream
- **React Router** — routing shell (currently a single blotter route)
- **Axios** — HTTP client (`src/services/tradeService.js`)

## What's in the UI

- **Trade Blotter grid** (`src/features/trades/TradeBlotter.jsx`) — compact
  AG Grid table of trades with a filled-quantity progress bar, colored
  side/status badges, a computed notional column, a trader filter dropdown,
  and per-row **Execute / Cancel / Edit** actions (disabled once a trade is
  in a terminal state — `EXECUTED` or `CANCELLED`). Shows a `CircularProgress`
  while the initial fetch is in flight and an error alert if it fails.
- **Detail panel** (`TradeDetailPanel.jsx`) — trade summary for whichever row
  is selected, shown side-by-side with the grid (no navigation away from the
  blotter).
- **Allocation panel** (`AllocationPanel.jsx`) — fetches and shows the
  fund-level allocations for the selected trade, with its own loading/error
  state.
- Rows flash automatically when their data changes, whether that change came
  from the live stream or from clicking Execute/Cancel/Edit.

## Backend

Wired to a real Spring Boot API. `src/services/tradeService.js` is the one
place all REST calls go through:

| Function | Request |
|---|---|
| `fetchTrades(trader)` | `GET /api/trades` (adds `?trader=` unless omitted/`ALL`) |
| `fetchAllocations(tradeId)` | `GET /api/trades/:id/allocations` |
| `executeTrade(id)` | `POST /api/trades/:id/execute` |
| `cancelTrade(id)` | `POST /api/trades/:id/cancel` |
| `updateTrade(id, data)` | `PATCH /api/trades/:id` |

The trade shape returned by the API: `{ id, symbol, side, qty, filledQty,
price, status, trader, orderType, createdAt, updatedAt, allocations: [...] }`
— status is one of `PARTIAL` / `EXECUTED` / `CANCELLED` (and `PENDING` for
newly-created orders). Execute/cancel/update all return the full, updated
trade object, which is upserted straight into Redux state.

**Known gap:** `GET /api/trades/:id/allocations` currently 404s against the
running backend — allocations are only present embedded in each trade from
`GET /api/trades`. `AllocationPanel` calls the dedicated endpoint as designed
(and correctly shows its error state against the current backend); either add
that route server-side, or point `fetchAllocations` at the embedded
`trade.allocations` array instead.

## How the live updates (SSE) work

`src/features/trades/sseService.js` exports `connectTradeStream(dispatch)`,
called once from `App.jsx` on mount.

- It always opens a real `EventSource` first, against
  `${VITE_API_URL}/api/trades/stream?clientId=<crypto.randomUUID()>`, and logs
  `[sseService] connected to real backend` once the server confirms the
  connection.
- It listens for `TRADE_NEW`, `TRADE_PARTIAL_FILL`, `TRADE_EXECUTED`,
  `TRADE_CANCELLED`. Each event's data is `{ eventType, trade, timestamp }`;
  the nested `trade` (the full, current trade object) is dispatched straight
  to the matching Redux Toolkit action (`tradeAdded`, `tradePartialFill`,
  `tradeExecuted`, `tradeCancelled` in `tradesSlice.js`), which just upserts
  it into state by `id`.
- **If the real connection errors** (backend down/unreachable), it logs
  `[sseService] using mock feed` and falls back to a `setInterval` generator
  that simulates the same event lifecycle (new order → partial fill(s) →
  executed/cancelled) with synthetic trades, so the live-update behavior is
  still visible without a server.
- Either way, `connectTradeStream` returns a cleanup function that closes the
  connection / clears the interval, which `App.jsx` calls on unmount.

## Environment variables

| File | Purpose |
|---|---|
| `.env.example` | Template, committed |
| `.env.development` | `VITE_API_URL=http://localhost:8080` — used by `npm run dev` |
| `.env.production` | `VITE_API_URL=https://your-spring-boot-api-url.com` — used by `npm run build`; replace with your real deployed API URL |

`VITE_API_URL` is the backend's host only (no `/api` suffix) — every request
path already includes `/api/...` explicitly.

## Running locally

```bash
npm install
npm run dev       # starts the Vite dev server against VITE_API_URL from .env.development
```

Requires the Spring Boot backend running (defaults to `http://localhost:8080`
in dev) — without it, the grid's initial fetch will show an error, and the
live feed will fall back to the mock generator after the first SSE error.

Other scripts:

```bash
npm run build     # production build to dist/ (uses .env.production)
npm run preview   # preview the production build locally
npm run lint      # oxlint
```

## Deployment

Configured for [Vercel](https://vercel.com) via `vercel.json`: builds with
`npm run build`, serves `dist/`, and rewrites all routes to `index.html` so
client-side routing works on refresh/direct links. Set `VITE_API_URL` in
`.env.production` (or as a Vercel project env var) to your deployed backend
before building.
