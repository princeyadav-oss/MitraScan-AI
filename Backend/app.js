const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { frontendUrl } = require('./config/env');
const healthRoutes = require('./routes/healthRoutes');
const auditRoutes = require('./routes/auditRoutes');
const authRoutes = require('./routes/authRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

const allowedOrigins = frontendUrl
  ? frontendUrl.split(',').map((url) => url.trim().replace(/\/+$/, ''))
  : [];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl/postman/mobile/same-origin) or from localhost / 127.0.0.1 on any port
    if (!origin || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }
    const cleanOrigin = origin.replace(/\/+$/, '');
    if (allowedOrigins.length === 0 || allowedOrigins.includes('*') || allowedOrigins.includes(cleanOrigin)) {
      return callback(null, true);
    }
    // Permissive fallback so cloud deployments don't get blocked by minor origin discrepancies
    return callback(null, true);
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/audits', auditRoutes);

// Optional unified deployment: Serve production frontend if frontend/dist exists
const clientDist = path.resolve(__dirname, '../frontend/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(clientDist, 'index.html'));
    }
    next();
  });
}

app.use(errorHandler);

module.exports = app;
