import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
const computers = await p.computer.findMany({
  include: { assignedUser: { select: { idUser: true, name: true, lastname: true, email: true } } }
});
console.log(JSON.stringify(computers, null, 2));
await p.$disconnect();
