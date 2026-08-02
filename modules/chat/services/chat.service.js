const { Op, fn, col, where: sequelizeWhere } = require('sequelize');
const sequelize = require('../../../config/db');
const Conversation = require('../models/conversation.model');
const ConversationParticipant = require('../models/conversationParticipant.model');
const Message = require('../models/message.model');
const MessageMedia = require('../models/messageMedia.model');
const User = require('../../user/models/user.model');
const Follow = require('../../user/models/follow.model');

const canMessageUser = async (senderId, recipientId) => {
  const recipient = await User.findByPk(recipientId, {
    attributes: ['id', 'isPrivate'],
  });
  if (!recipient) return { allowed: false, status: 404, reason: 'Recipient user not found' };
  if (!recipient.isPrivate) return { allowed: true };

  const [senderFollows, recipientFollows] = await Promise.all([
    Follow.findOne({
      where: { followerId: senderId, followingId: recipientId, status: 'accepted' },
    }),
    Follow.findOne({
      where: { followerId: recipientId, followingId: senderId, status: 'accepted' },
    }),
  ]);

  if (senderFollows && recipientFollows) return { allowed: true };
  return {
    allowed: false,
    status: 403,
    reason: 'You can only message mutual followers of private accounts',
  };
};

const findOrCreateConversation = async (userAId, userBId) => {
  const existing = await sequelize.query(
    `SELECT cp1.conversationId FROM conversation_participants cp1
     JOIN conversation_participants cp2 ON cp1.conversationId = cp2.conversationId
     WHERE cp1.userId = :userA AND cp2.userId = :userB
     LIMIT 1`,
    {
      replacements: { userA: userAId, userB: userBId },
      type: sequelize.QueryTypes.SELECT,
    }
  );

  if (existing.length > 0) {
    return Conversation.findByPk(existing[0].conversationId);
  }

  const conversation = await Conversation.create();
  await ConversationParticipant.bulkCreate([
    { conversationId: conversation.id, userId: userAId },
    { conversationId: conversation.id, userId: userBId },
  ]);
  return conversation;
};

const saveMessage = async ({
  conversationId,
  senderId,
  content,
  mediaItems = [],
  messageType = 'text',
  storyId = null,
  reactionEmoji = null,
}) => {
  const message = await Message.create({
    conversationId,
    senderId,
    content,
    messageType,
    storyId,
    reactionEmoji,
  });

  if (mediaItems.length > 0) {
    await MessageMedia.bulkCreate(
      mediaItems.map((m) => ({ messageId: message.id, ...m }))
    );
  }

  return Message.findByPk(message.id, {
    include: [
      { model: User, as: 'sender', attributes: ['id', 'username', 'profileImage'] },
      { model: MessageMedia, as: 'media' },
    ],
  });
};

const enrichWithStory = async (messages) => {
  const Story = require('../../story/models/story.model');
  return Promise.all(
    messages.map(async (msg) => {
      const json = msg.toJSON ? msg.toJSON() : msg;
      if (json.messageType === 'story_reaction' && json.storyId) {
        const story = await Story.findByPk(json.storyId, {
          attributes: ['id', 'mediaUrl', 'mediaType', 'expiresAt'],
        });
        json.story = story
          ? {
              id: story.id,
              mediaUrl: story.mediaUrl,
              mediaType: story.mediaType,
              isExpired: new Date() > story.expiresAt,
            }
          : null;
      }
      return json;
    })
  );
};

