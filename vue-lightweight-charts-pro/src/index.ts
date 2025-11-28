/**
 * @fileoverview Main entry point for vue-lightweight-charts-pro
 *
 * Vue 3 components and composables for TradingView's Lightweight Charts
 * with support for custom pro series (Band, Ribbon, Signal, etc.)
 *
 * @example Using components
 * ```vue
 * <script setup>
 * import { LwChart, LwSeries } from 'vue-lightweight-charts-pro'
 * import { ref } from 'vue'
 *
 * const bandData = ref([
 *   { time: '2024-01-01', upper: 105, middle: 100, lower: 95 },
 * ])
 * </script>
 *
 * <template>
 *   <LwChart :options="{ layout: { background: { color: '#1a1a1a' } } }">
 *     <LwSeries type="Band" :data="bandData" />
 *   </LwChart>
 * </template>
 * ```
 *
 * @example Using composables
 * ```vue
 * <script setup>
 * import { useChart, useSeries } from 'vue-lightweight-charts-pro'
 *
 * const { containerRef, chart } = useChart({ autoSize: true })
 * const { series, setData } = useSeries({
 *   chart,
 *   type: 'Candlestick',
 * })
 * </script>
 *
 * <template>
 *   <div ref="containerRef" style="height: 400px" />
 * </template>
 * ```
 */

// ============================================================================
// Components
// ============================================================================

export { LwChart, LwSeries } from './components';
export type { LwChartProps, LwSeriesProps } from './components';

// ============================================================================
// Composables
// ============================================================================

export {
  useChart,
  useSeries,
  useChartContext,
  provideChartContext,
  ChartContextKey,
} from './composables';

export type { UseChartOptions, UseChartReturn, UseSeriesOptions, UseSeriesReturn } from './composables';

// ============================================================================
// Types
// ============================================================================

export type {
  // Chart types
  VueChartOptions,
  VueChartApi,
  ChartContext,
  ChartEvents,

  // Series types
  BuiltInSeriesType,
  CustomSeriesType,
  AllSeriesType,
  SeriesDataMap,
  SeriesOptionsMapping,
  SeriesProps,
  SeriesEvents,

  // Re-exported from lightweight-charts
  IChartApi,
  ISeriesApi,
  DeepPartial,
  ChartOptions,
  SeriesType,
  Time,
  LineData,
  CandlestickData,
  BarData,
  AreaData,
  HistogramData,
  BaselineData,

  // Re-exported from lightweight-charts-pro-core
  BandData,
  BandSeriesOptions,
  RibbonData,
  RibbonSeriesOptions,
  GradientRibbonData,
  GradientRibbonSeriesOptions,
  SignalData,
  SignalSeriesOptions,
  TrendFillData,
  TrendFillSeriesOptions,
} from './types';

// ============================================================================
// Re-export core utilities for convenience
// ============================================================================

export {
  // Series plugins
  BandSeriesPlugin,
  RibbonSeriesPlugin,
  GradientRibbonSeriesPlugin,
  SignalSeriesPlugin,
  TrendFillSeriesPlugin,

  // Default options
  defaultBandOptions,
  defaultRibbonOptions,
  defaultGradientRibbonOptions,
  defaultSignalOptions,
  defaultTrendFillOptions,

  // Rendering utilities
  LineStyle,
} from 'lightweight-charts-pro-core';
