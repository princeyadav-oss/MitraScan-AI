const FIELD_DEFINITIONS = [
  { key: 'manufacturer', label: 'Manufacturer / packer', patterns: [/manufacturer|manufactured by|packed by|imported by/i], rule: 'Rule 6: declare the name and complete address of the manufacturer, packer, or importer, including PIN code and country where applicable.' },
  { key: 'productName', label: 'Common product name', patterns: [/biscuit|shampoo|detergent|rice|tea|soap|product|cookies|noodles/i], rule: 'Rule 6: declare the common or generic name of the commodity so the product identity is clear to the consumer.' },
  { key: 'netQuantity', label: 'Net quantity', patterns: [/\b\d+(?:\.\d+)?\s?(?:g|kg|ml|l|n|u)\b/i], rule: 'Rule 6: declare net quantity using permitted standard units such as g, kg, ml, l, N, or U; avoid informal forms such as gms or lts.' },
  { key: 'date', label: 'Month and year', patterns: [/(?:mfg|manufactur|pack|import)[^\n]{0,20}(?:\d{1,2}[/-]\d{4}|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s?\d{4})/i, /(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s?20\d{2}/i], rule: 'Rule 6: declare the month and year in which the commodity was manufactured, packed, or imported.' },
  { key: 'mrp', label: 'MRP inclusive of taxes', patterns: [/m\.r\.p|mrp/i, /₹|rs\.?\s?\d+/i], rule: 'Rule 6: declare the Maximum Retail Price in Indian currency and state that it is inclusive of all taxes; applicable unit sale price should also be displayed.' },
  { key: 'consumerCare', label: 'Consumer care details', patterns: [/@/i, /(?:phone|helpline|call|customer care|care)\D{0,20}\d{7,}/i], rule: 'Rule 6: provide consumer-care contact details, including a telephone or helpline number, email address, and postal address or designation.' },
  { key: 'origin', label: 'Country of origin', patterns: [/country of origin|made in|product of/i], rule: 'Rule 6: imported commodities must declare the country of origin or manufacture.' },
];

function findEvidence(text, field, patterns, metadata) {
  if (field === 'productName' && metadata.productName) return metadata.productName;
  const line = text.split(/(?:\r?\n|\\n)/).map((value) => value.trim()).find((value) => patterns.some((pattern) => {
    pattern.lastIndex = 0;
    return pattern.test(value);
  }));
  if (line) return line;
  return patterns.map((pattern) => text.match(pattern)?.[0]).find(Boolean) || null;
}

function analyzeLabel(text, metadata = {}) {
  const sourceText = String(text || '').trim();
  const normalizedText = sourceText.replace(/\s+/g, ' ').trim();
  const checks = FIELD_DEFINITIONS.map((field) => {
    const evidence = findEvidence(sourceText, field.key, field.patterns, metadata);
    const isPresent = Boolean(evidence);
    const isWarning = field.key === 'mrp' && isPresent && !/inclusive of all taxes|incl(?:usive)?\.?\s+of\s+all\s+taxes/i.test(normalizedText);
    const rule = isWarning ? 'Rule 6: MRP should explicitly state that the displayed price is inclusive of all taxes.' : field.rule;
    const finding = !isPresent ? `VIOLATION: ${field.label} was not detected. Verify and record the missing declaration from the original label or listing.` : isWarning ? 'VIOLATION: MRP was detected, but the inclusive-of-all-taxes wording was not found.' : 'N/A — compliant: declaration detected and no automated issue found.';
    return { key: field.key, label: field.label, status: !isPresent ? 'fail' : isWarning ? 'warning' : 'pass', evidence: evidence || 'Not detected', rule, finding };
  });
  const passed = checks.filter((check) => check.status === 'pass').length;
  const failed = checks.filter((check) => check.status === 'fail').length;
  const warnings = checks.filter((check) => check.status === 'warning').length;
  return { ...metadata, productName: metadata.productName || checks.find((check) => check.key === 'productName')?.evidence || 'Unidentified product', ocrText: normalizedText, checks, score: Math.round((passed / checks.length) * 100), status: failed ? 'Non-compliant' : warnings ? 'Review required' : 'Compliant', summary: { total: checks.length, passed, failed, warnings }, inspectedAt: new Date().toISOString() };
}

module.exports = { analyzeLabel };