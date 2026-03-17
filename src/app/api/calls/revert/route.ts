import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as { userId: number }).userId;
    const role = (session.user as { role: number }).role;

    const body = await request.json();
    const idBusiness = body?.idBusiness;
    const idCall = body?.idCall;

    if (!idBusiness || typeof idBusiness !== 'number' || !idCall || typeof idCall !== 'number') {
      return NextResponse.json(
        { error: 'idBusiness and idCall are required and must be numbers' },
        { status: 400 },
      );
    }

    // Verify ownership: the call must belong to this user (admins can revert any)
    if (role !== 1) {
      const call = await prisma.call.findUnique({ where: { idCall }, select: { idUser: true } });
      if (!call || call.idUser !== userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    await prisma.$transaction(async (tx) => {
      // Delete the call record
      await tx.call.delete({ where: { idCall } });

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
