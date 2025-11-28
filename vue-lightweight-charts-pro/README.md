# vue-lightweight-charts-pro

Vue 3 components and composables for TradingView's Lightweight Charts with pro features.

## Features

- **Vue 3 Components** - Declarative `<LwChart>` and `<LwSeries>` components
- **Composition API** - `useChart` and `useSeries` composables for full control
- **Custom Series** - Band, Ribbon, GradientRibbon, Signal, TrendFill series
- **TypeScript** - Full type safety with generics
- **Reactive** - Automatic updates when data/options change
- **Auto-resize** - Charts automatically resize with container

## Installation

```bash
npm install vue-lightweight-charts-pro lightweight-charts
```

## Quick Start

### Using Components (Recommended)

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { LwChart, LwSeries, type BandData } from 'vue-lightweight-charts-pro'

const candleData = ref([
  { time: '2024-01-01', open: 100, high: 105, low: 95, close: 102 },
  { time: '2024-01-02', open: 102, high: 108, low: 100, close: 106 },
])

const bandData = ref<BandData[]>([
  { time: '2024-01-01', upper: 108, middle: 100, lower: 92 },
  { time: '2024-01-02', upper: 112, middle: 104, lower: 96 },
])
</script>

<template>
  <LwChart
    :options="{
      layout: { background: { color: '#1a1a1a' }, textColor: '#d1d4dc' },
      grid: { vertLines: { color: '#2B2B43' }, horzLines: { color: '#2B2B43' } }
    }"
    @ready="(chart) => console.log('Chart ready:', chart)"
    style="height: 400px"
  >
    <!-- Candlestick series -->
    <LwSeries
      type="Candlestick"
      :data="candleData"
      :options="{ upColor: '#4CAF50', downColor: '#F44336' }"
    />

    <!-- Bollinger Bands -->
    <LwSeries
      type="Band"
      :data="bandData"
      :options="{
        upperLineColor: '#4CAF50',
        middleLineColor: '#2196F3',
        lowerLineColor: '#F44336',
        upperFillColor: 'rgba(76, 175, 80, 0.1)',
        lowerFillColor: 'rgba(244, 67, 54, 0.1)'
      }"
    />
  </LwChart>
</template>
```

### Using Composables

```vue
<script setup lang="ts">
import { useChart, useSeries } from 'vue-lightweight-charts-pro'

// Create chart
const { containerRef, chart, isReady, fitContent } = useChart({
  autoSize: true,
  options: {
    layout: { background: { color: '#1a1a1a' } }
  }
})

// Add candlestick series
const { series: candleSeries, setData: setCandleData } = useSeries({
  chart,
  type: 'Candlestick',
  options: { upColor: '#4CAF50', downColor: '#F44336' }
})

// Add band series
const { series: bandSeries, setData: setBandData } = useSeries({
  chart,
  type: 'Band',
  options: {
    upperLineColor: '#4CAF50',
    middleLineColor: '#2196F3',
    lowerLineColor: '#F44336'
  }
})

// Set data
setCandleData([
  { time: '2024-01-01', open: 100, high: 105, low: 95, close: 102 },
])

setBandData([
  { time: '2024-01-01', upper: 108, middle: 100, lower: 92 },
])
</script>

<template>
  <div ref="containerRef" style="width: 100%; height: 400px" />
  <button @click="fitContent">Fit Content</button>
