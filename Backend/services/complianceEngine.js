const TAX_CHECK_REGEX = /(?:(?:incl?\.?|inclusive|inc\.)\s*(?:of\s*)?(?:all\s*)?tax(?:es)?|\ball\s+tax(?:es)?\s+included\b|\btax(?:es)?\s+(?:included|incl?\.?|inclusive)\b)/i;

const FIELD_DEFINITIONS = [
  {
    key: 'manufacturer',
    label: 'Manufacturer / packer',
    patterns: [
      /\b(?:manufactur(?:ed|er|ing)?|mfg\.?|mfd\.?|mfr\.?)\s*(?:by|&|\band\b|for|at|in|unit|dt)?\s*[:\-]?\s*[a-zA-Z]/i,
      /\b(?:pack(?:ed|er|ing)?|pkd\.?)\s*(?:by|&|\band\b|for|at|unit)?\s*[:\-]?\s*[a-zA-Z]/i,
      /\b(?:market(?:ed|ing)?|mktg?\.?|mktd\.?)\s*(?:by|&|\band\b|for)?\s*[:\-]?\s*[a-zA-Z]/i,
      /\b(?:import(?:ed|er)?|distribut(?:ed|or)?)\s*(?:by|&|\band\b|for)?\s*[:\-]?\s*[a-zA-Z]/i,
      /\b(?:produc(?:ed|er)|process(?:ed|or)|bottl(?:ed|er))\s*(?:by)?\s*[:\-]?\s*[a-zA-Z]/i,
      /\b(?:pvt\.?\s*ltd\.?|private\s+limited|industries\s+ltd\.?|foods\s+(?:pvt|limited|ltd))\b/i,
      /\bfssai\s*(?:lic(?:ense)?\.?\s*(?:no\.?)?)?\s*[:\s]*\d{14}\b/i
    ],
    rule: 'Rule 6: declare the name and complete address of the manufacturer, packer, or importer, including PIN code and country where applicable.'
  },
  {
    key: 'productName',
    label: 'Common product name',
    patterns: [
      /biscuit|cookies|shampoo|detergent|rice|tea|coffee|soap|product|noodles|pasta|chips|wafer|snack|oil|juice|namkeen|chocolate|candy|bread|cake|cornflakes|cereal|atta|flour|dalia|milk|paneer|butter|cheese|sauce|ketchup|spread|jam|honey/i
    ],
    rule: 'Rule 6: declare the common or generic name of the commodity so the product identity is clear to the consumer.'
  },
  {
    key: 'netQuantity',
    label: 'Net quantity',
    patterns: [
      /\b\d+(?:\.\d+)?\s?(?:g|kg|ml|l|n|u|gms|lts|gm|ltr|litre|litres|grams|gram)\b/i,
      /\b(?:net\s*wt\.?|net\s*quantity|net\s*weight|net\s*content|weight|qty)\s*[:\-]?\s*\d+/i
    ],
    rule: 'Rule 6: declare net quantity using permitted standard units such as g, kg, ml, l, N, or U; avoid informal forms such as gms or lts.'
  },
  {
    key: 'date',
    label: 'Month and year',
    patterns: [
      // Prefix followed by date or month/year
      /(?:mfg|mfd|pkd|pack|import|exp|use\s*by|best\s*before|date\s*of)[^\n\r]{0,25}(?:\b\d{1,2}[\/\.\-]\d{1,2}[\/\.\-](?:20\d{2}|\d{2})\b|\b\d{1,2}[\/\.\-](?:20\d{2}|\d{2})\b|\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[\s\.\-]*(?:20\d{2}|\d{2})\b)/i,
      // Month name with year: August 2026, Aug 2024, AUG-24
      /\b(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)[a-z]*[\s\.\,\-]+(?:20\d{2}|\d{2})\b/i,
      // Standalone Full dates: 15/08/2024, 15-08-2024, 15.08.2024, 15/08/24
      /\b(?:0[1-9]|[12][0-9]|3[01])[\/\.\-](?:0[1-9]|1[0-2])[\/\.\-](?:20\d{2}|\d{2})\b/,
      // Standalone Month/Year: 08/2024, 08/24, 08-2024, 08.2024
      /\b(?:0[1-9]|1[0-2])[\/\.\-](?:20\d{2}|\d{2})\b/,
      // Best before with duration
      /\bbest\s*before[^\n\r]{0,35}\b\d+\s*(?:month|mth|day|year)/i
    ],
    rule: 'Rule 6: declare the month and year in which the commodity was manufactured, packed, or imported.'
  },
  {
    key: 'mrp',
    label: 'MRP inclusive of taxes',
    patterns: [
      /\b(?:m\s*\.?\s*r\s*\.?\s*p|maximum\s+retail\s+price|max\s*\.?\s*retail\s*price)\b[^\n\r]{0,40}(?:[₹\$\£]|rs\.?|inr)?\s*\d+(?:\.\d{1,2})?/i,
      /\b(?:m\s*\.?\s*r\s*\.?\s*p|maximum\s+retail\s+price|max\s*\.?\s*retail\s*price)\b/i,
      /(?:₹|rs\.?|inr)\s*\d+(?:\.\d{1,2})?(?:\s*\/\-)?/i,
      /\b\d+(?:\.\d{1,2})?\s*\/\-/
    ],
    rule: 'Rule 6: declare the Maximum Retail Price in Indian currency and state that it is inclusive of all taxes; applicable unit sale price should also be displayed.'
  },
  {
    key: 'consumerCare',
    label: 'Consumer care details',
    patterns: [
      /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/,
      /\b(?:1800|1860)[\s\-]?[0-9]{2,4}[\s\-]?[0-9]{3,5}\b/,
      /(?:\+?91[\s\-]?)?[6-9]\d{9}\b/, // Indian 10-digit mobile
      /(?:0\d{2,4}[\s\-])\d{6,8}\b/, // Landline with STD code
      /(?:consumer|customer)\s*(?:care|service|support|feedback|cell|executive|relations?|helpline)/i,
      /(?:helpline|careline|toll[\s\-]*free|call\s*us|contact\s*us|reach\s*us)/i,
      /(?:for\s*(?:consumer\s*)?(?:feedback|complaints?|queries|suggestions)|write\s*to)/i,
      /(?:feedback|care|customercare|wecare)@/i
    ],
    rule: 'Rule 6: provide consumer-care contact details, including a telephone or helpline number, email address, and postal address or designation.'
  },
  {
    key: 'origin',
    label: 'Country of origin',
    patterns: [
      /\b(?:country\s+of\s+origin|country\s+of\s+mfg|country\s+of\s+manufacture)\s*[:\-]?\s*[a-zA-Z]+/i,
      /\borigin\s*[:\-]\s*[a-zA-Z]+/i,
      /\b(?:made\s+in|product\s+of|produce\s+of|manufactured\s+in|mfg\.?\s+in|mfd\.?\s+in|packed\s+in|imported\s+from)\s+[a-zA-Z]+/i,
      /\b(?:country\s+of\s+origin|made\s+in\s+india|made\s+in\s+bharat|product\s+of\s+india)\b/i,
      /(?:\b\d{6}\b[,\s]+india|\b(?:delhi|mumbai|kolkata|chennai|bengaluru|bangalore|pune|hyderabad|ahmedabad|gurgaon|noida|india|bharat)\b[,\s]+india)/i
    ],
    rule: 'Rule 6: imported commodities must declare the country of origin or manufacture.'
  }
];

