const express = require('express');
const router = express.Router();

const auth = require('../../../middleware/auth');
const validate = require('../../../middleware/validate');
const { uuidParam, requiredQuery } = require('../../../utils/paramValidators');
const { uploadProfileImage } = require('../../../middleware/upload');
const { updateProfileValidator, saveInterestsValidator } = require('../validators/user.validator');
const {
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
} = require('../controllers/user.controller');

// PATCH /api/users/profile
router.patch(
    '/profile',
    auth,
    uploadProfileImage,
    updateProfileValidator,
    validate,
    updateProfileController
);

// POST /api/users/interests
router.post('/interests', auth, saveInterestsValidator, validate, saveInterestsController);

// GET /api/users/interests
router.get('/interests', auth, getInterestsController);

// ── Follow requests (specific routes before /:id to avoid conflicts) ──────────

// GET  /api/users/follow-requests          — incoming pending requests
router.get('/follow-requests', auth, getFollowRequestsController);

// PATCH /api/users/follow-requests/:id/accept  — accept request from user :id
router.patch('/follow-requests/:id/accept', auth, uuidParam('id'), validate, acceptFollowController);

// PATCH /api/users/follow-requests/:id/reject  — reject request from user :id
router.patch('/follow-requests/:id/reject', auth, uuidParam('id'), validate, rejectFollowController);

// ── Follower / following / friends lists ──────────────────────────────────────

router.get('/followers', auth, getFollowersController);
router.get('/following', auth, getFollowingController);
router.get('/friends', auth, getFriendsController);
router.get('/suggestions', auth, getSuggestionsController);

// GET /api/users/search?q=...
router.get('/search', auth, requiredQuery('q'), validate, searchUsersController);

// ── Saved content ─────────────────────────────────────────────────────────────
router.get('/saved/posts', auth, getSavedPostsController);
router.get('/saved/reels', auth, getSavedReelsController);

// ── My own profile (Instagram-style: bio + posts + reels in one call) ────────
// Must stay above /:id to prevent Express matching 'me' as :id

// GET /api/users/me — profile + first page of posts + first page of reels
router.get('/me', auth, getMeController);

// GET /api/users/me/posts — paginated own posts
router.get('/me/posts', auth, getMyPostsController);

// GET /api/users/me/reels — paginated own reels
router.get('/me/reels', auth, getMyReelsController);

// ── Public profile viewing ────────────────────────────────────────────────────
// These must stay above /:id/follow to prevent Express matching 'posts'/'reels' as :id

// GET /api/users/:id
router.get('/:id', auth, uuidParam('id'), validate, getUserProfileController);

// GET /api/users/:id/posts
router.get('/:id/posts', auth, uuidParam('id'), validate, getUserPostsController);

// GET /api/users/:id/reels
router.get('/:id/reels', auth, uuidParam('id'), validate, getUserReelsController);

// ── Follow / unfollow a user ──────────────────────────────────────────────────

// POST   /api/users/:id/follow
router.post('/:id/follow', auth, uuidParam('id'), validate, followController);

// DELETE /api/users/:id/follow
router.delete('/:id/follow', auth, uuidParam('id'), validate, unfollowController);

module.exports = router;
