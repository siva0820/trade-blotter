import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import * as tradeService from '../../services/tradeService'

export const fetchTradesThunk = createAsyncThunk('trades/fetchTradesThunk', (trader) =>
  tradeService.fetchTrades(trader),
)

export const fetchAllocationsThunk = createAsyncThunk(
  'trades/fetchAllocationsThunk',
  async (tradeId) => {
    const allocations = await tradeService.fetchAllocations(tradeId)
    return { tradeId, allocations }
  },
)

// The real backend and the mock SSE fallback both send the full, current trade
// object on every event/action response, so every trade mutation is a plain upsert.
function upsertTrade(state, trade) {
  const index = state.items.findIndex((item) => item.id === trade.id)
  if (index === -1) {
    state.items.unshift(trade)
  } else {
    state.items[index] = trade
  }
}

const tradesSlice = createSlice({
  name: 'trades',
  initialState: {
    items: [],
    status: 'idle',
    error: null,
    allocations: {
      tradeId: null,
      items: [],
      status: 'idle',
      error: null,
    },
  },
  reducers: {
    tradeAdded: (state, action) => upsertTrade(state, action.payload),
    tradePartialFill: (state, action) => upsertTrade(state, action.payload),
    tradeExecuted: (state, action) => upsertTrade(state, action.payload),
    tradeCancelled: (state, action) => upsertTrade(state, action.payload),
    tradeUpdated: (state, action) => upsertTrade(state, action.payload),
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTradesThunk.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchTradesThunk.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload
      })
      .addCase(fetchTradesThunk.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.error.message
      })
      .addCase(fetchAllocationsThunk.pending, (state, action) => {
        state.allocations.tradeId = action.meta.arg
        state.allocations.status = 'loading'
        state.allocations.error = null
      })
      .addCase(fetchAllocationsThunk.fulfilled, (state, action) => {
        state.allocations.tradeId = action.payload.tradeId
        state.allocations.items = action.payload.allocations
        state.allocations.status = 'succeeded'
      })
      .addCase(fetchAllocationsThunk.rejected, (state, action) => {
        state.allocations.tradeId = action.meta.arg
        state.allocations.status = 'failed'
        state.allocations.error = action.error.message
      })
  },
})

export const { tradeAdded, tradePartialFill, tradeExecuted, tradeCancelled, tradeUpdated } =
  tradesSlice.actions

export const selectTrades = (state) => state.trades.items
export const selectTradesStatus = (state) => state.trades.status
export const selectTradesError = (state) => state.trades.error
export const selectTradeById = (id) => (state) =>
  state.trades.items.find((trade) => trade.id === id)
export const selectAllocations = (state) => state.trades.allocations

export default tradesSlice.reducer
