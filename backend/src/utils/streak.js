const SavingStreak = require('../models/SavingStreak');

function toDateOnly(d) {
  const date = new Date(d);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Bumps the user's saving streak on any positive contribution, once per
 * calendar day. A gap of more than one day resets currentStreak to 1
 * (today counts) while preserving longestStreak.
 */
async function bumpStreak(userId) {
  let streak = await SavingStreak.findOne({ user: userId });
  if (!streak) {
    streak = new SavingStreak({ user: userId });
  }

  const today = toDateOnly(new Date());
  const last = streak.lastSavedDate ? toDateOnly(streak.lastSavedDate) : null;

  if (last && last.getTime() === today.getTime()) {
    // Already saved today — streak already counted, nothing to bump.
    return streak;
  }

  const gapDays = last ? Math.round((today.getTime() - last.getTime()) / DAY_MS) : null;

  if (gapDays === 1) {
    streak.currentStreak += 1;
  } else {
    // First-ever save, or a gap > 1 day broke the streak — start fresh at 1.
    streak.currentStreak = 1;
  }

  streak.longestStreak = Math.max(streak.longestStreak, streak.currentStreak);
  streak.lastSavedDate = today;
  streak.history = [...streak.history, today].slice(-90);

  await streak.save();
  return streak;
}

/**
 * Nightly-cron-style check: if the user hasn't saved in >1 day, zero out
 * currentStreak (longestStreak is untouched). Safe to call on-read too,
 * since streak state must be server-authoritative, not trusted from cache.
 */
async function reconcileStreak(userId) {
  const streak = await SavingStreak.findOne({ user: userId });
  if (!streak || !streak.lastSavedDate) return streak;

  const today = toDateOnly(new Date());
  const last = toDateOnly(streak.lastSavedDate);
  const gapDays = Math.round((today.getTime() - last.getTime()) / DAY_MS);

  if (gapDays > 1 && streak.currentStreak !== 0) {
    streak.currentStreak = 0;
    await streak.save();
  }
  return streak;
}

module.exports = { bumpStreak, reconcileStreak };
