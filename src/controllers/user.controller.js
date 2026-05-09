const { body, validationResult } = require('express-validator');
const store = require('../store/dbStore');

// ─── Validation Rules ─────────────────────────────────────

const updateProfileValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be 2-50 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
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
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

// ─── Controllers ──────────────────────────────────────────

async function getDashboard(req, res, next) {
  try {
    const user = await store.findUserById(req.user.sub);
    if (!user) return res.redirect('/login');
    res.render('dashboard', { user, title: 'Dashboard' });
  } catch (error) {
    next(error);
  }
}

async function getProfile(req, res, next) {
  try {
    const user = await store.findUserById(req.user.sub);
    if (!user) return res.redirect('/login');
    res.render('profile', { user, userData: sanitizeUser(user), title: 'Profile' });
  } catch (error) {
    next(error);
  }
}

async function updateProfile(req, res, next) {
  try {
    if (handleValidationErrors(req, res)) return;

    const userId = req.user.sub;
    const { name, email } = req.body;
    const updates = {};

    if (name !== undefined) updates.name = name;

    if (email !== undefined) {
      // Check email uniqueness (exclude current user)
      const existingUser = await store.findUserByEmail(email);
      if (existingUser && existingUser.id !== userId) {
        return res.status(409).json({
          success: false,
          message: 'Email is already in use by another account.',
        });
      }
      updates.email = email;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update. You can update: name, email.',
      });
    }

    const updatedUser = await store.updateUser(userId, updates);
    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    await store.logAudit({
      userId,
      event: 'profile_updated',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: { updatedFields: Object.keys(updates) },
    });

    const user = await store.findUserById(userId);
    res.render('profile', { 
      user, 
      userData: sanitizeUser(updatedUser), 
      title: 'Profile',
      success: 'Profile updated successfully.' 
    });
  } catch (error) {
    next(error);
  }
}

async function listUsers(req, res, next) {
  try {
    const user = await store.findUserById(req.user.sub);
    const users = (await store.getAllUsers()).map(sanitizeUser);
    res.render('users', { user, users, title: 'User Management' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getDashboard,
  getProfile,
  updateProfile,
  updateProfileValidation,
  listUsers,
};
