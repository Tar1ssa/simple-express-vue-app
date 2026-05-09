const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const { rateLimiter } = require('../middleware/rateLimiter');
const auth = require('../controllers/auth.controller');

const router = Router();

// Rate limit auth routes: 20 requests per 15 minutes per IP
const authLimiter = rateLimiter({ windowMs: 15 * 60 * 1000, maxRequests: 20 });

// Public routes
router.post('/register', authLimiter, auth.registerValidation, auth.register);
router.post('/login', authLimiter, auth.loginValidation, auth.login);
router.post('/refresh', auth.refresh);
router.post('/logout', auth.logout);
router.post('/forgot-password', authLimiter, auth.forgotPasswordValidation, auth.forgotPassword);
router.post('/reset-password', authLimiter, auth.resetPasswordValidation, auth.resetPassword);

// Protected routes
router.post('/change-password', authenticate, auth.changePasswordValidation, auth.changePassword);

module.exports = router;
