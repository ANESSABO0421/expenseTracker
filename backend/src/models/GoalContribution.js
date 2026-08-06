const mongoose = require('mongoose');

// Every top-up / withdrawal against a goal — powers the vertical timeline
// and the expense-impact toast's "delayed by N days" math.
const GoalContributionSchema = new mongoose.Schema({
  goal: { type: mongoose.Schema.Types.ObjectId, ref: 'Goal', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true }, // signed: + top-up, - withdrawal
  source: { type: String, enum: ['manual', 'roundup', 'income_split', 'expense_impact'], default: 'manual' },
  note: { type: String, default: null },
  photoUrl: { type: String, default: null },
  runningTotal: { type: Number, required: true }, // savedAmount snapshot after this entry
  dayDelta: { type: Number, default: 0 }, // days this moved completion, ± (cached at write time)
  milestonesCrossed: { type: [Number], default: [] }, // thresholds crossed by this exact contribution
  createdAt: { type: Date, default: Date.now },
});

GoalContributionSchema.index({ goal: 1, createdAt: -1 });

module.exports = mongoose.model('GoalContribution', GoalContributionSchema);
