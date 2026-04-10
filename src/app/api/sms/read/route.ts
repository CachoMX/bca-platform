import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { phone } = await request.json();
    if (!phone) {
      return NextResponse.json({ error: 'phone required' }, { status: 400 });
    }

    const digits = String(phone).replace(/\D/g, '');

    await prisma.message.updateMany({
      where: {
        OR: [
          { phoneNumber: digits },
          { phoneNumber: `+${digits}` },
          { phoneNumber: `+1${digits}` },
          { phoneNumber: digits.startsWith('1') ? digits.slice(1) : `1${digits}` },
        ],
        direction: 'inbound',
        isRead: false,
      },
      data: { isRead: true },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('POST /api/sms/read error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
