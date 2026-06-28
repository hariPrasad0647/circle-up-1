const { Op } = require('sequelize');
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
  if (!recipient) return { allowed: false, reason: 'User not found' };
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
    reason: 'You can only message mutual followers of private accounts',
  };
};

const findOrCreateConversation = async (userAId, userBId) => {
  // Find existing DM conversation between the two users
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

const saveMessage = async ({ conversationId, senderId, content, mediaItems = [] }) => {
  const message = await Message.create({ conversationId, senderId, content });

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

const getConversations = async (userId) => {
  const participants = await ConversationParticipant.findAll({
    where: { userId },
    include: [
      {
        model: Conversation,
        include: [
          {
            model: ConversationParticipant,
            as: 'participants',
            where: { userId: { [Op.ne]: userId } },
            include: [{ model: User, as: 'user', attributes: ['id', 'username', 'profileImage', 'fullName'] }],
          },
          {
            model: Message,
            as: 'messages',
            limit: 1,
            order: [['createdAt', 'DESC']],
            include: [{ model: MessageMedia, as: 'media' }],
          },
        ],
      },
    ],
    order: [[Conversation, Message, 'createdAt', 'DESC']],
  });

  return participants.map((p) => {
    const conv = p.Conversation;
    const otherUser = conv.participants[0]?.user;
    const lastMessage = conv.messages[0] || null;
    return {
      conversationId: conv.id,
      otherUser,
      lastMessage: lastMessage?.isDeleted
        ? { ...lastMessage.toJSON(), content: null, media: [] }
        : lastMessage,
      lastReadAt: p.lastReadAt,
    };
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

  return messages.reverse();
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
  markAsRead,
  deleteMessage,
};
