import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = (session.user as { role: number }).role;
    if (role !== 1 && role !== 2) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const employees = await prisma.user.findMany({
      where: {
        OR: [{ status: null }, { status: false }],
      },
      select: {
        idUser: true,
        name: true,
        lastname: true,
        idRole: true,
        isPartTime: true,
      },
      orderBy: [{ name: 'asc' }, { lastname: 'asc' }],
    });

    const data = employees.map((emp) => ({
      userId: emp.idUser,
      name: `${emp.name ?? ''} ${emp.lastname ?? ''}`.trim(),
      role: emp.idRole,
      isPartTime: emp.isPartTime,
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Admin time employees error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
