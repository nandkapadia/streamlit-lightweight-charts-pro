import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Configuration for Visual Regression Tests
 *
 * This configuration uses full browser rendering with screenshot comparison
 * to verify chart visual output. Unlike the node-canvas approach, this provides
 * true browser rendering with all CSS, fonts, and browser-specific rendering.
 *
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // Test directory
  testDir: './src/__tests__/e2e-visual',

  // Timeout per test
  timeout: 30000,

  // Expect timeout
  expect: {
    // Screenshot comparison settings
    timeout: 10000,
    toHaveScreenshot: {
      // Maximum pixel ratio difference allowed (0-1)
      maxDiffPixelRatio: 0.02, // 2% of pixels can differ
      // Per-pixel color threshold
      threshold: 0.2, // 20% color difference per pixel
      // Disable animations for consistent screenshots
      animations: 'disabled',
    },
  },

  // Fail on CI if test.only is left in code
  forbidOnly: !!process.env.CI,

  // Retry on CI
  retries: process.env.CI ? 2 : 0,

  // Workers (parallel test execution)
  workers: process.env.CI ? 1 : 2,

  // Reporter
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
    ...(process.env.CI ? [['github' as const]] : []),
  ],

  // Shared settings
  use: {
    // Base URL for test pages
    baseURL: 'http://localhost:8080',

    // Screenshot settings
    screenshot: 'only-on-failure',

    // Trace on retry
    trace: 'on-first-retry',

    // Viewport
    viewport: { width: 1280, height: 720 },

    // Device scale factor for consistent screenshots
    deviceScaleFactor: 1,
  },

  // Test projects (browsers)
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        deviceScaleFactor: 1,
      },
    },
    // Uncomment to test on other browsers
    // {
    //   name: 'firefox',
    //   use: {
    //     ...devices['Desktop Firefox'],
    //     deviceScaleFactor: 1,
    //   },
    // },
    // {
    //   name: 'webkit',
    //   use: {
    //     ...devices['Desktop Safari'],
    //     deviceScaleFactor: 1,
    //   },
    // },
  ],

  // Web server for test pages
  webServer: {
    command: 'npx http-server src/__tests__/e2e-visual/pages -p 8080 -c-1',
    port: 8080,
    timeout: 120000,
    reuseExistingServer: !process.env.CI,
  },
});
