import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { updateComputerSchema } from '@/lib/validators';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const computerId = parseInt(id, 10);
    if (isNaN(computerId)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }

    const body = await request.json();
    const parsed = updateComputerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { assignedUserIds, ...computerFields } = parsed.data;

    const computer = await prisma.$transaction(async (tx) => {
      const c = await tx.computer.update({
        where: { id: computerId },
        data: computerFields,
      });

      // Only replace assignments when assignedUserIds is explicitly provided
      if (assignedUserIds !== undefined) {
        await tx.computerAssignment.deleteMany({ where: { computerId } });
        if (assignedUserIds.length > 0) {
          await tx.computerAssignment.createMany({
            data: assignedUserIds.map((userId) => ({ computerId, userId })),
            skipDuplicates: true,
          });
        }
      }

      return c;
    });

    return NextResponse.json(computer);
  } catch (error) {
    console.error('PATCH /api/admin/maintenance/computers/[id] error:', error);
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

    const { id } = await params;
    const computerId = parseInt(id, 10);
    if (isNaN(computerId)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }

    // Soft delete — set status to 'retired'
    const computer = await prisma.computer.update({
      where: { id: computerId },
      data: { status: 'retired' },
    });

    return NextResponse.json(computer);
  } catch (error) {
    console.error('DELETE /api/admin/maintenance/computers/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
