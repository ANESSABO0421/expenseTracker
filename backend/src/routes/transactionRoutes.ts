import { Router } from 'express';
import { getTransactions, createTransaction, deleteTransaction } from '../controllers/transactionController';

const router = Router();

router.route('/')
  .get(getTransactions)
  .post(createTransaction);

router.route('/:id')
  .delete(deleteTransaction);

export default router;
