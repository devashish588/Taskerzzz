const prisma = require('../utils/prisma');

const getOverview = async (req, res, next) => {
  try {
    const [totalProjects, totalTaskers, totalTasks, completed, assigned, inProgress, inReview, flagged, skipped, overdue] = await Promise.all([
      prisma.project.count({ where: { deletedAt: null } }),
      prisma.user.count({ where: { role: 'TASKER', isActive: true } }),
      prisma.task.count({ where: { deletedAt: null } }),
      prisma.task.count({ where: { deletedAt: null, status: 'COMPLETED' } }),
      prisma.task.count({ where: { deletedAt: null, status: 'ASSIGNED' } }),
      prisma.task.count({ where: { deletedAt: null, status: 'IN_PROGRESS' } }),
      prisma.task.count({ where: { deletedAt: null, status: 'IN_REVIEW' } }),
      prisma.task.count({ where: { deletedAt: null, status: 'FLAGGED' } }),
      prisma.task.count({ where: { deletedAt: null, status: 'SKIPPED' } }),
      prisma.task.count({ where: { deletedAt: null, status: { notIn: ['COMPLETED', 'SKIPPED'] }, dueDate: { lt: new Date() } } }),
    ]);
    res.json({ totalProjects, totalTaskers, totalTasks, completed, assigned, inProgress, inReview, flagged, skipped, overdue });
  } catch (error) { next(error); }
};

const getTasksOverTime = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const startDate = new Date(); startDate.setDate(startDate.getDate() - days);
    const tasks = await prisma.task.findMany({
      where: { completedAt: { gte: startDate }, deletedAt: null, status: 'COMPLETED' },
      select: { completedAt: true },
    });
    const dateMap = {};
    for (let i = 0; i < days; i++) { const d = new Date(); d.setDate(d.getDate() - (days - 1 - i)); dateMap[d.toISOString().split('T')[0]] = 0; }
    tasks.forEach((t) => { const key = t.completedAt.toISOString().split('T')[0]; if (dateMap[key] !== undefined) dateMap[key]++; });
    res.json({ data: Object.entries(dateMap).map(([date, count]) => ({ date, count })) });
  } catch (error) { next(error); }
};

const getByStatus = async (req, res, next) => {
  try {
    const statuses = ['ASSIGNED', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED', 'FLAGGED', 'SKIPPED'];
    const counts = await Promise.all(statuses.map((s) => prisma.task.count({ where: { status: s, deletedAt: null } })));
    res.json({ data: statuses.map((status, i) => ({ status, count: counts[i] })) });
  } catch (error) { next(error); }
};

const getByPriority = async (req, res, next) => {
  try {
    const priorities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
    const counts = await Promise.all(priorities.map((p) => prisma.task.count({ where: { priority: p, deletedAt: null } })));
    res.json({ data: priorities.map((priority, i) => ({ priority, count: counts[i] })) });
  } catch (error) { next(error); }
};

const getByProject = async (req, res, next) => {
  try {
    const projects = await prisma.project.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true, tasks: { where: { deletedAt: null }, select: { status: true } } },
    });
    const data = projects.map((p) => {
      const total = p.tasks.length; const done = p.tasks.filter((t) => t.status === 'COMPLETED').length;
      return { id: p.id, name: p.name, total, done, percentage: total > 0 ? Math.round((done / total) * 100) : 0 };
    });
    res.json({ data });
  } catch (error) { next(error); }
};

const getTaskerPerformance = async (req, res, next) => {
  try {
    const taskers = await prisma.user.findMany({
      where: { role: 'TASKER', isActive: true },
      select: {
        id: true, name: true, avatar: true, dailyTarget: true,
        assignedTasks: { where: { deletedAt: null }, select: { status: true, dueDate: true, qualityScore: true, timeScore: true } },
      },
    });
    const data = taskers.map((t) => {
      const tasks = t.assignedTasks;
      const total = tasks.length;
      const completed = tasks.filter((tk) => tk.status === 'COMPLETED').length;
      const flagged = tasks.filter((tk) => tk.status === 'FLAGGED').length;
      const overdue = tasks.filter((tk) => !['COMPLETED', 'SKIPPED'].includes(tk.status) && tk.dueDate && tk.dueDate < new Date()).length;
      const scored = tasks.filter((tk) => tk.qualityScore != null);
      const avgQuality = scored.length > 0 ? Math.round(scored.reduce((s, tk) => s + tk.qualityScore, 0) / scored.length) : null;
      const timeScoredTasks = tasks.filter((tk) => tk.timeScore != null);
      const avgTimeScore = timeScoredTasks.length > 0 ? Math.round(timeScoredTasks.reduce((s, tk) => s + tk.timeScore, 0) / timeScoredTasks.length) : null;
      const approvalRate = (completed + flagged) > 0 ? Math.round((completed / (completed + flagged)) * 100) : null;
      return { id: t.id, name: t.name, avatar: t.avatar, dailyTarget: t.dailyTarget, total, completed, flagged, overdue, approvalRate, avgQuality, avgTimeScore };
    });
    res.json({ data });
  } catch (error) { next(error); }
};

