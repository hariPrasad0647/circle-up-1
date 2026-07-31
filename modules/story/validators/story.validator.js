const { body } = require('express-validator');

const createStoryValidator = [
  body('caption')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Caption must not exceed 500 characters'),
];

const reactValidator = [
  body('emoji')
    .trim()
    .notEmpty()
    .withMessage('emoji is required')
    .isLength({ max: 8 })
    .withMessage('emoji is not valid'),
];

module.exports = { createStoryValidator, reactValidator };
