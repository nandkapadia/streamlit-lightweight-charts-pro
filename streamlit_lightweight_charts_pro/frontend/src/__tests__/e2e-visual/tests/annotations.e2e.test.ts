/**
 * E2E Visual Regression Tests for Annotation System
 *
 * Tests annotation rendering and interactions including:
 * - Text annotations
 * - Arrow annotations (buy/sell signals)
 * - Shape annotations (circles)
 * - Mixed annotation types
 * - Annotation visibility and positioning
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

test.describe('Text Annotations', () => {
  test('renders text annotation above bar', async ({ page }) => {
    await page.goto('/annotations-text-above.html');
    await waitForChartReady(page);

    const container = page.locator('#chart-container');
    await expect(container).toHaveScreenshot('annotation-text-above-e2e.png', {
      maxDiffPixelRatio: 0.02,
    });
  });

  test('renders text annotation below bar', async ({ page }) => {
    await page.goto('/annotations-text-below.html');
    await waitForChartReady(page);

    const container = page.locator('#chart-container');
    await expect(container).toHaveScreenshot('annotation-text-below-e2e.png', {
      maxDiffPixelRatio: 0.02,
    });
  });

  test('renders multiple text annotations', async ({ page }) => {
    await page.goto('/annotations-text-multiple.html');
    await waitForChartReady(page);

    const container = page.locator('#chart-container');
    await expect(container).toHaveScreenshot('annotation-text-multiple-e2e.png', {
      maxDiffPixelRatio: 0.02,
    });
  });
});

test.describe('Arrow Annotations', () => {
  test('renders buy signal arrow', async ({ page }) => {
    await page.goto('/annotations-arrow-buy.html');
    await waitForChartReady(page);

    const container = page.locator('#chart-container');
    await expect(container).toHaveScreenshot('annotation-arrow-buy-e2e.png', {
      maxDiffPixelRatio: 0.02,
    });
  });

  test('renders sell signal arrow', async ({ page }) => {
    await page.goto('/annotations-arrow-sell.html');
    await waitForChartReady(page);

    const container = page.locator('#chart-container');
    await expect(container).toHaveScreenshot('annotation-arrow-sell-e2e.png', {
      maxDiffPixelRatio: 0.02,
    });
  });

  test('renders multiple arrow annotations', async ({ page }) => {
    await page.goto('/annotations-arrows-multiple.html');
    await waitForChartReady(page);

    const container = page.locator('#chart-container');
    await expect(container).toHaveScreenshot('annotation-arrows-multiple-e2e.png', {
      maxDiffPixelRatio: 0.02,
    });
  });
});

test.describe('Shape Annotations', () => {
  test('renders circle annotation', async ({ page }) => {
    await page.goto('/annotations-circle.html');
    await waitForChartReady(page);

    const container = page.locator('#chart-container');
    await expect(container).toHaveScreenshot('annotation-circle-e2e.png', {
      maxDiffPixelRatio: 0.02,
    });
  });

  test('renders multiple shape annotations', async ({ page }) => {
    await page.goto('/annotations-shapes-multiple.html');
    await waitForChartReady(page);

    const container = page.locator('#chart-container');
    await expect(container).toHaveScreenshot('annotation-shapes-multiple-e2e.png', {
      maxDiffPixelRatio: 0.02,
    });
  });
});

test.describe('Mixed Annotations', () => {
  test('renders mixed annotation types', async ({ page }) => {
    await page.goto('/annotations-mixed.html');
    await waitForChartReady(page);

    const container = page.locator('#chart-container');
    await expect(container).toHaveScreenshot('annotation-mixed-e2e.png', {
      maxDiffPixelRatio: 0.02,
    });
  });

  test('renders annotations with various styles', async ({ page }) => {
    await page.goto('/annotations-various-styles.html');
    await waitForChartReady(page);

    const container = page.locator('#chart-container');
    await expect(container).toHaveScreenshot('annotation-various-styles-e2e.png', {
      maxDiffPixelRatio: 0.02,
    });
  });
});

test.describe('Annotation Edge Cases', () => {
  test('renders annotations at chart boundaries', async ({ page }) => {
    await page.goto('/annotations-boundaries.html');
    await waitForChartReady(page);

    const container = page.locator('#chart-container');
    await expect(container).toHaveScreenshot('annotation-boundaries-e2e.png', {
      maxDiffPixelRatio: 0.02,
    });
  });

  test('handles empty annotations array', async ({ page }) => {
    await page.goto('/annotations-empty.html');
    await waitForChartReady(page);

    const container = page.locator('#chart-container');
    await expect(container).toHaveScreenshot('annotation-empty-e2e.png', {
      maxDiffPixelRatio: 0.02,
    });
  });
});

test.describe('Annotation Interactions', () => {
  test('annotations maintain position when chart is panned', async ({ page }) => {
    await page.goto('/annotations-pan-test.html');
    await waitForChartReady(page);

    const container = page.locator('#chart-container');
    const canvas = page.locator('canvas').first();

    // Initial state
    await expect(container).toHaveScreenshot('annotation-before-pan.png', {
      maxDiffPixelRatio: 0.02,
    });

    // Pan the chart by dragging
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    await page.mouse.move(box.x + 600, box.y + 200);
    await page.mouse.down();
    await page.mouse.move(box.x + 200, box.y + 200);
    await page.mouse.up();
    await page.waitForTimeout(300);

    // Annotations should have moved with the chart
    await expect(container).toHaveScreenshot('annotation-after-pan.png', {
      maxDiffPixelRatio: 0.02,
    });
  });

  test('annotations maintain position when chart is zoomed in', async ({ page }) => {
    await page.goto('/annotations-zoom-test.html');
    await waitForChartReady(page);

    const container = page.locator('#chart-container');
    const canvas = page.locator('canvas').first();

    // Initial state
    await expect(container).toHaveScreenshot('annotation-before-zoom.png', {
      maxDiffPixelRatio: 0.02,
    });

    // Zoom in using mouse wheel
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    await page.mouse.move(box.x + 400, box.y + 200);
    await page.mouse.wheel(0, -500); // Scroll up to zoom in
    await page.waitForTimeout(300);

    // Annotations should still be at correct time/price coordinates
    await expect(container).toHaveScreenshot('annotation-after-zoom-in.png', {
      maxDiffPixelRatio: 0.02,
    });
  });

  test('annotations maintain position when chart is zoomed out', async ({ page }) => {
    await page.goto('/annotations-zoom-test.html');
    await waitForChartReady(page);

    const container = page.locator('#chart-container');
    const canvas = page.locator('canvas').first();

    // Zoom out using mouse wheel
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    await page.mouse.move(box.x + 400, box.y + 200);
    await page.mouse.wheel(0, 500); // Scroll down to zoom out
    await page.waitForTimeout(300);

    // Annotations should still be at correct time/price coordinates
    await expect(container).toHaveScreenshot('annotation-after-zoom-out.png', {
      maxDiffPixelRatio: 0.02,
    });
  });

  test('annotations remain visible after panning to different time range', async ({ page }) => {
    await page.goto('/annotations-pan-test.html');
    await waitForChartReady(page);

    const container = page.locator('#chart-container');
    const canvas = page.locator('canvas').first();

    // Pan to show earlier part of chart
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    await page.mouse.move(box.x + 200, box.y + 200);
    await page.mouse.down();
    await page.mouse.move(box.x + 600, box.y + 200);
    await page.mouse.up();
    await page.waitForTimeout(300);

    // Should show annotations that are now in view
    await expect(container).toHaveScreenshot('annotation-pan-to-earlier-range.png', {
      maxDiffPixelRatio: 0.02,
    });
  });

  test('annotations scale correctly with price axis zoom', async ({ page }) => {
    await page.goto('/annotations-zoom-test.html');
    await waitForChartReady(page);

    const container = page.locator('#chart-container');

    // Get price scale area and drag to zoom
    const priceScale = page.locator('canvas').nth(1); // Price scale canvas
    const box = await priceScale.boundingBox();
    if (!box) throw new Error('Price scale not found');

    // Drag on price scale to zoom vertically
    await page.mouse.move(box.x + 10, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 10, box.y + 50);
    await page.mouse.up();
    await page.waitForTimeout(300);

    // Annotations should remain at correct price levels
    await expect(container).toHaveScreenshot('annotation-after-price-zoom.png', {
      maxDiffPixelRatio: 0.02,
    });
  });
});
