const Achievement = require('../models/Achievement');
const { ACHIEVEMENT_CATALOGUE } = Achievement;
const Goal = require('../models/Goal');

// @desc    Unlocked + locked badges, with a "next closest" pointer
// @route   GET /api/achievements/user/:userId
// @access  Public
const getAchievements = async (req, res) => {
  try {
    const userId = req.params.userId;
    const unlocked = await Achievement.find({ user: userId });
    const unlockedKeys = new Set(unlocked.map(a => a.key));

    const badges = ACHIEVEMENT_CATALOGUE.map(def => ({
      ...def,
      unlocked: unlockedKeys.has(def.key),
      unlockedAt: unlocked.find(a => a.key === def.key)?.unlockedAt || null,
    }));

    // "Next closest" — only meaningful for progress-measurable badges; keep it simple
    // and point at the first locked badge whose goal is closest to completion.
    let nextClosest = null;
    const lockedKeys = badges.filter(b => !b.unlocked).map(b => b.key);
    if (lockedKeys.includes('halfway') || lockedKeys.includes('first_completed')) {
      const goals = await Goal.find({ user: userId, status: 'active' }).sort({ savedAmount: -1 });
      if (goals[0]) {
        nextClosest = lockedKeys.includes('halfway') && goals[0].percent < 50 ? 'halfway' : 'first_completed';
      }
    } else if (lockedKeys.length > 0) {
      nextClosest = lockedKeys[0];
    }

    res.status(200).json({ success: true, data: { badges, nextClosest } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAchievements };
