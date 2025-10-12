/**
 * @fileoverview Comprehensive Chart Interfaces
 *
 * TypeScript interfaces for chart APIs, series data, and template contexts.
 * Replaces 'any' types with proper typed interfaces throughout the codebase.
 *
 * This module provides:
 * - Extended chart and series API interfaces
 * - Data point interfaces for all series types
 * - Trade data and visualization types
 * - Template context interfaces
 *
 * Features:
 * - Full type safety for chart operations
 * - Extended properties for custom features
 * - Comprehensive data point definitions
 * - Template engine context types
 *
 * @example
 * ```typescript
 * import { ExtendedChartApi, LineDataPoint } from './ChartInterfaces';
 *
 * const chart: ExtendedChartApi = createChart(container);
 * const data: LineDataPoint[] = [
 *   { time: '2024-01-01', value: 100 }
 * ];
 * ```
 */

import { IChartApi, ISeriesApi, UTCTimestamp, SeriesOptionsMap } from 'lightweight-charts';

// =============================================================================
// CHART API INTERFACES
// =============================================================================

/**
 * Extended chart API with commonly used properties
 */
export interface ExtendedChartApi extends IChartApi {
  _storageListenerAdded?: boolean;
  _timeRangeStorageListenerAdded?: boolean;
  _isExternalSync?: boolean;
  _isExternalTimeRangeSync?: boolean;
  _pendingTradeRectangles?: Array<
    | {
        series: ISeriesApi<any>;
        trade: TradeData;
        rectangleConfig: RectangleConfig;
      }
    | {
        rectangles: any[];
        series: ISeriesApi<any>;
        chartId: string;
      }
  >;
  _userHasInteracted?: boolean;
  _model?: {
    timeScale?: {
      barSpacing?: () => number;
    };
  };
  chartElement: () => HTMLDivElement;
}

/**
 * Extended series API with commonly used properties
 */
export interface ExtendedSeriesApi<TData extends keyof SeriesOptionsMap = keyof SeriesOptionsMap>
  extends ISeriesApi<TData> {
  paneId?: number;
  legendConfig?: LegendData;
  seriesId?: string;
  assignedPaneId?: number;
  addShape?: (_shape: ShapeData) => void;
  setShapes?: (_shapes: ShapeData[]) => void;
}

// =============================================================================
// SERIES DATA INTERFACES
// =============================================================================

/**
 * Base data point interface
 */
export interface BaseDataPoint {
  time: UTCTimestamp | string | number;
  value?: number;
  color?: string;
}

/**
 * OHLC data point
 */
export interface OHLCDataPoint extends BaseDataPoint {
  open: number;
  high: number;
  low: number;
  close: number;
}

/**
 * Area/Line data point
 */
export interface LineDataPoint extends BaseDataPoint {
  value: number;
}

/**
 * Histogram data point
 */
export interface HistogramDataPoint extends BaseDataPoint {
  value: number;
  color?: string;
}

/**
 * Baseline data point
 */
export interface BaselineDataPoint extends BaseDataPoint {
  value: number;
  topLineColor?: string;
  topFillColor1?: string;
  topFillColor2?: string;
  bottomLineColor?: string;
  bottomFillColor1?: string;
  bottomFillColor2?: string;
}

/**
 * Band series data point
 */
export interface BandDataPoint extends BaseDataPoint {
  upper: number;
  lower: number;
}

/**
 * Generic series data type union
 */
export type SeriesDataPoint =
  | OHLCDataPoint
  | LineDataPoint
  | HistogramDataPoint
  | BaselineDataPoint
  | BandDataPoint;

// =============================================================================
// TRADE AND VISUALIZATION INTERFACES
// =============================================================================

/**
 * Trade data structure
 */
export interface TradeData {
  id?: string;
  entryTime: UTCTimestamp | string | number;
  exitTime: UTCTimestamp | string | number;
  entryPrice: number;
  exitPrice: number;
  quantity?: number;
  side: 'long' | 'short';
  pnl?: number;
  pnlPercentage?: number;
  series_id?: string;
  series_index?: number;
}

/**
 * Rectangle configuration
 */
export interface RectangleConfig {
  time1: UTCTimestamp;
  time2: UTCTimestamp;
  price1: number;
  price2: number;
  color?: string;
  fillColor?: string;
  borderColor?: string;
  borderWidth?: number;
  fillOpacity?: number;
  text?: string;
  textColor?: string;
  textBackground?: string;
}

