import { useState } from 'react'
import { useSelector } from 'react-redux'
import { Accordion, AccordionDetails, AccordionSummary, Box, Typography } from '@mui/material'
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
import TradeBlotter from '../features/trades/TradeBlotter'
import TradeDetailPanel from '../features/trades/TradeDetailPanel'
import AllocationPanel from '../features/trades/AllocationPanel'
import { selectTradeById, selectTrades } from '../features/trades/tradesSlice'

function BlotterPage() {
  const [selectedId, setSelectedId] = useState(null)
  const selectedTrade = useSelector(selectTradeById(selectedId))
  const trades = useSelector(selectTrades)
  const showDetails = trades.length > 0 && Boolean(selectedTrade)

  return (
    <Box sx={{ display: 'flex', gap: 1.5, height: 700 }}>
      <Box sx={{ flex: showDetails ? '1 1 70%' : '1 1 100%', minWidth: 0 }}>
        <TradeBlotter selectedId={selectedId} onSelectTrade={setSelectedId} />
      </Box>
      {showDetails && (
        <Box sx={{ flex: '1 1 30%', minWidth: 320, overflowY: 'auto' }}>
          <Accordion defaultExpanded disableGutters>
            <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
              <Typography fontWeight={600}>Trade Details</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <TradeDetailPanel trade={selectedTrade} />
            </AccordionDetails>
          </Accordion>
          <Accordion defaultExpanded disableGutters>
            <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
              <Typography fontWeight={600}>Allocations</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <AllocationPanel trade={selectedTrade} />
            </AccordionDetails>
          </Accordion>
        </Box>
      )}
    </Box>
  )
}

export default BlotterPage
