import { useState, useEffect } from 'react'
import {
  SUPPORTED_LANGUAGES,
  speakAuditResult,
  stopSpeech
} from '../services/voiceAlert'

const LANG_STORAGE_KEY = 'mitrascan_voice_lang'
const AUTOSPEAK_STORAGE_KEY = 'mitrascan_autospeak'

function VoiceAssistantBar({ audit, selectedShields = [] }) {
  const [selectedLang, setSelectedLang] = useState('hi-IN')
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [autoSpeak, setAutoSpeak] = useState(false)

  // Load preferences
  useEffect(() => {
    try {
      const savedLang = localStorage.getItem(LANG_STORAGE_KEY)
      if (savedLang) setSelectedLang(savedLang)

      const savedAuto = localStorage.getItem(AUTOSPEAK_STORAGE_KEY)
      if (savedAuto) setAutoSpeak(savedAuto === 'true')
    } catch {}
  }, [])

  // Auto-speak when new audit arrives if enabled
  useEffect(() => {
    if (autoSpeak && audit) {
      handleSpeak()
    }
    return () => stopSpeech()
  }, [audit?.id])

  function handleLangChange(code) {
    setSelectedLang(code)
    try {
      localStorage.setItem(LANG_STORAGE_KEY, code)
    } catch {}
  }

  function handleAutoSpeakToggle() {
    const next = !autoSpeak
    setAutoSpeak(next)
    try {
      localStorage.setItem(AUTOSPEAK_STORAGE_KEY, String(next))
    } catch {}
  }

  function handleSpeak() {
    if (!audit) return
    speakAuditResult(
      audit,
      selectedLang,
      selectedShields,
      () => setIsSpeaking(true),
      () => setIsSpeaking(false)
    )
  }

  function handleStop() {
    stopSpeech()
    setIsSpeaking(false)
  }

  return (
    <div className="voice-assistant-bar">
      <div className="voice-bar-left">
        <span className="voice-agent-icon">🗣️</span>
        <div>
          <strong className="voice-bar-title">Regional Voice Assistant</strong>
          <small className="voice-bar-desc">Hear audio findings in your native language</small>
        </div>
      </div>

      <div className="voice-bar-controls">
        <select
          className="voice-lang-select"
          value={selectedLang}
          onChange={(e) => handleLangChange(e.target.value)}
        >
          {SUPPORTED_LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.label}
            </option>
          ))}
        </select>

        {isSpeaking ? (
          <button type="button" className="voice-stop-btn" onClick={handleStop}>
            <span className="soundwave-anim">
              <span className="bar b1" />
              <span className="bar b2" />
              <span className="bar b3" />
            </span>
            <b>Stop</b>
          </button>
        ) : (
          <button
            type="button"
            className="voice-speak-btn"
            onClick={handleSpeak}
            disabled={!audit}
          >
            <span>🔊</span>
            <b>{selectedLang === 'hi-IN' ? 'बोल कर सुनाएं' : 'Read Aloud'}</b>
          </button>
        )}

        <label className="autospeak-toggle" title="Automatically speak whenever a new scan completes">
          <input
            type="checkbox"
            checked={autoSpeak}
            onChange={handleAutoSpeakToggle}
          />
          <span>Auto-read</span>
        </label>
      </div>
    </div>
  )
}

export default VoiceAssistantBar
