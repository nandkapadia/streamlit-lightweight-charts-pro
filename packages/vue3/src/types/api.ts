/**
 * @fileoverview TypeScript types for API contracts.
 *
 * These types match the FastAPI backend data models defined in
 * lightweight_charts_backend/services/datafeed.py
 */

/**
 * Information about a data chunk for pagination.
 */
export interface ChunkInfo {
  /** Start index in the full dataset */
  startIndex: number;
  /** End index in the full dataset */
  endIndex: number;
  /** Timestamp of first data point */
  startTime: number;
  /** Timestamp of last data point */
  endTime: number;
  /** Number of data points in chunk */
  count: number;
}

/**
 * A single data point in a chart series.
 */
export interface DataPoint {
  /** Timestamp (Unix timestamp in seconds or date string) */
  time: number | string;
  /** Value (for line/area series) */
  value?: number;
  /** Open price (for candlestick/bar series) */
  open?: number;
  /** High price (for candlestick/bar series) */
  high?: number;
  /** Low price (for candlestick/bar series) */
  low?: number;
  /** Close price (for candlestick/bar series) */
  close?: number;
  /** Optional custom data fields */
  [key: string]: unknown;
}

/**
 * Configuration options for a chart series.
 */
export interface SeriesOptions {
  /** Series display color */
  color?: string;
  /** Line width */
  lineWidth?: number;
  /** Line style (solid, dashed, dotted) */
  lineStyle?: number;
  /** Price scale ID */
  priceScaleId?: string;
  /** Whether to show price line */
  priceLineVisible?: boolean;
  /** Series title for legend */
  title?: string;
  /** Additional series-specific options */
  [key: string]: unknown;
}

/**
 * Request model for setting series data.
 */
export interface SetSeriesDataRequest {
  /** Pane index (default 0) */
  paneId?: number;
  /** Type of series (line, candlestick, area, etc.) */
  seriesType: string;
  /** Array of data points */
  data: DataPoint[];
  /** Optional series configuration */
  options?: SeriesOptions;
}

/**
 * Request model for getting historical data.
 */
export interface GetHistoryRequest {
  /** Pane index */
  paneId: number;
  /** Series identifier */
  seriesId: string;
  /** Get data before this timestamp */
  beforeTime: number;
  /** Number of data points to return (default 500) */
  count?: number;
}

/**
 * Response for creating a chart.
 */
export interface CreateChartResponse {
  /** Chart identifier */
  chartId: string;
  /** Chart options */
  options: Record<string, unknown>;
}

/**
 * Response for getting series data (non-chunked).
 */
export interface SeriesDataResponse {
  /** Series identifier */
  seriesId: string;
  /** Series type */
  seriesType: string;
  /** Series data points */
  data: DataPoint[];
  /** Series options */
  options: SeriesOptions;
  /** Whether data is chunked */
  chunked: false;
  /** Total count of data points */
  totalCount: number;
}

/**
 * Response for getting chunked series data.
 */
export interface ChunkedSeriesDataResponse {
  /** Series identifier */
  seriesId: string;
  /** Series type */
  seriesType: string;
  /** Series data points (subset) */
  data: DataPoint[];
  /** Series options */
  options: SeriesOptions;
  /** Whether data is chunked */
  chunked: true;
  /** Chunk metadata */
  chunkInfo: ChunkInfo;
  /** Whether there's more data before this chunk */
  hasMoreBefore: boolean;
  /** Whether there's more data after this chunk */
  hasMoreAfter: boolean;
  /** Total available data points */
  totalCount: number;
}

/**
 * Union type for series data response.
 */
export type GetSeriesDataResponse = SeriesDataResponse | ChunkedSeriesDataResponse;

/**
 * Response for getting historical data.
 */
export interface GetHistoryResponse {
  /** Series identifier */
  seriesId: string;
  /** Historical data points */
  data: DataPoint[];
  /** Chunk metadata */
  chunkInfo: ChunkInfo;
  /** Whether there's more data before */
  hasMoreBefore: boolean;
  /** Whether there's more data after */
  hasMoreAfter: boolean;
  /** Total available data points */
  totalCount: number;
}

/**
 * Response for setting series data.
 */
export interface SetSeriesDataResponse {
  /** Series identifier */
  seriesId: string;
  /** Series type */
  seriesType: string;
  /** Number of data points stored */
  count: number;
}

/**
 * Full chart data including all panes and series.
 */
export interface ChartData {
  /** Chart identifier */
  chartId: string;
  /** Panes with series data (paneId -> seriesId -> series data) */
  panes: Record<string, Record<string, {
    seriesType: string;
    data: DataPoint[];
    options: SeriesOptions;
  }>>;
  /** Chart options */
  options: Record<string, unknown>;
}

/**
 * Error response from API.
 */
export interface ApiError {
  /** Error message */
  error: string;
  /** Detail message (FastAPI style) */
  detail?: string;
  /** HTTP status code */
  statusCode?: number;
}

/**
 * Health check response.
 */
export interface HealthCheckResponse {
  /** Server status */
  status: 'healthy' | 'unhealthy';
  /** API version */
  version: string;
}
