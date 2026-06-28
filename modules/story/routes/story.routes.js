const express = require('express');
const router = express.Router();
const auth = require('../../../middleware/auth');
const { uploadStory } = require('../../../middleware/upload');
const {
  createStoryController,
  getStoryFeedController,
  getMyStoriesController,
  viewStoryController,
  getStoryViewersController,
  deleteStoryController,
} = require('../controllers/story.controller');

router.use(auth);

router.post('/', uploadStory, createStoryController);
router.get('/feed', getStoryFeedController);
router.get('/me', getMyStoriesController);
router.get('/:id', viewStoryController);
router.get('/:id/viewers', getStoryViewersController);
router.delete('/:id', deleteStoryController);

module.exports = router;
