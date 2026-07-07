import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';
import { User, CandidateProfile, RecruiterProfile } from '../routes/models/index.js';
import {
  sendTokenResponse,
  generateToken,
  generateRefreshToken
} from '../middleware/auth.js';
import { AppError, catchAsync } from '../middleware/errorHandler.js';
import crypto from 'crypto';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import config from '../config/index.js';

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = catchAsync(async (req, res, next) => {
  const { email, password, firstName, lastName, role = 'candidate' } = req.body;

  // Check if user exists
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    return next(new AppError('Email already registered', 400));
  }

  // Create user
  const user = await User.create({
    email,
    password,
    firstName,
    lastName,
    role
  });

  // Create profile based on role
  if (role === 'candidate') {
    await CandidateProfile.create({ userId: user.id });
  } else if (role === 'recruiter') {
    await RecruiterProfile.create({ 
      userId: user.id,
      companyName: 'To be updated'
    });
  }

  // Generate email verification token
  const emailVerificationToken = crypto.randomBytes(32).toString('hex');
  user.emailVerificationToken = emailVerificationToken;
  await user.save();

  // Log verification email trigger event for user audit tracking
  logger.info(`Verification email event logged for user registration: ${user.email}`);

  sendTokenResponse(user, 201, res);
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // Check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  // Find user with password
  const user = await User.findOne({ where: { email } });

  if (!user) {
    return next(new AppError('Invalid email or password', 401));
  }

  // Check password
  const isPasswordCorrect = await user.comparePassword(password);

  if (!isPasswordCorrect) {
    return next(new AppError('Invalid email or password', 401));
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  sendTokenResponse(user, 200, res);
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logout = (req, res) => {
  res
    .status(200)
    .cookie('token', 'none', { expires: new Date(Date.now() + 10 * 1000) })
    .cookie('refreshToken', 'none', { expires: new Date(Date.now() + 10 * 1000) })
    .json({
      success: true,
      message: 'Logged out successfully'
    });
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getMe = catchAsync(async (req, res, next) => {
  const user = await User.findByPk(req.user.id, {
    include: [
      { model: CandidateProfile, as: 'candidateProfile' },
      { model: RecruiterProfile, as: 'recruiterProfile' }
    ]
  });

  res.status(200).json({
    success: true,
    user
  });
});

// @desc    Refresh token
// @route   POST /api/auth/refresh
// @access  Public
export const refreshToken = catchAsync(async (req, res, next) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return next(new AppError('Please provide a refresh token', 400));
  }

  const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
  const user = await User.findByPk(decoded.id);

  if (!user) {
    return next(new AppError('User no longer exists', 401));
  }

  const token = generateToken(user.id);
  const newRefreshToken = generateRefreshToken(user.id);

  res.status(200).json({
    success: true,
    token,
    refreshToken: newRefreshToken
  });
});

// @desc    Update password
// @route   PUT /api/auth/password
// @access  Private
export const updatePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return next(new AppError('Please provide current and new password', 400));
  }

  const user = await User.findByPk(req.user.id);

  // Check current password
  const isCorrect = await user.comparePassword(currentPassword);
  if (!isCorrect) {
    return next(new AppError('Current password is incorrect', 401));
  }

  // Update password
  user.password = newPassword;
  await user.save();

  sendTokenResponse(user, 200, res);
});

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  const user = await User.findOne({ where: { email } });

  if (!user) {
    return next(new AppError('No user found with this email', 404));
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  user.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  await user.save();

  // TODO: Send reset email with token

  res.status(200).json({
    success: true,
    message: 'Password reset token sent to email'
  });
});

// @desc    Reset password
// @route   PUT /api/auth/reset-password/:token
// @access  Public
export const resetPassword = catchAsync(async (req, res, next) => {
  const { token } = req.params;
  const { password } = req.body;

  // Hash token
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  const user = await User.findOne({
    where: {
      passwordResetToken: hashedToken,
      passwordResetExpires: { [Op.gt]: Date.now() }
    }
  });

  if (!user) {
    return next(new AppError('Invalid or expired reset token', 400));
  }

  user.password = password;
  user.passwordResetToken = null;
  user.passwordResetExpires = null;
  await user.save();

  sendTokenResponse(user, 200, res);
});

// @desc    Verify email
// @route   GET /api/auth/verify-email/:token
// @access  Public
export const verifyEmail = catchAsync(async (req, res, next) => {
  const { token } = req.params;

  const user = await User.findOne({ where: { emailVerificationToken: token } });

  if (!user) {
    return next(new AppError('Invalid verification token', 400));
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = null;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Email verified successfully'
  });
});

// @desc    Setup 2FA
// @route   POST /api/auth/2fa/setup
// @access  Private
export const setup2FA = catchAsync(async (req, res, next) => {
  const user = req.user;

  if (user.isTwoFactorEnabled) {
    return next(new AppError('2FA is already enabled', 400));
  }

  const secret = speakeasy.generateSecret({
    name: `${config.totp.issuer}:${user.email}`
  });

  // Save secret temporarily (not enabling yet)
  user.twoFactorSecret = secret.base32;
  await user.save();

  const qrCode = await QRCode.toDataURL(secret.otpauth_url);

  res.status(200).json({
    success: true,
    secret: secret.base32,
    qrCode
  });
});

// @desc    Enable 2FA
// @route   POST /api/auth/2fa/enable
// @access  Private
export const enable2FA = catchAsync(async (req, res, next) => {
  const { token } = req.body;
  const user = req.user;

  if (!user.twoFactorSecret) {
    return next(new AppError('Please setup 2FA first', 400));
  }

  const verified = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: 'base32',
    token
  });

  if (!verified) {
    return next(new AppError('Invalid verification token', 400));
  }

  user.isTwoFactorEnabled = true;
  await user.save();

  res.status(200).json({
    success: true,
    message: '2FA enabled successfully'
  });
});

// @desc    Disable 2FA
// @route   POST /api/auth/2fa/disable
// @access  Private
export const disable2FA = catchAsync(async (req, res, next) => {
  const { token } = req.body;
  const user = req.user;

  if (!user.isTwoFactorEnabled) {
    return next(new AppError('2FA is not enabled', 400));
  }

  const verified = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: 'base32',
    token
  });

  if (!verified) {
    return next(new AppError('Invalid verification token', 400));
  }

  user.isTwoFactorEnabled = false;
  user.twoFactorSecret = null;
  await user.save();

  res.status(200).json({
    success: true,
    message: '2FA disabled successfully'
  });
});