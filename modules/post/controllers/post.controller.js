const { createPost, getPostById, formatPost } = require('../services/post.service');
const {
  toggleLike,
  toggleSave,
  shareContent,
  getInteractionStats,
} = require('../services/interaction.service');
const { success, error } = require('../../../utils/response');

const createPostController = async (req, res, next) => {
  try {
    if (!req.cdnUrls || req.cdnUrls.length === 0) {
      return error(res, 400, 'At least one image is required');
    }
    const { caption, isPrivate } = req.body;
    const post = await createPost(req.user.id, { caption, isPrivate }, req.cdnUrls);
    return success(res, 201, 'Post created successfully', post);
  } catch (err) {
    next(err);
  }
};

const getPostController = async (req, res, next) => {
  try {
    const post = await getPostById(req.params.id);
    if (!post) return error(res, 404, 'Post not found');
    if (post.isPrivate && post.userId !== req.user.id) {
      return error(res, 403, 'This post is private');
    }
    const stats = await getInteractionStats('post', req.params.id, req.user.id);
    return success(res, 200, 'Post fetched successfully', formatPost(post, stats));
  } catch (err) {
    next(err);
  }
};

const likePostController = async (req, res, next) => {
  try {
    const result = await toggleLike(req.user.id, 'post', req.params.id);
    return success(res, 200, result.liked ? 'Post liked' : 'Post unliked', result);
  } catch (err) {
    if (err.status) return error(res, err.status, err.message);
    next(err);
  }
};

const savePostController = async (req, res, next) => {
  try {
    const result = await toggleSave(req.user.id, 'post', req.params.id);
    return success(res, 200, result.saved ? 'Post saved' : 'Post unsaved', result);
  } catch (err) {
    if (err.status) return error(res, err.status, err.message);
    next(err);
  }
};

const sharePostController = async (req, res, next) => {
  try {
    const result = await shareContent(req.user.id, 'post', req.params.id);
    return success(res, 200, 'Post shared with your followers', result);
  } catch (err) {
    if (err.status) return error(res, err.status, err.message);
    next(err);
  }
};

module.exports = {
  createPostController,
  getPostController,
  likePostController,
  savePostController,
  sharePostController,
};
