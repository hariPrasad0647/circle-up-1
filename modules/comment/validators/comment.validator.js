const { body } = require('express-validator');

const commentTextValidator = [
  body('text')
    .trim()
    .notEmpty()
    .withMessage('Comment text is required')
    .isLength({ max: 1000 })
    .withMessage('Comment must not exceed 1000 characters'),
];

module.exports = { commentTextValidator };
