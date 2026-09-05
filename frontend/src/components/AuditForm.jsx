import { useState } from 'react'

const sampleText = `BISCUITS
Manufactured and packed by Sunrise Foods Pvt Ltd, 14 Industrial Estate, Pune 411019, India
Net Quantity: 200 g
Mfg: August 2026
MRP: ₹85.00 (inclusive of all taxes)
Consumer care: care@sunrisefoods.in | Helpline: 18001234567 | 14 Industrial Estate, Pune 411019
Country of Origin: India`

function AuditForm({ loading, message, onImageAudit, onUrlAudit }) {
  const [image, setImage] = useState(null)
  const [ocrText, setOcrText] = useState('')
  const [productName, setProductName] = useState('')
  const [inspector, setInspector] = useState('Field inspector')
  const [location, setLocation] = useState('')
  const [productUrl, setProductUrl] = useState('')
  const [sourceMode, setSourceMode] = useState('')

  function submitImageAudit(event) {
    event.preventDefault()
    if (!image && !ocrText.trim()) return
    const formData = new FormData()
    formData.append('ocrText', ocrText); formData.append('productName', productName); formData.append('inspector', inspector); formData.append('location', location)
    if (image) formData.append('labelImage', image)
    onImageAudit(formData)
  }

  function submitUrlAudit(event) {
    event.preventDefault()
    onUrlAudit({ url: productUrl, inspector, location })
  }

  function loadSample() {
    setSourceMode('text'); setOcrText(sampleText); setImage(null); setProductName('Sunrise Biscuits'); setLocation('Pune, Maharashtra')
  }

  function resetSource() {
    setSourceMode(''); setImage(null); setOcrText(''); setProductUrl(''); setProductName(''); setLocation('')
  }

  return <section className="panel capture-panel"><div className="panel-heading"><div><p className="section-kicker">NEW INSPECTION</p><h2>Capture a label</h2></div><span className="step-badge">STEP 01 / 02</span></div>
    <div className="source-status"><span>{sourceMode ? `Source selected: ${sourceMode === 'image' ? 'label image' : sourceMode === 'text' ? 'OCR text' : 'product URL'}` : 'Choose one evidence source'}</span>{sourceMode && <button type="button" className="reset-button" onClick={resetSource}>Reset</button>}</div>
    <form onSubmit={submitImageAudit}><label className={`upload-box ${sourceMode && sourceMode !== 'image' ? 'is-disabled' : ''}`}><input type="file" accept="image/*" disabled={Boolean(sourceMode && sourceMode !== 'image')} onChange={(event) => { setImage(event.target.files[0]); setSourceMode('image') }} /><span className="upload-icon">＋</span><strong>{image ? image.name : 'Drop label image here'}</strong><small>{sourceMode && sourceMode !== 'image' ? 'Reset the current source to use an image' : 'JPG, PNG · max 8 MB'}</small></label><div className="or-divider"><span>or paste OCR text</span></div><textarea disabled={Boolean(sourceMode && sourceMode !== 'text')} value={ocrText} onChange={(event) => { setOcrText(event.target.value); setSourceMode(event.target.value.trim() ? 'text' : '') }} placeholder="Paste extracted label text here to run the compliance engine..." rows="7" /><div className="form-row"><label>Product name<input value={productName} onChange={(event) => setProductName(event.target.value)} placeholder="Optional" /></label><label>Inspection location<input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="City, state" /></label></div><div className="form-row"><label>Inspector<input value={inspector} onChange={(event) => setInspector(event.target.value)} /></label><button type="button" className="text-button" onClick={loadSample}>Use sample label ↗</button></div><button className="primary-button" type="submit" disabled={loading || !sourceMode || sourceMode === 'url'}>{loading ? 'Analyzing label...' : 'Run compliance audit  →'}</button>{message && <p className="message">{message}</p>}</form>
    <form className="url-audit-form" onSubmit={submitUrlAudit}><p className="section-kicker">E-COMMERCE AUDIT</p><label>Product page URL<input type="url" value={productUrl} disabled={Boolean(sourceMode && sourceMode !== 'url')} onChange={(event) => { setProductUrl(event.target.value); setSourceMode(event.target.value.trim() ? 'url' : '') }} placeholder="https://amazon.in/... or https://flipkart.com/..." required /></label><button className="secondary-button" type="submit" disabled={loading || sourceMode !== 'url'}>Audit product page ↗</button></form>
  </section>
}

export default AuditForm
