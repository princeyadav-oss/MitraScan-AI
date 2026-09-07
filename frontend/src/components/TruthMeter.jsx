function TruthMeter({ healthwashing }) {
  if (!healthwashing) return null

  const deceptionScore = healthwashing.deceptionScore ?? 0
  const truthScore = healthwashing.truthScore ?? (100 - deceptionScore)
  const deceptionRating = healthwashing.deceptionRating || 'Honest & Transparent'
  const badgeColor = healthwashing.badgeColor || (deceptionScore >= 50 ? 'red' : deceptionScore >= 20 ? 'amber' : 'green')
  const claimsExposed = Array.isArray(healthwashing.claimsExposed) ? healthwashing.claimsExposed : []
  const consumerAdvisory = healthwashing.consumerAdvisory || ''

  // SVG Gauge calculations
  const radius = 60
  const circumference = 2 * Math.PI * radius
  // Half-circle arc
  const halfCircumference = Math.PI * radius
  const deceptionOffset = halfCircumference - (deceptionScore / 100) * halfCircumference

  const gaugeStrokeColor =
    deceptionScore >= 50 ? '#c92a2a' : deceptionScore >= 20 ? '#d97706' : '#2b8a3e'

  return (
    <div className="truth-meter-card">
      <div className="truth-meter-header">
        <div>
          <span className="eyebrow">MARKETING & CLAIMS AUDIT</span>
          <h3 className="truth-card-title">The Truth Meter (Healthwashing Index)</h3>
          <p className="truth-card-subtitle">
            Cross-examining bold front-of-pack claims against back-of-pack ingredient realities.
          </p>
        </div>
        <span className={`truth-rating-pill badge-${badgeColor}`}>
          {deceptionRating}
        </span>
      </div>

      {/* Visual Gauge Row */}
      <div className="gauge-visual-row">
        <div className="gauge-meter-box">
          <div className="gauge-circle-outer">
            <svg className="gauge-svg" viewBox="0 0 160 95">
              {/* Background Arc */}
              <path
                d="M 20 80 A 60 60 0 0 1 140 80"
                fill="none"
                stroke="#e8efe9"
                strokeWidth="14"
                strokeLinecap="round"
              />
              {/* Deception Value Arc */}
              <path
                d="M 20 80 A 60 60 0 0 1 140 80"
                fill="none"
                stroke={gaugeStrokeColor}
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray={halfCircumference}
                strokeDashoffset={deceptionOffset}
                className="gauge-progress-arc"
              />
            </svg>
            <div className="gauge-center-text">
              <strong className="gauge-num">{deceptionScore}%</strong>
              <span className="gauge-sub">DECEPTION INDEX</span>
            </div>
          </div>
        </div>

        <div className="gauge-details-column">
          <div className="score-split-bar">
            <div className="split-item honest-stat">
              <span>TRUTH SCORE</span>
              <strong>{truthScore}%</strong>
            </div>
            <div className="split-item deceptive-stat">
              <span>DECEPTION INDEX</span>
              <strong>{deceptionScore}%</strong>
            </div>
          </div>

          {consumerAdvisory && (
            <div className="consumer-advisory-box">
              <strong>💡 Consumer Advisory:</strong>
              <p>{consumerAdvisory}</p>
            </div>
          )}
        </div>
      </div>

      {/* Exposed Claims vs Reality Comparison Grid */}
      <div className="claims-comparison-section">
        <span className="claims-subhead">
          Front-of-Pack Claim vs. Back-of-Pack Reality ({claimsExposed.length} Scanned):
        </span>

        {claimsExposed.length > 0 ? (
          <div className="claims-cards-grid">
            {claimsExposed.map((item, index) => {
              const isDeceptive = item.severity === 'deceptive'
              return (
                <div
                  key={index}
                  className={`claim-reality-card ${isDeceptive ? 'is-deceptive' : 'is-verified'}`}
                >
                  <div className="claim-top-row">
                    <span className="claim-badge-tag">
                      {isDeceptive ? '⚠️ EXPOSED CLAIM' : '✓ VERIFIED HONEST'}
                    </span>
                    <strong className="claim-text">"{item.claim}"</strong>
                  </div>
                  <div className="reality-body">
                    <span className="reality-label">
                      {isDeceptive ? 'Actual Reality:' : 'Verification:'}
                    </span>
                    <p className="reality-text">{item.reality}</p>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="no-claims-box">
            <span>✓ No aggressive or suspicious marketing slogans detected on this product label.</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default TruthMeter
