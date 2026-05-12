const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/commentController');

router.get('/tasks/:id/comments', authenticate, ctrl.getComments);
router.post('/tasks/:id/comments', authenticate, ctrl.createComment);
router.delete('/comments/:id', authenticate, ctrl.deleteComment);

module.exports = router;
