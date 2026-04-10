import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function getNextDueDate(lastPreventive: Date | null, intervalMonths: number, createdAt: Date): Date {
  const base = lastPreventive ?? createdAt;
  const d = new Date(base);
  d.setMonth(d.getMonth() + intervalMonths);
  return d;
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date();
    const soon = new Date();
    soon.setDate(soon.getDate() + 30);

    const [allComputers, openTickets, urgentTickets, recentLogs] = await Promise.all([
      prisma.computer.findMany({
        where: { status: { not: 'retired' } },
        select: {
          id: true,
          computerName: true,
          maintenanceIntervalMonths: true,
          createdAt: true,
          maintenanceLogs: {
            where: { maintenanceType: 'preventive' },
            orderBy: { performedDate: 'desc' },
            take: 1,
            select: { performedDate: true },
          },
        },
      }),
      prisma.maintenanceTicket.count({ where: { status: { in: ['open', 'in-progress'] } } }),
      prisma.maintenanceTicket.count({ where: { status: { in: ['open', 'in-progress'] }, priority: 'urgent' } }),
      prisma.maintenanceLog.findMany({
        orderBy: { performedDate: 'desc' },
        take: 5,
        include: {
          computer: { select: { computerName: true } },
          technician: { select: { name: true, lastname: true } },
        },
      }),
    ]);

    let overdueCount = 0;
    let dueSoonCount = 0;
    const upcoming: { id: number; computerName: string; nextDueDate: Date }[] = [];

    for (const c of allComputers) {
      const lastPreventive = c.maintenanceLogs[0]?.performedDate ?? null;
      const nextDueDate = getNextDueDate(lastPreventive, c.maintenanceIntervalMonths, c.createdAt);

      if (nextDueDate < today) {
        overdueCount++;
      } else if (nextDueDate <= soon) {
        dueSoonCount++;
      }

      if (nextDueDate >= today) {
        upcoming.push({ id: c.id, computerName: c.computerName, nextDueDate });
      }
    }

    upcoming.sort((a, b) => a.nextDueDate.getTime() - b.nextDueDate.getTime());

    return NextResponse.json({
      totalComputers: allComputers.length,
      overdueCount,
      dueSoonCount,
      openTicketsCount: openTickets,
      urgentTicketsCount: urgentTickets,
      recentLogs: recentLogs.map((l) => ({
        id: l.id,
        computerName: l.computer.computerName,
        maintenanceType: l.maintenanceType,
        performedDate: l.performedDate,
        technicianName: `${l.technician.name ?? ''} ${l.technician.lastname ?? ''}`.trim(),
      })),
      upcomingMaintenance: upcoming.slice(0, 5),
    });
  } catch (error) {
    console.error('GET /api/admin/maintenance/dashboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
