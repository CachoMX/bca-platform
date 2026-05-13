import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { updatePrinterSchema } from '@/lib/validators';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const printerId = parseInt(id, 10);
    if (isNaN(printerId)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }

    const body = await request.json();
    const parsed = updatePrinterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const data = parsed.data;
    const printer = await prisma.printer.update({
      where: { id: printerId },
      data: {
        ...data,
        // Clear sharedFolders when foldersSharing is turned off
        sharedFolders:
          data.foldersSharing === false ? null : data.sharedFolders,
      },
    });

    return NextResponse.json(printer);
  } catch (error) {
    console.error('PATCH /api/admin/maintenance/printers/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const printerId = parseInt(id, 10);
    if (isNaN(printerId)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }

    const printer = await prisma.printer.update({
      where: { id: printerId },
      data: { status: 'retired' },
    });

    return NextResponse.json(printer);
  } catch (error) {
    console.error('DELETE /api/admin/maintenance/printers/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
