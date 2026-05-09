const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const user = require('../controllers/user.controller');

const router = Router();

// All user routes require authentication
router.use(authenticate);

router.get('/dashboard', user.getDashboard);
router.get('/profile', user.getProfile);
router.post('/profile', user.updateProfileValidation, user.updateProfile); // Using POST for form submission
router.get('/users', authorize('admin'), user.listUsers);

module.exports = router;
