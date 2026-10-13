import { expect, test } from './_fixtures';

test('search finds a napkin and Enter opens it', async ({ page }) => {
  await page.goto('');
  await page.waitForLoadState('networkidle');
  await page.locator('[data-open-search]:visible').first().click();
  const input = page.getByRole('searchbox', { name: 'Search napkins' });
  await expect(input).toBeFocused();
  await input.fill('hashing');
  await expect(page.locator('.sp__item').first()).toContainText('Consistent Hashing');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/consistent-hashing/);
});

test('search says when nothing matches and closes on Escape', async ({ page }) => {
  await page.goto('library/');
  await page.waitForLoadState('networkidle');
  await page.locator('[data-open-search]:visible').first().click();
  await page.getByRole('searchbox', { name: 'Search napkins' }).fill('zzzzqqq');
  await expect(page.locator('.sp__empty')).toContainText('No napkin matches');
  await page.keyboard.press('Escape');
  await expect(page.locator('.sp')).toHaveCount(0);
});

test('the library filters by track and by text', async ({ page }) => {
  await page.goto('library/?track=ds');
  await expect(page.locator('[data-section="dsa"]')).toBeHidden();
  await expect(page.locator('[data-section="ds"]')).toBeVisible();
  await page.goto('library/');
  await page.getByRole('searchbox', { name: 'Filter napkins' }).fill('quorum');
  await expect(page.locator('.lib__list > li:visible')).toHaveCount(1);
});
