# Playwright E2E Visual Regression Testing

## Overview

This directory contains **Playwright-based E2E (End-to-End) visual regression tests** that verify chart rendering in a real browser environment. These tests complement the Node Canvas visual tests by providing true browser rendering verification including CSS, fonts, and browser-specific behavior.

## Why Playwright E2E?

### Advantages

1. **True Browser Rendering**: Tests run in actual Chromium browser, capturing real-world rendering behavior
2. **CSS and Fonts**: Verifies complete visual appearance including all browser-applied styles
3. **Browser APIs**: Tests with actual browser APIs (ResizeObserver, matchMedia, etc.)
4. **Cross-browser Testing**: Can easily extend to test in Firefox, Safari, WebKit
5. **Visual Debugging**: Playwright UI mode allows visual inspection of test execution
6. **Screenshot Diff Reports**: Built-in HTML reports with visual diffs

### Comparison with Node Canvas Tests

| Feature | Playwright E2E | Node Canvas |
|---------|---------------|-------------|
| Environment | Real browser (Chromium) | Node.js with jsdom |
| Rendering | True browser rendering | Canvas API emulation |
| Speed | ~4-9 seconds | ~6 seconds |
| CSS/Fonts | ✅ Full support | ⚠️ Limited |
| Debugging | ✅ Visual UI mode | ⚠️ Terminal only |
| CI/CD | ✅ Headless mode | ✅ Native support |
| Setup | Requires browser install | No browser needed |
| Coverage | 6 tests (5 series types) | 41 tests (11 series types) |

**Recommendation**: Use both approaches together. Node Canvas for fast, comprehensive unit-level visual tests. Playwright E2E for critical user-facing scenarios and browser-specific verification.

## Directory Structure

```
src/__tests__/e2e-visual/
├── tests/
│   └── series.e2e.test.ts          # Playwright test file
├── pages/
│   ├── line-series.html            # Line series test page
│   ├── area-series.html            # Area series test page
│   ├── candlestick-series.html     # Candlestick series test page
│   ├── bar-histogram-series.html   # Bar & Histogram test page
│   └── baseline-series.html        # Baseline series test page
└── tests/
    └── series.e2e.test.ts-snapshots/
        ├── line-series-chromium-darwin.png
        ├── area-series-chromium-darwin.png
        ├── candlestick-series-chromium-darwin.png
        ├── bar-series-chromium-darwin.png
        ├── histogram-series-chromium-darwin.png
        └── baseline-series-chromium-darwin.png
```

## Running Tests

### Run All E2E Tests

```bash
npm run test:e2e
```

This runs all Playwright tests in headless mode and compares screenshots against baselines.

### Update Baseline Screenshots

When you intentionally change chart rendering:

```bash
npm run test:e2e:update
```

This regenerates all baseline screenshots with current rendering.

### Visual UI Mode

For interactive debugging and visual inspection:

```bash
npm run test:e2e:ui
```

This opens Playwright's UI where you can:
- See each test execution visually
- Inspect screenshot diffs
- Re-run specific tests
- Step through test execution

### Debug Mode

For detailed debugging with browser DevTools:

```bash
npm run test:e2e:debug
```

### View Test Report

After running tests, view the HTML report with visual diffs:

```bash
npm run test:e2e:report
```

## Configuration

Configuration is in `playwright.config.ts`:

```typescript
export default defineConfig({
  testDir: './src/__tests__/e2e-visual',
  timeout: 30000,

  // Screenshot comparison settings
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.02,      // Allow 2% pixel difference
      threshold: 0.2,                // Pixel color threshold
      animations: 'disabled',        // Disable animations
    },
  },

  // Web server for test pages
  webServer: {
    command: 'npx http-server src/__tests__/e2e-visual/pages -p 8080 -c-1',
    port: 8080,
    reuseExistingServer: true,
  },

  use: {
    baseURL: 'http://localhost:8080',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
});
```

### Key Settings

- **maxDiffPixelRatio**: 0.02 (2%) - Maximum allowed difference in pixels
- **threshold**: 0.2 - Color difference threshold per pixel (0-1 scale)
- **animations**: 'disabled' - Ensures consistent screenshots
- **port**: 8080 - Local web server port for HTML test pages

## Test Structure

### HTML Test Pages

Each HTML page:
1. Loads lightweight-charts from CDN (v5.0.8)
2. Creates a chart with specific configuration
3. Adds series with test data
4. Sets `window.chartReady = true` when complete

