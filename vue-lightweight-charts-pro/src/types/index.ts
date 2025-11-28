/**
 * @fileoverview Type definitions for vue-lightweight-charts-pro
 */

import type {
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
  SeriesOptionsMap,
} from 'lightweight-charts';

import type {
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
} from 'lightweight-charts-pro-core';

// ============================================================================
// Chart Types
// ============================================================================

/**
 * Chart options for Vue component
 */
export interface VueChartOptions extends DeepPartial<ChartOptions> {
  autoSize?: boolean;
}

/**
 * Chart instance with additional Vue-specific methods
 */
export interface VueChartApi extends IChartApi {
  // Additional methods can be added here
}

// ============================================================================
// Series Types
// ============================================================================

/**
 * Built-in series types
 */
export type BuiltInSeriesType = 'Line' | 'Area' | 'Bar' | 'Candlestick' | 'Histogram' | 'Baseline';

/**
 * Custom series types from lightweight-charts-pro-core
 */
export type CustomSeriesType = 'Band' | 'Ribbon' | 'GradientRibbon' | 'Signal' | 'TrendFill';

/**
 * All available series types
 */
export type AllSeriesType = BuiltInSeriesType | CustomSeriesType;

/**
 * Series data mapping
 */
export interface SeriesDataMap {
  Line: LineData<Time>[];
  Area: AreaData<Time>[];
  Bar: BarData<Time>[];
  Candlestick: CandlestickData<Time>[];
  Histogram: HistogramData<Time>[];
  Baseline: BaselineData<Time>[];
  Band: BandData[];
  Ribbon: RibbonData[];
  GradientRibbon: GradientRibbonData[];
  Signal: SignalData[];
  TrendFill: TrendFillData[];
}

/**
 * Series options mapping
 */
export interface SeriesOptionsMapping {
  Line: SeriesOptionsMap['Line'];
  Area: SeriesOptionsMap['Area'];
  Bar: SeriesOptionsMap['Bar'];
  Candlestick: SeriesOptionsMap['Candlestick'];
  Histogram: SeriesOptionsMap['Histogram'];
  Baseline: SeriesOptionsMap['Baseline'];
  Band: Partial<BandSeriesOptions>;
  Ribbon: Partial<RibbonSeriesOptions>;
  GradientRibbon: Partial<GradientRibbonSeriesOptions>;
  Signal: Partial<SignalSeriesOptions>;
  TrendFill: Partial<TrendFillSeriesOptions>;
}

/**
 * Series props for Vue component
 */
export interface SeriesProps<T extends AllSeriesType = AllSeriesType> {
  type: T;
  data: SeriesDataMap[T];
  options?: SeriesOptionsMapping[T];
  reactive?: boolean;
}

// ============================================================================
// Context Types
// ============================================================================

/**
 * Chart context provided to child components
 */
export interface ChartContext {
  chart: VueChartApi | null;
  addSeries: <T extends AllSeriesType>(
    type: T,
    options?: SeriesOptionsMapping[T]
  ) => ISeriesApi<SeriesType> | null;
  removeSeries: (series: ISeriesApi<SeriesType>) => void;
}

// ============================================================================
// Event Types
// ============================================================================

/**
 * Chart event payloads
 */
export interface ChartEvents {
  ready: VueChartApi;
  crosshairMove: { time: Time | null; point: { x: number; y: number } | null };
  click: { time: Time | null; point: { x: number; y: number } | null };
  visibleTimeRangeChange: { from: Time | null; to: Time | null };
}

/**
 * Series event payloads
 */
export interface SeriesEvents {
  ready: ISeriesApi<SeriesType>;
  dataChange: { data: unknown[] };
}

// Re-export types from dependencies for convenience
export type {
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
};
