/**
 * Audio Alert Utility for Health & Suspicious Ingredient Detection
 * Uses the Web Audio API to synthesize an alert beep sound.
 */

let audioContext = null;
let isMuted = false;

function getAudioContext() {
  if (!audioContext || audioContext.state === 'closed') {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      audioContext = new AudioCtx();
    }
  }
  if (audioContext && audioContext.state === 'suspended') {
    audioContext.resume().catch(() => {});
  }
  return audioContext;
}

/**
 * Plays a multi-pulse warning beep sequence (high-low-high alert)
 * notifying the person that suspicious/harmful ingredients were detected.
 */
export function playHealthAlertBeep() {
  if (isMuted) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    // Multi-pulse alert pattern: 880Hz (A5) -> 659Hz (E5) -> 880Hz (A5)
    const tones = [
      { freq: 880, start: 0.0, duration: 0.14 },
      { freq: 659, start: 0.18, duration: 0.14 },
      { freq: 880, start: 0.36, duration: 0.22 }
    ];

    tones.forEach(({ freq, start, duration }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + start);

      gain.gain.setValueAtTime(0.001, now + start);
      gain.gain.linearRampToValueAtTime(0.28, now + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + start);
      osc.stop(now + start + duration);
    });
  } catch (error) {
    console.warn('Audio alert could not be played:', error);
  }
}

/**
 * Test beep for manual verification or volume check
 */
export function testAlertBeep() {
  playHealthAlertBeep();
}

export function setMuteState(muted) {
  isMuted = Boolean(muted);
  return isMuted;
}

export function getMuteState() {
  return isMuted;
}
