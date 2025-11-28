# Charting Library Port Specification - Detailed Implementation Guide

## Document Information

| Field | Value |
|-------|-------|
| **Version** | 2.0 |
| **Date** | 2025-11-28 |
| **Status** | Final |
| **Target Framework** | Svelte 4/5 (with vanilla JS/TS core) |
| **Source Library** | streamlit-lightweight-charts-pro |

---

## 1. Executive Summary

This specification defines the complete port of `streamlit-lightweight-charts-pro` from a Streamlit-specific Python/React library to a framework-agnostic TypeScript library with Svelte components. This document provides enough detail for autonomous implementation.

### Goals

1. **Framework-agnostic core** - Pure TypeScript charting logic
2. **Svelte-first components** - Primary UI bindings for Svelte 4/5
3. **Feature parity** - All existing features must be supported
4. **Type safety** - Full TypeScript definitions
5. **Automatic testing** - Comprehensive test suite ensuring feature parity

### Reference Implementation

- **svelte-lightweight-charts** (`trash-and-fire/svelte-lightweight-charts`) - Reference for Svelte patterns
- **lightweight-charts** - TradingView's official charting library (v4.x)

---

## 2. Source Analysis

### 2.1 Current Architecture

```
streamlit_lightweight_charts_pro/
├── charts/                           # Python backend
│   ├── chart.py                      # Chart class
│   ├── chart_manager.py              # ChartManager class
│   ├── series/                       # Series implementations
│   ├── options/                      # Options classes
│   └── managers/                     # Backend managers
├── data/                             # Data models
├── frontend/src/                     # React/TypeScript frontend
│   ├── LightweightCharts.tsx         # Main React component
│   ├── series/                       # Series factory & descriptors
│   ├── plugins/                      # Custom series plugins
│   ├── primitives/                   # Rendering primitives
│   ├── services/                     # Business logic services
│   └── types/                        # TypeScript interfaces
```

### 2.2 Series Types to Port

#### Built-in Series (Native Lightweight Charts)

| Series | Data Interface | Options Interface | Priority |
|--------|---------------|-------------------|----------|
| `CandlestickSeries` | `CandlestickData` | `CandlestickSeriesOptions` | P0 |
| `LineSeries` | `LineData` | `LineSeriesOptions` | P0 |
| `AreaSeries` | `AreaData` | `AreaSeriesOptions` | P0 |
| `HistogramSeries` | `HistogramData` | `HistogramSeriesOptions` | P0 |
| `BaselineSeries` | `BaselineData` | `BaselineSeriesOptions` | P1 |
| `BarSeries` | `BarData` | `BarSeriesOptions` | P1 |

#### Custom Series (Plugin-based)

| Series | Data Interface | Key Properties | Priority |
|--------|---------------|----------------|----------|
| `BandSeries` | `BandData` | upper, middle, lower lines + fills | P1 |
| `RibbonSeries` | `RibbonData` | upper, lower lines + fill | P1 |
| `GradientRibbonSeries` | `GradientRibbonData` | upper, lower + gradient fill | P2 |
| `SignalSeries` | `SignalData` | vertical background bands | P2 |
| `TrendFillSeries` | `TrendFillData` | direction-based fill coloring | P2 |

### 2.3 Core Features to Port

| Feature | Source Files | Complexity | Priority |
|---------|-------------|------------|----------|
| Series Factory | `UnifiedSeriesFactory.ts`, descriptors | High | P0 |
| Chart Sync | `LightweightCharts.tsx` (lines 446-700) | High | P0 |
| Trade Visualization | `tradeVisualization.ts`, `TradeRectanglePrimitive.ts` | High | P0 |
| Trade Tooltips | `TooltipManager.ts`, `TradeTemplateProcessor.ts` | Medium | P0 |
| Legends | `LegendPrimitive.ts` | Medium | P1 |
| Range Switcher | `RangeSwitcherPrimitive.ts` | Low | P1 |
| Annotations | `annotationSystem.ts` | Medium | P2 |
| Multi-pane | Chart pane management | High | P0 |

---

## 3. Target Architecture

### 3.1 Package Structure

```
@nasha/charts/
├── src/
│   ├── index.ts                       # Main exports
│   │
│   ├── internal/                      # Svelte actions & utilities
│   │   ├── chart.ts                   # Chart action
│   │   ├── series.ts                  # Series management utilities
│   │   ├── sync.ts                    # Synchronization utilities
│   │   └── utils.ts                   # Common utilities
│   │
│   ├── components/                    # Svelte components
│   │   ├── Chart.svelte               # Main chart component
│   │   ├── ChartManager.svelte        # Multi-chart container
│   │   ├── series/
│   │   │   ├── AreaSeries.svelte
│   │   │   ├── LineSeries.svelte
│   │   │   ├── CandlestickSeries.svelte
│   │   │   ├── HistogramSeries.svelte
│   │   │   ├── BaselineSeries.svelte
│   │   │   ├── BarSeries.svelte
│   │   │   ├── BandSeries.svelte
│   │   │   ├── RibbonSeries.svelte
│   │   │   ├── GradientRibbonSeries.svelte
│   │   │   ├── SignalSeries.svelte
│   │   │   └── TrendFillSeries.svelte
│   │   ├── scales/
│   │   │   ├── PriceScale.svelte
│   │   │   └── TimeScale.svelte
│   │   ├── controls/
│   │   │   ├── RangeSwitcher.svelte
│   │   │   └── Legend.svelte
│   │   ├── trades/
│   │   │   └── TradeOverlay.svelte
│   │   └── internal/
│   │       └── ContextProvider.svelte
│   │
│   ├── plugins/                       # Custom series plugins
│   │   ├── band/
│   │   │   ├── BandSeries.ts          # ICustomSeries implementation
│   │   │   ├── BandRenderer.ts        # Canvas renderer
│   │   │   └── types.ts               # Data/options interfaces
│   │   ├── ribbon/
│   │   │   ├── RibbonSeries.ts
│   │   │   ├── RibbonRenderer.ts
│   │   │   └── types.ts
│   │   ├── gradient-ribbon/
│   │   │   ├── GradientRibbonSeries.ts
│   │   │   ├── GradientRibbonRenderer.ts
│   │   │   └── types.ts
│   │   ├── signal/
│   │   │   ├── SignalSeries.ts
│   │   │   ├── SignalRenderer.ts
│   │   │   └── types.ts
│   │   ├── trend-fill/
│   │   │   ├── TrendFillSeries.ts
│   │   │   ├── TrendFillRenderer.ts
│   │   │   └── types.ts
│   │   └── shared/
│   │       └── rendering.ts           # Common rendering utilities
│   │
│   ├── primitives/                    # ISeriesPrimitive implementations
│   │   ├── BasePrimitive.ts
│   │   ├── TradeRectanglePrimitive.ts
│   │   ├── LegendPrimitive.ts
│   │   └── RangeSwitcherPrimitive.ts
│   │
│   ├── services/                      # Business logic
│   │   ├── TradeVisualization.ts
│   │   ├── TooltipManager.ts
│   │   ├── TemplateProcessor.ts
│   │   ├── CrosshairSync.ts
│   │   ├── TimeRangeSync.ts
│   │   └── CoordinateService.ts
│   │
│   ├── data/                          # Data transformers
│   │   ├── transformers.ts
│   │   ├── validators.ts
│   │   └── time-utils.ts
│   │
│   └── types/                         # TypeScript definitions
│       ├── index.ts
│       ├── series.ts
│       ├── options.ts
│       ├── trades.ts
│       ├── sync.ts
│       └── events.ts
│
├── tests/
│   ├── unit/                          # Unit tests
│   ├── integration/                   # Integration tests
│   ├── visual/                        # Visual regression tests
│   └── e2e/                           # End-to-end tests
│
├── package.json
├── svelte.config.js
├── tsconfig.json
├── vite.config.ts
└── vitest.config.ts
```

