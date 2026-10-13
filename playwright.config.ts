import { defineConfig, devices } from '@playwright/test';

const BASE = (process.env.VITE_BASE_PATH ?? '/').replace(/\/?$/, '/');
const PORT = 4321;

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}${BASE}`,
    trace: 'retain-on-failure',
    timezoneId: 'UTC',
  },
  webServer: {
    command: `npx astro preview --port ${PORT} --host 127.0.0.1`,
    url: `http://localhost:${PORT}${BASE}`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  projects: [
    {
      name: 'desktop',
      testIgnore: /a11y|offline/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
    { name: 'pixel7', testIgnore: /a11y|offline/, use: { ...devices['Pixel 7'] } },
    { name: 'a11y', testMatch: /a11y/, use: { ...devices['Desktop Chrome'] } },
    { name: 'offline', testMatch: /offline/, use: { ...devices['Desktop Chrome'] } },
  ],
});
