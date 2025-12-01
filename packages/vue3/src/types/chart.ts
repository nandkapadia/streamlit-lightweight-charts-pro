/**
 * @fileoverview TypeScript types for chart configuration and state.
 */

import type { IChartApi, ISeriesApi, SeriesType } from 'lightweight-charts';
import type { ChunkInfo, DataPoint, SeriesOptions } from './api';

/**
 * Lazy loading configuration for a series.
 */
export interface LazyLoadingConfig {
  /** Whether lazy loading is enabled */
  enabled: boolean;
  /** Size of chunks to request */
  chunkSize: number;
  /** Whether there's more data before current range */
  hasMoreBefore: boolean;
  /** Whether there's more data after current range */
  hasMoreAfter: boolean;
  /** Current chunk metadata */
  chunkInfo?: ChunkInfo;
}

/**
 * Configuration for a single chart series.
 */
export interface SeriesConfig {
  /** Unique series identifier */
  seriesId: string;
  /** Display name for the series */
  name?: string;
  /** Series type (line, candlestick, area, etc.) */
  seriesType: SeriesType | string;
  /** Pane ID where series is rendered */
  paneId?: number;
  /** Series data points */
  data: DataPoint[];
  /** Series display options */
  options?: SeriesOptions;
  /** Lazy loading configuration */
  lazyLoading?: LazyLoadingConfig;
}

/**
 * Configuration for a chart pane.
 */
export interface PaneConfig {
  /** Pane identifier */
  paneId: number;
  /** Pane height (percentage or pixels) */
  height?: number | string;
  /** Whether pane is collapsed */
  collapsed?: boolean;
  /** Series rendered in this pane */
  series: SeriesConfig[];
}

/**
 * Time scale options for the chart.
 */
export interface TimeScaleOptions {
  /** Visible time range in seconds */
  timeVisible?: boolean;
  /** Show seconds in time labels */
  secondsVisible?: boolean;
  /** Border color */
  borderColor?: string;
  /** Text color */
  textColor?: string;
  /** Fixed left edge timestamp */
  fixedLeftEdge?: boolean;
  /** Fixed right edge timestamp */
  fixedRightEdge?: boolean;
  /** Shift visible range on new bar */
  shiftVisibleRangeOnNewBar?: boolean;
}

/**
 * Price scale options.
 */
export interface PriceScaleOptions {
  /** Position (left, right, none) */
  position?: 'left' | 'right' | 'none';
  /** Border color */
  borderColor?: string;
  /** Text color */
  textColor?: string;
  /** Auto scale */
  autoScale?: boolean;
  /** Invert scale */
  invertScale?: boolean;
  /** Scale margins */
  scaleMargins?: {
    top: number;
    bottom: number;
  };
}

/**
 * Grid options for chart.
 */
export interface GridOptions {
  /** Vertical lines */
  vertLines?: {
    color?: string;
    style?: number;
    visible?: boolean;
  };
  /** Horizontal lines */
  horzLines?: {
    color?: string;
    style?: number;
    visible?: boolean;
  };
}

/**
 * Layout options for chart.
 */
export interface LayoutOptions {
  /** Background color */
  backgroundColor?: string;
  /** Text color */
  textColor?: string;
  /** Font size */
  fontSize?: number;
  /** Font family */
  fontFamily?: string;
}

/**
 * Crosshair options.
 */
export interface CrosshairOptions {
  /** Crosshair mode */
  mode?: number;
  /** Vertical line options */
  vertLine?: {
    color?: string;
    width?: number;
    style?: number;
    visible?: boolean;
    labelVisible?: boolean;
  };
  /** Horizontal line options */
  horzLine?: {
    color?: string;
    width?: number;
    style?: number;
    visible?: boolean;
    labelVisible?: boolean;
  };
}

/**
 * Complete chart configuration options.
 */
export interface ChartOptions {
  /** Chart width (auto-resize if not specified) */
  width?: number;
  /** Chart height */
  height?: number;
  /** Time scale options */
  timeScale?: TimeScaleOptions;
  /** Right price scale options */
  rightPriceScale?: PriceScaleOptions;
  /** Left price scale options */
  leftPriceScale?: PriceScaleOptions;
  /** Grid options */
  grid?: GridOptions;
  /** Layout options */
  layout?: LayoutOptions;
  /** Crosshair options */
  crosshair?: CrosshairOptions;
  /** Watermark text */
  watermark?: {
    text?: string;
    color?: string;
    visible?: boolean;
  };
  /** Locale for formatting */
  localization?: {
    locale?: string;
    dateFormat?: string;
    timeFormatter?: (time: number) => string;
  };
}

/**
 * Props for the LightweightChart component.
 */
export interface ChartProps {
  /** Unique chart identifier */
  chartId: string;
  /** Backend API URL */
  apiUrl?: string;
  /** WebSocket URL */
  wsUrl?: string;
  /** Chart configuration options */
  options?: ChartOptions;
  /** Initial series configurations */
  series?: SeriesConfig[];
  /** Whether to auto-connect to WebSocket */
  autoConnect?: boolean;
  /** CSS class for container */
  class?: string;
  /** Inline styles for container */
  style?: Record<string, string>;
}

/**
 * Emitted events from the chart component.
 */
export interface ChartEmits {
  /** Emitted when chart is ready */
  (e: 'ready', chart: IChartApi): void;
  /** Emitted when crosshair moves */
  (e: 'crosshairMove', params: unknown): void;
  /** Emitted when time range changes */
  (e: 'visibleTimeRangeChange', range: unknown): void;
  /** Emitted when series is clicked */
  (e: 'seriesClick', params: unknown): void;
  /** Emitted on WebSocket connection */
  (e: 'connected'): void;
  /** Emitted on WebSocket disconnection */
  (e: 'disconnected'): void;
  /** Emitted on error */
  (e: 'error', error: Error): void;
  /** Emitted when data is loaded */
  (e: 'dataLoaded', seriesId: string, count: number): void;
}

/**
 * Internal chart state managed by composables.
 */
export interface ChartState {
  /** Chart API instance */
  chart: IChartApi | null;
  /** Map of series ID to series API */
  seriesMap: Map<string, ISeriesApi<SeriesType>>;
  /** Current series configurations */
  seriesConfigs: SeriesConfig[];
  /** Whether chart is initialized */
  isInitialized: boolean;
  /** Whether chart is loading data */
  isLoading: boolean;
  /** Last error message */
  error: string | null;
}
