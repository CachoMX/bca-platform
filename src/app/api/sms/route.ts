import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendSmsSchema } from '@/lib/validators';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use raw SQL to efficiently get latest message per phone + unread counts
    // instead of loading the entire messages table into memory
    const conversations = await prisma.$queryRaw<
      { phone: string; lastMessage: string; lastMessageAt: Date; unread: number }[]
    >`
      SELECT
        m.PhoneNumber as phone,
        m.MessageBody as lastMessage,
        m.SentTime as lastMessageAt,
        ISNULL(u.unread, 0) as unread
      FROM benjaise_sqluser2.Messages m
      INNER JOIN (
        SELECT PhoneNumber, MAX(SentTime) as MaxTime
        FROM benjaise_sqluser2.Messages
        GROUP BY PhoneNumber
      ) latest ON m.PhoneNumber = latest.PhoneNumber AND m.SentTime = latest.MaxTime
      LEFT JOIN (
        SELECT PhoneNumber, COUNT(*) as unread
        FROM benjaise_sqluser2.Messages
        WHERE IsRead = 0 AND Direction = 'inbound'
        GROUP BY PhoneNumber
      ) u ON m.PhoneNumber = u.PhoneNumber
      ORDER BY m.SentTime DESC
    `;

    const result = conversations.map((c) => ({
      phone: c.phone,
      lastMessage: c.lastMessage,
      lastMessageAt: c.lastMessageAt instanceof Date ? c.lastMessageAt.toISOString() : c.lastMessageAt,
      unread: Number(c.unread),
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('GET /api/sms error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = sendSmsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { phoneNumber, messageBody } = parsed.data;

    // Send SMS via Android SMS Gateway (sms-gate.app)
    const smsApiUrl = process.env.SMS_API_URL;
    const smsUsername = process.env.SMS_USERNAME;
    const smsPassword = process.env.SMS_PASSWORD;

    if (!smsApiUrl || !smsUsername || !smsPassword) {
      return NextResponse.json({ error: 'SMS gateway not configured' }, { status: 503 });
    }

    const credentials = Buffer.from(`${smsUsername}:${smsPassword}`).toString('base64');

    const gatewayResponse = await fetch(`${smsApiUrl}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        textMessage: { text: messageBody },
        phoneNumbers: [phoneNumber],
      }),
    });

    if (!gatewayResponse.ok) {
      const errBody = await gatewayResponse.text();
      console.error('SMS Gateway error:', errBody);
      return NextResponse.json({ error: 'Failed to send SMS' }, { status: 502 });
    }

    // Save message to database
    const message = await prisma.message.create({
      data: {
        phoneNumber,
        messageBody,
        direction: 'outbound',
        sentTime: new Date(),
      },
    });

    return NextResponse.json({ success: true, message }, { status: 201 });
  } catch (error) {
    console.error('POST /api/sms error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
