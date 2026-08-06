const express = require('express');
const router = express.Router();
const {
  getGoals, getGoal, getGoalPlan, createGoal, deleteGoal,
  contribute, simulate, getCoachMessage, getTimeline, getExpenseImpact,
} = require('../controllers/goalController');

router.route('/').post(createGoal);
router.route('/plan').post(getGoalPlan);
router.route('/impact').post(getExpenseImpact);
router.route('/user/:userId').get(getGoals);
router.route('/:id').get(getGoal).delete(deleteGoal);
router.route('/:id/contribute').post(contribute);
router.route('/:id/simulate').post(simulate);
router.route('/:id/coach-message').get(getCoachMessage).post(getCoachMessage);
router.route('/:id/timeline').get(getTimeline);

module.exports = router;
