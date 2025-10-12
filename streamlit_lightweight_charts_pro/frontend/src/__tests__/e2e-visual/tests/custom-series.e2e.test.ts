/**
 * E2E Visual Regression Tests for Custom Series
 *
 * Tests custom series rendering in real browser environment including:
 * - TrendFill series
 * - Band series (Bollinger Bands style)
 * - Ribbon series
 * - Signal series
 * - GradientRibbon series
 *
 * @see https://playwright.dev/docs/test-snapshots
 */

import { test, expect } from '@playwright/test';

/**
 * Helper to wait for chart to be ready
 */
async function waitForChartReady(page: any) {
  await page.evaluate(() => (window as any).testCaseReady);
  await page.waitForTimeout(200);
}

test.describe('TrendFill Custom Series', () => {
  test('renders TrendFill series correctly', async ({ page }) => {
    await page.goto('/custom-trendfill.html');
    await waitForChartReady(page);

    const container = page.locator('#container');
    await expect(container).toHaveScreenshot('custom-trendfill.png', {
      maxDiffPixelRatio: 0.03, // Slightly higher tolerance for custom rendering
    });
  });
});

test.describe('Band Custom Series', () => {
  test('renders Band series (Bollinger Bands) correctly', async ({ page }) => {
    await page.goto('/custom-band.html');
    await waitForChartReady(page);

    const container = page.locator('#container');
    await expect(container).toHaveScreenshot('custom-band.png', {
      maxDiffPixelRatio: 0.03,
    });
  });
});

test.describe('Ribbon Custom Series', () => {
  test('renders Ribbon series correctly', async ({ page }) => {
    await page.goto('/custom-ribbon.html');
    await waitForChartReady(page);

    const container = page.locator('#container');
    await expect(container).toHaveScreenshot('custom-ribbon.png', {
      maxDiffPixelRatio: 0.03,
    });
  });
});

test.describe('Signal Custom Series', () => {
  test('renders Signal series correctly', async ({ page }) => {
    await page.goto('/custom-signal.html');
    await waitForChartReady(page);

    const container = page.locator('#container');
    await expect(container).toHaveScreenshot('custom-signal.png', {
      maxDiffPixelRatio: 0.03,
    });
  });
});

test.describe('GradientRibbon Custom Series', () => {
  test('renders GradientRibbon series correctly', async ({ page }) => {
    await page.goto('/custom-gradient-ribbon.html');
    await waitForChartReady(page);

    const container = page.locator('#container');
    await expect(container).toHaveScreenshot('custom-gradient-ribbon.png', {
      maxDiffPixelRatio: 0.03,
    });
  });
});
