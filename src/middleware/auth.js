const { verifyAccessToken } = require('../utils/token');
const store = require('../store/dbStore');

/**
 * JWT Authentication Middleware
 * Extracts Bearer token from Authorization header, verifies it,
 * checks the blacklist, and attaches decoded user to req.user.
 */
async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyAccessToken(token);

    // Check if token has been revoked
    if (await store.isTokenBlacklisted(decoded.jti)) {
      return res.status(401).json({
        success: false,
        message: 'Token has been revoked.',
      });
    }

    // Verify user still exists
    const user = await store.findUserById(decoded.sub);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists.',
      });
    }

    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired. Please refresh your token.',
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid token.',
    });
  }
}

module.exports = { authenticate };
