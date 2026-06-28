const { Op } = require('sequelize');
const Story = require('../models/story.model');
const StoryView = require('../models/storyView.model');
const Follow = require('../../user/models/follow.model');
const User = require('../../user/models/user.model');

const STORY_TTL_HOURS = 24;

const activeStoryWhere = () => ({ expiresAt: { [Op.gt]: new Date() } });

// ── Create ─────────────────────────────────────────────────────────────────────
const createStory = async (userId, { mediaUrl, mediaType, caption }) => {
  const expiresAt = new Date(Date.now() + STORY_TTL_HOURS * 60 * 60 * 1000);
  const story = await Story.create({ userId, mediaUrl, mediaType, caption: caption || null, expiresAt });
  return story;
};

// ── Story feed — grouped by user, unseen first ─────────────────────────────────
const getStoryFeed = async (viewerId) => {
  const followingRows = await Follow.findAll({
    where: { followerId: viewerId, status: 'accepted' },
    attributes: ['followingId'],
    raw: true,
  });
  const followingIds = followingRows.map((f) => f.followingId);

  if (followingIds.length === 0) return [];

  // All active stories from followed accounts
  const stories = await Story.findAll({
    where: { userId: { [Op.in]: followingIds }, ...activeStoryWhere() },
    include: [{ model: User, as: 'author', attributes: ['id', 'username', 'fullName', 'profileImage'] }],
    order: [['createdAt', 'ASC']],
  });

  if (stories.length === 0) return [];

  // Which stories has this viewer already seen?
  const storyIds = stories.map((s) => s.id);
  const viewedRows = await StoryView.findAll({
    where: { viewerId, storyId: { [Op.in]: storyIds } },
    attributes: ['storyId'],
    raw: true,
  });
  const viewedSet = new Set(viewedRows.map((v) => v.storyId));

  // Group by user
  const userMap = {};
  stories.forEach((story) => {
    const uid = story.userId;
    if (!userMap[uid]) {
      userMap[uid] = {
        user: { id: story.author.id, username: story.author.username, fullName: story.author.fullName, profileImage: story.author.profileImage || null },
        stories: [],
        hasUnseen: false,
        latestAt: null,
      };
    }
    const seen = viewedSet.has(story.id);
    if (!seen) userMap[uid].hasUnseen = true;
    if (!userMap[uid].latestAt || story.createdAt > userMap[uid].latestAt) {
      userMap[uid].latestAt = story.createdAt;
    }
    userMap[uid].stories.push({
      id: story.id,
      mediaUrl: story.mediaUrl,
      mediaType: story.mediaType,
      caption: story.caption,
      expiresAt: story.expiresAt,
      createdAt: story.createdAt,
      seen,
    });
  });

  // Sort: unseen users first, then by latest story time
  return Object.values(userMap).sort((a, b) => {
    if (a.hasUnseen !== b.hasUnseen) return a.hasUnseen ? -1 : 1;
    return new Date(b.latestAt) - new Date(a.latestAt);
  });
};

// ── View a story (mark as viewed, return story + view count) ───────────────────
const viewStory = async (storyId, viewerId) => {
  const story = await Story.findOne({
    where: { id: storyId, ...activeStoryWhere() },
    include: [{ model: User, as: 'author', attributes: ['id', 'username', 'profileImage'] }],
  });
  if (!story) return null;

  // Don't count the author viewing their own story
  if (story.userId !== viewerId) {
    await StoryView.findOrCreate({
      where: { storyId, viewerId },
      defaults: { storyId, viewerId, viewedAt: new Date() },
    });
  }

  const viewCount = await StoryView.count({ where: { storyId } });

  return {
    id: story.id,
    mediaUrl: story.mediaUrl,
    mediaType: story.mediaType,
    caption: story.caption,
    expiresAt: story.expiresAt,
    createdAt: story.createdAt,
    author: story.author,
    viewCount,
  };
};

// ── Get viewers of a story (only the story author can call this) ──────────────
const getStoryViewers = async (storyId, requesterId) => {
  const story = await Story.findByPk(storyId, { attributes: ['userId'] });
  if (!story) return null;
  if (story.userId !== requesterId) return { forbidden: true };

  const views = await StoryView.findAll({
    where: { storyId },
    include: [{ model: User, as: 'viewer', attributes: ['id', 'username', 'fullName', 'profileImage'] }],
    order: [['viewedAt', 'DESC']],
  });

  return views.map((v) => ({ ...v.viewer.toJSON(), viewedAt: v.viewedAt }));
};

// ── Delete ─────────────────────────────────────────────────────────────────────
const deleteStory = async (storyId, userId) => {
  const story = await Story.findByPk(storyId);
  if (!story || story.userId !== userId) return false;
  await story.destroy();
  return true;
};

// ── My stories ─────────────────────────────────────────────────────────────────
const getMyStories = async (userId) => {
  const stories = await Story.findAll({
    where: { userId, ...activeStoryWhere() },
    order: [['createdAt', 'ASC']],
  });

  return Promise.all(
    stories.map(async (story) => {
      const viewCount = await StoryView.count({ where: { storyId: story.id } });
      return { id: story.id, mediaUrl: story.mediaUrl, mediaType: story.mediaType, caption: story.caption, expiresAt: story.expiresAt, createdAt: story.createdAt, viewCount };
    })
  );
};

module.exports = { createStory, getStoryFeed, viewStory, getStoryViewers, deleteStory, getMyStories };
