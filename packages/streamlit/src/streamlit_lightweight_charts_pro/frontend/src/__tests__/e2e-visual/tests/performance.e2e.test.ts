/**
 * E2E Visual Regression Tests for Performance
 *
 * @see https://playwright.dev/docs/test-snapshots
 */

import { test, expect } from '@playwright/test';

async function waitForChartReady(page: any) {
  await page.evaluate(() => (window as any).testCaseReady);
  await page.waitForTimeout(200);
}

test.describe('Performance Tests', () => {
  test('renders large dataset without performance issues', async ({ page }) => {
    await page.goto('/large-dataset.html');

    const startTime = Date.now();
    await waitForChartReady(page);
    const renderTime = Date.now() - startTime;

    // Should render within reasonable time
    expect(renderTime).toBeLessThan(5000);

    const container = page.locator('#container');
    await expect(container).toHaveScreenshot('large-dataset.png', {
      maxDiffPixelRatio: 0.05, // Higher tolerance for large datasets
    });
  });

  test('handles smooth scrolling', async ({ page }) => {
    await page.goto('/smooth-scroll.html');
    await waitForChartReady(page);

    const container = page.locator('#container');
    await expect(container).toHaveScreenshot('smooth-scroll.png', {
      maxDiffPixelRatio: 0.02,
    });
  });

  test('renders multiple charts efficiently', async ({ page }) => {
    await page.goto('/multiple-charts-memory.html');

    const startTime = Date.now();
    await waitForChartReady(page);
    const renderTime = Date.now() - startTime;

    expect(renderTime).toBeLessThan(6000);

    const container = page.locator('#charts-grid');
    await expect(container).toHaveScreenshot('multiple-charts.png', {
      maxDiffPixelRatio: 0.03,
    });
  });
});
