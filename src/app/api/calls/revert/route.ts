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

    if (!idBusiness || typeof idBusiness !== 'number') {
      return NextResponse.json(
        { error: 'idBusiness is required and must be a number' },
        { status: 400 },
      );
    }

    // Only revert if the business is currently locked (idStatus = 1)
    const business = await prisma.business.findUnique({ where: { idBusiness } });
    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }
    if (business.idStatus !== 1) {
      return NextResponse.json({ error: 'Business is not currently locked' }, { status: 400 });
    }

    await prisma.business.update({
      where: { idBusiness },
      data: { idStatus: 3 },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('POST /api/calls/revert error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
