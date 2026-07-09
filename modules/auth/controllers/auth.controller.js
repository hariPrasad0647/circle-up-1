const authService = require('../services/auth.service');
const response = require('../../../utils/response');

const signup = async (req, res, next) => {
  try {
    const { fullName, username, email, phone } = req.body;
    const result = await authService.signup({ fullName, username, email, phone });
    return response.success(res, 201, 'Verification code sent to your email', result);
  } catch (err) {
    next(err);
  }
};

const resendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await authService.resendOtp(email);
    return response.success(res, 200, 'Verification code resent', result);
  } catch (err) {
    next(err);
  }
};

const verifyOtp = async (req, res, next) => {
  try {
    const { email, code } = req.body;
    const result = await authService.verifyOtp(email, code);
    return response.success(res, 200, 'Account verified successfully', result);
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await authService.requestLogin(email);
    return response.success(res, 200, 'Login code sent to your email', result);
  } catch (err) {
    next(err);
  }
};

const verifyLogin = async (req, res, next) => {
  try {
    const { email, code } = req.body;
    const result = await authService.verifyLogin(email, code);
    return response.success(res, 200, 'Logged in successfully', result);
  } catch (err) {
    next(err);
  }
};

module.exports = { signup, resendOtp, verifyOtp, login, verifyLogin };
