const express = require('express');
const router = express.Router();
const { authenticate, adminOnly } = require('../middleware/auth');
const ctrl = require('../controllers/analyticsController');

router.use(authenticate, adminOnly);
router.get('/overview', ctrl.getOverview);
router.get('/tasks-over-time', ctrl.getTasksOverTime);
router.get('/by-status', ctrl.getByStatus);
router.get('/by-priority', ctrl.getByPriority);
router.get('/by-project', ctrl.getByProject);
router.get('/tasker-performance', ctrl.getTaskerPerformance);
router.get('/tasker/:id/timeline', ctrl.getTaskerTimeline);
router.get('/review-metrics', ctrl.getReviewMetrics);
router.get('/productivity', ctrl.getProductivity);

module.exports = router;
