import { useState, useEffect } from 'react'

const STORAGE_KEY = 'mitrascan_calorie_tracker'

const DEFAULT_TARGETS = {
  deficit: 1700,
  surplus: 2600,
  maintenance: 2100
}

const HEALTHY_SNACK_IDEAS = [
  { name: 'Roasted Makhana (Foxnuts)', calories: 95, cal: '95 kcal', tag: 'High Satiety', icon: '🌰', protein: 3, carbs: 19, fat: 0.5 },
  { name: 'Sprouted Moong Chaat', calories: 110, cal: '110 kcal', tag: 'High Protein & Fiber', icon: '🥗', protein: 8, carbs: 17, fat: 0.5 },
  { name: 'Air-Popped Spiced Popcorn', calories: 85, cal: '85 kcal', tag: 'High Volume', icon: '🍿', protein: 3, carbs: 16, fat: 1 },
  { name: 'Roasted Bengal Gram (Chana)', calories: 120, cal: '120 kcal', tag: 'Slow Carbs', icon: '🌾', protein: 7, carbs: 19, fat: 2 },
  { name: 'Greek Yogurt + Berries', calories: 120, cal: '120 kcal', tag: '15g Protein', icon: '🫐', protein: 12, carbs: 11, fat: 1 },
  { name: 'Baked Ragi / Oats Crisps', calories: 105, cal: '105 kcal', tag: 'Low GI', icon: '🍘', protein: 3, carbs: 16, fat: 1.5 }
]

