const express = require('express');
const router = express.Router();
const { authenticate, adminOnly } = require('../middleware/auth');
const ctrl = require('../controllers/projectController');

router.get('/', authenticate, ctrl.getProjects);
router.post('/', authenticate, adminOnly, ctrl.createProject);
router.get('/:id', authenticate, ctrl.getProject);
router.put('/:id', authenticate, adminOnly, ctrl.updateProject);
router.delete('/:id', authenticate, adminOnly, ctrl.deleteProject);
router.post('/:id/members', authenticate, adminOnly, ctrl.addMember);
router.delete('/:id/members/:userId', authenticate, adminOnly, ctrl.removeMember);

module.exports = router;
