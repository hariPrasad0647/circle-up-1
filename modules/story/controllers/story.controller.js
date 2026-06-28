const storyService = require('../services/story.service');
const { success, error } = require('../../../utils/response');

const createStoryController = async (req, res, next) => {
  try {
    if (!req.storyUpload) return error(res, 400, 'An image or video file is required');
    const { caption } = req.body;
    const story = await storyService.createStory(req.user.id, { ...req.storyUpload, caption });
    return success(res, 201, 'Story created', story);
  } catch (err) {
    next(err);
  }
};

const getStoryFeedController = async (req, res, next) => {
  try {
    const feed = await storyService.getStoryFeed(req.user.id);
    return success(res, 200, 'Story feed fetched', feed);
  } catch (err) {
    next(err);
  }
};

const getMyStoriesController = async (req, res, next) => {
  try {
    const stories = await storyService.getMyStories(req.user.id);
    return success(res, 200, 'Your stories fetched', stories);
  } catch (err) {
    next(err);
  }
};

const viewStoryController = async (req, res, next) => {
  try {
    const story = await storyService.viewStory(req.params.id, req.user.id);
    if (!story) return error(res, 404, 'Story not found or has expired');
    return success(res, 200, 'Story fetched', story);
  } catch (err) {
    next(err);
  }
};

const getStoryViewersController = async (req, res, next) => {
  try {
    const result = await storyService.getStoryViewers(req.params.id, req.user.id);
    if (result === null) return error(res, 404, 'Story not found');
    if (result.forbidden) return error(res, 403, 'You can only view viewers of your own stories');
    return success(res, 200, 'Story viewers fetched', result);
  } catch (err) {
    next(err);
  }
};

const deleteStoryController = async (req, res, next) => {
  try {
    const deleted = await storyService.deleteStory(req.params.id, req.user.id);
    if (!deleted) return error(res, 403, 'Story not found or unauthorized');
    return success(res, 200, 'Story deleted');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createStoryController,
  getStoryFeedController,
  getMyStoriesController,
  viewStoryController,
  getStoryViewersController,
  deleteStoryController,
};
