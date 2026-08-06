const { MILESTONE_THRESHOLDS } = require('../models/Goal');

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Percent saved so far, capped at 100.
 */
function percentOf(goal) {
  if (!goal.targetAmount) return 0;
  return Math.min(100, (goal.savedAmount / goal.targetAmount) * 100);
}

/**
 * Which milestone thresholds are newly crossed by moving from
 * `beforeAmount` to `afterAmount`, relative to `targetAmount`.
 */
function milestonesCrossed(targetAmount, beforeAmount, afterAmount, alreadyReached = []) {
  if (!targetAmount) return [];
  const beforePct = (beforeAmount / targetAmount) * 100;
  const afterPct = (afterAmount / targetAmount) * 100;
  return MILESTONE_THRESHOLDS.filter(
    t => beforePct < t && afterPct >= t && !alreadyReached.includes(t)
  );
}

/**
 * Given a saving rate (₹/day), how many days until targetAmount - savedAmount is closed.
 * Returns null if the rate is zero/negative (goal isn't progressing).
 */
function daysToComplete(remainingAmount, dailyRate) {
  if (!dailyRate || dailyRate <= 0) return null;
  return Math.max(0, Math.ceil(remainingAmount / dailyRate));
}

function projectedCompletionDate(remainingAmount, dailyRate, from = new Date()) {
  const days = daysToComplete(remainingAmount, dailyRate);
  if (days === null) return null;
  return new Date(from.getTime() + days * DAY_MS);
}

/**
 * Core "day-delta" primitive — how many days a contribution (or expense)
 * moves the projected completion date, given the user's trailing daily
 * saving rate. Positive amount => negative delta (closer); this returns
 * the magnitude, callers attach direction via amount's sign.
 */
function dayDeltaForAmount(amount, dailyRate) {
  if (!dailyRate || dailyRate <= 0) return 0;
  return Math.round((Math.abs(amount) / dailyRate) * 10) / 10;
}

/**
 * Trailing daily saving rate from a user's contribution history.
 * Falls back to a small positive default so day-delta math never divides by zero
 * for brand-new users with no history yet.
 */
function trailingDailyRate(recentContributions, days = 30) {
  const cutoff = Date.now() - days * DAY_MS;
  const total = recentContributions
    .filter(c => new Date(c.createdAt).getTime() >= cutoff)
    .reduce((sum, c) => sum + c.amount, 0);
  const rate = total / days;
  return rate > 0 ? rate : 50; // ₹50/day floor so early users still get a meaningful estimate
}

module.exports = {
  percentOf,
  milestonesCrossed,
  daysToComplete,
  projectedCompletionDate,
  dayDeltaForAmount,
  trailingDailyRate,
};
