const express = require('express');
const router = express.Router();

const auth = require('../../../middleware/auth');
const validate = require('../../../middleware/validate');
const { uuidParam } = require('../../../utils/paramValidators');
const { uploadPostImages } = require('../../../middleware/upload');
const { createPostValidator } = require('../validators/post.validator');
const { commentTextValidator } = require('../../comment/validators/comment.validator');
const {
  createPostController,
  getPostController,
  likePostController,
  savePostController,
  sharePostController,
} = require('../controllers/post.controller');
const {
  addCommentController,
  getCommentsController,
  addReplyController,
  getRepliesController,
  deleteCommentController,
  likeCommentController,
} = require('../../comment/controllers/comment.controller');

const setPost = (req, res, next) => { req.contentType = 'post'; next(); };

// POST /api/posts
router.post('/', auth, uploadPostImages, createPostValidator, validate, createPostController);

// GET /api/posts/:id
router.get('/:id', auth, uuidParam('id'), validate, getPostController);

// POST /api/posts/:id/like
router.post('/:id/like', auth, uuidParam('id'), validate, likePostController);

// POST /api/posts/:id/save
router.post('/:id/save', auth, uuidParam('id'), validate, savePostController);

// POST /api/posts/:id/share
router.post('/:id/share', auth, uuidParam('id'), validate, sharePostController);

// Comments
router.get('/:id/comments', auth, uuidParam('id'), validate, setPost, getCommentsController);
router.post(
  '/:id/comments',
  auth,
  setPost,
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
  setPost,
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
