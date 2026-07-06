import jwt from 'jsonwebtoken';

export function getAccessTokenSecret() {
  return process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;
}

export function getRefreshTokenSecret() {
  return process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
}

export function getAccessTokenExpiry() {
  return process.env.JWT_ACCESS_EXPIRES_IN || process.env.JWT_EXPIRE || '15m';
}

export function signAccessToken(user) {
  const secret = getAccessTokenSecret();
  if (!secret) throw new Error('JWT access secret is required. Set JWT_ACCESS_SECRET or JWT_SECRET.');

  return jwt.sign(
    { sub: user._id, role: user.role, organizationId: user.organizationId },
    secret,
    { expiresIn: getAccessTokenExpiry() }
  );
}

export function signRefreshToken(user) {
  const secret = getRefreshTokenSecret();
  if (!secret) throw new Error('JWT refresh secret is required. Set JWT_REFRESH_SECRET or JWT_SECRET.');

  return jwt.sign(
    { sub: user._id, tokenVersion: user.tokenVersion },
    secret,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
}

export function setRefreshCookie(res, token) {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
}
