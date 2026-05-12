const prisma = require('../utils/prisma');
const bcrypt = require('bcryptjs');
const { paginate, paginatedResponse } = require('../utils/pagination');

// Get all users (Admin only)
const getUsers = async (req, res, next) => {
  try {
    const { page, limit, search, role } = req.query;
    const { skip, take, page: p, limit: l } = paginate(page, limit);

    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (role) where.role = role;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        select: { id: true, name: true, email: true, role: true, avatar: true, isActive: true, dailyTarget: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    res.json(paginatedResponse(users, total, p, l));
  } catch (error) {
    next(error);
  }
};

// Get user by ID
const getUser = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true, name: true, email: true, role: true, avatar: true,
        isActive: true, createdAt: true, updatedAt: true,
        _count: { select: { assignedTasks: true, createdTasks: true } },
      },
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    // Taskers can only view their own profile
    if (req.user.role === 'TASKER' && req.user.id !== req.params.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ user });
  } catch (error) {
    next(error);
  }
};

// Update user
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Taskers can only update their own profile
    if (req.user.role === 'TASKER' && req.user.id !== id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const data = {};
    if (req.body.name) data.name = req.body.name;
    if (req.body.avatar !== undefined) data.avatar = req.body.avatar;

    // Only admin can change role and isActive
    if (req.user.role === 'ADMIN') {
      if (req.body.role) data.role = req.body.role;
      if (req.body.isActive !== undefined) data.isActive = req.body.isActive;
    }

    // Password change
    if (req.body.password) {
      data.password = await bcrypt.hash(req.body.password, 12);
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, name: true, email: true, role: true, avatar: true, isActive: true },
    });

    res.json({ user });
  } catch (error) {
    next(error);
  }
};

// Delete user (Admin only - deactivate)
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (id === req.user.id) {
      return res.status(400).json({ error: 'Cannot deactivate your own account' });
    }

    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    res.json({ message: 'User deactivated' });
  } catch (error) {
    next(error);
  }
};

// Get user stats
const getUserStats = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (req.user.role === 'TASKER' && req.user.id !== id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const user = await prisma.user.findUnique({ where: { id }, select: { dailyTarget: true } });
    const [total, completed, inProgress, inReview, flagged, skipped, overdue, assigned] = await Promise.all([
      prisma.task.count({ where: { assignedToId: id, deletedAt: null } }),
      prisma.task.count({ where: { assignedToId: id, status: 'COMPLETED', deletedAt: null } }),
      prisma.task.count({ where: { assignedToId: id, status: 'IN_PROGRESS', deletedAt: null } }),
      prisma.task.count({ where: { assignedToId: id, status: 'IN_REVIEW', deletedAt: null } }),
      prisma.task.count({ where: { assignedToId: id, status: 'FLAGGED', deletedAt: null } }),
      prisma.task.count({ where: { assignedToId: id, status: 'SKIPPED', deletedAt: null } }),
      prisma.task.count({ where: { assignedToId: id, deletedAt: null, status: { notIn: ['COMPLETED', 'SKIPPED'] }, dueDate: { lt: new Date() } } }),
      prisma.task.count({ where: { assignedToId: id, status: 'ASSIGNED', deletedAt: null } }),
    ]);

    // Today's tasks
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const [todayAssigned, todayCompleted] = await Promise.all([
      prisma.task.count({ where: { assignedToId: id, deletedAt: null, createdAt: { gte: todayStart } } }),
      prisma.task.count({ where: { assignedToId: id, status: 'COMPLETED', deletedAt: null, completedAt: { gte: todayStart } } }),
    ]);

    // Avg quality and time scores
    const scoredTasks = await prisma.task.findMany({
      where: { assignedToId: id, deletedAt: null, status: 'COMPLETED', qualityScore: { not: null } },
      select: { qualityScore: true, timeScore: true },
    });
    const avgQuality = scoredTasks.length > 0 ? Math.round(scoredTasks.reduce((s, t) => s + t.qualityScore, 0) / scoredTasks.length) : 0;
    const timeScoredTasks = scoredTasks.filter(t => t.timeScore != null);
    const avgTimeScore = timeScoredTasks.length > 0 ? Math.round(timeScoredTasks.reduce((s, t) => s + t.timeScore, 0) / timeScoredTasks.length) : 0;

    res.json({
      stats: {
        total, completed, inProgress, inReview, flagged, skipped, overdue, assigned,
        dailyTarget: user?.dailyTarget || 15,
        todayAssigned, todayCompleted,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
        approvalRate: (completed + flagged) > 0 ? Math.round((completed / (completed + flagged)) * 100) : 0,
        avgQuality,
        avgTimeScore,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Set daily target (Admin only)
const setDailyTarget = async (req, res, next) => {
  try {
    const { dailyTarget } = req.body;
    if (!dailyTarget || dailyTarget < 1) return res.status(400).json({ error: 'Invalid daily target' });
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { dailyTarget: parseInt(dailyTarget) },
      select: { id: true, name: true, dailyTarget: true },
    });
    res.json({ user });
  } catch (error) {
    next(error);
  }
};

module.exports = { getUsers, getUser, updateUser, deleteUser, getUserStats, setDailyTarget };
