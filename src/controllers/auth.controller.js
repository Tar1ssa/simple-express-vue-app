const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const config = require('../config/env');
const store = require('../store/dbStore');
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  generateResetToken,
} = require('../utils/token');

// ─── Validation Rules ─────────────────────────────────────

const registerValidation = [
  body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain a number'),
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

const changePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('New password must contain an uppercase letter')
    .matches(/[0-9]/).withMessage('New password must contain a number'),
];

const forgotPasswordValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
];

const resetPasswordValidation = [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('newPassword')
    .isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('New password must contain an uppercase letter')
    .matches(/[0-9]/).withMessage('New password must contain a number'),
];

// ─── Helpers ──────────────────────────────────────────────

function handleValidationErrors(req, res, view, title) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMsg = errors.array()[0].msg;
    if (req.originalUrl.startsWith('/api/')) {
        return res.status(400).json({ success: false, message: errorMsg });
    }
    res.render(view, { 
        user: req.user || null, 
        title, 
        error: errorMsg 
    });
    return true;
  }
  return false;
}

function sanitizeUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

// ─── Controllers ──────────────────────────────────────────

async function register(req, res, next) {
  try {
    if (handleValidationErrors(req, res, 'register', 'Register')) return;
    const { name, email, password } = req.body;

    if (await store.findUserByEmail(email)) {
      return res.render('register', { user: null, title: 'Register', error: 'Email is already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, config.bcrypt.saltRounds);
    const user = await store.createUser({ name, email, password: hashedPassword });

    await store.logAudit({
      userId: user.id,
      event: 'register',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.render('login', { user: null, title: 'Login', success: 'Registration successful! Please log in.' });
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    if (handleValidationErrors(req, res, 'login', 'Login')) return;
    const { email, password } = req.body;

    const user = await store.findUserByEmail(email);
    if (!user) {
      return res.render('login', { user: null, title: 'Login', error: 'Invalid email or password.' });
    }

    // ── Account Lockout Check ──
    if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
      const retryAfterSeconds = Math.ceil((new Date(user.lockedUntil) - new Date()) / 1000);
      return res.render('login', { 
          user: null, 
          title: 'Login', 
          error: `Account locked. Try again in ${retryAfterSeconds} seconds.` 
      });
    }

    // ── Password Verification ──
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      const failedAttempts = user.failedLoginAttempts + 1;
      const updates = { failedLoginAttempts: failedAttempts };

      if (failedAttempts >= config.security.maxLoginAttempts) {
        updates.lockedUntil = new Date(Date.now() + config.security.lockDurationMinutes * 60 * 1000).toISOString();
      }

      await store.updateUser(user.id, updates);
      const remaining = config.security.maxLoginAttempts - failedAttempts;
      
      return res.render('login', { 
          user: null, 
          title: 'Login', 
          error: remaining > 0 ? `Invalid password. ${remaining} attempts left.` : 'Account locked due to too many failed attempts.' 
      });
    }

    // ── Success: Reset lockout & issue tokens ──
    await store.updateUser(user.id, { failedLoginAttempts: 0, lockedUntil: null });
    const { token: accessToken } = signAccessToken(user);
    const { token: refreshToken } = await signRefreshToken(user);

    // Set Cookie
    res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: config.nodeEnv === 'production',
        maxAge: 15 * 60 * 1000 // 15 mins
    });

    await store.logAudit({
      userId: user.id, event: 'login_success',
      ipAddress: req.ip, userAgent: req.headers['user-agent'],
    });

    res.redirect('/dashboard');
  } catch (error) {
    next(error);
  }
}

async function refresh(req, res, next) {
  // In monolith, we usually just use the cookie, but we keep this for API compatibility
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ success: false });

    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch {
      return res.status(401).json({ success: false });
    }

    const storedToken = await store.findRefreshToken(decoded.jti);
    if (!storedToken) return res.status(401).json({ success: false });

    const user = await store.findUserById(decoded.sub);
    if (!user) return res.status(401).json({ success: false });

    const { token: accessToken } = signAccessToken(user);
    
    res.cookie('accessToken', accessToken, { httpOnly: true, maxAge: 15 * 60 * 1000 });
    res.json({ success: true, data: { accessToken } });
  } catch (error) {
    next(error);
  }
}

async function logout(req, res, next) {
  try {
    res.clearCookie('accessToken');
    res.redirect('/login');
  } catch (error) {
    next(error);
  }
}

async function changePassword(req, res, next) {
  try {
    const user = await store.findUserById(req.user.sub);
    if (handleValidationErrors(req, res, 'change-password', 'Change Password')) return;
    
    const { currentPassword, newPassword } = req.body;
    const isValid = await bcrypt.compare(currentPassword, user.password);
    
    if (!isValid) {
      return res.render('change-password', { user, title: 'Change Password', error: 'Current password is incorrect.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, config.bcrypt.saltRounds);
    await store.updateUser(user.id, { password: hashedPassword });
    await store.removeAllUserRefreshTokens(user.id);

    res.render('profile', { 
        user, 
        userData: sanitizeUser(user), 
        title: 'Profile', 
        success: 'Password changed successfully.' 
    });
  } catch (error) {
    next(error);
  }
}

async function forgotPassword(req, res, next) {
  try {
    if (handleValidationErrors(req, res, 'forgot-password', 'Forgot Password')) return;
    const { email } = req.body;
    const user = await store.findUserByEmail(email);

    if (user) {
        const resetToken = generateResetToken();
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
        await store.storeResetToken(resetToken, { userId: user.id, expiresAt });
        console.log(`\n📧 Reset Token for ${email}: ${resetToken}\n`);
    }

    res.render('forgot-password', { 
        user: null, 
        title: 'Forgot Password', 
        success: 'If an account exists, a reset token has been logged to the server console.' 
    });
  } catch (error) {
    next(error);
  }
}

async function resetPassword(req, res, next) {
  try {
    if (handleValidationErrors(req, res, 'reset-password', 'Reset Password')) return;
    const { token, newPassword } = req.body;

    const resetEntry = await store.findResetToken(token);
    if (!resetEntry) {
      return res.render('reset-password', { user: null, title: 'Reset Password', error: 'Invalid or expired token.' });
    }

    const user = await store.findUserById(resetEntry.userId);
    const hashedPassword = await bcrypt.hash(newPassword, config.bcrypt.saltRounds);
    
    await store.updateUser(user.id, { password: hashedPassword, failedLoginAttempts: 0, lockedUntil: null });
    await store.removeResetToken(token);
    await store.removeAllUserRefreshTokens(user.id);

    res.render('login', { user: null, title: 'Login', success: 'Password reset successful. Please log in.' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  register, registerValidation,
  login, loginValidation,
  refresh, logout,
  changePassword, changePasswordValidation,
  forgotPassword, forgotPasswordValidation,
  resetPassword, resetPasswordValidation,
};
