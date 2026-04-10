import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

const SMS_API_URL = process.env.SMS_API_URL;
const SMS_USERNAME = process.env.SMS_USERNAME;
const SMS_PASSWORD = process.env.SMS_PASSWORD;
const DEVICE_ID = process.env.SMS_DEVICE_ID;

const SYNC_COOLDOWN_MS = 30_000; // 30 seconds — prevents hammering the Android if multiple tabs are open
let lastSyncAt = 0;

// Trigger inbox/export on the Android device for the last N minutes.
// The device will fire sms:received webhooks for each message found,
// which our /api/sms/webhook handler saves to the DB.
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!SMS_API_URL || !SMS_USERNAME || !SMS_PASSWORD || !DEVICE_ID) {
      return NextResponse.json({ error: 'SMS gateway not configured' }, { status: 503 });
    }

    // Debounce: skip if synced recently (handles multiple open browser tabs)
    const now = Date.now();
    if (now - lastSyncAt < SYNC_COOLDOWN_MS) {
      return NextResponse.json({ ok: true, skipped: true });
    }
    lastSyncAt = now;

    const credentials = Buffer.from(`${SMS_USERNAME}:${SMS_PASSWORD}`).toString('base64');

    // Export inbox for the last 5 minutes
    const until = new Date();
    const since = new Date(until.getTime() - 5 * 60 * 1000);

    const res = await fetch(`${SMS_API_URL}/messages/inbox/export`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        deviceId: DEVICE_ID,
        since: since.toISOString(),
        until: until.toISOString(),
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('SMS inbox/export error:', err);
      return NextResponse.json({ error: 'Export failed' }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('POST /api/sms/sync error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
