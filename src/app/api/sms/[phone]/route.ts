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
    const digits = decodeURIComponent(phone).replace(/\D/g, '');

    // Match stored numbers regardless of +1 prefix format
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { phoneNumber: digits },
          { phoneNumber: `+${digits}` },
          { phoneNumber: `+1${digits}` },
          { phoneNumber: digits.startsWith('1') ? digits.slice(1) : `1${digits}` },
        ],
      },
      select: {
        id: true,
        phoneNumber: true,
        messageBody: true,
        direction: true,
        sentTime: true,
        status: true,
        mediaType: true,
        mediaName: true,
        // Exclude mediaData (base64) from list — fetched on demand per message
      },
      orderBy: { sentTime: 'asc' },
    });

    const result = messages.map((m) => ({
      id: m.id,
      phone: m.phoneNumber,
      body: m.messageBody,
      direction: m.direction,
      createdAt: m.sentTime.toISOString(),
      status: m.status ?? null,
      mediaType: m.mediaType ?? null,
      mediaName: m.mediaName ?? null,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('GET /api/sms/[phone] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
