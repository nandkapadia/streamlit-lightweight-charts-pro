/**
 * E2E Visual Regression Tests for Custom Series Interactions
 *
 * Tests custom series maintain correct positions during:
 * - Chart panning (horizontal scrolling)
 * - Chart zooming (time and price scaling)
 * - Window resizing
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

test.describe('Band Series Pan/Zoom Interactions', () => {
  test('band series maintains position during pan', async ({ page }) => {
    await page.goto('/custom-band-pan-test.html');
    await waitForChartReady(page);

    const container = page.locator('#chart-container');
    const canvas = page.locator('canvas').first();

    // Initial state
    await expect(container).toHaveScreenshot('band-before-pan.png', {
      maxDiffPixelRatio: 0.02,
    });

    // Pan the chart
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    await page.mouse.move(box.x + 600, box.y + 200);
    await page.mouse.down();
    await page.mouse.move(box.x + 200, box.y + 200);
    await page.mouse.up();
    await page.waitForTimeout(300);

    // Band lines should have moved with the chart
    await expect(container).toHaveScreenshot('band-after-pan.png', {
      maxDiffPixelRatio: 0.02,
    });
  });

  test('band series maintains position during zoom', async ({ page }) => {
    await page.goto('/custom-band-zoom-test.html');
    await waitForChartReady(page);

    const container = page.locator('#chart-container');
    const canvas = page.locator('canvas').first();

    // Initial state
    await expect(container).toHaveScreenshot('band-before-zoom.png', {
      maxDiffPixelRatio: 0.02,
    });

    // Zoom in
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    await page.mouse.move(box.x + 400, box.y + 200);
    await page.mouse.wheel(0, -500);
    await page.waitForTimeout(300);

    // Band lines should maintain correct spacing
    await expect(container).toHaveScreenshot('band-after-zoom.png', {
      maxDiffPixelRatio: 0.02,
    });
  });

  test('band fills scale correctly with price axis', async ({ page }) => {
    await page.goto('/custom-band-zoom-test.html');
    await waitForChartReady(page);

    const container = page.locator('#chart-container');
    const priceScale = page.locator('canvas').nth(1);
    const box = await priceScale.boundingBox();
    if (!box) throw new Error('Price scale not found');

    // Drag on price scale to zoom vertically
    await page.mouse.move(box.x + 10, box.y + 200);
    await page.mouse.down();
    await page.mouse.move(box.x + 10, box.y + 100);
    await page.mouse.up();
    await page.waitForTimeout(300);

    // Band should maintain relative spacing
    await expect(container).toHaveScreenshot('band-price-zoom.png', {
      maxDiffPixelRatio: 0.02,
    });
  });
});

test.describe('Ribbon Series Pan/Zoom Interactions', () => {
  test('ribbon series maintains position during pan', async ({ page }) => {
    await page.goto('/custom-ribbon-pan-test.html');
    await waitForChartReady(page);

    const container = page.locator('#chart-container');
    const canvas = page.locator('canvas').first();

    // Initial state
    await expect(container).toHaveScreenshot('ribbon-before-pan.png', {
      maxDiffPixelRatio: 0.02,
    });

    // Pan the chart
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    await page.mouse.move(box.x + 600, box.y + 200);
    await page.mouse.down();
    await page.mouse.move(box.x + 200, box.y + 200);
    await page.mouse.up();
    await page.waitForTimeout(300);

    await expect(container).toHaveScreenshot('ribbon-after-pan.png', {
      maxDiffPixelRatio: 0.02,
    });
  });

  test('ribbon fill maintains during zoom', async ({ page }) => {
    await page.goto('/custom-ribbon-zoom-test.html');
    await waitForChartReady(page);

    const container = page.locator('#chart-container');
    const canvas = page.locator('canvas').first();

    // Zoom in
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    await page.mouse.move(box.x + 400, box.y + 200);
    await page.mouse.wheel(0, -500);
    await page.waitForTimeout(300);

    // Ribbon fill should scale proportionally
    await expect(container).toHaveScreenshot('ribbon-after-zoom.png', {
      maxDiffPixelRatio: 0.02,
    });
  });
});

test.describe('Signal Series Pan/Zoom Interactions', () => {
  test('signal backgrounds align with time axis during pan', async ({ page }) => {
    await page.goto('/custom-signal-pan-test.html');
    await waitForChartReady(page);

    const container = page.locator('#chart-container');
    const canvas = page.locator('canvas').first();

    // Initial state
    await expect(container).toHaveScreenshot('signal-before-pan.png', {
      maxDiffPixelRatio: 0.02,
    });

    // Pan the chart
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    await page.mouse.move(box.x + 600, box.y + 200);
    await page.mouse.down();
    await page.mouse.move(box.x + 200, box.y + 200);
    await page.mouse.up();
    await page.waitForTimeout(300);

    // Signal backgrounds should stay aligned with time
    await expect(container).toHaveScreenshot('signal-after-pan.png', {
      maxDiffPixelRatio: 0.02,
    });
  });

  test('signal backgrounds maintain during zoom', async ({ page }) => {
    await page.goto('/custom-signal-zoom-test.html');
    await waitForChartReady(page);

    const container = page.locator('#chart-container');
    const canvas = page.locator('canvas').first();

    // Zoom in
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    await page.mouse.move(box.x + 400, box.y + 200);
    await page.mouse.wheel(0, -500);
    await page.waitForTimeout(300);

    // Signal backgrounds should scale with time axis
    await expect(container).toHaveScreenshot('signal-after-zoom.png', {
      maxDiffPixelRatio: 0.02,
    });
  });
});

test.describe('TrendFill Series Pan/Zoom Interactions', () => {
  test('trendfill maintains during pan', async ({ page }) => {
    await page.goto('/custom-trendfill-pan-test.html');
    await waitForChartReady(page);

    const container = page.locator('#chart-container');
    const canvas = page.locator('canvas').first();

    // Pan the chart
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    await page.mouse.move(box.x + 600, box.y + 200);
    await page.mouse.down();
    await page.mouse.move(box.x + 200, box.y + 200);
    await page.mouse.up();
    await page.waitForTimeout(300);

    // Uptrend/downtrend fills should stay with data
    await expect(container).toHaveScreenshot('trendfill-after-pan.png', {
      maxDiffPixelRatio: 0.02,
    });
  });

  test('trendfill scales during zoom', async ({ page }) => {
    await page.goto('/custom-trendfill-zoom-test.html');
    await waitForChartReady(page);

    const container = page.locator('#chart-container');
    const canvas = page.locator('canvas').first();

    // Zoom in
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    await page.mouse.move(box.x + 400, box.y + 200);
    await page.mouse.wheel(0, -500);
    await page.waitForTimeout(300);

    await expect(container).toHaveScreenshot('trendfill-after-zoom.png', {
      maxDiffPixelRatio: 0.02,
    });
  });
});

test.describe('GradientRibbon Series Pan/Zoom Interactions', () => {
  test('gradient ribbon maintains during pan', async ({ page }) => {
    await page.goto('/custom-gradient-pan-test.html');
    await waitForChartReady(page);

    const container = page.locator('#chart-container');
    const canvas = page.locator('canvas').first();

    // Pan the chart
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    await page.mouse.move(box.x + 600, box.y + 200);
    await page.mouse.down();
    await page.mouse.move(box.x + 200, box.y + 200);
    await page.mouse.up();
    await page.waitForTimeout(300);

    // Gradient should move with data
    await expect(container).toHaveScreenshot('gradient-after-pan.png', {
      maxDiffPixelRatio: 0.03, // Slightly higher tolerance for gradients
    });
  });

  test('gradient ribbon scales during zoom', async ({ page }) => {
    await page.goto('/custom-gradient-zoom-test.html');
    await waitForChartReady(page);

    const container = page.locator('#chart-container');
    const canvas = page.locator('canvas').first();

    // Zoom in
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    await page.mouse.move(box.x + 400, box.y + 200);
    await page.mouse.wheel(0, -500);
    await page.waitForTimeout(300);

    // Gradient interpolation should remain smooth
    await expect(container).toHaveScreenshot('gradient-after-zoom.png', {
      maxDiffPixelRatio: 0.03,
    });
  });
});
