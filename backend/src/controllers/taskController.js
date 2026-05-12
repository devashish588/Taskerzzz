const prisma = require('../utils/prisma');
const { paginate, paginatedResponse } = require('../utils/pagination');

const getTasks = async (req, res, next) => {
  try {
    const { page, limit, status, priority, projectId, assigneeId, category, search } = req.query;
    const { skip, take, page: p, limit: l } = paginate(page, limit);
    const where = { deletedAt: null };
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (projectId) where.projectId = projectId;
    if (assigneeId) where.assignedToId = assigneeId;
    if (category) where.category = category;
    if (search) where.title = { contains: search };
    if (req.user.role === 'TASKER') where.assignedToId = req.user.id;

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where, skip, take,
        include: {
          project: { select: { id: true, name: true } },
          assignedTo: { select: { id: true, name: true, avatar: true } },
          createdBy: { select: { id: true, name: true } },
          _count: { select: { comments: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.task.count({ where }),
    ]);
    res.json(paginatedResponse(tasks, total, p, l));
  } catch (error) { next(error); }
};

const createTask = async (req, res, next) => {
  try {
    const { title, description, priority, projectId, assignedToId, dueDate, estimatedMinutes, category, notes } = req.body;
    if (!title || !projectId) return res.status(400).json({ error: 'Title and project are required' });

    // Taskers create tasks assigned to themselves
    const assignee = req.user.role === 'TASKER' ? req.user.id : (assignedToId || null);
    const task = await prisma.task.create({
      data: {
        title,
        description: description || notes || null,
        status: 'ASSIGNED',
        priority: priority || 'MEDIUM',
        category: category || null,
        estimatedMinutes: estimatedMinutes ? parseInt(estimatedMinutes) : null,
        projectId,
        assignedToId: assignee,
        createdById: req.user.id,
        dueDate: dueDate ? new Date(dueDate) : new Date(),
      },
      include: { project: { select: { id: true, name: true } }, assignedTo: { select: { id: true, name: true, avatar: true } }, createdBy: { select: { id: true, name: true } } },
    });

    if (assignee && assignee !== req.user.id) {
      await prisma.notification.create({ data: { userId: assignee, message: `New task assigned: ${title}`, type: 'TASK_ASSIGNED' } });
    }
    await prisma.statusHistory.create({ data: { taskId: task.id, fromStatus: 'NONE', toStatus: 'ASSIGNED', changedById: req.user.id } });
    res.status(201).json({ task });
  } catch (error) { next(error); }
};

const getTask = async (req, res, next) => {
  try {
    const task = await prisma.task.findFirst({
      where: { id: req.params.id, deletedAt: null },
      include: {
        project: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true, avatar: true, email: true } },
        createdBy: { select: { id: true, name: true } },
        comments: { include: { user: { select: { id: true, name: true, avatar: true } } }, orderBy: { createdAt: 'desc' } },
        attachments: { include: { user: { select: { id: true, name: true } } } },
        statusHistory: { include: { changedBy: { select: { id: true, name: true } } }, orderBy: { changedAt: 'desc' } },
      },
    });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    if (req.user.role === 'TASKER' && task.assignedToId !== req.user.id) return res.status(403).json({ error: 'Access denied' });
    res.json({ task });
  } catch (error) { next(error); }
};

