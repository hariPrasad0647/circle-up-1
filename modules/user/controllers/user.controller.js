const {
  updateProfile,
  saveInterests,
  getInterests,
  sendFollowRequest,
  acceptFollowRequest,
  rejectFollowRequest,
  unfollow,
  getFollowRequests,
  getFollowers,
  getFollowing,
  getFriends,
  getSuggestions,
  getUserProfile,
  searchUsers,
  getUserPosts,
  getUserReels,
  getMyProfile,
} = require('../services/user.service');
const { getSavedPosts, getSavedReels } = require('../../post/services/interaction.service');
const { success, error } = require('../../../utils/response');

const updateProfileController = async (req, res, next) => {
  try {
    const { fullName, username, bio, profession, isPrivate } = req.body;

    const fields = {};
    if (fullName !== undefined) fields.fullName = fullName;
    if (username !== undefined) fields.username = username;
    if (bio !== undefined) fields.bio = bio;
    if (profession !== undefined) fields.profession = profession;
    if (isPrivate !== undefined) fields.isPrivate = isPrivate;

    const user = await updateProfile(req.user.id, fields, req.file);

    return success(res, 200, 'Profile updated successfully', {
      id: user.id,
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      phone: user.phone,
      bio: user.bio,
      profession: user.profession,
      isPrivate: user.isPrivate,
      profileImage: user.profileImage || null,
    });
  } catch (err) {
    if (err.status) return error(res, err.status, err.message);
    next(err);
  }
};

const saveInterestsController = async (req, res, next) => {
  try {
    const interests = await saveInterests(req.user.id, req.body.interests);
    return success(res, 200, 'Interests saved successfully', { interests });
  } catch (err) {
    if (err.status) return error(res, err.status, err.message);
    next(err);
  }
};

const getInterestsController = async (req, res, next) => {
  try {
    const interests = await getInterests(req.user.id);
    return success(res, 200, 'Interests fetched successfully', { interests });
  } catch (err) {
    next(err);
  }
};

const followController = async (req, res, next) => {
  try {
    await sendFollowRequest(req.user.id, req.params.id);
    return success(res, 200, 'Follow request sent');
  } catch (err) {
    if (err.status) return error(res, err.status, err.message);
    next(err);
  }
};

const unfollowController = async (req, res, next) => {
  try {
    await unfollow(req.user.id, req.params.id);
    return success(res, 200, 'Unfollowed successfully');
  } catch (err) {
    if (err.status) return error(res, err.status, err.message);
    next(err);
  }
};

const acceptFollowController = async (req, res, next) => {
  try {
    await acceptFollowRequest(req.user.id, req.params.id);
    return success(res, 200, 'Follow request accepted');
  } catch (err) {
    if (err.status) return error(res, err.status, err.message);
    next(err);
  }
};

const rejectFollowController = async (req, res, next) => {
  try {
    await rejectFollowRequest(req.user.id, req.params.id);
    return success(res, 200, 'Follow request rejected');
  } catch (err) {
    if (err.status) return error(res, err.status, err.message);
    next(err);
  }
};

const getFollowRequestsController = async (req, res, next) => {
  try {
    const requests = await getFollowRequests(req.user.id);
    return success(res, 200, 'Follow requests fetched', { requests });
  } catch (err) {
    next(err);
  }
};

const getFollowersController = async (req, res, next) => {
  try {
    const followers = await getFollowers(req.user.id);
    return success(res, 200, 'Followers fetched', { followers });
  } catch (err) {
    next(err);
  }
};

const getFollowingController = async (req, res, next) => {
  try {
    const following = await getFollowing(req.user.id);
    return success(res, 200, 'Following fetched', { following });
  } catch (err) {
    next(err);
  }
};

const getFriendsController = async (req, res, next) => {
  try {
    const friends = await getFriends(req.user.id);
    return success(res, 200, 'Friends fetched', { friends });
  } catch (err) {
    next(err);
  }
};

const getSuggestionsController = async (req, res, next) => {
  try {
    const suggestions = await getSuggestions(req.user.id);
    return success(res, 200, 'Friend suggestions fetched', suggestions);
  } catch (err) {
    next(err);
  }
};

const getSavedPostsController = async (req, res, next) => {
  try {
    const posts = await getSavedPosts(req.user.id);
    return success(res, 200, 'Saved posts fetched', { posts });
  } catch (err) {
    next(err);
  }
};

const getSavedReelsController = async (req, res, next) => {
  try {
    const reels = await getSavedReels(req.user.id);
    return success(res, 200, 'Saved reels fetched', { reels });
  } catch (err) {
    next(err);
  }
};

const getMeController = async (req, res, next) => {
  try {
    const postLimit = parseInt(req.query.postLimit) || 12;
    const reelLimit = parseInt(req.query.reelLimit) || 12;
    const profile = await getMyProfile(req.user.id, { postLimit, reelLimit });
    return success(res, 200, 'Profile fetched', profile);
  } catch (err) {
    if (err.status) return error(res, err.status, err.message);
    next(err);
  }
};

const getMyPostsController = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const result = await getUserPosts(req.user.id, req.user.id, { page, limit });
    return success(res, 200, 'Posts fetched', result);
  } catch (err) {
    if (err.status) return error(res, err.status, err.message);
    next(err);
  }
};

const getMyReelsController = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const result = await getUserReels(req.user.id, req.user.id, { page, limit });
    return success(res, 200, 'Reels fetched', result);
  } catch (err) {
    if (err.status) return error(res, err.status, err.message);
    next(err);
  }
};

const getUserProfileController = async (req, res, next) => {
  try {
    const profile = await getUserProfile(req.user.id, req.params.id);
    return success(res, 200, 'Profile fetched', profile);
  } catch (err) {
    if (err.status) return error(res, err.status, err.message);
    next(err);
  }
};

const searchUsersController = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || !q.trim()) return error(res, 400, 'Query parameter q is required');

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const result = await searchUsers(req.user.id, q.trim(), { page, limit });
    return success(res, 200, 'Search results fetched', result);
  } catch (err) {
    next(err);
  }
};

const getUserPostsController = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const result = await getUserPosts(req.user.id, req.params.id, { page, limit });
    if (!result.canView) {
      return error(res, 403, 'This account is private');
    }
    return success(res, 200, 'Posts fetched', result);
  } catch (err) {
    if (err.status) return error(res, err.status, err.message);
    next(err);
  }
};

const getUserReelsController = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const result = await getUserReels(req.user.id, req.params.id, { page, limit });
    if (!result.canView) {
      return error(res, 403, 'This account is private');
    }
    return success(res, 200, 'Reels fetched', result);
  } catch (err) {
    if (err.status) return error(res, err.status, err.message);
    next(err);
  }
};

module.exports = {
  updateProfileController,
  saveInterestsController,
  getInterestsController,
  followController,
  unfollowController,
  acceptFollowController,
  rejectFollowController,
  getFollowRequestsController,
  getFollowersController,
  getFollowingController,
  getFriendsController,
  getSuggestionsController,
  getSavedPostsController,
  getSavedReelsController,
  getUserProfileController,
  searchUsersController,
  getUserPostsController,
  getUserReelsController,
  getMeController,
  getMyPostsController,
  getMyReelsController,
};
