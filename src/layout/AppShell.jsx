import { AppBar, Box, Chip, Toolbar, Typography } from '@mui/material'
import { useSelector } from 'react-redux'
import { Outlet } from 'react-router-dom'
import { selectConnectionStatus } from '../features/trades/tradesSlice'

const STATUS_CHIP = {
  live: { label: 'LIVE', color: 'success' },
  reconnecting: { label: 'Reconnecting…', color: 'warning' },
  mock: { label: 'MOCK', color: 'default' },
  connecting: { label: 'Connecting…', color: 'default' },
}

function AppShell() {
  const connectionStatus = useSelector(selectConnectionStatus)
  const chip = STATUS_CHIP[connectionStatus] ?? STATUS_CHIP.connecting

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100svh' }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar sx={{ gap: 1.5 }}>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Trade Blotter Dashboard
          </Typography>
          <Chip size="small" label={chip.label} color={chip.color} />
        </Toolbar>
      </AppBar>
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  )
}

export default AppShell