const getTaskerTimeline = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const startDate = new Date(); startDate.setDate(startDate.getDate() - days);
    const tasks = await prisma.task.findMany({
      where: { assignedToId: req.params.id, completedAt: { gte: startDate }, deletedAt: null, status: 'COMPLETED' },
      select: { completedAt: true, priority: true, qualityScore: true, timeScore: true },
    });
    const dateMap = {};
    for (let i = 0; i < days; i++) { const d = new Date(); d.setDate(d.getDate() - (days - 1 - i)); dateMap[d.toISOString().split('T')[0]] = 0; }
    tasks.forEach((t) => { const key = t.completedAt.toISOString().split('T')[0]; if (dateMap[key] !== undefined) dateMap[key]++; });
    res.json({ timeline: Object.entries(dateMap).map(([date, count]) => ({ date, count })), totalCompleted: tasks.length });
  } catch (error) { next(error); }
};

const getReviewMetrics = async (req, res, next) => {
  try {
    const [totalReviewed, approved, flaggedCount, inReview] = await Promise.all([
      prisma.task.count({ where: { deletedAt: null, reviewedAt: { not: null } } }),
      prisma.task.count({ where: { deletedAt: null, status: 'COMPLETED', reviewedAt: { not: null } } }),
      prisma.task.count({ where: { deletedAt: null, status: 'FLAGGED' } }),
      prisma.task.count({ where: { deletedAt: null, status: 'IN_REVIEW' } }),
    ]);
    const approvalRate = totalReviewed > 0 ? Math.round((approved / totalReviewed) * 100) : 0;

    // Most flagged taskers
    const taskers = await prisma.user.findMany({
      where: { role: 'TASKER', isActive: true },
      select: {
        id: true, name: true,
        assignedTasks: { where: { deletedAt: null, status: 'FLAGGED' }, select: { id: true } },
      },
    });
    const mostFlagged = taskers.map((t) => ({ id: t.id, name: t.name, flaggedCount: t.assignedTasks.length }))
      .sort((a, b) => b.flaggedCount - a.flaggedCount)
      .slice(0, 5);

    res.json({ totalReviewed, approved, flaggedCount, inReview, approvalRate, mostFlagged });
  } catch (error) { next(error); }
};

const getProductivity = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const startDate = new Date(); startDate.setDate(startDate.getDate() - days);
    const tasks = await prisma.task.findMany({
      where: { deletedAt: null, completedAt: { gte: startDate }, status: 'COMPLETED' },
      select: { completedAt: true, estimatedMinutes: true, actualMinutes: true, assignedToId: true, qualityScore: true, timeScore: true },
    });

    // Daily productivity
    const dailyMap = {};
    for (let i = 0; i < days; i++) { const d = new Date(); d.setDate(d.getDate() - (days - 1 - i)); dailyMap[d.toISOString().split('T')[0]] = 0; }
    tasks.forEach((t) => { const key = t.completedAt.toISOString().split('T')[0]; if (dailyMap[key] !== undefined) dailyMap[key]++; });

    // Avg quality & time scores
    const scored = tasks.filter((t) => t.qualityScore != null);
    const avgQuality = scored.length > 0 ? Math.round(scored.reduce((s, t) => s + t.qualityScore, 0) / scored.length) : 0;
    const timeScoredTasks = tasks.filter((t) => t.timeScore != null);
    const avgTimeScore = timeScoredTasks.length > 0 ? Math.round(timeScoredTasks.reduce((s, t) => s + t.timeScore, 0) / timeScoredTasks.length) : 0;

    res.json({
      daily: Object.entries(dailyMap).map(([date, count]) => ({ date, count })),
      totalCompleted: tasks.length,
      avgQuality,
      avgTimeScore,
    });
  } catch (error) { next(error); }
};

module.exports = { getOverview, getTasksOverTime, getByStatus, getByPriority, getByProject, getTaskerPerformance, getTaskerTimeline, getReviewMetrics, getProductivity };