---

## 4. Detailed Implementation Specifications

### 4.1 Internal Utilities

#### 4.1.1 Chart Action (`internal/chart.ts`)

```typescript
/**
 * Svelte action for chart lifecycle management
 * Reference: svelte-lightweight-charts/src/package/internal/chart.ts
 */

import { createChart, IChartApi, ChartOptions } from 'lightweight-charts';

export interface ChartActionParams {
  options?: Partial<ChartOptions>;
  ref?: (api: IChartApi | null) => void;
  onCrosshairMove?: (params: MouseEventParams) => void;
  onClick?: (params: MouseEventParams) => void;
  autoSize?: boolean;
}

export interface ActionResult<T> {
  update(params: T): void;
  destroy(): void;
}

export function chart(
  node: HTMLElement,
  params: ChartActionParams
): ActionResult<ChartActionParams> {
  let chartApi: IChartApi | null = null;
  let resizeObserver: ResizeObserver | null = null;
  let currentParams = params;

  // Initialize chart
  chartApi = createChart(node, params.options || {});
  params.ref?.(chartApi);

  // Setup event handlers
  if (params.onCrosshairMove) {
    chartApi.subscribeCrosshairMove(params.onCrosshairMove);
  }
  if (params.onClick) {
    chartApi.subscribeClick(params.onClick);
  }

  // Setup auto-sizing
  if (params.autoSize !== false) {
    resizeObserver = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      chartApi?.resize(width, height);
    });
    resizeObserver.observe(node);
  }

  return {
    update(nextParams: ChartActionParams) {
      // Handle ref changes
      if (nextParams.ref !== currentParams.ref) {
        currentParams.ref?.(null);
        nextParams.ref?.(chartApi);
      }

      // Handle options changes
      if (nextParams.options && chartApi) {
        chartApi.applyOptions(nextParams.options);

        // Check for dimension changes requiring resize
        const { width, height } = nextParams.options;
        if (width !== undefined || height !== undefined) {
          chartApi.resize(
            width ?? node.clientWidth,
            height ?? node.clientHeight
          );
        }
      }

      // Handle event handler changes
      // ... (unsubscribe old, subscribe new)

      currentParams = nextParams;
    },

    destroy() {
      resizeObserver?.disconnect();
      currentParams.ref?.(null);
      chartApi?.remove();
      chartApi = null;
    }
  };
}
```

#### 4.1.2 Series Utilities (`internal/series.ts`)

```typescript
/**
 * Series creation and management utilities
 */

import { IChartApi, ISeriesApi, SeriesType } from 'lightweight-charts';

export type SeriesParams = {
  id: string;
  type: SeriesType | 'Band' | 'Ribbon' | 'GradientRibbon' | 'Signal' | 'TrendFill';
  data?: any[];
  options?: Record<string, unknown>;
  reactive?: boolean;
  markers?: SeriesMarker<Time>[];
  ref?: (api: ISeriesApi<any> | null) => void;
  paneId?: number;
};

export function series(
  chart: IChartApi,
  params: SeriesParams
): {
  update(params: SeriesParams): void;
  updateReference(ref?: (api: ISeriesApi<any> | null) => void): void;
  destroy(): void;
} {
  let seriesApi: ISeriesApi<any> | null = null;
  let currentData = params.data;
  let currentRef = params.ref;

  // Create series based on type
  seriesApi = createSeriesByType(chart, params);

  // Set initial data
  if (params.data && params.data.length > 0) {
    seriesApi.setData(params.data);
  }

  // Set markers
  if (params.markers && params.markers.length > 0) {
    createSeriesMarkers(seriesApi, params.markers);
  }

  // Call ref callback
  currentRef?.(seriesApi);

  return {
    update(nextParams: SeriesParams) {
      if (!seriesApi) return;

      // Handle type change (requires recreation)
      if (nextParams.type !== params.type) {
        // Remove old series, create new
        currentRef?.(null);
        chart.removeSeries(seriesApi);
        seriesApi = createSeriesByType(chart, nextParams);
        currentRef?.(seriesApi);
      }

      // Update data (only if reactive or reference changed)
      if (nextParams.data && (nextParams.reactive || nextParams.data !== currentData)) {
        seriesApi.setData(nextParams.data);
        currentData = nextParams.data;
      }

      // Update options
      if (nextParams.options) {
        seriesApi.applyOptions(nextParams.options);
      }

      // Update markers
      if (nextParams.markers) {
        createSeriesMarkers(seriesApi, nextParams.markers);
      }
    },

    updateReference(ref) {
      if (ref === currentRef) return;
      currentRef?.(null);
      currentRef = ref;
      currentRef?.(seriesApi);
    },

    destroy() {
      currentRef?.(null);
      if (seriesApi) {
        chart.removeSeries(seriesApi);
        seriesApi = null;
      }
    }
  };
}

function createSeriesByType(chart: IChartApi, params: SeriesParams): ISeriesApi<any> {
  const { type, options = {}, paneId = 0 } = params;

  switch (type) {
    case 'Line':
      return chart.addLineSeries(options, paneId);
    case 'Area':
      return chart.addAreaSeries(options, paneId);
    case 'Candlestick':
      return chart.addCandlestickSeries(options, paneId);
    case 'Histogram':
      return chart.addHistogramSeries(options, paneId);
    case 'Baseline':
      return chart.addBaselineSeries(options, paneId);
    case 'Bar':
      return chart.addBarSeries(options, paneId);
    // Custom series
    case 'Band':
      return createBandSeries(chart, options, paneId);
    case 'Ribbon':
      return createRibbonSeries(chart, options, paneId);
    case 'GradientRibbon':
      return createGradientRibbonSeries(chart, options, paneId);
    case 'Signal':
      return createSignalSeries(chart, options, paneId);
    case 'TrendFill':
      return createTrendFillSeries(chart, options, paneId);
    default:
      throw new Error(`Unknown series type: ${type}`);
  }
}
```

### 4.2 Svelte Components

#### 4.2.1 Chart Component (`components/Chart.svelte`)

