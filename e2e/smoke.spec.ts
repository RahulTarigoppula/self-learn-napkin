import { expect, test } from './_fixtures';

const ROUTES = [
  ['', /Hard ideas/],
  ['library/', /Every napkin/],
  ['dsa/', /Data Structures/],
  ['sysdesign/', /System Design/],
  ['ds/', /Data Science/],
  ['sysdesign/consistent-hashing/', /Consistent Hashing/],
  ['progress/', /Little and often/],
  ['settings/', /Settings/],
  ['cheatsheet/', /Cheat sheet/],
  ['paths/system-design-kit/', /System design interview kit/],
  ['quiz/', /Quick quiz/],
  ['about/', /drew it/],
] as const;

for (const [path, heading] of ROUTES) {
  test(`/${path} renders without errors or sideways scroll`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator('h1').first()).toHaveText(heading);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });
}

test('unknown pages get the 404 napkin', async ({ page }) => {
  const res = await page.goto('definitely-not-a-page/');
  expect(res?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: 'Not on the menu' })).toBeVisible();
});
