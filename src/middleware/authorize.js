/**
 * Role-Based Authorization Middleware
 * Must be used AFTER authenticate middleware.
 * Checks if the authenticated user has one of the required roles.
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions. Required role: ' + roles.join(' or '),
      });
    }

    next();
  };
}

module.exports = { authorize };