Example structure:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Line Series - E2E Visual Test</title>
    <script src="https://unpkg.com/lightweight-charts@5.0.8/dist/lightweight-charts.standalone.production.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #ffffff; }
        #container { width: 800px; height: 400px; margin: 20px; }
    </style>
</head>
<body>
    <div id="container"></div>
    <script>
        const { createChart, LineSeries } = LightweightCharts;

        const chart = createChart(document.getElementById('container'), {
            width: 800,
            height: 400,
            layout: { background: { color: '#FFFFFF' }, textColor: '#000000' },
        });

        const lineSeries = chart.addSeries(LineSeries, {
            color: '#2962FF',
            lineWidth: 2,
        });

        lineSeries.setData([/* ... data ... */]);
        chart.timeScale().fitContent();

        window.chartReady = true;
    </script>
</body>
</html>
```

### Playwright Test File

```typescript
import { test, expect } from '@playwright/test';

async function waitForChartReady(page: any) {
  await page.waitForFunction(() => (window as any).chartReady === true, {
    timeout: 10000,
  });
  await page.waitForTimeout(200); // Extra time for final rendering
}

test.describe('Line Series E2E Visual', () => {
  test('renders line series correctly', async ({ page }) => {
    await page.goto('/line-series.html');
    await waitForChartReady(page);

    const container = page.locator('#container');
    await expect(container).toHaveScreenshot('line-series.png', {
      maxDiffPixelRatio: 0.02,
    });
  });
});
```

## Adding New Tests

### 1. Create HTML Test Page

Create a new HTML file in `src/__tests__/e2e-visual/pages/`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>My Series - E2E Visual Test</title>
    <script src="https://unpkg.com/lightweight-charts@5.0.8/dist/lightweight-charts.standalone.production.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #ffffff; }
        #container { width: 800px; height: 400px; margin: 20px; }
    </style>
</head>
<body>
    <div id="container"></div>
    <script>
        // Your chart setup code
        window.chartReady = true; // Important: Set this when ready
    </script>
</body>
</html>
```

### 2. Add Test Case

Add a new test in `src/__tests__/e2e-visual/tests/series.e2e.test.ts`:

```typescript
test.describe('My Series E2E Visual', () => {
  test('renders my series correctly', async ({ page }) => {
    await page.goto('/my-series.html');
    await waitForChartReady(page);

    const container = page.locator('#container');
    await expect(container).toHaveScreenshot('my-series.png', {
      maxDiffPixelRatio: 0.02,
    });
  });
});
```

### 3. Generate Baseline

```bash
npm run test:e2e:update
```

### 4. Verify Test Passes

```bash
npm run test:e2e
```

## Current Test Coverage

### Series Types Tested (6 tests)

1. **Line Series** - Basic line chart with continuous data
2. **Area Series** - Area chart with gradient fill
3. **Candlestick Series** - OHLC candlestick chart
4. **Bar Series** - OHLC bar chart
5. **Histogram Series** - Histogram with color-coded bars
6. **Baseline Series** - Baseline chart with dual-color fill

### Test Execution

- **Runtime**: ~4-9 seconds for 6 tests
- **Browser**: Chromium (Chrome)
- **Resolution**: 800x400px per chart
- **Baseline Count**: 6 screenshots

## Troubleshooting

### Tests Failing After Code Changes

If tests fail after legitimate changes:

1. Review the HTML report to see visual diffs:
   ```bash
   npm run test:e2e:report
   ```

2. If changes are intentional, update baselines:
   ```bash
   npm run test:e2e:update
   ```

### Browser Not Installed

If you see "Browser not found" errors:

```bash
npx playwright install chromium
```

### Port Already in Use

If port 8080 is in use, update `playwright.config.ts`:

```typescript
webServer: {
  command: 'npx http-server src/__tests__/e2e-visual/pages -p 8081 -c-1',
  port: 8081,
},
use: {
  baseURL: 'http://localhost:8081',
}
```

### Tests Timing Out

If `window.chartReady` is not set:

1. Check browser console in UI mode:
   ```bash
   npm run test:e2e:ui
   ```

2. Verify `window.chartReady = true` is in your HTML file

3. Check for JavaScript errors in the HTML page

### Screenshots Don't Match

If tests fail with small pixel differences:

1. Check if differences are significant in the HTML report
2. Adjust `maxDiffPixelRatio` in `playwright.config.ts` if needed
3. Consider if differences are OS/browser-version specific

