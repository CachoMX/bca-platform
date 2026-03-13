import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { getNextLeadSchema } from '@/lib/validators';

interface LeadRow {
  IdBusiness: number;
  BusinessName: string | null;
  Phone: string | null;
  Address: string | null;
  Location: string | null;
  Industry: string | null;
  TimeZone: string | null;
  IdStatus: number | null;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = getNextLeadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { industry, timezone } = parsed.data;

    // Build WHERE conditions for parameterized query
    const conditions: Prisma.Sql[] = [Prisma.sql`IdStatus = 3`];

    if (timezone) {
      conditions.push(Prisma.sql`TimeZone = ${timezone}`);
    }

    if (industry && industry !== 'Random Industry') {
      conditions.push(Prisma.sql`Industry = ${industry}`);
    }

    const whereClause = Prisma.join(conditions, ' AND ');

    // Atomic SELECT+UPDATE using CTE with UPDLOCK+READPAST and ORDER BY NEWID():
    // - CTE selects a random row matching filters
    // - UPDLOCK: exclusively locks the selected row
    // - READPAST: other transactions skip already-locked rows
    // - ORDER BY NEWID(): randomizes lead selection (matches legacy app behavior)
    const rows = await prisma.$queryRaw<LeadRow[]>(
      Prisma.sql`
        ;WITH cte AS (
          SELECT TOP(1) *
          FROM Businesses WITH (UPDLOCK, READPAST)
          WHERE ${whereClause}
          ORDER BY NEWID()
        )
        UPDATE cte
        SET IdStatus = 1
        OUTPUT
          inserted.IdBusiness,
          inserted.BusinessName,
          inserted.Phone,
          inserted.Address,
          inserted.Location,
          inserted.Industry,
          inserted.TimeZone,
          inserted.IdStatus
      `
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'No leads available' }, { status: 404 });
    }

    const biz = rows[0];

    // Transform to match frontend LeadBusiness interface
    return NextResponse.json({
      idBusiness: biz.IdBusiness,
      businessName: biz.BusinessName ?? '',
      phone: biz.Phone ?? '',
      address: biz.Address ?? '',
      location: biz.Location ?? '',
      industry: biz.Industry ?? '',
      timezone: biz.TimeZone ?? '',
      idStatus: biz.IdStatus ?? 0,
    });
  } catch (error) {
    console.error('POST /api/calls/next-lead error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
