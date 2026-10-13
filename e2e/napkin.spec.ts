import { expect, test } from './_fixtures';

test('the story draws scene by scene and finishing marks the napkin read', async ({ page }) => {
  await page.goto('sysdesign/consistent-hashing/');
  const story = page.locator('[data-story]');
  await expect(story.locator('.scene[data-active]')).toContainText('Scene 1');
  const next = story.locator('[data-next]');
  await next.click();
  await expect(story.locator('.scene[data-active]')).toContainText('Scene 2');
  await expect(story.locator('g.is-future').first()).toBeAttached();
  await story.locator('[data-prev]').click();
  await expect(story.locator('.scene[data-active]')).toContainText('Scene 1');
  const n = Number(await story.getAttribute('data-steps'));
  for (let i = 1; i < n; i++) await next.click();
  await expect(next).toContainText('Finish');
  await next.click();
  await expect(story).toHaveAttribute('data-finished', '');
  await expect(story.locator('g.is-future')).toHaveCount(0);
  await page.waitForTimeout(400);
  await page.goto('library/');
  await expect(page.locator('[data-slug="sysdesign/consistent-hashing"]')).toHaveAttribute('data-read', 'true');
});

test('the quiz explains every answer and scores the round', async ({ page }) => {
  await page.goto('sysdesign/consistent-hashing/');
  const items = page.locator('.quiz__item');
  const count = await items.count();
  expect(count).toBeGreaterThanOrEqual(2);
  for (let i = 0; i < count; i++) {
    const item = items.nth(i);
    await item.locator('.quiz__opt').first().click();
    await expect(item.locator('.quiz__why')).toBeVisible();
    await expect(item.locator('.quiz__opt[data-correct]')).toHaveCount(1);
  }
  await expect(page.locator('.quiz__score-num')).toHaveText(new RegExp(`/${count}$`));
});

test('flashcards flip and the deep dive shows highlighted code', async ({ page }) => {
  await page.goto('dsa/binary-search/');
  const card = page.locator('.fc').first();
  await card.locator('button').click();
  await expect(card).toHaveAttribute('data-open', '');
  await expect(page.locator('#deep-dive pre.astro-code').first()).toBeVisible();
});

test('the bubble-sort playground runs to completion', async ({ page }) => {
  await page.goto('dsa/bubble-sort/');
  const g = page.locator('#griddle .gd');
  await g.scrollIntoViewIfNeeded();
  await g.getByRole('button', { name: '2 speed' }).click();
  await g.getByRole('button', { name: 'Run' }).click();
  await expect(g.locator('.gd__caption')).toContainText('done', { timeout: 30_000 });
});

test('the hash-ring playground moves only one slice of keys', async ({ page }) => {
  await page.goto('sysdesign/consistent-hashing/');
  const g = page.locator('#griddle .gd');
  await g.scrollIntoViewIfNeeded();
  await g.getByRole('button', { name: 'Add server D' }).click();
  await expect(g.locator('.gd__caption')).toContainText('keys moved');
});