/**
 * Shape data for series
 */
export interface ShapeData {
  type: 'rectangle' | 'line' | 'arrow' | 'circle';
  points: Array<{ time: UTCTimestamp; price: number }>;
  color?: string;
  fillColor?: string;
  borderWidth?: number;
  text?: string;
}

// =============================================================================
// TEMPLATE AND CONTEXT INTERFACES
// =============================================================================

/**
 * Template formatting options
 */
export interface TemplateFormatting {
  price?: {
    precision?: number;
    currency?: string;
    symbol?: string;
  };
  time?: {
    format?: string;
    timezone?: string;
  };
  // Convenience properties for direct format assignment
  valueFormat?: string;
  timeFormat?: string;
  percentageFormat?: string;
  locale?: string;
  percentage?: {
    precision?: number;
    showSign?: boolean;
  };
  number?: {
    precision?: number;
    thousandsSeparator?: string;
    decimalSeparator?: string;
  };
}

/**
 * Template context for string interpolation
 */
export interface TemplateContext {
  price?: number;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  volume?: number;
  time?: UTCTimestamp | string | number;
  value?: number;
  change?: number;
  changePercent?: number;
  symbol?: string;
  seriesName?: string;
  paneId?: number;
  formatting?: TemplateFormatting;
  customData?: Record<string, unknown>;
  seriesData?: unknown; // Raw series data for template processing
}

// =============================================================================
// LEGEND AND UI INTERFACES
// =============================================================================

/**
 * Legend data structure
 */
export interface LegendData {
  visible?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  text?: string;
  symbolName?: string;
  textColor?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  padding?: number;
  margin?: number;
  zIndex?: number;
  width?: number;
  height?: number;
  showValues?: boolean;
  valueFormat?: string;
  updateOnCrosshair?: boolean;
  priceFormat?: string;
  // Allow additional properties for flexibility
  [key: string]: unknown;
}

/**
 * Corner position type
 */
export type CornerPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

/**
 * Button configuration
 */
export interface ButtonConfig {
  id: string;
  content: string;
  corner: CornerPosition;
  onClick?: (_event: MouseEvent) => void;
  style?: Partial<CSSStyleDeclaration>;
  className?: string;
  disabled?: boolean;
  visible?: boolean;
}

// =============================================================================
// COORDINATE AND DIMENSION INTERFACES
// =============================================================================

/**
 * Coordinate point
 */
export interface CoordinatePoint {
  x: number;
  y: number;
}

/**
 * Bounding box
 */
export interface BoundingBox {
  top: number;
  left: number;
  width: number;
  height: number;
  right: number;
  bottom: number;
}

/**
 * Element positioning
 */
export interface ElementPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  corner: CornerPosition;
  offset: CoordinatePoint;
}

/**
 * Pane coordinates
 */
export interface PaneCoordinates {
  paneId: number;
  x: number;
  y: number;
  width: number;
  height: number;
  absoluteX: number;
  absoluteY: number;
  contentArea: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
  margins: {
    top: number;
    left: number;
    right: number;
    bottom: number;
  };
  isMainPane: boolean;
  isLastPane: boolean;
}

// =============================================================================
// EVENT AND CALLBACK INTERFACES
// =============================================================================

/**
 * Crosshair event data
 */
export interface CrosshairEventData {
  time: UTCTimestamp | null;
  point: CoordinatePoint | null;
  seriesData: Map<ExtendedSeriesApi, SeriesDataPoint | null>;
}

/**
 * Chart click event data
 */
export interface ChartClickEventData {
  time: UTCTimestamp | null;
  point: CoordinatePoint | null;
  seriesData: Map<ExtendedSeriesApi, SeriesDataPoint | null>;
}

/**
 * Series configuration change event
 */
export interface SeriesConfigChangeEvent {
  seriesId: string;
  paneId: number;
  config: Record<string, unknown>;
  field: string;
  oldValue: unknown;
  newValue: unknown;
}

/**
 * Pane collapse event
 */
export interface PaneCollapseEvent {
  paneId: number;
  isCollapsed: boolean;
  trigger: 'user' | 'api';
}

// =============================================================================
// CONFIGURATION INTERFACES
// =============================================================================

