const mongoose = require('mongoose');

// One streak per user (spans all goals — saving toward anything keeps it alive).
const SavingStreakSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  currentStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  lastSavedDate: { type: Date, default: null }, // date-only granularity; streak breaks if gap > 1 day
  history: { type: [Date], default: [] }, // last 90 days, for the dot-trail UI
});

module.exports = mongoose.model('SavingStreak', SavingStreakSchema);
