const express = require('express');
const router = express.Router();

const auth = require('../../../middleware/auth');
const validate = require('../../../middleware/validate');
const { uploadContent } = require('../../../middleware/upload');
const { createContentValidator } = require('../validators/content.validator');
const { createContentController } = require('../controllers/content.controller');

// POST /api/content — create a post (images) or a reel (video), based on which fields are sent
router.post('/', auth, uploadContent, createContentValidator, validate, createContentController);

module.exports = router;
