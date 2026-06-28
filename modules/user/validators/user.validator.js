const { body } = require('express-validator');

const updateProfileValidator = [
  body('fullName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Full name cannot be empty'),

  body('username')
    .optional()
    .trim()
    .matches(/^[a-zA-Z0-9_.]{3,30}$/)
    .withMessage('Username must be 3-30 characters (letters, numbers, _ or .)'),

  body('bio')
    .optional()
    .trim()
    .isLength({ max: 160 })
    .withMessage('Bio must not exceed 160 characters'),

  body('profession')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Profession must not exceed 100 characters'),

  body('isPrivate')
    .optional()
    .isBoolean({ strict: false })
    .withMessage('isPrivate must be true or false')
    .toBoolean(),
];

const saveInterestsValidator = [
  body('interests')
    .isArray({ min: 5 })
    .withMessage('Select at least 5 interests'),
  body('interests.*')
    .trim()
    .notEmpty()
    .withMessage('Each interest must be a non-empty string')
    .isLength({ max: 50 })
    .withMessage('Each interest must not exceed 50 characters'),
];

module.exports = { updateProfileValidator, saveInterestsValidator };
