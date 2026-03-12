import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { businessSearchSchema } from '@/lib/validators';

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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = {};

    // Status filter (matches legacy app: existing=7, excluded=4)
    if (status === 'existing') {
      where.idStatus = 7;
    } else if (status === 'available') {
      where.idStatus = { notIn: [7, 4] };
    }
    // 'all' or undefined = no status filter

    // Search filter
    if (search) {
      where.OR = [
        { businessName: { contains: search } },
        { phone: { contains: search } },
        { phoneDigits: { contains: search } },
      ];
    }

    const [businesses, total] = await Promise.all([
      prisma.business.findMany({
        where,
        orderBy: { businessName: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.business.count({ where }),
    ]);

    // Transform to match frontend ClientBusiness interface
    const data = businesses.map((b) => ({
      idBusiness: b.idBusiness,
      businessName: b.businessName ?? '',
      phone: b.phone ?? '',
      address: b.address ?? '',
      location: b.location ?? '',
      industry: b.industry ?? '',
      timezone: b.timeZone ?? '',
      idStatus: b.idStatus ?? 0,
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