const updateTask = async (req, res, next) => {
  try {
    const existing = await prisma.task.findFirst({ where: { id: req.params.id, deletedAt: null } });
    if (!existing) return res.status(404).json({ error: 'Task not found' });
    if (req.user.role === 'TASKER' && existing.assignedToId !== req.user.id) return res.status(403).json({ error: 'Access denied' });

    const data = {};

    // Admin can edit everything
    if (req.user.role === 'ADMIN') {
      if (req.body.title) data.title = req.body.title;
      if (req.body.description !== undefined) data.description = req.body.description;
      if (req.body.priority) data.priority = req.body.priority;
      if (req.body.category !== undefined) data.category = req.body.category;
      if (req.body.estimatedMinutes !== undefined) data.estimatedMinutes = req.body.estimatedMinutes ? parseInt(req.body.estimatedMinutes) : null;
      if (req.body.projectId) data.projectId = req.body.projectId;
      if (req.body.assignedToId !== undefined) data.assignedToId = req.body.assignedToId;
      if (req.body.dueDate !== undefined) data.dueDate = req.body.dueDate ? new Date(req.body.dueDate) : null;
    }

    // Status changes with workflow enforcement
    if (req.body.status && req.body.status !== existing.status) {
      const newStatus = req.body.status;

      // Tasker restrictions
      if (req.user.role === 'TASKER') {
        const allowed = ['IN_PROGRESS', 'IN_REVIEW', 'SKIPPED'];
        if (!allowed.includes(newStatus)) {
          return res.status(403).json({ error: 'Taskers can only set IN_PROGRESS, IN_REVIEW, or SKIPPED' });
        }
        // Cannot complete — must go through review
        if (newStatus === 'COMPLETED') {
          return res.status(403).json({ error: 'Tasks must be submitted for review. Only admins can mark as completed.' });
        }
      }

      data.status = newStatus;

      // Auto-set timestamps
      if (newStatus === 'IN_PROGRESS' && !existing.startedAt) data.startedAt = new Date();
      if (newStatus === 'IN_REVIEW') data.submittedAt = new Date();
      if (newStatus === 'COMPLETED') {
        data.completedAt = new Date();
        data.reviewedAt = new Date();
        // Calculate actual minutes if started
        if (existing.startedAt) {
          data.actualMinutes = Math.round((Date.now() - new Date(existing.startedAt).getTime()) / 60000);
        }
      }
      if (newStatus === 'FLAGGED') {
        data.reviewedAt = new Date();
        data.revisionCount = (existing.revisionCount || 0) + 1;
        if (req.body.flagReason) data.flagReason = req.body.flagReason;
      }

      await prisma.statusHistory.create({ data: { taskId: existing.id, fromStatus: existing.status, toStatus: newStatus, changedById: req.user.id } });
    }

    // Review fields (admin only)
    if (req.user.role === 'ADMIN') {
      if (req.body.reviewNote !== undefined) data.reviewNote = req.body.reviewNote;
      if (req.body.qualityScore !== undefined) data.qualityScore = parseInt(req.body.qualityScore);
      if (req.body.timeScore !== undefined) data.timeScore = parseInt(req.body.timeScore);
      if (req.body.flagReason !== undefined) data.flagReason = req.body.flagReason;
      if (req.body.actualMinutes !== undefined) data.actualMinutes = parseInt(req.body.actualMinutes);
    }

    const task = await prisma.task.update({
      where: { id: req.params.id }, data,
      include: { project: { select: { id: true, name: true } }, assignedTo: { select: { id: true, name: true, avatar: true } }, createdBy: { select: { id: true, name: true } } },
    });
    res.json({ task });
  } catch (error) { next(error); }
};

// Tasker submits task for review
const submitForReview = async (req, res, next) => {
  try {
    const existing = await prisma.task.findFirst({ where: { id: req.params.id, deletedAt: null } });
    if (!existing) return res.status(404).json({ error: 'Task not found' });
    if (req.user.role === 'TASKER' && existing.assignedToId !== req.user.id) return res.status(403).json({ error: 'Access denied' });
    if (!['IN_PROGRESS', 'FLAGGED'].includes(existing.status)) {
      return res.status(400).json({ error: 'Only in-progress or flagged tasks can be submitted for review' });
    }

    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: { status: 'IN_REVIEW', submittedAt: new Date(), flagReason: null },
      include: { project: { select: { id: true, name: true } }, assignedTo: { select: { id: true, name: true, avatar: true } } },
    });
    await prisma.statusHistory.create({ data: { taskId: existing.id, fromStatus: existing.status, toStatus: 'IN_REVIEW', changedById: req.user.id } });
    res.json({ task });
  } catch (error) { next(error); }
};

