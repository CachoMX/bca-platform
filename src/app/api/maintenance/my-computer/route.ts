import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function computeStatus(
  lastPreventive: Date | null,
  intervalMonths: number,
  createdAt: Date,
): { nextDueDate: Date; maintenanceStatus: 'overdue' | 'due-soon' | 'ok' | 'never' } {
  const base = lastPreventive ?? createdAt;
  const nextDueDate = new Date(base);
  nextDueDate.setMonth(nextDueDate.getMonth() + intervalMonths);
  if (!lastPreventive) return { nextDueDate, maintenanceStatus: 'never' };
  const today = new Date();
  const diffDays = Math.floor((nextDueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { nextDueDate, maintenanceStatus: 'overdue' };
  if (diffDays <= 30) return { nextDueDate, maintenanceStatus: 'due-soon' };
  return { nextDueDate, maintenanceStatus: 'ok' };
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as { userId: number }).userId;

    const computers = await prisma.computer.findMany({
      where: {
        assignments: { some: { userId } },
        status: { not: 'retired' },
      },
      include: {
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
      const { nextDueDate, maintenanceStatus } = computeStatus(
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
        lastPreventiveDate: lastPreventive,
        nextDueDate,
        maintenanceStatus,
        openTicketCount: c.maintenanceTickets.length,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('GET /api/maintenance/my-computer error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
