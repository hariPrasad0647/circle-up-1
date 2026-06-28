const { verifyAccessToken } = require('../../../config/jwt');
const chatService = require('../services/chat.service');

module.exports = (io) => {
  // Authenticate socket connections via JWT in handshake
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      const payload = verifyAccessToken(token);
      socket.user = payload;
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    // Each user joins their own room so we can target them by userId
    socket.join(socket.user.id);

    // ── Send a message ──────────────────────────────────────────────────────────
    socket.on('chat:send', async ({ recipientId, content, media = [] }) => {
      try {
        if (!recipientId) return socket.emit('chat:error', { message: 'recipientId is required' });
        if (!content && media.length === 0) {
          return socket.emit('chat:error', { message: 'Message must have content or media' });
        }

        const senderId = socket.user.id;

        const { allowed, reason } = await chatService.canMessageUser(senderId, recipientId);
        if (!allowed) return socket.emit('chat:error', { message: reason });

        const conversation = await chatService.findOrCreateConversation(senderId, recipientId);

        const message = await chatService.saveMessage({
          conversationId: conversation.id,
          senderId,
          content: content || null,
          mediaItems: media,
        });

        const payload = { conversationId: conversation.id, message };

        // Deliver to recipient (and any other open tabs of the sender)
        io.to(recipientId).emit('chat:message', payload);
        socket.emit('chat:message', payload);
      } catch (err) {
        socket.emit('chat:error', { message: 'Failed to send message' });
      }
    });

    // ── Typing indicators ───────────────────────────────────────────────────────
    socket.on('chat:typing', ({ recipientId }) => {
      if (!recipientId) return;
      io.to(recipientId).emit('chat:typing', { senderId: socket.user.id });
    });

    socket.on('chat:stop_typing', ({ recipientId }) => {
      if (!recipientId) return;
      io.to(recipientId).emit('chat:stop_typing', { senderId: socket.user.id });
    });

    // ── Mark messages as read ───────────────────────────────────────────────────
    socket.on('chat:read', async ({ conversationId, senderId }) => {
      try {
        await chatService.markAsRead(conversationId, socket.user.id);
        // Notify the other user their messages were read
        if (senderId) {
          io.to(senderId).emit('chat:read', {
            conversationId,
            readBy: socket.user.id,
          });
        }
      } catch {
        // non-critical, silently ignore
      }
    });

    socket.on('disconnect', () => {
      socket.leave(socket.user.id);
    });
  });
};
