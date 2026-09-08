const crypto = require('crypto');
const Audit = require('../models/Audit');
const { isDatabaseConnected } = require('../config/database');

const { analyzeLabel } = require('../services/complianceEngine');

const demoAudit = analyzeLabel(`BISCUITS
Manufactured and packed by Sunrise Foods Pvt Ltd, 14 Industrial Estate, Pune 411019, India
Net Quantity: 200 g
Mfg: August 2026
MRP: ₹85.00 (inclusive of all taxes)
Consumer care: care@sunrisefoods.in | Helpline: 18001234567
Country of Origin: India`, {
  productName: 'Sunrise Biscuits',
  inspector: 'Field Inspector',
  location: 'Pune, Maharashtra',
  createdBy: 'demo-inspector-1',
  createdByEmail: 'inspector@mitrascan.com'
});

const memoryAudits = [
  { ...demoAudit, id: 'demo-audit-1', imageName: null }
];

function toPlain(audit) {
  if (!audit) return null;
  const value = audit.toObject ? audit.toObject() : audit;
  return { ...value, id: String(value._id || value.id) };
}

async function create(data) {
  if (isDatabaseConnected()) return toPlain(await Audit.create(data));
  const audit = { ...data, id: crypto.randomUUID() };
  memoryAudits.unshift(audit);
  return audit;
}

async function findAll(user) {
  const isElevated = ['supervisor', 'admin'].includes(user?.role);
  if (isDatabaseConnected()) {
    const query = isElevated ? {} : { createdBy: user?.id };
    return (await Audit.find(query).sort({ inspectedAt: -1 }).limit(50)).map(toPlain);
  }
  const currentUserId = user ? String(user.id || user.sub || '') : '';
  return (isElevated
    ? memoryAudits
    : memoryAudits.filter((audit) => !audit.createdBy || String(audit.createdBy) === currentUserId || audit.createdBy === 'demo-inspector-1')
  ).slice(0, 50);
}

async function findById(id) {
  if (isDatabaseConnected()) return toPlain(await Audit.findById(id));
  return memoryAudits.find((audit) => audit.id === id) || null;
}

module.exports = { create, findAll, findById };