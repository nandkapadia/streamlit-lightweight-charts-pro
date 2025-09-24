/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/setupTests.ts'],
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', 'build', 'dist'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/setupTests.ts',
        'src/**/*.d.ts',
        'src/__tests__/setup/**',
        'src/__mocks__/**',
        'src/test-utils/**',
        'build/**',
        'dist/**'
      ]
    },
    // Configure test timeout
    testTimeout: 10000,
    // Handle ES modules properly
    deps: {
      external: []
    },
    // Configure environment more specifically for React testing
    environmentOptions: {
      jsdom: {
        resources: 'usable'
      }
    }
  },
});
