const prisma = require('../utils/prisma');
const { paginate, paginatedResponse } = require('../utils/pagination');

const getProjects = async (req, res, next) => {
  try {
    const { page, limit, status, search } = req.query;
    const { skip, take, page: p, limit: l } = paginate(page, limit);
    const where = { deletedAt: null };
    if (status) where.status = status;
    if (search) where.OR = [{ name: { contains: search, mode: 'insensitive' } }];
    if (req.user.role === 'TASKER') where.members = { some: { userId: req.user.id } };

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where, skip, take,
        include: {
          createdBy: { select: { id: true, name: true, avatar: true } },
          _count: { select: { members: true, tasks: true } },
          tasks: { where: { deletedAt: null }, select: { status: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.project.count({ where }),
    ]);

    const data = projects.map((p) => {
      const total = p.tasks.length;
      const done = p.tasks.filter((t) => t.status === 'DONE').length;
      const { tasks, ...rest } = p;
      return { ...rest, progress: total > 0 ? Math.round((done / total) * 100) : 0, taskStats: { total, done } };
    });

    res.json(paginatedResponse(data, total, p, l));
  } catch (error) { next(error); }
};

const createProject = async (req, res, next) => {
  try {
    const { name, description, status, startDate, deadline } = req.body;
    const project = await prisma.project.create({
      data: { name, description, status: status || 'ACTIVE', startDate: startDate ? new Date(startDate) : null, deadline: deadline ? new Date(deadline) : null, createdById: req.user.id },
      include: { createdBy: { select: { id: true, name: true, avatar: true } }, _count: { select: { members: true, tasks: true } } },
    });
    res.status(201).json({ project });
  } catch (error) { next(error); }
};

const getProject = async (req, res, next) => {
  try {
    const project = await prisma.project.findFirst({
      where: { id: req.params.id, deletedAt: null },
      include: {
        createdBy: { select: { id: true, name: true, avatar: true } },
        members: { include: { user: { select: { id: true, name: true, email: true, avatar: true, role: true } } } },
        tasks: { where: { deletedAt: null }, include: { assignedTo: { select: { id: true, name: true, avatar: true } } }, orderBy: { createdAt: 'desc' } },
        _count: { select: { members: true, tasks: true } },
      },
    });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (req.user.role === 'TASKER' && !project.members.some((m) => m.userId === req.user.id)) return res.status(403).json({ error: 'Access denied' });
    const total = project.tasks.length;
    const done = project.tasks.filter((t) => t.status === 'DONE').length;
    res.json({ project: { ...project, progress: total > 0 ? Math.round((done / total) * 100) : 0, taskStats: { total, done } } });
  } catch (error) { next(error); }
};

const updateProject = async (req, res, next) => {
  try {
    const { name, description, status, startDate, deadline } = req.body;
    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: { ...(name && { name }), ...(description !== undefined && { description }), ...(status && { status }), ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }), ...(deadline !== undefined && { deadline: deadline ? new Date(deadline) : null }) },
      include: { createdBy: { select: { id: true, name: true } }, _count: { select: { members: true, tasks: true } } },
    });
    res.json({ project });
  } catch (error) { next(error); }
};

const deleteProject = async (req, res, next) => {
  try {
    await prisma.project.update({ where: { id: req.params.id }, data: { deletedAt: new Date() } });
    res.json({ message: 'Project deleted' });
  } catch (error) { next(error); }
};

const addMember = async (req, res, next) => {
  try {
    const member = await prisma.projectMember.create({
      data: { projectId: req.params.id, userId: req.body.userId },
      include: { user: { select: { id: true, name: true, email: true, avatar: true, role: true } } },
    });
    await prisma.notification.create({ data: { userId: req.body.userId, message: 'You have been added to a project', type: 'PROJECT_ADDED' } });
    res.status(201).json({ member });
  } catch (error) { next(error); }
};

const removeMember = async (req, res, next) => {
  try {
    await prisma.projectMember.deleteMany({ where: { projectId: req.params.id, userId: req.params.userId } });
    res.json({ message: 'Member removed' });
  } catch (error) { next(error); }
};

module.exports = { getProjects, createProject, getProject, updateProject, deleteProject, addMember, removeMember };
