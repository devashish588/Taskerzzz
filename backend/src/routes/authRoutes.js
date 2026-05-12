const express = require('express');
const router = express.Router();
const { authenticate, adminOnly } = require('../middleware/auth');
const ctrl = require('../controllers/authController');

router.post('/register', ctrl.register);
router.post('/login', ctrl.login);
router.post('/logout', ctrl.logout);
router.post('/refresh', ctrl.refresh);
router.post('/forgot-password', ctrl.forgotPassword);
router.post('/reset-password', ctrl.resetPassword);
router.post('/invite', authenticate, adminOnly, ctrl.invite);
router.post('/accept-invite', ctrl.acceptInvite);
router.get('/me', authenticate, ctrl.getMe);

module.exports = router;
