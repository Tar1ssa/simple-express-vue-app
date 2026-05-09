/**
 * Simple In-Memory Rate Limiter
 * Tracks request counts per IP within a sliding time window.
 */
const rateLimitStore = new Map();

function rateLimiter({ windowMs = 15 * 60 * 1000, maxRequests = 100 } = {}) {
  return (req, res, next) => {
    const key = req.ip;
    const now = Date.now();

    if (!rateLimitStore.has(key)) {
      rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    const entry = rateLimitStore.get(key);

    if (now > entry.resetAt) {
      rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    entry.count++;

    if (entry.count > maxRequests) {
      const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);
      res.set('Retry-After', retryAfterSeconds);
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.',
        data: { retryAfterSeconds },
      });
    }

    next();
  };
}

module.exports = { rateLimiter };
