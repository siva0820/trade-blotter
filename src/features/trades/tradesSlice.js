import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { mockTrades } from './mockTrades'

// TODO: once the Spring Boot backend is live, replace this body with
// `return fetchTradesFromApi()` from `src/api/tradesApi.js`.
export const fetchTrades = createAsyncThunk('trades/fetchTrades', async () => {
  await new Promise((resolve) => setTimeout(resolve, 300))
  return mockTrades
})

const tradesSlice = createSlice({
  name: 'trades',
  initialState: {
    items: [],
    status: 'idle',
    error: null,
  },
  reducers: {
    tradeAdded: (state, action) => {
      const trade = action.payload
      if (!state.items.some((item) => item.id === trade.id)) {
        state.items.unshift(trade)
      }
    },
    tradePartialFill: (state, action) => {
      const { id, filledQuantity, price, updatedAt } = action.payload
      const trade = state.items.find((item) => item.id === id)
      if (trade) {
        trade.filledQuantity = filledQuantity
        trade.price = price
        trade.status = 'PARTIAL'
        trade.updatedAt = updatedAt
      }
    },
    tradeExecuted: (state, action) => {
      const { id, price, pnl, updatedAt } = action.payload
      const trade = state.items.find((item) => item.id === id)
      if (trade) {
        trade.filledQuantity = trade.quantity
        trade.price = price
        trade.pnl = pnl
        trade.status = 'FILLED'
        trade.updatedAt = updatedAt
      }
    },
    tradeCancelled: (state, action) => {
      const { id, updatedAt } = action.payload
      const trade = state.items.find((item) => item.id === id)
      if (trade) {
        trade.status = 'CANCELLED'
        trade.updatedAt = updatedAt
      }
    },
    tradeUpdated: (state, action) => {
      const { id, quantity, price, updatedAt } = action.payload
      const trade = state.items.find((item) => item.id === id)
      if (trade) {
        trade.quantity = quantity
        trade.price = price
        trade.updatedAt = updatedAt
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTrades.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchTrades.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload
      })
      .addCase(fetchTrades.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.error.message
      })
  },
})

export const { tradeAdded, tradePartialFill, tradeExecuted, tradeCancelled, tradeUpdated } =
  tradesSlice.actions

export const selectTrades = (state) => state.trades.items
export const selectTradesStatus = (state) => state.trades.status
export const selectTradeById = (id) => (state) =>
  state.trades.items.find((trade) => trade.id === id)

export default tradesSlice.reducer
