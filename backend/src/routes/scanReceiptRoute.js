const express = require('express');
const router = express.Router();
const { uploadImageBase64 } = require('../utils/cloudinary');
const { scanReceiptWithAI } = require('../utils/geminiAI');

// POST /api/scan-receipt
// Uploads receipt image to Cloudinary, then uses Gemini Vision to extract transaction details
router.post('/', async (req, res) => {
  try {
    const { base64Image } = req.body;

    if (!base64Image) {
      return res.status(400).json({ success: false, message: 'No base64 image provided' });
    }

    // 1. Upload to Cloudinary
    const receiptUrl = await uploadImageBase64(base64Image);

    // 2. Use Gemini Vision to extract transaction details
    const extracted = await scanReceiptWithAI(base64Image);

    res.status(200).json({
      success: true,
      data: {
        receiptUrl,
        ...extracted,
      }
    });
  } catch (error) {
    console.error('Error in scan-receipt route:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error during receipt scan' });
  }
});

module.exports = router;
