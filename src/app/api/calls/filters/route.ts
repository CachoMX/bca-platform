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
      prisma.business.findMany({
        where: { idStatus: 3 },
        select: { industry: true },
        distinct: ['industry'],
        orderBy: { industry: 'asc' },
      }),
      prisma.business.findMany({
        where: { idStatus: 3 },
        select: { timeZone: true },
        distinct: ['timeZone'],
        orderBy: { timeZone: 'asc' },
      }),
    ]);

    // Normalize timezone casing and deduplicate (DB has mixed "est"/"EST")
    const uniqueTimezones = [
      ...new Set(
        timezones
          .map((t) => t.timeZone?.toUpperCase())
          .filter((tz): tz is string => tz != null)
      ),
    ].sort();

    return NextResponse.json({
      industries: industries.map((i) => i.industry),
      timezones: uniqueTimezones,
    });
  } catch (error) {
    console.error('GET /api/calls/filters error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
