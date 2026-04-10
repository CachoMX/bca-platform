import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const rows = await prisma.$queryRaw<{ mediaData: string; mediaType: string; mediaName: string }[]>`
      SELECT MediaData as mediaData, MediaType as mediaType, MediaName as mediaName
      FROM benjaise_sqluser2.Messages
      WHERE Id = ${Number(id)} AND MediaData IS NOT NULL
    `;

    if (!rows[0]?.mediaData) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json({
      data: rows[0].mediaData,
      type: rows[0].mediaType,
      name: rows[0].mediaName,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('GET /api/sms/media/[id] error:', error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
