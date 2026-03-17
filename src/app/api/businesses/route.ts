import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { businessSearchSchema } from '@/lib/validators';

interface BusinessRow {
  IdBusiness: number;
  BusinessName: string | null;
  Phone: string | null;
  Address: string | null;
  Location: string | null;
  Industry: string | null;
  TimeZone: string | null;
  IdStatus: number | null;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const parsed = businessSearchSchema.safeParse({
      search: searchParams.get('search') || undefined,
      status: searchParams.get('status') || undefined,
      page: searchParams.get('page') || 1,
      pageSize: searchParams.get('pageSize') || 50,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { search, status, page, pageSize } = parsed.data;

    // Build WHERE conditions
    const conditions: Prisma.Sql[] = [];

    if (status === 'existing') {
      conditions.push(Prisma.sql`b.IdStatus = 7`);
    } else if (status === 'available') {
      conditions.push(Prisma.sql`b.IdStatus NOT IN (7, 4)`);
    }

    if (search) {
      const digitsOnly = search.replace(/\D/g, '');
      const looksLikePhone = digitsOnly.length >= 3 && digitsOnly.length / search.replace(/\s/g, '').length > 0.5;

      if (looksLikePhone) {
        // Phone search: search phoneDigits with contains (index on PhoneDigits helps narrow)
        conditions.push(Prisma.sql`b.PhoneDigits LIKE '%' + ${digitsOnly} + '%'`);
      } else {
        // Name search: startsWith is fast with index
        conditions.push(Prisma.sql`b.BusinessName LIKE ${search} + '%'`);
      }
    }

    const whereClause = conditions.length > 0
      ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`
      : Prisma.empty;

    const offset = (page - 1) * pageSize;

    // Use raw SQL for optimal index usage on 3.5M rows
    const [businesses, countResult] = await Promise.all([
      prisma.$queryRaw<BusinessRow[]>`
        SELECT b.IdBusiness, b.BusinessName, b.Phone, b.Address,
               b.Location, b.Industry, b.TimeZone, b.IdStatus
        FROM Businesses b ${whereClause}
        ORDER BY b.BusinessName
        OFFSET ${offset} ROWS FETCH NEXT ${pageSize} ROWS ONLY
      `,
      prisma.$queryRaw<[{ cnt: number }]>`
        SELECT CAST(COUNT(*) AS INT) as cnt FROM Businesses b ${whereClause}
      `,
    ]);

    const total = Number(countResult[0]?.cnt ?? 0);

    const data = businesses.map((b) => ({
      idBusiness: b.IdBusiness,
      businessName: b.BusinessName ?? '',
      phone: b.Phone ?? '',
      address: b.Address ?? '',
      location: b.Location ?? '',
      industry: b.Industry ?? '',
      timezone: b.TimeZone ?? '',
      idStatus: b.IdStatus ?? 0,
    }));

    return NextResponse.json({
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error('GET /api/businesses error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
