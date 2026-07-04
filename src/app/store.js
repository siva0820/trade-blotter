import { configureStore } from '@reduxjs/toolkit'
import tradesReducer from '../features/trades/tradesSlice'

export const store = configureStore({
  reducer: {
    trades: tradesReducer,
  },
})
