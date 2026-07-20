import { apiClient } from '../../services/tradeService'
import {
  tradeAdded,
  tradePartialFill,
  tradeExecuted,
  tradeCancelled,
  connectionStatusChanged,
} from './tradesSlice'

const STREAM_PATH = '/api/trades/stream'

// Backoff schedule for reconnecting to the real backend: 5s, 10s, 20s, 40s, then
// capped at 60s for every attempt after that.
const RETRY_DELAYS_MS = [5000, 10000, 20000, 40000, 60000]

const ACTION_FOR_EVENT = {
  TRADE_NEW: tradeAdded,
  TRADE_PARTIAL_FILL: tradePartialFill,
  TRADE_EXECUTED: tradeExecuted,
  TRADE_CANCELLED: tradeCancelled,
}

const MOCK_SYMBOLS = ['AAPL', 'MSFT', 'TSLA', 'NVDA', 'AMZN', 'GOOGL', 'META', 'AMD', 'NFLX', 'JPM']
const MOCK_TRADERS = ['jsmith', 'kwong', 'mrivera', 'achen', 'tokafor']
const MOCK_ORDER_TYPES = ['MARKET', 'LIMIT']

const randomOf = (list) => list[Math.floor(Math.random() * list.length)]
const nowIso = () => new Date().toISOString()

let mockIdCounter = 1000

// Visible placeholder feed, only used when there's no backend URL configured at
// all (local dev with no VITE_API_URL). Every trade it produces is flagged
// `isMock: true` so the UI can make clear the data isn't real.
function connectMockTradeStream(dispatch) {
  const openTrades = new Map()

  const interval = setInterval(() => {
    const openIds = [...openTrades.keys()]

    if (openIds.length === 0 || Math.random() < 0.4) {
      const qty = (Math.floor(Math.random() * 20) + 1) * 25
      const trade = {
        id: mockIdCounter++,
        symbol: randomOf(MOCK_SYMBOLS),
        side: Math.random() < 0.5 ? 'BUY' : 'SELL',
        qty,
        filledQty: 0,
        price: Number((100 + Math.random() * 500).toFixed(2)),
        status: 'PENDING',
        trader: randomOf(MOCK_TRADERS),
        orderType: randomOf(MOCK_ORDER_TYPES),
        createdAt: nowIso(),
        updatedAt: nowIso(),
        allocations: [],
        isMock: true,
      }
      openTrades.set(trade.id, trade)
      dispatch(tradeAdded(trade))
      return
    }

    const id = randomOf(openIds)
    const trade = openTrades.get(id)

    if (Math.random() < 0.15) {
      const updated = { ...trade, status: 'CANCELLED', updatedAt: nowIso() }
      openTrades.delete(id)
      dispatch(tradeCancelled(updated))
      return
    }

    const increment = Math.max(1, Math.round(trade.qty * (0.2 + Math.random() * 0.4)))
    const filledQty = Math.min(trade.qty, trade.filledQty + increment)
    const price = Number((100 + Math.random() * 500).toFixed(2))

    if (filledQty >= trade.qty) {
      const updated = { ...trade, filledQty, price, status: 'EXECUTED', updatedAt: nowIso() }
      openTrades.delete(id)
      dispatch(tradeExecuted(updated))
    } else {
      const updated = { ...trade, filledQty, price, status: 'PARTIAL', updatedAt: nowIso() }
      openTrades.set(id, updated)
      dispatch(tradePartialFill(updated))
    }
  }, 3000)

  return () => clearInterval(interval)
}

// Always tries the real backend first (and keeps retrying it with exponential
// backoff on error) rather than giving up on it permanently. The mock feed is
// only ever used as a placeholder when no backend URL is configured at all -
// see connectTradeStream below.
export function connectTradeStream(dispatch) {
  const clientId = crypto.randomUUID()
  const url = `${apiClient.defaults.baseURL}${STREAM_PATH}?clientId=${clientId}`
  const backendConfigured = Boolean(import.meta.env.VITE_API_URL)

  let eventSource = null
  let retryTimer = null
  let retryIndex = 0
  let stopMock = null
  let stopped = false

  function startMockIfAllowed() {
    if (backendConfigured || stopMock) return
    console.log('[sseService] using mock feed')
    stopMock = connectMockTradeStream(dispatch)
    dispatch(connectionStatusChanged('mock'))
  }

  function stopMockIfRunning() {
    if (!stopMock) return
    stopMock()
    stopMock = null
  }

  function scheduleReconnect() {
    if (stopped) return
    const delay = RETRY_DELAYS_MS[Math.min(retryIndex, RETRY_DELAYS_MS.length - 1)]
    retryIndex += 1
    if (!stopMock) dispatch(connectionStatusChanged('reconnecting'))
    retryTimer = setTimeout(connect, delay)
  }

  function connect() {
    if (stopped) return

    eventSource = new EventSource(url)

    eventSource.addEventListener('CONNECTED', () => {
      retryIndex = 0
      console.log('[sseService] connected to real backend')
      stopMockIfRunning()
      dispatch(connectionStatusChanged('live'))
    })

    Object.entries(ACTION_FOR_EVENT).forEach(([eventName, actionCreator]) => {
      eventSource.addEventListener(eventName, (event) => {
        const payload = JSON.parse(event.data)
        dispatch(actionCreator(payload.trade))
      })
    })

    eventSource.onerror = () => {
      if (stopped) return
      eventSource.close()
      startMockIfAllowed()
      scheduleReconnect()
    }
  }

  dispatch(connectionStatusChanged(backendConfigured ? 'connecting' : 'mock'))
  startMockIfAllowed()
  connect()

  return () => {
    stopped = true
    if (eventSource) eventSource.close()
    if (retryTimer) clearTimeout(retryTimer)
    stopMockIfRunning()
  }
}
