/**
 * E2E Visual Regression Tests for User Workflows
 *
 * Tests multi-step user scenarios including:
 * - Add/toggle/remove series workflow
 * - Zoom/pan/reset workflow
 * - Series type switching
 * - Options update and revert
 * - Multi-series management
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

test.describe('Series Lifecycle Workflow', () => {
  test('completes add-toggle-remove series workflow', async ({ page }) => {
    await page.goto('/interactive-chart.html');
    await waitForChartReady(page);

    const container = page.locator('#chart-container');

    // Initial empty state
    await expect(container).toHaveScreenshot('workflow-initial.png', {
      maxDiffPixelRatio: 0.02,
    });

    // Add series via button
    await page.click('[data-action="add-series"]');
    await page.waitForTimeout(200);
    await expect(container).toHaveScreenshot('workflow-series-added.png', {
      maxDiffPixelRatio: 0.02,
    });

    // Toggle visibility
    await page.click('[data-action="toggle-series"]');
    await page.waitForTimeout(100);
    await expect(container).toHaveScreenshot('workflow-series-hidden.png', {
      maxDiffPixelRatio: 0.02,
    });

    // Remove series
    await page.click('[data-action="remove-series"]');
    await page.waitForTimeout(200);
    await expect(container).toHaveScreenshot('workflow-series-removed.png', {
      maxDiffPixelRatio: 0.02,
    });
  });
});

test.describe('Zoom and Pan Workflow', () => {
  test('completes zoom-pan-reset workflow', async ({ page }) => {
    await page.goto('/interactive-chart.html');
    await waitForChartReady(page);

    const container = page.locator('#chart-container');

    // Initial state
    await expect(container).toHaveScreenshot('zoom-initial.png', {
      maxDiffPixelRatio: 0.02,
    });

    // Zoom in
    await page.click('[data-action="zoom-in"]');
    await page.waitForTimeout(200);
    await expect(container).toHaveScreenshot('zoom-zoomed-in.png', {
      maxDiffPixelRatio: 0.02,
    });

    // Zoom out
    await page.click('[data-action="zoom-out"]');
    await page.waitForTimeout(200);
    await expect(container).toHaveScreenshot('zoom-zoomed-out.png', {
      maxDiffPixelRatio: 0.02,
    });

    // Reset zoom
    await page.click('[data-action="reset-zoom"]');
    await page.waitForTimeout(200);
    await expect(container).toHaveScreenshot('zoom-reset.png', {
      maxDiffPixelRatio: 0.02,
    });
  });
});

test.describe('Series Type Switching', () => {
  test('switches series type dynamically', async ({ page }) => {
    await page.goto('/interactive-chart.html');
    await waitForChartReady(page);

    const container = page.locator('#chart-container');

    // Default line series
    await expect(container).toHaveScreenshot('type-line.png', {
      maxDiffPixelRatio: 0.02,
    });

    // Switch to area
    await page.click('[data-type="area"]');
    await page.waitForTimeout(200);
    await expect(container).toHaveScreenshot('type-area.png', {
      maxDiffPixelRatio: 0.02,
    });

    // Switch to histogram
    await page.click('[data-type="histogram"]');
    await page.waitForTimeout(200);
    await expect(container).toHaveScreenshot('type-histogram.png', {
      maxDiffPixelRatio: 0.02,
    });
  });
});

test.describe('Options Update Workflow', () => {
  test('updates options and reverts', async ({ page }) => {
    await page.goto('/interactive-chart.html');
    await waitForChartReady(page);

    const container = page.locator('#chart-container');

    // Original state
    await expect(container).toHaveScreenshot('options-original.png', {
      maxDiffPixelRatio: 0.02,
    });

    // Update color
    await page.click('[data-action="change-color"]');
    await page.waitForTimeout(100);
    await expect(container).toHaveScreenshot('options-color-changed.png', {
      maxDiffPixelRatio: 0.02,
    });

    // Revert
    await page.click('[data-action="revert-options"]');
    await page.waitForTimeout(100);
    await expect(container).toHaveScreenshot('options-reverted.png', {
      maxDiffPixelRatio: 0.02,
    });
  });
});

test.describe('Multi-Series Management', () => {
  test('manages multiple series lifecycle', async ({ page }) => {
    await page.goto('/interactive-chart.html');
    await waitForChartReady(page);

    const container = page.locator('#chart-container');

    // Add first series
    await page.click('[data-action="add-series"]');
    await page.waitForTimeout(150);

    // Add second series
    await page.click('[data-action="add-series-2"]');
    await page.waitForTimeout(150);

    await expect(container).toHaveScreenshot('multi-two-series.png', {
      maxDiffPixelRatio: 0.02,
    });

    // Remove first series
    await page.click('[data-action="remove-series"]');
    await page.waitForTimeout(150);

    await expect(container).toHaveScreenshot('multi-one-series.png', {
      maxDiffPixelRatio: 0.02,
    });
  });
});
