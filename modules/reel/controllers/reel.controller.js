const { createReel, getReelById, formatReel, getPublicReelsFeed } = require('../services/reel.service');
const {
  toggleLike,
  toggleSave,
  shareContent,
  getInteractionStats,
} = require('../../post/services/interaction.service');
const { success, error } = require('../../../utils/response');

const createReelController = async (req, res, next) => {
  try {
    if (!req.reelUpload || !req.reelUpload.videoUrl) {
      return error(res, 400, 'A video file is required');
    }
    const { caption, isPrivate } = req.body;
    const { videoUrl, thumbnailUrl } = req.reelUpload;
    const reel = await createReel(req.user.id, { caption, isPrivate }, videoUrl, thumbnailUrl);
    return success(res, 201, 'Reel created successfully', reel);
  } catch (err) {
    next(err);
  }
};

const getPublicReelsController = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const result = await getPublicReelsFeed(req.user.id, { page, limit });
    return success(res, 200, 'Reels fetched', result);
  } catch (err) {
    next(err);
  }
};

const getReelController = async (req, res, next) => {
  try {
    const reel = await getReelById(req.params.id);
    if (!reel) return error(res, 404, 'Reel not found');
    if (reel.isPrivate && reel.userId !== req.user.id) {
      return error(res, 403, 'This reel is private');
    }
    const stats = await getInteractionStats('reel', req.params.id, req.user.id);
    return success(res, 200, 'Reel fetched successfully', formatReel(reel, stats));
  } catch (err) {
    next(err);
  }
};

const likeReelController = async (req, res, next) => {
  try {
    const result = await toggleLike(req.user.id, 'reel', req.params.id);
    return success(res, 200, result.liked ? 'Reel liked' : 'Reel unliked', result);
  } catch (err) {
    if (err.status) return error(res, err.status, err.message);
    next(err);
  }
};

const saveReelController = async (req, res, next) => {
  try {
    const result = await toggleSave(req.user.id, 'reel', req.params.id);
    return success(res, 200, result.saved ? 'Reel saved' : 'Reel unsaved', result);
  } catch (err) {
    if (err.status) return error(res, err.status, err.message);
    next(err);
  }
};

const shareReelController = async (req, res, next) => {
  try {
    const result = await shareContent(req.user.id, 'reel', req.params.id);
    return success(res, 200, 'Reel shared with your followers', result);
  } catch (err) {
    if (err.status) return error(res, err.status, err.message);
    next(err);
  }
};

module.exports = {
  createReelController,
  getPublicReelsController,
  getReelController,
  likeReelController,
  saveReelController,
  shareReelController,
};
