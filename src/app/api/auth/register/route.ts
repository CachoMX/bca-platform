import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { registerSchema } from '@/lib/validators';
import bcrypt from 'bcryptjs';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { sendEmail } from '@/lib/email';

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

    // Honeypot: bots fill hidden fields, real users don't
    if (body.website || body.phone2) {
      // Silently accept to not tip off the bot
      return NextResponse.json(
        { message: 'Account created. Please wait for an admin to activate your account.' },
        { status: 201 },
      );
    }

    // Timing: bots submit instantly, humans take at least a few seconds
    const formLoadedAt = body._t ? Number(body._t) : 0;
    if (formLoadedAt && Date.now() - formLoadedAt < 3000) {
      return NextResponse.json(
        { message: 'Account created. Please wait for an admin to activate your account.' },
        { status: 201 },
      );
    }

    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { name, lastname, email, password, timezone, city, state, country } =
      parsed.data;

    // Reject gibberish names: must be 2-30 chars, only letters/spaces/hyphens
    const nameRegex = /^[a-zA-ZÀ-ÿ\s\-']{2,30}$/;
    if (!nameRegex.test(name) || !nameRegex.test(lastname)) {
      return NextResponse.json(
        { error: 'Name must contain only letters, spaces, or hyphens (2-30 characters).' },
        { status: 400 },
      );
    }

    // Reject names that look like random strings (too many consonants in a row)
    const gibberishRegex = /[bcdfghjklmnpqrstvwxyz]{5,}/i;
    if (gibberishRegex.test(name) || gibberishRegex.test(lastname)) {
      return NextResponse.json(
        { error: 'Please enter a valid name.' },
        { status: 400 },
      );
    }

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

    // Notify admins about the new registration (fire-and-forget)
    notifyAdminsNewUser(name, lastname, email).catch((err) =>
      console.error('Admin notification email error:', err),
    );

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

async function notifyAdminsNewUser(name: string, lastname: string, email: string) {
  const to = [{ email: 'admin@benjaminchaise.com', name: 'Admin' }];

  const html = `
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
      <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-radius: 12px; padding: 24px; margin-bottom: 20px;">
        <h2 style="margin: 0; color: #ffffff; font-size: 18px;">New Account Registration</h2>
        <p style="margin: 8px 0 0 0; color: #94a3b8; font-size: 13px;">A new user is waiting for activation</p>
      </div>
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px;">
        <p style="margin: 0; font-size: 12px; color: #64748b;">Name</p>
        <p style="margin: 2px 0 12px 0; font-size: 15px; color: #0f172a; font-weight: 600;">${name} ${lastname}</p>
        <p style="margin: 0; font-size: 12px; color: #64748b;">Email</p>
        <p style="margin: 2px 0 0 0; font-size: 15px; color: #0891b2; font-weight: 600;">${email}</p>
      </div>
      <p style="margin: 20px 0 0 0; font-size: 13px; color: #64748b; text-align: center;">
        Go to <strong>Admin → Users</strong> to activate this account.
      </p>
    </div>
  `;

  await sendEmail({
    to,
    subject: `New Registration: ${name} ${lastname}`,
    html,
  });
}
