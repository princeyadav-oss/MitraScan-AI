const puppeteer = require('puppeteer');
const { browserExecutablePath } = require('../config/env');

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[character]));
}

async function generateReport(audit) {
  const rows = audit.checks.map((check) => `<tr><td><b>${escapeHtml(check.label)}</b><br><span class="${check.status}">${escapeHtml(check.status.toUpperCase())}</span></td><td>${escapeHtml(check.evidence)}</td><td>${escapeHtml(check.rule)}</td><td class="finding ${check.status}">${escapeHtml(check.finding || (check.status === 'pass' ? 'N/A — compliant: declaration detected and no automated issue found.' : 'VIOLATION: review this declaration against the original evidence.'))}</td></tr>`).join('');
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: browserExecutablePath || undefined,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  try {
    const page = await browser.newPage();
    const source = audit.sourceUrl ? `Source URL: ${escapeHtml(audit.sourceUrl)}` : `Source image: ${escapeHtml(audit.imageName || 'Not attached')}`;
    await page.setContent(`<html><style>body{font-family:Arial;color:#17231e;padding:40px}h1{color:#126b4d}table{border-collapse:collapse;width:100%;margin-top:24px}th,td{border:1px solid #ccd8d0;padding:10px;text-align:left;font-size:11px;vertical-align:top}th{background:#edf5ee;color:#285642}.pass{color:#16704e}.fail{color:#b33638}.warning{color:#a26716}.finding.fail{font-weight:bold;color:#b33638}.finding.warning{font-weight:bold;color:#a26716}small{color:#61726a}.source{margin-top:20px;padding:12px;background:#f3f7f1;color:#526c5c;font-size:11px}</style><h1>MitraScan compliance audit</h1><p><b>${escapeHtml(audit.productName)}</b> | ${escapeHtml(audit.status)} | Score ${audit.score}%</p><small>Audit ID: ${escapeHtml(audit.id)} | Inspected: ${escapeHtml(audit.inspectedAt)}</small><table><thead><tr><th>Declaration / status</th><th>Detected details</th><th>Applicable legal requirement</th><th>Violation / action</th></tr></thead><tbody>${rows}</tbody></table><p class="source">${source}<br>OCR text is retained in the audit record as machine-extracted evidence; it is not reproduced here as the legal conclusion. Final enforcement decisions require inspector verification against the original label.</p></html>`, { waitUntil: 'domcontentloaded', timeout: 10000 });
    return await page.pdf({ format: 'A4', printBackground: true, margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' } });
  } finally { await browser.close(); }
}

module.exports = { generateReport };