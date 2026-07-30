const { getFeed, getHomeFeed } = require('../services/feed.service');
const { success } = require('../../../utils/response');

const getFeedController = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const result = await getFeed(req.user.id, { page, limit });
    return success(res, 200, 'Feed fetched', result);
  } catch (err) {
    next(err);
  }
};

const getHomeFeedController = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const result = await getHomeFeed(req.user.id, { page, limit });
    return success(res, 200, 'Home feed fetched', result);
  } catch (err) {
    next(err);
  }
};

module.exports = { getFeedController, getHomeFeedController };
