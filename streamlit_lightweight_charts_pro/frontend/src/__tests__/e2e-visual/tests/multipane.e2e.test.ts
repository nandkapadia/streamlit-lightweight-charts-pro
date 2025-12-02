/**
 * Multi-Pane E2E Visual Tests
 *
 * Tests multi-pane chart rendering with real browser layout calculations.
 * These tests use Playwright instead of jsdom because LightweightCharts v5's
 * pane height management requires actual browser layout engines.
 *
 * See: MULTI_PANE_LIMITATION.md for details on the jsdom limitation.
 */

import { test, expect } from '@playwright/test';

/**
 * Wait for chart to finish rendering
 */
async function waitForChartReady(page: any) {
  await page.evaluate(() => (window as any).testCaseReady);
  await page.waitForTimeout(200); // Additional time for layout to settle
}

test.describe('Multi-Pane Charts', () => {
  test('renders 2-pane chart (price + volume)', async ({ page }) => {
    await page.goto('/multipane-2pane-price-volume.html');
    await waitForChartReady(page);

    const container = page.locator('#container');
    await expect(container).toHaveScreenshot('multipane-2pane-price-volume.png', {
      maxDiffPixelRatio: 0.03,
    });
  });

  test('renders 3-pane chart (price + indicator + volume)', async ({ page }) => {
    await page.goto('/multipane-3pane-price-indicator-volume.html');
    await waitForChartReady(page);

    const container = page.locator('#container');
    await expect(container).toHaveScreenshot('multipane-3pane-price-indicator-volume.png', {
      maxDiffPixelRatio: 0.03,
    });
  });

  test('renders 4-pane chart', async ({ page }) => {
    await page.goto('/multipane-4pane.html');
    await waitForChartReady(page);

    const container = page.locator('#container');
    await expect(container).toHaveScreenshot('multipane-4pane.png', {
      maxDiffPixelRatio: 0.03,
    });
  });

  test('renders 2-pane with multiple series in same pane', async ({ page }) => {
    await page.goto('/multipane-2pane-multiple-series.html');
    await waitForChartReady(page);

    const container = page.locator('#container');
    await expect(container).toHaveScreenshot('multipane-2pane-multiple-series.png', {
      maxDiffPixelRatio: 0.03,
    });
  });

  test('renders 2-pane with custom heights', async ({ page }) => {
    await page.goto('/multipane-2pane-custom-heights.html');
    await waitForChartReady(page);

    const container = page.locator('#container');
    await expect(container).toHaveScreenshot('multipane-2pane-custom-heights.png', {
      maxDiffPixelRatio: 0.03,
    });
  });
});
