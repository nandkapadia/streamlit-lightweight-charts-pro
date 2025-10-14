/**
 * E2E Visual Regression Tests for Series Configuration Dialog
 *
 * Tests series dialog functionality including:
 * - Opening/closing dialog
 * - Editing series properties
 * - Color picker interaction
 * - Line style/width selection
 * - Dialog position stability during chart interactions
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

test.describe('Series Dialog - Opening and Closing', () => {
  test('opens dialog on gear icon click', async ({ page }) => {
    await page.goto('/series-dialog-test.html');
    await waitForChartReady(page);

    const container = page.locator('#container');

    // Initial state - no dialog
    await expect(container).toHaveScreenshot('series-dialog-closed.png', {
      maxDiffPixelRatio: 0.02,
    });

    // Click gear icon to open dialog
    const gearIcon = page.locator('[data-testid="series-config-button"]');
    await gearIcon.click();
    await page.waitForTimeout(200);

    // Dialog should be visible
    await expect(container).toHaveScreenshot('series-dialog-open.png', {
      maxDiffPixelRatio: 0.02,
    });

    const dialog = page.locator('[data-testid="series-config-dialog"]');
    await expect(dialog).toBeVisible();
  });

  test('closes dialog on close button click', async ({ page }) => {
    await page.goto('/series-dialog-test.html');
    await waitForChartReady(page);

    // Open dialog
    const gearIcon = page.locator('[data-testid="series-config-button"]');
    await gearIcon.click();
    await page.waitForTimeout(200);

    // Close dialog
    const closeButton = page.locator('[data-testid="dialog-close"]');
    await closeButton.click();
    await page.waitForTimeout(200);

    const dialog = page.locator('[data-testid="series-config-dialog"]');
    await expect(dialog).toBeHidden();
  });

  test('closes dialog on outside click', async ({ page }) => {
    await page.goto('/series-dialog-test.html');
    await waitForChartReady(page);

    // Open dialog
    const gearIcon = page.locator('[data-testid="series-config-button"]');
    await gearIcon.click();
    await page.waitForTimeout(200);

    // Click outside dialog (on chart)
    const canvas = page.locator('canvas').first();
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    await page.mouse.click(box.x + 100, box.y + 100);
    await page.waitForTimeout(200);

    const dialog = page.locator('[data-testid="series-config-dialog"]');
    await expect(dialog).toBeHidden();
  });

  test('closes dialog on ESC key', async ({ page }) => {
    await page.goto('/series-dialog-test.html');
    await waitForChartReady(page);

    // Open dialog
    const gearIcon = page.locator('[data-testid="series-config-button"]');
    await gearIcon.click();
    await page.waitForTimeout(200);

    // Press ESC
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);

    const dialog = page.locator('[data-testid="series-config-dialog"]');
    await expect(dialog).toBeHidden();
  });
});

test.describe('Series Dialog - Color Configuration', () => {
  test('opens color picker on color button click', async ({ page }) => {
    await page.goto('/series-dialog-color-test.html');
    await waitForChartReady(page);

    // Open dialog
    const gearIcon = page.locator('[data-testid="series-config-button"]');
    await gearIcon.click();
    await page.waitForTimeout(200);

    const container = page.locator('#container');

    // Click color button
    const colorButton = page.locator('[data-testid="series-color-button"]');
    await colorButton.click();
    await page.waitForTimeout(200);

    // Color picker should be visible
    await expect(container).toHaveScreenshot('series-dialog-color-picker-open.png', {
      maxDiffPixelRatio: 0.02,
    });

    const colorPicker = page.locator('[data-testid="color-picker"]');
    await expect(colorPicker).toBeVisible();
  });

  test('changes series color via color picker', async ({ page }) => {
    await page.goto('/series-dialog-color-test.html');
    await waitForChartReady(page);

    const container = page.locator('#container');

    // Open dialog
    const gearIcon = page.locator('[data-testid="series-config-button"]');
    await gearIcon.click();
    await page.waitForTimeout(200);

    // Open color picker
    const colorButton = page.locator('[data-testid="series-color-button"]');
    await colorButton.click();
    await page.waitForTimeout(200);

    // Select red color
    const redColor = page.locator('[data-color="#FF0000"]');
    await redColor.click();
    await page.waitForTimeout(300);

    // Series should be red now
    await expect(container).toHaveScreenshot('series-dialog-color-changed-red.png', {
      maxDiffPixelRatio: 0.02,
    });
  });

  test('color picker presets display correctly', async ({ page }) => {
    await page.goto('/series-dialog-color-test.html');
    await waitForChartReady(page);

    // Open dialog
    const gearIcon = page.locator('[data-testid="series-config-button"]');
    await gearIcon.click();
    await page.waitForTimeout(200);

    // Open color picker
    const colorButton = page.locator('[data-testid="series-color-button"]');
    await colorButton.click();
    await page.waitForTimeout(200);

    const colorPicker = page.locator('[data-testid="color-picker"]');

    // Should show preset colors
    await expect(colorPicker).toHaveScreenshot('color-picker-presets.png', {
      maxDiffPixelRatio: 0.02,
    });
  });
});

test.describe('Series Dialog - Line Style Configuration', () => {
  test('changes line width via slider', async ({ page }) => {
    await page.goto('/series-dialog-line-test.html');
    await waitForChartReady(page);

    const container = page.locator('#container');

    // Open dialog
    const gearIcon = page.locator('[data-testid="series-config-button"]');
    await gearIcon.click();
    await page.waitForTimeout(200);

    // Change line width slider to 4
    const widthSlider = page.locator('[data-testid="line-width-slider"]');
    await widthSlider.fill('4');
    await page.waitForTimeout(300);

    // Line should be thicker
    await expect(container).toHaveScreenshot('series-dialog-line-width-4.png', {
      maxDiffPixelRatio: 0.02,
    });
  });

  test('changes line style to dashed', async ({ page }) => {
    await page.goto('/series-dialog-line-test.html');
    await waitForChartReady(page);

    const container = page.locator('#container');

    // Open dialog
    const gearIcon = page.locator('[data-testid="series-config-button"]');
    await gearIcon.click();
    await page.waitForTimeout(200);

    // Select dashed line style
    const styleDropdown = page.locator('[data-testid="line-style-dropdown"]');
    await styleDropdown.selectOption('1'); // 1 = Dashed
    await page.waitForTimeout(300);

    // Line should be dashed
    await expect(container).toHaveScreenshot('series-dialog-line-style-dashed.png', {
      maxDiffPixelRatio: 0.02,
    });
  });

  test('changes line style to dotted', async ({ page }) => {
    await page.goto('/series-dialog-line-test.html');
    await waitForChartReady(page);

    const container = page.locator('#container');

    // Open dialog
    const gearIcon = page.locator('[data-testid="series-config-button"]');
    await gearIcon.click();
    await page.waitForTimeout(200);

    // Select dotted line style
    const styleDropdown = page.locator('[data-testid="line-style-dropdown"]');
    await styleDropdown.selectOption('2'); // 2 = Dotted
    await page.waitForTimeout(300);

    // Line should be dotted
    await expect(container).toHaveScreenshot('series-dialog-line-style-dotted.png', {
      maxDiffPixelRatio: 0.02,
    });
  });

  test('line style dropdown shows all options', async ({ page }) => {
    await page.goto('/series-dialog-line-test.html');
    await waitForChartReady(page);

    // Open dialog
    const gearIcon = page.locator('[data-testid="series-config-button"]');
    await gearIcon.click();
    await page.waitForTimeout(200);

    // Open line style dropdown
    const styleDropdown = page.locator('[data-testid="line-style-dropdown"]');
    await styleDropdown.click();
    await page.waitForTimeout(200);

    const dialog = page.locator('[data-testid="series-config-dialog"]');

    // Should show solid, dashed, dotted options
    await expect(dialog).toHaveScreenshot('line-style-dropdown-open.png', {
      maxDiffPixelRatio: 0.02,
    });
  });
});

test.describe('Series Dialog - Position Stability', () => {
  test('dialog stays in position during chart pan', async ({ page }) => {
    await page.goto('/series-dialog-position-test.html');
    await waitForChartReady(page);

    const container = page.locator('#container');

    // Open dialog
    const gearIcon = page.locator('[data-testid="series-config-button"]');
    await gearIcon.click();
    await page.waitForTimeout(200);

    // Dialog should be visible
    await expect(container).toHaveScreenshot('series-dialog-before-pan.png', {
      maxDiffPixelRatio: 0.02,
    });

    // Pan the chart (dialog should stay in place)
    const canvas = page.locator('canvas').first();
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    await page.mouse.move(box.x + 600, box.y + 200);
    await page.mouse.down();
    await page.mouse.move(box.x + 200, box.y + 200);
    await page.mouse.up();
    await page.waitForTimeout(300);

    // Dialog should remain in same screen position
    await expect(container).toHaveScreenshot('series-dialog-after-pan.png', {
      maxDiffPixelRatio: 0.02,
    });
  });

  test('dialog stays in position during chart zoom', async ({ page }) => {
    await page.goto('/series-dialog-position-test.html');
    await waitForChartReady(page);

    const container = page.locator('#container');

    // Open dialog
    const gearIcon = page.locator('[data-testid="series-config-button"]');
    await gearIcon.click();
    await page.waitForTimeout(200);

    // Zoom the chart
    const canvas = page.locator('canvas').first();
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    await page.mouse.move(box.x + 400, box.y + 200);
    await page.mouse.wheel(0, -500);
    await page.waitForTimeout(300);

    // Dialog should remain in same screen position
    await expect(container).toHaveScreenshot('series-dialog-after-zoom.png', {
      maxDiffPixelRatio: 0.02,
    });
  });

  test('dialog repositions on window resize', async ({ page }) => {
    await page.goto('/series-dialog-position-test.html');
    await waitForChartReady(page);

    // Open dialog
    const gearIcon = page.locator('[data-testid="series-config-button"]');
    await gearIcon.click();
    await page.waitForTimeout(200);

    // Resize window
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForTimeout(300);

    const container = page.locator('#container');

    // Dialog should reposition to stay visible
    await expect(container).toHaveScreenshot('series-dialog-after-resize.png', {
      maxDiffPixelRatio: 0.02,
    });
  });
});

test.describe('Series Dialog - Multiple Series', () => {
  test('dialog shows correct series info', async ({ page }) => {
    await page.goto('/series-dialog-multi-series-test.html');
    await waitForChartReady(page);

    // Open dialog for first series
    const gearIcon1 = page.locator('[data-testid="series-config-button-1"]');
    await gearIcon1.click();
    await page.waitForTimeout(200);

    const dialog = page.locator('[data-testid="series-config-dialog"]');

    // Should show Series 1 configuration
    await expect(dialog).toHaveScreenshot('series-dialog-series-1.png', {
      maxDiffPixelRatio: 0.02,
    });

    // Close and open dialog for second series
    const closeButton = page.locator('[data-testid="dialog-close"]');
    await closeButton.click();
    await page.waitForTimeout(200);

    const gearIcon2 = page.locator('[data-testid="series-config-button-2"]');
    await gearIcon2.click();
    await page.waitForTimeout(200);

    // Should show Series 2 configuration
    await expect(dialog).toHaveScreenshot('series-dialog-series-2.png', {
      maxDiffPixelRatio: 0.02,
    });
  });

  test('changes to one series dont affect others', async ({ page }) => {
    await page.goto('/series-dialog-multi-series-test.html');
    await waitForChartReady(page);

    const container = page.locator('#container');

    // Initial state - both series visible
    await expect(container).toHaveScreenshot('multi-series-initial.png', {
      maxDiffPixelRatio: 0.02,
    });

    // Open dialog for first series and change color
    const gearIcon1 = page.locator('[data-testid="series-config-button-1"]');
    await gearIcon1.click();
    await page.waitForTimeout(200);

    const colorButton = page.locator('[data-testid="series-color-button"]');
    await colorButton.click();
    await page.waitForTimeout(200);

    const redColor = page.locator('[data-color="#FF0000"]');
    await redColor.click();
    await page.waitForTimeout(300);

    // Only series 1 should be red, series 2 unchanged
    await expect(container).toHaveScreenshot('multi-series-one-changed.png', {
      maxDiffPixelRatio: 0.02,
    });
  });
});

test.describe('Series Dialog - Focus Management', () => {
  test('restores focus to trigger button after close', async ({ page }) => {
    await page.goto('/series-dialog-focus-test.html');
    await waitForChartReady(page);

    // Open dialog
    const gearIcon = page.locator('[data-testid="series-config-button"]');
    await gearIcon.click();
    await page.waitForTimeout(200);

    // Close dialog
    const closeButton = page.locator('[data-testid="dialog-close"]');
    await closeButton.click();
    await page.waitForTimeout(200);

    // Focus should return to gear icon
    const focusedElement = await page.evaluate(() =>
      document.activeElement?.getAttribute('data-testid')
    );
    expect(focusedElement).toBe('series-config-button');
  });

  test('traps focus within dialog', async ({ page }) => {
    await page.goto('/series-dialog-focus-test.html');
    await waitForChartReady(page);

    // Open dialog
    const gearIcon = page.locator('[data-testid="series-config-button"]');
    await gearIcon.click();
    await page.waitForTimeout(200);

    // Tab through dialog elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Focus should cycle back within dialog
    const focusedElement = page.locator(':focus');
    const isWithinDialog = await focusedElement.evaluate(el => {
      return !!el.closest('[data-testid="series-config-dialog"]');
    });

    expect(isWithinDialog).toBe(true);
  });
});
