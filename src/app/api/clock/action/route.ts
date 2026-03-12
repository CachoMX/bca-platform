import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { clockActionSchema } from '@/lib/validators';

// Sequential order of clock actions
const ACTION_ORDER = [
  'clockIn',
  'firstBreakOut',
  'firstBreakIn',
  'lunchOut',
  'lunchIn',
  'secondBreakOut',
  'secondBreakIn',
  'clockOut',
] as const;

function getNowPST(): Date {
  // Get current time in PST
  const now = new Date();
  const pstString = now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' });
  return new Date(pstString);
}

function getTodayRangePST(): { todayStart: Date; todayEnd: Date } {
  const pstNow = getNowPST();
  const todayStart = new Date(Date.UTC(pstNow.getFullYear(), pstNow.getMonth(), pstNow.getDate()));
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);
  return { todayStart, todayEnd };
}

function applyEarlyClockInRule(time: Date): Date {
  const pstTime = getNowPST();
  if (pstTime.getHours() < 6) {
    // Set to 6:00 AM today in PST
    const adjusted = new Date(pstTime.getFullYear(), pstTime.getMonth(), pstTime.getDate(), 6, 0, 0, 0);
    return adjusted;
  }
  return time;
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as { userId: number }).userId;
    const body = await request.json();

    const parsed = clockActionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid action', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { action } = parsed.data;
    const now = new Date();
    const { todayStart, todayEnd } = getTodayRangePST();

    // Find today's time log
    let log = await prisma.employeeTimeLog.findFirst({
      where: {
        idUser: userId,
        logDate: {
          gte: todayStart,
          lt: todayEnd,
        },
      },
    });

    // Validate sequential order
    if (action === 'clockIn') {
      if (log?.clockIn) {
        return NextResponse.json({ error: 'Already clocked in today' }, { status: 400 });
      }
    } else {
      if (!log?.clockIn) {
        return NextResponse.json({ error: 'Must clock in first' }, { status: 400 });
      }
      if (log.clockOut) {
        return NextResponse.json({ error: 'Already clocked out for the day' }, { status: 400 });
      }

      // Verify the previous action in sequence is completed
      const actionIndex = ACTION_ORDER.indexOf(action as typeof ACTION_ORDER[number]);
      if (actionIndex > 0) {
        const previousAction = ACTION_ORDER[actionIndex - 1];
        const previousValue = log[previousAction as keyof typeof log];
        if (!previousValue) {
          return NextResponse.json(
            { error: `Cannot perform ${action}. Must complete ${previousAction} first.` },
            { status: 400 }
          );
        }
      }

      // Check if this action is already completed
      const currentValue = log[action as keyof typeof log];
      if (currentValue) {
        return NextResponse.json(
          { error: `${action} already recorded` },
          { status: 400 }
        );
      }
    }

    // Lunch minimum 30-minute rule
    if (action === 'lunchIn' && log?.lunchOut) {
      const lunchOutTime = new Date(log.lunchOut).getTime();
      const nowTime = now.getTime();
      const minutesElapsed = (nowTime - lunchOutTime) / (1000 * 60);

      if (minutesElapsed < 30) {
        const remaining = Math.ceil(30 - minutesElapsed);
        return NextResponse.json(
          { error: `Lunch must be at least 30 minutes. ${remaining} minute(s) remaining.` },
          { status: 400 }
        );
      }
    }

    // Determine the time to record
    let recordTime = now;
    if (action === 'clockIn') {
      recordTime = applyEarlyClockInRule(now);
    }

    // Perform the action
    if (action === 'clockIn') {
      if (log) {
        // Update existing log (e.g., created by skip action)
        log = await prisma.employeeTimeLog.update({
          where: { timeLogId: log.timeLogId },
          data: { clockIn: recordTime },
        });
      } else {
        log = await prisma.employeeTimeLog.create({
          data: {
            idUser: userId,
            logDate: todayStart,
            clockIn: recordTime,
            isModifiedByAdmin: false,
          },
        });
      }
    } else {
      log = await prisma.employeeTimeLog.update({
        where: { timeLogId: log!.timeLogId },
        data: { [action]: recordTime },
      });
    }

    return NextResponse.json({ data: log });
  } catch (error) {
    console.error('Clock action error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
