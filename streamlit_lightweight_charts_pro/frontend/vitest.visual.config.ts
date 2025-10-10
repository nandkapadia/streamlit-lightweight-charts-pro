/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Vitest Configuration for Visual Regression Tests
 *
 * This configuration is optimized for visual regression testing with:
 * - Separate test directory (src/__tests__/visual)
 * - Canvas rendering with pixel-by-pixel comparison
 * - Memory-efficient sequential execution
 * - No interference with unit tests
 *
 * Visual tests verify actual canvas rendering output, not just mock calls.
 */
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/visual/setup.ts'],

    // Only include visual tests
    include: ['src/__tests__/visual/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'build', 'dist', 'src/__tests__/visual/__snapshots__', 'src/__tests__/visual/utils'],

    // Longer timeout for chart rendering
    testTimeout: 30000,

    // Silent mode to reduce console noise
    silent: false,
    reporters: ['verbose'],

    // No coverage for visual tests
    coverage: {
      enabled: false,
    },

    // Configure jsdom for canvas support
    environmentOptions: {
      jsdom: {
        resources: 'usable',
      },
    },

    // Memory management - visual tests run sequentially
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
        isolate: true,
        maxForks: 1,
        minForks: 1,
      },
    },

    // Sequential execution for stable rendering
    maxConcurrency: 1,
    watch: false,
    sequence: {
      shuffle: false,
      concurrent: false,
      hooks: 'stack',
    },
    fileParallelism: false,
    hookTimeout: 30000,
    logHeapUsage: true,
  },

  resolve: {
    alias: {
      '@': './src',
    },
  },
});
