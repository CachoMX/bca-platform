import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Webhook for sms-gate.app (Android SMS Gateway)
// Event payload: { id, webhookId, deviceId, event, payload }
// payload for sms:received: { messageId, phoneNumber, sender, recipient, simNumber, message, receivedAt }
export async function POST(request: NextRequest) {
  try {
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
