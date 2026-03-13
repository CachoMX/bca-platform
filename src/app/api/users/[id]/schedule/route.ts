import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { scheduleSchema } from '@/lib/validators';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = (session.user as { role: number }).role;
    if (role !== 1) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const idUser = Number(id);
    if (isNaN(idUser)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const schedules = await prisma.employeeSchedule.findMany({
      where: { idUser },
      orderBy: { dayOfWeek: 'asc' },
    });

    const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // Transform to match frontend UserSchedule interface
    return NextResponse.json({
      userId: idUser,
      schedule: schedules.map((s) => ({
        day: DAY_NAMES[Number(s.dayOfWeek)] ?? s.dayOfWeek,
        startTime: s.startTime ? `${String(s.startTime.getUTCHours()).padStart(2, '0')}:${String(s.startTime.getUTCMinutes()).padStart(2, '0')}` : '09:00',
        endTime: s.endTime ? `${String(s.endTime.getUTCHours()).padStart(2, '0')}:${String(s.endTime.getUTCMinutes()).padStart(2, '0')}` : '17:00',
      })),
    });
  } catch (error) {
    console.error('GET /api/users/[id]/schedule error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = (session.user as { role: number }).role;
    if (role !== 1) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const idUser = Number(id);
    if (isNaN(idUser)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const body = await request.json();
    const parsed = scheduleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    // Verify user exists
    const user = await prisma.user.findUnique({ where: { idUser } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Delete existing schedule entries and recreate
    await prisma.$transaction([
      prisma.employeeSchedule.deleteMany({ where: { idUser } }),
      ...parsed.data.schedule.map((entry) => {
        const [sh, sm] = entry.startTime.split(':').map(Number);
        const [eh, em] = entry.endTime.split(':').map(Number);
        const startTime = new Date(Date.UTC(1970, 0, 1, sh, sm, 0));
        const endTime = new Date(Date.UTC(1970, 0, 1, eh, em, 0));
        return prisma.employeeSchedule.create({
          data: {
            idUser,
            dayOfWeek: String(entry.dayOfWeek),
            startTime,
            endTime,
          },
        });
      }),
    ]);

    // Return the newly created schedule
    const schedules = await prisma.employeeSchedule.findMany({
      where: { idUser },
      orderBy: { dayOfWeek: 'asc' },
    });

    const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    return NextResponse.json({
      userId: idUser,
      schedule: schedules.map((s) => ({
        day: DAY_NAMES[Number(s.dayOfWeek)] ?? s.dayOfWeek,
        startTime: s.startTime ? `${String(s.startTime.getUTCHours()).padStart(2, '0')}:${String(s.startTime.getUTCMinutes()).padStart(2, '0')}` : '09:00',
        endTime: s.endTime ? `${String(s.endTime.getUTCHours()).padStart(2, '0')}:${String(s.endTime.getUTCMinutes()).padStart(2, '0')}` : '17:00',
      })),
    });
  } catch (error) {
    console.error('PUT /api/users/[id]/schedule error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
