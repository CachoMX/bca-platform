import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { updateUserSchema } from '@/lib/validators';
import bcrypt from 'bcryptjs';

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

    const user = await prisma.user.findUnique({
      where: { idUser },
      include: {
        role: { select: { role: true } },
        schedules: {
          orderBy: { dayOfWeek: 'asc' },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Transform to match frontend User interface
    return NextResponse.json({
      userId: user.idUser,
      name: user.name ?? '',
      lastname: user.lastname ?? '',
      email: user.email ?? '',
      role: user.idRole ?? 4,
      isActive: user.status !== true,
      isPartTime: user.isPartTime === true,
      timezone: user.timeZone ?? '',
      city: user.city ?? '',
      state: user.state ?? '',
      country: user.country ?? '',
      schedules: user.schedules,
    });
  } catch (error) {
    console.error('GET /api/users/[id] error:', error);
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
    const parsed = updateUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const existing = await prisma.user.findUnique({ where: { idUser } });
    if (!existing) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { password, roleId, timezone, ...rest } = parsed.data;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: Record<string, any> = {
      ...rest,
    };

    if (roleId !== undefined) {
      data.idRole = roleId;
    }

    if (timezone !== undefined) {
      data.timeZone = timezone;
    }

    if (password) {
      data.password = await bcrypt.hash(password, 10);
    }

    // Check email uniqueness if email is being changed
    if (rest.email && rest.email !== existing.email) {
      const emailTaken = await prisma.user.findUnique({
        where: { email: rest.email },
      });
      if (emailTaken) {
        return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
      }
    }

    const user = await prisma.user.update({
      where: { idUser },
      data,
      include: {
        role: { select: { role: true } },
      },
    });

    const { password: _pw, ...safeUser } = user;

    return NextResponse.json(safeUser);
  } catch (error) {
    console.error('PUT /api/users/[id] error:', error);
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

    const role = (session.user as { role: number }).role;
    if (role !== 1) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const idUser = Number(id);
    if (isNaN(idUser)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { idUser } });
    if (!existing) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Soft delete: set status to 1 (blocked in old app convention)
    await prisma.user.update({
      where: { idUser },
      data: { status: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/users/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
