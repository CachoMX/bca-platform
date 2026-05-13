import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createPrinterSchema } from '@/lib/validators';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') ?? '';
    const statusFilter = searchParams.get('status') ?? '';

    const printers = await prisma.printer.findMany({
      where: {
        ...(statusFilter ? { status: statusFilter } : { status: { not: 'retired' } }),
        ...(search
          ? {
              OR: [
                { printerName: { contains: search } },
                { brandModel: { contains: search } },
                { location: { contains: search } },
                { ipAddress: { contains: search } },
              ],
            }
          : {}),
      },
      orderBy: { printerName: 'asc' },
    });

    return NextResponse.json(printers);
  } catch (error) {
    console.error('GET /api/admin/maintenance/printers error:', error);
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
    const parsed = createPrinterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { printerName, brandModel, ipAddress, location, foldersSharing, sharedFolders, notes } =
      parsed.data;

    const printer = await prisma.printer.create({
      data: {
        printerName,
        brandModel: brandModel ?? null,
        ipAddress: ipAddress ?? null,
        location: location ?? null,
        foldersSharing,
        sharedFolders: foldersSharing ? (sharedFolders ?? null) : null,
        notes: notes ?? null,
      },
    });

    return NextResponse.json(printer, { status: 201 });
  } catch (error) {
    console.error('POST /api/admin/maintenance/printers error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
