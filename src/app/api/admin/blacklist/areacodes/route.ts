import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const role = (session.user as { role: number }).role;
    if (role !== 1) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const codes = await prisma.blockedAreaCode.findMany({ orderBy: { areaCode: 'asc' } });
    return NextResponse.json(codes);
  } catch (error) {
    console.error('GET /api/admin/blacklist/areacodes error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const role = (session.user as { role: number }).role;
    if (role !== 1) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { areaCode } = await request.json();
    const clean = areaCode?.trim().replace(/\D/g, '');
    if (!clean || clean.length !== 3) {
      return NextResponse.json({ error: 'Area code must be 3 digits' }, { status: 400 });
    }

    const entry = await prisma.blockedAreaCode.create({ data: { areaCode: clean } });
    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error('POST /api/admin/blacklist/areacodes error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
