function RecentAudits({ audits, onSelect }) {
  return <div className="audit-history"><div className="history-heading"><h3>Recent inspections</h3><span>{audits.length} saved</span></div>{audits.slice(0, 4).map((audit) => <button className="history-row" key={audit.id} onClick={() => onSelect(audit)}><span className={`history-dot ${audit.status.toLowerCase().replaceAll(' ', '-')}`} /><span><b>{audit.productName}</b><small>{new Date(audit.inspectedAt).toLocaleDateString()} · {audit.location || 'Location not set'}</small></span><strong>{audit.score}%</strong></button>)}{!audits.length && <p className="muted">Your saved inspections will appear here.</p>}</div>
}

export default RecentAudits
