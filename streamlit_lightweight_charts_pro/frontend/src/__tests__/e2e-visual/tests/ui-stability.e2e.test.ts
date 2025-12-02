/**
 * E2E Visual Regression Tests for UI Component Stability
 *
 * Tests UI components maintain correct positions and functionality during:
 * - Legend position during pan/zoom
 * - Range switcher during pan/zoom
 * - Button panel position stability
 * - Corner layout positioning
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

test.describe('Legend Position Stability', () => {
  test('legend stays in top-left corner during pan', async ({ page }) => {
    await page.goto('/legend-pan-test.html');
    await waitForChartReady(page);

    const container = page.locator('#container');
    const canvas = page.locator('canvas').first();

    // Initial state - legend should be in top-left
    await expect(container).toHaveScreenshot('legend-topleft-before-pan.png', {
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

    // Legend should still be in top-left, data values updated
    await expect(container).toHaveScreenshot('legend-topleft-after-pan.png', {
      maxDiffPixelRatio: 0.02,
    });
  });

  test('legend stays in top-right corner during zoom', async ({ page }) => {
    await page.goto('/legend-zoom-test.html');
    await waitForChartReady(page);

    const container = page.locator('#container');
    const canvas = page.locator('canvas').first();

    // Initial state
    await expect(container).toHaveScreenshot('legend-topright-before-zoom.png', {
      maxDiffPixelRatio: 0.02,
    });

    // Zoom in
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    await page.mouse.move(box.x + 400, box.y + 200);
    await page.mouse.wheel(0, -500);
    await page.waitForTimeout(300);

    // Legend should stay in top-right
    await expect(container).toHaveScreenshot('legend-topright-after-zoom.png', {
      maxDiffPixelRatio: 0.02,
    });
  });

  test('legend updates values correctly during pan', async ({ page }) => {
    await page.goto('/legend-value-update-test.html');
    await waitForChartReady(page);

    const legend = page.locator('[data-testid="legend"]');

    // Wait for initial legend update
    await page.waitForTimeout(300);
    const initialValue = await legend.textContent();

    // Programmatically change visible range to ensure reliable test
    await page.evaluate(() => {
      const chart = (window as any).chart;
      // Shift range significantly to right (show days 60-100 instead of 0-40)
      chart.timeScale().setVisibleLogicalRange({ from: 60, to: 100 });
    });

    // Wait for visible range change event and debounced update
    await page.waitForTimeout(400);

    const finalValue = await legend.textContent();

    // Values should have changed (different data visible)
    expect(initialValue).not.toBe(finalValue);
  });

  test('multi-pane legend positions remain stable', async ({ page }) => {
    await page.goto('/legend-multi-pane-test.html');
    await waitForChartReady(page);

    const container = page.locator('#container');

    // Both panes should have legends in correct positions
    await expect(container).toHaveScreenshot('legend-multi-pane-initial.png', {
      maxDiffPixelRatio: 0.02,
    });

    // Pan one pane
    const canvas = page.locator('canvas').first();
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    await page.mouse.move(box.x + 400, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 200, box.y + 100);
    await page.mouse.up();
    await page.waitForTimeout(300);

    // Legends should stay in their corners
    await expect(container).toHaveScreenshot('legend-multi-pane-after-pan.png', {
      maxDiffPixelRatio: 0.02,
    });
  });
});

test.describe('Range Switcher During Pan/Zoom', () => {
  test('range switcher stays in position during pan', async ({ page }) => {
    await page.goto('/range-switcher-pan-test.html');
    await waitForChartReady(page);

    const container = page.locator('#chart-container');
    const canvas = page.locator('canvas').first();

    // Initial state with range switcher visible
    await expect(container).toHaveScreenshot('range-switcher-before-pan.png', {
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

    // Range switcher should stay in corner
    await expect(container).toHaveScreenshot('range-switcher-after-pan.png', {
      maxDiffPixelRatio: 0.02,
    });
  });

  test('range buttons work after manual pan', async ({ page }) => {
    await page.goto('/range-switcher-interaction-test.html');
    await waitForChartReady(page);

    const container = page.locator('#chart-container');
    const canvas = page.locator('canvas').first();

    // Manually pan the chart
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    await page.mouse.move(box.x + 600, box.y + 200);
    await page.mouse.down();
    await page.mouse.move(box.x + 200, box.y + 200);
    await page.mouse.up();
    await page.waitForTimeout(300);

    // Click 1W range button - should override manual pan
    const weekButton = page.locator('[data-range="1W"]');
    await weekButton.click();
    await page.waitForTimeout(300);

    // Should show 1 week range
    await expect(container).toHaveScreenshot('range-switcher-1w-after-pan.png', {
      maxDiffPixelRatio: 0.02,
    });
  });

  test('range buttons work after manual zoom', async ({ page }) => {
    await page.goto('/range-switcher-zoom-test.html');
    await waitForChartReady(page);

    const container = page.locator('#chart-container');
    const canvas = page.locator('canvas').first();

    // Manually zoom
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    await page.mouse.move(box.x + 400, box.y + 200);
    await page.mouse.wheel(0, -500);
    await page.waitForTimeout(300);

    // Click 1M range button
    const monthButton = page.locator('[data-range="1M"]');
    await monthButton.click();
    await page.waitForTimeout(300);

    // Should show 1 month range, overriding zoom
    await expect(container).toHaveScreenshot('range-switcher-1m-after-zoom.png', {
      maxDiffPixelRatio: 0.02,
    });
  });

  test('range switcher position in different corners', async ({ page }) => {
    await page.goto('/range-switcher-corners-test.html');
    await waitForChartReady(page);

    const container = page.locator('#container');

    // Should have range switchers in different corners
    await expect(container).toHaveScreenshot('range-switcher-all-corners.png', {
      maxDiffPixelRatio: 0.02,
    });
  });
});

test.describe('Button Panel Position Stability', () => {
  test('button panel stays in corner during pan', async ({ page }) => {
    await page.goto('/button-panel-pan-test.html');
    await waitForChartReady(page);

    const container = page.locator('#container');
    const canvas = page.locator('canvas').first();

    // Initial state with button panel
    await expect(container).toHaveScreenshot('button-panel-before-pan.png', {
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

    // Button panel should stay in corner
    await expect(container).toHaveScreenshot('button-panel-after-pan.png', {
      maxDiffPixelRatio: 0.02,
    });
  });

  test('button panel stays in corner during zoom', async ({ page }) => {
    await page.goto('/button-panel-zoom-test.html');
    await waitForChartReady(page);

    const container = page.locator('#container');
    const canvas = page.locator('canvas').first();

    // Zoom in
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    await page.mouse.move(box.x + 400, box.y + 200);
    await page.mouse.wheel(0, -500);
    await page.waitForTimeout(300);

    // Button panel should stay in corner
    await expect(container).toHaveScreenshot('button-panel-after-zoom.png', {
      maxDiffPixelRatio: 0.02,
    });
  });

  test('collapse button remains functional after pan', async ({ page }) => {
    await page.goto('/button-panel-interaction-test.html');
    await waitForChartReady(page);

    const container = page.locator('#container');
    const canvas = page.locator('canvas').first();

    // Pan the chart
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    await page.mouse.move(box.x + 600, box.y + 200);
    await page.mouse.down();
    await page.mouse.move(box.x + 200, box.y + 200);
    await page.mouse.up();
    await page.waitForTimeout(300);

    // Click collapse button
    const collapseButton = page.locator('[data-testid="collapse-pane-1"]');
    await collapseButton.click();
    await page.waitForTimeout(300);

    // Pane should be collapsed
    await expect(container).toHaveScreenshot('button-panel-collapsed-after-pan.png', {
      maxDiffPixelRatio: 0.02,
    });
  });

  test('button panel in multi-pane layout', async ({ page }) => {
    await page.goto('/button-panel-multi-pane-test.html');
    await waitForChartReady(page);

    const container = page.locator('#container');

    // Multiple panes each with button panels
    await expect(container).toHaveScreenshot('button-panel-multi-pane.png', {
      maxDiffPixelRatio: 0.02,
    });

    // Collapse one pane
    const collapseButton = page.locator('[data-testid="collapse-pane-1"]').first();
    await collapseButton.click();
    await page.waitForTimeout(300);

    // Button panels should remain in correct positions
    await expect(container).toHaveScreenshot('button-panel-multi-pane-collapsed.png', {
      maxDiffPixelRatio: 0.02,
    });
  });
});

test.describe('Corner Layout Manager', () => {
  test('multiple widgets in same corner stack correctly', async ({ page }) => {
    await page.goto('/corner-layout-stacking-test.html');
    await waitForChartReady(page);

    const container = page.locator('#chart-container');

    // Legend and range switcher in same corner should not overlap
    await expect(container).toHaveScreenshot('corner-layout-stacking.png', {
      maxDiffPixelRatio: 0.02,
    });
  });

  test('widgets in all four corners position correctly', async ({ page }) => {
    await page.goto('/corner-layout-all-corners-test.html');
    await waitForChartReady(page);

    const container = page.locator('#chart-container');

    // Widgets in all four corners
    await expect(container).toHaveScreenshot('corner-layout-all-corners.png', {
      maxDiffPixelRatio: 0.02,
    });
  });

  test('corner widgets maintain position during chart resize', async ({ page }) => {
    await page.goto('/corner-layout-resize-test.html');
    await waitForChartReady(page);

    const container = page.locator('#chart-container');

    // Initial state
    await expect(container).toHaveScreenshot('corner-layout-before-resize.png', {
      maxDiffPixelRatio: 0.02,
    });

    // Resize chart (simulate window resize)
    await page.evaluate(() => {
      const chart = (window as any).chart;
      chart.resize(600, 300);
    });
    await page.waitForTimeout(300);

    // Widgets should move to new corners
    await expect(container).toHaveScreenshot('corner-layout-after-resize.png', {
      maxDiffPixelRatio: 0.02,
    });
  });

  test('z-index ordering of stacked widgets', async ({ page }) => {
    await page.goto('/corner-layout-zindex-test.html');
    await waitForChartReady(page);

    const container = page.locator('#chart-container');

    // Multiple overlapping widgets should respect z-index
    await expect(container).toHaveScreenshot('corner-layout-zindex.png', {
      maxDiffPixelRatio: 0.02,
    });

    // Click through to lower z-index widget
    const topWidget = page.locator('[data-testid="top-widget"]');
    await topWidget.click();
    await page.waitForTimeout(200);

    // Lower widget should be accessible
    const bottomWidget = page.locator('[data-testid="bottom-widget"]');
    await expect(bottomWidget).toBeVisible();
  });
});
