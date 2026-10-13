import { expect, test } from './_fixtures';

test('the theme choice applies instantly and survives a reload', async ({ page }) => {
  await page.goto('settings/');
  const theme = page.getByRole('radiogroup', { name: 'Theme' });
  await theme.getByRole('radio', { name: 'Dark' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(bg).toBe('rgb(13, 15, 21)');
  await page.getByRole('radiogroup', { name: 'Theme' }).getByRole('radio', { name: 'Auto' }).click();
  await expect(page.locator('html')).not.toHaveAttribute('data-theme', /.+/);
});

test('backup export produces a schema-1 file', async ({ page }) => {
  await page.goto('settings/');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export backup' }).click();
  const file = await download;
  const chunks: Buffer[] = [];
  for await (const c of await file.createReadStream()) chunks.push(c as Buffer);
  const json = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  expect(json.schema).toBe(1);
  expect(json.app).toBe('napkin');
});
