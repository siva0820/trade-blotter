import { Box, Card, CardContent, Chip, Stack, Typography } from '@mui/material'

const statusColor = {
  FILLED: 'success',
  PARTIAL: 'warning',
  PENDING: 'info',
  CANCELLED: 'default',
}

function TradeDetailPanel({ trade }) {
  if (!trade) {
    return (
      <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography color="text.secondary">Select a trade to see details</Typography>
      </Box>
    )
  }

  return (
    <Card>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h5">{trade.symbol}</Typography>
          <Chip label={trade.status} color={statusColor[trade.status] ?? 'default'} />
        </Stack>
        <Stack spacing={1}>
          <Typography>Trade ID: {trade.id}</Typography>
          <Typography>Side: {trade.side}</Typography>
          <Typography>Quantity: {trade.quantity.toLocaleString()}</Typography>
          <Typography>Filled: {trade.filledQuantity.toLocaleString()}</Typography>
          <Typography>
            Price: {trade.price.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
          </Typography>
          <Typography>
            P&L: {trade.pnl.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
          </Typography>
          <Typography>Order Type: {trade.orderType}</Typography>
          <Typography>Trader: {trade.trader}</Typography>
          <Typography>Updated: {new Date(trade.updatedAt).toLocaleString()}</Typography>
        </Stack>
      </CardContent>
    </Card>
  )
}

export default TradeDetailPanel
