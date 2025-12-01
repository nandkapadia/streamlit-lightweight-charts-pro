# @lightweight-charts-pro/vue3

Vue 3 integration for TradingView Lightweight Charts Pro.

## Installation

```bash
npm install @lightweight-charts-pro/vue3 lightweight-charts
```

## Usage

### Basic Chart

```vue
<template>
  <LightweightChart
    :options="chartOptions"
    :series="series"
    :height="400"
    @crosshair-move="onCrosshairMove"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { LightweightChart } from '@lightweight-charts-pro/vue3';

const chartOptions = ref({
  layout: {
    background: { color: '#1a1a2e' },
    textColor: '#d1d4dc',
  },
});

const series = ref([
  {
    seriesType: 'candlestick',
    data: [
      { time: '2024-01-01', open: 100, high: 105, low: 98, close: 103 },
      { time: '2024-01-02', open: 103, high: 108, low: 101, close: 106 },
      // ... more data
    ],
  },
]);

function onCrosshairMove(params) {
  console.log('Crosshair:', params);
}
</script>
```

### Multi-Pane Chart

```vue
<template>
  <LightweightChart :options="chartOptions" :series="series">
    <ChartPane :pane-id="0" :height-ratio="0.7">
      <!-- Main price pane -->
    </ChartPane>
    <ChartPane :pane-id="1" :height-ratio="0.3">
      <!-- Volume/indicator pane -->
    </ChartPane>
  </LightweightChart>
</template>
```

## Features

- **Reactive Data Binding**: Automatically updates chart when data changes
- **TypeScript Support**: Full type definitions included
- **Composables**: `useLazyLoading`, `useChartApi`, `useChartWebSocket`
- **Multi-Pane Support**: Create complex charts with multiple panes
- **Custom Series**: Support for band, ribbon, signal, and trend fill series
- **WebSocket Integration**: Real-time data updates via WebSocket

## Components

### `<LightweightChart>`

Main chart component.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `options` | `ChartOptions` | `{}` | Chart configuration options |
| `series` | `SeriesConfig[]` | `[]` | Array of series configurations |
| `height` | `number \| string` | `'100%'` | Chart height |
| `width` | `number \| string` | `'100%'` | Chart width |
| `autoFit` | `boolean` | `true` | Auto-fit content on data change |

### `<ChartPane>`

Pane component for multi-pane layouts.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `paneId` | `number` | Required | Pane identifier |
| `heightRatio` | `number` | `1` | Height ratio relative to other panes |
| `collapsed` | `boolean` | `false` | Whether pane is collapsed |

## Composables

### `useLazyLoading`

Handle lazy loading of historical data.

```typescript
import { useLazyLoading } from '@lightweight-charts-pro/vue3';

const { isLoading, loadingStates, requestHistory } = useLazyLoading(chart, {
  onHistoryRequest: async (seriesId, beforeTime, count) => {
    const data = await fetchHistoricalData(seriesId, beforeTime, count);
    return data;
  },
});
```

### `useChartApi`

REST API integration for chart data.

```typescript
import { useChartApi } from '@lightweight-charts-pro/vue3';

const { getHistory, setSeriesData, isLoading, error } = useChartApi({
  baseUrl: 'http://localhost:8000',
});
```

### `useChartWebSocket`

Real-time data via WebSocket.

```typescript
import { useChartWebSocket } from '@lightweight-charts-pro/vue3';

const { state, connect, disconnect, send } = useChartWebSocket({
  url: 'ws://localhost:8000/ws/chart/my-chart',
  onUpdate: (data) => {
    // Handle real-time update
  },
});
```

## License

MIT
