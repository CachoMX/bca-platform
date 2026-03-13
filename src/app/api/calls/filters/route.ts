import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [industries, timezones] = await Promise.all([
      prisma.$queryRaw<{ industry: string }[]>`
        SELECT DISTINCT Industry as industry
        FROM dbo.Businesses
        WHERE IdStatus = 3 AND Industry IS NOT NULL AND Industry != ''
        ORDER BY Industry
      `,
      prisma.$queryRaw<{ timeZone: string }[]>`
        SELECT DISTINCT UPPER(TimeZone) as timeZone
        FROM dbo.Businesses
        WHERE IdStatus = 3 AND TimeZone IS NOT NULL AND TimeZone != ''
        ORDER BY timeZone
      `,
    ]);

    return NextResponse.json({
      industries: industries.map((i) => i.industry),
      timezones: timezones.map((t) => t.timeZone),
    }, {
      headers: { 'Cache-Control': 'private, max-age=300' },
    });
  } catch (error) {
    console.error('GET /api/calls/filters error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
