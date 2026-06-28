const { Op } = require('sequelize');
const Follow = require('../../user/models/follow.model');
const Interest = require('../../user/models/interest.model');
const User = require('../../user/models/user.model');
const Post = require('../../post/models/post.model');
const PostMedia = require('../../post/models/post_media.model');
const PostMention = require('../../post/models/post_mention.model');
const Hashtag = require('../../post/models/hashtag.model');
const Reel = require('../../reel/models/reel.model');
const ReelMention = require('../../reel/models/reel_mention.model');
const Like = require('../../post/models/like.model');
const Save = require('../../post/models/bookmark.model');
const Share = require('../../post/models/share.model');

// Ensure hashtag join-table associations are registered
require('../../post/models/post_hashtag.model');
require('../../reel/models/reel_hashtag.model');

const LOOKBACK_DAYS = 14;
const FETCH_MULTIPLIER = 5;

// ── Scoring ────────────────────────────────────────────────────────────────────
// Saves signal stronger intent than likes, so they're weighted 2×.
// timeFactor uses a gentle power decay so good content survives a few days.
// Content from followed accounts gets a 2× relationship bonus.
const computeScore = ({ createdAt, likeCount, saveCount, shareCount, interestMatch, isFollowing }) => {
  const hoursOld = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
  const timeFactor = 1 / Math.pow(hoursOld + 2, 1.2);
  const engagement = likeCount + saveCount * 2 + shareCount * 1.5;
  const interestBonus = interestMatch ? 1.5 : 1.0;
  const relationshipBonus = isFollowing ? 2.0 : 1.0;
  // Baseline ensures fresh content with zero engagement still surfaces
  return (engagement * interestBonus + 0.1) * timeFactor * relationshipBonus;
};

const postIncludes = [
  { model: User, as: 'author', attributes: ['id', 'username', 'fullName', 'profileImage'] },
  { model: PostMedia, as: 'media', attributes: ['mediaUrl', 'order'] },
  { model: Hashtag, as: 'hashtags', attributes: ['name'], through: { attributes: [] } },
  {
    model: PostMention, as: 'mentions',
    include: [{ model: User, as: 'mentionedUser', attributes: ['id', 'username', 'profileImage'] }],
  },
];

const reelIncludes = [
  { model: User, as: 'author', attributes: ['id', 'username', 'fullName', 'profileImage'] },
  { model: Hashtag, as: 'hashtags', attributes: ['name'], through: { attributes: [] } },
  {
    model: ReelMention, as: 'mentions',
    include: [{ model: User, as: 'mentionedUser', attributes: ['id', 'username', 'profileImage'] }],
  },
];

