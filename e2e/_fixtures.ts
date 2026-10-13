import { test as base, expect } from '@playwright/test';

/** Every test fails on an uncaught page error or a console error. */
export const test = base.extend<{ errors: string[] }>({
  errors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
      page.on('console', (m) => {
        if (m.type() === 'error' && !m.text().startsWith('Failed to load resource'))
          errors.push(`console: ${m.text()}`);
      });
      page.on('response', (r) => {
        if (r.status() >= 400 && !r.url().includes('not-a-page') && !r.url().includes('never-cached'))
          errors.push(`http ${r.status()}: ${r.url()}`);
      });
      await use(errors);
      expect(errors, errors.join('\n')).toEqual([]);
    },
    { auto: true },
  ],
});
export { expect };
