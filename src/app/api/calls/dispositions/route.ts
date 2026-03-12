import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dispositions = await prisma.disposition.findMany({
      orderBy: { idDisposition: 'asc' },
    });

    return NextResponse.json(dispositions);
  } catch (error) {
    console.error('GET /api/calls/dispositions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
