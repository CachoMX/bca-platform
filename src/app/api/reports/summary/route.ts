import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = (session.user as { role: number }).role;
    if (role !== 1 && role !== 2) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = request.nextUrl;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const repId = searchParams.get('repId') || searchParams.get('rep');

    // Build parameterized WHERE conditions
    const conditions: Prisma.Sql[] = [];

    if (repId) {
      const id = Number(repId);
      if (!Number.isNaN(id)) {
        conditions.push(Prisma.sql`c.IdUser = ${id}`);
      }
    }
    if (startDate) {
      conditions.push(Prisma.sql`c.CallDate >= ${new Date(startDate + 'T00:00:00.000Z')}`);
    }
    if (endDate) {
      conditions.push(Prisma.sql`c.CallDate <= ${new Date(endDate + 'T23:59:59.999Z')}`);
    }

    const whereClause = conditions.length > 0
      ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`
      : Prisma.empty;

    const dispWhereClause = conditions.length > 0
      ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')} AND c.IdDisposition IS NOT NULL`
      : Prisma.sql`WHERE c.IdDisposition IS NOT NULL`;

    // Parameterized queries — safe from SQL injection
    const [countResult, topRepResult, topDispResult] = await Promise.all([
      prisma.$queryRaw<[{ cnt: bigint }]>`
        SELECT CAST(COUNT(*) AS INT) as cnt FROM dbo.Calls c ${whereClause}`,
      prisma.$queryRaw<{ IdUser: number; cnt: bigint; Name: string; Lastname: string }[]>`
        SELECT TOP 1 c.IdUser, COUNT(*) as cnt, u.Name, u.Lastname
        FROM dbo.Calls c
        JOIN dbo.Users u ON c.IdUser = u.IdUser
        ${whereClause}
        GROUP BY c.IdUser, u.Name, u.Lastname
        ORDER BY cnt DESC`,
      prisma.$queryRaw<{ IdDisposition: number; cnt: bigint; Disposition: string }[]>`
        SELECT TOP 1 c.IdDisposition, COUNT(*) as cnt, d.Disposition
        FROM dbo.Calls c
        JOIN dbo.Dispositions d ON c.IdDisposition = d.IdDisposition
        ${dispWhereClause}
        GROUP BY c.IdDisposition, d.Disposition
        ORDER BY cnt DESC`,
    ]);

    const totalCalls = Number(countResult[0]?.cnt ?? 0);

    // Calculate average calls per day
    let avgPerDay = 0;
    if (totalCalls > 0 && startDate) {
      const start = new Date(startDate);
      const end = endDate ? new Date(endDate) : new Date();
      const diffDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
      avgPerDay = Math.round((totalCalls / diffDays) * 100) / 100;
    }

    const topRep = topRepResult.length > 0
      ? { name: `${topRepResult[0].Name ?? ''} ${topRepResult[0].Lastname ?? ''}`.trim(), count: Number(topRepResult[0].cnt) }
      : null;

    const topDisposition = topDispResult.length > 0
      ? { name: topDispResult[0].Disposition ?? 'Unknown', count: Number(topDispResult[0].cnt) }
      : null;

    return NextResponse.json({
      totalCalls,
      avgPerDay,
      topRep,
      topDisposition,
    });
  } catch (error) {
    console.error('GET /api/reports/summary error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
