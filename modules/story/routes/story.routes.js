const express = require('express');
const router = express.Router();
const auth = require('../../../middleware/auth');
const validate = require('../../../middleware/validate');
const { uuidParam } = require('../../../utils/paramValidators');
const { uploadStory } = require('../../../middleware/upload');
const { createStoryValidator, reactValidator } = require('../validators/story.validator');
const {
  createStoryController,
  getStoryFeedController,
  getMyStoriesController,
  viewStoryController,
  getStoryViewersController,
  deleteStoryController,
  reactToStoryController,
  removeReactionController,
} = require('../controllers/story.controller');

router.use(auth);

router.post('/', uploadStory, createStoryValidator, validate, createStoryController);
router.get('/feed', getStoryFeedController);
router.get('/me', getMyStoriesController);
router.get('/:id', uuidParam('id'), validate, viewStoryController);
router.get('/:id/viewers', uuidParam('id'), validate, getStoryViewersController);
router.delete('/:id', uuidParam('id'), validate, deleteStoryController);
router.post('/:id/react', uuidParam('id'), reactValidator, validate, reactToStoryController);
router.delete('/:id/react', uuidParam('id'), validate, removeReactionController);

module.exports = router;
