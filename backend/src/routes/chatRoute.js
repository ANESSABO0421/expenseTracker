const express = require('express');
const router = express.Router();
const { chatWithAI } = require('../utils/geminiAI');

// @desc    Ask the AI finance assistant a question, grounded in the user's own transactions
// @route   POST /api/chat
// @access  Public (frontend sends the user's own transactions as context)
router.post('/', async (req, res) => {
  try {
    const { question, transactions, history } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({ success: false, message: 'No question provided' });
    }

    const answer = await chatWithAI(question, transactions, history);

    res.status(200).json({ success: true, data: { answer } });
  } catch (error) {
    console.error('Error in chat route:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error during chat' });
  }
});

module.exports = router;
