import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { ROLES } from '../constants/roles.js';
import { Setting } from '../models/Setting.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getRefreshTokenSecret, setRefreshCookie, signAccessToken, signRefreshToken } from '../utils/tokens.js';

function authResponse(user, res) {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  setRefreshCookie(res, refreshToken);
  return { accessToken, user: { id: user._id, name: user.name, email: user.email, role: user.role, organizationId: user.organizationId } };
}

export const register = asyncHandler(async (req, res) => {
  const { businessName, name, email, password } = req.body;
  const organizationId = new mongoose.Types.ObjectId();
  
  console.time('User.create');
  const user = await User.create({ organizationId, name, email, password, role: ROLES.OWNER });
  console.timeEnd('User.create');
  
  console.time('Setting.create');
  await Setting.create({ organizationId, businessName, profile: { email } });
  console.timeEnd('Setting.create');
  
  res.status(201).json(authResponse(user, res));
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) throw new ApiError(401, 'Invalid email or password');
  res.json(authResponse(user, res));
});

export const me = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});

export const inviteUser = asyncHandler(async (req, res) => {
  const user = await User.create({ ...req.body, organizationId: req.organizationId });
  res.status(201).json({ user: { id: user._id, name: user.name, email: user.email, role: user.role } });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (user) {
    user.passwordResetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetExpires = new Date(Date.now() + 30 * 60 * 1000);
    await user.save();
  }
  res.json({ message: 'If the email exists, a reset link can be sent by the configured email provider.' });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ passwordResetToken: req.body.token, passwordResetExpires: { $gt: new Date() } });
  if (!user) throw new ApiError(400, 'Invalid or expired reset token');
  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.tokenVersion += 1;
  await user.save();
  res.json({ message: 'Password updated successfully' });
});

export const logout = asyncHandler(async (req, res) => {
  res.clearCookie('refreshToken');
  res.json({ message: 'Logged out' });
});

export const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies.refreshToken || req.body.refreshToken;
  if (!token) throw new ApiError(401, 'Refresh token required');

  const secret = getRefreshTokenSecret();
  if (!secret) throw new ApiError(500, 'JWT refresh secret is not configured');

  const payload = jwt.verify(token, secret);
  const user = await User.findById(payload.sub);
  if (!user || user.tokenVersion !== payload.tokenVersion) throw new ApiError(401, 'Invalid refresh token');

  res.json(authResponse(user, res));
});
