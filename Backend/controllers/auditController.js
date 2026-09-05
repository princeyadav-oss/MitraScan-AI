const { analyzeLabel } = require('../services/complianceEngine');
const { extractText } = require('../services/ocrService');
const auditRepository = require('../repositories/auditRepository');
const { generateReport } = require('../services/reportService');
const { fetchProductPage } = require('../services/urlAuditService');

function canAccessAudit(audit, user) {
  return ['supervisor', 'admin'].includes(user.role) || String(audit.createdBy) === String(user.id);
}

async function listAudits(req, res) {
  res.json(await auditRepository.findAll(req.user));
}

async function getAudit(req, res) {
  const audit = await auditRepository.findById(req.params.id);
  if (!audit) return res.status(404).json({ message: 'Audit not found' });
  if (!canAccessAudit(audit, req.user)) return res.status(403).json({ message: 'You do not have access to this audit' });
  return res.json(audit);
}

async function createAudit(req, res) {
  const sourceText = String(req.body.ocrText || '').trim();
  const text = sourceText || (req.file ? await extractText(req.file.buffer) : 'No OCR text supplied. Upload a label image or paste extracted label text.');
  const result = analyzeLabel(text, {
    fileName: req.file?.originalname || null,
    productName: req.body.productName,
    inspector: req.body.inspector,
    location: req.body.location,
    createdBy: req.user.id,
    createdByEmail: req.user.email,
  });
  const audit = await auditRepository.create({ ...result, imageName: req.file?.originalname || null });
  return res.status(201).json(audit);
}

async function createUrlAudit(req, res) {
  const page = await fetchProductPage(String(req.body.url || '').trim());
  const result = analyzeLabel(page.text, {
    sourceUrl: page.sourceUrl,
    pageTitle: page.pageTitle,
    productName: req.body.productName || page.pageTitle,
    inspector: req.body.inspector,
    location: req.body.location,
    createdBy: req.user.id,
    createdByEmail: req.user.email,
  });
  return res.status(201).json(await auditRepository.create(result));
}

async function downloadReport(req, res) {
  const audit = await auditRepository.findById(req.params.id);
  if (!audit) return res.status(404).json({ message: 'Audit not found' });
  if (!canAccessAudit(audit, req.user)) return res.status(403).json({ message: 'You do not have access to this audit' });
  const pdf = await generateReport(audit);
  res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="mitrascan-${audit.id}.pdf"` });
  return res.send(pdf);
}

module.exports = { listAudits, getAudit, createAudit, createUrlAudit, downloadReport };