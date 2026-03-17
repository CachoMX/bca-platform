import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { registerSchema } from '@/lib/validators';
import bcrypt from 'bcryptjs';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 5 attempts per 15 minutes per IP
    const ip = getClientIp(request);
    const limiter = rateLimit(`register:${ip}`, 5, 15 * 60 * 1000);
    if (!limiter.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 },
      );
    }

    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { name, lastname, email, password, timezone, city, state, country } =
      parsed.data;

    // Check for duplicate email
    const existing = await prisma.user.findUnique({
      where: { email },
    });
    if (existing) {
      return NextResponse.json(
        { error: 'Email already in use' },
        { status: 409 },
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user as pending (blocked, default role Remote Agent)
    // Admin must activate by setting status = false
    await prisma.user.create({
      data: {
        name,
        lastname,
        email,
        password: hashedPassword,
        idRole: 3,
        status: true,
        sendEmail: 0,
        timeZone: timezone || '',
        city: city || '',
        state: state || '',
        country: country || '',
      },
    });

    return NextResponse.json(
      {
        message:
          'Account created. Please wait for an admin to activate your account.',
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('POST /api/auth/register error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
