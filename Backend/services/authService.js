const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { jwtSecret, jwtExpiresIn } = require('../config/env');
const userRepository = require('../repositories/userRepository');

function signToken(user) {
  return jwt.sign({ sub: String(user._id || user.id), role: user.role, email: user.email, name: user.name }, jwtSecret, { expiresIn: jwtExpiresIn });
}

async function register({ name, email, password, role = 'inspector' }) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!name || !normalizedEmail || !password) throw new Error('Name, email, and password are required');
  if (password.length < 8) throw new Error('Password must be at least 8 characters');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) throw new Error('Enter a valid email address');
  if (role !== 'inspector') throw new Error('Only inspector accounts can be self-registered');
  if (await userRepository.findByEmail(normalizedEmail)) throw new Error('An account with this email already exists');
  const user = await userRepository.create({ name: String(name).trim(), email: normalizedEmail, passwordHash: await bcrypt.hash(password, 12), role: 'inspector', active: true });
  return { token: signToken(user), user: userRepository.toPublic(user) };
}

async function login({ email, password }) {
  const user = await userRepository.findByEmail(String(email || '').trim().toLowerCase());
  if (!user || !user.active || !(await bcrypt.compare(String(password || ''), user.passwordHash))) throw new Error('Invalid email or password');
  return { token: signToken(user), user: userRepository.toPublic(user) };
}

function verifyToken(token) {
  return jwt.verify(token, jwtSecret);
}

module.exports = { register, login, verifyToken };