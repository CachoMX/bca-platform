import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

interface LeaderboardRow {
  IdUser: number;
  Name: string;
  Lastname: string;
  PotentialClients: number;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') ?? 'month'; // week | month | all

    // Calculate start date for period filter
    const now = new Date();
    let startDate: Date;

    if (period === 'week') {
      const dayOfWeek = now.getDay();
      const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - mondayOffset);
    } else if (period === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
      // 'all' = from the beginning
      startDate = new Date(2000, 0, 1);
    }

    const rows = await prisma.$queryRaw<LeaderboardRow[]>(
      Prisma.sql`
        SELECT TOP(20)
          u.IdUser,
          u.Name,
          u.Lastname,
          CAST(COUNT(*) AS INT) AS PotentialClients
        FROM dbo.Calls c
        INNER JOIN dbo.Users u ON u.IdUser = c.IdUser
        WHERE c.IdDisposition = 4
          AND c.CallDate >= ${startDate}
          AND (u.Status IS NULL OR u.Status = 0)
        GROUP BY u.IdUser, u.Name, u.Lastname
        ORDER BY COUNT(*) DESC
      `
    );

    const leaderboard = rows.map((r, i) => ({
      rank: i + 1,
      userId: r.IdUser,
      name: `${r.Name ?? ''} ${r.Lastname ?? ''}`.trim(),
      potentialClients: Number(r.PotentialClients),
    }));

    return NextResponse.json(leaderboard);
  } catch (error) {
    console.error('GET /api/dashboard/leaderboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
