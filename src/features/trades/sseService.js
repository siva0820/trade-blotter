import { apiClient } from '../../api/client'
import { tradeAdded, tradePartialFill, tradeExecuted, tradeCancelled } from './tradesSlice'

const STREAM_PATH = '/trades/stream'

const ACTION_FOR_EVENT = {
  TRADE_NEW: tradeAdded,
  TRADE_PARTIAL_FILL: tradePartialFill,
  TRADE_EXECUTED: tradeExecuted,
  TRADE_CANCELLED: tradeCancelled,
}

// Real SSE connection, used once the Spring Boot backend serves /api/trades/stream.
function connectRealTradeStream(dispatch) {
  const eventSource = new EventSource(`${apiClient.defaults.baseURL}${STREAM_PATH}`)

  Object.entries(ACTION_FOR_EVENT).forEach(([eventName, actionCreator]) => {
    eventSource.addEventListener(eventName, (event) => {
      dispatch(actionCreator(JSON.parse(event.data)))
    })
  })

  eventSource.onerror = (err) => {
    console.error('[sseService] trade stream error', err)
  }

  return () => eventSource.close()
}

const MOCK_SYMBOLS = ['AAPL', 'MSFT', 'TSLA', 'NVDA', 'AMZN', 'GOOGL', 'META', 'AMD', 'NFLX', 'JPM']
const MOCK_TRADERS = ['J. Rivera', 'A. Chen', 'M. Patel']
const MOCK_ORDER_TYPES = ['MARKET', 'LIMIT']

const randomOf = (list) => list[Math.floor(Math.random() * list.length)]
const nowIso = () => new Date().toISOString()

let mockIdCounter = 2000

// Fallback used for local dev, since there is no backend yet: simulates the same
// TRADE_NEW -> TRADE_PARTIAL_FILL* -> TRADE_EXECUTED|TRADE_CANCELLED lifecycle
// a real SSE stream would emit, on a timer instead of over the wire.
function connectMockTradeStream(dispatch) {
  const openOrders = new Map()

  const interval = setInterval(() => {
    const openIds = [...openOrders.keys()]

    if (openIds.length === 0 || Math.random() < 0.4) {
      const id = `T-${mockIdCounter++}`
      const quantity = (Math.floor(Math.random() * 20) + 1) * 25
      openOrders.set(id, { quantity, filledQuantity: 0 })
      dispatch(
        tradeAdded({
          id,
          symbol: randomOf(MOCK_SYMBOLS),
          side: Math.random() < 0.5 ? 'BUY' : 'SELL',
          quantity,
          filledQuantity: 0,
          price: Number((100 + Math.random() * 500).toFixed(2)),
          pnl: 0,
          orderType: randomOf(MOCK_ORDER_TYPES),
          status: 'PENDING',
          trader: randomOf(MOCK_TRADERS),
          updatedAt: nowIso(),
        }),
      )
      return
    }

    const id = randomOf(openIds)
    const order = openOrders.get(id)

    if (Math.random() < 0.15) {
      openOrders.delete(id)
      dispatch(tradeCancelled({ id, updatedAt: nowIso() }))
      return
    }

    const increment = Math.max(1, Math.round(order.quantity * (0.2 + Math.random() * 0.4)))
    const filledQuantity = Math.min(order.quantity, order.filledQuantity + increment)
    const price = Number((100 + Math.random() * 500).toFixed(2))

    if (filledQuantity >= order.quantity) {
      openOrders.delete(id)
      dispatch(
        tradeExecuted({
          id,
          price,
          pnl: Number(((Math.random() - 0.4) * 1000).toFixed(2)),
          updatedAt: nowIso(),
        }),
      )
    } else {
      order.filledQuantity = filledQuantity
      dispatch(tradePartialFill({ id, filledQuantity, price, updatedAt: nowIso() }))
    }
  }, 3000)

  return () => clearInterval(interval)
}

// Returns a cleanup function; call it (e.g. from a useEffect) to tear the stream down.
export function connectTradeStream(dispatch) {
  if (import.meta.env.DEV) {
    return connectMockTradeStream(dispatch)
  }
  return connectRealTradeStream(dispatch)
}
