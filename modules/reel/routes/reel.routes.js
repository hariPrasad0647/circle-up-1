const express = require('express');
const router = express.Router();

const auth = require('../../../middleware/auth');
const validate = require('../../../middleware/validate');
const { uuidParam } = require('../../../utils/paramValidators');
const { uploadReel } = require('../../../middleware/upload');
const { createReelValidator } = require('../validators/reel.validator');
const { commentTextValidator } = require('../../comment/validators/comment.validator');
const {
  createReelController,
  getPublicReelsController,
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

// GET /api/reels/discover — reels from public accounts only (must precede /:id)
router.get('/discover', auth, getPublicReelsController);

// GET /api/reels/:id
router.get('/:id', auth, uuidParam('id'), validate, getReelController);

// POST /api/reels/:id/like
router.post('/:id/like', auth, uuidParam('id'), validate, likeReelController);

// POST /api/reels/:id/save
router.post('/:id/save', auth, uuidParam('id'), validate, saveReelController);

// POST /api/reels/:id/share
router.post('/:id/share', auth, uuidParam('id'), validate, shareReelController);

// Comments
router.get('/:id/comments', auth, uuidParam('id'), validate, setReel, getCommentsController);
router.post(
  '/:id/comments',
  auth,
  setReel,
  uuidParam('id'),
  commentTextValidator,
  validate,
  addCommentController
);
router.get(
  '/:id/comments/:commentId/replies',
  auth,
  uuidParam('id'),
  uuidParam('commentId'),
  validate,
  getRepliesController
);
router.post(
  '/:id/comments/:commentId/replies',
  auth,
  setReel,
  uuidParam('id'),
  uuidParam('commentId'),
  commentTextValidator,
  validate,
  addReplyController
);
router.delete(
  '/:id/comments/:commentId',
  auth,
  uuidParam('id'),
  uuidParam('commentId'),
  validate,
  deleteCommentController
);
router.post(
  '/:id/comments/:commentId/like',
  auth,
  uuidParam('id'),
  uuidParam('commentId'),
  validate,
  likeCommentController
);

module.exports = router;