```svelte
<!--
  Main chart component

  Usage:
  <Chart options={chartOptions} height={400} on:ready={handleReady}>
    <LineSeries data={lineData} />
    <CandlestickSeries data={ohlcData} />
  </Chart>
-->
<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher, setContext } from 'svelte';
  import { chart as chartAction } from '../internal/chart';
  import type { IChartApi, ChartOptions, MouseEventParams } from 'lightweight-charts';
  import type { Reference } from '../internal/utils';

  // Props
  export let options: Partial<ChartOptions> = {};
  export let width: number | string = '100%';
  export let height: number = 400;
  export let autoSize: boolean = true;
  export let ref: Reference<IChartApi> | undefined = undefined;

  // Events
  const dispatch = createEventDispatcher<{
    ready: IChartApi;
    crosshairMove: MouseEventParams;
    click: MouseEventParams;
  }>();

  // State
  let container: HTMLElement;
  let chartApi: IChartApi | null = null;

  // Provide chart context for child series components
  setContext('chart', {
    getChart: () => chartApi,
    onChartReady: (callback: (chart: IChartApi) => void) => {
      if (chartApi) {
        callback(chartApi);
      } else {
        // Queue callback for when chart is ready
        pendingCallbacks.push(callback);
      }
    }
  });

  let pendingCallbacks: Array<(chart: IChartApi) => void> = [];

  function handleRef(api: IChartApi | null) {
    chartApi = api;
    ref?.(api);

    if (api) {
      dispatch('ready', api);
      // Execute pending callbacks
      pendingCallbacks.forEach(cb => cb(api));
      pendingCallbacks = [];
    }
  }

  function handleCrosshairMove(params: MouseEventParams) {
    dispatch('crosshairMove', params);
  }

  function handleClick(params: MouseEventParams) {
    dispatch('click', params);
  }

  // Expose chart API
  export function getChart(): IChartApi | null {
    return chartApi;
  }
</script>

<div
  bind:this={container}
  class="nasha-chart"
  style:width={typeof width === 'number' ? `${width}px` : width}
  style:height="{height}px"
  use:chartAction={{
    options,
    ref: handleRef,
    onCrosshairMove: handleCrosshairMove,
    onClick: handleClick,
    autoSize
  }}
>
  {#if chartApi}
    <slot chart={chartApi} />
  {/if}
</div>

<style>
  .nasha-chart {
    position: relative;
  }
</style>
```

#### 4.2.2 Series Component Template (`components/series/LineSeries.svelte`)

```svelte
<!--
  Line series component

  Usage:
  <LineSeries data={lineData} options={{ color: '#2196F3' }} />
-->
<script lang="ts">
  import { getContext, onMount, onDestroy } from 'svelte';
  import { series } from '../../internal/series';
  import type { ISeriesApi, LineData, LineSeriesOptions } from 'lightweight-charts';
  import type { Reference } from '../../internal/utils';
  import ContextProvider from '../internal/ContextProvider.svelte';

  // Props
  export let data: LineData[] = [];
  export let options: Partial<LineSeriesOptions> = {};
  export let id: string = `line-${performance.now().toString(36)}`;
  export let paneId: number = 0;
  export let reactive: boolean = false;
  export let ref: Reference<ISeriesApi<'Line'>> | undefined = undefined;

  // Get chart from context
  const chartContext = getContext<{
    getChart: () => IChartApi | null;
    onChartReady: (callback: (chart: IChartApi) => void) => void;
  }>('chart');

  let seriesApi: ISeriesApi<'Line'> | null = null;
  let seriesManager: ReturnType<typeof series> | null = null;

  // Reactive updates
  $: if (seriesManager && (reactive || data)) {
    seriesManager.update({
      id,
      type: 'Line',
      data,
      options,
      reactive,
      paneId
    });
  }

  onMount(() => {
    chartContext.onChartReady((chart) => {
      seriesManager = series(chart, {
        id,
        type: 'Line',
        data,
        options,
        reactive,
        paneId,
        ref: (api) => {
          seriesApi = api as ISeriesApi<'Line'>;
          ref?.(api as ISeriesApi<'Line'>);
        }
      });
    });
  });

  onDestroy(() => {
    seriesManager?.destroy();
  });
</script>

{#if seriesApi}
  <ContextProvider value={{ series: seriesApi, paneId }}>
    <slot />
  </ContextProvider>
{/if}
```

#### 4.2.3 ChartManager Component (`components/ChartManager.svelte`)

```svelte
<!--
  Multi-chart manager with synchronization

  Usage:
  <ChartManager syncEnabled={true} crosshairSync={true} timeRangeSync={true}>
    <Chart options={chart1Options}>
      <AreaSeries data={equityData} />
    </Chart>
    <Chart options={chart2Options}>
      <AreaSeries data={drawdownData} />
    </Chart>
  </ChartManager>
-->
<script lang="ts">
  import { setContext, onMount, onDestroy } from 'svelte';
  import { CrosshairSync } from '../services/CrosshairSync';
  import { TimeRangeSync } from '../services/TimeRangeSync';
  import type { IChartApi } from 'lightweight-charts';

  // Props
  export let syncEnabled: boolean = true;
  export let crosshairSync: boolean = true;
  export let timeRangeSync: boolean = true;
  export let groupId: number = 0;

  // State
  let charts: Map<string, IChartApi> = new Map();
  let crosshairSyncManager: CrosshairSync | null = null;
  let timeRangeSyncManager: TimeRangeSync | null = null;

  // Provide manager context
  setContext('chartManager', {
    registerChart: (id: string, chart: IChartApi) => {
      charts.set(id, chart);

      if (syncEnabled && crosshairSync) {
        crosshairSyncManager?.addChart(chart, id);
      }
      if (syncEnabled && timeRangeSync) {
        timeRangeSyncManager?.addChart(chart, id);
      }
    },

    unregisterChart: (id: string) => {
      const chart = charts.get(id);
      if (chart) {
        crosshairSyncManager?.removeChart(id);
        timeRangeSyncManager?.removeChart(id);
        charts.delete(id);
      }
    },

    getGroupId: () => groupId
  });

  onMount(() => {
    if (syncEnabled) {
      if (crosshairSync) {
        crosshairSyncManager = new CrosshairSync(groupId);
      }
      if (timeRangeSync) {
        timeRangeSyncManager = new TimeRangeSync(groupId);
      }
    }
  });

  onDestroy(() => {
    crosshairSyncManager?.destroy();
    timeRangeSyncManager?.destroy();
  });

  // Reactive sync config changes
  $: {
    if (crosshairSyncManager) {
      crosshairSyncManager.setEnabled(syncEnabled && crosshairSync);
    }
    if (timeRangeSyncManager) {
      timeRangeSyncManager.setEnabled(syncEnabled && timeRangeSync);
    }
  }
</script>

<div class="nasha-chart-manager">
  <slot />
</div>

<style>
  .nasha-chart-manager {
    display: flex;
    flex-direction: column;
    gap: 0;
    width: 100%;
  }
</style>
```

### 4.3 Custom Series Plugins

#### 4.3.1 Band Series Plugin (`plugins/band/BandSeries.ts`)

