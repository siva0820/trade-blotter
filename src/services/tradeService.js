import axios from 'axios'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://trade-blotter-api.onrender.com',
  timeout: 10000,
})

export async function fetchTrades(trader) {
  const params = trader && trader !== 'ALL' ? { trader } : undefined
  const { data } = await apiClient.get('/api/trades', { params })
  return data
}

export async function fetchAllocations(tradeId) {
  const { data } = await apiClient.get(`/api/trades/${tradeId}/allocations`)
  return data
}

export async function executeTrade(id) {
  const { data } = await apiClient.post(`/api/trades/${id}/execute`)
  return data
}

export async function cancelTrade(id) {
  const { data } = await apiClient.post(`/api/trades/${id}/cancel`)
  return data
}

// The backend only maps PATCH (not PUT) on /api/trades/:id - verified against
// the running instance, which returns 405 for PUT.
export async function updateTrade(id, data) {
  const { data: updated } = await apiClient.patch(`/api/trades/${id}`, data)
  return updated
}
