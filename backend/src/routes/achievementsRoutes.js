const express = require('express');
const router = express.Router();
const { getAchievements } = require('../controllers/achievementsController');

router.route('/user/:userId').get(getAchievements);

module.exports = router;
