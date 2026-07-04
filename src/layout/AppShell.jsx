import { AppBar, Box, Toolbar, Typography } from '@mui/material'
import { Outlet } from 'react-router-dom'

function AppShell() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100svh' }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <Typography variant="h6" noWrap component="div">
            Trade Blotter
          </Typography>
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
