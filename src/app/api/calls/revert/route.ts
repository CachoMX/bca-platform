import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const idBusiness = body?.idBusiness;
    const idCall = body?.idCall;

    if (!idBusiness || typeof idBusiness !== 'number') {
      return NextResponse.json(
        { error: 'idBusiness is required and must be a number' },
        { status: 400 },
      );
    }

    await prisma.$transaction(async (tx) => {
      // Delete the last logged call if provided
      if (idCall && typeof idCall === 'number') {
        await tx.call.delete({ where: { idCall } });
      }

      // Revert business back to available
      await tx.business.update({
        where: { idBusiness },
        data: { idStatus: 3 },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('POST /api/calls/revert error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
