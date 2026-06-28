const express = require('express');
const router = express.Router();
const auth = require('../../../middleware/auth');
const { uploadChatMedia: uploadChatMediaMiddleware } = require('../../../middleware/upload');
const {
  getConversations,
  getMessages,
  deleteMessage,
  uploadChatMedia,
} = require('../controllers/chat.controller');

router.use(auth);

router.get('/conversations', getConversations);
router.get('/conversations/:conversationId/messages', getMessages);
router.delete('/messages/:messageId', deleteMessage);
router.post('/upload', uploadChatMediaMiddleware, uploadChatMedia);

module.exports = router;
