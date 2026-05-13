import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const role = (session.user as { role: number }).role;
    if (role !== 1) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const names = await prisma.blockedName.findMany({ orderBy: { keyword: 'asc' } });
    return NextResponse.json(names);
  } catch (error) {
    console.error('GET /api/admin/blacklist/names error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const role = (session.user as { role: number }).role;
    if (role !== 1) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { keyword } = await request.json();
    if (!keyword?.trim()) return NextResponse.json({ error: 'Keyword is required' }, { status: 400 });

    const entry = await prisma.blockedName.create({
      data: { keyword: keyword.trim().toLowerCase() },
    });
    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error('POST /api/admin/blacklist/names error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
