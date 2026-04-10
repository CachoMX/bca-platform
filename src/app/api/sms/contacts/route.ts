import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const contacts = await prisma.$queryRaw<{ id: number; phoneNumber: string; name: string }[]>`
      SELECT Id as id, PhoneNumber as phoneNumber, Name as name
      FROM benjaise_sqluser2.SmsContacts
      ORDER BY Name ASC
    `;
    return NextResponse.json(contacts);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('GET /api/sms/contacts error:', error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { phone, name } = await request.json();
    if (!phone || !name?.trim()) {
      return NextResponse.json({ error: 'phone and name required' }, { status: 400 });
    }

    const trimmedName = name.trim();
    const now = new Date();

    const existing = await prisma.$queryRaw<{ id: number }[]>`
      SELECT Id as id FROM benjaise_sqluser2.SmsContacts WHERE PhoneNumber = ${phone}
    `;

    if (existing.length > 0) {
      await prisma.$executeRaw`
        UPDATE benjaise_sqluser2.SmsContacts
        SET Name = ${trimmedName}, UpdatedAt = ${now}
        WHERE PhoneNumber = ${phone}
      `;
    } else {
      await prisma.$executeRaw`
        INSERT INTO benjaise_sqluser2.SmsContacts (PhoneNumber, Name, UpdatedAt)
        VALUES (${phone}, ${trimmedName}, ${now})
      `;
    }

    return NextResponse.json({ phoneNumber: phone, name: trimmedName });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('POST /api/sms/contacts error:', error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { phone } = await request.json();
    if (!phone) return NextResponse.json({ error: 'phone required' }, { status: 400 });

    await prisma.$executeRaw`
      DELETE FROM benjaise_sqluser2.SmsContacts WHERE PhoneNumber = ${phone}
    `;
    return NextResponse.json({ ok: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('DELETE /api/sms/contacts error:', error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
