import { Box, Skeleton } from '@mui/material'

// Mirrors TradeBlotter's columnDefs widths so the skeleton lines up with the
// real grid once it swaps in, instead of jumping around.
const COLUMN_WIDTHS = [85, 60, 100, 190, 70, 60, 130, 75, 110, 95, 80, 140]
const ROW_COUNT = 10

function BlotterSkeleton() {
  return (
    <Box sx={{ display: 'flex', gap: 1.5, height: 700 }}>
      <Box sx={{ flex: '1 1 70%', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Skeleton variant="rounded" width={220} height={40} />

        <Box
          sx={{
            flex: 1,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            p: 1,
            overflow: 'hidden',
          }}
        >
          <Box sx={{ display: 'flex', gap: 1, pb: 1, mb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
            {COLUMN_WIDTHS.map((width, index) => (
              <Skeleton key={`header-${index}`} variant="text" width={width} height={20} />
            ))}
          </Box>

          {Array.from({ length: ROW_COUNT }).map((_, rowIndex) => (
            <Box key={rowIndex} sx={{ display: 'flex', gap: 1, alignItems: 'center', py: 0.6 }}>
              {COLUMN_WIDTHS.map((width, colIndex) => (
                <Skeleton key={colIndex} variant="rounded" width={width} height={16} />
              ))}
            </Box>
          ))}
        </Box>
      </Box>

      <Box sx={{ flex: '1 1 30%', minWidth: 320 }}>
        <Skeleton variant="rounded" width="100%" height="100%" />
      </Box>
    </Box>
  )
}

export default BlotterSkeleton
