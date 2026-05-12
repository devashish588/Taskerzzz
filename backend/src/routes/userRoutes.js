const express = require('express');
const router = express.Router();
const { authenticate, adminOnly } = require('../middleware/auth');
const ctrl = require('../controllers/userController');

router.get('/', authenticate, adminOnly, ctrl.getUsers);
router.get('/:id', authenticate, ctrl.getUser);
router.put('/:id', authenticate, ctrl.updateUser);
router.delete('/:id', authenticate, adminOnly, ctrl.deleteUser);
router.get('/:id/stats', authenticate, ctrl.getUserStats);
router.put('/:id/daily-target', authenticate, adminOnly, ctrl.setDailyTarget);

module.exports = router;
