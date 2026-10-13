import { expect, test } from '@playwright/test';

test('after one visit everything works offline', async ({ page, context }) => {
  await page.goto('');
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
  await page.waitForFunction(
    async () => {
      const keys = await caches.keys();
      const name = keys.find((k) => k.includes('precache'));
      if (!name) return false;
      return (await (await caches.open(name)).keys()).length > 50;
    },
    null,
    { timeout: 60_000 },
  );
  await page.waitForTimeout(2000);
  await context.setOffline(true);
  await page.goto('sysdesign/consistent-hashing/');
  await expect(page.locator('h1')).toHaveText('Consistent Hashing');
  await page.goto('library/');
  await expect(page.locator('h1')).toHaveText(/Every napkin/);
  await page.goto('review/?topic=dsa%2Fbinary-search');
  await expect(page.getByRole('button', { name: /Show answer/ })).toBeVisible();
  await page.goto('never-cached-page/');
  await expect(page.getByRole('heading', { name: /in the dispenser yet/ })).toBeVisible();
});
