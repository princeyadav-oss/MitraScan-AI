import { useEffect, useState } from 'react'
import AuditForm from './components/AuditForm'
import AuditResults from './components/AuditResults'
import RecentAudits from './components/RecentAudits'
import Topbar from './components/Topbar'
import AuthScreen from './components/AuthScreen'
import { createImageAudit, createUrlAudit, getAudits } from './services/auditApi'
import { clearSession, getSession } from './services/authApi'
import './App.css'

function App() {
  const [audits, setAudits] = useState([])
  const [selectedAudit, setSelectedAudit] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [user, setUser] = useState(undefined)

  useEffect(() => {
    getSession().then(setUser)
  }, [])

  useEffect(() => {
    if (!user) return
    getAudits().then(setAudits).catch((error) => setMessage(error.message))
  }, [user])

  async function handleImageAudit(formData) {
    setLoading(true); setMessage('')
    try {
      const audit = await createImageAudit(formData)
      setAudits((current) => [audit, ...current]); setSelectedAudit(audit); setMessage('Audit completed and evidence saved.')
    } catch (error) { setMessage(error.message) } finally { setLoading(false) }
  }

  async function handleUrlAudit(details) {
    setLoading(true); setMessage('Fetching product page and checking declarations...')
    try {
      const audit = await createUrlAudit(details)
      setAudits((current) => [audit, ...current]); setSelectedAudit(audit); setMessage('Product page audit completed and evidence saved.')
    } catch (error) { setMessage(error.message) } finally { setLoading(false) }
  }

  const currentAudit = selectedAudit || audits[0]
  if (user === undefined) return <div className="app-shell" />
  if (!user) return <AuthScreen onAuthenticated={setUser} />

  return <div className="app-shell">
    <Topbar user={user} onSignOut={() => { clearSession(); setUser(null); setAudits([]); setSelectedAudit(null) }} />
    <main>
      <section className="intro"><div><p className="eyebrow">FIELD AUDIT CONSOLE / 01</p><h1>Check every label.<br /><em>Document every finding.</em></h1><p className="intro-copy">Scan packaged commodities against the seven mandatory declarations under the Legal Metrology Rules, 2011.</p></div><div className="intro-note"><span>RULES ENGINE</span><strong>7 declarations</strong><small>MRP · quantity · origin<br />consumer care · more</small></div></section>
      <div className="workspace-grid"><AuditForm loading={loading} message={message} onImageAudit={handleImageAudit} onUrlAudit={handleUrlAudit} /><section className="results-column"><AuditResults audit={currentAudit} /><RecentAudits audits={audits} onSelect={setSelectedAudit} /></section></div>
    </main>
  </div>
}

export default App
