import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const templates = await prisma.$queryRaw<{ id: number; title: string; body: string; sortOrder: number }[]>`
      SELECT Id as id, Title as title, Body as body, SortOrder as sortOrder
      FROM benjaise_sqluser2.SmsTemplates
      ORDER BY SortOrder ASC, Id ASC
    `;
    return NextResponse.json(templates);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('GET /api/sms/templates error:', error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { title, body } = await request.json();
    if (!title?.trim() || !body?.trim()) {
      return NextResponse.json({ error: 'title and body required' }, { status: 400 });
    }

    await prisma.$executeRaw`
      INSERT INTO benjaise_sqluser2.SmsTemplates (Title, Body, SortOrder)
      VALUES (${title.trim()}, ${body.trim()}, 0)
    `;

    const created = await prisma.$queryRaw<{ id: number; title: string; body: string; sortOrder: number }[]>`
      SELECT TOP 1 Id as id, Title as title, Body as body, SortOrder as sortOrder
      FROM benjaise_sqluser2.SmsTemplates
      ORDER BY Id DESC
    `;

    return NextResponse.json(created[0], { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('POST /api/sms/templates error:', error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
