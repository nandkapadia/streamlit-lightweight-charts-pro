/**
 * E2E Visual Regression Tests for Chart Series
 *
 * Uses Playwright to load HTML test pages in a real browser and compare
 * screenshots with baselines. This provides true browser rendering verification
 * including CSS, fonts, and browser-specific rendering behavior.
 *
 * @see https://playwright.dev/docs/test-snapshots
 */

import { test, expect } from '@playwright/test';

/**
 * Helper to wait for chart to be ready
 */
async function waitForChartReady(page: any) {
  // Capture console errors
  const errors: string[] = [];
  page.on('console', (msg: any) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
      console.log('Browser console error:', msg.text());
    }
  });

  page.on('pageerror', (error: Error) => {
    console.log('Page error:', error.message);
    errors.push(error.message);
  });

  try {
    await page.evaluate(() => (window as any).testCaseReady);
    // Give extra time for any animations or final rendering
    await page.waitForTimeout(200);
  } catch (e) {
    console.log('Errors encountered:', errors);
    throw e;
  }
}

test.describe('Line Series E2E Visual', () => {
  test('renders line series correctly', async ({ page }) => {
    await page.goto('/line-series.html');
    await waitForChartReady(page);

    const container = page.locator('#container');
    await expect(container).toHaveScreenshot('line-series.png', {
      maxDiffPixelRatio: 0.02,
    });
  });
});

test.describe('Area Series E2E Visual', () => {
  test('renders area series with gradient', async ({ page }) => {
    await page.goto('/area-series.html');
    await waitForChartReady(page);

    const container = page.locator('#container');
    await expect(container).toHaveScreenshot('area-series.png', {
      maxDiffPixelRatio: 0.02,
    });
  });
});

test.describe('Candlestick Series E2E Visual', () => {
  test('renders candlestick series', async ({ page }) => {
    await page.goto('/candlestick-series.html');
    await waitForChartReady(page);

    const container = page.locator('#container');
    await expect(container).toHaveScreenshot('candlestick-series.png', {
      maxDiffPixelRatio: 0.02,
    });
  });
});

test.describe('Bar and Histogram Series E2E Visual', () => {
  test('renders bar series', async ({ page }) => {
    await page.goto('/bar-histogram-series.html');
    await waitForChartReady(page);

    const barContainer = page.locator('#bar-container');
    await expect(barContainer).toHaveScreenshot('bar-series.png', {
      maxDiffPixelRatio: 0.02,
    });
  });

  test('renders histogram series', async ({ page }) => {
    await page.goto('/bar-histogram-series.html');
    await waitForChartReady(page);

    const histogramContainer = page.locator('#histogram-container');
    await expect(histogramContainer).toHaveScreenshot('histogram-series.png', {
      maxDiffPixelRatio: 0.02,
    });
  });
});

test.describe('Baseline Series E2E Visual', () => {
  test('renders baseline series', async ({ page }) => {
    await page.goto('/baseline-series.html');
    await waitForChartReady(page);

    const container = page.locator('#container');
    await expect(container).toHaveScreenshot('baseline-series.png', {
      maxDiffPixelRatio: 0.02,
    });
  });
});
