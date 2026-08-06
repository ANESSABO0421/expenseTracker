const mongoose = require('mongoose');

const ACHIEVEMENT_CATALOGUE = [
  { key: 'first_goal', label: 'First Goal', emoji: '🌱', description: 'Created your first savings goal' },
  { key: 'saved_10000', label: '₹10,000 Saved', emoji: '💰', description: 'Saved ₹10,000 across all goals' },
  { key: 'streak_30', label: '30 Day Streak', emoji: '🔥', description: 'Kept a 30 day saving streak alive' },
  { key: 'halfway', label: 'Reached 50%', emoji: '🏅', description: 'Reached 50% on any goal' },
  { key: 'first_completed', label: 'Completed First Goal', emoji: '🏆', description: 'Fully funded your first goal' },
  { key: 'savings_master', label: 'Savings Master', emoji: '👑', description: 'Reached 3 goals at once' },
  { key: 'budget_champion', label: 'Budget Champion', emoji: '🎯', description: 'Stayed under budget 4 weeks in a row' },
];

const AchievementSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  key: { type: String, required: true, enum: ACHIEVEMENT_CATALOGUE.map(a => a.key) },
  unlockedAt: { type: Date, default: Date.now },
  goalRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Goal', default: null },
});

AchievementSchema.index({ user: 1, key: 1 }, { unique: true });

module.exports = mongoose.model('Achievement', AchievementSchema);
module.exports.ACHIEVEMENT_CATALOGUE = ACHIEVEMENT_CATALOGUE;
