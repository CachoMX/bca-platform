import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const closers = await prisma.user.findMany({
      where: {
        AND: [
          { OR: [{ status: null }, { status: false }] },
          { OR: [{ idRole: 1 }, { idRole: 2 }] },
        ],
      },
      select: {
        idUser: true,
        name: true,
        lastname: true,
      },
      orderBy: { name: 'asc' },
    });

    // Transform to match frontend CloserUser interface (userId + full name)
    const data = closers.map((c) => ({
      userId: c.idUser,
      name: `${c.name ?? ''} ${c.lastname ?? ''}`.trim(),
    }));

    return NextResponse.json(data);
  } catch (error) {
    console.error('GET /api/calls/closers error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
