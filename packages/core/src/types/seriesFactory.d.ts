/**
 * @fileoverview Type definitions for Series Factory
 *
 * Provides type-safe alternatives to `any` types in UnifiedSeriesFactory
 */

import { ISeriesApi, SeriesMarker, Time } from 'lightweight-charts';
import { TradeConfig, TradeVisualizationOptions } from './index';

/**
 * Generic series data point
 * Can be extended with specific time and value types
 */
export interface SeriesDataPoint {
  time: Time;
  value?: number;
  [key: string]: unknown;
}

/**
 * Price line configuration
 */
export interface PriceLineConfig {
  price: number;
  color?: string;
  lineWidth?: number;
  lineStyle?: number;
  axisLabelVisible?: boolean;
  title?: string;
  [key: string]: unknown;
}

/**
 * Price scale configuration
 */
export interface PriceScaleConfig {
  scaleMargins?: {
    top?: number;
    bottom?: number;
  };
  mode?: number;
  invertScale?: boolean;
  alignLabels?: boolean;
  borderVisible?: boolean;
  borderColor?: string;
  entireTextOnly?: boolean;
  visible?: boolean;
  [key: string]: unknown;
}

/**
 * Legend configuration
 */
export interface LegendConfig {
  visible?: boolean;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  [key: string]: unknown;
}

/**
 * Line object structure from Python/backend
 */
export interface LineObject {
  color?: string;
  lineWidth?: number;
  lineStyle?: number;
  [key: string]: unknown;
}

/**
 * Nested options structure (as received from backend)
 */
export interface NestedSeriesOptions {
  [key: string]: LineObject | string | number | boolean | unknown;
}

/**
 * Flattened options structure (for Lightweight Charts API)
 */
export interface FlattenedSeriesOptions {
  [key: string]: string | number | boolean | undefined;
}

/**
 * Extended series configuration with proper typing
 */
export interface TypedExtendedSeriesConfig {
  /** Series type (e.g., 'Line', 'Area', 'Band') */
  type: string;

  /** Series data points */
  data?: SeriesDataPoint[];

  /** Series options */
  options?: NestedSeriesOptions | FlattenedSeriesOptions;

  /** Pane ID for multi-pane charts */
  paneId?: number;

  /** Price scale configuration */
  priceScale?: PriceScaleConfig;

  /** Price lines to add */
  priceLines?: PriceLineConfig[];

  /** Markers to add */
  markers?: SeriesMarker<Time>[];

  /** Legend configuration */
  legend?: LegendConfig;

  /** Series ID for identification */
  seriesId?: string;

  /** Chart ID for global identification */
  chartId?: string;

  /** Trade configurations for visualization */
  trades?: TradeConfig[];

  /** Trade visualization options */
  tradeVisualizationOptions?: TradeVisualizationOptions;
}

/**
 * Extended series API with metadata and proper typing
 */
export interface TypedExtendedSeriesApi extends ISeriesApi<SeriesDataPoint> {
  paneId?: number;
  seriesId?: string;
  legendConfig?: LegendConfig;
}

/**
 * Chart API for series creation (with proper typing)
 */
export interface SeriesChartApi {
  addLineSeries: (options?: unknown) => ISeriesApi<SeriesDataPoint>;
  addAreaSeries: (options?: unknown) => ISeriesApi<SeriesDataPoint>;
  addBarSeries: (options?: unknown) => ISeriesApi<SeriesDataPoint>;
  addCandlestickSeries: (options?: unknown) => ISeriesApi<SeriesDataPoint>;
  addHistogramSeries: (options?: unknown) => ISeriesApi<SeriesDataPoint>;
  addBaselineSeries: (options?: unknown) => ISeriesApi<SeriesDataPoint>;
  addCustomSeriesView: (view: unknown) => ISeriesApi<SeriesDataPoint>;
  [key: string]: unknown;
}
