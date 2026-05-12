const express = require('express');
const router = express.Router();
const { authenticate, adminOnly } = require('../middleware/auth');
const ctrl = require('../controllers/taskController');

router.get('/', authenticate, ctrl.getTasks);
router.post('/', authenticate, ctrl.createTask);
router.get('/overdue', authenticate, adminOnly, ctrl.getOverdueTasks);
router.get('/:id', authenticate, ctrl.getTask);
router.put('/:id', authenticate, ctrl.updateTask);
router.put('/:id/submit', authenticate, ctrl.submitForReview);
router.put('/:id/review', authenticate, adminOnly, ctrl.reviewTask);
router.delete('/:id', authenticate, adminOnly, ctrl.deleteTask);

module.exports = router;
