const express = require('express');
const cors = require('cors');
const { frontendUrl } = require('./config/env');
const healthRoutes = require('./routes/healthRoutes');
const auditRoutes = require('./routes/auditRoutes');
const authRoutes = require('./routes/authRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl/postman/mobile) or from localhost / 127.0.0.1 on any port
    if (!origin || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) || origin === frontendUrl) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/audits', auditRoutes);
app.use(errorHandler);

module.exports = app;