// Admin reviews task (approve or flag)
const reviewTask = async (req, res, next) => {
  try {
    const existing = await prisma.task.findFirst({ where: { id: req.params.id, deletedAt: null } });
    if (!existing) return res.status(404).json({ error: 'Task not found' });

    const { action, reviewNote, qualityScore, timeScore, flagReason } = req.body;
    if (!['approve', 'flag'].includes(action)) return res.status(400).json({ error: 'Action must be approve or flag' });

    const data = {
      reviewedAt: new Date(),
      reviewNote: reviewNote || null,
      qualityScore: qualityScore ? parseInt(qualityScore) : null,
      timeScore: timeScore ? parseInt(timeScore) : null,
    };

    if (action === 'approve') {
      data.status = 'COMPLETED';
      data.completedAt = new Date();
      if (existing.startedAt) {
        data.actualMinutes = Math.round((Date.now() - new Date(existing.startedAt).getTime()) / 60000);
      }
    } else {
      data.status = 'FLAGGED';
      data.flagReason = flagReason || 'Review failed — requires revision';
      data.revisionCount = (existing.revisionCount || 0) + 1;
    }

    const task = await prisma.task.update({
      where: { id: req.params.id }, data,
      include: { project: { select: { id: true, name: true } }, assignedTo: { select: { id: true, name: true, avatar: true } } },
    });
    await prisma.statusHistory.create({ data: { taskId: existing.id, fromStatus: existing.status, toStatus: data.status, changedById: req.user.id } });

    // Notify tasker
    if (existing.assignedToId) {
      const msg = action === 'approve' ? `Task approved: ${existing.title}` : `Task flagged: ${existing.title} — ${data.flagReason}`;
      await prisma.notification.create({ data: { userId: existing.assignedToId, message: msg, type: action === 'approve' ? 'TASK_APPROVED' : 'TASK_FLAGGED' } });
    }

    res.json({ task });
  } catch (error) { next(error); }
};

const deleteTask = async (req, res, next) => {
  try {
    await prisma.task.update({ where: { id: req.params.id }, data: { deletedAt: new Date() } });
    res.json({ message: 'Task deleted' });
  } catch (error) { next(error); }
};

const getOverdueTasks = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const { skip, take, page: p, limit: l } = paginate(page, limit);
    const where = { deletedAt: null, status: { notIn: ['COMPLETED', 'SKIPPED'] }, dueDate: { lt: new Date() } };
    const [tasks, total] = await Promise.all([
      prisma.task.findMany({ where, skip, take, include: { project: { select: { id: true, name: true } }, assignedTo: { select: { id: true, name: true, avatar: true } } }, orderBy: { dueDate: 'asc' } }),
      prisma.task.count({ where }),
    ]);
    res.json(paginatedResponse(tasks, total, p, l));
  } catch (error) { next(error); }
};

const getProjectTasks = async (req, res, next) => {
  try {
    const { page, limit, status } = req.query;
    const { skip, take, page: p, limit: l } = paginate(page, limit);
    const where = { projectId: req.params.id, deletedAt: null };
    if (status) where.status = status;
    if (req.user.role === 'TASKER') where.assignedToId = req.user.id;
    const [tasks, total] = await Promise.all([
      prisma.task.findMany({ where, skip, take, include: { assignedTo: { select: { id: true, name: true, avatar: true } }, _count: { select: { comments: true } } }, orderBy: { createdAt: 'desc' } }),
      prisma.task.count({ where }),
    ]);
    res.json(paginatedResponse(tasks, total, p, l));
  } catch (error) { next(error); }
};

module.exports = { getTasks, createTask, getTask, updateTask, deleteTask, getOverdueTasks, getProjectTasks, submitForReview, reviewTask };
