import { test } from '@playwright/test';

test('run database cleanup for doubled quotes', async ({ page }) => {
  test.setTimeout(120000);

  // Login
  await page.goto('https://yourdebtcollectors.com/login', { waitUntil: 'networkidle', timeout: 60000 });
  await page.fill('input[type="email"]', 'caragon@me.com');
  await page.fill('input[type="password"]', 'Aragon21!');
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 30000 });

  // Call cleanup endpoint
  const result = await page.evaluate(async () => {
    const res = await fetch('/api/admin/cleanup-quotes', { method: 'POST' });
    return { status: res.status, body: await res.json() };
  });
  console.log('Cleanup result:', JSON.stringify(result));
});
