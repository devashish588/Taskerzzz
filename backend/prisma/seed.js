const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Taskerzz database...');

  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@taskerzz.com' },
    update: {},
    create: { name: 'Admin User', email: 'admin@taskerzz.com', password: adminPassword, role: 'ADMIN', dailyTarget: 15 },
  });

  const taskerPassword = await bcrypt.hash('tasker123', 12);
  const t1 = await prisma.user.upsert({
    where: { email: 'alice@taskerzz.com' },
    update: {},
    create: { name: 'Alice Johnson', email: 'alice@taskerzz.com', password: taskerPassword, role: 'TASKER', dailyTarget: 15 },
  });
  const t2 = await prisma.user.upsert({
    where: { email: 'bob@taskerzz.com' },
    update: {},
    create: { name: 'Bob Smith', email: 'bob@taskerzz.com', password: taskerPassword, role: 'TASKER', dailyTarget: 12 },
  });
  const t3 = await prisma.user.upsert({
    where: { email: 'carol@taskerzz.com' },
    update: {},
    create: { name: 'Carol Williams', email: 'carol@taskerzz.com', password: taskerPassword, role: 'TASKER', dailyTarget: 10 },
  });

  // Projects
  const p1 = await prisma.project.upsert({
    where: { id: 'proj-1' }, update: {},
    create: { id: 'proj-1', name: 'Website Redesign', description: 'Complete overhaul of the company website', status: 'ACTIVE', createdById: admin.id },
  });
  const p2 = await prisma.project.upsert({
    where: { id: 'proj-2' }, update: {},
    create: { id: 'proj-2', name: 'Mobile App v2', description: 'New version of the mobile application', status: 'ACTIVE', createdById: admin.id },
  });
  const p3 = await prisma.project.upsert({
    where: { id: 'proj-3' }, update: {},
    create: { id: 'proj-3', name: 'API Integration', description: 'Third-party API integration project', status: 'ACTIVE', createdById: admin.id },
  });

  // Members
  for (const [pId, uId] of [[p1.id, t1.id], [p1.id, t2.id], [p2.id, t2.id], [p2.id, t3.id], [p3.id, t1.id], [p3.id, t3.id]]) {
    await prisma.projectMember.upsert({ where: { projectId_userId: { projectId: pId, userId: uId } }, update: {}, create: { projectId: pId, userId: uId } });
  }

  const today = new Date();
  const d = (offset) => { const dt = new Date(today); dt.setDate(dt.getDate() + offset); return dt; };
  const dAgo = (offset) => { const dt = new Date(today); dt.setDate(dt.getDate() - offset); return dt; };

  const tasks = [
    // ASSIGNED (waiting to be started)
    { title: 'Design landing page hero section', category: 'Design', estimatedMinutes: 15, priority: 'HIGH', projectId: p1.id, assignedToId: t1.id, dueDate: d(1) },
    { title: 'Create API documentation', category: 'Documentation', estimatedMinutes: 10, priority: 'MEDIUM', projectId: p3.id, assignedToId: t1.id, dueDate: d(2) },
    { title: 'Update footer links', category: 'Frontend', estimatedMinutes: 5, priority: 'LOW', projectId: p1.id, assignedToId: t2.id, dueDate: d(1) },
    { title: 'Configure CI/CD pipeline', category: 'DevOps', estimatedMinutes: 15, priority: 'HIGH', projectId: p2.id, assignedToId: t2.id, dueDate: d(3) },
    { title: 'Design settings page', category: 'Design', estimatedMinutes: 10, priority: 'MEDIUM', projectId: p2.id, assignedToId: t3.id, dueDate: d(2) },
    { title: 'Write unit tests for auth', category: 'Testing', estimatedMinutes: 15, priority: 'HIGH', projectId: p3.id, assignedToId: t3.id, dueDate: d(1) },
    { title: 'Review PR #47', category: 'Code Review', estimatedMinutes: 5, priority: 'LOW', projectId: p1.id, assignedToId: t1.id, dueDate: d(0) },

    // IN_PROGRESS
    { title: 'Build responsive nav component', status: 'IN_PROGRESS', category: 'Frontend', estimatedMinutes: 15, priority: 'HIGH', projectId: p1.id, assignedToId: t1.id, dueDate: d(0), startedAt: dAgo(0) },
    { title: 'Implement search API', status: 'IN_PROGRESS', category: 'Backend', estimatedMinutes: 10, priority: 'MEDIUM', projectId: p3.id, assignedToId: t1.id, dueDate: d(1), startedAt: dAgo(0) },
    { title: 'Setup database indexes', status: 'IN_PROGRESS', category: 'Backend', estimatedMinutes: 10, priority: 'HIGH', projectId: p2.id, assignedToId: t2.id, dueDate: d(0), startedAt: dAgo(0) },
    { title: 'Fix login redirect bug', status: 'IN_PROGRESS', category: 'Bugfix', estimatedMinutes: 5, priority: 'CRITICAL', projectId: p1.id, assignedToId: t2.id, dueDate: d(0), startedAt: dAgo(0) },
    { title: 'Create onboarding flow', status: 'IN_PROGRESS', category: 'Frontend', estimatedMinutes: 15, priority: 'MEDIUM', projectId: p2.id, assignedToId: t3.id, dueDate: d(1), startedAt: dAgo(1) },

    // IN_REVIEW (submitted by tasker, waiting admin)
    { title: 'Homepage mockup design', status: 'IN_REVIEW', category: 'Design', estimatedMinutes: 15, priority: 'HIGH', projectId: p1.id, assignedToId: t1.id, dueDate: d(0), startedAt: dAgo(2), submittedAt: dAgo(0) },
    { title: 'User profile API endpoint', status: 'IN_REVIEW', category: 'Backend', estimatedMinutes: 10, priority: 'MEDIUM', projectId: p3.id, assignedToId: t1.id, dueDate: d(1), startedAt: dAgo(1), submittedAt: dAgo(0) },
    { title: 'Mobile menu implementation', status: 'IN_REVIEW', category: 'Frontend', estimatedMinutes: 10, priority: 'HIGH', projectId: p2.id, assignedToId: t2.id, dueDate: d(0), startedAt: dAgo(1), submittedAt: dAgo(0) },
    { title: 'Error handling middleware', status: 'IN_REVIEW', category: 'Backend', estimatedMinutes: 5, priority: 'MEDIUM', projectId: p3.id, assignedToId: t3.id, dueDate: d(2), startedAt: dAgo(2), submittedAt: dAgo(0) },

    // COMPLETED (admin approved)
    { title: 'Setup project structure', status: 'COMPLETED', category: 'DevOps', estimatedMinutes: 10, actualMinutes: 8, priority: 'HIGH', projectId: p1.id, assignedToId: t1.id, dueDate: dAgo(5), startedAt: dAgo(7), submittedAt: dAgo(6), completedAt: dAgo(5), reviewedAt: dAgo(5), qualityScore: 92, timeScore: 85 },
    { title: 'Database schema design', status: 'COMPLETED', category: 'Backend', estimatedMinutes: 15, actualMinutes: 12, priority: 'CRITICAL', projectId: p1.id, assignedToId: t1.id, dueDate: dAgo(4), startedAt: dAgo(6), submittedAt: dAgo(5), completedAt: dAgo(4), reviewedAt: dAgo(4), qualityScore: 95, timeScore: 90 },
    { title: 'Auth flow implementation', status: 'COMPLETED', category: 'Backend', estimatedMinutes: 15, actualMinutes: 18, priority: 'CRITICAL', projectId: p1.id, assignedToId: t2.id, dueDate: dAgo(3), startedAt: dAgo(5), submittedAt: dAgo(4), completedAt: dAgo(3), reviewedAt: dAgo(3), qualityScore: 78, timeScore: 65 },
    { title: 'Button component library', status: 'COMPLETED', category: 'Frontend', estimatedMinutes: 10, actualMinutes: 10, priority: 'MEDIUM', projectId: p2.id, assignedToId: t2.id, dueDate: dAgo(2), startedAt: dAgo(3), submittedAt: dAgo(3), completedAt: dAgo(2), reviewedAt: dAgo(2), qualityScore: 88, timeScore: 100 },
    { title: 'API rate limiting setup', status: 'COMPLETED', category: 'Backend', estimatedMinutes: 5, actualMinutes: 4, priority: 'LOW', projectId: p3.id, assignedToId: t3.id, dueDate: dAgo(1), startedAt: dAgo(2), submittedAt: dAgo(2), completedAt: dAgo(1), reviewedAt: dAgo(1), qualityScore: 90, timeScore: 95 },
    { title: 'Responsive grid system', status: 'COMPLETED', category: 'Frontend', estimatedMinutes: 10, actualMinutes: 9, priority: 'HIGH', projectId: p2.id, assignedToId: t3.id, dueDate: dAgo(3), startedAt: dAgo(5), submittedAt: dAgo(4), completedAt: dAgo(3), reviewedAt: dAgo(3), qualityScore: 85, timeScore: 88 },
    { title: 'Input validation helpers', status: 'COMPLETED', category: 'Backend', estimatedMinutes: 5, actualMinutes: 6, priority: 'MEDIUM', projectId: p3.id, assignedToId: t1.id, dueDate: dAgo(2), startedAt: dAgo(3), submittedAt: dAgo(3), completedAt: dAgo(2), reviewedAt: dAgo(2), qualityScore: 82, timeScore: 70 },

    // FLAGGED (admin rejected)
    { title: 'Payment gateway integration', status: 'FLAGGED', category: 'Backend', estimatedMinutes: 15, priority: 'CRITICAL', projectId: p3.id, assignedToId: t2.id, dueDate: d(0), startedAt: dAgo(3), submittedAt: dAgo(1), reviewedAt: dAgo(0), flagReason: 'Missing error handling for failed transactions. Please add retry logic and user-friendly error messages.', revisionCount: 1, qualityScore: 35, timeScore: 50 },
    { title: 'User avatar upload', status: 'FLAGGED', category: 'Frontend', estimatedMinutes: 10, priority: 'MEDIUM', projectId: p2.id, assignedToId: t3.id, dueDate: d(1), startedAt: dAgo(2), submittedAt: dAgo(1), reviewedAt: dAgo(0), flagReason: 'Image compression not implemented. File size exceeds 5MB limit.', revisionCount: 1, qualityScore: 45, timeScore: 60 },
    { title: 'Dashboard chart rendering', status: 'FLAGGED', category: 'Frontend', estimatedMinutes: 10, priority: 'HIGH', projectId: p1.id, assignedToId: t1.id, dueDate: d(0), startedAt: dAgo(2), submittedAt: dAgo(1), reviewedAt: dAgo(0), flagReason: 'Charts not responsive on tablet. Fix breakpoint handling.', revisionCount: 2, qualityScore: 55, timeScore: 70 },

    // SKIPPED
    { title: 'Legacy data migration script', status: 'SKIPPED', category: 'Backend', estimatedMinutes: 15, priority: 'LOW', projectId: p3.id, assignedToId: t1.id, dueDate: dAgo(1) },
    { title: 'Browser compatibility testing', status: 'SKIPPED', category: 'Testing', estimatedMinutes: 10, priority: 'LOW', projectId: p1.id, assignedToId: t2.id, dueDate: dAgo(2) },
    { title: 'Accessibility audit', status: 'SKIPPED', category: 'Testing', estimatedMinutes: 15, priority: 'MEDIUM', projectId: p2.id, assignedToId: t3.id, dueDate: dAgo(1) },
  ];

  for (const t of tasks) {
    await prisma.task.create({ data: { ...t, status: t.status || 'ASSIGNED', createdById: admin.id } });
  }

  console.log('Seed completed.');
  console.log('  Admin: admin@taskerzz.com / admin123');
  console.log('  Taskers: alice@ / bob@ / carol@taskerzz.com / tasker123');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
