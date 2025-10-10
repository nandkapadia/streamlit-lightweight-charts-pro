# Visual Regression Tests

This directory contains visual regression tests that verify actual canvas rendering output.

## Quick Start

```bash
# Run all visual tests
npm run test:visual

# Update baselines after intentional changes
npm run test:visual:update

# Watch mode for development
npm run test:visual:watch
```

## Directory Structure

```
visual/
├── __snapshots__/          # Baseline PNG images (committed to git)
│   └── __diffs__/          # Diff images (generated, not committed)
├── utils/                  # Testing utilities
│   ├── chartRenderer.ts    # Chart rendering functions
│   ├── testData.ts         # Data generators
│   ├── imageComparison.ts  # Snapshot comparison
│   └── index.ts            # Exports
├── series/                 # Series-specific tests
│   ├── area.visual.test.ts
│   ├── candlestick.visual.test.ts
│   ├── line.visual.test.ts
│   ├── bar-histogram.visual.test.ts
│   ├── baseline.visual.test.ts
│   └── custom.visual.test.ts
├── setup.ts                # Test environment setup
└── README.md               # This file
```

## How Visual Tests Work

1. **Render**: Chart is rendered to node-canvas (real canvas, not mocks)
2. **Extract**: Pixel data is extracted from canvas as ImageData
3. **Compare**: Pixels are compared with baseline PNG using pixelmatch
4. **Report**: If mismatch exceeds tolerance, test fails and diff image is generated

## Writing Tests

```typescript
import { renderChart, assertMatchesSnapshot, generateLineData } from '../utils';

it('renders my test', async () => {
  const result = await renderChart((chart) => {
    const series = chart.addLineSeries({ color: '#2196F3' });
    series.setData(generateLineData(30, 100));
  });

  const comparison = assertMatchesSnapshot('my-test', result.imageData);
  expect(comparison.matches).toBe(true);

  cleanupChartRender(result);
});
```

## Configuration

Visual tests use a separate vitest config (`vitest.visual.config.ts`) with:
- jsdom environment + node-canvas for real rendering
- Sequential execution to avoid memory issues
- 2GB memory limit (less than unit tests)
- Separate from unit test coverage

## Comparison Options

```typescript
assertMatchesSnapshot('test-name', imageData, {
  threshold: 0.1,        // Per-pixel color tolerance (0-1)
  tolerance: 1.0,        // % of pixels allowed to differ (0-100)
  includeAA: true,       // Consider anti-aliasing
  createDiffImage: true, // Generate diff on failure
});
```

## Test Data Generators

All generators create deterministic data:

- `generateLineData()` - Line/Area series
- `generateCandlestickData()` - Candlestick/Bar OHLC data
- `generateHistogramData()` - Histogram data with colors
- `generateBaselineData()` - Baseline series data
- `generateBandData()` - Band series (upper/lower)
- `generateRibbonData()` - Ribbon series (multiple lines)

## Baseline Management

### Creating Baselines (First Run)

```bash
npm run test:visual:update
```

### Updating After Changes

1. Make your visual changes
2. Run tests to see failures: `npm run test:visual`
3. Review diff images in `__snapshots__/__diffs__/`
4. If correct, update: `npm run test:visual:update`
5. Commit updated baselines

### Important

- ⚠️ Always review diffs before updating
- ✅ Commit baseline PNGs (they're part of the test suite)
- ❌ Don't commit diff images (temporary artifacts)
- ⚠️ Never update baselines to hide bugs

## Troubleshooting

### "Baseline not found"
Run `npm run test:visual:update` to create initial baselines.

### Pixel differences
1. Check `__diffs__/` directory for diff image
2. Determine if change is intentional
3. Update baseline if correct, fix code if bug

### Memory issues
Visual tests are already optimized for memory. If issues persist:
```bash
NODE_OPTIONS='--max-old-space-size=4096' npm run test:visual
```

## See Also

- [VISUAL_TESTING.md](../../VISUAL_TESTING.md) - Complete documentation
- [pixelmatch](https://github.com/mapbox/pixelmatch) - Pixel comparison library
- [node-canvas](https://github.com/Automattic/node-canvas) - Canvas implementation
