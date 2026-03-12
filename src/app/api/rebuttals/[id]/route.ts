import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { rebuttalSchema } from '@/lib/validators';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = (session.user as { role: number }).role;
    if (role !== 1) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const idRebuttal = Number(id);
    if (isNaN(idRebuttal)) {
      return NextResponse.json({ error: 'Invalid rebuttal ID' }, { status: 400 });
    }

    const body = await request.json();
    const parsed = rebuttalSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const rebuttal = await prisma.rebuttal.update({
      where: { idRebuttal },
      data: {
        title: parsed.data.title,
        content: parsed.data.content,
      },
    });

    return NextResponse.json(rebuttal);
  } catch (error) {
    console.error('PUT /api/rebuttals/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = (session.user as { role: number }).role;
    if (role !== 1) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const idRebuttal = Number(id);
    if (isNaN(idRebuttal)) {
      return NextResponse.json({ error: 'Invalid rebuttal ID' }, { status: 400 });
    }

    await prisma.rebuttal.delete({ where: { idRebuttal } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/rebuttals/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
