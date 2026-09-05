const crypto = require('crypto');
const User = require('../models/User');
const { isDatabaseConnected } = require('../config/database');

const memoryUsers = [];

function toPublic(user) {
  if (!user) return null;
  const value = user.toObject ? user.toObject() : user;
  return { id: String(value._id || value.id), name: value.name, email: value.email, role: value.role, active: value.active };
}

async function findByEmail(email) {
  if (isDatabaseConnected()) return User.findOne({ email: email.toLowerCase() });
  return memoryUsers.find((user) => user.email === email.toLowerCase()) || null;
}

async function findById(id) {
  if (isDatabaseConnected()) return User.findById(id);
  return memoryUsers.find((user) => user.id === id) || null;
}

async function create(data) {
  if (isDatabaseConnected()) return User.create(data);
  const user = { ...data, id: crypto.randomUUID() };
  memoryUsers.push(user);
  return user;
}

module.exports = { create, findByEmail, findById, toPublic };