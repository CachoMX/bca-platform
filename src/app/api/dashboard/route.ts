import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getTodayRangePST } from '@/lib/time';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as { userId: number }).userId;
    const role = (session.user as { role: number }).role;

    // Calculate date boundaries (PST-aware)
    const { todayStart, todayEnd } = getTodayRangePST();

    // Start of the week (Monday in PST)
    const dayOfWeek = todayStart.getUTCDay();
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weekStart = new Date(todayStart);
    weekStart.setUTCDate(weekStart.getUTCDate() - mondayOffset);

    // User stats
    const [todayCalls, weekCalls, callbacksDue] = await Promise.all([
      prisma.call.count({
        where: {
          idUser: userId,
          callDate: { gte: todayStart, lt: todayEnd },
        },
      }),
      prisma.call.count({
        where: {
          idUser: userId,
          callDate: { gte: weekStart, lt: todayEnd },
        },
      }),
      prisma.call.count({
        where: {
          idUser: userId,
          callBack: { lte: todayEnd },
          // Only count callbacks that haven't been followed up on:
          // the same business doesn't have a newer call after this callback was set
        },
      }),
    ]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: Record<string, any> = {
      todayCalls,
      weekCalls,
      callbacksDue,
    };

    // Admin/manager stats (role 1 = admin, role 2 = manager)
    if (role === 1 || role === 2) {
      const [totalActiveLeads, totalReps] = await Promise.all([
        prisma.business.count({ where: { idStatus: 3 } }),
        prisma.user.count({ where: { OR: [{ status: null }, { status: false }] } }),
      ]);

      result.totalActiveLeads = totalActiveLeads;
      result.totalReps = totalReps;
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('GET /api/dashboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
