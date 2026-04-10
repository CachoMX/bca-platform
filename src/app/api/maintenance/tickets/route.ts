import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createTicketSchema } from '@/lib/validators';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as { userId: number }).userId;
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status');

    const tickets = await prisma.maintenanceTicket.findMany({
      where: {
        reportedByUserId: userId,
        ...(statusFilter ? { status: statusFilter } : {}),
      },
      include: {
        computer: { select: { computerName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const result = tickets.map((t) => ({
      id: t.id,
      computerName: t.computer.computerName,
      subject: t.subject,
      description: t.description,
      priority: t.priority,
      status: t.status,
      resolvedDate: t.resolvedDate,
      resolutionNotes: t.resolutionNotes,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('GET /api/maintenance/tickets error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as { userId: number }).userId;

    const body = await request.json();
    const parsed = createTicketSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { computerId, subject, description, priority } = parsed.data;

    // Verify the computer is assigned to this user via junction table
    const assignment = await prisma.computerAssignment.findFirst({
      where: { computerId, userId },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: 'Computer not found or not assigned to you' },
        { status: 403 },
      );
    }

    const ticket = await prisma.maintenanceTicket.create({
      data: {
        computerId,
        reportedByUserId: userId,
        subject,
        description,
        priority,
        status: 'open',
      },
    });

    return NextResponse.json(ticket, { status: 201 });
  } catch (error) {
    console.error('POST /api/maintenance/tickets error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