/**
 * Series options configuration
 */
export interface SeriesOptionsConfig {
  title?: string;
  visible?: boolean;
  lastValueVisible?: boolean;
  priceLineVisible?: boolean;
  priceLineSource?: 'lastBar' | 'lastVisible';
  priceLineWidth?: number;
  priceLineColor?: string;
  priceLineStyle?: number;
  baseLineVisible?: boolean;
  baseLineColor?: string;
  baseLineWidth?: number;
  baseLineStyle?: number;
  // Price scale configuration
  priceScaleId?: string;
  priceFormat?: {
    type?: string;
    precision?: number;
    minMove?: number;
  };
  scaleMargins?: {
    top?: number;
    bottom?: number;
  };
  // Line-specific options
  lineColor?: string;
  lineStyle?: number;
  lineWidth?: number;
  lineType?: number;
  lineVisible?: boolean;
  pointMarkersVisible?: boolean;
  // Allow additional properties for flexibility
  [key: string]: unknown;
  pointMarkersRadius?: number;
  crosshairMarkerVisible?: boolean;
  crosshairMarkerRadius?: number;
  crosshairMarkerBorderColor?: string;
  crosshairMarkerBackgroundColor?: string;
  crosshairMarkerBorderWidth?: number;
  // Area-specific options
  topColor?: string;
  bottomColor?: string;
  invertFilledArea?: boolean;
  // Histogram-specific options
  color?: string;
  base?: number;
  // Candlestick-specific options
  upColor?: string;
  downColor?: string;
  thinBars?: boolean;
  borderVisible?: boolean;
  wickVisible?: boolean;
}

/**
 * Chart layout configuration
 */
export interface ChartLayoutConfig {
  backgroundColor?: string;
  textColor?: string;
  fontSize?: number;
  fontFamily?: string;
  attributionLogo?: boolean;
}

/**
 * Price scale configuration
 */
export interface PriceScaleConfig {
  position?: 'left' | 'right' | 'none';
  mode?: number;
  autoScale?: boolean;
  invertScale?: boolean;
  alignLabels?: boolean;
  borderVisible?: boolean;
  borderColor?: string;
  entireTextOnly?: boolean;
  visible?: boolean;
  ticksVisible?: boolean;
  scaleMargins?: {
    top?: number;
    bottom?: number;
  };
  // Allow additional properties for flexibility
  [key: string]: unknown;
}

/**
 * Time scale configuration
 */
export interface TimeScaleConfig {
  rightOffset?: number;
  barSpacing?: number;
  minBarSpacing?: number;
  fixLeftEdge?: boolean;
  fixRightEdge?: boolean;
  lockVisibleTimeRangeOnResize?: boolean;
  rightBarStaysOnScroll?: boolean;
  borderVisible?: boolean;
  borderColor?: string;
  visible?: boolean;
  timeVisible?: boolean;
  secondsVisible?: boolean;
  shiftVisibleRangeOnNewBar?: boolean;
  tickMarkFormatter?: (_time: UTCTimestamp, _tickMarkType: number, _locale: string) => string;
}

// =============================================================================
// WINDOW EXTENSIONS
// =============================================================================

/**
 * Global window extensions for chart management
 */
declare global {
  interface Window {
    chartInstances?: Record<string, ExtendedChartApi>;
    chartApiMap?: Record<string, ExtendedChartApi>;
    chartGroupMap?: Record<string, number>;
    seriesRefsMap?: Record<string, ExtendedSeriesApi[]>;
    paneWrappers?: Record<string, Record<string, unknown>>;
    paneButtonPanelWidgets?: Record<string, unknown[]>;
    chartResizeObservers?: Record<string, ResizeObserver>;
    paneLegendManagers?: Record<string, Record<number, unknown>>;
    chartPlugins?: Map<string, unknown>;
  }
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

/**
 * Make all properties optional recursively
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Extract function parameter types
 */
export type ParameterType<T> = T extends (..._args: infer P) => any ? P : never;

/**
 * Extract function return type
 */
export type ReturnType<T> = T extends (..._args: any[]) => infer R ? R : never;

/**
 * Non-nullable type utility
 */
export type NonNullable<T> = T extends null | undefined ? never : T;

/**
 * Value of a record/object
 */
export type ValueOf<T> = T[keyof T];
