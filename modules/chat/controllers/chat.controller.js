const chatService = require('../services/chat.service');
const { success, error } = require('../../../utils/response');

const getConversations = async (req, res, next) => {
  try {
    const conversations = await chatService.getConversations(req.user.id);
    return success(res, 200, 'Conversations fetched', conversations);
  } catch (err) {
    next(err);
  }
};

const getMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { limit, before } = req.query;

    const messages = await chatService.getMessages(conversationId, req.user.id, {
      limit: parseInt(limit) || 30,
      before,
    });

    if (messages === null) return error(res, 403, 'You are not part of this conversation');
    return success(res, 200, 'Messages fetched', messages);
  } catch (err) {
    next(err);
  }
};

const deleteMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const deleted = await chatService.deleteMessage(messageId, req.user.id);
    if (!deleted) return error(res, 403, 'Message not found or unauthorized');
    return success(res, 200, 'Message deleted');
  } catch (err) {
    next(err);
  }
};

const uploadChatMedia = async (req, res, next) => {
  try {
    if (!req.chatUpload) return error(res, 400, 'No file uploaded');
    return success(res, 200, 'Media uploaded', req.chatUpload);
  } catch (err) {
    next(err);
  }
};

const sendMessage = async (req, res, next) => {
  try {
    const { recipientId, content } = req.body;
    const senderId = req.user.id;

    if (!recipientId) return error(res, 400, 'recipientId is required');
    if (!content && !req.chatUpload) return error(res, 400, 'Message must have text or a file');

    const { allowed, reason } = await chatService.canMessageUser(senderId, recipientId);
    if (!allowed) return error(res, 403, reason);

    const conversation = await chatService.findOrCreateConversation(senderId, recipientId);

    const mediaItems = req.chatUpload ? [req.chatUpload] : [];
    const message = await chatService.saveMessage({
      conversationId: conversation.id,
      senderId,
      content: content?.trim() || null,
      mediaItems,
    });

    // Push real-time event to recipient and any other tabs the sender has open
    const io = req.app.get('io');
    if (io) {
      const payload = { conversationId: conversation.id, message };
      io.to(recipientId).emit('chat:message', payload);
      io.to(senderId).emit('chat:message', payload);
    }

    return success(res, 201, 'Message sent', { conversationId: conversation.id, message });
  } catch (err) {
    next(err);
  }
};

module.exports = { getConversations, getMessages, deleteMessage, uploadChatMedia, sendMessage };
