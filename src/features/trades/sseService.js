import { apiClient } from '../../services/tradeService'
import { tradeAdded, tradePartialFill, tradeExecuted, tradeCancelled } from './tradesSlice'

const STREAM_PATH = '/api/trades/stream'

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

// Fallback used when the real SSE connection errors out (backend down/unreachable):
// simulates the same TRADE_NEW -> TRADE_PARTIAL_FILL* -> TRADE_EXECUTED|TRADE_CANCELLED
// lifecycle the real backend emits, dispatching full trade objects on a timer.
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

// Connects to the real backend first; if the connection errors (backend down/
// unreachable), falls back to the mock setInterval simulation above.
export function connectTradeStream(dispatch) {
  const clientId = crypto.randomUUID()
  const url = `${apiClient.defaults.baseURL}${STREAM_PATH}?clientId=${clientId}`

  let stoppedMock = null
  let fellBack = false

  const eventSource = new EventSource(url)

  eventSource.addEventListener('CONNECTED', () => {
    console.log('[sseService] connected to real backend')
  })

  Object.entries(ACTION_FOR_EVENT).forEach(([eventName, actionCreator]) => {
    eventSource.addEventListener(eventName, (event) => {
      const payload = JSON.parse(event.data)
      dispatch(actionCreator(payload.trade))
    })
  })

  eventSource.onerror = () => {
    if (fellBack) return
    fellBack = true
    eventSource.close()
    console.log('[sseService] using mock feed')
    stoppedMock = connectMockTradeStream(dispatch)
  }

  return () => {
    eventSource.close()
    if (stoppedMock) stoppedMock()
  }
}
