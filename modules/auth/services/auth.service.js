const { Op } = require('sequelize');
const sequelize = require('../../../config/db');
const User = require('../../user/models/user.model');
const Otp = require('../models/otp.model');
const PendingSignup = require('../models/pending-signup.model');
const { generateOtp, hashOtp, compareOtp } = require('../../../utils/otp');
const { sendOtpEmail } = require('../../../utils/email');
const { signAccessToken, signRefreshToken } = require('../../../config/jwt');

const OTP_PURPOSE = 'signup';
const OTP_TTL_SECONDS = Number(process.env.OTP_EXPIRES_IN || 300);
const PENDING_TTL_SECONDS = Number(process.env.PENDING_SIGNUP_EXPIRES_IN || 86400);
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
  // Block if a verified account already holds this email or username
  const verifiedUser = await User.findOne({
    where: { [Op.or]: [{ email }, { username }] },
  });
  if (verifiedUser) {
    const field = verifiedUser.email === email ? 'email' : 'username';
    throw new ApiError(409, `An account with this ${field} already exists`);
  }

  // Cooldown check before any write
  const cooldown = await getActiveCooldown(email);
  if (cooldown > 0) {
    throw new ApiError(429, `Please wait ${cooldown}s before requesting another code`);
  }

  // Block if another *active* pending signup holds the same username under a different email
  const usernameConflict = await PendingSignup.findOne({
    where: { username, email: { [Op.ne]: email } },
  });
  if (usernameConflict) {
    if (new Date(usernameConflict.expiresAt) > new Date()) {
      throw new ApiError(409, 'This username is already taken');
    }
    await usernameConflict.destroy();
  }

  // Store signup details temporarily — no user row yet
  const expiresAt = new Date(Date.now() + PENDING_TTL_SECONDS * 1000);
  await PendingSignup.upsert({ fullName, username, email, phone, expiresAt });

  await issueOtp(email);

  return { email };
};

const resendOtp = async (email) => {
  const pending = await PendingSignup.findOne({ where: { email } });
  if (!pending) {
    throw new ApiError(404, 'No pending signup found for this email');
  }
  if (new Date(pending.expiresAt) < new Date()) {
    throw new ApiError(400, 'Your signup session has expired, please sign up again');
  }

  const cooldown = await getActiveCooldown(email);
  if (cooldown > 0) {
    throw new ApiError(429, `Please wait ${cooldown}s before requesting another code`);
  }

  await issueOtp(email);
  return { email };
};

const verifyOtp = async (email, code) => {
  const pending = await PendingSignup.findOne({ where: { email } });
  if (!pending) {
    const alreadyVerified = await User.findOne({ where: { email } });
    if (alreadyVerified) throw new ApiError(409, 'This account is already verified');
    throw new ApiError(404, 'No pending signup found for this email');
  }
  if (new Date(pending.expiresAt) < new Date()) {
    throw new ApiError(400, 'Your signup session has expired, please sign up again');
  }

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

  // Atomically consume OTP, create the verified user, and delete the pending row
  const { fullName, username, phone } = pending;

  const user = await sequelize.transaction(async (t) => {
    await otp.update({ consumedAt: new Date() }, { transaction: t });
    const newUser = await User.create(
      { fullName, username, email, phone, isVerified: true },
      { transaction: t }
    );
    await pending.destroy({ transaction: t });
    return newUser;
  });

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
