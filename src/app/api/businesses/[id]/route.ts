import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { updateBusinessStatusSchema } from '@/lib/validators';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const idBusiness = Number(id);
    if (isNaN(idBusiness)) {
      return NextResponse.json({ error: 'Invalid business ID' }, { status: 400 });
    }

    const business = await prisma.business.findUnique({
      where: { idBusiness },
    });

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    return NextResponse.json(business);
  } catch (error) {
    console.error('GET /api/businesses/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = (session.user as { role: number }).role;
    if (role !== 1 && role !== 2) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const idBusiness = Number(id);
    if (isNaN(idBusiness)) {
      return NextResponse.json({ error: 'Invalid business ID' }, { status: 400 });
    }

    const body = await request.json();
    const parsed = updateBusinessStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const business = await prisma.business.update({
      where: { idBusiness },
      data: { idStatus: parsed.data.status },
    });

    return NextResponse.json(business);
  } catch (error) {
    console.error('PATCH /api/businesses/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
