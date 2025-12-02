/**
 * E2E Visual Regression Tests for Browser-Specific Features
 *
 * @see https://playwright.dev/docs/test-snapshots
 */

import { test, expect } from '@playwright/test';

async function waitForChartReady(page: any) {
  await page.evaluate(() => (window as any).testCaseReady);
  await page.waitForTimeout(200);
}

test.describe('Browser Features', () => {
  test('auto-resizes chart on window resize', async ({ page }) => {
    await page.goto('/auto-size-chart.html');
    await waitForChartReady(page);

    // Initial size
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(300);

    const container = page.locator('#chart-container');
    await expect(container).toHaveScreenshot('auto-size-1280.png', {
      maxDiffPixelRatio: 0.02,
    });

    // Resize smaller
    await page.setViewportSize({ width: 800, height: 600 });
    await page.waitForTimeout(500);

    await expect(container).toHaveScreenshot('auto-size-800.png', {
      maxDiffPixelRatio: 0.02,
    });
  });

  test('renders dark mode correctly', async ({ page }) => {
    await page.goto('/dark-mode-chart.html');
    await waitForChartReady(page);

    const container = page.locator('#container');
    await expect(container).toHaveScreenshot('dark-mode-chart.png', {
      maxDiffPixelRatio: 0.02,
    });
  });

  test('applies CSS custom properties', async ({ page }) => {
    await page.goto('/css-variables-chart.html');
    await waitForChartReady(page);

    const container = page.locator('#container');
    await expect(container).toHaveScreenshot('css-variables-chart.png', {
      maxDiffPixelRatio: 0.02,
    });
  });

  test('renders with custom fonts', async ({ page }) => {
    await page.goto('/custom-font-chart.html');
    await waitForChartReady(page);

    const container = page.locator('#container');
    await expect(container).toHaveScreenshot('custom-font-chart.png', {
      maxDiffPixelRatio: 0.02,
    });
  });
});
