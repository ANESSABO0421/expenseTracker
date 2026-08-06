const mongoose = require('mongoose');

const MILESTONE_THRESHOLDS = [5, 10, 25, 50, 75, 90, 100];

const GoalSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  category: {
    type: String,
    enum: ['tech', 'travel', 'home', 'vehicle', 'education', 'wedding', 'gaming', 'custom'],
    default: 'custom',
  },
  emoji: { type: String, default: '🎯' },
  imageUrl: { type: String },

  targetAmount: { type: Number, required: true },
  savedAmount: { type: Number, default: 0 },
  deadline: { type: Date, default: null }, // null = open-ended

  projectedCompletionDate: { type: Date },
  requiredMonthly: { type: Number },
  requiredWeekly: { type: Number },
  requiredDaily: { type: Number },

  status: { type: String, enum: ['active', 'completed', 'archived'], default: 'active' },
  isPrimary: { type: Boolean, default: false }, // which goal absorbs the expense-impact toast

  milestonesReached: { type: [Number], default: [] },

  lastCoachMessage: { type: String },
  lastCoachMessageAt: { type: Date },
  recentCoachMessages: { type: [String], default: [] }, // last 10, to avoid repeats

  createdAt: { type: Date, default: Date.now },
  completedAt: { type: Date, default: null },
});

GoalSchema.virtual('percent').get(function () {
  if (!this.targetAmount) return 0;
  return Math.min(100, Math.round((this.savedAmount / this.targetAmount) * 100));
});

GoalSchema.set('toJSON', { virtuals: true });
GoalSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Goal', GoalSchema);
module.exports.MILESTONE_THRESHOLDS = MILESTONE_THRESHOLDS;
