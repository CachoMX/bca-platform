import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { importValidateSchema } from '@/lib/validators';

function cleanPhone(phone: string): { formatted: string; digits: string } {
  const digits = phone.replace(/\D/g, '');
  // Format as (XXX) XXX-XXXX if 10 digits, +X (XXX) XXX-XXXX if 11
  let formatted = digits;
  if (digits.length === 10) {
    formatted = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  } else if (digits.length === 11 && digits.startsWith('1')) {
    formatted = `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return { formatted, digits };
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = (session.user as { role: number }).role;
    if (role !== 1) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = importValidateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { data } = parsed.data;
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNum = i + 1;

      try {
        const businessName = row.businessName || row.BusinessName || '';
        const phone = row.phone || row.Phone || '';
        const address = row.address || row.Address || '';
        const location = row.location || row.Location || '';
        const industry = row.industry || row.Industry || '';
        const timeZone = row.timeZone || row.TimeZone || row.timezone || '';

        if (!businessName) {
          errors.push(`Row ${rowNum}: Missing business name`);
          skipped++;
          continue;
        }

        if (!phone) {
          errors.push(`Row ${rowNum}: Missing phone number`);
          skipped++;
          continue;
        }

        const { formatted, digits } = cleanPhone(phone);

        if (digits.length < 10) {
          errors.push(`Row ${rowNum}: Invalid phone number "${phone}"`);
          skipped++;
          continue;
        }

        // Check for duplicate phone (by digits)
        const existingBusiness = await prisma.business.findFirst({
          where: { phoneDigits: digits },
        });

        if (existingBusiness) {
          errors.push(`Row ${rowNum}: Duplicate phone number "${phone}" (business "${existingBusiness.businessName}")`);
          skipped++;
          continue;
        }

        await prisma.business.create({
          data: {
            businessName,
            phone: formatted,
            phoneDigits: digits,
            address,
            location,
            industry,
            timeZone,
            idStatus: 3, // available
          },
        });

        imported++;
      } catch (err) {
        errors.push(`Row ${rowNum}: ${err instanceof Error ? err.message : 'Unknown error'}`);
        skipped++;
      }
    }

    return NextResponse.json({ imported, skipped, errors });
  } catch (error) {
    console.error('POST /api/import error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
