const express = require('express');
const router = express.Router();
const auth = require('../../../middleware/auth');
const { getFeedController } = require('../controllers/feed.controller');

router.get('/', auth, getFeedController);

module.exports = router;
