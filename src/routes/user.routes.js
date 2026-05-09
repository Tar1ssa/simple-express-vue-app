const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const user = require('../controllers/user.controller');

const router = Router();

// All user routes require authentication
router.use(authenticate);

router.get('/profile', user.getProfile);
router.put('/profile', user.updateProfileValidation, user.updateProfile);
router.get('/', authorize('admin'), user.listUsers);

module.exports = router;
