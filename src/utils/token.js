const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../config/env');
const store = require('../store/memoryStore');

/**
 * Generate a unique JWT ID for token tracking/blacklisting.
 */
function generateJti() {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Sign a short-lived access token.
 * Payload: { jti, sub, email, role }
 */
function signAccessToken(user) {
  const jti = generateJti();
  const token = jwt.sign(
    { jti, sub: user.id, email: user.email, role: user.role },
    config.jwt.accessSecret,
    { expiresIn: config.jwt.accessExpiry }
  );
  return { token, jti };
}

/**
 * Sign a long-lived refresh token and persist it in the store.
 * Payload: { jti, sub, type }
 */
function signRefreshToken(user) {
  const jti = generateJti();
  const token = jwt.sign(
    { jti, sub: user.id, type: 'refresh' },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiry }
  );
  const decoded = jwt.decode(token);
  store.storeRefreshToken(jti, {
    userId: user.id,
    token,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(decoded.exp * 1000).toISOString(),
  });
  return { token, jti };
}

/**
 * Verify an access token and return its decoded payload.
 */
function verifyAccessToken(token) {
  return jwt.verify(token, config.jwt.accessSecret);
}

/**
 * Verify a refresh token and return its decoded payload.
 */
function verifyRefreshToken(token) {
  return jwt.verify(token, config.jwt.refreshSecret);
}

/**
 * Generate a cryptographic reset token for password recovery.
 */
function generateResetToken() {
  return crypto.randomBytes(32).toString('hex');
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateResetToken,
};
