import { useState, useEffect } from 'react'
import { downloadReport } from '../services/auditApi'
import { playHealthAlertBeep, testAlertBeep, setMuteState, getMuteState } from '../services/audioAlert'
import VoiceAssistantBar from './VoiceAssistantBar'
import TruthMeter from './TruthMeter'

function StatusPill({ status }) {
  return (
    <span className={`status-pill ${status}`}>
      {status === 'pass' ? 'Pass' : status === 'warning' ? 'Review' : 'Missing'}
    </span>
  )
}

function AuditResults({ audit, loading = false, onLogToCalorieTracker, selectedShields = [] }) {
  const [reporting, setReporting] = useState(false)
  const [loggedToTracker, setLoggedToTracker] = useState(false)
  const [muted, setMuted] = useState(getMuteState())

  const summary = audit?.summary || { passed: 0, failed: 0, warnings: 0 }
  const health = audit?.healthAnalysis
  const suspicious = health?.suspiciousIngredients
  const nutrition = health?.nutrition
  const dietary = health?.dietary
  const healthwashing = audit?.healthwashing
  const healthShield = audit?.healthShield

  // Automatically trigger audio beep alert when suspicious ingredients or severe health shield risks detected
  useEffect(() => {
    if (audit && (health?.shouldBeep || healthShield?.hasAnyRisk)) {
      playHealthAlertBeep()
    }
    setLoggedToTracker(false)
  }, [audit?.id, health?.shouldBeep, healthShield?.hasAnyRisk])

  async function handleReport() {
    if (!audit?.id) return
    setReporting(true)
    try {
      await downloadReport(audit.id)
    } finally {
      setReporting(false)
    }
  }

  function handleLogItem() {
    if (!audit || !nutrition) return
    if (onLogToCalorieTracker) {
      onLogToCalorieTracker({
        name: audit.productName || 'Scanned Snack',
        calories: nutrition.calories || 0,
        protein: nutrition.protein || 0,
        carbs: nutrition.carbs || 0,
        fat: nutrition.fat || 0
      })
      setLoggedToTracker(true)
    }
  }

  function toggleMute() {
    const next = !muted
    setMuteState(next)
    setMuted(next)
  }

  if (loading) {
    return (
      <div className="panel result-panel loading-audit-panel">
        <div className="panel-heading">
          <div>
            <p className="section-kicker">ANALYZING CAPTURE</p>
            <h2>Scanning product label...</h2>
          </div>
        </div>
        <div className="empty-result" style={{ padding: '40px 24px', textAlign: 'center' }}>
          <span style={{ display: 'inline-block', fontSize: '36px' }}>⚙️</span>
          <p style={{ marginTop: '12px', fontWeight: '700', fontSize: '16px', color: 'var(--ink)' }}>
            Processing OCR text & running Legal Metrology + Health Shield checks...
          </p>
          <small style={{ color: '#526c5c', display: 'block', marginTop: '6px' }}>
            Extracting text declarations, identifying dangerous additives, and calculating nutrition breakdown.
          </small>
        </div>
      </div>
    )
  }

  if (!audit) {
    return (
      <div className="panel result-panel">
        <div className="panel-heading">
          <div>
            <p className="section-kicker">LATEST RESULT</p>
            <h2>Waiting for a scan</h2>
          </div>
        </div>
        <div className="empty-result">
          <span>◎</span>
          <p>Scan a product with your camera or submit a label to see Legal Metrology compliance, Health Shield alerts, and calorie suggestions here.</p>
        </div>
      </div>
    )
  }

  const hasSuspicious = suspicious?.hasSuspiciousIngredients
  const triggeredShieldRisks = (healthShield?.triggeredList || []).filter((r) =>
    selectedShields.length === 0 || selectedShields.includes(r.id)
  )

  return (
    <div className="panel result-panel">
      {/* 🗣️ REGIONAL MULTILINGUAL VOICE ASSISTANT */}
      <VoiceAssistantBar audit={audit} selectedShields={selectedShields} />

      <div className="panel-heading">
        <div>
          <p className="section-kicker">LATEST RESULT</p>
          <h2>{audit.productName || 'Packaged Product'}</h2>
        </div>
        <span className={`result-status ${(audit?.status || 'Compliant').toLowerCase().replaceAll(' ', '-')}`}>
          {audit.status || 'Compliant'}
        </span>
      </div>

      {/* 🛡️ PERSONALIZED HEALTH SHIELD DANGER ALERT */}
      {triggeredShieldRisks.length > 0 && (
        <div className="health-shield-alert-card pulsating-alert">
          <div className="shield-alert-header">
            <span className="shield-alert-badge">🛡️ HEALTH SHIELD WARNING</span>
            <small className="shield-alert-count">
              {triggeredShieldRisks.length} Condition Conflict{triggeredShieldRisks.length > 1 ? 's' : ''} Detected
            </small>
          </div>
          <h4 className="shield-alert-heading">
            Warning: This product contradicts your active medical / dietary profile!
          </h4>
          <div className="shield-risks-list">
            {triggeredShieldRisks.map((riskItem) => (
              <div key={riskItem.id} className="shield-risk-row">
                <span className="risk-icon">{riskItem.icon}</span>
                <div className="risk-details">
                  <div className="risk-top">
                    <strong>{riskItem.label}</strong>
                    <span className="risk-tag">{riskItem.badge}</span>
                  </div>
                  <p className="risk-desc">{riskItem.hazard}</p>
                  <small className="risk-solution">💡 {riskItem.recommendation}</small>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 🏆 TRUTH METER (HEALTHWASHING & DECEPTION RADAR) */}
      <TruthMeter healthwashing={healthwashing} />

      {/* ⚠️ SUSPICIOUS INGREDIENT HEALTH WARNING ALERT BANNER */}
      {hasSuspicious && (
        <div className="health-alert-banner pulsating-alert">
          <div className="alert-header">
            <span className="alert-badge-icon">⚠️ HARMFUL ADDITIVES DETECTED</span>
            <div className="sound-controls">
              <button
                type="button"
                className="sound-btn"
                onClick={testAlertBeep}
                title="Play audible warning beep"
              >
                🔊 Replay Beep
              </button>
              <button
                type="button"
                className="sound-btn"
                onClick={toggleMute}
                title="Toggle Beep Mute"
              >
                {muted ? '🔇 Unmute' : '🔊 Mute'}
              </button>
            </div>
          </div>

          <h4 className="alert-title">
            Suspicious or Harmful Ingredients Found in Packet!
          </h4>
          <p className="alert-subtitle">
            This snack contains additives that are harmful to health. An audible warning beep has been sounded.
          </p>

          <div className="suspicious-list">
            {(suspicious?.list || []).map((item, idx) => (
              <div key={idx} className={`suspicious-item severity-${item.severity}`}>
                <div className="item-title-row">
                  <span className="hazard-tag">{item.severity.toUpperCase()}</span>
                  <strong>{item.name}</strong>
                  <span className="matched-text">(Found: "{item.matchedText}")</span>
                </div>
                <p className="hazard-risk">{item.risk}</p>
                <small className="hazard-rec">💡 <b>Recommendation:</b> {item.recommendation}</small>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* NUTRITION & CALORIE DEFICIT / INTAKE SMART SUGGESTIONS */}
      {nutrition && (
        <div className="nutrition-analysis-card">
          <div className="nutrition-card-header">
            <div>
              <span className="eyebrow">NUTRITION & CALORIE TRACKING</span>
              <h3>Calorie & Dietary Assessment</h3>
            </div>
            {dietary?.deficitBadge && (
              <span className={`dietary-badge ${dietary.deficitBadge.toLowerCase().replace(/\s+/g, '-')}`}>
                {dietary.deficitBadge}
              </span>
            )}
          </div>

          {/* Key Macros Grid */}
          <div className="nutrition-grid">
            <div className="nutri-stat primary-stat">
              <span className="nutri-label">CALORIES</span>
              <strong className="nutri-value">{nutrition.calories}</strong>
              <small>kcal / {nutrition.servingSize}{nutrition.servingUnit}</small>
            </div>
            <div className="nutri-stat">
              <span className="nutri-label">PROTEIN</span>
              <strong className="nutri-value">{nutrition.protein}g</strong>
              <small>builds lean mass</small>
            </div>
            <div className="nutri-stat">
              <span className="nutri-label">CARBS</span>
              <strong className="nutri-value">{nutrition.carbs}g</strong>
              <small>energy</small>
            </div>
            <div className="nutri-stat">
              <span className="nutri-label">ADDED SUGAR</span>
              <strong className={`nutri-value ${nutrition.sugar > 10 ? 'warning-text' : ''}`}>
                {nutrition.sugar}g
              </strong>
              <small>{nutrition.sugar > 10 ? 'high sugar' : 'low sugar'}</small>
            </div>
            <div className="nutri-stat">
              <span className="nutri-label">TOTAL FAT</span>
              <strong className="nutri-value">{nutrition.fat}g</strong>
              <small>lipids</small>
            </div>
            <div className="nutri-stat">
              <span className="nutri-label">SODIUM</span>
              <strong className={`nutri-value ${nutrition.sodium > 300 ? 'warning-text' : ''}`}>
                {nutrition.sodium}mg
              </strong>
              <small>salt</small>
            </div>
          </div>

          {/* Goal Specific Recommendations */}
          <div className="diet-verdicts">
            <div className="verdict-box deficit-verdict">
              <strong>🥗 For Calorie Deficit / Fat Loss:</strong>
              <p>{dietary?.deficitVerdict}</p>
            </div>

            <div className="verdict-box surplus-verdict">
              <strong>⚡ For Calorie Intake / Muscle Gain:</strong>
              <p>{dietary?.surplusVerdict}</p>
            </div>
          </div>

          {/* Healthy Deficit Alternatives when snack is not ideal */}
          {!dietary?.isDeficitFriendly && dietary?.suggestedDeficitAlternatives && (
            <div className="healthy-alternatives-wrap">
              <span className="alt-title">🌿 Healthier Deficit Alternatives for this Snack:</span>
              <div className="alt-chips-row">
                {dietary.suggestedDeficitAlternatives.slice(0, 3).map((alt, i) => (
                  <div key={i} className="alt-chip">
                    <strong>{alt.name}</strong>
                    <small>{alt.calories} kcal ({alt.unit})</small>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 1-Click Action to log snack to calorie tracker */}
          <div className="log-action-wrap">
            <button
              type="button"
              className={`log-tracker-btn ${loggedToTracker ? 'logged' : ''}`}
              onClick={handleLogItem}
              disabled={loggedToTracker}
            >
              {loggedToTracker ? '✓ Logged to Today\'s Calorie Tracker!' : '＋ Add This Snack to Calorie Tracker'}
            </button>
          </div>
        </div>
      )}

      {/* METROLOGY COMPLIANCE SCORE & STATS */}
      <div className="score-row">
        <div className="score-ring">
          <strong>{audit.score}</strong>
          <small>/100</small>
        </div>
        <div>
          <p className="score-label">LEGAL METROLOGY COMPLIANCE</p>
          <p className="score-copy">
            {summary.failed
              ? `${summary.failed} declaration${summary.failed > 1 ? 's' : ''} need attention.`
              : 'All mandatory declarations detected.'}
          </p>
        </div>
      </div>

      <div className="mini-stats">
        <span><b className="pass-text">{summary.passed}</b> passed</span>
        <span><b className="warning-text">{summary.warnings}</b> review</span>
        <span><b className="fail-text">{summary.failed}</b> missing</span>
      </div>

      {/* DECLARATION CHECKLIST */}
      <div className="check-list">
        {(audit?.checks || []).map((check) => (
          <div className="check-row" key={check.key}>
            <span className={`check-icon ${check.status}`}>
              {check.status === 'pass' ? '✓' : check.status === 'warning' ? '!' : '×'}
            </span>
            <span className="check-name">
              <b>{check.label}</b>
              <small>{check.evidence}</small>
            </span>
            <StatusPill status={check.status} />
          </div>
        ))}
      </div>

      <button className="report-button" onClick={handleReport} disabled={reporting}>
        {reporting ? 'Preparing report...' : 'Download evidence report (PDF) ↗'}
      </button>
    </div>
  )
}

export default AuditResults
