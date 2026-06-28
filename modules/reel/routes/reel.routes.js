const express = require('express');
const router = express.Router();

const auth = require('../../../middleware/auth');
const validate = require('../../../middleware/validate');
const { uploadReel } = require('../../../middleware/upload');
const { createReelValidator } = require('../validators/reel.validator');
const { commentTextValidator } = require('../../comment/validators/comment.validator');
const {
  createReelController,
  getReelController,
  likeReelController,
  saveReelController,
  shareReelController,
} = require('../controllers/reel.controller');
const {
  addCommentController,
  getCommentsController,
  addReplyController,
  getRepliesController,
  deleteCommentController,
  likeCommentController,
} = require('../../comment/controllers/comment.controller');

const setReel = (req, res, next) => { req.contentType = 'reel'; next(); };

// POST /api/reels
router.post('/', auth, uploadReel, createReelValidator, validate, createReelController);

// GET /api/reels/:id
router.get('/:id', auth, getReelController);

// POST /api/reels/:id/like
router.post('/:id/like', auth, likeReelController);

// POST /api/reels/:id/save
router.post('/:id/save', auth, saveReelController);

// POST /api/reels/:id/share
router.post('/:id/share', auth, shareReelController);

// Comments
router.get('/:id/comments', auth, setReel, getCommentsController);
router.post('/:id/comments', auth, setReel, commentTextValidator, validate, addCommentController);
router.get('/:id/comments/:commentId/replies', auth, getRepliesController);
router.post('/:id/comments/:commentId/replies', auth, setReel, commentTextValidator, validate, addReplyController);
router.delete('/:id/comments/:commentId', auth, deleteCommentController);
router.post('/:id/comments/:commentId/like', auth, likeCommentController);

module.exports = router;
