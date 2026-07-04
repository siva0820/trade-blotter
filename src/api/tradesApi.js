import { apiClient } from './client'

export async function fetchTradesFromApi() {
  const { data } = await apiClient.get('/trades')
  return data
}
