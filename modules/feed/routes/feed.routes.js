const express = require('express');
const router = express.Router();
const auth = require('../../../middleware/auth');
const { getFeedController, getHomeFeedController } = require('../controllers/feed.controller');

// GET /api/feed/home — page 1: own posts/reels; page 2+: chronological following feed
router.get('/home', auth, getHomeFeedController);

router.get('/', auth, getFeedController);

module.exports = router;
