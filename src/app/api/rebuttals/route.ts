import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { rebuttalSchema } from '@/lib/validators';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rebuttals = await prisma.rebuttal.findMany({
      where: { isActive: true },
      orderBy: { title: 'asc' },
    });

    // Deduplicate by title (keep first occurrence)
    const seen = new Set<string>();
    const unique = rebuttals.filter((r) => {
      const key = r.title.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Sort: "Script" titles first, then alphabetical
    unique.sort((a, b) => {
      const aIsScript = a.title.toLowerCase().startsWith('script');
      const bIsScript = b.title.toLowerCase().startsWith('script');
      if (aIsScript && !bIsScript) return -1;
      if (!aIsScript && bIsScript) return 1;
      return a.title.localeCompare(b.title);
    });

    return NextResponse.json(unique);
  } catch (error) {
    console.error('GET /api/rebuttals error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = (session.user as { role: number }).role;
    if (role !== 1) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = rebuttalSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const rebuttal = await prisma.rebuttal.create({
      data: {
        title: parsed.data.title,
        content: parsed.data.content,
      },
    });

    return NextResponse.json(rebuttal, { status: 201 });
  } catch (error) {
    console.error('POST /api/rebuttals error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
