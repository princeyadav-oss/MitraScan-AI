import { useState, useEffect } from 'react'
import LiveCameraScanner from './LiveCameraScanner'

const sampleText = `BISCUITS
Manufactured and packed by Sunrise Foods Pvt Ltd, 14 Industrial Estate, Pune 411019, India
Net Quantity: 200 g
Mfg: August 2026
MRP: ₹85.00 (inclusive of all taxes)
Consumer care: care@sunrisefoods.in | Helpline: 18001234567 | 14 Industrial Estate, Pune 411019
Country of Origin: India`

const healthwashingSampleText = `HEALTHY ZERO SUGAR OATS DIGESTIVE BISCUITS
Front Claim: 100% Natural, Zero Added Sugar, Rich in Oats & High Fiber, Heart Healthy
Manufactured by NutriLife Foods Ltd, Plot 45, Sector 8, Gurugram, Haryana 122001
Ingredients: Refined Wheat Flour (Maida) 56%, Saturated Palm Oil 21%, Maltodextrin (Invert Syrup), Whole Grain Oats 2%, Artificial Sweetener Sucralose (INS 955), Raising Agents (INS 500ii), Synthetic Color Tartrazine (E102), Sodium Benzoate (E211).
Net Quantity: 150 g
Energy: 485 kcal per 100g | Protein: 4.5g | Carbohydrates: 68g | Sugars: 12g | Total Fat: 22g | Sodium: 480mg
MRP: ₹60.00 (inclusive of all taxes)
Mfg: August 2026
Consumer care: care@nutrilife.in | Helpline: 18009876543
Country of Origin: India`

