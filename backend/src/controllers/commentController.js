const prisma = require('../utils/prisma');

const getComments = async (req, res, next) => {
  try {
    const comments = await prisma.comment.findMany({
      where: { taskId: req.params.id },
      include: { user: { select: { id: true, name: true, avatar: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ comments });
  } catch (error) { next(error); }
};

const createComment = async (req, res, next) => {
  try {
    const task = await prisma.task.findFirst({ where: { id: req.params.id, deletedAt: null } });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    if (req.user.role === 'TASKER' && task.assignedToId !== req.user.id) return res.status(403).json({ error: 'Access denied' });

    const comment = await prisma.comment.create({
      data: { taskId: req.params.id, userId: req.user.id, content: req.body.content },
      include: { user: { select: { id: true, name: true, avatar: true } } },
    });
    res.status(201).json({ comment });
  } catch (error) { next(error); }
};

const deleteComment = async (req, res, next) => {
  try {
    const comment = await prisma.comment.findUnique({ where: { id: req.params.id } });
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    if (req.user.role !== 'ADMIN' && comment.userId !== req.user.id) return res.status(403).json({ error: 'Access denied' });
    await prisma.comment.delete({ where: { id: req.params.id } });
    res.json({ message: 'Comment deleted' });
  } catch (error) { next(error); }
};

module.exports = { getComments, createComment, deleteComment };
