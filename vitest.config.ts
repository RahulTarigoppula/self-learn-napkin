import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: ['tests/setup.ts'],
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          include: ['src/engine/**/*.test.ts', 'src/lib/**/*.test.ts'],
          environment: 'node',
        },
      },
      {
        extends: true,
        test: {
          name: 'component',
          include: ['src/features/**/*.test.tsx', 'src/db/**/*.test.ts'],
          environment: 'jsdom',
        },
      },
      {
        extends: true,
        test: {
          name: 'build',
          include: ['scripts/__tests__/**/*.test.mjs'],
          environment: 'node',
          testTimeout: 60_000,
        },
      },
    ],
    coverage: {
      provider: 'v8',
      include: ['src/engine/**'],
      exclude: ['**/*.test.ts'],
      thresholds: { lines: 95, branches: 90 },
    },
  },
});
