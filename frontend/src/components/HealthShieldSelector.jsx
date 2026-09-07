import { useState, useEffect } from 'react'

const STORAGE_KEY = 'mitrascan_health_shield_profile'

export const SHIELD_CONDITIONS = [
  { id: 'diabetic', label: 'Diabetic / Sugar Watch', icon: '🩸', desc: 'Flags maltodextrin, high-GI syrups & sugar' },
  { id: 'hypertension', label: 'High BP / Low Sodium', icon: '🫀', desc: 'Flags sodium > 200mg/serving & excess salt' },
  { id: 'gluten', label: 'Gluten-Free / Celiac', icon: '🌾', desc: 'Flags maida, wheat flour, barley & malt' },
  { id: 'nutAllergy', label: 'Nut & Peanut Allergy', icon: '🥜', desc: 'Flags peanuts, tree nuts & contamination' },
  { id: 'childSafe', label: 'Child-Safe (<5 yrs)', icon: '👶', desc: 'Flags artificial sweeteners & synthetic dyes' }
]

function HealthShieldSelector({ onConditionsChange }) {
  const [selectedConditions, setSelectedConditions] = useState([])

  // Load saved profile
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) {
          setSelectedConditions(parsed)
          if (onConditionsChange) onConditionsChange(parsed)
        }
      }
    } catch {
      // Ignore parse error
    }
  }, [])

  function toggleCondition(id) {
    const next = selectedConditions.includes(id)
      ? selectedConditions.filter((c) => c !== id)
      : [...selectedConditions, id]

    setSelectedConditions(next)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {}
    if (onConditionsChange) onConditionsChange(next)
  }

  return (
    <div className="health-shield-bar">
      <div className="shield-bar-header">
        <div className="shield-title-wrap">
          <span className="shield-icon">🛡️</span>
          <div>
            <strong>Personalized Health Shield</strong>
            <small>Select conditions to trigger automatic bio-safety alarms upon scanning</small>
          </div>
        </div>
        {selectedConditions.length > 0 && (
          <span className="shield-active-count">
            {selectedConditions.length} Active Shield{selectedConditions.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="shield-chips-grid">
        {SHIELD_CONDITIONS.map((cond) => {
          const isActive = selectedConditions.includes(cond.id)
          return (
            <button
              type="button"
              key={cond.id}
              className={`shield-chip ${isActive ? 'is-active' : ''}`}
              onClick={() => toggleCondition(cond.id)}
              title={cond.desc}
            >
              <span className="chip-emoji">{cond.icon}</span>
              <span className="chip-text">{cond.label}</span>
              <span className={`chip-toggle-dot ${isActive ? 'active-dot' : ''}`} />
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default HealthShieldSelector
