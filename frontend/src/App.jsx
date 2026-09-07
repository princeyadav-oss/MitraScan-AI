import { useEffect, useState } from 'react'
import AuditForm from './components/AuditForm'
import AuditResults from './components/AuditResults'
import RecentAudits from './components/RecentAudits'
import Topbar from './components/Topbar'
import AuthScreen from './components/AuthScreen'
import CalorieTracker from './components/CalorieTracker'
import HealthShieldSelector from './components/HealthShieldSelector'
import { createImageAudit, createUrlAudit, getAudits } from './services/auditApi'
import { clearSession, getSession } from './services/authApi'
import './App.css'

function App() {
  const [audits, setAudits] = useState([])
  const [selectedAudit, setSelectedAudit] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [user, setUser] = useState(undefined)
  const [itemToLog, setItemToLog] = useState(null)
  const [selectedShields, setSelectedShields] = useState([])

  useEffect(() => {
    getSession()
      .then((existingUser) => setUser(existingUser || null))
      .catch(() => setUser(null))
  }, [])

  useEffect(() => {
    if (!user) return
    getAudits().then(setAudits).catch((error) => setMessage(error.message))
  }, [user])

  async function handleImageAudit(formData) {
    setLoading(true)
    setMessage('')
    try {
      const audit = await createImageAudit(formData)
      setAudits((current) => [audit, ...current])
      setSelectedAudit(audit)
      setMessage('Audit completed: Metrology, Healthwashing & Bio-Safety analyzed.')
    } catch (error) {
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleUrlAudit(details) {
    setLoading(true)
    setMessage('Fetching product page and checking declarations...')
    try {
      const audit = await createUrlAudit(details)
      setAudits((current) => [audit, ...current])
      setSelectedAudit(audit)
      setMessage('Product page audit completed and evidence saved.')
    } catch (error) {
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  const currentAudit = selectedAudit || audits[0]
  if (user === undefined) {
    return (
      <div className="app-shell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <p style={{ fontFamily: 'var(--font-heading)', color: 'var(--primary)', fontSize: '20px', fontWeight: '700' }}>
          Loading MitraScan AI...
        </p>
      </div>
    )
  }
  if (!user) return <AuthScreen onAuthenticated={setUser} />

  return (
    <div className="app-shell">
      <Topbar
        user={user}
        onSignOut={() => {
          clearSession()
          setUser(null)
          setAudits([])
          setSelectedAudit(null)
        }}
      />

      <main>
        <section className="intro">
          <div>
            <p className="eyebrow">FIELD AUDIT & HEALTH INTELLIGENCE CONSOLE</p>
            <h1>
              Scan every product.<br />
              <em>Expose healthwashing & protect your health.</em>
            </h1>
            <p className="intro-copy">
              Live camera scanning, Legal Metrology compliance verification, Truth Meter deception scoring, Personalized Health Shield alarms, and regional voice readouts.
            </p>
          </div>
          <div className="intro-note">
            <span>INTELLIGENCE SUITE</span>
            <strong>Truth Meter + Voice</strong>
            <small>
              Health Shield · Deception<br />
              Camera · Regional Audio
            </small>
          </div>
        </section>

        {/* 🛡️ PERSONALIZED HEALTH SHIELD SELECTOR */}
        <HealthShieldSelector onConditionsChange={setSelectedShields} />

        <div className="workspace-grid">
          <div className="left-column">
            <AuditForm
              user={user}
              loading={loading}
              message={message}
              onImageAudit={handleImageAudit}
              onUrlAudit={handleUrlAudit}
            />
            <CalorieTracker
              scannedItemToLog={itemToLog}
              onClearScannedLog={() => setItemToLog(null)}
            />
          </div>

          <section className="results-column">
            <AuditResults
              audit={currentAudit}
              loading={loading}
              onLogToCalorieTracker={(item) => setItemToLog(item)}
              selectedShields={selectedShields}
            />
            <RecentAudits audits={audits} onSelect={setSelectedAudit} />
          </section>
        </div>
      </main>
    </div>
  )
}

export default App