const { analyzeHealthAndNutrition } = require('./healthEngine');
const { analyzeHealthwashing } = require('./healthwashingEngine');
const { analyzeHealthShield } = require('./healthShieldEngine');

function findEvidence(text, field, patterns, metadata) {
  if (field === 'productName' && metadata && metadata.productName && metadata.productName !== 'Not detected') {
    return metadata.productName;
  }

  const lines = text.split(/(?:\r?\n|\\n)/).map((v) => v.trim()).filter(Boolean);

  // 1. Line-by-line inspection with contextual multi-line stitching
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const pattern of patterns) {
      pattern.lastIndex = 0;
      if (pattern.test(line)) {
        // If line is a short header ending with colon or dash, join with subsequent value line
        const isHeaderOnly = line.length < 35 && /[:\-]$/.test(line);
        if (isHeaderOnly && i + 1 < lines.length) {
          return `${line} ${lines[i + 1]}`;
        }

        // For MRP: if current line has price but not taxes, and next line has taxes, stitch them
        if (field === 'mrp' && !TAX_CHECK_REGEX.test(line) && i + 1 < lines.length && TAX_CHECK_REGEX.test(lines[i + 1])) {
          return `${line} ${lines[i + 1]}`;
        }

        // For Origin: if line is just "Country of Origin" without country, and next line has country, stitch
        if (field === 'origin' && !/india|bharat|prc|china|usa|germany|thailand/i.test(line) && i + 1 < lines.length) {
          return `${line} ${lines[i + 1]}`;
        }

        return line;
      }
    }
  }

  // 2. Continuous text / single-line fallback with tight excerpt window
  for (const pattern of patterns) {
    pattern.lastIndex = 0;
    const match = text.match(pattern);
    if (match) {
      const matchIndex = match.index || 0;
      const start = Math.max(0, matchIndex - 12);
      const end = Math.min(text.length, matchIndex + match[0].length + 45);
      return text.slice(start, end).replace(/\s+/g, ' ').trim();
    }
  }

  return null;
}

