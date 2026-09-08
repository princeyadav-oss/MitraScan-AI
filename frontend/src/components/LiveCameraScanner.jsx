import { useEffect, useRef, useState } from 'react'

function LiveCameraScanner({ isOpen, onClose, onCapture }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const barcodeIntervalRef = useRef(null)
  const countdownIntervalRef = useRef(null)
  const captureRef = useRef(null)

  const [devices, setDevices] = useState([])
  const [selectedDeviceId, setSelectedDeviceId] = useState('')
  const [torchOn, setTorchOn] = useState(false)
  const [hasTorch, setHasTorch] = useState(false)
  const [detectedBarcode, setDetectedBarcode] = useState('')
  const [cameraError, setCameraError] = useState('')
  const [capturing, setCapturing] = useState(false)
  const [countdown, setCountdown] = useState(3)

  // Clean up all video tracks & countdown timers
  function stopStream() {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current)
      countdownIntervalRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (barcodeIntervalRef.current) {
      clearInterval(barcodeIntervalRef.current)
      barcodeIntervalRef.current = null
    }
  }

  // 3-second countdown to automatically scan product without clicking
  function startAutoScanCountdown() {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current)
      countdownIntervalRef.current = null
    }
    setCountdown(3)
    let remaining = 3

    countdownIntervalRef.current = setInterval(() => {
      remaining -= 1
      if (remaining > 0) {
        setCountdown(remaining)
      } else {
        setCountdown(0)
        clearInterval(countdownIntervalRef.current)
        countdownIntervalRef.current = null
        if (captureRef.current) {
          captureRef.current()
        }
      }
    }, 1000)
  }

  // Start camera stream
  async function startCamera(deviceId = '') {
    stopStream()
    setCameraError('')
    setDetectedBarcode('')
    setCountdown(3)

    try {
      const constraints = {
        video: deviceId
          ? { deviceId: { exact: deviceId } }
          : { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play().catch(() => {})
        // Auto-scan after 3 seconds
        startAutoScanCountdown()
      }

      // Check for torch capability
      const track = stream.getVideoTracks()[0]
      if (track && typeof track.getCapabilities === 'function') {
        const caps = track.getCapabilities()
        setHasTorch(Boolean(caps.torch))
      }

      // Enumerate cameras
      const allDevices = await navigator.mediaDevices.enumerateDevices()
      const videoInputs = allDevices.filter((d) => d.kind === 'videoinput')
      setDevices(videoInputs)
      if (!selectedDeviceId && videoInputs.length > 0) {
        const currentTrack = stream.getVideoTracks()[0]
        const currentSetting = currentTrack?.getSettings()
        if (currentSetting?.deviceId) {
          setSelectedDeviceId(currentSetting.deviceId)
        }
      }

      // Barcode detection support if available in browser
      if ('BarcodeDetector' in window) {
        try {
          const barcodeDetector = new window.BarcodeDetector({
            formats: ['qr_code', 'ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39']
          })
          barcodeIntervalRef.current = setInterval(async () => {
            if (videoRef.current && videoRef.current.readyState >= 2) {
              try {
                const codes = await barcodeDetector.detect(videoRef.current)
                if (codes && codes.length > 0) {
                  setDetectedBarcode(codes[0].rawValue)
                }
              } catch {
                // Ignore frame decode errors
              }
            }
          }, 600)
        } catch {
          // BarcodeDetector initialization optional
        }
      }
    } catch (err) {
      console.error('Camera initialization failed:', err)
      setCameraError(err.name === 'NotAllowedError'
        ? 'Camera permission denied. Please allow camera access in your browser settings.'
        : 'Could not access the camera. Make sure no other application is using it.')
    }
  }

  useEffect(() => {
    if (isOpen) {
      startCamera(selectedDeviceId)
    } else {
      stopStream()
    }
    return () => stopStream()
  }, [isOpen, selectedDeviceId])

  async function toggleTorch() {
    if (!streamRef.current || !hasTorch) return
    const track = streamRef.current.getVideoTracks()[0]
    if (!track) return
    try {
      const nextState = !torchOn
      await track.applyConstraints({ advanced: [{ torch: nextState }] })
      setTorchOn(nextState)
    } catch (err) {
      console.warn('Torch toggle failed:', err)
    }
  }

  function handleCapture() {
    if (!videoRef.current || capturing) return
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current)
      countdownIntervalRef.current = null
    }
    setCapturing(true)

    const video = videoRef.current
    const canvas = canvasRef.current || document.createElement('canvas')
    canvas.width = video.videoWidth || 1280
    canvas.height = video.videoHeight || 720

    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    canvas.toBlob((blob) => {
      setCapturing(false)
      if (blob) {
        const file = new File([blob], `live-scan-${Date.now()}.jpg`, { type: 'image/jpeg' })
        stopStream()
        onCapture(file, detectedBarcode)
        onClose()
      }
    }, 'image/jpeg', 0.95)
  }

  captureRef.current = handleCapture

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="camera-modal" onClick={(e) => e.stopPropagation()}>
        <div className="camera-modal-header">
          <div>
            <span className="camera-badge">LIVE SCANNER</span>
            <h3>Scan Product Label</h3>
          </div>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Close scanner">×</button>
        </div>

        <div className="camera-viewport-wrap">
          {cameraError ? (
            <div className="camera-error-view">
              <span className="error-icon">⚠️</span>
              <p>{cameraError}</p>
              <button type="button" className="retry-camera-btn" onClick={() => startCamera(selectedDeviceId)}>
                Retry Camera
              </button>
            </div>
          ) : (
            <>
              <video ref={videoRef} autoPlay playsInline muted className="camera-video-stream" />
              <canvas ref={canvasRef} style={{ display: 'none' }} />

              {/* Auto-Scan 3-Second Floating Badge */}
              <div className="auto-scan-pill">
                <span className="pulsing-record-dot" />
                <span>
                  Auto-scanning in <strong>{countdown > 0 ? `${countdown}s` : 'capturing...'}</strong>
                </span>
              </div>

              {/* Viewfinder Reticle & Laser Beam */}
              <div className="scanner-reticle">
                <div className="reticle-corner top-left" />
                <div className="reticle-corner top-right" />
                <div className="reticle-corner bottom-left" />
                <div className="reticle-corner bottom-right" />
                <div className="scanner-laser" />

                {countdown > 0 && !capturing && (
                  <div className="countdown-display">
                    <div className="countdown-ring">
                      <span className="countdown-number">{countdown}</span>
                    </div>
                    <p className="countdown-label">Auto-scanning product...</p>
                  </div>
                )}
              </div>

              {detectedBarcode && (
                <div className="barcode-detected-pill">
                  <span>Detected Code:</span>
                  <strong>{detectedBarcode}</strong>
                </div>
              )}
            </>
          )}
        </div>

        <div className="camera-modal-footer">
          <div className="camera-controls-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {devices.length > 1 && (
                <select
                  className="camera-select"
                  value={selectedDeviceId}
                  onChange={(e) => setSelectedDeviceId(e.target.value)}
                >
                  {devices.map((device, idx) => (
                    <option key={device.deviceId || idx} value={device.deviceId}>
                      {device.label || `Camera ${idx + 1}`}
                    </option>
                  ))}
                </select>
              )}

              <button
                type="button"
                className="restart-timer-btn"
                onClick={startAutoScanCountdown}
                title="Restart 3-second auto-scan timer"
                disabled={capturing || Boolean(cameraError)}
              >
                ⏱️ Restart (3s)
              </button>
            </div>

            {hasTorch && (
              <button
                type="button"
                className={`torch-btn ${torchOn ? 'is-active' : ''}`}
                onClick={toggleTorch}
                title="Toggle Torch/Flash"
              >
                {torchOn ? '🔦 Torch ON' : '💡 Torch'}
              </button>
            )}
          </div>

          <div className="camera-action-row">
            <button type="button" className="secondary-button cancel-camera-btn" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="primary-button capture-btn"
              disabled={Boolean(cameraError) || capturing}
              onClick={handleCapture}
            >
              {capturing
                ? '⏳ Capturing & Analyzing...'
                : countdown > 0
                ? `📸 Auto-scanning (${countdown}s) · Click to Snap Now`
                : '📸 Snap & Analyze Product'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LiveCameraScanner
