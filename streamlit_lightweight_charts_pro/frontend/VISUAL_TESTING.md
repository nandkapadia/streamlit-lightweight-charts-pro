# Visual Regression Testing - Complete Guide

## 📋 Table of Contents

1. [Overview](#overview)
2. [Implementation Status](#implementation-status)
3. [Quick Start](#quick-start)
4. [Architecture](#architecture)
5. [Running Tests](#running-tests)
6. [Writing Tests](#writing-tests)
7. [Updating Baselines](#updating-baselines)
8. [TODO: Missing Tests](#todo-missing-tests)
9. [Troubleshooting](#troubleshooting)
10. [Best Practices](#best-practices)

---

## Overview

This project uses **Node Canvas visual regression testing** to verify pixel-perfect chart rendering and catch visual bugs that unit tests cannot detect.

### ✅ What's Implemented

- **79 tests passing** across 6 builtin series types
- **39 baseline snapshots** committed
- **True canvas rendering** using node-canvas (not mocks)
- **Pixel-by-pixel comparison** with pixelmatch
- **Change detection verified** (catches 0.8% pixel differences)
- **Performance**: 6 seconds for full suite

### 🎯 Key Features

- ✅ **Real canvas rendering** with node-canvas (not mocks)
- ✅ **Pixel-by-pixel comparison** against baseline snapshots
- ✅ **Separate test runner** to avoid memory issues
- ✅ **Comprehensive coverage** of builtin series types
- ✅ **Automatic diff images** on failure
- ✅ **Fast execution** (~6 seconds for 79 tests)

---

## Implementation Status

### Current Coverage: 79 Tests ✅

#### Builtin Series (77 tests complete)

**Line Series** (16 tests ✅)
- Basic rendering, line styles (solid/dashed/dotted), line types (simple/stepped)
- Line widths, point markers (small/large), line hidden (markers only)
- Custom price lines (solid/dotted), title display, visibility toggle
- Price axis, crosshair, dark backgrounds

**Area Series** (19 tests ✅)
- Basic solid color, gradient fills, relative gradients, inverted fills
- Line styles (dashed/dotted), stepped line type, line hidden (fill only)
- Point markers, custom price lines (solid/dotted), title display
- Visibility toggle, price axis, crosshair, dark backgrounds

**Candlestick Series** (13 tests ✅)
- Default colors, custom colors, borders, wicks
- General border color, general wick color
- Custom price lines, title display, visibility toggle
- Price axis, grid lines, dark backgrounds

**Bar Series** (7 tests ✅)
- Basic rendering, open tick visible, thin bars, custom colors
- Custom price lines, title display, visibility toggle

**Histogram Series** (8 tests ✅)
- Basic rendering, base value, color variations
- Custom price lines, title display, visibility toggle
- Price axis, dark backgrounds

**Baseline Series** (14 tests ✅)
- Basic above/below fills, custom colors, baseline values
- Line widths (thin/thick), line styles (dashed/dotted), stepped line type
- Custom price lines, title display, visibility toggle
- Price axis, crosshair, dark backgrounds

#### Custom Series (2 tests placeholder)
- 🚧 Data generator validation tests (2 tests passing)
- 🔴 TrendFill, Band, Ribbon, Signal, GradientRibbon (skipped - needs 25 tests)

### Technology Stack

- **jsdom**: DOM environment for lightweight-charts
- **node-canvas**: Real Canvas API implementation
- **pixelmatch**: Pixel-by-pixel image comparison
- **pngjs**: PNG encoding/decoding for baselines
- **vitest**: Test runner with dedicated config

### Performance Metrics

- **Per Test**: ~150-200ms (rendering + comparison)
- **Full Suite**: ~6 seconds (79 tests)
- **Memory**: ~50-70MB peak per test
- **Baseline Images**: 39 PNGs, ~400KB total

---

## Quick Start

### Installation

Dependencies are already installed if you ran `npm install`.

### Run All Visual Tests

```bash
npm run test:visual
```

### Watch Mode (Development)

```bash
npm run test:visual:watch
```

### Update Baselines (After Intentional Changes)

```bash
npm run test:visual:update
```

### UI Mode (Interactive)

```bash
npm run test:visual:ui
```

---

## Architecture

### How It Works

```
┌─────────────────────────────────────────────────────────┐
│ 1. Create chart in jsdom + node-canvas environment     │
│ 2. Render series with test data to real canvas         │
│ 3. Extract ImageData (pixel buffer) from canvas        │
│ 4. Compare with baseline PNG using pixelmatch          │
│ 5. Generate diff image if comparison fails             │
└─────────────────────────────────────────────────────────┘
```

### Technical Implementation

#### 1. Setup (`src/__tests__/visual/setup.ts`)

- Patches `HTMLCanvasElement.prototype.getContext()` to return node-canvas context
- Syncs width/height between jsdom element and node-canvas
- Mocks browser APIs: `matchMedia`, `ResizeObserver`, `requestAnimationFrame`
- Uses WeakMap to track node-canvas instances

#### 2. Test Utilities (`src/__tests__/visual/utils/`)

- **chartRenderer.ts**: Chart rendering and canvas extraction
- **testData.ts**: Deterministic data generators
- **imageComparison.ts**: Pixel comparison with pixelmatch
- **index.ts**: Utility exports

#### 3. Directory Structure

```
src/__tests__/visual/
├── __snapshots__/          # Baseline PNG images (39 committed)
│   ├── __diffs__/          # Diff images (gitignored)
│   ├── area-basic-solid-color.png
│   ├── candlestick-basic-default-colors.png
│   ├── line-basic-solid.png
│   └── ...
├── utils/                  # Testing utilities
│   ├── chartRenderer.ts
│   ├── testData.ts
│   ├── imageComparison.ts
│   └── index.ts
├── series/                 # Series-specific tests
│   ├── line.visual.test.ts           (16 tests)
│   ├── area.visual.test.ts           (19 tests)
│   ├── candlestick.visual.test.ts    (13 tests)
│   ├── bar-histogram.visual.test.ts  (15 tests)
│   ├── baseline.visual.test.ts       (14 tests)
│   └── custom.visual.test.ts         (2 tests)
└── setup.ts                # jsdom + node-canvas configuration
```

---

## Running Tests

### Basic Commands

```bash
# Run all visual tests
npm run test:visual

# Watch mode for development
npm run test:visual:watch

# Update all baselines
npm run test:visual:update

# Interactive UI mode
npm run test:visual:ui
```

### Advanced Options

```bash
# Run specific test file
npm run test:visual -- line.visual.test.ts

# Run with coverage
npm run test:visual -- --coverage

# Debug with increased memory
NODE_OPTIONS='--max-old-space-size=4096' npm run test:visual
```

### CI/CD Integration

```yaml
# GitHub Actions example
- name: Run visual tests
  run: |
    cd streamlit_lightweight_charts_pro/frontend
    npm run test:visual

- name: Upload diff images on failure
  if: failure()
  uses: actions/upload-artifact@v3
  with:
    name: visual-diff-images
    path: streamlit_lightweight_charts_pro/frontend/src/__tests__/visual/__snapshots__/__diffs__/
```

---

## Writing Tests

### Basic Test Structure

```typescript
import { describe, it, expect, afterEach } from 'vitest';
import {
  renderChart,
  cleanupChartRender,
  assertMatchesSnapshot,
  sanitizeTestName,
  generateLineData,
  TestColors,
  type ChartRenderResult,
} from '../utils';

describe('My Visual Tests', () => {
  let renderResult: ChartRenderResult | null = null;

  afterEach(() => {
    if (renderResult) {
      cleanupChartRender(renderResult);
      renderResult = null;
    }
  });

  it('renders my chart', async () => {
    // 1. Render chart with series
    renderResult = await renderChart((chart) => {
      const series = chart.addSeries(LineSeries, {
        color: TestColors.BLUE,
        lineWidth: 2,
      });
      series.setData(generateLineData(30, 100));
    });

    // 2. Compare pixels with baseline
    const result = assertMatchesSnapshot(
      sanitizeTestName('my-chart'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    // 3. Assert match
    expect(result.matches).toBe(true);
  });
});
```

### Utility Functions

#### `renderChart(setupFn, config)`

Renders a chart and returns canvas image data.

```typescript
const result = await renderChart(
  (chart) => {
    // Configure chart here
    const series = chart.addSeries(LineSeries);
    series.setData(generateLineData(30, 100));
  },
  {
    width: 800,
    height: 400,
    chartOptions: {
      layout: { background: { color: '#FFFFFF' } },
      rightPriceScale: { visible: true },
    },
  }
);
```

#### `cleanupChartRender(result)`

Cleans up chart resources (call in `afterEach`).

```typescript
afterEach(() => {
  if (renderResult) {
    cleanupChartRender(renderResult);
    renderResult = null;
  }
});
```

#### Data Generators

All generators create deterministic, reproducible data:

```typescript
// Line/Area data
generateLineData(count, startValue, startDate)

// OHLC data
generateCandlestickData(count, startValue, startDate)
generateBarData(count, startValue, startDate)

// Other series
generateHistogramData(count, startValue, startDate)
generateBaselineData(count, baselineValue, startDate)

// Custom series (for future use)
generateBandData(count, middleValue, bandWidth, startDate)
generateRibbonData(count, lineCount, startValue, spread, startDate)
generateTrendFillData(count, baseValue)
generateSignalData(count)
generateGradientRibbonData(count, baseValue)
```

#### `assertMatchesSnapshot(testName, imageData, options)`

Compares image with baseline, returns comparison result.

```typescript
const result = assertMatchesSnapshot(
  'test-name',
  imageData,
  {
    threshold: 0.1,      // Per-pixel color difference (0-1, default 0.1)
    tolerance: 1.0,      // % of pixels allowed to differ (0-100, default 1.0)
    includeAA: true,     // Consider anti-aliasing (default true)
    createDiffImage: true, // Generate diff on failure (default true)
  }
);

if (!result.matches) {
  console.error(`${result.diffPixels} pixels differ (${result.diffPercentage}%)`);
}
```

### Test Colors

Use consistent test colors from `TestColors`:

```typescript
import { TestColors } from '../utils';

TestColors.BLUE      // '#2196F3'
TestColors.RED       // '#F44336'
TestColors.GREEN     // '#4CAF50'
TestColors.ORANGE    // '#FF9800'
TestColors.PURPLE    // '#9C27B0'
TestColors.UP_COLOR  // '#26A69A'
TestColors.DOWN_COLOR // '#EF5350'
TestColors.UP_WICK   // '#26A69A'
TestColors.DOWN_WICK // '#EF5350'
```

---

## Updating Baselines

### When to Update

Update baselines when you've made **intentional** visual changes:
- Changed series colors
- Modified line widths or styles
- Updated chart layout or styling
- Fixed visual bugs

### How to Update

1. **Run tests to see failures**:
   ```bash
   npm run test:visual
   ```

2. **Review diff images** in `src/__tests__/visual/__snapshots__/__diffs__/`
   - Each diff shows: original (magenta), new (green), differences (red)

3. **If changes are correct, update baselines**:
   ```bash
   npm run test:visual:update
   ```

4. **Verify updates**:
   ```bash
   npm run test:visual
   ```

5. **Commit updated baseline images**:
   ```bash
   git add src/__tests__/visual/__snapshots__/*.png
   git commit -m "Update visual test baselines: [reason]"
   ```

### Important Notes

- ⚠️ **Always review diffs before updating** - ensure changes are intentional
- ⚠️ **Never update baselines to pass failing tests** without understanding why
- ✅ **Commit baseline images** - they're part of the test suite
- ✅ **Document changes** in commit messages
- ❌ **Don't commit diff images** - they're temporary (gitignored)

---

## TODO: Missing Tests

**Current Status**: 79 tests implemented (77 builtin + 2 custom placeholders)
**Required Total**: ~103-108 tests
**Missing**: ~24-29 tests (primarily custom series)

### Missing Test Categories

1. **Custom Series - Complete Coverage** (25 tests) 🔴 **CRITICAL PRIORITY**
2. **Base Line & Scale Options** (2-4 tests)

---

## 1. Custom Series - Complete Coverage (25 tests)

All custom series currently have **ZERO visual test coverage**. These are production features.

### TrendFill Series (6 tests needed)

#### ❌ Test: Basic Uptrend/Downtrend Rendering
**File**: `src/__tests__/visual/series/custom.visual.test.ts`

**What to test**:
- Basic trend fill with uptrend and downtrend segments
- Default colors (green uptrend, red downtrend)
- Fill areas between trend and base lines

**Example**:
```typescript
it('renders trendfill series with uptrend and downtrend', async () => {
  renderResult = await renderChart((chart) => {
    const data = generateTrendFillData(30, 100);
    const series = createTrendFillSeries(chart, {
      uptrendFillColor: 'rgba(76, 175, 80, 0.3)',
      downtrendFillColor: 'rgba(244, 67, 54, 0.3)',
      uptrendLineColor: '#4CAF50',
      downtrendLineColor: '#F44336',
    });
    series.setData(data);
  });

  const result = assertMatchesSnapshot(
    sanitizeTestName('trendfill-basic'),
    renderResult.imageData,
    { threshold: 0.1, tolerance: 1.0 }
  );

  expect(result.matches).toBe(true);
});
```

#### ❌ Additional TrendFill Tests:
- Visibility toggles (fillVisible, uptrendLineVisible, downtrendLineVisible)
- Line styles (dashed, dotted)
- Base line visibility and styling
- Custom colors
- Line width variations

---

### Band Series (5 tests needed)

#### ❌ Test: Basic Three-Line Rendering
**File**: `src/__tests__/visual/series/custom.visual.test.ts`

**What to test**:
- Upper, middle, and lower lines rendering
- Two fill areas (upper fill, lower fill)
- Default colors for Bollinger Bands

**Example**:
```typescript
it('renders band series with three lines and fills', async () => {
  renderResult = await renderChart((chart) => {
    const data = generateBandData(30, 100, 20);
    const series = createBandSeries(chart, {
      upperLineColor: '#4CAF50',
      middleLineColor: '#2196F3',
      lowerLineColor: '#F44336',
      upperFillColor: 'rgba(76, 175, 80, 0.1)',
      lowerFillColor: 'rgba(244, 67, 54, 0.1)',
    });
    series.setData(data);
  });

  const result = assertMatchesSnapshot(
    sanitizeTestName('band-basic'),
    renderResult.imageData,
    { threshold: 0.1, tolerance: 1.0 }
  );

  expect(result.matches).toBe(true);
});
```

#### ❌ Additional Band Tests:
- Line visibility toggles (upper/middle/lower)
- Fill visibility toggles
- Line styles for all three lines
- Custom colors

---

### Ribbon Series (4 tests needed)

#### ❌ Test: Basic Two-Line Rendering
**File**: `src/__tests__/visual/series/custom.visual.test.ts`

**What to test**:
- Upper and lower lines
- Single fill area between them
- Default colors

**Example**:
```typescript
it('renders ribbon series with two lines and fill', async () => {
  renderResult = await renderChart((chart) => {
    const data = generateRibbonData(30, 2, 100, 10);
    const series = createRibbonSeries(chart, {
      upperLineColor: '#4CAF50',
      lowerLineColor: '#F44336',
      fillColor: 'rgba(76, 175, 80, 0.1)',
    });
    series.setData(data);
  });

  const result = assertMatchesSnapshot(
    sanitizeTestName('ribbon-basic'),
    renderResult.imageData,
    { threshold: 0.1, tolerance: 1.0 }
  );

  expect(result.matches).toBe(true);
});
```

#### ❌ Additional Ribbon Tests:
- Visibility toggles (upperLineVisible, lowerLineVisible, fillVisible)
- Line styles (dashed, dotted)
- Custom colors

---

### Signal Series (3 tests needed)

#### ❌ Test: Basic Signal Bands
**File**: `src/__tests__/visual/series/custom.visual.test.ts`

**What to test**:
- Vertical bands for neutral (0), signal (>0), and alert (<0) values
- Background rendering spanning full chart height
- Default colors

**Example**:
```typescript
it('renders signal series with neutral/signal/alert bands', async () => {
  renderResult = await renderChart((chart) => {
    const data = generateSignalData(30);
    const series = createSignalSeries(chart, {
      neutralColor: 'rgba(128, 128, 128, 0.1)',
      signalColor: 'rgba(76, 175, 80, 0.2)',
      alertColor: 'rgba(244, 67, 54, 0.2)',
    });
    series.setData(data);
  });

  const result = assertMatchesSnapshot(
    sanitizeTestName('signal-basic'),
    renderResult.imageData,
    { threshold: 0.1, tolerance: 1.0 }
  );

  expect(result.matches).toBe(true);
});
```

#### ❌ Additional Signal Tests:
- Custom colors (neutral, signal, alert)
- Per-point color overrides

---

### GradientRibbon Series (5 tests needed)

#### ❌ Test: Basic Gradient Fill
**File**: `src/__tests__/visual/series/custom.visual.test.ts`

**What to test**:
- Two lines (upper/lower)
- Gradient fill between them based on spread
- Color interpolation from start to end color

**Example**:
```typescript
it('renders gradient ribbon with color interpolation', async () => {
  renderResult = await renderChart((chart) => {
    const data = generateGradientRibbonData(30, 100);
    const series = createGradientRibbonSeries(chart, {
      upperLineColor: '#4CAF50',
      lowerLineColor: '#F44336',
      gradientStartColor: '#4CAF50',
      gradientEndColor: '#F44336',
      normalizeGradients: true,
    });
    series.setData(data);
  });

  const result = assertMatchesSnapshot(
    sanitizeTestName('gradient-ribbon-basic'),
    renderResult.imageData,
    { threshold: 0.1, tolerance: 1.0 }
  );

  expect(result.matches).toBe(true);
});
```

#### ❌ Additional GradientRibbon Tests:
- Gradient colors (different start/end combinations)
- Normalize gradients (true vs false)
- Per-point fill overrides
- Line options (styles, visibility, widths)

---

## 2. Base Line & Scale Options (2-4 tests)

### ❌ Test: baseLineVisible with Percentage Scale

**File**: `src/__tests__/visual/series/line.visual.test.ts`

**What to test**:
- Chart with `mode: PriceScaleMode.Percentage`
- `baseLineVisible: true` - Shows baseline at 0%

**Example**:
```typescript
it('renders line series with percentage scale and baseline', async () => {
  renderResult = await renderChart(
    (chart) => {
      const series = chart.addSeries(LineSeries, {
        color: TestColors.BLUE,
        lineWidth: 2,
        baseLineVisible: true,
      });
      series.setData(generateLineData(30, 100));
    },
    {
      chartOptions: {
        rightPriceScale: {
          visible: true,
          mode: 1, // PriceScaleMode.Percentage
        },
      },
    }
  );

  const result = assertMatchesSnapshot(
    sanitizeTestName('line-percentage-scale-baseline'),
    renderResult.imageData,
    { threshold: 0.1, tolerance: 1.0 }
  );

  expect(result.matches).toBe(true);
});
```

### ❌ Test: baseLineColor, baseLineWidth, baseLineStyle

**What to test**:
- Custom baseline styling (color, width, style)

### ❌ Test: priceLineSource - LastBar vs LastVisible

**What to test**:
- Different price line behavior when chart is scrolled

---

## Implementation Checklist

### Builtin Series ✅ COMPLETE

- [x] Line Series (16 tests)
- [x] Area Series (19 tests)
- [x] Candlestick Series (13 tests)
- [x] Bar Series (7 tests)
- [x] Histogram Series (8 tests)
- [x] Baseline Series (14 tests)

### Custom Series 🔴 PRIORITY

- [ ] TrendFill Series (0/6 tests)
- [ ] Band Series (0/5 tests)
- [ ] Ribbon Series (0/4 tests)
- [ ] Signal Series (0/3 tests)
- [ ] GradientRibbon Series (0/5 tests)

### Advanced Options

- [ ] Base line options (0/2-4 tests)

---

## Troubleshooting

### Tests Fail with "Baseline not found"

**Cause**: First run or missing baseline

**Solution**:
```bash
npm run test:visual:update
```

### Tests Fail with Pixel Differences

1. Check the diff image in `__snapshots__/__diffs__/` directory
2. Determine if difference is:
   - **Intentional**: Update baseline with `npm run test:visual:update`
   - **Bug**: Fix the code causing the visual regression
   - **Flaky**: Adjust tolerance in test options

### Memory Issues

Visual tests use less memory than unit tests (2GB vs 8GB) because:
- Run separately with dedicated config
- Sequential execution (no parallelism)
- Isolated test environment

If you still see issues:
```bash
NODE_OPTIONS='--max-old-space-size=4096 --expose-gc' npm run test:visual
```

### Cross-Platform Rendering Differences

**Issue**: Baselines created on macOS may differ slightly on Linux/Windows.

**Solution**:
1. Use Docker for consistent CI/CD rendering
2. Increase `tolerance` slightly (e.g., 2-3%)
3. Create platform-specific baselines if needed

### Canvas Not Rendering

If charts don't render, check:
1. jsdom environment is initialized (`setup.ts`)
2. node-canvas is properly installed
3. Canvas element is created correctly

### Tests Pass Locally But Fail in CI

**Cause**: Rendering differences between systems

**Solution**:
- Use Docker for consistent rendering
- Increase tolerance slightly: `{ threshold: 0.15, tolerance: 2.0 }`
- Ensure same Node.js version in CI

---

## Best Practices

### ✅ DO

- Use deterministic test data (same data = same rendering)
- Clean up resources in `afterEach`
- Use descriptive test names with `sanitizeTestName()`
- Set appropriate tolerance levels
- Document intentional visual changes
- Review diff images before updating baselines
- Commit baseline images with tests
- Use `TestColors` for consistent colors

### ❌ DON'T

- Don't use random data generators
- Don't ignore test failures without investigation
- Don't update baselines blindly
- Don't run visual tests in parallel (memory issues)
- Don't commit diff images (they're temporary)
- Don't use excessive tolerance to make tests pass
- Don't mix visual tests with unit tests (separate configs)

### Test Naming Convention

```typescript
// Good: Descriptive, sanitized
sanitizeTestName('line-basic-solid')
sanitizeTestName('area-gradient-fill')
sanitizeTestName('candlestick-custom-colors')

// Bad: Generic, unclear
sanitizeTestName('test1')
sanitizeTestName('line')
```

### Tolerance Guidelines

```typescript
// Standard tolerance for most tests
{ threshold: 0.1, tolerance: 1.0 }

// Stricter for simple charts
{ threshold: 0.05, tolerance: 0.5 }

// More lenient for complex charts
{ threshold: 0.15, tolerance: 2.0 }

// Custom series with gradients
{ threshold: 0.2, tolerance: 2.5 }
```

---

## Configuration

### Comparison Options

All tests use these default comparison settings:

```typescript
{
  threshold: 0.1,        // Per-pixel color tolerance (0-1)
  tolerance: 1.0,        // % of pixels allowed to differ (0-100)
  includeAA: true,       // Consider anti-aliasing
  createDiffImage: true, // Generate diff on failure
}
```

### Default Tolerances

- **threshold**: 0.1 (10% color difference per pixel)
- **tolerance**: 1.0% (1% of total pixels can differ)

These settings account for:
- Minor rendering differences across systems
- Anti-aliasing variations
- Floating-point precision in calculations

### Test Configuration

Visual tests use dedicated configuration in `vitest.visual.config.ts`:

```typescript
export default defineConfig({
  test: {
    name: 'visual-regression',
    include: ['src/__tests__/visual/**/*.visual.test.ts'],
    setupFiles: ['src/__tests__/visual/setup.ts'],
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    maxConcurrency: 1,
    environment: 'jsdom',
  },
});
```

---

## Integration with lightweight-charts v5

### API Changes Handled

- ✅ `chart.addLineSeries()` → `chart.addSeries(LineSeries, options)`
- ✅ All built-in series types supported
- ✅ Custom series plugins (placeholder tests ready)

### Imports

```typescript
import {
  LineSeries,
  AreaSeries,
  BarSeries,
  CandlestickSeries,
  HistogramSeries,
  BaselineSeries,
  LineStyle,
} from '../utils';
```

---

## Files Modified/Created

### Created
- `vitest.visual.config.ts` - Visual test configuration
- `src/__tests__/visual/setup.ts` - jsdom + node-canvas patching
- `src/__tests__/visual/utils/chartRenderer.ts` - Chart rendering
- `src/__tests__/visual/utils/testData.ts` - Data generators
- `src/__tests__/visual/utils/imageComparison.ts` - Pixel comparison
- `src/__tests__/visual/utils/index.ts` - Utility exports
- `src/__tests__/visual/series/*.visual.test.ts` - Test files (6 files, 79 tests)
- `src/__tests__/visual/__snapshots__/*.png` - Baselines (39 images)

### Modified
- `package.json` - Added visual test scripts
- All series test files - Updated to lightweight-charts v5 API

---

## Success Metrics

### Current Achievements ✅

- ✅ **79/79 tests passing** (100%)
- ✅ **39 baseline snapshots** created
- ✅ **Change detection verified** (0.8% difference detected)
- ✅ **Performance**: 6 seconds for full suite
- ✅ **Memory efficient**: 2GB limit, ~50-70MB per test
- ✅ **Deterministic**: All tests produce identical results

### Coverage Targets

- **Builtin Series**: 77/77 tests (100% ✅)
- **Custom Series**: 2/27 tests (7% 🔴 - NEED 25 TESTS)
- **Total Coverage**: 79/104 tests (76% - NEED 25 MORE)

---

## Resources

- [pixelmatch Documentation](https://github.com/mapbox/pixelmatch)
- [node-canvas Documentation](https://github.com/Automattic/node-canvas)
- [lightweight-charts API](https://tradingview.github.io/lightweight-charts/docs/api)
- [Vitest Documentation](https://vitest.dev)

---

## Summary

Visual regression testing is **fully operational** for builtin series and ready for custom series implementation. The system:

- ✅ Verifies actual pixel-level rendering
- ✅ Detects visual regressions automatically
- ✅ Runs headless without browser
- ✅ Integrates with existing test suite
- ✅ Supports all builtin series types
- ✅ Provides clear diff images on failure
- ✅ Documented for team use

**Status**: Production ready for builtin series ✅
**Next Step**: Implement 25 custom series tests 🔴

---

**Implementation Date**: 2025-01-09
**Test Framework**: Vitest + node-canvas + pixelmatch
**Current Coverage**: 6 builtin series types, 79 tests, 39 baselines
**Missing Coverage**: 5 custom series types, 25 tests needed
