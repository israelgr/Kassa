import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  {
    test: {
      name: 'api',
      root: './apps/api',
      environment: 'node',
      include: ['src/**/*.test.ts'],
      globals: true,
    },
  },
  {
    test: {
      name: 'web',
      root: './apps/web',
      environment: 'jsdom',
      include: ['src/**/*.test.{ts,tsx}'],
      globals: true,
      setupFiles: ['./src/test/setup.ts'],
    },
  },
]);
