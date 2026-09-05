import { downloadReport } from '../services/auditApi'
import { useState } from 'react'

function StatusPill({ status }) {
  return <span className={`status-pill ${status}`}>{status === 'pass' ? 'Pass' : status === 'warning' ? 'Review' : 'Missing'}</span>
}

function AuditResults({ audit }) {
  const [reporting, setReporting] = useState(false)
  const summary = audit?.summary || { passed: 0, failed: 0, warnings: 0 }
  async function handleReport() { setReporting(true); try { await downloadReport(audit.id) } finally { setReporting(false) } }
  return <div className="panel result-panel"><div className="panel-heading"><div><p className="section-kicker">LATEST RESULT</p><h2>{audit?.productName || 'Waiting for a scan'}</h2></div>{audit && <span className={`result-status ${audit.status.toLowerCase().replaceAll(' ', '-')}`}>{audit.status}</span>}</div>{audit ? <><div className="score-row"><div className="score-ring"><strong>{audit.score}</strong><small>/100</small></div><div><p className="score-label">COMPLIANCE SCORE</p><p className="score-copy">{summary.failed ? `${summary.failed} declaration${summary.failed > 1 ? 's' : ''} need attention.` : 'All declarations detected.'}</p></div></div><div className="mini-stats"><span><b className="pass-text">{summary.passed}</b> passed</span><span><b className="warning-text">{summary.warnings}</b> review</span><span><b className="fail-text">{summary.failed}</b> missing</span></div><div className="check-list">{audit.checks.map((check) => <div className="check-row" key={check.key}><span className={`check-icon ${check.status}`}>{check.status === 'pass' ? '✓' : check.status === 'warning' ? '!' : '×'}</span><span className="check-name"><b>{check.label}</b><small>{check.evidence}</small></span><StatusPill status={check.status} /></div>)}</div><button className="report-button" onClick={handleReport} disabled={reporting}>{reporting ? 'Preparing report...' : 'Download evidence report ↗'}</button></> : <div className="empty-result"><span>◎</span><p>Submit a label to see declaration-level findings here.</p></div>}</div>
}

export default AuditResults