```typescript
/**
 * Band Series - ICustomSeries implementation
 *
 * Renders three lines (upper, middle, lower) with filled areas.
 * Used for Bollinger Bands, Keltner Channels, etc.
 *
 * Source: streamlit_lightweight_charts_pro/frontend/src/plugins/series/bandSeriesPlugin.ts
 */

import {
  CustomData,
  Time,
  customSeriesDefaultOptions,
  CustomSeriesOptions,
  PaneRendererCustomData,
  CustomSeriesPricePlotValues,
  CustomSeriesWhitespaceData,
  ICustomSeriesPaneRenderer,
  ICustomSeriesPaneView,
  LineWidth,
  IChartApi,
  PriceToCoordinateConverter,
} from 'lightweight-charts';
import { BitmapCoordinatesRenderingScope, CanvasRenderingTarget2D } from 'fancy-canvas';
import { drawMultiLine, drawFillArea, LineStyle } from '../shared/rendering';

// Data interface
export interface BandData extends CustomData<Time> {
  time: Time;
  upper: number;
  middle: number;
  lower: number;
}

// Options interface
export interface BandSeriesOptions extends CustomSeriesOptions {
  // Upper line
  upperLineColor: string;
  upperLineWidth: LineWidth;
  upperLineStyle: LineStyle;
  upperLineVisible: boolean;

  // Middle line
  middleLineColor: string;
  middleLineWidth: LineWidth;
  middleLineStyle: LineStyle;
  middleLineVisible: boolean;

  // Lower line
  lowerLineColor: string;
  lowerLineWidth: LineWidth;
  lowerLineStyle: LineStyle;
  lowerLineVisible: boolean;

  // Fills
  upperFillColor: string;
  upperFill: boolean;
  lowerFillColor: string;
  lowerFill: boolean;
}

// Default options
export const defaultBandOptions: BandSeriesOptions = {
  ...customSeriesDefaultOptions,
  upperLineColor: '#4CAF50',
  upperLineWidth: 2,
  upperLineStyle: LineStyle.Solid,
  upperLineVisible: true,
  middleLineColor: '#2196F3',
  middleLineWidth: 2,
  middleLineStyle: LineStyle.Solid,
  middleLineVisible: true,
  lowerLineColor: '#F44336',
  lowerLineWidth: 2,
  lowerLineStyle: LineStyle.Solid,
  lowerLineVisible: true,
  upperFillColor: 'rgba(76, 175, 80, 0.1)',
  upperFill: true,
  lowerFillColor: 'rgba(244, 67, 54, 0.1)',
  lowerFill: true,
};

// ICustomSeries implementation
export class BandSeries<TData extends BandData = BandData>
  implements ICustomSeriesPaneView<Time, TData, BandSeriesOptions>
{
  private _renderer: BandSeriesRenderer<TData>;

  constructor() {
    this._renderer = new BandSeriesRenderer();
  }

  priceValueBuilder(plotRow: TData): CustomSeriesPricePlotValues {
    // Return all three values for autoscaling
    return [plotRow.lower, plotRow.middle, plotRow.upper];
  }

  isWhitespace(
    data: TData | CustomSeriesWhitespaceData<Time>
  ): data is CustomSeriesWhitespaceData<Time> {
    const d = data as TData;
    return d.upper === undefined || d.middle === undefined || d.lower === undefined;
  }

  renderer(): ICustomSeriesPaneRenderer {
    return this._renderer;
  }

  update(data: PaneRendererCustomData<Time, TData>, options: BandSeriesOptions): void {
    this._renderer.update(data, options);
  }

  defaultOptions(): BandSeriesOptions {
    return defaultBandOptions;
  }
}

// Renderer implementation
class BandSeriesRenderer<TData extends BandData> implements ICustomSeriesPaneRenderer {
  private _data: PaneRendererCustomData<Time, TData> | null = null;
  private _options: BandSeriesOptions | null = null;

  update(data: PaneRendererCustomData<Time, TData>, options: BandSeriesOptions): void {
    this._data = data;
    this._options = options;
  }

  draw(target: CanvasRenderingTarget2D, priceConverter: PriceToCoordinateConverter): void {
    target.useBitmapCoordinateSpace((scope: BitmapCoordinatesRenderingScope) => {
      this._drawImpl(scope, priceConverter);
    });
  }

  private _drawImpl(
    scope: BitmapCoordinatesRenderingScope,
    priceToCoordinate: PriceToCoordinateConverter
  ): void {
    if (!this._data || !this._data.bars.length || !this._data.visibleRange || !this._options) {
      return;
    }

    const options = this._options;
    const visibleRange = this._data.visibleRange;

    // Transform bars to bitmap coordinates
    const bars = this._data.bars.map(bar => ({
      x: bar.x * scope.horizontalPixelRatio,
      upperY: (priceToCoordinate(bar.originalData.upper) ?? 0) * scope.verticalPixelRatio,
      middleY: (priceToCoordinate(bar.originalData.middle) ?? 0) * scope.verticalPixelRatio,
      lowerY: (priceToCoordinate(bar.originalData.lower) ?? 0) * scope.verticalPixelRatio,
    }));

    const ctx = scope.context;
    ctx.save();

    // Draw fills (background)
    if (options.upperFill) {
      drawFillArea(ctx, bars, 'upperY', 'middleY', options.upperFillColor,
                   visibleRange.from, visibleRange.to);
    }
    if (options.lowerFill) {
      drawFillArea(ctx, bars, 'middleY', 'lowerY', options.lowerFillColor,
                   visibleRange.from, visibleRange.to);
    }

    // Draw lines (foreground)
    if (options.upperLineVisible) {
      drawMultiLine(ctx, bars, 'upperY', options.upperLineColor,
                    options.upperLineWidth * scope.horizontalPixelRatio,
                    options.upperLineStyle, visibleRange.from, visibleRange.to);
    }
    if (options.middleLineVisible) {
      drawMultiLine(ctx, bars, 'middleY', options.middleLineColor,
                    options.middleLineWidth * scope.horizontalPixelRatio,
                    options.middleLineStyle, visibleRange.from, visibleRange.to);
    }
    if (options.lowerLineVisible) {
      drawMultiLine(ctx, bars, 'lowerY', options.lowerLineColor,
                    options.lowerLineWidth * scope.horizontalPixelRatio,
                    options.lowerLineStyle, visibleRange.from, visibleRange.to);
    }

    ctx.restore();
  }
}

// Factory function
export function createBandSeries(
  chart: IChartApi,
  options: Partial<BandSeriesOptions> = {},
  paneId: number = 0
): ISeriesApi<'Custom'> {
  const series = chart.addCustomSeries(new BandSeries(), {
    ...defaultBandOptions,
    ...options,
  }, paneId);

  return series;
}
```

### 4.4 Services

#### 4.4.1 Crosshair Sync Service (`services/CrosshairSync.ts`)

