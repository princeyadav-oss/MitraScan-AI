const authService = require('../services/authService');

async function register(req, res) {
  return res.status(201).json(await authService.register(req.body));
}

async function login(req, res) {
  return res.json(await authService.login(req.body));
}

function me(req, res) {
  return res.json({ user: req.user });
}

module.exports = { register, login, me };