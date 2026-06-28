const express = require('express');
const router = express.Router();

const auth = require('../../../middleware/auth');
const validate = require('../../../middleware/validate');
const { uploadPostImages } = require('../../../middleware/upload');
const { createPostValidator } = require('../validators/post.validator');
const {
  createPostController,
  getPostController,
  likePostController,
  savePostController,
  sharePostController,
} = require('../controllers/post.controller');

// POST /api/posts
router.post('/', auth, uploadPostImages, createPostValidator, validate, createPostController);

// GET /api/posts/:id
router.get('/:id', auth, getPostController);

// POST /api/posts/:id/like   — toggle like
router.post('/:id/like', auth, likePostController);

// POST /api/posts/:id/save   — toggle save
router.post('/:id/save', auth, savePostController);

// POST /api/posts/:id/share  — share to followers
router.post('/:id/share', auth, sharePostController);

module.exports = router;
