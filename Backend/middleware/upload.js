const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, callback) => {
    if (!file.mimetype.startsWith('image/')) return callback(new Error('Only image files can be uploaded'));
    return callback(null, true);
  },
  limits: { fileSize: 8 * 1024 * 1024 },
});

module.exports = upload;