```typescript
/**
 * Crosshair synchronization across multiple charts
 *
 * Implementation approach: localStorage-based sync for cross-component coordination
 * Source: LightweightCharts.tsx lines 446-596
 */

import { IChartApi, MouseEventParams, Time } from 'lightweight-charts';

interface SyncEvent {
  groupId: number;
  chartId: string;
  time: Time | null;
  point: { x: number; y: number } | null;
  timestamp: number;
}

export class CrosshairSync {
  private charts: Map<string, IChartApi> = new Map();
  private groupId: number;
  private enabled: boolean = true;
  private storageKey: string;
  private isExternalSync: Map<string, boolean> = new Map();
  private syncTimeout: Map<string, NodeJS.Timeout> = new Map();

  constructor(groupId: number = 0) {
    this.groupId = groupId;
    this.storageKey = `crosshair_sync_group_${groupId}`;
    this.setupStorageListener();
  }

  private setupStorageListener(): void {
    window.addEventListener('storage', this.handleStorageEvent.bind(this));
  }

  private handleStorageEvent(event: StorageEvent): void {
    if (!this.enabled || event.key !== this.storageKey || !event.newValue) {
      return;
    }

    try {
      const syncEvent: SyncEvent = JSON.parse(event.newValue);

      // Apply to all charts except the source
      this.charts.forEach((chart, chartId) => {
        if (chartId === syncEvent.chartId) return;

        // Mark as external sync to prevent feedback loop
        this.isExternalSync.set(chartId, true);

        // Clear existing timeout
        const existingTimeout = this.syncTimeout.get(chartId);
        if (existingTimeout) {
          clearTimeout(existingTimeout);
        }

        // Set crosshair position
        if (syncEvent.time !== null) {
          chart.setCrosshairPosition(
            syncEvent.point?.y ?? 0,
            syncEvent.time,
            chart.getSeries()[0] // Use first series
          );
        } else {
          chart.clearCrosshairPosition();
        }

        // Clear external sync flag after delay
        this.syncTimeout.set(chartId, setTimeout(() => {
          this.isExternalSync.set(chartId, false);
        }, 100));
      });
    } catch (e) {
      console.warn('Failed to parse crosshair sync event', e);
    }
  }

  addChart(chart: IChartApi, chartId: string): void {
    this.charts.set(chartId, chart);
    this.isExternalSync.set(chartId, false);

    // Subscribe to crosshair move
    chart.subscribeCrosshairMove((params: MouseEventParams) => {
      if (!this.enabled || this.isExternalSync.get(chartId)) {
        return;
      }

      const syncEvent: SyncEvent = {
        groupId: this.groupId,
        chartId,
        time: params.time ?? null,
        point: params.point ?? null,
        timestamp: Date.now()
      };

      localStorage.setItem(this.storageKey, JSON.stringify(syncEvent));
    });
  }

  removeChart(chartId: string): void {
    this.charts.delete(chartId);
    this.isExternalSync.delete(chartId);

    const timeout = this.syncTimeout.get(chartId);
    if (timeout) {
      clearTimeout(timeout);
      this.syncTimeout.delete(chartId);
    }
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  destroy(): void {
    window.removeEventListener('storage', this.handleStorageEvent.bind(this));
    this.syncTimeout.forEach(timeout => clearTimeout(timeout));
    this.charts.clear();
  }
}
```

#### 4.4.2 Trade Visualization Service (`services/TradeVisualization.ts`)

```typescript
/**
 * Trade visualization service
 *
 * Creates visual elements (rectangles, markers) from trade data
 * Source: streamlit_lightweight_charts_pro/frontend/src/services/tradeVisualization.ts
 */

import { UTCTimestamp, SeriesMarker, Time } from 'lightweight-charts';

export interface TradeData {
  id?: string;
  entryTime: number | string;
  exitTime: number | string | null;
  entryPrice: number;
  exitPrice: number;
  isProfitable?: boolean;
  tradeType?: 'long' | 'short';
  quantity?: number;
  pnl?: number;
  pnlPercentage?: number;
  notes?: string;
  // Additional data for templates
  [key: string]: any;
}

export interface TradeVisualizationOptions {
  style: 'rectangles' | 'markers' | 'both' | 'lines' | 'arrows';

  // Rectangle options
  rectangleColorProfit: string;
  rectangleColorLoss: string;
  rectangleFillOpacity: number;
  rectangleBorderWidth: number;

  // Marker options
  entryMarkerColorLong: string;
  entryMarkerColorShort: string;
  exitMarkerColorProfit: string;
  exitMarkerColorLoss: string;
  entryMarkerShape: 'arrowUp' | 'arrowDown' | 'circle' | 'square';
  exitMarkerShape: 'arrowUp' | 'arrowDown' | 'circle' | 'square';
  entryMarkerPosition: 'aboveBar' | 'belowBar';
  exitMarkerPosition: 'aboveBar' | 'belowBar';
  markerSize: number;

  // Text options
  showMarkerText: boolean;
  showPnlInMarkers: boolean;
  entryMarkerTemplate?: string;
  exitMarkerTemplate?: string;

  // Tooltip options
  showTooltip: boolean;
  tooltipTemplate?: string;

  // Annotation options
  showAnnotations: boolean;
  showTradeId: boolean;
  showTradeType: boolean;
  showQuantity: boolean;
}

export interface TradeRectangleData {
  time1: UTCTimestamp;
  time2: UTCTimestamp;
  price1: number;
  price2: number;
  fillColor: string;
  borderColor: string;
  borderWidth: number;
  opacity: number;
  isProfitable?: boolean;
  [key: string]: any;
}

// Time parsing utility
function parseTime(time: string | number): UTCTimestamp | null {
  try {
    if (typeof time === 'number') {
      // Convert milliseconds to seconds if needed
      return (time > 1000000000000 ? Math.floor(time / 1000) : Math.floor(time)) as UTCTimestamp;
    }

    if (typeof time === 'string') {
      // Try parsing as timestamp string
      const timestamp = parseInt(time, 10);
      if (!isNaN(timestamp)) {
        return (timestamp > 1000000000000 ? Math.floor(timestamp / 1000) : timestamp) as UTCTimestamp;
      }

      // Parse as date string
      const date = new Date(time);
      if (!isNaN(date.getTime())) {
        return Math.floor(date.getTime() / 1000) as UTCTimestamp;
      }
    }

    return null;
  } catch {
    return null;
  }
}

// Find nearest time in chart data
function findNearestTime(targetTime: UTCTimestamp, chartData: any[]): UTCTimestamp | null {
  if (!chartData?.length) return null;

  let nearest: UTCTimestamp | null = null;
  let minDiff = Infinity;

  for (const item of chartData) {
    const itemTime = parseTime(item.time);
    if (itemTime === null) continue;

    const diff = Math.abs(itemTime - targetTime);
    if (diff < minDiff) {
      minDiff = diff;
      nearest = itemTime;
    }
  }

  return nearest;
}

// Create trade rectangles
export function createTradeRectangles(
  trades: TradeData[],
  options: TradeVisualizationOptions,
  chartData?: any[]
): TradeRectangleData[] {
  const rectangles: TradeRectangleData[] = [];

  for (const trade of trades) {
    // Validate trade data
    if (!trade.entryTime || typeof trade.entryPrice !== 'number' || typeof trade.exitPrice !== 'number') {
      continue;
    }

    const time1 = parseTime(trade.entryTime);
    if (!time1) continue;

    let time2: UTCTimestamp | null = null;
    if (trade.exitTime) {
      time2 = parseTime(trade.exitTime);
    } else if (chartData?.length) {
      // Use last chart time for open trades
      time2 = parseTime(chartData[chartData.length - 1]?.time);
    }
    if (!time2) continue;

    // Snap to nearest chart times
    const adjustedTime1 = chartData ? findNearestTime(time1, chartData) ?? time1 : time1;
    const adjustedTime2 = chartData ? findNearestTime(time2, chartData) ?? time2 : time2;

    const isProfitable = trade.isProfitable ?? false;
    const color = isProfitable ? options.rectangleColorProfit : options.rectangleColorLoss;

    rectangles.push({
      time1: Math.min(adjustedTime1, adjustedTime2) as UTCTimestamp,
      time2: Math.max(adjustedTime1, adjustedTime2) as UTCTimestamp,
      price1: Math.min(trade.entryPrice, trade.exitPrice),
      price2: Math.max(trade.entryPrice, trade.exitPrice),
      fillColor: color,
      borderColor: color,
      borderWidth: options.rectangleBorderWidth,
      opacity: options.rectangleFillOpacity,
      isProfitable,
      ...trade
    });
  }

  return rectangles;
}

// Create trade markers
export function createTradeMarkers(
  trades: TradeData[],
  options: TradeVisualizationOptions,
  chartData?: any[]
): SeriesMarker<Time>[] {
  const markers: SeriesMarker<Time>[] = [];

  for (const trade of trades) {
    if (!trade.entryTime || typeof trade.entryPrice !== 'number') continue;

    const entryTime = parseTime(trade.entryTime);
    if (!entryTime) continue;

    const adjustedEntryTime = chartData ? findNearestTime(entryTime, chartData) ?? entryTime : entryTime;

    const tradeType = trade.tradeType || 'long';
    const entryColor = tradeType === 'long'
      ? options.entryMarkerColorLong
      : options.entryMarkerColorShort;

    // Entry marker
    markers.push({
      time: adjustedEntryTime,
      position: options.entryMarkerPosition || (tradeType === 'long' ? 'belowBar' : 'aboveBar'),
      color: entryColor,
      shape: options.entryMarkerShape || (tradeType === 'long' ? 'arrowUp' : 'arrowDown'),
      text: options.showMarkerText ? `$${trade.entryPrice.toFixed(2)}` : '',
      size: options.markerSize || 1
    });

    // Exit marker (if trade is closed)
    if (trade.exitTime) {
      const exitTime = parseTime(trade.exitTime);
      if (exitTime) {
        const adjustedExitTime = chartData ? findNearestTime(exitTime, chartData) ?? exitTime : exitTime;
        const isProfitable = trade.isProfitable ?? false;
        const exitColor = isProfitable ? options.exitMarkerColorProfit : options.exitMarkerColorLoss;

        markers.push({
          time: adjustedExitTime,
          position: options.exitMarkerPosition || (tradeType === 'long' ? 'aboveBar' : 'belowBar'),
          color: exitColor,
          shape: options.exitMarkerShape || (tradeType === 'long' ? 'arrowDown' : 'arrowUp'),
          text: options.showMarkerText ? `$${trade.exitPrice.toFixed(2)}` : '',
          size: options.markerSize || 1
        });
      }
    }
  }

  return markers;
}

// Main export function
export function createTradeVisualElements(
  trades: TradeData[],
  options: TradeVisualizationOptions,
  chartData?: any[]
): {
  markers: SeriesMarker<Time>[];
  rectangles: TradeRectangleData[];
} {
  const markers: SeriesMarker<Time>[] = [];
  const rectangles: TradeRectangleData[] = [];

  if (!trades?.length) {
    return { markers, rectangles };
  }

  if (options.style === 'markers' || options.style === 'both') {
    markers.push(...createTradeMarkers(trades, options, chartData));
  }

  if (options.style === 'rectangles' || options.style === 'both') {
    rectangles.push(...createTradeRectangles(trades, options, chartData));
  }

  return { markers, rectangles };
}
```

