const { recognize } = require('tesseract.js');
const sharp = require('sharp');

async function extractText(imageBuffer) {
  if (!Buffer.isBuffer(imageBuffer) || imageBuffer.length === 0) {
    throw new Error('The uploaded image is empty or could not be read');
  }

  let normalizedImage;
  try {
    normalizedImage = await sharp(imageBuffer)
      .rotate()
      .flatten({ background: '#ffffff' })
      .grayscale()
      .png()
      .toBuffer();
  } catch (_error) {
    throw new Error('The uploaded file is not a supported image. Please upload a valid JPG, PNG, WEBP, or TIFF label image.');
  }

  try {
    const result = await recognize(normalizedImage, 'eng');
    return result.data.text.trim();
  } catch (_error) {
    throw new Error('OCR could not read this image. Try a sharper, well-lit label photo.');
  }
}

module.exports = { extractText };