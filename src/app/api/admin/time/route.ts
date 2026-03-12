import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
function getEmployeeStatus(log: {
  clockIn: Date | null;
  firstBreakOut: Date | null;
  firstBreakIn: Date | null;
  lunchOut: Date | null;
  lunchIn: Date | null;
  secondBreakOut: Date | null;
  secondBreakIn: Date | null;
  clockOut: Date | null;
} | null): string {
  if (!log || !log.clockIn) return 'not_clocked_in';
  if (log.clockOut) return 'clocked_out';
  if (log.secondBreakOut && !log.secondBreakIn) return 'on_break';
  if (log.lunchOut && !log.lunchIn) return 'at_lunch';
  if (log.firstBreakOut && !log.firstBreakIn) return 'on_break';
  return 'working';
}

function getCurrentBreakStart(log: {
  firstBreakOut: Date | null;
  firstBreakIn: Date | null;
  lunchOut: Date | null;
  lunchIn: Date | null;
  secondBreakOut: Date | null;
  secondBreakIn: Date | null;
} | null): Date | null {
  if (!log) return null;
  if (log.secondBreakOut && !log.secondBreakIn) return log.secondBreakOut;
  if (log.lunchOut && !log.lunchIn) return log.lunchOut;
  if (log.firstBreakOut && !log.firstBreakIn) return log.firstBreakOut;
  return null;
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = (session.user as { role: number }).role;
    if (role !== 1 && role !== 2) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get today's date in PST, then create midnight-UTC boundaries
    // logDate is stored as midnight UTC (just the date), so we must compare at UTC midnight
    const now = new Date();
    const pstDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
    const todayStart = new Date(Date.UTC(pstDate.getFullYear(), pstDate.getMonth(), pstDate.getDate()));
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    // Fetch all active employees, today's time logs, and active disconnections in parallel
    const [employees, logs, activeDisconnections] = await Promise.all([
      prisma.user.findMany({
        where: { OR: [{ status: null }, { status: false }] },
        select: {
          idUser: true,
          name: true,
          lastname: true,
          idRole: true,
          isPartTime: true,
        },
        orderBy: [{ name: 'asc' }, { lastname: 'asc' }],
      }),
      prisma.employeeTimeLog.findMany({
        where: {
          logDate: { gte: todayStart, lt: todayEnd },
        },
      }),
      prisma.employeeDisconnection.findMany({
        where: {
          reconnectionTime: null,
        },
        select: { idUser: true },
      }),
    ]);

    // Map logs by userId
    const logsByUser = new Map(logs.map((log) => [log.idUser, log]));

    const disconnectedUserIds = new Set(activeDisconnections.map((d) => d.idUser));

    const data = employees.map((emp) => {
      const log = logsByUser.get(emp.idUser) || null;
      const status = getEmployeeStatus(log);
      const breakStart = getCurrentBreakStart(log);

      // Determine if break is exceeded (10-minute limit for breaks, not lunch)
      let breakExceeded = false;
      if (breakStart && status !== 'at_lunch') {
        const breakMs = now.getTime() - new Date(breakStart).getTime();
        breakExceeded = breakMs > 10 * 60 * 1000;
      }

      return {
        userId: emp.idUser,
        name: `${emp.name} ${emp.lastname}`,
        role: emp.idRole,
        isPartTime: emp.isPartTime,
        status,
        clockIn: log?.clockIn?.toISOString() || null,
        firstBreakOut: log?.firstBreakOut?.toISOString() || null,
        firstBreakIn: log?.firstBreakIn?.toISOString() || null,
        lunchOut: log?.lunchOut?.toISOString() || null,
        lunchIn: log?.lunchIn?.toISOString() || null,
        secondBreakOut: log?.secondBreakOut?.toISOString() || null,
        secondBreakIn: log?.secondBreakIn?.toISOString() || null,
        clockOut: log?.clockOut?.toISOString() || null,
        currentBreakStart: breakStart?.toISOString() || null,
        breakExceeded,
        isDisconnected: disconnectedUserIds.has(emp.idUser),
      };
    });

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Admin time GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
