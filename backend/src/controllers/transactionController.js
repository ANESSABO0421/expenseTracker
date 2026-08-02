const Transaction = require('../models/Transaction');

// @desc    Get all transactions
// @route   GET /api/transactions
// @access  Public
const getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find().populate('categoryId').sort({ date: -1 });
    res.status(200).json(transactions);
  } catch (error) {
    res.status(500);
    throw new Error(error.message);
  }
};

// @desc    Create a new transaction
// @route   POST /api/transactions
// @access  Public
const createTransaction = async (req, res) => {
  try {
    const { amount, description, date, categoryId, userId, isSubscription } = req.body;
    
    if (!amount || !description || !categoryId || !userId) {
      res.status(400);
      throw new Error('Please add all required fields');
    }

    const transaction = await Transaction.create({
      amount,
      description,
      date: date || Date.now(),
      categoryId,
      userId,
      isSubscription
    });

    res.status(201).json(transaction);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
};

// @desc    Delete a transaction
// @route   DELETE /api/transactions/:id
// @access  Public
const deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      res.status(404);
      throw new Error('Transaction not found');
    }

    await transaction.deleteOne();
    res.status(200).json({ id: req.params.id });
  } catch (error) {
    res.status(500);
    throw new Error(error.message);
  }
};

module.exports = {
  getTransactions,
  createTransaction,
  deleteTransaction
};
