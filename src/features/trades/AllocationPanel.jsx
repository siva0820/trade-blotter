import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Stack,
  Typography,
} from '@mui/material'
import { fetchAllocationsThunk, selectAllocations } from './tradesSlice'

const statusColor = {
  EXECUTED: 'success',
  PARTIAL: 'warning',
  PENDING: 'info',
  CANCELLED: 'default',
}

function AllocationPanel({ tradeId }) {
  const dispatch = useDispatch()
  const allocations = useSelector(selectAllocations)

  useEffect(() => {
    if (tradeId != null) {
      dispatch(fetchAllocationsThunk(tradeId))
    }
  }, [tradeId, dispatch])

  if (tradeId == null) {
    return null
  }

  const isCurrent = allocations.tradeId === tradeId

  return (
    <Card>
      <CardContent>
        <Typography variant="subtitle1" gutterBottom>
          Allocations
        </Typography>

        {isCurrent && allocations.status === 'loading' && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress size={24} />
          </Box>
        )}

        {isCurrent && allocations.status === 'failed' && (
          <Alert severity="error">Failed to load allocations: {allocations.error}</Alert>
        )}

        {isCurrent && allocations.status === 'succeeded' && (
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
      </CardContent>
    </Card>
  )
}

export default AllocationPanel
