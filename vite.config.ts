import { defineConfig } from 'vitest/config';

// Relative base so the same build works on GitHub project pages and locally.
export default defineConfig({
  base: './',
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