---

## 5. Type Definitions

### 5.1 Core Types (`types/index.ts`)

```typescript
/**
 * Core type definitions
 */

export * from './series';
export * from './options';
export * from './trades';
export * from './sync';
export * from './events';

// Re-export relevant lightweight-charts types
export {
  Time,
  UTCTimestamp,
  IChartApi,
  ISeriesApi,
  SeriesMarker,
  MouseEventParams,
  LineData,
  CandlestickData,
  AreaData,
  HistogramData,
  BaselineData,
  BarData,
} from 'lightweight-charts';
```

### 5.2 Series Types (`types/series.ts`)

```typescript
/**
 * Series type definitions
 */

import { Time, CustomData } from 'lightweight-charts';

// Built-in series types
export type BuiltinSeriesType =
  | 'Line'
  | 'Area'
  | 'Candlestick'
  | 'Histogram'
  | 'Baseline'
  | 'Bar';

// Custom series types
export type CustomSeriesType =
  | 'Band'
  | 'Ribbon'
  | 'GradientRibbon'
  | 'Signal'
  | 'TrendFill';

// All series types
export type SeriesType = BuiltinSeriesType | CustomSeriesType;

// Custom series data interfaces
export interface BandData extends CustomData<Time> {
  time: Time;
  upper: number;
  middle: number;
  lower: number;
}

export interface RibbonData extends CustomData<Time> {
  time: Time;
  upper: number;
  lower: number;
}

export interface GradientRibbonData extends CustomData<Time> {
  time: Time;
  upper: number;
  lower: number;
  value?: number; // Optional value for gradient position
}

export interface SignalData extends CustomData<Time> {
  time: Time;
  value: number; // -1, 0, or 1 for bear/neutral/bull
}

export interface TrendFillData extends CustomData<Time> {
  time: Time;
  value: number;
  base?: number; // Base line value (default: 0)
}
```

---

## 6. Testing Strategy

### 6.1 Test Categories

| Category | Purpose | Tools | Coverage Target |
|----------|---------|-------|-----------------|
| Unit Tests | Individual function/class testing | Vitest | 90%+ |
| Integration Tests | Component interaction testing | Vitest + Testing Library | 80%+ |
| Visual Tests | Canvas rendering verification | Vitest + Canvas snapshots | All series types |
| E2E Tests | Full user flow testing | Playwright | Critical paths |

### 6.2 Unit Test Structure

```
tests/unit/
├── internal/
│   ├── chart.test.ts              # Chart action tests
│   ├── series.test.ts             # Series utilities tests
│   └── utils.test.ts              # Common utilities tests
├── services/
│   ├── CrosshairSync.test.ts      # Crosshair sync tests
│   ├── TimeRangeSync.test.ts      # Time range sync tests
│   ├── TradeVisualization.test.ts # Trade visualization tests
│   └── TemplateProcessor.test.ts  # Template processing tests
├── plugins/
│   ├── band/
│   │   ├── BandSeries.test.ts     # Band series tests
│   │   └── BandRenderer.test.ts   # Renderer tests
│   ├── ribbon/
│   │   └── RibbonSeries.test.ts
│   ├── gradient-ribbon/
│   │   └── GradientRibbonSeries.test.ts
│   ├── signal/
│   │   └── SignalSeries.test.ts
│   └── trend-fill/
│       └── TrendFillSeries.test.ts
├── data/
│   ├── transformers.test.ts       # Data transformation tests
│   ├── validators.test.ts         # Validation tests
│   └── time-utils.test.ts         # Time utility tests
└── types/
    └── type-guards.test.ts        # Type guard tests
```

