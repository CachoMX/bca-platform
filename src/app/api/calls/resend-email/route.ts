import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendEmail, buildCallEmailHTML } from '@/lib/email';

const EMAIL_DISPOSITIONS = [4, 8, 10]; // Potential Client, Call Back, Info Request

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = (session.user as { role: number }).role;
    if (role !== 1 && role !== 2) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const idCall = Number(body.idCall);
    if (!idCall || isNaN(idCall)) {
      return NextResponse.json({ error: 'Invalid call ID' }, { status: 400 });
    }

    // Get the call with all related data
    const call = await prisma.call.findUnique({
      where: { idCall },
      include: {
        user: { select: { name: true, lastname: true } },
        business: { select: { businessName: true, phone: true, address: true } },
        disposition: { select: { disposition: true } },
        closer: { select: { name: true, lastname: true, email: true } },
      },
    });

    if (!call) {
      return NextResponse.json({ error: 'Call not found' }, { status: 404 });
    }

    if (!EMAIL_DISPOSITIONS.includes(call.idDisposition)) {
      return NextResponse.json(
        { error: 'Email can only be sent for Potential Client, Call Back, or Info Request dispositions' },
        { status: 400 },
      );
    }

    // Build email
    const callerName = `${call.user.name ?? ''} ${call.user.lastname ?? ''}`.trim() || 'Unknown';
    const closerName = call.closer
      ? `${call.closer.name ?? ''} ${call.closer.lastname ?? ''}`.trim()
      : 'Team';

    const typeLabel = call.idDisposition === 4 ? 'Potential Client'
      : call.idDisposition === 8 ? 'Call Back Request'
      : 'Info Request';
    const emailType = call.idDisposition === 4 ? 'potential-client'
      : call.idDisposition === 8 ? 'callback'
      : 'info-request';

    const debtAmount = call.pDebtorAmmount
      ? `$${parseFloat(call.pDebtorAmmount).toFixed(2)}`
      : 'N/A';

    const html = buildCallEmailHTML({
      type: emailType as 'potential-client' | 'callback' | 'info-request',
      closerName,
      fromName: callerName,
      businessName: call.business.businessName || 'Unknown',
      businessPhone: call.business.phone || 'N/A',
      businessAddress: call.business.address || 'N/A',
      dmName: call.dMakerName || 'N/A',
      dmPhone: call.dMPhone || 'N/A',
      dmEmail: call.dMEmail || 'N/A',
      comments: call.comments || '',
      debtorName: call.pDebtorName || 'N/A',
      amountOwed: debtAmount,
      agreementSent: call.agreementSent != null ? (call.agreementSent ? 'Yes' : 'No') : 'N/A',
      callBackDate: call.callBack?.toISOString() || 'N/A',
    });

    const subject = `${typeLabel} - ${call.business.businessName || 'Unknown Business'}`;

    // TO: closer
    const to: { email: string; name: string }[] = [];
    if (call.closer?.email) {
      to.push({ email: call.closer.email, name: closerName });
    }

    // CC is always admin@benjaminchaise.com only
    const ccUsers = [{ name: 'Admin', lastname: '', email: 'admin@benjaminchaise.com' }];

    const cc = ccUsers
      .filter((u) => u.email && u.email !== call.closer?.email)
      .map((u) => ({ email: u.email!, name: `${u.name} ${u.lastname}`.trim() }));

    if (to.length === 0 && cc.length > 0) {
      to.push(cc.shift()!);
    }

    if (to.length === 0) {
      return NextResponse.json(
        { error: 'No email recipients found. Make sure the closer has an email address.' },
        { status: 400 },
      );
    }

    await sendEmail({ to, cc, subject, html });

    const sentTo = to.map((r) => r.email).join(', ');
    return NextResponse.json({ message: 'Email sent successfully', sentTo });
  } catch (error) {
    console.error('POST /api/calls/resend-email error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
