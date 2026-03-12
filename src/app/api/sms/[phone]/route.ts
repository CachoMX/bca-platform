import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ phone: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { phone } = await params;
    const phoneNumber = decodeURIComponent(phone);

    const messages = await prisma.message.findMany({
      where: { phoneNumber },
      orderBy: { sentTime: 'asc' },
    });

    const result = messages.map((m) => ({
      id: m.id,
      phone: m.phoneNumber,
      body: m.messageBody,
      direction: m.direction,
      createdAt: m.sentTime.toISOString(),
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('GET /api/sms/[phone] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
