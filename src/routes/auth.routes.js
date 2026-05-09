const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const { rateLimiter } = require('../middleware/rateLimiter');
const auth = require('../controllers/auth.controller');

const router = Router();

// Rate limit auth routes: 20 requests per 15 minutes per IP
const authLimiter = rateLimiter({ windowMs: 15 * 60 * 1000, maxRequests: 20 });

// ─── Page Rendering Routes (GET) ───
router.get('/login', (req, res) => res.render('login', { user: req.user, title: 'Login' }));
router.get('/register', (req, res) => res.render('register', { user: req.user, title: 'Register' }));
router.get('/forgot-password', (req, res) => res.render('forgot-password', { user: req.user, title: 'Forgot Password' }));
router.get('/reset-password', (req, res) => res.render('reset-password', { user: req.user, title: 'Reset Password' }));
router.get('/change-password', authenticate, (req, res) => res.render('change-password', { user: req.user, title: 'Change Password' }));

// ─── Auth Action Routes (POST) ───
router.post('/register', authLimiter, auth.registerValidation, auth.register);
router.post('/login', authLimiter, auth.loginValidation, auth.login);
router.post('/refresh', auth.refresh);
router.post('/logout', auth.logout);
router.post('/forgot-password', authLimiter, auth.forgotPasswordValidation, auth.forgotPassword);
router.post('/reset-password', authLimiter, auth.resetPasswordValidation, auth.resetPassword);
router.post('/change-password', authenticate, auth.changePasswordValidation, auth.changePassword);

module.exports = router;
