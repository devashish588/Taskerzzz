const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Taskerzz database...\n');

  // ── Users ──────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('admin123', 12);
  const taskerPassword = await bcrypt.hash('tasker123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@taskerzz.com' },
    update: { password: adminPassword, role: 'ADMIN', isActive: true },
    create: { name: 'Admin User', email: 'admin@taskerzz.com', password: adminPassword, role: 'ADMIN', dailyTarget: 15 },
  });

  const tasker = await prisma.user.upsert({
    where: { email: 'tasker@taskerzz.com' },
    update: { password: taskerPassword, role: 'TASKER', isActive: true },
    create: { name: 'Tasker User', email: 'tasker@taskerzz.com', password: taskerPassword, role: 'TASKER', dailyTarget: 12 },
  });

  const t1 = await prisma.user.upsert({
    where: { email: 'alice@taskerzz.com' },
    update: { password: taskerPassword, isActive: true },
    create: { name: 'Alice Johnson', email: 'alice@taskerzz.com', password: taskerPassword, role: 'TASKER', dailyTarget: 15 },
  });

  const t2 = await prisma.user.upsert({
    where: { email: 'bob@taskerzz.com' },
    update: { password: taskerPassword, isActive: true },
    create: { name: 'Bob Smith', email: 'bob@taskerzz.com', password: taskerPassword, role: 'TASKER', dailyTarget: 12 },
  });

  console.log('  ✓ Users created');

  // ── Projects ───────────────────────────────────────────
  const p1 = await prisma.project.upsert({
    where: { id: 'proj-1' },
    update: {},
    create: { id: 'proj-1', name: 'Website Redesign', description: 'Complete overhaul of the company website with modern design patterns and responsive layouts', status: 'ACTIVE', createdById: admin.id },
  });

  const p2 = await prisma.project.upsert({
    where: { id: 'proj-2' },
    update: {},
    create: { id: 'proj-2', name: 'Mobile App v2', description: 'New version of the mobile application with enhanced UX and performance improvements', status: 'ACTIVE', createdById: admin.id },
  });

  console.log('  ✓ Projects created');

  // ── Project Members ────────────────────────────────────
  const members = [
    [p1.id, tasker.id], [p1.id, t1.id], [p1.id, t2.id],
    [p2.id, tasker.id], [p2.id, t1.id], [p2.id, t2.id],
  ];

  for (const [pId, uId] of members) {
    await prisma.projectMember.upsert({
      where: { projectId_userId: { projectId: pId, userId: uId } },
      update: {},
      create: { projectId: pId, userId: uId },
    });
  }

  console.log('  ✓ Project members assigned');

  // ── Tasks ──────────────────────────────────────────────
  const today = new Date();
  const d = (offset) => { const dt = new Date(today); dt.setDate(dt.getDate() + offset); return dt; };
  const dAgo = (offset) => { const dt = new Date(today); dt.setDate(dt.getDate() - offset); return dt; };

  // Check if tasks already exist to avoid duplicates
  const existingTaskCount = await prisma.task.count();
  if (existingTaskCount > 0) {
    console.log(`  ⏭ ${existingTaskCount} tasks already exist, skipping task seed`);
  } else {
    const tasks = [
      // ASSIGNED — Pending tasks (assigned to tasker@taskerzz.com)
      { title: 'Design landing page hero section', category: 'Design', estimatedMinutes: 15, priority: 'HIGH', projectId: p1.id, assignedToId: tasker.id, dueDate: d(2) },
      { title: 'Create API documentation', category: 'Documentation', estimatedMinutes: 10, priority: 'MEDIUM', projectId: p2.id, assignedToId: tasker.id, dueDate: d(3) },
      { title: 'Update footer links', category: 'Frontend', estimatedMinutes: 5, priority: 'LOW', projectId: p1.id, assignedToId: t1.id, dueDate: d(1) },

      // IN_PROGRESS
      { title: 'Build responsive nav component', status: 'IN_PROGRESS', category: 'Frontend', estimatedMinutes: 15, priority: 'HIGH', projectId: p1.id, assignedToId: tasker.id, dueDate: d(1), startedAt: dAgo(0) },
      { title: 'Implement search API', status: 'IN_PROGRESS', category: 'Backend', estimatedMinutes: 10, priority: 'MEDIUM', projectId: p2.id, assignedToId: t1.id, dueDate: d(2), startedAt: dAgo(0) },

      // IN_REVIEW
      { title: 'Homepage mockup design', status: 'IN_REVIEW', category: 'Design', estimatedMinutes: 15, priority: 'HIGH', projectId: p1.id, assignedToId: tasker.id, dueDate: d(0), startedAt: dAgo(2), submittedAt: dAgo(0) },
      { title: 'Mobile menu implementation', status: 'IN_REVIEW', category: 'Frontend', estimatedMinutes: 10, priority: 'HIGH', projectId: p2.id, assignedToId: t2.id, dueDate: d(0), startedAt: dAgo(1), submittedAt: dAgo(0) },

      // COMPLETED
      { title: 'Setup project structure', status: 'COMPLETED', category: 'DevOps', estimatedMinutes: 10, actualMinutes: 8, priority: 'HIGH', projectId: p1.id, assignedToId: tasker.id, dueDate: dAgo(5), startedAt: dAgo(7), submittedAt: dAgo(6), completedAt: dAgo(5), reviewedAt: dAgo(5), qualityScore: 92, timeScore: 85 },
      { title: 'Database schema design', status: 'COMPLETED', category: 'Backend', estimatedMinutes: 15, actualMinutes: 12, priority: 'CRITICAL', projectId: p1.id, assignedToId: tasker.id, dueDate: dAgo(4), startedAt: dAgo(6), submittedAt: dAgo(5), completedAt: dAgo(4), reviewedAt: dAgo(4), qualityScore: 95, timeScore: 90 },
      { title: 'Auth flow implementation', status: 'COMPLETED', category: 'Backend', estimatedMinutes: 15, actualMinutes: 18, priority: 'CRITICAL', projectId: p1.id, assignedToId: t1.id, dueDate: dAgo(3), startedAt: dAgo(5), submittedAt: dAgo(4), completedAt: dAgo(3), reviewedAt: dAgo(3), qualityScore: 78, timeScore: 65 },

      // FLAGGED (overdue/rejected)
      { title: 'Payment gateway integration', status: 'FLAGGED', category: 'Backend', estimatedMinutes: 15, priority: 'CRITICAL', projectId: p2.id, assignedToId: tasker.id, dueDate: dAgo(2), startedAt: dAgo(5), submittedAt: dAgo(3), reviewedAt: dAgo(1), flagReason: 'Missing error handling for failed transactions. Please add retry logic.', revisionCount: 1, qualityScore: 35, timeScore: 50 },

      // SKIPPED
      { title: 'Legacy data migration script', status: 'SKIPPED', category: 'Backend', estimatedMinutes: 15, priority: 'LOW', projectId: p2.id, assignedToId: t2.id, dueDate: dAgo(1) },
    ];

    for (const t of tasks) {
      await prisma.task.create({
        data: { ...t, status: t.status || 'ASSIGNED', createdById: admin.id },
      });
    }

    console.log('  ✓ Tasks created (12 tasks across statuses)');
  }

  console.log('\n🎉 Seed completed!');
  console.log('  ┌─────────────────────────────────────┐');
  console.log('  │  Admin:  admin@taskerzz.com/admin123 │');
  console.log('  │  Tasker: tasker@taskerzz.com/tasker123│');
  console.log('  └─────────────────────────────────────┘');
}

main()
  .catch((e) => { console.error('Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
