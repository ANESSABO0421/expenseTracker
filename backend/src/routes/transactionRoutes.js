const express = require('express');
const { getTransactions, createTransaction, deleteTransaction, updateTransaction } = require('../controllers/transactionController');

const router = express.Router();

router.route('/user/:userId')
  .get(getTransactions);

router.route('/')
  .post(createTransaction);

router.route('/:id')
  .put(updateTransaction)
  .delete(deleteTransaction);

module.exports = router;
