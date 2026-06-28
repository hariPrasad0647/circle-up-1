const { Op } = require('sequelize');
const Story = require('../models/story.model');
const StoryView = require('../models/storyView.model');
const StoryReaction = require('../models/storyReaction.model');
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

  const stories = await Story.findAll({
    where: { userId: { [Op.in]: followingIds }, ...activeStoryWhere() },
    include: [{ model: User, as: 'author', attributes: ['id', 'username', 'fullName', 'profileImage'] }],
    order: [['createdAt', 'ASC']],
  });

  if (stories.length === 0) return [];

  const storyIds = stories.map((s) => s.id);
  const viewedRows = await StoryView.findAll({
    where: { viewerId, storyId: { [Op.in]: storyIds } },
    attributes: ['storyId'],
    raw: true,
  });
  const viewedSet = new Set(viewedRows.map((v) => v.storyId));

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

// ── Get viewers + reactions of a story (owner only) ───────────────────────────
const getStoryViewers = async (storyId, requesterId) => {
  const story = await Story.findByPk(storyId, { attributes: ['userId'] });
  if (!story) return null;
  if (story.userId !== requesterId) return { forbidden: true };

  const [views, reactions] = await Promise.all([
    StoryView.findAll({
      where: { storyId },
      include: [{ model: User, as: 'viewer', attributes: ['id', 'username', 'fullName', 'profileImage'] }],
      order: [['viewedAt', 'DESC']],
    }),
    StoryReaction.findAll({
      where: { storyId },
      attributes: ['userId', 'emoji'],
      raw: true,
    }),
  ]);

  const reactionMap = Object.fromEntries(reactions.map((r) => [r.userId, r.emoji]));

  return views.map((v) => ({
    ...v.viewer.toJSON(),
    viewedAt: v.viewedAt,
    reaction: reactionMap[v.viewerId] || null,
  }));
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
      const [viewCount, reactionCount] = await Promise.all([
        StoryView.count({ where: { storyId: story.id } }),
        StoryReaction.count({ where: { storyId: story.id } }),
      ]);
      return {
        id: story.id,
        mediaUrl: story.mediaUrl,
        mediaType: story.mediaType,
        caption: story.caption,
        expiresAt: story.expiresAt,
        createdAt: story.createdAt,
        viewCount,
        reactionCount,
      };
    })
  );
};

// ── React to a story (creates/updates DM message, like Instagram) ──────────────
const reactToStory = async (storyId, userId, emoji, io) => {
  const story = await Story.findOne({
    where: { id: storyId, ...activeStoryWhere() },
    attributes: ['id', 'userId', 'mediaUrl', 'mediaType'],
  });
  if (!story) return { notFound: true };
  if (story.userId === userId) return { forbidden: true };

  const chatService = require('../../chat/services/chat.service');
  const Message = require('../../chat/models/message.model');

  const existing = await StoryReaction.findOne({ where: { storyId, userId } });

  if (existing) {
    await existing.update({ emoji });
    if (existing.messageId) {
      await Message.update({ reactionEmoji: emoji }, { where: { id: existing.messageId } });
    }
    return { updated: true, emoji, storyId };
  }

  const conversation = await chatService.findOrCreateConversation(userId, story.userId);
  const message = await chatService.saveMessage({
    conversationId: conversation.id,
    senderId: userId,
    content: null,
    mediaItems: [],
    messageType: 'story_reaction',
    storyId,
    reactionEmoji: emoji,
  });

  await StoryReaction.create({ storyId, userId, emoji, messageId: message.id });

  if (io) {
    const payload = { conversationId: conversation.id, message };
    io.to(story.userId).emit('chat:message', payload);
    io.to(userId).emit('chat:message', payload);
  }

  return { created: true, emoji, storyId, conversationId: conversation.id, message };
};

// ── Remove reaction ────────────────────────────────────────────────────────────
const removeReaction = async (storyId, userId) => {
  const reaction = await StoryReaction.findOne({ where: { storyId, userId } });
  if (!reaction) return { notFound: true };

  if (reaction.messageId) {
    const Message = require('../../chat/models/message.model');
    await Message.update({ isDeleted: true }, { where: { id: reaction.messageId } });
  }

  await reaction.destroy();
  return { removed: true };
};

module.exports = {
  createStory,
  getStoryFeed,
  viewStory,
  getStoryViewers,
  deleteStory,
  getMyStories,
  reactToStory,
  removeReaction,
};
