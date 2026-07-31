const { body, query } = require('express-validator');

const sendMessageValidator = [
  body('recipientId')
    .trim()
    .notEmpty()
    .withMessage('recipientId is required')
    .isUUID()
    .withMessage('recipientId must be a valid user id'),

  body('content')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Message content must not exceed 5000 characters'),
];

const getMessagesQueryValidator = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('limit must be a number between 1 and 100'),

  query('before')
    .optional()
    .isISO8601()
    .withMessage('before must be a valid date (ISO 8601)'),
];

module.exports = { sendMessageValidator, getMessagesQueryValidator };
