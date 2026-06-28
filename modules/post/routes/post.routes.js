const express = require('express');
const router = express.Router();

const auth = require('../../../middleware/auth');
const validate = require('../../../middleware/validate');
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
router.get('/:id', auth, getPostController);

// POST /api/posts/:id/like
router.post('/:id/like', auth, likePostController);

// POST /api/posts/:id/save
router.post('/:id/save', auth, savePostController);

// POST /api/posts/:id/share
router.post('/:id/share', auth, sharePostController);

// Comments
router.get('/:id/comments', auth, setPost, getCommentsController);
router.post('/:id/comments', auth, setPost, commentTextValidator, validate, addCommentController);
router.get('/:id/comments/:commentId/replies', auth, getRepliesController);
router.post('/:id/comments/:commentId/replies', auth, setPost, commentTextValidator, validate, addReplyController);
router.delete('/:id/comments/:commentId', auth, deleteCommentController);
router.post('/:id/comments/:commentId/like', auth, likeCommentController);

module.exports = router;
