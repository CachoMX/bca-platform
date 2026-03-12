const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  const mar11 = new Date(Date.UTC(2026, 2, 11));
  const mar12 = new Date(Date.UTC(2026, 2, 12));
  const logs = await p.employeeTimeLog.findMany({
    where: { logDate: { gte: mar11, lt: mar12 } },
    select: { idUser: true }
  });
  const logUserIds = logs.map(l => l.idUser);
  console.log('Users with logs today:', logUserIds);

  const users = await p.user.findMany({
    where: { idUser: { in: logUserIds } },
    select: { idUser: true, name: true, lastname: true, status: true, idRole: true }
  });
  console.log('\nUser details:');
  users.forEach(u => {
    let flag = '';
    if (u.status !== true) flag += ' INACTIVE';
    if (u.idRole === 1) flag += ' ADMIN';
    console.log('  id:', u.idUser, u.name, u.lastname, '| status:', u.status, '| role:', u.idRole, flag);
  });

  const activeNonAdmin = await p.user.findMany({
    where: { status: true, idRole: { not: 1 } },
    select: { idUser: true }
  });
  const activeIds = new Set(activeNonAdmin.map(u => u.idUser));
  const notInActive = logUserIds.filter(id => !activeIds.has(id));
  console.log('\nLog users NOT in active non-admin list:', notInActive);

  await p.$disconnect();
})();
