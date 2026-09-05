const express = require('express');
const cors = require('cors');
const { frontendUrl } = require('./config/env');
const healthRoutes = require('./routes/healthRoutes');
const auditRoutes = require('./routes/auditRoutes');
const authRoutes = require('./routes/authRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(cors({ origin: frontendUrl }));
app.use(express.json({ limit: '2mb' }));
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/audits', auditRoutes);
app.use(errorHandler);

module.exports = app;
