/**
 * E2E Visual Regression Tests for Accessibility
 *
 * @see https://playwright.dev/docs/test-snapshots
 */

import { test, expect } from '@playwright/test';

async function waitForChartReady(page: any) {
  await page.evaluate(() => (window as any).testCaseReady);
  await page.waitForTimeout(200);
}

test.describe('Accessibility Tests', () => {
  test('supports keyboard navigation', async ({ page }) => {
    await page.goto('/keyboard-navigation.html');
    await waitForChartReady(page);

    // Tab to first button
    await page.keyboard.press('Tab');
    await page.waitForTimeout(100);

    // Verify focus
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toHaveAttribute('data-action', 'zoom-in');

    // Activate with Enter
    await page.keyboard.press('Enter');
    await page.waitForTimeout(200);

    const container = page.locator('#chart-container');
    await expect(container).toHaveScreenshot('keyboard-zoom-in.png', {
      maxDiffPixelRatio: 0.02,
    });
  });

  test('has proper ARIA labels', async ({ page }) => {
    await page.goto('/aria-labels.html');
    await waitForChartReady(page);

    // Check for ARIA labels
    const chartContainer = page.locator('[aria-label="Trading Chart"]');
    await expect(chartContainer).toBeVisible();

    const zoomButton = page.locator('[aria-label="Zoom In"]');
    await expect(zoomButton).toBeVisible();
  });

  test('provides screen reader announcements', async ({ page }) => {
    await page.goto('/screen-reader.html');
    await waitForChartReady(page);

    // Check for aria-live region
    const liveRegion = page.locator('[aria-live="polite"]');
    await expect(liveRegion).toBeVisible();

    // Trigger action
    await page.click('[data-action="add-series"]');
    await page.waitForTimeout(200);

    // Check announcement
    const announcement = await liveRegion.textContent();
    expect(announcement).toContain('Series added');
  });
});
