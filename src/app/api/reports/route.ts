import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { reportFilterSchema } from '@/lib/validators';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = (session.user as { role: number }).role;
    if (role !== 1 && role !== 2) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = request.nextUrl;
    // Accept both 'rep' and 'repId' param names
    const repParam = searchParams.get('rep') || searchParams.get('repId') || undefined;
    const parsed = reportFilterSchema.safeParse({
      rep: repParam,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      disposition: searchParams.get('disposition') || undefined,
      page: searchParams.get('page') || 1,
      pageSize: searchParams.get('pageSize') || 50,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { rep, startDate, endDate, disposition, page, pageSize } = parsed.data;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = {};

    if (rep) {
      where.idUser = Number(rep);
    }

    if (disposition) {
      where.idDisposition = Number(disposition);
    }

    if (startDate || endDate) {
      const dateFilter: Record<string, Date> = {};
      if (startDate) dateFilter.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.lte = end;
      }
      where.callDate = dateFilter;
    }

    const format = searchParams.get('format');
    const acceptHeader = request.headers.get('accept') || '';
    const wantsCsv = format === 'csv' || acceptHeader.includes('text/csv');

    if (wantsCsv) {
      // Require at least one filter for CSV export to prevent full table dumps
      if (!rep && !startDate && !endDate && !disposition) {
        return NextResponse.json(
          { error: 'Please apply at least one filter before exporting CSV' },
          { status: 400 },
        );
      }

      // CSV export — capped at 100k rows for safety
      const calls = await prisma.call.findMany({
        where,
        include: {
          user: { select: { name: true, lastname: true } },
          business: { select: { businessName: true } },
          disposition: { select: { disposition: true } },
        },
        orderBy: { callDate: 'desc' },
        take: 100_000,
      });

      const header = 'Call ID,Date,Rep,Business,Disposition,Comments,DM Name,DM Email,DM Phone,Debt Amount,Debtor Name,Agreement Sent';
      const rows = calls.map((c) => {
        const repName = `${c.user.name} ${c.user.lastname}`.replace(/"/g, '""');
        const bizName = (c.business.businessName || '').replace(/"/g, '""');
        const disp = (c.disposition?.disposition || '').replace(/"/g, '""');
        const comments = (c.comments || '').replace(/"/g, '""');
        return [
          c.idCall,
          c.callDate.toISOString(),
          `"${repName}"`,
          `"${bizName}"`,
          `"${disp}"`,
          `"${comments}"`,
          `"${(c.dMakerName || '').replace(/"/g, '""')}"`,
          `"${(c.dMEmail || '').replace(/"/g, '""')}"`,
          `"${(c.dMPhone || '').replace(/"/g, '""')}"`,
          c.pDebtorAmmount ?? '',
          `"${(c.pDebtorName || '').replace(/"/g, '""')}"`,
          c.agreementSent ?? '',
        ].join(',');
      });

      const csv = [header, ...rows].join('\n');
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="call-report.csv"',
        },
      });
    }

    // Standard JSON response with pagination
    const [calls, total] = await Promise.all([
      prisma.call.findMany({
        where,
        include: {
          user: { select: { name: true, lastname: true } },
          business: { select: { businessName: true } },
          disposition: { select: { disposition: true } },
        },
        orderBy: { callDate: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.call.count({ where }),
    ]);

    // Transform to match frontend ReportRow interface
    const data = calls.map((c) => ({
      idCall: c.idCall,
      callDate: c.callDate.toISOString(),
      repName: `${c.user.name ?? ''} ${c.user.lastname ?? ''}`.trim(),
      businessName: c.business.businessName ?? '',
      disposition: c.disposition?.disposition ?? '',
      dmakerName: c.dMakerName ?? null,
      comments: c.comments ?? null,
    }));

    return NextResponse.json({
      data,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('GET /api/reports error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
