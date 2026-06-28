const { Op } = require('sequelize');
const User = require('../../user/models/user.model');
const Otp = require('../models/otp.model');
const { generateOtp, hashOtp, compareOtp } = require('../../../utils/otp');
const { sendOtpEmail } = require('../../../utils/email');
const { signAccessToken, signRefreshToken } = require('../../../config/jwt');

const OTP_PURPOSE = 'signup';
const OTP_TTL_SECONDS = Number(process.env.OTP_EXPIRES_IN || 300);
const RESEND_COOLDOWN_SECONDS = 60;
const MAX_ATTEMPTS = 5;

class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

const getActiveCooldown = async (email) => {
  const lastOtp = await Otp.findOne({
    where: { email, purpose: OTP_PURPOSE },
    order: [['createdAt', 'DESC']],
  });
  if (!lastOtp) return 0;
  const elapsed = (Date.now() - new Date(lastOtp.createdAt).getTime()) / 1000;
  return elapsed < RESEND_COOLDOWN_SECONDS ? Math.ceil(RESEND_COOLDOWN_SECONDS - elapsed) : 0;
};

const issueOtp = async (email) => {
  const code = generateOtp();
  const codeHash = await hashOtp(code);

  await Otp.update(
    { consumedAt: new Date() },
    { where: { email, purpose: OTP_PURPOSE, consumedAt: null } }
  );

  await Otp.create({
    email,
    codeHash,
    purpose: OTP_PURPOSE,
    expiresAt: new Date(Date.now() + OTP_TTL_SECONDS * 1000),
  });

  await sendOtpEmail(email, code);
};

const signup = async ({ fullName, username, email, phone }) => {
  const existing = await User.findOne({ where: { [Op.or]: [{ email }, { username }] } });

  if (existing) {
    if (existing.isVerified) {
      const field = existing.email === email ? 'email' : 'username';
      throw new ApiError(409, `An account with this ${field} already exists`);
    }
    await existing.update({ fullName, username, email, phone });
  } else {
    await User.create({ fullName, username, email, phone, isVerified: false });
  }

  const cooldown = await getActiveCooldown(email);
  if (cooldown > 0) {
    throw new ApiError(429, `Please wait ${cooldown}s before requesting another code`);
  }

  await issueOtp(email);

  return { email };
};

const resendOtp = async (email) => {
  const user = await User.findOne({ where: { email } });
  if (!user) throw new ApiError(404, 'No pending signup found for this email');
  if (user.isVerified) throw new ApiError(409, 'This account is already verified');

  const cooldown = await getActiveCooldown(email);
  if (cooldown > 0) {
    throw new ApiError(429, `Please wait ${cooldown}s before requesting another code`);
  }

  await issueOtp(email);

  return { email };
};

const verifyOtp = async (email, code) => {
  const user = await User.findOne({ where: { email } });
  if (!user) throw new ApiError(404, 'No pending signup found for this email');
  if (user.isVerified) throw new ApiError(409, 'This account is already verified');

  const otp = await Otp.findOne({
    where: { email, purpose: OTP_PURPOSE, consumedAt: null },
    order: [['createdAt', 'DESC']],
  });
  if (!otp) throw new ApiError(400, 'No active verification code found, please request a new one');
  if (otp.expiresAt < new Date()) throw new ApiError(400, 'Verification code has expired');
  if (otp.attempts >= MAX_ATTEMPTS) {
    throw new ApiError(429, 'Too many incorrect attempts, please request a new code');
  }

  const isMatch = await compareOtp(code, otp.codeHash);
  if (!isMatch) {
    await otp.increment('attempts');
    throw new ApiError(400, 'Invalid verification code');
  }

  await otp.update({ consumedAt: new Date() });
  await user.update({ isVerified: true });

  const payload = { id: user.id, email: user.email, username: user.username };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  return {
    user: {
      id: user.id,
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      phone: user.phone,
      isPrivate: user.isPrivate,
    },
    accessToken,
    refreshToken,
  };
};

module.exports = { ApiError, signup, resendOtp, verifyOtp };
