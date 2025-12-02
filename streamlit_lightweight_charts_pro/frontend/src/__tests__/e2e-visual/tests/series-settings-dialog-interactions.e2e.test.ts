/**
 * E2E Tests for Series Settings Dialog Interactions
 *
 * Tests complex interaction flows that are difficult to test in unit tests:
 * - Line editor opening/saving workflows
 * - Color picker interactions
 * - Toggle interactions with state updates
 * - Keyboard navigation (Escape key handling)
 * - Conditional UI visibility based on user actions
 *
 * These tests replace the 14 failing unit tests that involved complex
 * async state updates with nested dialogs.
 *
 * @see https://playwright.dev/docs/test-snapshots
 */

import { test, expect } from '@playwright/test';

/**
 * Helper to wait for dialog to be ready
 */
async function waitForDialogReady(page: any) {
  await page.waitForSelector('[role="dialog"]', { state: 'visible' });
  await page.waitForTimeout(200);
}

test.describe('Series Settings Dialog - Line Editor Interactions', () => {
  test('should open line editor when line row is clicked', async ({ page }) => {
    await page.goto('http://localhost:8080/series-settings-dialog-test.html');
    await page.waitForTimeout(500);

    // Open series settings dialog
    const settingsButton = page.locator('[data-testid="series-config-button"]');
    await settingsButton.click();
    await waitForDialogReady(page);

    // Find and click on Main Line row in the active Line Series tab
    const mainLineRow = page.locator('#line-settings .line-row[data-line-type="mainLine"]');
    await mainLineRow.click();
    await page.waitForTimeout(300);

    // Line editor should be visible
    const lineEditor = page.locator('[data-testid="line-editor"]');
    await expect(lineEditor).toBeVisible();
  });

  test('should update mainLine config when line editor saves', async ({ page }) => {
    await page.goto('http://localhost:8080/series-settings-dialog-test.html');
    await page.waitForTimeout(500);

    // Open series settings dialog
    const settingsButton = page.locator('[data-testid="series-config-button"]');
    await settingsButton.click();
    await waitForDialogReady(page);

    // Open line editor
    const mainLineRow = page.locator('#line-settings .line-row[data-line-type="mainLine"]');
    await mainLineRow.click();
    await page.waitForTimeout(300);

    // Change line properties
    const colorInput = page.locator('[data-testid="line-color-input"]');
    await colorInput.evaluate((el: HTMLInputElement) => (el.value = '#FF0000'));

    const styleSelect = page.locator('[data-testid="line-style-select"]');
    await styleSelect.selectOption('dashed');

    const widthInput = page.locator('[data-testid="line-width-input"]');
    await widthInput.fill('3');

    // Save changes
    const saveButton = page.locator('text=Save Line');
    await saveButton.click();
    await page.waitForTimeout(300);

    // Line editor should close
    const lineEditor = page.locator('[data-testid="line-editor"]');
    await expect(lineEditor).not.toBeVisible();

    // Main line should now show updated properties in the active Line Series tab
    const linePreview = page.locator(
      '#line-settings .line-row[data-line-type="mainLine"] .line-preview'
    );
    await expect(linePreview).toContainText('dashed');
    await expect(linePreview).toContainText('3px');
  });
});

test.describe('Series Settings Dialog - Area Series Toggles', () => {
  test('should toggle invertFilledArea property', async ({ page }) => {
    await page.goto('http://localhost:8080/series-settings-dialog-test.html');
    await page.waitForTimeout(500);

    // Open series settings dialog
    const settingsButton = page.locator('[data-testid="series-config-button"]');
    await settingsButton.click();
    await waitForDialogReady(page);

    // Switch to area series tab
    const areaTab = page.locator('text=Area Series');
    await areaTab.click();
    await page.waitForTimeout(200);

    // Find and toggle invertFilledArea checkbox
    const invertCheckbox = page.locator('input[id="invertFilledArea"]');
    const isChecked = await invertCheckbox.isChecked();

    await invertCheckbox.click();
    await page.waitForTimeout(300);

    // Checkbox should be toggled
    if (isChecked) {
      await expect(invertCheckbox).not.toBeChecked();
    } else {
      await expect(invertCheckbox).toBeChecked();
    }
  });

  test('should toggle relativeGradient property', async ({ page }) => {
    await page.goto('http://localhost:8080/series-settings-dialog-test.html');
    await page.waitForTimeout(500);

    // Open series settings dialog
    const settingsButton = page.locator('[data-testid="series-config-button"]');
    await settingsButton.click();
    await waitForDialogReady(page);

    // Switch to area series tab
    const areaTab = page.locator('text=Area Series');
    await areaTab.click();
    await page.waitForTimeout(200);

    // Find and toggle relativeGradient checkbox
    const relativeCheckbox = page.locator('input[id="relativeGradient"]');
    const isChecked = await relativeCheckbox.isChecked();

    await relativeCheckbox.click();
    await page.waitForTimeout(300);

    // Checkbox should be toggled
    if (isChecked) {
      await expect(relativeCheckbox).not.toBeChecked();
    } else {
      await expect(relativeCheckbox).toBeChecked();
    }
  });
});

