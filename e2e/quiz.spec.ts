import { expect, test } from './_fixtures';

test('a quick-quiz round runs end to end and lists misses', async ({ page }) => {
  await page.goto('quiz/');
  await page.getByRole('radio', { name: '5' }).click();
  await page.getByRole('button', { name: 'Start the round' }).click();
  for (let i = 0; i < 5; i++) {
    await page.locator('.qq__opt').first().click();
    await expect(page.locator('.qq__why')).toBeVisible();
    await page.locator('.qq__why .btn--primary').click();
  }
  await expect(page.locator('.qq__score')).toHaveText(/\/5$/);
});

test('the about story steps through the journey without touching progress', async ({ page }) => {
  await page.goto('about/');
  const story = page.locator('[data-story]');
  await expect(story).not.toHaveAttribute('data-slug', /.+/);
  const next = story.locator('[data-next]');
  const n = Number(await story.getAttribute('data-steps'));
  for (let i = 1; i < n; i++) await next.click();
  await expect(story.locator('.scene[data-active]')).toContainText('So I drew Napkin');
});
