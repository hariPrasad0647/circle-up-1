const { body } = require('express-validator');

const createReelValidator = [
  body('caption')
    .optional()
    .trim()
    .isLength({ max: 2200 })
    .withMessage('Caption must not exceed 2200 characters'),

  body('isPrivate')
    .optional()
    .isBoolean({ strict: false })
    .withMessage('isPrivate must be true or false')
    .toBoolean(),
];

module.exports = { createReelValidator };
