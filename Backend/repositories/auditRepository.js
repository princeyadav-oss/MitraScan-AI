const crypto = require('crypto');
const Audit = require('../models/Audit');
const { isDatabaseConnected } = require('../config/database');

const memoryAudits = [];

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
  const isElevated = ['supervisor', 'admin'].includes(user.role);
  if (isDatabaseConnected()) {
    const query = isElevated ? {} : { createdBy: user.id };
    return (await Audit.find(query).sort({ inspectedAt: -1 }).limit(50)).map(toPlain);
  }
  return (isElevated ? memoryAudits : memoryAudits.filter((audit) => audit.createdBy === user.id)).slice(0, 50);
}

async function findById(id) {
  if (isDatabaseConnected()) return toPlain(await Audit.findById(id));
  return memoryAudits.find((audit) => audit.id === id) || null;
}

module.exports = { create, findAll, findById };