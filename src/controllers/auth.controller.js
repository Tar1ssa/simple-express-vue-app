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

function handleValidationErrors(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: 'Validation failed.',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
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
    if (handleValidationErrors(req, res)) return;
    const { name, email, password } = req.body;

    if (await store.findUserByEmail(email)) {
      return res.status(409).json({ success: false, message: 'Email is already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, config.bcrypt.saltRounds);
    const user = await store.createUser({ name, email, password: hashedPassword });

    await store.logAudit({
      userId: user.id,
      event: 'register',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      data: sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    if (handleValidationErrors(req, res)) return;
    const { email, password } = req.body;

    const user = await store.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // ── Account Lockout Check ──
    if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
      const retryAfterSeconds = Math.ceil((new Date(user.lockedUntil) - new Date()) / 1000);
      await store.logAudit({
        userId: user.id, event: 'login_failed',
        ipAddress: req.ip, userAgent: req.headers['user-agent'],
        metadata: { reason: 'account_locked' },
      });
      return res.status(403).json({
        success: false,
        message: 'Account locked due to too many failed attempts.',
        data: { lockedUntil: user.lockedUntil, retryAfterSeconds },
      });
    }

    // ── Password Verification ──
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      const failedAttempts = user.failedLoginAttempts + 1;
      const updates = { failedLoginAttempts: failedAttempts };

      // Lock account if max attempts exceeded
      if (failedAttempts >= config.security.maxLoginAttempts) {
        updates.lockedUntil = new Date(
          Date.now() + config.security.lockDurationMinutes * 60 * 1000
        ).toISOString();
        await store.logAudit({
          userId: user.id, event: 'account_locked',
          ipAddress: req.ip, userAgent: req.headers['user-agent'],
          metadata: { failedAttempts },
        });
      }

      await store.updateUser(user.id, updates);
      await store.logAudit({
        userId: user.id, event: 'login_failed',
        ipAddress: req.ip, userAgent: req.headers['user-agent'],
        metadata: { failedAttempts },
      });

      const remaining = config.security.maxLoginAttempts - failedAttempts;
      if (remaining <= 0) {
        return res.status(403).json({
          success: false,
          message: 'Account locked due to too many failed attempts.',
          data: { lockedUntil: updates.lockedUntil, retryAfterSeconds: config.security.lockDurationMinutes * 60 },
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
        data: { remainingAttempts: remaining },
      });
    }

    // ── Success: Reset lockout & issue tokens ──
    await store.updateUser(user.id, { failedLoginAttempts: 0, lockedUntil: null });
    const { token: accessToken } = signAccessToken(user);
    const { token: refreshToken } = await signRefreshToken(user);

    await store.logAudit({
      userId: user.id, event: 'login_success',
      ipAddress: req.ip, userAgent: req.headers['user-agent'],
    });

    res.json({
      success: true,
      message: 'Login successful.',
      data: { accessToken, refreshToken, expiresIn: config.jwt.accessExpiry },
    });
  } catch (error) {
    next(error);
  }
}

async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'Refresh token is required.' });
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch {
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token.' });
    }

    const storedToken = await store.findRefreshToken(decoded.jti);
    if (!storedToken) {
      return res.status(401).json({ success: false, message: 'Refresh token has been revoked.' });
    }

    const user = await store.findUserById(decoded.sub);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found.' });
    }

    const { token: accessToken } = signAccessToken(user);

    await store.logAudit({
      userId: user.id, event: 'token_refresh',
      ipAddress: req.ip, userAgent: req.headers['user-agent'],
    });

    res.json({
      success: true,
      data: { accessToken, expiresIn: config.jwt.accessExpiry },
    });
  } catch (error) {
    next(error);
  }
}

async function logout(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'Refresh token is required.' });
    }

    try {
      const decoded = verifyRefreshToken(refreshToken);
      await store.removeRefreshToken(decoded.jti);
      await store.logAudit({
        userId: decoded.sub, event: 'logout',
        ipAddress: req.ip, userAgent: req.headers['user-agent'],
      });
    } catch {
      // Token may be expired — that's fine, user wants to logout anyway
    }

    res.json({ success: true, message: 'Logged out successfully.' });
  } catch (error) {
    next(error);
  }
}

async function changePassword(req, res, next) {
  try {
    if (handleValidationErrors(req, res)) return;
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.sub;

    const user = await store.findUserById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, config.bcrypt.saltRounds);
    await store.updateUser(userId, { password: hashedPassword });

    // Invalidate ALL existing refresh tokens for this user
    await store.removeAllUserRefreshTokens(userId);

    // Issue fresh token pair for current session
    const updatedUser = await store.findUserById(userId);
    const { token: accessToken } = signAccessToken(updatedUser);
    const { token: refreshToken } = await signRefreshToken(updatedUser);

    await store.logAudit({
      userId, event: 'password_changed',
      ipAddress: req.ip, userAgent: req.headers['user-agent'],
    });

    res.json({
      success: true,
      message: 'Password changed successfully. All other sessions have been invalidated.',
      data: { accessToken, refreshToken, expiresIn: config.jwt.accessExpiry },
    });
  } catch (error) {
    next(error);
  }
}

async function forgotPassword(req, res, next) {
  try {
    if (handleValidationErrors(req, res)) return;
    const { email } = req.body;

    // Always return same response to prevent email enumeration
    const genericResponse = {
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.',
    };

    const user = await store.findUserByEmail(email);
    if (!user) return res.json(genericResponse);

    const resetToken = generateResetToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

    await store.storeResetToken(resetToken, { userId: user.id, expiresAt });

    // In production, send via email — here we log to console
    console.log(`\n📧 Password Reset Token for ${email}:`);
    console.log(`   Token: ${resetToken}`);
    console.log(`   Expires: ${expiresAt}\n`);

    await store.logAudit({
      userId: user.id, event: 'password_reset_request',
      ipAddress: req.ip, userAgent: req.headers['user-agent'],
    });

    res.json(genericResponse);
  } catch (error) {
    next(error);
  }
}

async function resetPassword(req, res, next) {
  try {
    if (handleValidationErrors(req, res)) return;
    const { token, newPassword } = req.body;

    const resetEntry = await store.findResetToken(token);
    if (!resetEntry) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token.' });
    }

    const user = await store.findUserById(resetEntry.userId);
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid reset token.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, config.bcrypt.saltRounds);
    await store.updateUser(user.id, {
      password: hashedPassword,
      failedLoginAttempts: 0,
      lockedUntil: null,
    });

    await store.removeResetToken(token);
    await store.removeAllUserRefreshTokens(user.id);

    await store.logAudit({
      userId: user.id, event: 'password_reset',
      ipAddress: req.ip, userAgent: req.headers['user-agent'],
    });

    res.json({
      success: true,
      message: 'Password reset successful. Please log in with your new password.',
    });
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