### CI/CD Issues

For CI/CD environments:

1. Ensure browsers are installed in CI:
   ```bash
   npx playwright install --with-deps chromium
   ```

2. Use headless mode (default):
   ```bash
   npm run test:e2e
   ```

3. Commit baseline screenshots to repository

## Best Practices

### 1. Deterministic Data

Use fixed, deterministic data in HTML test pages to ensure consistent rendering:

```javascript
// Good: Fixed data
const data = [
  { time: '2024-01-01', value: 100 },
  { time: '2024-01-02', value: 105 },
  // ...
];

// Bad: Random or date-dependent data
const data = generateRandomData(Math.random());
```

### 2. Disable Animations

Always disable animations to ensure consistent screenshots:

```javascript
const chart = createChart(container, {
  layout: { /* ... */ },
  timeScale: { /* ... */ },
  // No animation-related options
});
```

### 3. Fixed Dimensions

Use fixed dimensions, not responsive sizing:

```css
#container {
  width: 800px;  /* Fixed width */
  height: 400px; /* Fixed height */
}
```

### 4. Wait for Chart Ready

Always wait for chart to finish rendering:

```javascript
// At end of HTML script
window.chartReady = true;
```

```typescript
// In test file
await waitForChartReady(page);
await page.waitForTimeout(200); // Extra buffer
```

### 5. Baseline Management

- **Commit baselines** to version control
- **Review diffs** before updating baselines
- **Update selectively** using `npm run test:e2e:ui`
- **Document changes** in commit messages

### 6. Test Isolation

Each HTML page should be independent:
- No shared state between pages
- Self-contained data and configuration
- Clear, descriptive filenames

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: E2E Visual Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload test report
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

## Performance Considerations

### Execution Time

- **Initial run**: ~9 seconds (includes baseline generation)
- **Subsequent runs**: ~4-5 seconds
- **Per test**: ~600-700ms average

### Optimization Tips

1. **Run in parallel** (if adding many tests):
   ```typescript
   // playwright.config.ts
   workers: process.env.CI ? 1 : 2,
   ```

2. **Use shared browser context** for related tests

3. **Optimize HTML pages** (minimize dependencies)

4. **Cache browser installation** in CI

## Extending to Other Browsers

To test in Firefox or Safari:

```typescript
// playwright.config.ts
export default defineConfig({
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});
```

Install browsers:

```bash
npx playwright install firefox webkit
```

This generates separate baselines per browser:
- `line-series-chromium-darwin.png`
- `line-series-firefox-darwin.png`
- `line-series-webkit-darwin.png`

## Resources

- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Playwright Test Snapshots](https://playwright.dev/docs/test-snapshots)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [lightweight-charts API](https://tradingview.github.io/lightweight-charts/docs/api)

## E2E Test TODO: Comprehensive Coverage Plan

**Current Status**: 6 basic smoke tests (basic series rendering only)
**Required Total**: ~40-50 E2E tests for comprehensive coverage
**Missing**: ~34-44 tests (interactive features, workflows, custom series)

**Test Coverage Strategy**:
- **Node Canvas Visual Tests**: Fast, comprehensive visual appearance testing (79 tests)
- **Playwright E2E Tests**: Real browser interactions, workflows, and integration testing (6 tests → need ~40-50)

---

### Test Categories Overview

1. **Interactive Features** (15-20 tests) - User interactions with UI elements
2. **Custom Series in Browser** (5 tests) - Custom series rendering in real browser
3. **User Workflows** (8-10 tests) - Multi-step user scenarios
4. **Multi-Chart Scenarios** (5-6 tests) - Multiple charts interactions
5. **Browser-Specific Features** (4-5 tests) - ResizeObserver, browser APIs
6. **Performance & Memory** (3-4 tests) - Browser performance monitoring
7. **Accessibility** (3-4 tests) - A11y compliance

---

## 1. Interactive Features (15-20 tests)

### Pane Collapse/Expand (4 tests)

#### ❌ Test: Collapse Pane Button Click
**File**: `src/__tests__/e2e-visual/tests/interactions.e2e.test.ts`

**What to test**:
- Multi-pane chart with collapse buttons
- Click collapse button
- Verify pane collapses (height reduces)
- Verify button icon changes
- Screenshot comparison before/after

**Why important**: Core interactive feature, directly impacts UX.

**Example**:
```typescript
test('collapses pane when collapse button clicked', async ({ page }) => {
  await page.goto('/multi-pane-collapse.html');
  await waitForChartReady(page);

  // Take initial screenshot
  const container = page.locator('#container');
  await expect(container).toHaveScreenshot('pane-before-collapse.png');

  // Click collapse button for pane 1
  const collapseBtn = page.locator('[data-testid="collapse-pane-1"]');
  await collapseBtn.click();
  await page.waitForTimeout(300); // Wait for animation

  // Verify pane is collapsed
  await expect(container).toHaveScreenshot('pane-after-collapse.png');

  // Verify button icon changed (should show expand icon)
  const icon = collapseBtn.locator('svg');
  await expect(icon).toHaveAttribute('data-icon', 'expand');
});
```

---

#### ❌ Test: Expand Collapsed Pane
Test expanding a collapsed pane, verify height restoration.

---

#### ❌ Test: Multiple Panes Collapse/Expand
Test collapsing multiple panes, verify layout adjustments.

---

#### ❌ Test: Collapse All Except One
Test behavior when all but one pane are collapsed.

---

### Tooltip Interactions (3 tests)

#### ❌ Test: Tooltip Appears on Hover
**File**: `src/__tests__/e2e-visual/tests/interactions.e2e.test.ts`

**What to test**:
- Hover over chart
- Tooltip appears with correct data
- Tooltip follows cursor
- Screenshot with tooltip visible

**Example**:
```typescript
test('displays tooltip on chart hover', async ({ page }) => {
  await page.goto('/chart-with-tooltip.html');
  await waitForChartReady(page);

  const chartCanvas = page.locator('canvas').first();

  // Hover at specific coordinate
  await chartCanvas.hover({ position: { x: 400, y: 200 } });
  await page.waitForTimeout(100); // Wait for tooltip

  // Verify tooltip is visible
  const tooltip = page.locator('[data-testid="chart-tooltip"]');
  await expect(tooltip).toBeVisible();

  // Screenshot with tooltip
  const container = page.locator('#container');
  await expect(container).toHaveScreenshot('chart-with-tooltip.png');
});
```

---

#### ❌ Test: Tooltip Updates on Mouse Move
Test tooltip updates as cursor moves across chart.

---

#### ❌ Test: Tooltip Hides on Mouse Leave
Test tooltip disappears when mouse leaves chart area.

---

### Legend Interactions (4 tests)

#### ❌ Test: Legend Click Toggles Series Visibility
**File**: `src/__tests__/e2e-visual/tests/interactions.e2e.test.ts`

**What to test**:
- Multi-series chart with legend
- Click legend item to hide series
- Verify series disappears
- Click again to show series
- Screenshot comparison

**Example**:
```typescript
test('toggles series visibility on legend click', async ({ page }) => {
  await page.goto('/chart-with-legend.html');
  await waitForChartReady(page);

  const container = page.locator('#container');

  // Initial state - all series visible
  await expect(container).toHaveScreenshot('legend-all-visible.png');

  // Click legend item to hide series
  const legendItem = page.locator('[data-series-id="series-1"]');
  await legendItem.click();
  await page.waitForTimeout(100);

  // Verify series is hidden
  await expect(container).toHaveScreenshot('legend-series-hidden.png');

  // Click again to show
  await legendItem.click();
  await page.waitForTimeout(100);

  await expect(container).toHaveScreenshot('legend-series-shown.png');
});
```

---

#### ❌ Test: Legend Hover Shows Highlight
Test hovering legend item highlights corresponding series.

---

#### ❌ Test: Dynamic Legend Values Update
Test legend values update as chart scrolls/zooms.

---

#### ❌ Test: Multi-Pane Legend Positioning
Test legend positioning across multiple panes.

---

### Range Switcher (2 tests)

#### ❌ Test: Range Button Click Changes Time Range
**File**: `src/__tests__/e2e-visual/tests/interactions.e2e.test.ts`

**What to test**:
- Click range button (1D, 1W, 1M, etc.)
- Verify time range changes
- Verify button active state
- Screenshot comparison

---

#### ❌ Test: Custom Range Input
Test entering custom date range via inputs.

---

### Chart Positioning & Z-Index (3 tests)

#### ❌ Test: Chart Z-Index Ordering
**File**: `src/__tests__/e2e-visual/tests/positioning.e2e.test.ts`

**What to test**:
- Multiple charts with different z-index values
- Verify stacking order
- Test overlapping charts

---

#### ❌ Test: Chart Position Fixed/Absolute
Test charts with position: fixed or absolute CSS.

---

#### ❌ Test: Sticky Chart Headers
Test sticky positioning for chart headers on scroll.

---

---

## 2. Custom Series in Browser (5 tests)

### Custom Series Rendering (5 tests)

#### ❌ Test: TrendFill Series in Browser
**File**: `src/__tests__/e2e-visual/tests/custom-series.e2e.test.ts`

**What to test**:
- TrendFill custom series loaded via script
- Verify gradient rendering in real browser
- Test uptrend/downtrend transitions
- Screenshot comparison

**Why important**: Custom series use advanced Canvas APIs that may behave differently in browser.

**Example**:
```typescript
test('renders TrendFill custom series correctly', async ({ page }) => {
  await page.goto('/custom-trendfill.html');
  await waitForChartReady(page);

  const container = page.locator('#container');
  await expect(container).toHaveScreenshot('custom-trendfill.png', {
    maxDiffPixelRatio: 0.03, // Slightly higher tolerance for custom series
  });

  // Verify series data is loaded
  const dataPoints = await page.evaluate(() => {
    return (window as any).trendFillSeries.data().length;
  });
  expect(dataPoints).toBeGreaterThan(0);
});
```

---

#### ❌ Test: Band Series (Bollinger Bands) in Browser
Test Band custom series with upper/middle/lower lines and fills.

---

#### ❌ Test: Ribbon Series in Browser
Test Ribbon custom series gradient rendering.

---

#### ❌ Test: Signal Series in Browser
Test Signal series vertical bands rendering.

---

#### ❌ Test: GradientRibbon Series in Browser
Test GradientRibbon color interpolation in real browser.

---

---

## 3. User Workflows (8-10 tests)

### Multi-Step Interactions (8 tests)

#### ❌ Test: Add Series → Toggle Visibility → Remove Series
**File**: `src/__tests__/e2e-visual/tests/workflows.e2e.test.ts`

**What to test**:
- Start with empty chart
- Programmatically add series
- Toggle visibility via legend
- Remove series
- Verify clean state at each step

**Example**:
```typescript
test('completes add-toggle-remove series workflow', async ({ page }) => {
  await page.goto('/interactive-chart.html');
  await waitForChartReady(page);

  const container = page.locator('#container');

  // Initial empty state
  await expect(container).toHaveScreenshot('workflow-empty.png');

  // Add series via button
  await page.click('[data-action="add-series"]');
  await page.waitForTimeout(200);
  await expect(container).toHaveScreenshot('workflow-series-added.png');

  // Toggle visibility
  await page.click('[data-series-toggle="series-1"]');
  await page.waitForTimeout(100);
  await expect(container).toHaveScreenshot('workflow-series-hidden.png');

  // Remove series
  await page.click('[data-action="remove-series"]');
  await page.waitForTimeout(200);
  await expect(container).toHaveScreenshot('workflow-series-removed.png');
});
```

---

#### ❌ Test: Collapse Pane → Resize Window → Expand Pane
Test pane behavior across window resize.

---

#### ❌ Test: Zoom In → Pan → Zoom Out → Reset
Test complete zoom/pan workflow.

---

#### ❌ Test: Switch Series Type Dynamically
Test changing series type (line → candlestick → area).

---

#### ❌ Test: Update Options → Verify Render → Revert
Test option updates and reversion.

---

#### ❌ Test: Multi-Series Add → Reorder → Remove
Test managing multiple series lifecycle.

---

#### ❌ Test: Tooltip Interaction → Legend Click → Verify State
Test interaction between tooltip and legend.

---

#### ❌ Test: Load Data → Filter → Sort → Export
Test complete data manipulation workflow.

---

---

## 4. Multi-Chart Scenarios (5-6 tests)

### Multiple Charts on Page (5 tests)

#### ❌ Test: Two Independent Charts
**File**: `src/__tests__/e2e-visual/tests/multi-chart.e2e.test.ts`

**What to test**:
- Two separate charts on same page
- Each with different data/options
- Verify no interference
- Independent interactions

**Example**:
```typescript
test('renders two independent charts without interference', async ({ page }) => {
  await page.goto('/two-charts.html');
  await waitForChartReady(page);

  const chart1 = page.locator('#chart-1');
  const chart2 = page.locator('#chart-2');

  // Screenshot both charts
  await expect(chart1).toHaveScreenshot('multi-chart-1.png');
  await expect(chart2).toHaveScreenshot('multi-chart-2.png');

  // Interact with chart 1, verify chart 2 unaffected
  await chart1.locator('canvas').click({ position: { x: 400, y: 200 } });
  await page.waitForTimeout(100);

  // Chart 2 should remain unchanged
  await expect(chart2).toHaveScreenshot('multi-chart-2.png');
});
```

---

#### ❌ Test: Synchronized Time Scale (Linked Charts)
Test two charts with synchronized time ranges.

---

#### ❌ Test: Chart Grid Layout (4 charts)
Test 2x2 grid of charts with proper spacing.

---

#### ❌ Test: Dynamic Chart Creation/Destruction
Test adding and removing charts dynamically.

---

#### ❌ Test: Chart Inside Modal/Popup
Test chart rendering inside modal dialog.

---

---

## 5. Browser-Specific Features (4-5 tests)

### Browser APIs & Behavior (5 tests)

#### ❌ Test: ResizeObserver Behavior
**File**: `src/__tests__/e2e-visual/tests/browser-features.e2e.test.ts`

**What to test**:
- Chart with auto-sizing enabled
- Resize browser window
- Verify chart resizes correctly via ResizeObserver
- Screenshot at different sizes

**Example**:
```typescript
test('chart auto-resizes on window resize', async ({ page }) => {
  await page.goto('/auto-size-chart.html');
  await waitForChartReady(page);

  // Initial size (1280x720)
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.waitForTimeout(200);

  const container = page.locator('#container');
  await expect(container).toHaveScreenshot('resize-1280.png');

  // Resize to smaller
  await page.setViewportSize({ width: 800, height: 600 });
  await page.waitForTimeout(500); // Wait for ResizeObserver

  await expect(container).toHaveScreenshot('resize-800.png');

  // Verify chart dimensions match container
  const chartWidth = await page.evaluate(() => {
    return (window as any).chart.options().width;
  });
  expect(chartWidth).toBeLessThanOrEqual(800);
});
```

---

#### ❌ Test: matchMedia Dark Mode Detection
Test chart responds to browser dark mode preference.

---

#### ❌ Test: CSS Custom Properties
Test chart styling with CSS variables.

---

#### ❌ Test: Browser Zoom (ctrl +/-)
Test chart rendering at different browser zoom levels (100%, 125%, 150%).

---

#### ❌ Test: Font Rendering Consistency
Test chart with custom web fonts loaded via @font-face.

---

---

## 6. Performance & Memory (3-4 tests)

### Browser Performance (4 tests)

#### ❌ Test: Large Dataset Rendering Performance
**File**: `src/__tests__/e2e-visual/tests/performance.e2e.test.ts`

**What to test**:
- Chart with 10,000+ data points
- Measure rendering time
- Verify no browser freezing
- Monitor memory usage

**Example**:
```typescript
test('renders large dataset without performance issues', async ({ page }) => {
  await page.goto('/large-dataset.html');

  // Monitor performance
  const startTime = Date.now();
  await waitForChartReady(page);
  const renderTime = Date.now() - startTime;

  // Should render within reasonable time
  expect(renderTime).toBeLessThan(3000); // 3 seconds

  // Check memory usage
  const metrics = await page.evaluate(() => {
    return (performance as any).memory?.usedJSHeapSize;
  });

  // Screenshot to verify visual correctness
  const container = page.locator('#container');
  await expect(container).toHaveScreenshot('large-dataset.png', {
    maxDiffPixelRatio: 0.05, // Higher tolerance for large datasets
  });
});
```

---

#### ❌ Test: Smooth Scroll/Zoom Performance
Test frame rate during smooth scrolling/zooming.

---

#### ❌ Test: Memory Leak Detection
Test creating and destroying charts repeatedly, monitor memory.

---

#### ❌ Test: Multiple Charts Memory Usage
Test memory usage with 10+ charts on page.

---

---

## 7. Accessibility (3-4 tests)

### A11y Compliance (4 tests)

#### ❌ Test: Keyboard Navigation
**File**: `src/__tests__/e2e-visual/tests/accessibility.e2e.test.ts`

**What to test**:
- Tab through interactive elements
- Enter/Space to activate buttons
- Arrow keys to navigate chart (if implemented)
- Verify focus indicators

**Example**:
```typescript
test('supports keyboard navigation', async ({ page }) => {
  await page.goto('/interactive-chart.html');
  await waitForChartReady(page);

  // Tab to first interactive element
  await page.keyboard.press('Tab');

  // Verify focus on collapse button
  const focusedElement = page.locator(':focus');
  await expect(focusedElement).toHaveAttribute('data-testid', 'collapse-pane-1');

  // Activate with keyboard
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);

  // Verify pane collapsed
  const container = page.locator('#container');
  await expect(container).toHaveScreenshot('keyboard-pane-collapsed.png');
});
```

---

#### ❌ Test: ARIA Labels Present
Test all interactive elements have proper aria-labels.

---

#### ❌ Test: Screen Reader Announcements
Test important state changes trigger aria-live regions.

---

#### ❌ Test: Focus Trapping in Modals
Test focus management when chart is in modal dialog.

---

---

## Test File Organization

### Recommended Structure

```
src/__tests__/e2e-visual/
├── tests/
│   ├── series.e2e.test.ts              ✅ 6 tests (COMPLETE)
│   ├── interactions.e2e.test.ts        🔴 NEW FILE (15-20 tests needed)
│   │   ├── Pane collapse/expand
│   │   ├── Tooltip interactions
│   │   ├── Legend interactions
│   │   ├── Range switcher
│   │   └── Chart positioning
│   ├── custom-series.e2e.test.ts       🔴 NEW FILE (5 tests needed)
│   │   ├── TrendFill in browser
│   │   ├── Band series
│   │   ├── Ribbon series
│   │   ├── Signal series
│   │   └── GradientRibbon series
│   ├── workflows.e2e.test.ts           🔴 NEW FILE (8-10 tests needed)
│   │   └── Multi-step user scenarios
│   ├── multi-chart.e2e.test.ts         🔴 NEW FILE (5-6 tests needed)
│   │   └── Multiple charts on page
│   ├── browser-features.e2e.test.ts    🔴 NEW FILE (4-5 tests needed)
│   │   └── Browser APIs and behavior
│   ├── performance.e2e.test.ts         🔴 NEW FILE (3-4 tests needed)
│   │   └── Performance and memory tests
│   └── accessibility.e2e.test.ts       🔴 NEW FILE (3-4 tests needed)
│       └── A11y compliance tests
│
├── pages/
│   ├── [Basic Series Pages]            ✅ COMPLETE (6 pages)
│   ├── multi-pane-collapse.html        🔴 NEW (pane interactions)
│   ├── chart-with-tooltip.html         🔴 NEW (tooltip)
│   ├── chart-with-legend.html          🔴 NEW (legend)
│   ├── custom-trendfill.html           🔴 NEW (custom series)
│   ├── custom-band.html                🔴 NEW (custom series)
│   ├── custom-ribbon.html              🔴 NEW (custom series)
│   ├── custom-signal.html              🔴 NEW (custom series)
│   ├── custom-gradient-ribbon.html     🔴 NEW (custom series)
│   ├── interactive-chart.html          🔴 NEW (workflows)
│   ├── two-charts.html                 🔴 NEW (multi-chart)
│   ├── auto-size-chart.html            🔴 NEW (ResizeObserver)
│   ├── large-dataset.html              🔴 NEW (performance)
│   └── keyboard-navigation.html        🔴 NEW (accessibility)
```

---

## Coverage Goals

### Current Status ✅
- **Basic Series Rendering**: 6 tests (100% of basic series)

### Target Status (Comprehensive E2E Coverage)
- **Interactive Features**: 0/15-20 tests
- **Custom Series in Browser**: 0/5 tests
- **User Workflows**: 0/8-10 tests
- **Multi-Chart Scenarios**: 0/5-6 tests
- **Browser Features**: 0/4-5 tests
- **Performance**: 0/3-4 tests
- **Accessibility**: 0/3-4 tests

**Total**: 6 tests → need 40-50 tests for comprehensive coverage

---

## Combined Test Strategy (Visual + E2E)

### Coverage Distribution

| Test Type | Focus Area | Test Count | Speed | Environment |
|-----------|-----------|------------|-------|-------------|
| **Node Canvas Visual** | Visual appearance options | 79 tests (need +25) | Fast (~6s) | Node.js |
| **Playwright E2E** | Interactions & workflows | 6 tests (need +34-44) | Medium (~4-9s) | Real browser |
| **Total Target** | Complete coverage | ~140-180 tests | Combined | Both |

### Complementary Coverage

**Node Canvas Visual Tests** (VISUAL_TESTING_TODO.md):
- ✅ All builtin series visual options (38 tests complete)
- 🔴 Custom series visual options (25 tests needed)
- ✅ Color, styles, widths, gradients
- ✅ Price lines, titles, visibility
- ⚡ Fast execution for CI/CD

**Playwright E2E Tests** (This document):
- 🔴 Interactive UI elements (15-20 tests needed)
- 🔴 User workflows (8-10 tests needed)
- 🔴 Custom series in real browser (5 tests needed)
- 🔴 Multi-chart scenarios (5-6 tests needed)
- 🔴 Browser APIs and performance (7-9 tests needed)
- 🔴 Accessibility (3-4 tests needed)

### Test Selection Guidelines

**Use Node Canvas Visual Tests for**:
- Series visual options (colors, styles, widths)
- Chart option variations (layouts, scales)
- Data format variations
- Quick regression testing
- CI/CD pipeline (faster)

**Use Playwright E2E Tests for**:
- Button clicks and UI interactions
- Multi-step user workflows
- Browser-specific behavior
- Real DOM/CSS rendering
- Performance monitoring
- Accessibility verification
- Integration scenarios

---

## Implementation Priority

### Phase 1: Critical Interactive Features (2-3 weeks)
1. **Pane Collapse/Expand** (4 tests) - Core UX feature
2. **Legend Interactions** (4 tests) - Frequently used
3. **Tooltip Behavior** (3 tests) - Essential feedback
4. **Range Switcher** (2 tests) - Common use case

**Estimated effort**: 15-20 hours
**Impact**: Covers most critical user interactions

---

### Phase 2: Custom Series & Workflows (2-3 weeks)
1. **Custom Series in Browser** (5 tests) - Production features
2. **User Workflows** (8-10 tests) - Real-world scenarios
3. **Chart Positioning** (3 tests) - Layout features

**Estimated effort**: 20-25 hours
**Impact**: Validates complex features in real browser

---

### Phase 3: Multi-Chart & Browser Features (1-2 weeks)
1. **Multi-Chart Scenarios** (5-6 tests) - Integration testing
2. **Browser APIs** (4-5 tests) - Browser-specific behavior
3. **Performance Tests** (3-4 tests) - Performance monitoring

**Estimated effort**: 15-20 hours
**Impact**: Comprehensive integration coverage

---

### Phase 4: Accessibility & Polish (1 week)
1. **Accessibility Tests** (3-4 tests) - A11y compliance
2. **Edge Cases** - Unusual scenarios
3. **Cross-browser Testing** - Firefox/Safari

**Estimated effort**: 10-12 hours
**Impact**: Production-ready quality

---

## Success Metrics

### Coverage Targets
- **Interactive Features**: 100% of UI elements tested
- **Custom Series**: All 5 custom series verified in browser
- **User Workflows**: Top 8-10 user scenarios covered
- **Multi-Chart**: All integration scenarios tested
- **Performance**: Key performance metrics monitored
- **Accessibility**: WCAG 2.1 Level AA compliance

### Quality Metrics
- **Test Pass Rate**: 100% on main branch
- **False Positives**: < 2% (adjust thresholds as needed)
- **Execution Time**: < 2 minutes for all E2E tests
- **Maintenance Effort**: < 10% of tests need updates per release

### Combined Coverage (Visual + E2E)
- **Visual Appearance**: 95%+ (Node Canvas tests)
- **Interactive Behavior**: 90%+ (Playwright E2E tests)
- **Browser Compatibility**: Chromium, Firefox, Safari
- **Accessibility**: WCAG 2.1 AA compliance
- **Performance**: Monitored and benchmarked

---

## Notes

- E2E tests complement, not duplicate, Node Canvas visual tests
- Focus E2E on interactions, workflows, and browser-specific behavior
- Keep HTML test pages simple and deterministic
- Use data-testid attributes for reliable element selection
- Monitor test execution time, optimize as needed
- Review and update baselines carefully
- Document test failures and fixes in commit messages

---

## Summary

Playwright E2E visual testing provides:
- ✅ True browser rendering verification
- ✅ Full CSS and font support
- ✅ Visual debugging capabilities
- ✅ Cross-browser testing potential
- ✅ Built-in screenshot comparison
- ✅ Comprehensive HTML reports

**Current Status**: 6 basic tests (smoke tests only)
**Target**: 40-50 comprehensive E2E tests covering interactions, workflows, and browser behavior

Use alongside Node Canvas tests for complete coverage:
- **Node Canvas**: Fast visual regression (appearance)
- **Playwright E2E**: Real browser interactions (behavior)