test.describe('Series Settings Dialog - Ribbon Series Interactions', () => {
  test('should hide fill color settings when fill is disabled', async ({ page }) => {
    await page.goto('http://localhost:8080/series-settings-dialog-test.html');
    await page.waitForTimeout(500);

    // Open series settings dialog
    const settingsButton = page.locator('[data-testid="series-config-button"]');
    await settingsButton.click();
    await waitForDialogReady(page);

    // Switch to ribbon series tab
    const ribbonTab = page.locator('text=Ribbon Series');
    await ribbonTab.click();
    await page.waitForTimeout(200);

    // Fill color should initially be visible
    const fillColorRow = page.locator('text=Fill Color');
    await expect(fillColorRow).toBeVisible();

    // Toggle fill visibility off
    const fillCheckbox = page.locator('input[id="fillVisible"]');
    await fillCheckbox.click();
    await page.waitForTimeout(300);

    // Fill color row should now be hidden
    await expect(fillColorRow).not.toBeVisible();
  });

  test('should open color picker for fill color', async ({ page }) => {
    await page.goto('http://localhost:8080/series-settings-dialog-test.html');
    await page.waitForTimeout(500);

    // Open series settings dialog
    const settingsButton = page.locator('[data-testid="series-config-button"]');
    await settingsButton.click();
    await waitForDialogReady(page);

    // Switch to ribbon series tab
    const ribbonTab = page.locator('text=Ribbon Series');
    await ribbonTab.click();
    await page.waitForTimeout(200);

    // Click on fill color row
    const fillColorRow = page
      .locator('text=Fill Color')
      .locator('xpath=ancestor::div[@role="button"]');
    await fillColorRow.click();
    await page.waitForTimeout(300);

    // Color picker should be visible
    const colorPicker = page.locator('[data-testid="color-picker"]');
    await expect(colorPicker).toBeVisible();
  });
});

test.describe('Series Settings Dialog - Keyboard Navigation', () => {
  test('should handle Escape key to close sub-dialogs first', async ({ page }) => {
    await page.goto('http://localhost:8080/series-settings-dialog-test.html');
    await page.waitForTimeout(500);

    // Open series settings dialog
    const settingsButton = page.locator('[data-testid="series-config-button"]');
    await settingsButton.click();
    await waitForDialogReady(page);

    // Open line editor
    const mainLineRow = page.locator('#line-settings .line-row[data-line-type="mainLine"]');
    await mainLineRow.click();
    await page.waitForTimeout(300);

    // Line editor should be visible
    const lineEditor = page.locator('[data-testid="line-editor"]');
    await expect(lineEditor).toBeVisible();

    // Press Escape - should close line editor, not main dialog
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);

    // Line editor should be closed
    await expect(lineEditor).not.toBeVisible();

    // Main dialog should still be open
    const mainDialog = page.locator('[role="dialog"]').first();
    await expect(mainDialog).toBeVisible();

    // Press Escape again - should close main dialog
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);

    // Main dialog should now be closed
    await expect(mainDialog).not.toBeVisible();
  });

  test('should close color picker on Escape before closing main dialog', async ({ page }) => {
    await page.goto('http://localhost:8080/series-settings-dialog-test.html');
    await page.waitForTimeout(500);

    // Open series settings dialog
    const settingsButton = page.locator('[data-testid="series-config-button"]');
    await settingsButton.click();
    await waitForDialogReady(page);

    // Switch to ribbon series tab
    const ribbonTab = page.locator('text=Ribbon Series');
    await ribbonTab.click();
    await page.waitForTimeout(200);

    // Open color picker
    const fillColorRow = page
      .locator('text=Fill Color')
      .locator('xpath=ancestor::div[@role="button"]');
    await fillColorRow.click();
    await page.waitForTimeout(300);

    // Color picker should be visible
    const colorPicker = page.locator('[data-testid="color-picker"]');
    await expect(colorPicker).toBeVisible();

    // Press Escape - should close color picker
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);

    // Color picker should be closed
    await expect(colorPicker).not.toBeVisible();

    // Main dialog should still be open
    const mainDialog = page.locator('[role="dialog"]').first();
    await expect(mainDialog).toBeVisible();
  });
});

test.describe('Series Settings Dialog - Visual Regression', () => {
  test('line editor displays correctly', async ({ page }) => {
    await page.goto('http://localhost:8080/series-settings-dialog-test.html');
    await page.waitForTimeout(500);

    // Open series settings dialog
    const settingsButton = page.locator('[data-testid="series-config-button"]');
    await settingsButton.click();
    await waitForDialogReady(page);

    // Open line editor
    const mainLineRow = page.locator('#line-settings .line-row[data-line-type="mainLine"]');
    await mainLineRow.click();
    await page.waitForTimeout(300);

    const lineEditor = page.locator('[data-testid="line-editor"]');

    // Visual snapshot of line editor
    await expect(lineEditor).toHaveScreenshot('series-settings-line-editor.png', {
      maxDiffPixelRatio: 0.02,
    });
  });

  test('color picker displays correctly', async ({ page }) => {
    await page.goto('http://localhost:8080/series-settings-dialog-test.html');
    await page.waitForTimeout(500);

    // Open series settings dialog
    const settingsButton = page.locator('[data-testid="series-config-button"]');
    await settingsButton.click();
    await waitForDialogReady(page);

    // Switch to ribbon series tab
    const ribbonTab = page.locator('text=Ribbon Series');
    await ribbonTab.click();
    await page.waitForTimeout(200);

    // Open color picker
    const fillColorRow = page
      .locator('text=Fill Color')
      .locator('xpath=ancestor::div[@role="button"]');
    await fillColorRow.click();
    await page.waitForTimeout(300);

    const colorPicker = page.locator('[data-testid="color-picker"]');

    // Visual snapshot of color picker
    await expect(colorPicker).toHaveScreenshot('series-settings-color-picker.png', {
      maxDiffPixelRatio: 0.02,
    });
  });
});
