const { Op } = require('sequelize');
const User = require('../../user/models/user.model');
const Reel = require('../models/reel.model');
const ReelHashtag = require('../models/reel_hashtag.model');
const ReelMention = require('../models/reel_mention.model');
const Hashtag = require('../../post/models/hashtag.model');
const Like = require('../../post/models/like.model');
const Save = require('../../post/models/bookmark.model');

const extractHashtags = (text) => {
  const matches = text.match(/#([a-zA-Z0-9_]+)/g) || [];
  return [...new Set(matches.map((t) => t.slice(1).toLowerCase()))];
};

const extractMentions = (text) => {
  const matches = text.match(/@([a-zA-Z0-9_.]+)/g) || [];
  return [...new Set(matches.map((m) => m.slice(1).toLowerCase()))];
};

const formatReel = (reel, stats = {}) => ({
  id: reel.id,
  videoUrl: reel.videoUrl,
  thumbnailUrl: reel.thumbnailUrl || null,
  caption: reel.caption,
  isPrivate: reel.isPrivate,
  createdAt: reel.createdAt,
  author: {
    id: reel.author.id,
    username: reel.author.username,
    fullName: reel.author.fullName,
    profileImage: reel.author.profileImage || null,
  },
  hashtags: reel.hashtags.map((h) => h.name),
  mentions: reel.mentions.map((m) => ({
    id: m.mentionedUser.id,
    username: m.mentionedUser.username,
    profileImage: m.mentionedUser.profileImage || null,
  })),
  likeCount: stats.likeCount ?? 0,
  saveCount: stats.saveCount ?? 0,
  shareCount: stats.shareCount ?? 0,
  commentCount: stats.commentCount ?? 0,
  hasLiked: stats.hasLiked ?? false,
  hasSaved: stats.hasSaved ?? false,
});

const getReelById = async (reelId) => {
  return Reel.findByPk(reelId, {
    include: [
      { model: User, as: 'author', attributes: ['id', 'username', 'fullName', 'profileImage'] },
      { model: Hashtag, as: 'hashtags', attributes: ['name'], through: { attributes: [] } },
      {
        model: ReelMention,
        as: 'mentions',
        include: [
          { model: User, as: 'mentionedUser', attributes: ['id', 'username', 'profileImage'] },
        ],
      },
    ],
  });
};

const createReel = async (userId, { caption, isPrivate = false }, videoUrl, thumbnailUrl) => {
  const reel = await Reel.create({
    userId,
    videoUrl,
    thumbnailUrl: thumbnailUrl || null,
    caption: caption || null,
    isPrivate,
  });

  if (caption) {
    const tagNames = extractHashtags(caption);
    if (tagNames.length) {
      const tagRecords = await Promise.all(
        tagNames.map((name) => Hashtag.findOrCreate({ where: { name }, defaults: { name } }))
      );
      await ReelHashtag.bulkCreate(
        tagRecords.map(([h]) => ({ reelId: reel.id, hashtagId: h.id }))
      );
    }

    const usernames = extractMentions(caption);
    if (usernames.length) {
      const mentionedUsers = await User.findAll({ where: { username: usernames } });
      if (mentionedUsers.length) {
        await ReelMention.bulkCreate(
          mentionedUsers.map((u) => ({ reelId: reel.id, mentionedUserId: u.id }))
        );
      }
    }
  }

  return formatReel(await getReelById(reel.id));
};

// ── Public reels discovery — reels from public accounts only ────────────────
const getPublicReelsFeed = async (viewerId, { page = 1, limit = 10 } = {}) => {
  const offset = (page - 1) * limit;

  const { count, rows: reels } = await Reel.findAndCountAll({
    where: { isPrivate: false },
    include: [
      {
        model: User,
        as: 'author',
        attributes: ['id', 'username', 'fullName', 'profileImage'],
        where: { isPrivate: false },
      },
      { model: Hashtag, as: 'hashtags', attributes: ['name'], through: { attributes: [] } },
      {
        model: ReelMention,
        as: 'mentions',
        include: [{ model: User, as: 'mentionedUser', attributes: ['id', 'username', 'profileImage'] }],
      },
    ],
    order: [['createdAt', 'DESC']],
    limit,
    offset,
    distinct: true,
  });

  const reelIds = reels.map((r) => r.id);

  const [likeRows, saveRows, viewerLikeRows, viewerSaveRows] = await Promise.all([
    Like.findAll({ where: { contentType: 'reel', contentId: { [Op.in]: reelIds } }, attributes: ['contentId'], raw: true }),
    Save.findAll({ where: { contentType: 'reel', contentId: { [Op.in]: reelIds } }, attributes: ['contentId'], raw: true }),
    Like.findAll({ where: { userId: viewerId, contentType: 'reel', contentId: { [Op.in]: reelIds } }, attributes: ['contentId'], raw: true }),
    Save.findAll({ where: { userId: viewerId, contentType: 'reel', contentId: { [Op.in]: reelIds } }, attributes: ['contentId'], raw: true }),
  ]);

  const likeCounts = likeRows.reduce((m, r) => { m[r.contentId] = (m[r.contentId] || 0) + 1; return m; }, {});
  const saveCounts = saveRows.reduce((m, r) => { m[r.contentId] = (m[r.contentId] || 0) + 1; return m; }, {});
  const viewerLikedSet = new Set(viewerLikeRows.map((r) => r.contentId));
  const viewerSavedSet = new Set(viewerSaveRows.map((r) => r.contentId));

  const formatted = reels.map((reel) => ({
    id: reel.id,
    videoUrl: reel.videoUrl,
    thumbnailUrl: reel.thumbnailUrl || null,
    caption: reel.caption,
    createdAt: reel.createdAt,
    author: { id: reel.author.id, username: reel.author.username, fullName: reel.author.fullName, profileImage: reel.author.profileImage || null },
    hashtags: reel.hashtags.map((h) => h.name),
    mentions: reel.mentions.map((m) => ({ id: m.mentionedUser.id, username: m.mentionedUser.username, profileImage: m.mentionedUser.profileImage || null })),
    likeCount: likeCounts[reel.id] || 0,
    saveCount: saveCounts[reel.id] || 0,
    hasLiked: viewerLikedSet.has(reel.id),
    hasSaved: viewerSavedSet.has(reel.id),
  }));

  return { reels: formatted, total: count, page, limit, hasMore: offset + limit < count };
};

module.exports = { createReel, getReelById, formatReel, getPublicReelsFeed };
