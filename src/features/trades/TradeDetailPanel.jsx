import { Chip, Stack, Typography } from '@mui/material'

const statusColor = {
  EXECUTED: 'success',
  PARTIAL: 'warning',
  PENDING: 'info',
  CANCELLED: 'default',
}

function TradeDetailPanel({ trade }) {
  return (
    <Stack spacing={1.5}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h5">{trade.symbol}</Typography>
        <Stack direction="row" spacing={1}>
          {trade.isMock && <Chip label="Simulated" size="small" color="default" variant="outlined" />}
          <Chip label={trade.status} color={statusColor[trade.status] ?? 'default'} />
        </Stack>
      </Stack>
      <Stack spacing={1}>
        <Typography>Trade ID: {trade.id}</Typography>
        <Typography>Side: {trade.side}</Typography>
        <Typography>Quantity: {trade.qty.toLocaleString()}</Typography>
        <Typography>Filled: {trade.filledQty.toLocaleString()}</Typography>
        <Typography>
          Price: {trade.price.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
        </Typography>
        <Typography>Order Type: {trade.orderType}</Typography>
        <Typography>Trader: {trade.trader}</Typography>
        <Typography>Updated: {new Date(trade.updatedAt).toLocaleString()}</Typography>
      </Stack>
    </Stack>
  )
}

export default TradeDetailPanel