function AuditForm({ user, loading, message, onImageAudit, onUrlAudit, onResetAudit, hasActiveAudit, resetSignal }) {
  const [image, setImage] = useState(null)
  const [ocrText, setOcrText] = useState('')
  const [productName, setProductName] = useState('')
  const [inspector, setInspector] = useState(user?.name || 'Field inspector')
  const [location, setLocation] = useState('')
  const [productUrl, setProductUrl] = useState('')
  const [sourceMode, setSourceMode] = useState('')

  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const [detectingLocation, setDetectingLocation] = useState(false)
  const [locationBadge, setLocationBadge] = useState('')

  // Reset inputs when parent triggers a reset signal
  useEffect(() => {
    if (resetSignal) {
      setSourceMode('')
      setImage(null)
      setOcrText('')
      setProductUrl('')
      setProductName('')
    }
  }, [resetSignal])

  // Auto-fill inspector when user object is available
  useEffect(() => {
    if (user?.name) {
      setInspector(user.name)
    }
  }, [user])

  // Auto-detect and fill city & state directly on mount
  useEffect(() => {
    detectLocation()
  }, [])

  async function detectLocation() {
    setDetectingLocation(true)
    setLocationBadge('Detecting...')

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
              { headers: { 'Accept': 'application/json' } }
            )
            if (res.ok) {
              const data = await res.json()
              const addr = data.address || {}
              const city = addr.city || addr.town || addr.village || addr.county || addr.state_district || ''
              const state = addr.state || addr.country || ''
              const detected = [city, state].filter(Boolean).join(', ')
              if (detected) {
                setLocation(detected)
                setLocationBadge('Auto-filled directly')
                setDetectingLocation(false)
                return
              }
            }
          } catch (e) {
            console.warn('Reverse geocoding error:', e)
          }
          fallbackIpLocation()
        },
        () => {
          fallbackIpLocation()
        },
        { timeout: 7000, enableHighAccuracy: true }
      )
    } else {
      fallbackIpLocation()
    }
  }

  async function fallbackIpLocation() {
    try {
      const res = await fetch('https://ipapi.co/json/')
      if (res.ok) {
        const data = await res.json()
        const detected = [data.city, data.region].filter(Boolean).join(', ')
        if (detected) {
          setLocation(detected)
          setLocationBadge('Auto-filled directly')
          setDetectingLocation(false)
          return
        }
      }
    } catch (e) {
      console.warn('IP geolocation error:', e)
    }
    setLocationBadge('')
    setDetectingLocation(false)
  }

  function handleOcrChange(text) {
    setOcrText(text)
    setSourceMode(text.trim() ? 'text' : '')

    // Directly auto-fill product name if empty
    if (!productName && text.trim()) {
      const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
      if (lines.length > 0 && lines[0].length < 35 && !lines[0].includes(':')) {
        setProductName(lines[0])
      }
    }
  }

  function handleLiveCapture(file, barcode) {
    setImage(file)
    setSourceMode('image')
    const determinedName = productName || (barcode ? `Product [${barcode}]` : 'Product Detected')
    if (determinedName) setProductName(determinedName)

    const formData = new FormData()
    formData.append('ocrText', ocrText)
    formData.append('productName', determinedName)
    formData.append('inspector', inspector)
    formData.append('location', location)
    formData.append('labelImage', file)
    onImageAudit(formData)
  }

  function submitImageAudit(event) {
    event.preventDefault()
    if (!image && !ocrText.trim()) return
    const formData = new FormData()
    formData.append('ocrText', ocrText)
    formData.append('productName', productName || 'Product Detected')
    formData.append('inspector', inspector)
    formData.append('location', location)
    if (image) formData.append('labelImage', image)
    onImageAudit(formData)
  }

  function submitUrlAudit(event) {
    event.preventDefault()
    onUrlAudit({ url: productUrl, inspector, location })
  }

  function loadSample() {
    setSourceMode('text')
    setOcrText(sampleText)
    setImage(null)
    setProductName('Sunrise Biscuits')
    if (!location) setLocation('Pune, Maharashtra')
  }

  function loadHealthwashingSample() {
    setSourceMode('text')
    setOcrText(healthwashingSampleText)
    setImage(null)
    setProductName('Healthy Zero Sugar Oats Biscuits')
    if (!location) setLocation('Gurugram, Haryana')
  }

  function resetSource() {
    setSourceMode('')
    setImage(null)
    setOcrText('')
    setProductUrl('')
    setProductName('')
    if (onResetAudit) {
      onResetAudit()
    }
  }

  return (
    <section className="panel capture-panel">
      <div className="panel-heading">
        <div>
          <p className="section-kicker">NEW INSPECTION</p>
          <h2>Capture a label</h2>
        </div>
        <span className="step-badge">STEP 01 / 02</span>
      </div>

      <div className="source-status">
        <span>
          {sourceMode
            ? `Source selected: ${sourceMode === 'image' ? 'label image' : sourceMode === 'text' ? 'OCR text' : 'product URL'}`
            : 'Choose camera scan, file upload, or OCR text'}
        </span>
        {(sourceMode || hasActiveAudit) && (
          <button type="button" className="reset-button" onClick={resetSource} title="Reset current inputs and latest audit details">
            Reset
          </button>
        )}
      </div>

      {/* Live Camera Scanner Quick Action */}
      <div className="live-camera-cta-box">
        <button
          type="button"
          className="live-camera-button"
          onClick={() => setIsCameraOpen(true)}
          disabled={loading}
        >
          <span className="cam-icon">📷</span>
          <div className="cam-text">
            <strong>Open Live Camera Scanner</strong>
            <small>Point your camera directly at the product packet or barcode</small>
          </div>
          <span className="cam-arrow">→</span>
        </button>
      </div>

      <form onSubmit={submitImageAudit}>
        <label className={`upload-box ${sourceMode && sourceMode !== 'image' ? 'is-disabled' : ''}`}>
          <input
            type="file"
            accept="image/*"
            disabled={Boolean(sourceMode && sourceMode !== 'image')}
            onChange={(event) => {
              setImage(event.target.files[0])
              setSourceMode('image')
            }}
          />
          <span className="upload-icon">＋</span>
          <strong>{image ? image.name : 'Or drop / select label image here'}</strong>
          <small>
            {sourceMode && sourceMode !== 'image'
              ? 'Reset the current source to use an image'
              : 'JPG, PNG, WEBP · max 8 MB'}
          </small>
        </label>

        <div className="or-divider">
          <span>or paste OCR text</span>
        </div>

        <textarea
          disabled={Boolean(sourceMode && sourceMode !== 'text')}
          value={ocrText}
          onChange={(event) => handleOcrChange(event.target.value)}
          placeholder="Paste extracted label text or ingredients here to run compliance & health screening..."
          rows="6"
        />

        <div className="form-row">
          <label>
            Product name
            <input
              value={productName}
              onChange={(event) => setProductName(event.target.value)}
              placeholder="e.g. Sunrise Biscuits"
            />
          </label>

          <label className="location-label">
            <div className="label-with-action">
              <span>Inspection city / location</span>
              <button
                type="button"
                className="detect-loc-btn"
                onClick={detectLocation}
                disabled={detectingLocation}
                title="Auto-detect current location"
              >
                📍 {detectingLocation ? 'Detecting...' : locationBadge || 'Detect'}
              </button>
            </div>
            <input
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="City, State (auto-filled directly)"
            />
          </label>
        </div>

        <div className="form-row">
          <label>
            Inspector
            <input
              value={inspector}
              onChange={(event) => setInspector(event.target.value)}
            />
          </label>
          <div className="sample-buttons-row">
            <button type="button" className="text-button" onClick={loadSample}>
              Standard Metrology Label ↗
            </button>
            <button type="button" className="text-button highlight-sample-btn" onClick={loadHealthwashingSample}>
              🎯 Try Truth Meter Sample ↗
            </button>
          </div>
        </div>

        <button
          className="primary-button"
          type="submit"
          disabled={loading || !sourceMode || sourceMode === 'url'}
        >
          {loading ? 'Analyzing label & health risks...' : 'Run compliance & health audit  →'}
        </button>

        {message && <p className="message">{message}</p>}
      </form>

      <form className="url-audit-form" onSubmit={submitUrlAudit}>
        <p className="section-kicker">E-COMMERCE AUDIT</p>
        <label>
          Product page URL
          <input
            type="url"
            value={productUrl}
            disabled={Boolean(sourceMode && sourceMode !== 'url')}
            onChange={(event) => {
              setProductUrl(event.target.value)
              setSourceMode(event.target.value.trim() ? 'url' : '')
            }}
            placeholder="https://amazon.in/... or https://flipkart.com/..."
            required
          />
        </label>
        <button
          className="secondary-button"
          type="submit"
          disabled={loading || sourceMode !== 'url'}
        >
          Audit product page ↗
        </button>
      </form>

      {/* Live Camera Modal */}
      <LiveCameraScanner
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleLiveCapture}
      />
    </section>
  )
}

export default AuditForm
