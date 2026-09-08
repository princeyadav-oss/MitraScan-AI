/**
 * Multilingual Regional Voice Assistant Service
 * Uses Web Speech API (window.speechSynthesis) to speak out findings in
 * Hindi, Marathi, Tamil, Telugu, Bengali, and English.
 */

export const SUPPORTED_LANGUAGES = [
  { code: 'hi-IN', langKey: 'hi', label: 'Hindi (हिन्दी)' },
  { code: 'en-IN', langKey: 'en', label: 'English (India)' },
  { code: 'mr-IN', langKey: 'mr', label: 'Marathi (मराठी)' },
  { code: 'ta-IN', langKey: 'ta', label: 'Tamil (தமிழ்)' },
  { code: 'te-IN', langKey: 'te', label: 'Telugu (తెలుగు)' },
  { code: 'bn-IN', langKey: 'bn', label: 'Bengali (বাংলা)' }
];

let activeUtterance = null;

export function stopSpeech() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    activeUtterance = null;
  }
}

/**
 * Builds natural regional language alert text based on audit results
 */
export function generateSpeechScript(audit, langKey = 'hi', selectedShields = []) {
  const name = (!audit?.productName || audit.productName === 'Not detected') ? 'Product Detected' : audit.productName;
  const health = audit?.healthAnalysis;
  const hw = audit?.healthwashing;
  const hs = audit?.healthShield;
  const isFailed = audit?.status === 'Non-compliant';
  const hasDeception = hw && hw.deceptionScore >= 40;
  const hasSuspicious = health?.suspiciousIngredients?.hasSuspiciousIngredients;

  // Check if any user-selected health shield condition was triggered
  const relevantShieldAlerts = (hs?.triggeredList || []).filter((r) =>
    selectedShields.length === 0 || selectedShields.includes(r.id)
  );

  switch (langKey) {
    case 'hi': { // Hindi
      let script = `मित्रास्कैन विश्लेषण: ${name}। `;
      if (hasDeception) {
        script += `सावधान! इस पैकेट पर भ्रामक स्वास्थ्य दावे पाए गए हैं। डिसेप्शन स्कोर ${hw.deceptionScore} प्रतिशत है। `;
      }
      if (relevantShieldAlerts.length > 0) {
        const condNames = relevantShieldAlerts.map((r) => r.label).join(', ');
        script += `स्वास्थ्य चेतावनी! आपके चुने गए प्रोफाइल ${condNames} के लिए यह उत्पाद हानिकारक हो सकता है। `;
      } else if (hasSuspicious) {
        script += `इस उत्पाद में पाम ऑयल या अस्वास्थ्यकर रसायन मिलाए गए हैं। `;
      }
      if (isFailed) {
        script += `लीगल मेट्रोलॉजी नियमों के अनुसार कुछ अनिवार्य जानकारियां गायब हैं। `;
      } else if (!hasDeception && relevantShieldAlerts.length === 0) {
        script += `यह उत्पाद लीगल मेट्रोलॉजी नियमों के अनुसार प्रमाणित और संतुलित पाया गया है। `;
      }
      return script;
    }

    case 'mr': { // Marathi
      let script = `मित्रास्कॅन तपासणी: ${name}. `;
      if (relevantShieldAlerts.length > 0) {
        script += `आरोग्य इशारा! तुमच्या निवडलेल्या आरोग्य प्रोफाइलसाठी हे उत्पादन अपायकारक ठरू शकते. `;
      }
      if (isFailed) {
        script += `कायदेशीर नियमांनुसार आवश्यक माहिती पॅकेटवर आढळली नाही. `;
      }
      return script;
    }

    case 'ta': { // Tamil
      let script = `மித்ராஸ்கேன் ஆய்வு: ${name}. `;
      if (relevantShieldAlerts.length > 0) {
        script += `உடல்நல எச்சரிக்கை! இந்த தயாரிப்பு உங்கள் உடல்நலத்திற்கு தீங்கு விளைவிக்கலாம். `;
      }
      if (isFailed) {
        script += `कायदेशीर नियमांनुसार आवश्यक माहिती पॅकेटवर आढळली नाही. `;
      }
      return script;
    }

    case 'te': { // Telugu
      let script = `మిత్రాస్కాన్ రిపోర్ట్: ${name}. `;
      if (relevantShieldAlerts.length > 0) {
        script += `ఆరోగ్య హెచ్చరిక! ఈ ఉత్పత్తి మీ ఆరోగ్యానికి మంచిది కాదు. `;
      }
      return script;
    }

    case 'bn': { // Bengali
      let script = `মিত্রাস্ক্যান রিপোর্ট: ${name}. `;
      if (relevantShieldAlerts.length > 0) {
        script += `স্বাস্থ্য সতর্কতা! আপনার নির্বাচিত প্রোফাইলের জন্য এটি ক্ষতিকারক হতে পারে। `;
      }
      return script;
    }

    case 'en':
    default: { // English
      let script = `MitraScan audit for ${name}. `;
      if (hasDeception) {
        script += `Warning: Deception index is ${hw.deceptionScore} percent. Front-of-pack marketing claims contradict back-of-pack ingredients. `;
      }
      if (relevantShieldAlerts.length > 0) {
        const conds = relevantShieldAlerts.map((r) => r.label).join(', ');
        script += `Health Shield Alert: High risk detected for ${conds}. `;
      } else if (hasSuspicious) {
        script += `Suspicious additives including palm oil or chemical preservatives were detected. `;
      }
      if (isFailed) {
        script += `Metrology compliance failed with missing mandatory declarations. `;
      } else if (!hasDeception && relevantShieldAlerts.length === 0) {
        script += `Compliance score is ${audit?.score || 0} percent. Product declarations are verified. `;
      }
      return script;
    }
  }
}

/**
 * Speaks out the audit results using native browser SpeechSynthesis
 */
export function speakAuditResult(audit, langCode = 'hi-IN', selectedShields = [], onStart, onEnd) {
  if (!('speechSynthesis' in window) || !audit) return;

  stopSpeech();

  const langObj = SUPPORTED_LANGUAGES.find((l) => l.code === langCode) || SUPPORTED_LANGUAGES[0];
  const scriptText = generateSpeechScript(audit, langObj.langKey, selectedShields);

  const utterance = new SpeechSynthesisUtterance(scriptText);
  utterance.lang = langCode;
  utterance.rate = 0.95; // slightly relaxed natural pace
  utterance.pitch = 1.0;

  // Try to find a matching voice installed on the user's OS
  const voices = window.speechSynthesis.getVoices();
  const matchedVoice = voices.find((v) => v.lang.startsWith(langObj.langKey) || v.lang === langCode);
  if (matchedVoice) {
    utterance.voice = matchedVoice;
  }

  utterance.onstart = () => {
    activeUtterance = utterance;
    if (onStart) onStart();
  };

  utterance.onend = () => {
    activeUtterance = null;
    if (onEnd) onEnd();
  };

  utterance.onerror = () => {
    activeUtterance = null;
    if (onEnd) onEnd();
  };

  window.speechSynthesis.speak(utterance);
}
