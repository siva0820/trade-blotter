# Trade Blotter

A real-time trading blotter UI — a single-screen dashboard for monitoring and
acting on trades as they move through their lifecycle (pending → partial fill
→ executed/cancelled), with live updates streamed to the grid as they happen.

Built as a frontend-only project against mock data and a simulated live feed,
structured so a real backend can be dropped in without touching the UI layer.

## Tech stack

- **React 19** + **Vite** — app shell and dev/build tooling
- **MUI v6** (`@mui/material`, Emotion) — layout, dialogs, form controls
- **AG Grid Community** (`ag-grid-community` / `ag-grid-react`) — the trade
  table: sorting, filtering, custom cell renderers, cell-level flash on
  update
- **Redux Toolkit** + **react-redux** — single source of truth for trade
  state, updated by both the initial fetch and the live stream
- **React Router** — routing shell (currently a single blotter route)
- **Axios** — HTTP client, wired up and ready for a real backend

## What's in the UI

- **Trade Blotter grid** (`src/features/trades/TradeBlotter.jsx`) — compact
  AG Grid table of trades with a filled-quantity progress bar, colored
  side/status badges, a computed notional column, a trader filter dropdown,
  and per-row **Execute / Cancel / Edit** actions (enabled only while a trade
  is `PENDING`).
- **Detail panel** (`TradeDetailPanel.jsx`) — shows the full detail of
  whichever trade is selected in the grid, side-by-side with it (no
  navigation away from the blotter).
- Rows flash automatically when their data changes, whether that change came
  from the live stream or from clicking Execute/Cancel/Edit.

## How the live updates (SSE) work

`src/features/trades/sseService.js` exports `connectTradeStream(dispatch)`,
called once from `App.jsx` on mount.

- **In production**, it opens a real `EventSource` against
  `{API base URL}/trades/stream` and listens for four named server-sent
  events — `TRADE_NEW`, `TRADE_PARTIAL_FILL`, `TRADE_EXECUTED`,
  `TRADE_CANCELLED` — each mapped straight to a Redux Toolkit action
  (`tradeAdded`, `tradePartialFill`, `tradeExecuted`, `tradeCancelled` in
  `tradesSlice.js`) and dispatched with the event's parsed JSON payload.
- **In local dev**, since there's no backend yet, it falls back to a mock
  generator that emits the same four event types on a `setInterval`,
  simulating a trade's lifecycle (new order → one or more partial fills →
  executed or cancelled) so the live-update behavior is visible without a
  server.
- Either way, `connectTradeStream` returns a cleanup function that closes the
  connection / clears the interval, which `App.jsx` calls on unmount.

The Redux slice, grid, and detail panel don't know or care which mode is
active — they just react to the same actions.

## Backend status

There is no backend yet. All trade data is mock data
(`src/features/trades/mockTrades.js`), and `src/api/client.js` /
`src/api/tradesApi.js` are pre-wired (Axios instance + `fetchTradesFromApi`)
for a planned **Java Spring Boot** backend. Once that exists, swapping from
mock data to real data is a one-line change in `tradesSlice.js`
(`fetchTrades` thunk), and `sseService.js`'s production branch already
targets `/trades/stream` on that same API base URL.

## Running locally

```bash
npm install
npm run dev       # starts the Vite dev server (mock data + simulated SSE)
```

Other scripts:

```bash
npm run build     # production build to dist/
npm run preview   # preview the production build locally
npm run lint      # oxlint
```

## Deployment

Configured for [Vercel](https://vercel.com) via `vercel.json`: builds with
`npm run build`, serves `dist/`, and rewrites all routes to `index.html` so
client-side routing works on refresh/direct links.
