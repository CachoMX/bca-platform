import { test, expect } from '@playwright/test';

const BASE = 'https://yourdebtcollectors.com';
const EMAIL = 'caragon@me.com';
const PASS = 'Aragon21!';

test('PulseBC branding on login page', async ({ page }) => {
  test.setTimeout(120000);
  await page.goto(BASE + '/login', { waitUntil: 'networkidle', timeout: 60000 });

  const title = await page.title();
  console.log('Page title:', title);

  const logoImg = page.locator('img[alt="PulseBC"]');
  const logoVisible = await logoImg.isVisible().catch(() => false);
  console.log('Logo icon visible:', logoVisible);

  const h1Text = await page.locator('h1').textContent();
  console.log('H1 text:', h1Text);

  expect(title).toContain('PulseBC');
  expect(h1Text).toContain('PulseBC');
});

test('PulseBC sidebar branding after login', async ({ page }) => {
  test.setTimeout(120000);
  await page.goto(BASE + '/login', { waitUntil: 'networkidle', timeout: 60000 });
  await page.fill('input[type="email"]', EMAIL);
  await page.fill('input[type="password"]', PASS);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 30000 });
  await page.reload({ waitUntil: 'networkidle', timeout: 60000 });

  const sidebar = page.locator('aside');
  const sidebarLogo = sidebar.locator('img[alt="PulseBC"]');
  const logoVisible = await sidebarLogo.isVisible().catch(() => false);
  console.log('Sidebar logo:', logoVisible);

  const sidebarText = await sidebar.innerText();
  console.log('Has PulseBC text:', sidebarText.includes('PulseBC'));

  const links = await sidebar.locator('a').all();
  console.log('Nav links:', links.length);

  expect(sidebarText).toContain('PulseBC');
  expect(links.length).toBeGreaterThan(0);
});