function analyzeLabel(text, metadata = {}) {
  const sourceText = String(text || '').trim();
  const normalizedText = sourceText.replace(/\s+/g, ' ').trim();
  const checks = FIELD_DEFINITIONS.map((field) => {
    const evidence = findEvidence(sourceText, field.key, field.patterns, metadata);
    const isPresent = Boolean(evidence) || (field.key === 'productName');
    const isWarning = field.key === 'mrp' && isPresent && !TAX_CHECK_REGEX.test(normalizedText);
    const rule = isWarning ? 'Rule 6: MRP should explicitly state that the displayed price is inclusive of all taxes.' : field.rule;
    const defaultEvidence = field.key === 'productName' ? 'Product Detected' : 'Not detected';
    const finding = !isPresent
      ? `VIOLATION: ${field.label} was not detected. Verify and record the missing declaration from the original label or listing.`
      : isWarning
        ? 'VIOLATION: MRP was detected, but the inclusive-of-all-taxes wording was not found.'
        : 'N/A — compliant: declaration detected and no automated issue found.';
    return {
      key: field.key,
      label: field.label,
      status: !isPresent ? 'fail' : isWarning ? 'warning' : 'pass',
      evidence: evidence || defaultEvidence,
      rule,
      finding
    };
  });
  const passed = checks.filter((check) => check.status === 'pass').length;
  const failed = checks.filter((check) => check.status === 'fail').length;
  const warnings = checks.filter((check) => check.status === 'warning').length;
  const productEvidence = checks.find((check) => check.key === 'productName')?.evidence;
  const validProductEvidence = productEvidence && productEvidence !== 'Not detected' ? productEvidence : null;
  const determinedProductName = (metadata.productName && metadata.productName !== 'Not detected' ? metadata.productName : null)
    || validProductEvidence
    || 'Product Detected';
  const healthAnalysis = analyzeHealthAndNutrition(sourceText, determinedProductName);
  const healthwashing = analyzeHealthwashing(sourceText, determinedProductName, healthAnalysis.nutrition);
  const healthShield = analyzeHealthShield(sourceText, healthAnalysis.nutrition);

  return {
    ...metadata,
    productName: determinedProductName,
    ocrText: normalizedText,
    checks,
    score: Math.round((passed / checks.length) * 100),
    status: failed ? 'Non-compliant' : warnings ? 'Review required' : 'Compliant',
    summary: { total: checks.length, passed, failed, warnings },
    healthAnalysis,
    healthwashing,
    healthShield,
    inspectedAt: new Date().toISOString()
  };
}

module.exports = { analyzeLabel };