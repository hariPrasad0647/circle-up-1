const express = require('express');
const router = express.Router();

const auth = require('../../../middleware/auth');
const validate = require('../../../middleware/validate');
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
router.patch('/follow-requests/:id/accept', auth, acceptFollowController);

// PATCH /api/users/follow-requests/:id/reject  — reject request from user :id
router.patch('/follow-requests/:id/reject', auth, rejectFollowController);

// ── Follower / following / friends lists ──────────────────────────────────────

router.get('/followers', auth, getFollowersController);
router.get('/following', auth, getFollowingController);
router.get('/friends', auth, getFriendsController);
router.get('/suggestions', auth, getSuggestionsController);

// GET /api/users/search?q=...
router.get('/search', auth, searchUsersController);

// ── Saved content ─────────────────────────────────────────────────────────────
router.get('/saved/posts', auth, getSavedPostsController);
router.get('/saved/reels', auth, getSavedReelsController);

// ── Public profile viewing ────────────────────────────────────────────────────
// These must stay above /:id/follow to prevent Express matching 'posts'/'reels' as :id

// GET /api/users/:id
router.get('/:id', auth, getUserProfileController);

// GET /api/users/:id/posts
router.get('/:id/posts', auth, getUserPostsController);

// GET /api/users/:id/reels
router.get('/:id/reels', auth, getUserReelsController);

// ── Follow / unfollow a user ──────────────────────────────────────────────────

// POST   /api/users/:id/follow
router.post('/:id/follow', auth, followController);

// DELETE /api/users/:id/follow
router.delete('/:id/follow', auth, unfollowController);

module.exports = router;
