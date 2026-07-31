const express = require('express');
const router = express.Router();
const auth = require('../../../middleware/auth');
const validate = require('../../../middleware/validate');
const { uuidParam, requiredQuery } = require('../../../utils/paramValidators');
const { uploadChatMedia: uploadChatMediaMiddleware } = require('../../../middleware/upload');
const { sendMessageValidator, getMessagesQueryValidator } = require('../validators/chat.validator');
const {
  getConversations,
  getMessages,
  searchChat,
  deleteMessage,
  uploadChatMedia,
  sendMessage,
} = require('../controllers/chat.controller');

router.use(auth);

router.post('/send', uploadChatMediaMiddleware, sendMessageValidator, validate, sendMessage);
router.get('/conversations', getConversations);
router.get('/search', requiredQuery('q'), validate, searchChat);
router.get(
  '/conversations/:conversationId/messages',
  uuidParam('conversationId'),
  getMessagesQueryValidator,
  validate,
  getMessages
);
router.delete('/messages/:messageId', uuidParam('messageId'), validate, deleteMessage);
router.post('/upload', uploadChatMediaMiddleware, uploadChatMedia);

module.exports = router;