</template>
```

## API Reference

### Components

#### `<LwChart>`

Main chart container component.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| options | `DeepPartial<ChartOptions>` | `{}` | Chart configuration options |
| autoSize | `boolean` | `true` | Auto-resize to container |
| width | `number` | `800` | Fixed width (if autoSize is false) |
| height | `number` | `400` | Fixed height (if autoSize is false) |

| Event | Payload | Description |
|-------|---------|-------------|
| ready | `IChartApi` | Emitted when chart is initialized |
| crosshairMove | `{ time, point }` | Emitted on crosshair movement |
| click | `{ time, point }` | Emitted on chart click |

#### `<LwSeries>`

Series component (must be child of `<LwChart>`).

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| type | `AllSeriesType` | Required | Series type |
| data | `SeriesData[]` | Required | Series data |
| options | `SeriesOptions` | `{}` | Series options |
| reactive | `boolean` | `true` | Enable reactive updates |

| Event | Payload | Description |
|-------|---------|-------------|
| ready | `ISeriesApi` | Emitted when series is added |

### Composables

#### `useChart(options)`

Creates and manages a chart instance.

```ts
const {
  containerRef,  // Ref to container element
  chart,         // Chart API instance
  isReady,       // Whether chart is initialized
  resize,        // Manually resize chart
  fitContent,    // Fit content to view
  getVisibleRange,
  setVisibleRange,
} = useChart({
  autoSize: true,
  width: 800,
  height: 400,
  // ...chartOptions
})
```

#### `useSeries(options)`

Adds and manages a series on a chart.

```ts
const {
  series,        // Series API instance
  isReady,       // Whether series is added
  setData,       // Set series data
  update,        // Update single data point
  applyOptions,  // Apply new options
  remove,        // Remove series from chart
} = useSeries({
  chart,         // Chart ref from useChart
  type: 'Band',  // Series type
  data: [],      // Initial data
  options: {},   // Series options
  reactive: true // Enable reactive updates
})
```

### Series Types

#### Built-in Series
- `Line` - Line chart
- `Area` - Area chart
- `Bar` - Bar/OHLC chart
- `Candlestick` - Candlestick chart
- `Histogram` - Histogram
- `Baseline` - Baseline chart

#### Custom Pro Series
- `Band` - Three lines (upper, middle, lower) with fills
- `Ribbon` - Two lines (upper, lower) with fill
- `GradientRibbon` - Two lines with gradient fill
- `Signal` - Vertical background bands
- `TrendFill` - Direction-based fills

### Band Series Example

```vue
<LwSeries
  type="Band"
  :data="[
    { time: '2024-01-01', upper: 105, middle: 100, lower: 95 },
    { time: '2024-01-02', upper: 106, middle: 101, lower: 96 },
  ]"
  :options="{
    upperLineColor: '#4CAF50',
    upperLineWidth: 2,
    upperLineVisible: true,
    middleLineColor: '#2196F3',
    middleLineWidth: 2,
    middleLineVisible: true,
    lowerLineColor: '#F44336',
    lowerLineWidth: 2,
    lowerLineVisible: true,
    upperFillColor: 'rgba(76, 175, 80, 0.1)',
    upperFill: true,
    lowerFillColor: 'rgba(244, 67, 54, 0.1)',
    lowerFill: true,
  }"
/>
```

### Signal Series Example

```vue
<LwSeries
  type="Signal"
  :data="[
    { time: '2024-01-01', value: 0 },   // No signal
    { time: '2024-01-02', value: 1 },   // Buy signal
    { time: '2024-01-03', value: -1 },  // Sell signal
  ]"
  :options="{
    neutralColor: 'transparent',
    signalColor: 'rgba(76, 175, 80, 0.3)',
    alertColor: 'rgba(244, 67, 54, 0.3)',
  }"
/>
```

### TrendFill Series Example (Supertrend)

```vue
<LwSeries
  type="TrendFill"
  :data="[
    { time: '2024-01-01', baseLine: 100, trendLine: 98, trendDirection: 1 },
    { time: '2024-01-02', baseLine: 101, trendLine: 99, trendDirection: 1 },
    { time: '2024-01-03', baseLine: 100, trendLine: 102, trendDirection: -1 },
  ]"
  :options="{
    uptrendFillColor: 'rgba(76, 175, 80, 0.3)',
    downtrendFillColor: 'rgba(244, 67, 54, 0.3)',
    uptrendLineColor: '#4CAF50',
    downtrendLineColor: '#F44336',
  }"
/>
```

## TypeScript

Full TypeScript support with generic series types:

```ts
import type { BandData, SignalData, CandlestickData } from 'vue-lightweight-charts-pro'

const bandData: BandData[] = [
  { time: '2024-01-01', upper: 105, middle: 100, lower: 95 }
]

const signalData: SignalData[] = [
  { time: '2024-01-01', value: 1 }
]
```

## License

MIT
