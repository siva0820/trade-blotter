import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from '@mui/material'
import { AgGridReact } from 'ag-grid-react'
import { themeQuartz } from 'ag-grid-community'
import './agGridSetup'
import * as tradeService from '../../services/tradeService'
import {
  fetchTradesThunk,
  selectTrades,
  selectTradesError,
  selectTradesStatus,
  tradeCancelled,
  tradeExecuted,
  tradeUpdated,
} from './tradesSlice'
import {
  ActionsCellRenderer,
  FilledQtyCellRenderer,
  SideCellRenderer,
  StatusBadgeCellRenderer,
} from './tradeCellRenderers'

const currencyFormatter = (params) =>
  params.value == null
    ? ''
    : params.value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })

const compactTheme = themeQuartz.withParams({
  fontSize: 12,
  spacing: 4,
  headerHeight: 32,
  rowHeight: 28,
})

function TradeBlotter({ selectedId, onSelectTrade }) {
  const dispatch = useDispatch()
  const trades = useSelector(selectTrades)
  const status = useSelector(selectTradesStatus)
  const error = useSelector(selectTradesError)
  const [traderFilter, setTraderFilter] = useState('ALL')
  const [editingTrade, setEditingTrade] = useState(null)
  const [editForm, setEditForm] = useState({ qty: '', price: '' })

  useEffect(() => {
    dispatch(fetchTradesThunk())
  }, [dispatch])

  const traders = useMemo(
    () => [...new Set(trades.map((trade) => trade.trader))].sort(),
    [trades],
  )

  const rowData = useMemo(
    () => (traderFilter === 'ALL' ? trades : trades.filter((trade) => trade.trader === traderFilter)),
    [trades, traderFilter],
  )

  const handleExecute = async (trade) => {
    try {
      const updated = await tradeService.executeTrade(trade.id)
      dispatch(tradeExecuted(updated))
    } catch (err) {
      console.error('[TradeBlotter] execute failed', err)
    }
  }

  const handleCancel = async (trade) => {
    try {
      const updated = await tradeService.cancelTrade(trade.id)
      dispatch(tradeCancelled(updated))
    } catch (err) {
      console.error('[TradeBlotter] cancel failed', err)
    }
  }

  const handleEdit = (trade) => {
    setEditingTrade(trade)
    setEditForm({ qty: trade.qty, price: trade.price })
  }

  const handleEditSave = async () => {
    try {
      const updated = await tradeService.updateTrade(editingTrade.id, {
        qty: Number(editForm.qty),
        price: Number(editForm.price),
      })
      dispatch(tradeUpdated(updated))
    } catch (err) {
      console.error('[TradeBlotter] update failed', err)
    } finally {
      setEditingTrade(null)
    }
  }

  const columnDefs = useMemo(
    () => [
      { field: 'symbol', headerName: 'Symbol', width: 85 },
      { field: 'side', headerName: 'Side', width: 60, cellRenderer: SideCellRenderer },
      {
        field: 'status',
        headerName: 'Status',
        width: 100,
        cellRenderer: StatusBadgeCellRenderer,
      },
      {
        colId: 'actions',
        headerName: 'Actions',
        width: 190,
        sortable: false,
        filter: false,
        cellRenderer: ActionsCellRenderer,
        cellRendererParams: {
          onExecute: handleExecute,
          onCancel: handleCancel,
          onEdit: handleEdit,
        },
      },
      { field: 'trader', headerName: 'Trader', width: 70 },
      { field: 'qty', headerName: 'Qty', width: 60, type: 'numericColumn' },
      {
        field: 'filledQty',
        headerName: 'Filled Qty',
        width: 130,
        cellRenderer: FilledQtyCellRenderer,
      },
      {
        field: 'price',
        headerName: 'Price',
        width: 75,
        type: 'numericColumn',
        valueFormatter: currencyFormatter,
      },
      {
        colId: 'notional',
        headerName: 'Notional',
        width: 110,
        type: 'numericColumn',
        valueGetter: (params) => params.data.qty * params.data.price,
        valueFormatter: currencyFormatter,
      },
      { field: 'orderType', headerName: 'Order Type', width: 95 },
      { field: 'id', headerName: 'Trade ID', width: 80 },
      {
        field: 'updatedAt',
        headerName: 'Updated At',
        width: 140,
        valueFormatter: (params) => new Date(params.value).toLocaleTimeString(),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const defaultColDef = useMemo(
    () => ({ sortable: true, filter: true, resizable: true, enableCellChangeFlash: true }),
    [],
  )

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 1.5 }}>
      <FormControl size="small" sx={{ width: 220 }}>
        <InputLabel id="trader-filter-label">Trader</InputLabel>
        <Select
          labelId="trader-filter-label"
          label="Trader"
          value={traderFilter}
          onChange={(event) => setTraderFilter(event.target.value)}
        >
          <MenuItem value="ALL">All Traders</MenuItem>
          {traders.map((trader) => (
            <MenuItem key={trader} value={trader}>
              {trader}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Box sx={{ flex: 1, minHeight: 0 }}>
        {status === 'loading' ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', pt: 8 }}>
            <CircularProgress />
          </Box>
        ) : status === 'failed' ? (
          <Alert severity="error">Failed to load trades: {error}</Alert>
        ) : (
          <AgGridReact
            theme={compactTheme}
            rowData={rowData}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            getRowId={(params) => String(params.data.id)}
            onRowClicked={(event) => onSelectTrade(event.data.id)}
            rowSelection="single"
            getRowStyle={(params) =>
              params.data.id === selectedId ? { background: '#e3f2fd' } : undefined
            }
          />
        )}
      </Box>

      <Dialog open={Boolean(editingTrade)} onClose={() => setEditingTrade(null)}>
        <DialogTitle>Edit {editingTrade?.id}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1, minWidth: 320 }}>
          <TextField
            label="Quantity"
            type="number"
            value={editForm.qty}
            onChange={(event) => setEditForm((form) => ({ ...form, qty: event.target.value }))}
          />
          <TextField
            label="Price"
            type="number"
            value={editForm.price}
            onChange={(event) => setEditForm((form) => ({ ...form, price: event.target.value }))}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingTrade(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleEditSave}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default TradeBlotter
