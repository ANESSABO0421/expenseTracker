const Achievement = require('../models/Achievement');
const Goal = require('../models/Goal');
const SavingStreak = require('../models/SavingStreak');

/**
 * Unlocks `key` for the user if not already unlocked. Silently no-ops on
 * duplicates (relies on the unique index) rather than pre-checking, to stay
 * race-safe under concurrent contributions.
 */
async function unlock(userId, key, goalRef = null) {
  try {
    const doc = await Achievement.create({ user: userId, key, goalRef });
    return doc;
  } catch (error) {
    if (error.code === 11000) return null; // already unlocked
    throw error;
  }
}

/**
 * Re-evaluates every achievement that could plausibly have changed after a
 * goal contribution, and unlocks any newly-earned ones. Returns the list of
 * newly unlocked achievement keys (for the celebration overlay to consume).
 */
async function checkAchievementsAfterContribution(userId, goal) {
  const newlyUnlocked = [];

  const goals = await Goal.find({ user: userId });

  const totalSaved = goals.reduce((sum, g) => sum + g.savedAmount, 0);
  if (totalSaved >= 10000 && (await unlock(userId, 'saved_10000'))) {
    newlyUnlocked.push('saved_10000');
  }

  if (goal.percent >= 50 && (await unlock(userId, 'halfway', goal._id))) {
    newlyUnlocked.push('halfway');
  }

  if (goal.status === 'completed' && (await unlock(userId, 'first_completed', goal._id))) {
    newlyUnlocked.push('first_completed');
  }

  const activeWithProgress = goals.filter(g => g.status === 'active' && g.savedAmount > 0).length;
  if (activeWithProgress >= 3 && (await unlock(userId, 'savings_master'))) {
    newlyUnlocked.push('savings_master');
  }

  const streak = await SavingStreak.findOne({ user: userId });
  if (streak && streak.currentStreak >= 30 && (await unlock(userId, 'streak_30'))) {
    newlyUnlocked.push('streak_30');
  }

  return newlyUnlocked;
}

async function checkAchievementsAfterGoalCreation(userId, goal) {
  const newlyUnlocked = [];
  if (await unlock(userId, 'first_goal', goal._id)) newlyUnlocked.push('first_goal');
  return newlyUnlocked;
}

module.exports = {
  unlock,
  checkAchievementsAfterContribution,
  checkAchievementsAfterGoalCreation,
};
