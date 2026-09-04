import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  {
    test: {
      name: 'unit',
      include: ['**/*.test.ts'],
      exclude: ['**/integration/**', '**/e2e/**', '**/node_modules/**', '**/dist/**'],
      environment: 'node',
      globals: true,
    }
  },
  {
    test: {
      name: 'integration',
      include: ['**/integration/**/*.test.ts'],
      exclude: ['**/node_modules/**', '**/dist/**'],
      environment: 'node',
      globals: true,
    }
  },
  {
    test: {
      name: 'e2e',
      include: ['**/e2e/**/*.test.ts'],
      exclude: ['**/node_modules/**', '**/dist/**'],
      environment: 'node',
      globals: true,
    }
  }
]);
