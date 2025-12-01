/**
 * E2E Visual Regression Tests for Multi-Chart Scenarios
 *
 * @see https://playwright.dev/docs/test-snapshots
 */

import { test, expect } from '@playwright/test';

async function waitForChartReady(page: any) {
  await page.evaluate(() => (window as any).testCaseReady);
  await page.waitForTimeout(200);
}

test.describe('Multi-Chart Scenarios', () => {
  test('renders two independent charts', async ({ page }) => {
    await page.goto('/two-charts.html');
    await waitForChartReady(page);

    const chart1 = page.locator('#chart-1');
    const chart2 = page.locator('#chart-2');

    await expect(chart1).toHaveScreenshot('two-charts-1.png', {
      maxDiffPixelRatio: 0.02,
    });

    await expect(chart2).toHaveScreenshot('two-charts-2.png', {
      maxDiffPixelRatio: 0.02,
    });
  });

  test('renders synchronized charts', async ({ page }) => {
    await page.goto('/synchronized-charts.html');
    await waitForChartReady(page);

    const container = page.locator('#container');
    await expect(container).toHaveScreenshot('synchronized-charts.png', {
      maxDiffPixelRatio: 0.02,
    });
  });

  test('renders chart grid layout', async ({ page }) => {
    await page.goto('/chart-grid.html');
    await waitForChartReady(page);

    const container = page.locator('#grid-container');
    await expect(container).toHaveScreenshot('chart-grid.png', {
      maxDiffPixelRatio: 0.02,
    });
  });

  test('handles chart in modal', async ({ page }) => {
    await page.goto('/chart-in-modal.html');
    await waitForChartReady(page);

    // Open modal
    await page.click('[data-action="open-modal"]');
    await page.waitForTimeout(300);

    const modal = page.locator('#modal');
    await expect(modal).toHaveScreenshot('chart-in-modal.png', {
      maxDiffPixelRatio: 0.02,
    });
  });
});
