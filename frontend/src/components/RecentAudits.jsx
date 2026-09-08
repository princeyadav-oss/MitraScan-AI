function RecentAudits({ audits = [], onSelect }) {
  const list = Array.isArray(audits) ? audits : []
  return (
    <div className="audit-history">
      <div className="history-heading">
        <h3>Recent inspections</h3>
        <span>{list.length} saved</span>
      </div>
      {list.slice(0, 4).map((audit) => (
        <button className="history-row" key={audit.id} onClick={() => onSelect(audit)}>
          <span className={`history-dot ${(audit?.status || 'Compliant').toLowerCase().replaceAll(' ', '-')}`} />
          <span>
            <b>{(!audit?.productName || audit.productName === 'Not detected') ? 'Product Detected' : audit.productName}</b>
            <small>{audit.inspectedAt ? new Date(audit.inspectedAt).toLocaleDateString() : 'Today'} · {audit.location || 'Location not set'}</small>
          </span>
          <strong>{audit.score || 0}%</strong>
        </button>
      ))}
      {!list.length && <p className="muted">Your saved inspections will appear here.</p>}
    </div>
  )
}

export default RecentAudits
