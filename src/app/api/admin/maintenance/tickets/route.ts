import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status');
    const priorityFilter = searchParams.get('priority');
    const computerIdFilter = searchParams.get('computerId');
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') ?? '50', 10)));

    const where = {
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(priorityFilter ? { priority: priorityFilter } : {}),
      ...(computerIdFilter ? { computerId: parseInt(computerIdFilter, 10) } : {}),
    };

    const [tickets, total] = await Promise.all([
      prisma.maintenanceTicket.findMany({
        where,
        include: {
          computer: { select: { computerName: true } },
          reportedBy: { select: { name: true, lastname: true } },
          assignedTo: { select: { idUser: true, name: true, lastname: true } },
        },
        orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.maintenanceTicket.count({ where }),
    ]);

    const result = tickets.map((t) => ({
      id: t.id,
      computerId: t.computerId,
      computerName: t.computer.computerName,
      reportedByUserId: t.reportedByUserId,
      reportedByName: `${t.reportedBy.name ?? ''} ${t.reportedBy.lastname ?? ''}`.trim(),
      subject: t.subject,
      description: t.description,
      priority: t.priority,
      status: t.status,
      resolvedDate: t.resolvedDate,
      resolutionNotes: t.resolutionNotes,
      assignedToUserId: t.assignedToUserId,
      assignedToName: t.assignedTo
        ? `${t.assignedTo.name ?? ''} ${t.assignedTo.lastname ?? ''}`.trim()
        : null,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }));

    return NextResponse.json({
      data: result,
      meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (error) {
    console.error('GET /api/admin/maintenance/tickets error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
