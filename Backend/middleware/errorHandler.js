function errorHandler(error, _req, res, _next) {
  const status = error.code === 'LIMIT_FILE_SIZE' ? 413 : error.message?.includes('Only image files') || error.message?.includes('supported image') || error.message?.includes('OCR could not') ? 400 : 500;
  res.status(status).json({
    message: status === 413 ? 'Image must be smaller than 8 MB' : error.message,
  });
}

module.exports = errorHandler;