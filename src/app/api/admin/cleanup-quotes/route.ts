import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// One-time cleanup: fix CSV quoting artifacts in business names
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = (session.user as { role: number }).role;
    if (role !== 1) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Step 1: Replace any remaining doubled quotes "" → "
    const step1 = await prisma.$executeRawUnsafe(`
      UPDATE Businesses
      SET BusinessName = REPLACE(BusinessName, '""', '"')
      WHERE BusinessName LIKE '%""%'
    `);

    // Step 2: Strip outer wrapping quotes (names that start AND end with ")
    const step2 = await prisma.$executeRawUnsafe(`
      UPDATE Businesses
      SET BusinessName = SUBSTRING(BusinessName, 2, LEN(BusinessName) - 2)
      WHERE BusinessName LIKE '"%"'
        AND LEN(BusinessName) > 2
    `);

    // Step 3: Run step 1 again in case stripping outer quotes exposed more doubled quotes
    const step3 = await prisma.$executeRawUnsafe(`
      UPDATE Businesses
      SET BusinessName = REPLACE(BusinessName, '""', '"')
      WHERE BusinessName LIKE '%""%'
    `);

    return NextResponse.json({
      doubledQuotesFixed: step1,
      outerQuotesStripped: step2,
      remainingDoubledFixed: step3,
    });
  } catch (error) {
    console.error('POST /api/admin/cleanup-quotes error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
