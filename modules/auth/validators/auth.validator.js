const { body } = require('express-validator');

const signupValidator = [
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required')
    .matches(/^[a-zA-Z0-9_.]{3,30}$/)
    .withMessage('Username must be 3-30 characters (letters, numbers, _ or .)'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('A valid email is required')
    .normalizeEmail(),
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .isMobilePhone('any')
    .withMessage('A valid phone number is required'),
];

const resendOtpValidator = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('A valid email is required')
    .normalizeEmail(),
];

const verifyOtpValidator = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('A valid email is required')
    .normalizeEmail(),
  body('code')
    .trim()
    .notEmpty()
    .withMessage('Verification code is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('Verification code must be 6 digits')
    .isNumeric()
    .withMessage('Verification code must be numeric'),
];

module.exports = { signupValidator, resendOtpValidator, verifyOtpValidator };
