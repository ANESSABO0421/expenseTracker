const express = require('express');
const router = express.Router();
const { generateInsights } = require('../utils/geminiAI');

// @desc    Generate personalized AI insights based on transaction data
// @route   POST /api/insights
// @access  Public (should ideally be protected, but keeping it open for development)
router.post('/', async (req, res) => {
  try {
    const { transactions } = req.body;
    
    // We expect the frontend to pass the user's transactions array
    const insights = await generateInsights(transactions);
    
    res.status(200).json({
      success: true,
      data: insights
    });
  } catch (error) {
    console.error('Error generating insights:', error);
    res.status(500).json({ success: false, message: 'Server error while generating insights' });
  }
});

module.exports = router;
