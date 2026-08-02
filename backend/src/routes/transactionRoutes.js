const express = require('express');
const { getTransactions, createTransaction, deleteTransaction } = require('../controllers/transactionController');

const router = express.Router();

router.route('/user/:userId')
  .get(getTransactions);

router.route('/')
  .post(createTransaction);

router.route('/:id')
  .delete(deleteTransaction);

module.exports = router;
