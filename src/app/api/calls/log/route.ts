import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logCallSchema } from '@/lib/validators';
import { Prisma } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as { userId: number }).userId;
    const body = await request.json();
    const parsed = logCallSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const data = parsed.data;
    const now = new Date();

    // Base call data shared by all dispositions
    const callData: Prisma.CallUncheckedCreateInput = {
      idUser: userId,
      idBusiness: data.idBusiness,
      idDisposition: data.idDisposition,
      callDate: now,
      dMakerName: '',
      dMEmail: '',
      dMPhone: '',
      pDebtorName: '',
      comments: data.comments || '',
    };

    // Enrich fields based on disposition type
    switch (data.idDisposition) {
      case 4: // Potential Client
        callData.dMakerName = data.dmakerName || '';
        callData.dMEmail = data.dmakerEmail || '';
        callData.dMPhone = data.dmakerPhone || '';
        callData.pDebtorName = data.debtorName || '';
        callData.pDebtorAmmount = data.debtAmount != null ? String(data.debtAmount) : null;
        callData.agreementSent = data.agreementSent != null ? String(data.agreementSent) : null;
        callData.idCloser = data.idCloser ?? null;
        callData.callBack = data.callBack ? new Date(data.callBack) : null;
        break;

      case 10: // Info Request
        callData.dMakerName = data.dmakerName || '';
        callData.dMEmail = data.dmakerEmail || '';
        callData.dMPhone = data.dmakerPhone || '';
        callData.idCloser = data.idCloser ?? null;
        break;

      case 8: // Call Back
        callData.dMakerName = data.dmakerName || '';
        callData.dMEmail = data.dmakerEmail || '';
        callData.dMPhone = data.dmakerPhone || '';
        callData.idCloser = data.idCloser ?? null;
        callData.callBack = data.callBack ? new Date(data.callBack) : null;
        break;
    }

    // Wrap call creation and business status update in a transaction
    const call = await prisma.$transaction(async (tx) => {
      const newCall = await tx.call.create({ data: callData });

      // Release the business back to available (idStatus = 3)
      await tx.business.update({
        where: { idBusiness: data.idBusiness },
        data: { idStatus: 3 },
      });

      return newCall;
    });

    return NextResponse.json(call, { status: 201 });
  } catch (error) {
    console.error('POST /api/calls/log error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
