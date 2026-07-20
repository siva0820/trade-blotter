import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Alert, Box, Chip, CircularProgress, Stack, Typography } from '@mui/material'
import { fetchAllocationsThunk, selectAllocations } from './tradesSlice'

const statusColor = {
  EXECUTED: 'success',
  PARTIAL: 'warning',
  PENDING: 'info',
  CANCELLED: 'default',
}

function AllocationPanel({ trade }) {
  const dispatch = useDispatch()
  const allocations = useSelector(selectAllocations)
  const tradeId = trade.id
  const isMock = Boolean(trade.isMock)

  useEffect(() => {
    if (!isMock) {
      dispatch(fetchAllocationsThunk(tradeId))
    }
  }, [tradeId, isMock, dispatch])

  return (
    <>
      {isMock && (
        <Alert severity="info">
          Allocations unavailable for simulated trades. Waiting for live connection...
        </Alert>
      )}

      {!isMock && allocations.tradeId === tradeId && allocations.status === 'loading' && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          <CircularProgress size={24} />
        </Box>
      )}

      {!isMock && allocations.tradeId === tradeId && allocations.status === 'failed' && (
        <Alert severity="error">Failed to load allocations: {allocations.error}</Alert>
      )}

      {!isMock && allocations.tradeId === tradeId && allocations.status === 'succeeded' && (
        <Stack spacing={1}>
          {allocations.items.length === 0 && (
            <Typography color="text.secondary">No allocations for this trade.</Typography>
          )}
          {allocations.items.map((allocation) => (
            <Box
              key={allocation.id}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                px: 1.5,
                py: 1,
              }}
            >
              <Box>
                <Typography variant="body2" fontWeight={600}>
                  {allocation.fundName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {allocation.accountId} &middot; {allocation.filledShares.toLocaleString()} /{' '}
                  {allocation.shares.toLocaleString()} shares
                </Typography>
              </Box>
              <Chip
                size="small"
                label={allocation.status}
                color={statusColor[allocation.status] ?? 'default'}
              />
            </Box>
          ))}
        </Stack>
      )}
    </>
  )
}

export default AllocationPanel
