const { verifyAccessToken } = require('../utils/jwt');
const prisma = require('../utils/prisma');

const authenticate = async (req, res, next) => {
  try {
    const token = req.cookies?.accessToken || 
                  req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, name: true, email: true, role: true, isActive: true, avatar: true },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'User not found or deactivated' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

const taskerOrAdmin = (req, res, next) => {
  if (!req.user || !['ADMIN', 'TASKER'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Access denied' });
  }
  next();
};

module.exports = { authenticate, adminOnly, taskerOrAdmin };
