const { isDatabaseConnected } = require('../config/database');

function getHealth(_req, res) {
  res.json({
    ok: true,
    service: 'mitrascan-api',
    storage: isDatabaseConnected() ? 'mongodb' : 'memory',
    pdfBrowser: require('../config/env').browserExecutablePath ? 'configured' : 'missing',
    timestamp: new Date().toISOString(),
  });
}

module.exports = { getHealth };