import { readFileSync } from 'node:fs';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const numbers = JSON.parse(readFileSync('src/content/numbers.json', 'utf8')) as Record<string, number>;

test.setTimeout(600_000);
for (const theme of ['light', 'dark'] as const)
  test(`all napkins (${theme})`, async ({ page }) => {
    const problems: string[] = [];
    page.on('pageerror', (e) => problems.push(`pageerror ${page.url()}: ${e.message}`));
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
    for (const id of Object.keys(numbers)) {
      await page.goto(`${id}/`);
      const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
      for (const v of r.violations.filter((x) => x.impact === 'serious' || x.impact === 'critical'))
        problems.push(
          `${id}: ${v.id} ${v.nodes
            .slice(0, 2)
            .map((n) => n.target.join(' '))
            .join(' | ')}`,
        );
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      if (overflow > 1) problems.push(`${id}: horizontal overflow ${overflow}px`);
    }
    expect(problems).toEqual([]);
  });
