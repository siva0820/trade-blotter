const STATUS_STYLES = {
  EXECUTED: { bg: '#e6f4ea', fg: '#1b7a3d' },
  PARTIAL: { bg: '#fdf3e0', fg: '#b8860b' },
  PENDING: { bg: '#e3f0fc', fg: '#1565c0' },
  CANCELLED: { bg: '#eee', fg: '#757575' },
}

export function SideCellRenderer({ value }) {
  return (
    <span style={{ color: value === 'BUY' ? '#1b7a3d' : '#c0392b', fontWeight: 600 }}>{value}</span>
  )
}

export function StatusBadgeCellRenderer({ value }) {
  const style = STATUS_STYLES[value] ?? STATUS_STYLES.PENDING
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '1px 8px',
        borderRadius: 10,
        fontSize: 11,
        fontWeight: 600,
        background: style.bg,
        color: style.fg,
      }}
    >
      {value}
    </span>
  )
}

export function FilledQtyCellRenderer({ data }) {
  const percent = data.qty > 0 ? Math.round((data.filledQty / data.qty) * 100) : 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: '100%' }}>
      <div style={{ flex: 1, height: 6, borderRadius: 3, background: '#e0e0e0', overflow: 'hidden' }}>
        <div
          style={{
            width: `${percent}%`,
            height: '100%',
            background: percent >= 100 ? '#1b7a3d' : '#1565c0',
            transition: 'width 0.3s ease',
          }}
        />
      </div>
      <span style={{ fontSize: 10, color: '#555', minWidth: 40, textAlign: 'right' }}>
        {data.filledQty.toLocaleString()} / {data.qty.toLocaleString()}
      </span>
    </div>
  )
}

const buttonStyle = (color, disabled) => ({
  border: `1px solid ${color}`,
  color: disabled ? '#aaa' : color,
  borderColor: disabled ? '#ddd' : color,
  background: 'transparent',
  borderRadius: 4,
  padding: '1px 6px',
  fontSize: 11,
  fontWeight: 600,
  cursor: disabled ? 'default' : 'pointer',
})

export function ActionsCellRenderer({ data, onExecute, onCancel, onEdit }) {
  const disabled = data.status === 'EXECUTED' || data.status === 'CANCELLED'
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center', height: '100%' }}>
      <button
        type="button"
        style={buttonStyle('#1b7a3d', disabled)}
        disabled={disabled}
        onClick={() => onExecute(data)}
      >
        Execute
      </button>
      <button
        type="button"
        style={buttonStyle('#c0392b', disabled)}
        disabled={disabled}
        onClick={() => onCancel(data)}
      >
        Cancel
      </button>
      <button
        type="button"
        style={buttonStyle('#1565c0', disabled)}
        disabled={disabled}
        onClick={() => onEdit(data)}
      >
        Edit
      </button>
    </div>
  )
}
