# lightweight-charts-pro-core

Framework-agnostic chart plugins and utilities for TradingView's Lightweight Charts library.

## Overview

This package provides reusable chart components that can be used with any JavaScript framework (React, Svelte, Vue, vanilla JS, etc.). It includes custom series plugins for common trading indicators and shared rendering utilities.

## Installation

```bash
npm install lightweight-charts-pro-core lightweight-charts
```

## Features

### Custom Series Plugins

- **BandSeries** - Three lines (upper, middle, lower) with filled areas between them
- **RibbonSeries** - Two lines (upper, lower) with a filled area between them
- **GradientRibbonSeries** - Two lines with gradient-colored fill based on spread
- **SignalSeries** - Vertical background bands for buy/sell signals
- **TrendFillSeries** - Direction-based fills for trend indicators

### Rendering Utilities

- Line drawing with various styles (solid, dashed, dotted)
- Fill area rendering between lines
- Gradient creation and manipulation
- Coordinate conversion helpers
- Canvas state management

### Color Utilities

- Color format conversion (hex, rgba, CSS)
- Color interpolation for gradients
- Transparency detection
- Contrast color calculation

## Usage

### Band Series (Bollinger Bands, Keltner Channels)

```typescript
import { createChart } from 'lightweight-charts';
import { BandSeriesPlugin, BandData } from 'lightweight-charts-pro-core';

const chart = createChart(container);

const bandSeries = chart.addCustomSeries(BandSeriesPlugin(), {
  upperLineColor: '#4CAF50',
  middleLineColor: '#2196F3',
  lowerLineColor: '#F44336',
  upperFillColor: 'rgba(76, 175, 80, 0.1)',
  lowerFillColor: 'rgba(244, 67, 54, 0.1)',
});

const data: BandData[] = [
  { time: '2024-01-01', upper: 105, middle: 100, lower: 95 },
  { time: '2024-01-02', upper: 106, middle: 101, lower: 96 },
  // ...
];

bandSeries.setData(data);
```

### Ribbon Series (Simple Bands)

```typescript
import { createChart } from 'lightweight-charts';
import { RibbonSeriesPlugin, RibbonData } from 'lightweight-charts-pro-core';

const chart = createChart(container);

const ribbonSeries = chart.addCustomSeries(RibbonSeriesPlugin(), {
  upperLineColor: '#4CAF50',
  lowerLineColor: '#F44336',
  fillColor: 'rgba(76, 175, 80, 0.1)',
});

const data: RibbonData[] = [
  { time: '2024-01-01', upper: 105, lower: 95 },
  { time: '2024-01-02', upper: 106, lower: 96 },
  // ...
];

ribbonSeries.setData(data);
```

### Gradient Ribbon Series (ATR Bands with Volatility Color)

```typescript
import { createChart } from 'lightweight-charts';
import { GradientRibbonSeriesPlugin, GradientRibbonData } from 'lightweight-charts-pro-core';

const chart = createChart(container);

const gradientRibbonSeries = chart.addCustomSeries(GradientRibbonSeriesPlugin(), {
  upperLineColor: '#4CAF50',
  lowerLineColor: '#F44336',
  gradientStartColor: '#4CAF50',
  gradientEndColor: '#F44336',
  normalizeGradients: true, // Color based on spread magnitude
});

const data: GradientRibbonData[] = [
  { time: '2024-01-01', upper: 105, lower: 95 },
  { time: '2024-01-02', upper: 108, lower: 92 }, // Wider spread = more intense color
  // ...
];

gradientRibbonSeries.setData(data);
```

### Signal Series (Buy/Sell Signals)

