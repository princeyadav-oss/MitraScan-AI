const express = require('express');
const upload = require('../middleware/upload');
const asyncHandler = require('../utils/asyncHandler');
const { requireAuth } = require('../middleware/auth');
const { listAudits, getAudit, createAudit, createUrlAudit, downloadReport } = require('../controllers/auditController');

const router = express.Router();
router.use(requireAuth);
router.get('/', asyncHandler(listAudits));
router.get('/:id/report', asyncHandler(downloadReport));
router.get('/:id', asyncHandler(getAudit));
router.post('/', upload.single('labelImage'), asyncHandler(createAudit));
router.post('/url', asyncHandler(createUrlAudit));

module.exports = router;