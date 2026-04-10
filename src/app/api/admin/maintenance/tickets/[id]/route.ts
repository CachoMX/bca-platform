import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { updateTicketSchema } from '@/lib/validators';

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
    const ticketId = parseInt(id, 10);
    if (isNaN(ticketId)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }

    const body = await request.json();
    const parsed = updateTicketSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { status, assignedToUserId, resolutionNotes, resolvedDate } = parsed.data;

    const ticket = await prisma.maintenanceTicket.update({
      where: { id: ticketId },
      data: {
        ...(status !== undefined ? { status } : {}),
        ...(assignedToUserId !== undefined ? { assignedToUserId: assignedToUserId ?? null } : {}),
        ...(resolutionNotes !== undefined ? { resolutionNotes } : {}),
        ...(resolvedDate !== undefined
          ? { resolvedDate: resolvedDate ? new Date(resolvedDate) : null }
          : {}),
      },
    });

    return NextResponse.json(ticket);
  } catch (error) {
    console.error('PATCH /api/admin/maintenance/tickets/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