### 6.3 Feature Parity Test Matrix

Each feature must have tests verifying parity with the original implementation:

```typescript
// tests/parity/series-parity.test.ts

import { describe, it, expect } from 'vitest';
import { createBandSeries, BandData, BandSeriesOptions } from '@nasha/charts';

describe('Band Series Feature Parity', () => {
  // Data handling parity
  describe('Data handling', () => {
    it('should accept BandData with upper, middle, lower values', () => {
      const data: BandData[] = [
        { time: 1704067200, upper: 110, middle: 100, lower: 90 },
        { time: 1704153600, upper: 115, middle: 102, lower: 88 },
      ];
      // Verify data is accepted and processed correctly
    });

    it('should handle empty data arrays', () => {});
    it('should handle whitespace data points', () => {});
    it('should sort data by time', () => {});
    it('should handle duplicate timestamps', () => {});
  });

  // Options parity
  describe('Options', () => {
    it('should apply default options matching Python defaults', () => {
      const defaults: Partial<BandSeriesOptions> = {
        upperLineColor: '#4CAF50',
        upperLineWidth: 2,
        middleLineColor: '#2196F3',
        middleLineWidth: 2,
        lowerLineColor: '#F44336',
        lowerLineWidth: 2,
        upperFillColor: 'rgba(76, 175, 80, 0.1)',
        lowerFillColor: 'rgba(244, 67, 54, 0.1)',
      };
      // Verify defaults match
    });

    it('should support all line style options', () => {});
    it('should support fill visibility toggles', () => {});
    it('should support line visibility toggles', () => {});
  });

  // Rendering parity
  describe('Rendering', () => {
    it('should render upper fill between upper and middle lines', () => {});
    it('should render lower fill between middle and lower lines', () => {});
    it('should respect line style (solid, dashed, dotted)', () => {});
    it('should render in correct z-order (fills behind lines)', () => {});
  });

  // Autoscaling parity
  describe('Autoscaling', () => {
    it('should include all three values in price scale calculation', () => {});
    it('should handle NaN/undefined values gracefully', () => {});
  });
});
```

### 6.4 Integration Test Structure

```typescript
// tests/integration/chart-manager.test.ts

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/svelte';
import ChartManager from '@nasha/charts/components/ChartManager.svelte';
import Chart from '@nasha/charts/components/Chart.svelte';

describe('ChartManager Integration', () => {
  afterEach(() => {
    cleanup();
  });

  describe('Chart Synchronization', () => {
    it('should sync crosshair position across charts', async () => {
      // Render ChartManager with multiple charts
      // Simulate crosshair move on chart 1
      // Verify crosshair position updated on chart 2
    });

    it('should sync time range across charts', async () => {
      // Render ChartManager with multiple charts
      // Simulate time range change on chart 1
      // Verify time range updated on chart 2
    });

    it('should respect sync disabled state', async () => {
      // Render ChartManager with sync disabled
      // Verify charts operate independently
    });

    it('should handle dynamic chart addition/removal', async () => {
      // Add charts dynamically
      // Verify sync still works
      // Remove charts
      // Verify cleanup is proper
    });
  });

  describe('Trade Visualization Integration', () => {
    it('should render trade rectangles on candlestick series', async () => {});
    it('should render trade markers at correct positions', async () => {});
    it('should show tooltips on trade hover', async () => {});
  });
});
```

### 6.5 Visual Regression Tests

```typescript
// tests/visual/series-rendering.test.ts

import { describe, it, expect } from 'vitest';
import { createTestChart, captureCanvas } from './test-utils';

describe('Series Visual Rendering', () => {
  const testData = {
    line: [
      { time: '2024-01-01', value: 100 },
      { time: '2024-01-02', value: 105 },
      { time: '2024-01-03', value: 102 },
    ],
    band: [
      { time: '2024-01-01', upper: 110, middle: 100, lower: 90 },
      { time: '2024-01-02', upper: 115, middle: 105, lower: 95 },
      { time: '2024-01-03', upper: 112, middle: 102, lower: 92 },
    ],
    candlestick: [
      { time: '2024-01-01', open: 100, high: 105, low: 98, close: 103 },
      { time: '2024-01-02', open: 103, high: 108, low: 101, close: 106 },
    ],
  };

  it('should render LineSeries correctly', async () => {
    const chart = createTestChart();
    const series = chart.addLineSeries({ color: '#2196F3' });
    series.setData(testData.line);

    const snapshot = await captureCanvas(chart);
    expect(snapshot).toMatchSnapshot();
  });

  it('should render BandSeries correctly', async () => {
    const chart = createTestChart();
    const series = createBandSeries(chart, {
      upperLineColor: '#4CAF50',
      middleLineColor: '#2196F3',
      lowerLineColor: '#F44336',
    });
    series.setData(testData.band);

    const snapshot = await captureCanvas(chart);
    expect(snapshot).toMatchSnapshot();
  });

  it('should render trade rectangles correctly', async () => {
    const chart = createTestChart();
    const series = chart.addCandlestickSeries();
    series.setData(testData.candlestick);

    const trades = [{
      entryTime: '2024-01-01',
      exitTime: '2024-01-02',
      entryPrice: 100,
      exitPrice: 106,
      isProfitable: true,
    }];

    // Add trade visualization
    // Capture and compare
  });
});
```

### 6.6 E2E Tests

```typescript
// tests/e2e/user-flows.test.ts

import { test, expect } from '@playwright/test';

test.describe('Chart User Flows', () => {
  test('should display chart with data', async ({ page }) => {
    await page.goto('/demo');

    // Wait for chart to render
    await page.waitForSelector('.nasha-chart canvas');

    // Verify chart is visible
    const chart = page.locator('.nasha-chart');
    await expect(chart).toBeVisible();
  });

  test('should sync crosshair across multiple charts', async ({ page }) => {
    await page.goto('/demo/multi-chart');

    // Get both chart containers
    const chart1 = page.locator('.nasha-chart').first();
    const chart2 = page.locator('.nasha-chart').last();

    // Move mouse over chart 1
    await chart1.hover({ position: { x: 200, y: 100 } });

    // Verify crosshair appears on chart 2
    // (Implementation depends on how crosshair is rendered)
  });

  test('should show trade tooltip on hover', async ({ page }) => {
    await page.goto('/demo/trades');

    // Hover over trade rectangle
    await page.locator('.trade-rectangle').first().hover();

    // Verify tooltip appears
    const tooltip = page.locator('.trade-tooltip');
    await expect(tooltip).toBeVisible();
  });

  test('should switch time ranges', async ({ page }) => {
    await page.goto('/demo/range-switcher');

    // Click 1M button
    await page.click('button:has-text("1M")');

    // Verify time range changed
    // (Check visible range or data point count)
  });
});
```

### 6.7 Test Utilities