const getFeed = async (userId, { page = 1, limit = 20 } = {}) => {
  const since = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000);
  const fetchLimit = limit * FETCH_MULTIPLIER;

  const [followingRows, interestRows] = await Promise.all([
    Follow.findAll({ where: { followerId: userId, status: 'accepted' }, attributes: ['followingId'], raw: true }),
    Interest.findAll({ where: { userId }, attributes: ['interest'], raw: true }),
  ]);

  const followingIds = followingRows.map((f) => f.followingId);
  const followingSet = new Set(followingIds);
  const userInterests = new Set(interestRows.map((i) => i.interest.toLowerCase()));

  const baseWhere = { createdAt: { [Op.gte]: since }, isPrivate: false };

  // ── Primary: content from followed accounts ──────────────────────────────────
  let posts = [], reels = [];
  if (followingIds.length > 0) {
    [posts, reels] = await Promise.all([
      Post.findAll({ where: { ...baseWhere, userId: { [Op.in]: followingIds } }, include: postIncludes, order: [['createdAt', 'DESC']], limit: fetchLimit }),
      Reel.findAll({ where: { ...baseWhere, userId: { [Op.in]: followingIds } }, include: reelIncludes, order: [['createdAt', 'DESC']], limit: fetchLimit }),
    ]);
  }

  // ── Supplemental: fill gaps with trending public content ──────────────────────
  let suggestedPosts = [], suggestedReels = [];
  if (posts.length + reels.length < limit) {
    const excludeIds = followingIds.length ? [...followingIds, userId] : [userId];
    [suggestedPosts, suggestedReels] = await Promise.all([
      Post.findAll({ where: { ...baseWhere, userId: { [Op.notIn]: excludeIds } }, include: postIncludes, order: [['createdAt', 'DESC']], limit: fetchLimit }),
      Reel.findAll({ where: { ...baseWhere, userId: { [Op.notIn]: excludeIds } }, include: reelIncludes, order: [['createdAt', 'DESC']], limit: fetchLimit }),
    ]);
  }

  const allPosts = [...posts, ...suggestedPosts];
  const allReels = [...reels, ...suggestedReels];
  if (allPosts.length === 0 && allReels.length === 0) return { feed: [], page, limit, hasMore: false };

  // ── Batch engagement counts ───────────────────────────────────────────────────
  const postIds = allPosts.map((p) => p.id);
  const reelIds = allReels.map((r) => r.id);
  const allIds = [...postIds, ...reelIds];

  const [likeRows, saveRows, shareRows, vLikeRows, vSaveRows] = await Promise.all([
    Like.findAll({ where: { contentId: { [Op.in]: allIds } }, attributes: ['contentId'], raw: true }),
    Save.findAll({ where: { contentId: { [Op.in]: allIds } }, attributes: ['contentId'], raw: true }),
    Share.findAll({ where: { contentId: { [Op.in]: allIds } }, attributes: ['contentId'], raw: true }),
    Like.findAll({ where: { userId, contentId: { [Op.in]: allIds } }, attributes: ['contentId'], raw: true }),
    Save.findAll({ where: { userId, contentId: { [Op.in]: allIds } }, attributes: ['contentId'], raw: true }),
  ]);

  const tally = (rows) => rows.reduce((m, r) => { m[r.contentId] = (m[r.contentId] || 0) + 1; return m; }, {});
  const likeCounts = tally(likeRows);
  const saveCounts = tally(saveRows);
  const shareCounts = tally(shareRows);
  const viewerLiked = new Set(vLikeRows.map((r) => r.contentId));
  const viewerSaved = new Set(vSaveRows.map((r) => r.contentId));

  // ── Score, format, sort ───────────────────────────────────────────────────────
  const items = [];

  allPosts.forEach((post) => {
    const likeCount = likeCounts[post.id] || 0;
    const saveCount = saveCounts[post.id] || 0;
    const shareCount = shareCounts[post.id] || 0;
    const isFollowing = followingSet.has(post.userId);
    const interestMatch = post.hashtags.some((h) => userInterests.has(h.name.toLowerCase()));

    items.push({
      _score: computeScore({ createdAt: post.createdAt, likeCount, saveCount, shareCount, interestMatch, isFollowing }),
      type: 'post',
      id: post.id,
      caption: post.caption,
      createdAt: post.createdAt,
      author: { id: post.author.id, username: post.author.username, fullName: post.author.fullName, profileImage: post.author.profileImage || null },
      media: post.media.sort((a, b) => a.order - b.order).map((m) => m.mediaUrl),
      hashtags: post.hashtags.map((h) => h.name),
      mentions: post.mentions.map((m) => ({ id: m.mentionedUser.id, username: m.mentionedUser.username, profileImage: m.mentionedUser.profileImage || null })),
      likeCount, saveCount, shareCount,
      hasLiked: viewerLiked.has(post.id),
      hasSaved: viewerSaved.has(post.id),
      isFromFollowing: isFollowing,
    });
  });

  allReels.forEach((reel) => {
    const likeCount = likeCounts[reel.id] || 0;
    const saveCount = saveCounts[reel.id] || 0;
    const shareCount = shareCounts[reel.id] || 0;
    const isFollowing = followingSet.has(reel.userId);
    const interestMatch = reel.hashtags.some((h) => userInterests.has(h.name.toLowerCase()));

    items.push({
      _score: computeScore({ createdAt: reel.createdAt, likeCount, saveCount, shareCount, interestMatch, isFollowing }),
      type: 'reel',
      id: reel.id,
      videoUrl: reel.videoUrl,
      thumbnailUrl: reel.thumbnailUrl || null,
      caption: reel.caption,
      createdAt: reel.createdAt,
      author: { id: reel.author.id, username: reel.author.username, fullName: reel.author.fullName, profileImage: reel.author.profileImage || null },
      hashtags: reel.hashtags.map((h) => h.name),
      mentions: reel.mentions.map((m) => ({ id: m.mentionedUser.id, username: m.mentionedUser.username, profileImage: m.mentionedUser.profileImage || null })),
      likeCount, saveCount, shareCount,
      hasLiked: viewerLiked.has(reel.id),
      hasSaved: viewerSaved.has(reel.id),
      isFromFollowing: isFollowing,
    });
  });

  items.sort((a, b) => b._score - a._score);

  const offset = (page - 1) * limit;
  const paginated = items.slice(offset, offset + limit).map(({ _score, ...item }) => item);

  return { feed: paginated, page, limit, hasMore: offset + limit < items.length };
};

module.exports = { getFeed };
