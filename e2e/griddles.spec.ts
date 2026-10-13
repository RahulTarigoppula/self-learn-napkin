import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from './_fixtures';

// Every napkin with a playground: it must load, respond to Run / Step and never throw.
const root = 'src/content/cards';
const withGriddle = readdirSync(root).flatMap((track) =>
  readdirSync(join(root, track))
    .filter((f) => /^griddle:/m.test(readFileSync(join(root, track, f), 'utf8')))
    .map((f) => `${track}/${f.replace(/\.md$/, '')}`),
);

test('every playground loads and runs', async ({ page }) => {
  test.setTimeout(240_000);
  expect(withGriddle.length).toBeGreaterThanOrEqual(30);
  for (const slug of withGriddle) {
    await page.goto(`${slug}/`);
    const g = page.locator('#griddle .gd:not(.gd--empty)');
    await expect(g, slug).toBeVisible({ timeout: 15_000 });
    await g.scrollIntoViewIfNeeded();
    const step = g.getByRole('button', { name: 'Step forward', disabled: false });
    if (await step.count()) await step.first().click();
    const run = g.getByRole('button', { name: /^(Run|Replay)$/, disabled: false });
    if (await run.count()) {
      await run.first().click();
      await page.waitForTimeout(600);
    }
    await expect(g.locator('button, input, svg').first(), slug).toBeVisible();
  }
});
