/**
 * E2E Visual Regression Tests for Interactive Features
 *
 * Tests user interactions with UI elements including:
 * - Pane collapse/expand
 * - Tooltip interactions
 * - Legend interactions
 * - Range switcher
 * - Chart positioning and z-index
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

test.describe('Pane Collapse/Expand Interactions', () => {
  test('collapses pane when collapse button clicked', async ({ page }) => {
    await page.goto('/multi-pane-collapse.html');
    await waitForChartReady(page);

    const container = page.locator('#container');
    await expect(container).toHaveScreenshot('pane-before-collapse.png', {
      maxDiffPixelRatio: 0.02,
    });

    // Click collapse button for pane 1
    const collapseBtn = page.locator('[data-testid="collapse-pane-1"]');
    await collapseBtn.click();
    await page.waitForTimeout(300);

    await expect(container).toHaveScreenshot('pane-after-collapse.png', {
      maxDiffPixelRatio: 0.02,
    });
  });

  test('expands collapsed pane when expand button clicked', async ({ page }) => {
    await page.goto('/multi-pane-collapse.html');
    await waitForChartReady(page);

    // First collapse the pane
    const collapseBtn = page.locator('[data-testid="collapse-pane-1"]');
    await collapseBtn.click();
    await page.waitForTimeout(300);

    // Now expand it
    await collapseBtn.click();
    await page.waitForTimeout(300);

    const container = page.locator('#container');
    await expect(container).toHaveScreenshot('pane-expanded.png', {
      maxDiffPixelRatio: 0.02,
    });
  });

  test('handles multiple panes collapse and expand', async ({ page }) => {
    await page.goto('/multi-pane-collapse.html');
    await waitForChartReady(page);

    // Collapse first pane
    await page.locator('[data-testid="collapse-pane-1"]').click();
    await page.waitForTimeout(300);

    // Collapse second pane
    await page.locator('[data-testid="collapse-pane-2"]').click();
    await page.waitForTimeout(300);

    const container = page.locator('#container');
    await expect(container).toHaveScreenshot('multiple-panes-collapsed.png', {
      maxDiffPixelRatio: 0.02,
    });
  });

  test('handles collapse all except one pane', async ({ page }) => {
    await page.goto('/multi-pane-collapse.html');
    await waitForChartReady(page);

    // Collapse panes 1 and 2, leave pane 3 open
    await page.locator('[data-testid="collapse-pane-1"]').click();
    await page.waitForTimeout(200);
    await page.locator('[data-testid="collapse-pane-2"]').click();
    await page.waitForTimeout(300);

    const container = page.locator('#container');
    await expect(container).toHaveScreenshot('one-pane-open.png', {
      maxDiffPixelRatio: 0.02,
    });
  });
});

test.describe('Tooltip Interactions', () => {
  test('displays tooltip on chart hover', async ({ page }) => {
    await page.goto('/chart-with-tooltip.html');
    await waitForChartReady(page);

    const container = page.locator('#container');
    const box = await container.boundingBox();

    if (!box) {
      throw new Error('Container not found');
    }

    // Move mouse to chart area
    await page.mouse.move(box.x + 400, box.y + 200);
    await page.waitForTimeout(150);

    // Verify tooltip is visible
    const tooltip = page.locator('[data-testid="chart-tooltip"]');
    await expect(tooltip).toBeVisible();

    const wrapper = page.locator('#wrapper');
    await expect(wrapper).toHaveScreenshot('chart-with-tooltip-visible.png', {
      maxDiffPixelRatio: 0.02,
    });
  });

  test('updates tooltip on mouse move', async ({ page }) => {
    await page.goto('/chart-with-tooltip.html');
    await waitForChartReady(page);

    const container = page.locator('#container');
    const box = await container.boundingBox();

    if (!box) {
      throw new Error('Container not found');
    }

    // Move to first position
    await page.mouse.move(box.x + 200, box.y + 200);
    await page.waitForTimeout(150);

    const tooltip = page.locator('[data-testid="chart-tooltip"]');
    const firstText = await tooltip.textContent();

    // Move to different position
    await page.mouse.move(box.x + 600, box.y + 200);
    await page.waitForTimeout(150);

    const secondText = await tooltip.textContent();

    // Tooltip content should change
    expect(firstText).not.toBe(secondText);
  });

  test('hides tooltip on mouse leave', async ({ page }) => {
    await page.goto('/chart-with-tooltip.html');
    await waitForChartReady(page);

    const container = page.locator('#container');
    const tooltip = page.locator('[data-testid="chart-tooltip"]');
    const box = await container.boundingBox();

    if (!box) {
      throw new Error('Container not found');
    }

    // Show tooltip by moving into chart
    await page.mouse.move(box.x + 400, box.y + 200);
    await page.waitForTimeout(150);
    await expect(tooltip).toBeVisible();

    // Move mouse outside container
    await page.mouse.move(box.x - 50, box.y - 50);
    await page.waitForTimeout(150);

    await expect(tooltip).toBeHidden();
  });
});

test.describe('Legend Interactions', () => {
  test('toggles series visibility on legend click', async ({ page }) => {
    await page.goto('/chart-with-legend.html');
    await waitForChartReady(page);

    const container = page.locator('#container');

    // Initial state - all series visible
    await expect(container).toHaveScreenshot('legend-all-visible.png', {
      maxDiffPixelRatio: 0.02,
    });

    // Click legend item to hide series
    const legendItem = page.locator('[data-series-id="series-1"]');
    await legendItem.click();
    await page.waitForTimeout(100);

    // Verify series is hidden
    await expect(container).toHaveScreenshot('legend-series-hidden.png', {
      maxDiffPixelRatio: 0.02,
    });

    // Click again to show
    await legendItem.click();
    await page.waitForTimeout(100);

    await expect(container).toHaveScreenshot('legend-series-shown.png', {
      maxDiffPixelRatio: 0.02,
    });
  });

  test('highlights series on legend hover', async ({ page }) => {
    await page.goto('/chart-with-legend.html');
    await waitForChartReady(page);

    const legendItem = page.locator('[data-series-id="series-1"]');

    // Hover over legend item
    await legendItem.hover();
    await page.waitForTimeout(100);

    const container = page.locator('#container');
    await expect(container).toHaveScreenshot('legend-hover-highlight.png', {
      maxDiffPixelRatio: 0.02,
    });
  });

  test('updates dynamic legend values', async ({ page }) => {
    await page.goto('/chart-with-legend.html');
    await waitForChartReady(page);

    const legendValue = page.locator('[data-testid="legend-value-1"]');
    const initialValue = await legendValue.textContent();

    // Trigger chart interaction to change visible data
    const container = page.locator('#chart');
    const box = await container.boundingBox();

    if (!box) {
      throw new Error('Chart container not found');
    }

    // Move mouse over chart to trigger crosshair event
    await page.mouse.move(box.x + 200, box.y + 200);
    await page.waitForTimeout(200);

    const updatedValue = await legendValue.textContent();

    // Value should update (different position = different value)
    expect(initialValue).not.toBe(updatedValue);
  });

  test('positions legend correctly in multi-pane chart', async ({ page }) => {
    await page.goto('/chart-with-legend.html');
    await waitForChartReady(page);

    const container = page.locator('#container');
    await expect(container).toHaveScreenshot('multi-pane-legend.png', {
      maxDiffPixelRatio: 0.02,
    });
  });
});

test.describe('Range Switcher Interactions', () => {
  test('changes time range on button click', async ({ page }) => {
    await page.goto('/chart-with-range-switcher.html');
    await waitForChartReady(page);

    const container = page.locator('#chart-container');

    // Initial state (default range)
    await expect(container).toHaveScreenshot('range-default.png', {
      maxDiffPixelRatio: 0.02,
    });

    // Click 1W button
    const weekButton = page.locator('[data-range="1W"]');
    await weekButton.click();
    await page.waitForTimeout(200);

    await expect(container).toHaveScreenshot('range-1w.png', {
      maxDiffPixelRatio: 0.02,
    });

    // Click 1M button
    const monthButton = page.locator('[data-range="1M"]');
    await monthButton.click();
    await page.waitForTimeout(200);

    await expect(container).toHaveScreenshot('range-1m.png', {
      maxDiffPixelRatio: 0.02,
    });
  });

  test('handles custom range input', async ({ page }) => {
    await page.goto('/chart-with-range-switcher.html');
    await waitForChartReady(page);

    // Enter custom range
    await page.fill('[data-testid="range-start"]', '2024-01-15');
    await page.fill('[data-testid="range-end"]', '2024-01-25');
    await page.click('[data-testid="apply-range"]');
    await page.waitForTimeout(200);

    const container = page.locator('#chart-container');
    await expect(container).toHaveScreenshot('range-custom.png', {
      maxDiffPixelRatio: 0.02,
    });
  });
});

test.describe('Chart Positioning and Z-Index', () => {
  test('maintains correct z-index ordering', async ({ page }) => {
    await page.goto('/chart-zindex.html');
    await waitForChartReady(page);

    const container = page.locator('body');
    await expect(container).toHaveScreenshot('chart-zindex.png', {
      maxDiffPixelRatio: 0.02,
    });
  });

  test('renders with position fixed correctly', async ({ page }) => {
    await page.goto('/chart-position-fixed.html');
    await waitForChartReady(page);

    // Scroll the page
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(200);

    const container = page.locator('body');
    await expect(container).toHaveScreenshot('chart-position-fixed.png', {
      maxDiffPixelRatio: 0.02,
    });
  });

  test('handles sticky header positioning', async ({ page }) => {
    await page.goto('/chart-sticky-header.html');
    await waitForChartReady(page);

    const container = page.locator('body');

    // Before scroll
    await expect(container).toHaveScreenshot('sticky-header-top.png', {
      maxDiffPixelRatio: 0.02,
    });

    // Scroll down
    await page.evaluate(() => window.scrollTo(0, 300));
    await page.waitForTimeout(200);

    // After scroll - header should stick
    await expect(container).toHaveScreenshot('sticky-header-scrolled.png', {
      maxDiffPixelRatio: 0.02,
    });
  });
});