```typescript
// tests/test-utils.ts

import { createChart, IChartApi } from 'lightweight-charts';

export function createTestChart(options?: Partial<ChartOptions>): IChartApi {
  const container = document.createElement('div');
  container.style.width = '800px';
  container.style.height = '400px';
  document.body.appendChild(container);

  return createChart(container, {
    width: 800,
    height: 400,
    ...options,
  });
}

export async function captureCanvas(chart: IChartApi): Promise<string> {
  // Force render
  chart.timeScale().fitContent();

  // Wait for render
  await new Promise(resolve => setTimeout(resolve, 100));

  // Get canvas
  const canvas = chart.chartElement().querySelector('canvas');
  if (!canvas) throw new Error('Canvas not found');

  return canvas.toDataURL();
}

export function generateTestData(type: 'line' | 'ohlc' | 'band', count: number = 100) {
  const baseTime = new Date('2024-01-01').getTime() / 1000;
  const data = [];

  let price = 100;

  for (let i = 0; i < count; i++) {
    const time = baseTime + i * 86400; // Daily
    const change = (Math.random() - 0.5) * 5;
    price += change;

    switch (type) {
      case 'line':
        data.push({ time, value: price });
        break;
      case 'ohlc':
        const high = price + Math.random() * 3;
        const low = price - Math.random() * 3;
        data.push({
          time,
          open: price - change / 2,
          high,
          low,
          close: price,
        });
        break;
      case 'band':
        data.push({
          time,
          upper: price + 10,
          middle: price,
          lower: price - 10,
        });
        break;
    }
  }

  return data;
}
```

### 6.8 CI/CD Test Configuration

```yaml
# .github/workflows/test.yml

name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci
      - run: npm run test:unit -- --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  integration-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci
      - run: npm run test:integration

  visual-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci
      - run: npm run test:visual

      - name: Upload visual diffs
        uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: visual-diffs
          path: tests/visual/__snapshots__/

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e

      - name: Upload test results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## 7. Implementation Phases

### Phase 1: Foundation (Priority P0)

**Goal**: Basic chart rendering with built-in series

**Tasks**:
- [ ] Project setup (package.json, tsconfig, vite, vitest)
- [ ] Internal utilities (chart action, series utilities)
- [ ] Chart.svelte component
- [ ] Built-in series components (Line, Area, Candlestick, Histogram)
- [ ] Basic tests for all above

**Deliverable**: Working charts with built-in series

### Phase 2: Multi-Chart & Sync (Priority P0)

**Goal**: Multiple synchronized charts

**Tasks**:
- [ ] ChartManager.svelte component
- [ ] CrosshairSync service
- [ ] TimeRangeSync service
- [ ] PriceScale and TimeScale components
- [ ] Integration tests for sync

**Deliverable**: Synchronized multi-chart layouts

### Phase 3: Trade Visualization (Priority P0)

**Goal**: Trade overlays and tooltips

**Tasks**:
- [ ] TradeVisualization service
- [ ] TradeRectanglePrimitive
- [ ] TooltipManager
- [ ] TemplateProcessor
- [ ] TradeOverlay.svelte component
- [ ] Visual tests for trade rendering

**Deliverable**: Trade visualization matching original

### Phase 4: Custom Series (Priority P1)

**Goal**: All custom series ported

**Tasks**:
- [ ] BandSeries plugin
- [ ] RibbonSeries plugin
- [ ] GradientRibbonSeries plugin
- [ ] SignalSeries plugin
- [ ] TrendFillSeries plugin
- [ ] Corresponding Svelte components
- [ ] Visual tests for each custom series

**Deliverable**: All custom series working

### Phase 5: UI Controls (Priority P1)

**Goal**: Legends and range switcher

**Tasks**:
- [ ] LegendPrimitive
- [ ] Legend.svelte component
- [ ] RangeSwitcherPrimitive
- [ ] RangeSwitcher.svelte component
- [ ] Integration tests

**Deliverable**: Full UI control set

### Phase 6: Polish & Documentation (Priority P2)

**Goal**: Production-ready library

**Tasks**:
- [ ] Remaining series (Baseline, Bar)
- [ ] Annotations support
- [ ] Performance optimization
- [ ] API documentation
- [ ] Usage examples
- [ ] E2E test suite completion

**Deliverable**: Complete, documented library

---

## 8. Acceptance Criteria

### 8.1 Feature Parity Checklist

- [ ] All 6 built-in series types render correctly
- [ ] All 5 custom series types render correctly
- [ ] Crosshair sync works across charts
- [ ] Time range sync works across charts
- [ ] Trade rectangles render with correct colors/positions
- [ ] Trade markers render with correct shapes/colors
- [ ] Trade tooltips display with template support
- [ ] Legends update on crosshair move
- [ ] Range switcher changes visible time range
- [ ] Multi-pane charts work correctly

### 8.2 Quality Metrics

- [ ] Unit test coverage > 90%
- [ ] Integration test coverage > 80%
- [ ] Visual tests pass for all series types
- [ ] E2E tests pass for critical flows
- [ ] No TypeScript errors
- [ ] Bundle size < 100KB gzipped (excluding lightweight-charts)

### 8.3 API Compatibility

- [ ] Component APIs match specification
- [ ] Event names and payloads match specification
- [ ] Options interfaces match Python counterparts
- [ ] Data interfaces match Python counterparts

---

## 9. Appendix

### A. Reference Files

| Feature | Source File | Lines |
|---------|-------------|-------|
| Series Factory | `frontend/src/series/UnifiedSeriesFactory.ts` | All |
| Custom Series Descriptors | `frontend/src/series/descriptors/customSeriesDescriptors.ts` | All |
| Band Series Plugin | `frontend/src/plugins/series/bandSeriesPlugin.ts` | All |
| Trade Visualization | `frontend/src/services/tradeVisualization.ts` | All |
| Trade Rectangle Primitive | `frontend/src/primitives/TradeRectanglePrimitive.ts` | All |
| Chart Sync | `frontend/src/LightweightCharts.tsx` | 446-700 |
| Type Definitions | `frontend/src/types/ChartInterfaces.ts` | All |

### B. External Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `lightweight-charts` | ^4.1.0 | Core charting library |
| `fancy-canvas` | ^2.1.0 | Canvas rendering utilities |
| `svelte` | ^4.0.0 or ^5.0.0 | UI framework |
| `vitest` | ^1.0.0 | Testing framework |
| `@testing-library/svelte` | ^4.0.0 | Component testing |
| `playwright` | ^1.40.0 | E2E testing |

### C. svelte-lightweight-charts Patterns

Key patterns adopted from `trash-and-fire/svelte-lightweight-charts`:

1. **Svelte Actions**: Use `use:action` for chart lifecycle
2. **Reference Callbacks**: `ref={(api) => ...}` for API access
3. **Reactive Opt-in**: `reactive={true}` for data reactivity
4. **Context Provider**: Share chart instance with children
5. **Unique IDs**: `performance.now().toString(36)` for IDs

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-11-27 | Initial specification |
| 2.0 | 2025-11-28 | Added detailed implementation specs, testing strategy, parity checklist |
