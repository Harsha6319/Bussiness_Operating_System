import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getAccessTokenSecret } from '../utils/tokens.js';

export const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new ApiError(401, 'Authentication required');

  const secret = getAccessTokenSecret();
  if (!secret) throw new ApiError(500, 'JWT access secret is not configured');

  const payload = jwt.verify(token, secret);
  const user = await User.findById(payload.sub).select('-password -refreshTokens');
  if (!user || !user.isActive) throw new ApiError(401, 'Invalid authentication token');

  req.user = user;
  req.organizationId = user.organizationId;
  next();
});

export const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    throw new ApiError(403, 'You do not have permission to perform this action');
  }
  next();
};