```typescript
import { createChart } from 'lightweight-charts';
import { SignalSeriesPlugin, SignalData } from 'lightweight-charts-pro-core';

const chart = createChart(container);

const signalSeries = chart.addCustomSeries(SignalSeriesPlugin(), {
  neutralColor: 'transparent',
  signalColor: 'rgba(76, 175, 80, 0.3)',
  alertColor: 'rgba(244, 67, 54, 0.3)',
});

const data: SignalData[] = [
  { time: '2024-01-01', value: 0 },  // No signal
  { time: '2024-01-02', value: 1 },  // Buy signal
  { time: '2024-01-03', value: -1 }, // Sell signal
  // ...
];

signalSeries.setData(data);
```

### TrendFill Series (Supertrend)

```typescript
import { createChart } from 'lightweight-charts';
import { TrendFillSeriesPlugin, TrendFillData } from 'lightweight-charts-pro-core';

const chart = createChart(container);

const trendSeries = chart.addCustomSeries(TrendFillSeriesPlugin(), {
  uptrendFillColor: 'rgba(76, 175, 80, 0.3)',
  downtrendFillColor: 'rgba(244, 67, 54, 0.3)',
  uptrendLineColor: '#4CAF50',
  downtrendLineColor: '#F44336',
});

const data: TrendFillData[] = [
  { time: '2024-01-01', baseLine: 100, trendLine: 98, trendDirection: 1 },
  { time: '2024-01-02', baseLine: 101, trendLine: 99, trendDirection: 1 },
  { time: '2024-01-03', baseLine: 100, trendLine: 102, trendDirection: -1 },
  // ...
];

trendSeries.setData(data);
```

## API Reference

### BandSeriesOptions

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| upperLineColor | string | '#4CAF50' | Color of the upper line |
| middleLineColor | string | '#2196F3' | Color of the middle line |
| lowerLineColor | string | '#F44336' | Color of the lower line |
| upperFillColor | string | 'rgba(76, 175, 80, 0.1)' | Fill color between upper and middle |
| lowerFillColor | string | 'rgba(244, 67, 54, 0.1)' | Fill color between middle and lower |
| upperLineVisible | boolean | true | Show/hide upper line |
| middleLineVisible | boolean | true | Show/hide middle line |
| lowerLineVisible | boolean | true | Show/hide lower line |
| upperFill | boolean | true | Show/hide upper fill area |
| lowerFill | boolean | true | Show/hide lower fill area |

### RibbonSeriesOptions

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| upperLineColor | string | '#4CAF50' | Color of the upper line |
| lowerLineColor | string | '#F44336' | Color of the lower line |
| fillColor | string | 'rgba(76, 175, 80, 0.1)' | Fill color between lines |
| upperLineVisible | boolean | true | Show/hide upper line |
| lowerLineVisible | boolean | true | Show/hide lower line |
| fillVisible | boolean | true | Show/hide fill area |

### GradientRibbonSeriesOptions

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| upperLineColor | string | '#4CAF50' | Color of the upper line |
| lowerLineColor | string | '#F44336' | Color of the lower line |
| gradientStartColor | string | '#4CAF50' | Start color for gradient |
| gradientEndColor | string | '#F44336' | End color for gradient |
| normalizeGradients | boolean | true | Normalize colors based on spread |
| fillVisible | boolean | true | Show/hide gradient fill |

### SignalSeriesOptions

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| neutralColor | string | 'transparent' | Color for value = 0 |
| signalColor | string | 'rgba(76, 175, 80, 0.3)' | Color for value > 0 |
| alertColor | string | 'rgba(244, 67, 54, 0.3)' | Color for value < 0 |

### TrendFillSeriesOptions

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| uptrendFillColor | string | 'rgba(76, 175, 80, 0.3)' | Fill color for uptrend |
| downtrendFillColor | string | 'rgba(244, 67, 54, 0.3)' | Fill color for downtrend |
| uptrendLineColor | string | '#4CAF50' | Line color for uptrend |
| downtrendLineColor | string | '#F44336' | Line color for downtrend |
| baseLineColor | string | '#666666' | Color of base line |
| fillVisible | boolean | true | Show/hide fills |
| baseLineVisible | boolean | false | Show/hide base line |

## License

MIT
