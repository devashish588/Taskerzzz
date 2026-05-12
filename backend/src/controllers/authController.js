const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const prisma = require('../utils/prisma');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { sendInviteEmail, sendPasswordResetEmail } = require('../utils/email');

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  path: '/',
};

// Register — first user becomes ADMIN
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Check if this is the first user
    const userCount = await prisma.user.count();
    const role = userCount === 0 ? 'ADMIN' : 'TASKER';

    // Only allow registration for first user (admin) or via invite
    if (userCount > 0) {
      return res.status(403).json({ error: 'Registration is invite-only. Contact your admin.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, role },
      select: { id: true, name: true, email: true, role: true, avatar: true, createdAt: true },
    });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Store refresh token in DB
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.cookie('accessToken', accessToken, { ...COOKIE_OPTIONS, maxAge: 15 * 60 * 1000 });
    res.cookie('refreshToken', refreshToken, { ...COOKIE_OPTIONS, maxAge: 7 * 24 * 60 * 60 * 1000 });

    res.status(201).json({ user, accessToken });
  } catch (error) {
    next(error);
  }
};

// Login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.cookie('accessToken', accessToken, { ...COOKIE_OPTIONS, maxAge: 15 * 60 * 1000 });
    res.cookie('refreshToken', refreshToken, { ...COOKIE_OPTIONS, maxAge: 7 * 24 * 60 * 60 * 1000 });

    const { password: _, ...userData } = user;
    res.json({ user: userData, accessToken });
  } catch (error) {
    next(error);
  }
};

// Logout
const logout = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) {
      await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
    }

    res.clearCookie('accessToken', COOKIE_OPTIONS);
    res.clearCookie('refreshToken', COOKIE_OPTIONS);
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

// Refresh token
const refresh = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }

    const decoded = verifyRefreshToken(refreshToken);

    // Check token exists in DB
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, name: true, email: true, role: true, isActive: true, avatar: true },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'User not found or deactivated' });
    }

    // Rotate refresh token
    await prisma.refreshToken.delete({ where: { id: storedToken.id } });

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    await prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.cookie('accessToken', newAccessToken, { ...COOKIE_OPTIONS, maxAge: 15 * 60 * 1000 });
    res.cookie('refreshToken', newRefreshToken, { ...COOKIE_OPTIONS, maxAge: 7 * 24 * 60 * 60 * 1000 });

    res.json({ user, accessToken: newAccessToken });
  } catch (error) {
    next(error);
  }
};

// Forgot password
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    // Always respond success (don't reveal if email exists)
    if (!user) {
      return res.json({ message: 'If the email exists, a reset link has been sent' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    await prisma.passwordResetToken.create({
      data: {
        email,
        token,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    });

    await sendPasswordResetEmail(email, token);
    res.json({ message: 'If the email exists, a reset link has been sent' });
  } catch (error) {
    next(error);
  }
};

// Reset password
const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken || resetToken.used || resetToken.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    await prisma.user.update({
      where: { email: resetToken.email },
      data: { password: hashedPassword },
    });

    await prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { used: true },
    });

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    next(error);
  }
};

// Invite tasker (Admin only)
const invite = async (req, res, next) => {
  try {
    const { email } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    await prisma.inviteToken.create({
      data: {
        email,
        token,
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours
      },
    });

    await sendInviteEmail(email, token);
    res.json({ message: `Invite sent to ${email}`, token });
  } catch (error) {
    next(error);
  }
};

// Accept invite
const acceptInvite = async (req, res, next) => {
  try {
    const { token, name, password } = req.body;

    const inviteToken = await prisma.inviteToken.findUnique({
      where: { token },
    });

    if (!inviteToken || inviteToken.used || inviteToken.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Invalid or expired invite token' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        name,
        email: inviteToken.email,
        password: hashedPassword,
        role: inviteToken.role,
      },
      select: { id: true, name: true, email: true, role: true, avatar: true, createdAt: true },
    });

    await prisma.inviteToken.update({
      where: { id: inviteToken.id },
      data: { used: true },
    });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.cookie('accessToken', accessToken, { ...COOKIE_OPTIONS, maxAge: 15 * 60 * 1000 });
    res.cookie('refreshToken', refreshToken, { ...COOKIE_OPTIONS, maxAge: 7 * 24 * 60 * 60 * 1000 });

    res.status(201).json({ user, accessToken });
  } catch (error) {
    next(error);
  }
};

// Get current user
const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, role: true, avatar: true, isActive: true, createdAt: true },
    });
    res.json({ user });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register, login, logout, refresh,
  forgotPassword, resetPassword,
  invite, acceptInvite, getMe,
};
