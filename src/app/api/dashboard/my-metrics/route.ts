import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

interface DailyRow {
  Day: string;
  TotalCalls: number;
  PotentialClients: number;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as { userId: number }).userId;
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') ?? 'week'; // week | 2weeks | month

    // Calculate start date
    const now = new Date();
    let daysBack: number;
    if (range === '2weeks') {
      daysBack = 14;
    } else if (range === 'month') {
      daysBack = 30;
    } else {
      // Default: current week (Mon-Sun)
      const dayOfWeek = now.getDay();
      daysBack = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    }

    const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysBack);

    const rows = await prisma.$queryRaw<DailyRow[]>(
      Prisma.sql`
        SELECT
          CONVERT(VARCHAR(10), c.CallDate, 120) AS Day,
          COUNT(*) AS TotalCalls,
          SUM(CASE WHEN c.IdDisposition = 4 THEN 1 ELSE 0 END) AS PotentialClients
        FROM dbo.Calls c
        WHERE c.IdUser = ${userId}
          AND c.CallDate >= ${startDate}
        GROUP BY CONVERT(VARCHAR(10), c.CallDate, 120)
        ORDER BY Day
      `
    );

    const metrics = rows.map((r) => ({
      date: r.Day,
      totalCalls: Number(r.TotalCalls),
      potentialClients: Number(r.PotentialClients),
    }));

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('GET /api/dashboard/my-metrics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
