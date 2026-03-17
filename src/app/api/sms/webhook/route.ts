import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const WEBHOOK_SECRET = process.env.SMS_WEBHOOK_SECRET;

// Webhook for sms-gate.app (Android SMS Gateway)
// Event payload: { id, webhookId, deviceId, event, payload }
// payload for sms:received: { messageId, phoneNumber, sender, recipient, simNumber, message, receivedAt }
export async function POST(request: NextRequest) {
  try {
    // Authenticate webhook using shared secret (passed as Bearer token or query param)
    if (WEBHOOK_SECRET) {
      const authHeader = request.headers.get('authorization');
      const queryToken = request.nextUrl.searchParams.get('token');
      const token = authHeader?.replace('Bearer ', '') || queryToken;
      if (token !== WEBHOOK_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const data = await request.json();

    if (data.event !== 'sms:received') {
      return NextResponse.json({ ok: true });
    }

    const { phoneNumber, message, receivedAt } = data.payload ?? {};

    if (!phoneNumber || !message) {
      return NextResponse.json({ ok: true });
    }

    await prisma.message.create({
      data: {
        phoneNumber,
        messageBody: message,
        direction: 'inbound',
        sentTime: receivedAt ? new Date(receivedAt) : new Date(),
        isRead: false,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('SMS webhook error:', error);
    return NextResponse.json({ ok: true });
  }
}