function CalorieTracker({ scannedItemToLog, onClearScannedLog }) {
  const [goal, setGoal] = useState('deficit') // 'deficit' | 'surplus' | 'maintenance'
  const [targetCalories, setTargetCalories] = useState(DEFAULT_TARGETS.deficit)
  const [isEditingTarget, setIsEditingTarget] = useState(false)
  const [loggedItems, setLoggedItems] = useState([])
  const [customItemName, setCustomItemName] = useState('')
  const [customCalories, setCustomCalories] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.goal) setGoal(parsed.goal)
        if (parsed.targetCalories) setTargetCalories(parsed.targetCalories)
        if (Array.isArray(parsed.loggedItems)) setLoggedItems(parsed.loggedItems)
      }
    } catch (err) {
      console.warn('Could not load calorie tracker state:', err)
    }
  }, [])

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ goal, targetCalories, loggedItems }))
    } catch (err) {
      console.warn('Could not save calorie tracker state:', err)
    }
  }, [goal, targetCalories, loggedItems])

  // Handle log item passed from audit result
  useEffect(() => {
    if (scannedItemToLog && scannedItemToLog.name && scannedItemToLog.calories) {
      const newItem = {
        id: 'log-' + Date.now(),
        name: scannedItemToLog.name,
        calories: Number(scannedItemToLog.calories) || 0,
        protein: scannedItemToLog.protein || 0,
        carbs: scannedItemToLog.carbs || 0,
        fat: scannedItemToLog.fat || 0,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
      setLoggedItems((prev) => [newItem, ...prev])
      if (onClearScannedLog) onClearScannedLog()
    }
  }, [scannedItemToLog, onClearScannedLog])

  function handleGoalChange(newGoal) {
    setGoal(newGoal)
    setTargetCalories(DEFAULT_TARGETS[newGoal] || 2000)
  }

  function handleAddCustomItem(e) {
    e.preventDefault()
    if (!customItemName.trim() || !customCalories) return
    const newItem = {
      id: 'log-' + Date.now(),
      name: customItemName.trim(),
      calories: parseInt(customCalories, 10) || 0,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    setLoggedItems((prev) => [newItem, ...prev])
    setCustomItemName('')
    setCustomCalories('')
    setShowAddForm(false)
  }

  function removeItem(id) {
    setLoggedItems((prev) => prev.filter((item) => item.id !== id))
  }

  function clearAllLogs() {
    if (window.confirm("Clear today's logged snacks?")) {
      setLoggedItems([])
    }
  }

  function handleLogQuickSnack(snack) {
    const newItem = {
      id: 'log-' + Date.now(),
      name: snack.name,
      calories: snack.calories || parseInt(snack.cal, 10) || 0,
      protein: snack.protein || 0,
      carbs: snack.carbs || 0,
      fat: snack.fat || 0,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    setLoggedItems((prev) => [newItem, ...prev])
  }

  const totalConsumed = loggedItems.reduce((acc, cur) => acc + (cur.calories || 0), 0)
  const remainingCalories = targetCalories - totalConsumed
  const percentConsumed = Math.min(100, Math.round((totalConsumed / Math.max(1, targetCalories)) * 100))

  const isOverBudget = remainingCalories < 0

  return (
    <div className="panel calorie-tracker-panel">
      <div className="panel-heading">
        <div>
          <p className="section-kicker">NUTRITION & CALORIE LOG</p>
          <h2>Smart Calorie Tracker</h2>
        </div>
        <div className="goal-toggle-group">
          <button
            type="button"
            className={`goal-btn ${goal === 'deficit' ? 'active' : ''}`}
            onClick={() => handleGoalChange('deficit')}
          >
            🥗 Calorie Deficit
          </button>
          <button
            type="button"
            className={`goal-btn ${goal === 'surplus' ? 'active' : ''}`}
            onClick={() => handleGoalChange('surplus')}
          >
            ⚡ Calorie Intake / Bulk
          </button>
          <button
            type="button"
            className={`goal-btn ${goal === 'maintenance' ? 'active' : ''}`}
            onClick={() => handleGoalChange('maintenance')}
          >
            ⚖️ Maintenance
          </button>
        </div>
      </div>

      {/* Target & Budget Summary Card */}
      <div className="tracker-summary-card">
        <div className="tracker-metrics-grid">
          <div className="metric-box">
            <span className="metric-label">DAILY GOAL</span>
            {isEditingTarget ? (
              <div className="inline-edit-target">
                <input
                  type="number"
                  value={targetCalories}
                  onChange={(e) => setTargetCalories(Math.max(500, parseInt(e.target.value, 10) || 0))}
                  onBlur={() => setIsEditingTarget(false)}
                  autoFocus
                />
              </div>
            ) : (
              <div className="metric-value-wrap" onClick={() => setIsEditingTarget(true)} title="Click to edit target">
                <span className="metric-value">{targetCalories}</span>
                <span className="metric-unit">kcal ✎</span>
              </div>
            )}
          </div>

          <div className="metric-box">
            <span className="metric-label">CONSUMED TODAY</span>
            <span className="metric-value consumed-val">{totalConsumed}</span>
            <span className="metric-unit">kcal</span>
          </div>

          <div className={`metric-box ${isOverBudget ? 'is-over' : 'is-good'}`}>
            <span className="metric-label">{isOverBudget ? 'OVER BUDGET' : 'BUDGET REMAINING'}</span>
            <span className="metric-value remaining-val">{Math.abs(remainingCalories)}</span>
            <span className="metric-unit">kcal</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="calorie-progress-wrap">
          <div className="progress-labels">
            <span>Calorie Budget Utilized</span>
            <strong>{percentConsumed}%</strong>
          </div>
          <div className="progress-track">
            <div
              className={`progress-fill ${isOverBudget ? 'over-budget' : goal === 'deficit' ? 'deficit-fill' : 'surplus-fill'}`}
              style={{ width: `${percentConsumed}%` }}
            />
          </div>
        </div>
      </div>

      {/* Logged items list */}
      <div className="logged-items-section">
        <div className="section-subhead">
          <span>Today's Logged Snacks ({loggedItems.length})</span>
          <div className="subhead-actions">
            <button type="button" className="text-button" onClick={() => setShowAddForm(!showAddForm)}>
              {showAddForm ? 'Cancel' : '＋ Add Manual Item'}
            </button>
            {loggedItems.length > 0 && (
              <button type="button" className="clear-btn" onClick={clearAllLogs}>
                Clear All
              </button>
            )}
          </div>
        </div>

        {showAddForm && (
          <form className="manual-item-form" onSubmit={handleAddCustomItem}>
            <input
              type="text"
              placeholder="Snack or food name"
              value={customItemName}
              onChange={(e) => setCustomItemName(e.target.value)}
              required
            />
            <input
              type="number"
              placeholder="Calories (kcal)"
              value={customCalories}
              onChange={(e) => setCustomCalories(e.target.value)}
              required
            />
            <button type="submit" className="primary-button small-btn">Add</button>
          </form>
        )}

        {loggedItems.length === 0 ? (
          <div className="empty-logs">
            <p>No snacks logged today yet. Scan any product and click <b>"+ Add This Snack to Calorie Tracker"</b> or <b>"+ Log Swap"</b> to track automatically!</p>
          </div>
        ) : (
          <div className="logged-items-list">
            {loggedItems.map((item) => (
              <div className="log-row" key={item.id}>
                <div className="log-info">
                  <span className="log-name">{item.name}</span>
                  <span className="log-meta">
                    {item.time} {item.protein ? `· ${item.protein}g P` : ''} {item.carbs ? `· ${item.carbs}g C` : ''}
                  </span>
                </div>
                <div className="log-right">
                  <span className="log-cal"><b>{item.calories}</b> kcal</span>
                  <button type="button" className="remove-item-btn" onClick={() => removeItem(item.id)} title="Delete item">×</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Suggested Deficit Snacks Quick Library */}
      <div className="deficit-recommendations-box">
        <span className="rec-title">💡 Smart Calorie Deficit Snack Ideas (&lt;130 kcal):</span>
        <div className="rec-chips-grid">
          {HEALTHY_SNACK_IDEAS.map((snack, idx) => (
            <button
              type="button"
              className="rec-chip"
              key={idx}
              onClick={() => handleLogQuickSnack(snack)}
              title={`Click to log ${snack.name} directly`}
            >
              <span className="chip-icon">{snack.icon}</span>
              <div className="chip-details">
                <strong>{snack.name}</strong>
                <small>{snack.cal} · {snack.tag}</small>
              </div>
              <span className="chip-add-action">＋</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default CalorieTracker
