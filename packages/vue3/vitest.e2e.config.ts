import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['__tests__/e2e/**/*.test.ts', '__tests__/rendering/**/*.test.ts'],
    exclude: ['node_modules'],
    testTimeout: 30000,
    hookTimeout: 30000,
    setupFiles: ['__tests__/setup.ts', '__tests__/e2e/setup.ts'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
