import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createComputerSchema } from '@/lib/validators';

function computeMaintenanceStatus(
  lastPreventiveDate: Date | null,
  intervalMonths: number,
  createdAt: Date,
): { nextDueDate: Date; maintenanceStatus: 'overdue' | 'due-soon' | 'ok' | 'never' } {
  const base = lastPreventiveDate ?? createdAt;
  const nextDueDate = new Date(base);
  nextDueDate.setMonth(nextDueDate.getMonth() + intervalMonths);
  const today = new Date();
  const diffDays = Math.floor((nextDueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (!lastPreventiveDate) return { nextDueDate, maintenanceStatus: 'never' };
  if (diffDays < 0) return { nextDueDate, maintenanceStatus: 'overdue' };
  if (diffDays <= 30) return { nextDueDate, maintenanceStatus: 'due-soon' };
  return { nextDueDate, maintenanceStatus: 'ok' };
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') ?? '';
    const statusFilter = searchParams.get('status') ?? '';
    const maintenanceStatusFilter = searchParams.get('maintenanceStatus') ?? '';

    const computers = await prisma.computer.findMany({
      where: {
        ...(statusFilter ? { status: statusFilter } : { status: { not: 'retired' } }),
        ...(search
          ? {
              OR: [
                { computerName: { contains: search } },
                { remotePcId: { contains: search } },
                { assignments: { some: { user: { name: { contains: search } } } } },
                { assignments: { some: { user: { lastname: { contains: search } } } } },
              ],
            }
          : {}),
      },
      include: {
        assignments: {
          include: { user: { select: { idUser: true, name: true, lastname: true } } },
          orderBy: { assignedAt: 'asc' },
        },
        maintenanceLogs: {
          where: { maintenanceType: 'preventive' },
          orderBy: { performedDate: 'desc' },
          take: 1,
          select: { performedDate: true },
        },
        maintenanceTickets: {
          where: { status: { in: ['open', 'in-progress'] } },
          select: { id: true },
        },
      },
      orderBy: { computerName: 'asc' },
    });

    const result = computers.map((c) => {
      const lastPreventive = c.maintenanceLogs[0]?.performedDate ?? null;
      const { nextDueDate, maintenanceStatus } = computeMaintenanceStatus(
        lastPreventive,
        c.maintenanceIntervalMonths,
        c.createdAt,
      );

      return {
        id: c.id,
        computerName: c.computerName,
        remotePcId: c.remotePcId,
        operatingSystem: c.operatingSystem,
        specs: c.specs,
        notes: c.notes,
        status: c.status,
        maintenanceIntervalMonths: c.maintenanceIntervalMonths,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        assignedUsers: c.assignments.map((a) => ({
          id: a.user.idUser,
          name: `${a.user.name ?? ''} ${a.user.lastname ?? ''}`.trim(),
        })),
        lastPreventiveDate: lastPreventive,
        nextDueDate,
        maintenanceStatus,
        openTicketCount: c.maintenanceTickets.length,
      };
    });

    const filtered = maintenanceStatusFilter
      ? result.filter((r) => r.maintenanceStatus === maintenanceStatusFilter)
      : result;

    return NextResponse.json(filtered);
  } catch (error) {
    console.error('GET /api/admin/maintenance/computers error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createComputerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { computerName, remotePcId, assignedUserIds, operatingSystem, specs, notes, maintenanceIntervalMonths } =
      parsed.data;

    const computer = await prisma.$transaction(async (tx) => {
      const c = await tx.computer.create({
        data: {
          computerName,
          remotePcId: remotePcId ?? null,
          operatingSystem: operatingSystem ?? null,
          specs: specs ?? null,
          notes: notes ?? null,
          maintenanceIntervalMonths,
        },
      });

      if (assignedUserIds && assignedUserIds.length > 0) {
        await tx.computerAssignment.createMany({
          data: assignedUserIds.map((userId) => ({ computerId: c.id, userId })),
          skipDuplicates: true,
        });
      }

      return c;
    });

    return NextResponse.json(computer, { status: 201 });
  } catch (error) {
    console.error('POST /api/admin/maintenance/computers error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
