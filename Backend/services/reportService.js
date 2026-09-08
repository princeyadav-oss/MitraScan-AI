const puppeteer = require('puppeteer');
const { browserExecutablePath } = require('../config/env');

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[character]));
}

async function generateReport(audit) {
  const rows = audit.checks.map((check) => `<tr><td><b>${escapeHtml(check.label)}</b><br><span class="${check.status}">${escapeHtml(check.status.toUpperCase())}</span></td><td>${escapeHtml(check.evidence)}</td><td>${escapeHtml(check.rule)}</td><td class="finding ${check.status}">${escapeHtml(check.finding || (check.status === 'pass' ? 'N/A — compliant: declaration detected and no automated issue found.' : 'VIOLATION: review this declaration against the original evidence.'))}</td></tr>`).join('');
  
  const health = audit.healthAnalysis;
  let healthHtml = '';
  if (health) {
    const nutrition = health.nutrition || {};
    const suspicious = health.suspiciousIngredients || {};
    const suspiciousList = suspicious.list || [];
    const suspiciousItems = suspiciousList.length > 0
      ? suspiciousList.map((s) => `<li style="margin-bottom:4px;color:#b33638;"><b>${escapeHtml(s.name)}:</b> ${escapeHtml(s.risk)}</li>`).join('')
      : '<li style="color:#16704e;">No high-hazard food additives or suspicious preservatives flagged.</li>';
    
    const hw = audit.healthwashing;
    let hwHtml = '';
    if (hw && hw.claimsExposed && hw.claimsExposed.length > 0) {
      const claimsList = hw.claimsExposed.map((c) => `<li style="margin-bottom:4px;color:${c.severity === 'verified' ? '#16704e' : '#b33638'};"><b>${escapeHtml(c.claim)}:</b> ${escapeHtml(c.reality)}</li>`).join('');
      hwHtml = `
        <div style="margin-top:12px;padding:12px;border:1px dashed #d1e2d6;background:#fff;border-radius:4px;">
          <b style="font-size:11px;color:#a86c35;">The Truth Meter (Deception Index: ${hw.deceptionScore}% — ${escapeHtml(hw.deceptionRating)})</b>
          <p style="font-size:10px;margin:3px 0 6px;color:#526c5c;">${escapeHtml(hw.consumerAdvisory)}</p>
          <ul style="margin:0 0 0 16px;padding:0;font-size:10.5px;">${claimsList}</ul>
        </div>
      `;
    }

    const hs = audit.healthShield;
    let hsHtml = '';
    if (hs && hs.triggeredList && hs.triggeredList.length > 0) {
      const risks = hs.triggeredList.map((r) => `<li style="margin-bottom:4px;color:#b33638;"><b>${escapeHtml(r.label)}:</b> ${escapeHtml(r.hazard)}</li>`).join('');
      hsHtml = `
        <div style="margin-top:12px;padding:12px;border:1px solid #ffd8d8;background:#fff5f5;border-radius:4px;">
          <b style="font-size:11px;color:#c92a2a;">Personalized Health Shield Alert (${hs.totalRisks} Medical / Allergy Risks Triggered)</b>
          <ul style="margin:4px 0 0 16px;padding:0;font-size:10.5px;">${risks}</ul>
        </div>
      `;
    }

    healthHtml = `
      <div style="margin-top:24px;padding:16px;border:1px solid #ccd8d0;background:#fafcfb;border-radius:4px;">
        <h3 style="margin-top:0;color:#126b4d;font-size:13px;">Health, Nutrition & Consumer Protection Profile</h3>
        <p style="font-size:11px;margin:4px 0 10px;"><b>Health Rating:</b> ${escapeHtml(health.healthStatus)} (Score: ${health.healthScore}/100) | <b>Deficit Snack Verdict:</b> ${escapeHtml(health.dietary?.deficitBadge || 'N/A')}</p>
        <div style="display:flex;gap:12px;font-size:11px;margin-bottom:12px;">
          <div style="background:#fff;padding:6px 12px;border:1px solid #e1e8e4;border-radius:4px;"><b>Calories:</b> ${nutrition.calories || 0} kcal</div>
          <div style="background:#fff;padding:6px 12px;border:1px solid #e1e8e4;border-radius:4px;"><b>Protein:</b> ${nutrition.protein || 0}g</div>
          <div style="background:#fff;padding:6px 12px;border:1px solid #e1e8e4;border-radius:4px;"><b>Carbs:</b> ${nutrition.carbs || 0}g</div>
          <div style="background:#fff;padding:6px 12px;border:1px solid #e1e8e4;border-radius:4px;"><b>Fat:</b> ${nutrition.fat || 0}g</div>
          <div style="background:#fff;padding:6px 12px;border:1px solid #e1e8e4;border-radius:4px;"><b>Sugar:</b> ${nutrition.sugar || 0}g</div>
        </div>
        <div style="font-size:11px;">
          <b>Ingredient & Hazard Screening:</b>
          <ul style="margin:6px 0 0 18px;padding:0;">${suspiciousItems}</ul>
        </div>
        ${hwHtml}
        ${hsHtml}
      </div>
    `;
  }

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: browserExecutablePath || undefined,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  try {
    const page = await browser.newPage();
    const displayProductName = (!audit.productName || audit.productName === 'Not detected') ? 'Product Detected' : audit.productName;
    await page.setContent(`<html><style>body{font-family:Arial;color:#17231e;padding:40px}h1{color:#126b4d}table{border-collapse:collapse;width:100%;margin-top:24px}th,td{border:1px solid #ccd8d0;padding:10px;text-align:left;font-size:11px;vertical-align:top}th{background:#edf5ee;color:#285642}.pass{color:#16704e}.fail{color:#b33638}.warning{color:#a26716}.finding.fail{font-weight:bold;color:#b33638}.finding.warning{font-weight:bold;color:#a26716}small{color:#61726a}.source{margin-top:20px;padding:12px;background:#f3f7f1;color:#526c5c;font-size:11px}</style><h1>MitraScan compliance audit</h1><p><b>${escapeHtml(displayProductName)}</b> | ${escapeHtml(audit.status)} | Score ${audit.score}%</p><small>Audit ID: ${escapeHtml(audit.id)} | Inspected: ${escapeHtml(audit.inspectedAt)}</small><table><thead><tr><th>Declaration / status</th><th>Detected details</th><th>Applicable legal requirement</th><th>Violation / action</th></tr></thead><tbody>${rows}</tbody></table>${healthHtml}<p class="source">${source}<br>OCR text is retained in the audit record as machine-extracted evidence; it is not reproduced here as the legal conclusion. Final enforcement decisions require inspector verification against the original label.</p></html>`, { waitUntil: 'domcontentloaded', timeout: 10000 });
    return await page.pdf({ format: 'A4', printBackground: true, margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' } });
  } finally { await browser.close(); }
}

module.exports = { generateReport };