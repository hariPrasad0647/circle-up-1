const router = require('express').Router();
const validate = require('../../../middleware/validate');
const controller = require('../controllers/auth.controller');
const {
  signupValidator,
  resendOtpValidator,
  verifyOtpValidator,
  loginValidator,
  verifyLoginValidator,
} = require('../validators/auth.validator');

router.post('/signup', signupValidator, validate, controller.signup);
router.post('/resend-otp', resendOtpValidator, validate, controller.resendOtp);
router.post('/verify-otp', verifyOtpValidator, validate, controller.verifyOtp);
router.post('/login', loginValidator, validate, controller.login);
router.post('/login/verify', verifyLoginValidator, validate, controller.verifyLogin);

module.exports = router;
