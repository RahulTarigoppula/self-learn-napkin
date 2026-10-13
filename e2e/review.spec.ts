import { expect, test } from './_fixtures';

test('a topic review session: reveal, rate, receipt, progress', async ({ page }) => {
  await page.goto('review/?topic=sysdesign%2Fconsistent-hashing');
  await expect(page.getByRole('button', { name: /Show answer/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Good,/ })).toBeDisabled();
  for (let i = 0; i < 10; i++) {
    if (await page.locator('.receipt').isVisible()) break;
    await page.getByRole('button', { name: /Show answer/ }).click();
    await page.getByRole('button', { name: /^Easy,/ }).click();
    await page.waitForTimeout(400);
  }
  await expect(page.locator('.receipt pre')).toContainText('NAPKIN · ORDER #0001');
  await expect(page.locator('.receipt pre')).toContainText('CONSISTENT HASHING');
  await page.goto('progress/');
  await expect(page.locator('.pg__stat').nth(1)).toContainText(/[1-9]/);
});

test('keyboard-only review: Space reveals, 4 rates Easy and moves on', async ({ page }) => {
  await page.goto('review/?topic=dsa%2Fbinary-search');
  await expect(page.getByRole('button', { name: /Show answer/ })).toBeVisible();
  const before = await page.locator('.rv__count').textContent();
  await page.keyboard.press('Space');
  await expect(page.getByRole('button', { name: /^Good,/ })).toBeEnabled();
  await page.keyboard.press('4');
  await expect(page.locator('.rv__count')).not.toHaveText(before ?? '');
});
