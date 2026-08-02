const express = require('express');
const router = express.Router();
const { uploadImageBase64 } = require('../utils/cloudinary');

router.post('/', async (req, res) => {
  try {
    const { base64Image } = req.body;
    
    if (!base64Image) {
      return res.status(400).json({ success: false, message: 'No base64 image provided' });
    }

    // The base64Image must have the data URI prefix for cloudinary (e.g., data:image/jpeg;base64,...)
    // If not, we might need to prepend it, but let's assume the frontend sends the proper format or we'll ensure it does.
    const receiptUrl = await uploadImageBase64(base64Image);
    
    res.status(200).json({
      success: true,
      data: {
        receiptUrl
      }
    });
  } catch (error) {
    console.error('Error in upload route:', error);
    res.status(500).json({ success: false, message: 'Server error during upload' });
  }
});

module.exports = router;
