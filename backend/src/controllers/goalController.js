const Goal = require('../models/Goal');
const GoalContribution = require('../models/GoalContribution');
const { generateGoalPlan, generateCoachMessage, generateImpactLine } = require('../utils/geminiAI');
const { milestonesCrossed, dayDeltaForAmount, trailingDailyRate, projectedCompletionDate } = require('../utils/goalMath');
const { bumpStreak, reconcileStreak } = require('../utils/streak');
const { checkAchievementsAfterContribution, checkAchievementsAfterGoalCreation } = require('../utils/achievements');

// @desc    List a user's goals
// @route   GET /api/goals/user/:userId
// @access  Public
const getGoals = async (req, res) => {
  try {
    const goals = await Goal.find({ user: req.params.userId, status: { $ne: 'archived' } }).sort({ createdAt: -1 });
    // Streak state is server-authoritative — reconcile on every read so a missed
    // day is reflected immediately rather than waiting on a nightly cron.
    const streak = await reconcileStreak(req.params.userId);
    res.status(200).json({ success: true, data: goals, streak });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get a single goal
// @route   GET /api/goals/:id
// @access  Public
const getGoal = async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);
    if (!goal) return res.status(404).json({ success: false, message: 'Goal not found' });
    res.status(200).json({ success: true, data: goal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Step 5 of creation — AI-generated plan (monthly/weekly/daily + motivational line)
// @route   POST /api/goals/plan
// @access  Public
const getGoalPlan = async (req, res) => {
  try {
    const { title, targetAmount, deadline, avgMonthlySaving } = req.body;
    if (!title || !targetAmount) {
      return res.status(400).json({ success: false, message: 'title and targetAmount are required' });
    }
    const plan = await generateGoalPlan({ title, targetAmount, deadline, avgMonthlySaving });
    res.status(200).json({ success: true, data: plan });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a goal (final step of creation flow)
// @route   POST /api/goals
// @access  Public
const createGoal = async (req, res) => {
  try {
    const {
      user, title, category, emoji, imageUrl, targetAmount, deadline,
      requiredMonthly, requiredWeekly, requiredDaily, projectedCompletionDate: projectedDate,
    } = req.body;

    if (!user || !title || !targetAmount) {
      return res.status(400).json({ success: false, message: 'user, title and targetAmount are required' });
    }

    const existingCount = await Goal.countDocuments({ user, status: { $ne: 'archived' } });

    const goal = await Goal.create({
      user, title, category, emoji, imageUrl, targetAmount,
      deadline: deadline || null,
      requiredMonthly, requiredWeekly, requiredDaily,
      projectedCompletionDate: projectedDate || null,
      isPrimary: existingCount === 0, // first goal defaults to primary for expense-impact toasts
    });

    const newlyUnlocked = await checkAchievementsAfterGoalCreation(user, goal);

    res.status(201).json({ success: true, data: goal, newlyUnlocked });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Manual top-up / withdrawal against a goal
// @route   POST /api/goals/:id/contribute
// @access  Public
const contribute = async (req, res) => {
  try {
    const { amount, source = 'manual', note, photoUrl } = req.body;
    if (!amount || typeof amount !== 'number') {
      return res.status(400).json({ success: false, message: 'amount (number) is required' });
    }

    const goal = await Goal.findById(req.params.id);
    if (!goal) return res.status(404).json({ success: false, message: 'Goal not found' });

    const beforeAmount = goal.savedAmount;
    // Cap at target — overflow doesn't silently push the ring past 100%.
    const afterAmount = Math.max(0, Math.min(goal.targetAmount, beforeAmount + amount));
    const actualDelta = afterAmount - beforeAmount;

    const recent = await GoalContribution.find({ user: goal.user }).sort({ createdAt: -1 }).limit(60);
    const dailyRate = trailingDailyRate(recent);
    const dayDelta = dayDeltaForAmount(actualDelta, dailyRate);

    const crossed = milestonesCrossed(goal.targetAmount, beforeAmount, afterAmount, goal.milestonesReached);

    goal.savedAmount = afterAmount;
    goal.milestonesReached = [...goal.milestonesReached, ...crossed];
    if (afterAmount >= goal.targetAmount && goal.status !== 'completed') {
      goal.status = 'completed';
      goal.completedAt = new Date();
    }
    goal.projectedCompletionDate = projectedCompletionDate(
      goal.targetAmount - afterAmount,
      dailyRate
    );
    await goal.save();

    const contribution = await GoalContribution.create({
      goal: goal._id,
      user: goal.user,
      amount: actualDelta,
      source,
      note: note || null,
      photoUrl: photoUrl || null,
      runningTotal: afterAmount,
      dayDelta,
      milestonesCrossed: crossed,
    });

    let streak = null;
    if (actualDelta > 0) {
      streak = await bumpStreak(goal.user);
    }

    const newlyUnlocked = await checkAchievementsAfterContribution(goal.user, goal);

    res.status(200).json({
      success: true,
      data: {
        goal,
        contribution,
        milestonesCrossed: crossed,
        streak,
        newlyUnlocked,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    What-if simulator (server-side fallback if client cache is stale)
// @route   POST /api/goals/:id/simulate
// @access  Public
const simulate = async (req, res) => {
  try {
    const { extraPerWeek = 0 } = req.body;
    const goal = await Goal.findById(req.params.id);
    if (!goal) return res.status(404).json({ success: false, message: 'Goal not found' });

    const recent = await GoalContribution.find({ user: goal.user }).sort({ createdAt: -1 }).limit(60);
    const baseDailyRate = trailingDailyRate(recent);
    const remaining = goal.targetAmount - goal.savedAmount;

    const originalDate = projectedCompletionDate(remaining, baseDailyRate);
    const boostedDailyRate = baseDailyRate + extraPerWeek / 7;
    const projectedDate = projectedCompletionDate(remaining, boostedDailyRate);

    const daysEarlier = originalDate && projectedDate
      ? Math.round((originalDate.getTime() - projectedDate.getTime()) / 86400000)
      : 0;

    res.status(200).json({
      success: true,
      data: { originalDate, projectedDate, daysEarlier },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Fresh AI coach line — rate-limited to 1 generation per session
// @route   GET /api/goals/:id/coach-message
// @access  Public
const getCoachMessage = async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);
    if (!goal) return res.status(404).json({ success: false, message: 'Goal not found' });

    // Reuse the cached message if generated within the last hour (proxy for "this session").
    const cacheFresh = goal.lastCoachMessageAt && (Date.now() - goal.lastCoachMessageAt.getTime() < 60 * 60 * 1000);
    if (cacheFresh && goal.lastCoachMessage) {
      return res.status(200).json({ success: true, data: { message: goal.lastCoachMessage, cached: true } });
    }

    const { transactions = [] } = req.body || {};
    const message = await generateCoachMessage({
      goalTitle: goal.title,
      savedAmount: goal.savedAmount,
      targetAmount: goal.targetAmount,
      recentTransactions: transactions,
      recentMessages: goal.recentCoachMessages,
    });

    goal.lastCoachMessage = message;
    goal.lastCoachMessageAt = new Date();
    goal.recentCoachMessages = [...goal.recentCoachMessages, message].slice(-10);
    await goal.save();

    res.status(200).json({ success: true, data: { message, cached: false } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Paginated timeline (milestone + contribution log)
// @route   GET /api/goals/:id/timeline
// @access  Public
const getTimeline = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const entries = await GoalContribution.find({ goal: req.params.id })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({ success: true, data: entries });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Called after an expense is saved — returns the day-delta impact line for the toast
// @route   POST /api/goals/impact
// @access  Public
const getExpenseImpact = async (req, res) => {
  try {
    const { userId, amount, category, direction = 'delay' } = req.body;
    if (!userId || !amount) {
      return res.status(400).json({ success: false, message: 'userId and amount are required' });
    }

    const primaryGoal = await Goal.findOne({ user: userId, status: 'active', isPrimary: true });
    if (!primaryGoal) {
      return res.status(200).json({ success: true, data: null }); // no active primary goal — no toast
    }

    const recent = await GoalContribution.find({ user: userId }).sort({ createdAt: -1 }).limit(60);
    const dailyRate = trailingDailyRate(recent);
    const dayDelta = dayDeltaForAmount(amount, dailyRate);

    const message = await generateImpactLine({
      amount, category, goalTitle: primaryGoal.title, dayDelta, direction,
    });

    res.status(200).json({
      success: true,
      data: { goalId: primaryGoal._id, goalTitle: primaryGoal.title, dayDelta, direction, message },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getGoals,
  getGoal,
  getGoalPlan,
  createGoal,
  contribute,
  simulate,
  getCoachMessage,
  getTimeline,
  getExpenseImpact,
};
