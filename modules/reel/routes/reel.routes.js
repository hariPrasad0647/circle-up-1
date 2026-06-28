const express = require('express');
const router = express.Router();

const auth = require('../../../middleware/auth');
const validate = require('../../../middleware/validate');
const { uploadReel } = require('../../../middleware/upload');
const { createReelValidator } = require('../validators/reel.validator');
const {
  createReelController,
  getReelController,
  likeReelController,
  saveReelController,
  shareReelController,
} = require('../controllers/reel.controller');

// POST /api/reels
router.post('/', auth, uploadReel, createReelValidator, validate, createReelController);

// GET /api/reels/:id
router.get('/:id', auth, getReelController);

// POST /api/reels/:id/like   — toggle like
router.post('/:id/like', auth, likeReelController);

// POST /api/reels/:id/save   — toggle save
router.post('/:id/save', auth, saveReelController);

// POST /api/reels/:id/share  — share to followers
router.post('/:id/share', auth, shareReelController);

module.exports = router;
