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
    // Suppress expected console output from performance monitor tests
    silent: false,
    reporters: ['verbose'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/setupTests.ts',
        'src/**/*.d.ts',
        'src/__tests__/setup/**',
        'src/__mocks__/**',
        'src/test-utils/**',
        'build/**',
        'dist/**',
        // Exclude test files from coverage
        'src/**/*.test.ts',
        'src/**/*.test.tsx',
        'src/**/*.spec.ts',
        'src/**/*.spec.tsx',
        // Exclude example/demo files
        'src/**/examples/**',
        'src/**/demo/**',
        // Exclude type definition files
        'src/**/types.ts',
        'src/**/index.ts'
      ],
      // Set coverage thresholds to maintain quality
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 75,
        lines: 80
      },
      // Enable all coverage checks
      all: true,
      // Clean coverage directory before each run
      clean: true,
      // Include source files
      include: [
        'src/**/*.ts',
        'src/**/*.tsx'
      ]
    },
    // Configure test timeout
    testTimeout: 10000,
    // Handle ES modules properly
    deps: {
      optimizer: {
        web: {
          exclude: []
        }
      }
    },
    // Configure environment more specifically for React testing
    environmentOptions: {
      jsdom: {
        resources: 'usable'
      }
    },
    // Memory management and performance optimizations
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
        isolate: true,  // Changed to true for better cleanup
        maxForks: 1,
        minForks: 1
      }
    },
    // Reduce memory usage - run tests sequentially
    maxConcurrency: 1,
    // Disable file watching for better memory management
    watch: false,
    // Run tests in sequence with isolation for cleanup
    sequence: {
      shuffle: false,
      concurrent: false,
      hooks: 'stack'
    },
    // Optimize for memory - run files one at a time
    fileParallelism: false,
    // Set shorter timeouts to fail fast
    hookTimeout: 30000,
    // Force garbage collection more aggressively
    logHeapUsage: true,
    // Bail on first failure to save memory (optional)
    bail: 0
  },
  // Resolve configuration for better module resolution
  resolve: {
    alias: {
      '@': './src'
    }
  }
});
