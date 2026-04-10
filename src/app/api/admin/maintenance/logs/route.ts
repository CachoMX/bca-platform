import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createMaintenanceLogSchema } from '@/lib/validators';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const computerId = searchParams.get('computerId');
    const type = searchParams.get('type');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') ?? '50', 10)));

    const where = {
      ...(computerId ? { computerId: parseInt(computerId, 10) } : {}),
      ...(type ? { maintenanceType: type } : {}),
      ...(dateFrom || dateTo
        ? {
            performedDate: {
              ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
              ...(dateTo ? { lte: new Date(dateTo + 'T23:59:59') } : {}),
            },
          }
        : {}),
    };

    const [logs, total] = await Promise.all([
      prisma.maintenanceLog.findMany({
        where,
        include: {
          computer: { select: { computerName: true } },
          technician: { select: { name: true, lastname: true } },
          relatedTicket: { select: { id: true, subject: true } },
        },
        orderBy: { performedDate: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.maintenanceLog.count({ where }),
    ]);

    const result = logs.map((l) => ({
      id: l.id,
      computerId: l.computerId,
      computerName: l.computer.computerName,
      maintenanceType: l.maintenanceType,
      performedDate: l.performedDate,
      technicianId: l.technicianId,
      technicianName: `${l.technician.name ?? ''} ${l.technician.lastname ?? ''}`.trim(),
      durationMinutes: l.durationMinutes,
      toolsUsed: l.toolsUsed ? (JSON.parse(l.toolsUsed) as string[]) : [],
      issuesFound: l.issuesFound,
      actionsTaken: l.actionsTaken,
      notes: l.notes,
      relatedTicketId: l.relatedTicketId,
      relatedTicket: l.relatedTicket,
      createdAt: l.createdAt,
    }));

    return NextResponse.json({
      data: result,
      meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (error) {
    console.error('GET /api/admin/maintenance/logs error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const technicianId = (session.user as { userId: number }).userId;

    const body = await request.json();
    const parsed = createMaintenanceLogSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const {
      computerId,
      maintenanceType,
      performedDate,
      durationMinutes,
      toolsUsed,
      issuesFound,
      actionsTaken,
      notes,
      relatedTicketId,
    } = parsed.data;

    const log = await prisma.maintenanceLog.create({
      data: {
        computerId,
        maintenanceType,
        performedDate: new Date(performedDate),
        technicianId,
        durationMinutes: durationMinutes ?? null,
        toolsUsed: toolsUsed && toolsUsed.length > 0 ? JSON.stringify(toolsUsed) : null,
        issuesFound: issuesFound ?? null,
        actionsTaken: actionsTaken ?? null,
        notes: notes ?? null,
        relatedTicketId: relatedTicketId ?? null,
      },
    });

    // If linked to a ticket, resolve it
    if (relatedTicketId) {
      await prisma.maintenanceTicket.update({
        where: { id: relatedTicketId },
        data: { status: 'resolved', resolvedDate: new Date() },
      });
    }

    return NextResponse.json(log, { status: 201 });
  } catch (error) {
    console.error('POST /api/admin/maintenance/logs error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