const getConversations = async (userId) => {
  const myParticipations = await ConversationParticipant.findAll({
    where: { userId },
    attributes: ['conversationId', 'lastReadAt'],
  });

  if (myParticipations.length === 0) return [];

  const conversationIds = myParticipations.map((p) => p.conversationId);
  const lastReadMap = Object.fromEntries(
    myParticipations.map((p) => [p.conversationId, p.lastReadAt])
  );

  const otherParticipants = await ConversationParticipant.findAll({
    where: { conversationId: { [Op.in]: conversationIds }, userId: { [Op.ne]: userId } },
    include: [{ model: User, as: 'user', attributes: ['id', 'username', 'profileImage', 'fullName'] }],
  });

  const otherUserMap = Object.fromEntries(
    otherParticipants.map((p) => [p.conversationId, p.user])
  );

  const allMessages = await Message.findAll({
    where: { conversationId: { [Op.in]: conversationIds } },
    include: [{ model: MessageMedia, as: 'media' }],
    order: [['createdAt', 'DESC']],
  });

  const lastMessageMap = {};
  for (const msg of allMessages) {
    if (!lastMessageMap[msg.conversationId]) {
      lastMessageMap[msg.conversationId] = msg;
    }
  }

  return conversationIds
    .map((convId) => {
      const raw = lastMessageMap[convId] || null;
      const lastMessage = raw
        ? raw.isDeleted
          ? { ...raw.toJSON(), content: null, media: [] }
          : raw.toJSON()
        : null;
      return {
        conversationId: convId,
        otherUser: otherUserMap[convId] || null,
        lastMessage,
        lastReadAt: lastReadMap[convId],
      };
    })
    .sort((a, b) => {
      const aTime = a.lastMessage?.createdAt ?? 0;
      const bTime = b.lastMessage?.createdAt ?? 0;
      return new Date(bTime) - new Date(aTime);
    });
};

const getMessages = async (conversationId, userId, { limit = 30, before } = {}) => {
  const participant = await ConversationParticipant.findOne({
    where: { conversationId, userId },
  });
  if (!participant) return null;

  const where = { conversationId };
  if (before) where.createdAt = { [Op.lt]: new Date(before) };

  const messages = await Message.findAll({
    where,
    include: [
      { model: User, as: 'sender', attributes: ['id', 'username', 'profileImage'] },
      { model: MessageMedia, as: 'media' },
    ],
    order: [['createdAt', 'DESC']],
    limit,
  });

  const ordered = messages.reverse();
  return enrichWithStory(ordered);
};

const FRIEND_ATTRS = ['id', 'username', 'fullName', 'profileImage'];

const searchChat = async (userId, query) => {
  const lowerQuery = query.toLowerCase();
  const q = `%${lowerQuery}%`;

  // Existing conversations whose other participant matches the query
  const allConversations = await getConversations(userId);
  const conversations = allConversations.filter(
    (c) =>
      c.otherUser &&
      (c.otherUser.username?.toLowerCase().includes(lowerQuery) ||
        c.otherUser.fullName?.toLowerCase().includes(lowerQuery))
  );

  // Mutual (accepted both ways) follows matching the query — lets the FE start a new chat
  // with a friend even when no conversation exists yet
  const myFollowing = await Follow.findAll({
    where: { followerId: userId, status: 'accepted' },
    attributes: ['followingId'],
    raw: true,
  });
  const followingIds = myFollowing.map((f) => f.followingId);

  let friends = [];
  if (followingIds.length) {
    const mutuals = await Follow.findAll({
      where: { followerId: { [Op.in]: followingIds }, followingId: userId, status: 'accepted' },
      include: [
        {
          model: User,
          as: 'follower',
          attributes: FRIEND_ATTRS,
          where: {
            [Op.or]: [
              sequelizeWhere(fn('LOWER', col('follower.username')), { [Op.like]: q }),
              sequelizeWhere(fn('LOWER', col('follower.fullName')), { [Op.like]: q }),
            ],
          },
        },
      ],
    });
    friends = mutuals.map((f) => f.follower);
  }

  // Tag each friend with their existing conversationId, if one already exists
  const conversationByUserId = Object.fromEntries(
    allConversations.filter((c) => c.otherUser).map((c) => [c.otherUser.id, c.conversationId])
  );
  const friendsWithConversation = friends.map((f) => ({
    ...f.toJSON(),
    conversationId: conversationByUserId[f.id] || null,
  }));

  return { conversations, friends: friendsWithConversation };
};

const markAsRead = async (conversationId, userId) => {
  await ConversationParticipant.update(
    { lastReadAt: new Date() },
    { where: { conversationId, userId } }
  );
};

const deleteMessage = async (messageId, userId) => {
  const message = await Message.findByPk(messageId);
  if (!message || message.senderId !== userId) return false;
  await message.update({ isDeleted: true });
  return true;
};

module.exports = {
  canMessageUser,
  findOrCreateConversation,
  saveMessage,
  getConversations,
  getMessages,
  searchChat,
  markAsRead,
  deleteMessage,
};
