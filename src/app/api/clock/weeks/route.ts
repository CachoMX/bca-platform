import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getTodayRangePST } from '@/lib/time';

/**
 * Get the Friday start date for the work week containing the given date.
 * Work week: Friday to Thursday.
 */
function getFridayStart(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayOfWeek = d.getDay(); // 0=Sun, 1=Mon, ..., 5=Fri, 6=Sat
  const daysSinceFriday = (dayOfWeek + 2) % 7;
  d.setDate(d.getDate() - daysSinceFriday);
  return d;
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { todayStart } = getTodayRangePST();
    const currentFriday = getFridayStart(todayStart);

    // Generate week start dates (Fridays) for the last 24 months
    const weeks: { date: string; label: string }[] = [];
    const maxWeeks = 24 * 4.33; // Approximately 24 months of weeks (~104 weeks)
    const tempDate = new Date(currentFriday);

    for (let i = 0; i < Math.ceil(maxWeeks); i++) {
      const dateStr = tempDate.toISOString().split('T')[0];
      const endDate = new Date(tempDate);
      endDate.setDate(endDate.getDate() + 6);
      const label = `${tempDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      weeks.push({ date: dateStr, label });
      tempDate.setDate(tempDate.getDate() - 7);
    }

    return NextResponse.json({ data: weeks });
  } catch (error) {
    console.error('Clock weeks error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
