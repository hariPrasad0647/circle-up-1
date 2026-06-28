const Like = require('../models/like.model');
const Save = require('../models/bookmark.model');
const Share = require('../models/share.model');
const Post = require('../models/post.model');
const Reel = require('../../reel/models/reel.model');
const Comment = require('../../comment/models/comment.model');

const findContent = async (contentType, contentId) => {
  const model = contentType === 'post' ? Post : Reel;
  const content = await model.findByPk(contentId);
  if (!content) {
    const err = new Error(`${contentType === 'post' ? 'Post' : 'Reel'} not found`);
    err.status = 404;
    throw err;
  }
  return content;
};

// ── Like ──────────────────────────────────────────────────────────────────────

const toggleLike = async (userId, contentType, contentId) => {
  await findContent(contentType, contentId);
  const existing = await Like.findOne({ where: { userId, contentType, contentId } });
  if (existing) {
    await existing.destroy();
  } else {
    await Like.create({ userId, contentType, contentId });
  }
  const likeCount = await Like.count({ where: { contentType, contentId } });
  return { liked: !existing, likeCount };
};

// ── Save ──────────────────────────────────────────────────────────────────────

const toggleSave = async (userId, contentType, contentId) => {
  await findContent(contentType, contentId);
  const existing = await Save.findOne({ where: { userId, contentType, contentId } });
  if (existing) {
    await existing.destroy();
  } else {
    await Save.create({ userId, contentType, contentId });
  }
  return { saved: !existing };
};

// ── Share ─────────────────────────────────────────────────────────────────────

const shareContent = async (userId, contentType, contentId) => {
  await findContent(contentType, contentId);
  await Share.findOrCreate({ where: { userId, contentType, contentId } });
  const shareCount = await Share.count({ where: { contentType, contentId } });
  return { shareCount };
};

// ── Stats (used by GET post/reel endpoints) ───────────────────────────────────

const getInteractionStats = async (contentType, contentId, viewerId = null) => {
  const [likeCount, saveCount, shareCount, commentCount, likeRow, saveRow] = await Promise.all([
    Like.count({ where: { contentType, contentId } }),
    Save.count({ where: { contentType, contentId } }),
    Share.count({ where: { contentType, contentId } }),
    Comment.count({ where: { contentType, contentId, parentId: null, isDeleted: false } }),
    viewerId ? Like.findOne({ where: { userId: viewerId, contentType, contentId } }) : null,
    viewerId ? Save.findOne({ where: { userId: viewerId, contentType, contentId } }) : null,
  ]);
  return {
    likeCount,
    saveCount,
    shareCount,
    commentCount,
    hasLiked: !!likeRow,
    hasSaved: !!saveRow,
  };
};

// ── Saved content lists ───────────────────────────────────────────────────────

const getSavedPosts = async (userId) => {
  const { getPostById, formatPost } = require('./post.service');
  const saves = await Save.findAll({
    where: { userId, contentType: 'post' },
    attributes: ['contentId'],
    order: [['createdAt', 'DESC']],
    raw: true,
  });
  const posts = await Promise.all(saves.map(({ contentId }) => getPostById(contentId)));
  return posts.filter(Boolean).map((p) => formatPost(p));
};

const getSavedReels = async (userId) => {
  const { getReelById, formatReel } = require('../../reel/services/reel.service');
  const saves = await Save.findAll({
    where: { userId, contentType: 'reel' },
    attributes: ['contentId'],
    order: [['createdAt', 'DESC']],
    raw: true,
  });
  const reels = await Promise.all(saves.map(({ contentId }) => getReelById(contentId)));
  return reels.filter(Boolean).map((r) => formatReel(r));
};

module.exports = {
  toggleLike,
  toggleSave,
  shareContent,
  getInteractionStats,
  getSavedPosts,
  getSavedReels,
};
