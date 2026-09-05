const mongoose = require('mongoose');

module.exports = mongoose.model('User', new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['inspector', 'supervisor', 'admin'], default: 'inspector' },
  active: { type: Boolean, default: true },
}, { timestamps: true }));