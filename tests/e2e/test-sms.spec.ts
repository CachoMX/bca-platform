import { test, expect } from '@playwright/test';

const BASE = 'https://yourdebtcollectors.com';

test('SMS send works via app API', async ({ page }) => {
  test.setTimeout(120000);
  await page.goto(BASE + '/login', { waitUntil: 'networkidle', timeout: 60000 });
  await page.fill('input[type="email"]', 'caragon@me.com');
  await page.fill('input[type="password"]', 'Aragon21!');
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 30000 });

  // Call SMS API from within the authenticated session
  const result = await page.evaluate(async () => {
    const res = await fetch('/api/sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber: '+19162255887', messageBody: 'PulseBC SMS test from app' }),
    });
    return { status: res.status, body: await res.json() };
  });
  console.log('SMS API result:', JSON.stringify(result));
  expect(result.status).toBe(201);
  expect(result.body.success).toBe(true);
});
