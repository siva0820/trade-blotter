import { useState } from 'react'
import { useSelector } from 'react-redux'
import { Box } from '@mui/material'
import TradeBlotter from '../features/trades/TradeBlotter'
import TradeDetailPanel from '../features/trades/TradeDetailPanel'
import AllocationPanel from '../features/trades/AllocationPanel'
import { selectTradeById } from '../features/trades/tradesSlice'

function BlotterPage() {
  const [selectedId, setSelectedId] = useState(null)
  const selectedTrade = useSelector(selectTradeById(selectedId))

  return (
    <Box sx={{ display: 'flex', gap: 1.5, height: 700 }}>
      <Box sx={{ flex: '1 1 70%', minWidth: 0 }}>
        <TradeBlotter selectedId={selectedId} onSelectTrade={setSelectedId} />
      </Box>
      <Box sx={{ flex: '1 1 30%', minWidth: 320, display: 'flex', flexDirection: 'column', gap: 1.5, overflowY: 'auto' }}>
        <TradeDetailPanel trade={selectedTrade} />
        <AllocationPanel trade={selectedTrade} />
      </Box>
    </Box>
  )
}

export default BlotterPage
