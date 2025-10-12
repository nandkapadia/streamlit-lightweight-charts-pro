/**
 * @fileoverview Main Type Definitions
 *
 * Central type definitions for the Streamlit Lightweight Charts component.
 * Provides comprehensive type coverage for all chart, series, and configuration options.
 *
 * This module provides:
 * - Component configuration types
 * - Chart and pane configuration
 * - Series configuration and data types
 * - Trade visualization types
 * - Annotation system types
 * - Sync and layout types
 *
 * Features:
 * - Complete type safety for all chart features
 * - Backward compatibility with legacy options
 * - Flexible configuration structures
 * - Support for all series types and custom series
 *
 * @example
 * ```typescript
 * import { ComponentConfig, ChartConfig, SeriesConfig } from './types';
 *
 * const config: ComponentConfig = {
 *   charts: [{
 *     id: 'chart-1',
 *     chart: { height: 400 },
 *     series: [{
 *       type: 'Line',
 *       data: [{ time: '2024-01-01', value: 100 }]
 *     }]
 *   }]
 * };
 * ```
 */

import { Time, SeriesMarker } from 'lightweight-charts';
import {
  SeriesDataPoint,
  SeriesOptionsConfig,
  PriceScaleConfig,
  LegendData,
} from './types/ChartInterfaces';

// Range Switcher Configuration
// Import the improved RangeConfig and TimeRange from RangeSwitcherPrimitive
import type { RangeConfig as ImportedRangeConfig } from './primitives/RangeSwitcherPrimitive';

// Enhanced Trade Configuration - Core fields only
export interface TradeConfig {
  // Core fields required for trade visualization
  entryTime: string | number;
  entryPrice: number;
  exitTime: string | number;
  exitPrice: number;
  isProfitable: boolean;
  id: string; // Required for trade identification
  pnl?: number; // Calculated or provided
  pnlPercentage?: number; // Calculated or provided

  // All other data accessible via flexible properties for template access
  [key: string]: any; // Allow any additional properties for template access
}

// Trade Visualization Options
export interface TradeVisualizationOptions {
  style: 'markers' | 'rectangles' | 'both' | 'lines' | 'arrows' | 'zones';

  // Marker options
  entryMarkerColorLong?: string;
  entryMarkerColorShort?: string;
  exitMarkerColorProfit?: string;
  exitMarkerColorLoss?: string;
  markerSize?: number;
  showPnlInMarkers?: boolean;

  // Marker template options
  entryMarkerTemplate?: string; // Custom HTML template for entry markers
  exitMarkerTemplate?: string; // Custom HTML template for exit markers
  entryMarkerShape?: 'arrowUp' | 'arrowDown' | 'circle' | 'square';
  exitMarkerShape?: 'arrowUp' | 'arrowDown' | 'circle' | 'square';
  entryMarkerPosition?: 'belowBar' | 'aboveBar';
  exitMarkerPosition?: 'belowBar' | 'aboveBar';
  showMarkerText?: boolean;

  // Rectangle options
  rectangleFillOpacity?: number;
  rectangleBorderWidth?: number;
  rectangleColorProfit?: string;
  rectangleColorLoss?: string;
  rectangleShowText?: boolean;
  rectangleTextPosition?: 'inside' | 'above' | 'below';
  rectangleTextFontSize?: number;
  rectangleTextColor?: string;
  rectangleTextBackground?: string;
  tooltipTemplate?: string;
  markerTemplate?: string;

  // Line options
  lineWidth?: number;
  lineStyle?: string;
  lineColorProfit?: string;
  lineColorLoss?: string;

  // Arrow options
  arrowSize?: number;
  arrowColorProfit?: string;
  arrowColorLoss?: string;

  // Zone options
  zoneOpacity?: number;
  zoneColorLong?: string;
  zoneColorShort?: string;
  zoneExtendBars?: number;

  // Annotation options
  showTradeId?: boolean;
  showQuantity?: boolean;
  showTradeType?: boolean;
  showAnnotations?: boolean;
  annotationFontSize?: number;
  annotationBackground?: string;
}

// Annotation System
export interface Annotation {
  time: string;
  price: number;
  text: string;
  type: 'text' | 'arrow' | 'shape' | 'line' | 'rectangle' | 'circle';
  position: 'above' | 'below' | 'inline';
  color?: string;
  backgroundColor?: string;
  fontSize?: number;
  fontWeight?: string;
  textColor?: string;
  borderColor?: string;
  borderWidth?: number;
  opacity?: number;
  showTime?: boolean;
  tooltip?: string;
  lineStyle?: string; // <-- added for build fix
}

// Properly typed annotation text elements
export interface AnnotationText {
  time: Time;
  price: number;
  text: string;
  color: string;
  backgroundColor: string;
  fontSize: number;
  fontFamily: string;
  position: 'aboveBar' | 'belowBar';
}

// Chart coordinate and layout types
export interface PaneSize {
  width: number;
  height: number;
}

export interface PaneBounds {
  top: number;
  left: number;
  width: number;
  height: number;
  right: number;
  bottom: number;
}

export interface ChartLayoutDimensions {
  container: {
    width: number;
    height: number;
  };
  axis: {
    priceScale: {
      left: {
        width: number;
        height: number;
      };
      right: {
        width: number;
        height: number;
      };
    };
    timeScale: {
      width: number;
      height: number;
    };
  };
}

export interface WidgetPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  isValid: boolean;
}

export interface LayoutWidget {
  id: string;
  width: number;
  height: number;
  position?: WidgetPosition;
  visible?: boolean;
  getDimensions?: () => { width: number; height: number };
  getContainerClassName?: () => string;
}

export interface AnnotationLayer {
  name: string;
  visible: boolean;
  opacity: number;
  annotations: Annotation[];
}

export interface AnnotationManager {
  layers: { [key: string]: AnnotationLayer };
}

// Pane Height Configuration
export interface PaneHeightOptions {
  factor: number;
}

// Button Panel Configuration
export interface ButtonPanelConfig {
  enabled?: boolean; // Defaults to true - set to false to disable
  buttonSize?: number;
  buttonColor?: string;
  buttonHoverColor?: string;
  buttonBackground?: string;
  buttonHoverBackground?: string;
  buttonBorderRadius?: number;
  corner?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'; // Corner position for the button panel
  zIndex?: number; // Z-index for button positioning
  showTooltip?: boolean;
  tooltipText?: {
    collapse?: string;
    expand?: string;
  };
  showCollapseButton?: boolean;
  showSeriesSettingsButton?: boolean;
  legendConfig?: LegendData; // Legend configuration for this pane
  onPaneCollapse?: (_paneId: number, _isCollapsed: boolean) => void;
  onPaneExpand?: (_paneId: number, _isCollapsed: boolean) => void;
  onSeriesConfigChange?: (
    _paneId: number,
    _seriesId: string,
    _config: Record<string, unknown>
  ) => void;
}

// Deprecated: Use ButtonPanelConfig instead
/** @deprecated Use ButtonPanelConfig instead */
export type PaneCollapseConfig = ButtonPanelConfig;

// Signal Series Configuration
export interface SignalData {
  time: string;
  value: number;
}

// Line Options Configuration
export interface LineOptions {
  color?: string;
  lineStyle?: number;
  lineWidth?: number;
  lineType?: number;
  lineVisible?: boolean;
  pointMarkersVisible?: boolean;
  pointMarkersRadius?: number;
  crosshairMarkerVisible?: boolean;
  crosshairMarkerRadius?: number;
  crosshairMarkerBorderColor?: string;
  crosshairMarkerBackgroundColor?: string;
  crosshairMarkerBorderWidth?: number;
  lastPriceAnimation?: number;
}

// Enhanced Series Configuration
export interface SeriesConfig {
  type:
    | 'Area'
    | 'Band'
    | 'Baseline'
    | 'Histogram'
    | 'Line'
    | 'Bar'
    | 'Candlestick'
    | 'signal'
    | 'trend_fill'
    | 'ribbon';
  data: SeriesDataPoint[];
  options?: SeriesOptionsConfig;
  name?: string;
  title?: string; // Add title support for series
  priceScale?: PriceScaleConfig;
  priceScaleId?: string; // Add priceScaleId support for overlay price scales
  lastValueVisible?: boolean; // Add lastValueVisible support for series
  lastPriceAnimation?: number; // Add lastPriceAnimation support for series
  markers?: SeriesMarker<Time>[];
  priceLines?: Array<{
    price: number;
    color?: string;
    lineWidth?: number;
    lineStyle?: number;
    axisLabelVisible?: boolean;
    title?: string;
  }>; // Add price lines to series
  trades?: TradeConfig[]; // Add trades to series
  tradeVisualizationOptions?: TradeVisualizationOptions;
  annotations?: Annotation[]; // Add annotations to series
  shapes?: Array<{
    type: string;
    points: Array<{ time: Time; price: number }>;
    color?: string;
    fillColor?: string;
  }>; // Add shapes support
  tooltip?: TooltipConfig; // Add tooltip configuration
  legend?: LegendData | null; // Add series-level legend support
  paneId?: number; // Add support for multi-pane charts
  // Signal series support
  signalData?: SignalData[];

  // Line options support
  lineOptions?: LineOptions;
  // Line series specific options (for backward compatibility)
  lineStyle?: number;
  line_style?: Record<string, unknown>; // Support for line_style property
  lineType?: number;
  lineVisible?: boolean;
  pointMarkersVisible?: boolean;
  pointMarkersRadius?: number;
  crosshairMarkerVisible?: boolean;
  crosshairMarkerRadius?: number;
  crosshairMarkerBorderColor?: string;
  crosshairMarkerBackgroundColor?: string;
  crosshairMarkerBorderWidth?: number;
  // Area series specific options
  relativeGradient?: boolean;
  invertFilledArea?: boolean;
  // Price line properties
  priceLineVisible?: boolean;
  priceLineSource?: 'lastBar' | 'lastVisible';
  priceLineWidth?: number;
  priceLineColor?: string;
  priceLineStyle?: number;
}

// Chart Position Configuration
export interface ChartPosition {
  x?: number | string; // CSS position: left value (px or %)
  y?: number | string; // CSS position: top value (px or %)
  width?: number | string; // CSS width (px or %)
  height?: number | string; // CSS height (px or %)
  zIndex?: number; // CSS z-index
  position?: 'absolute' | 'relative' | 'fixed' | 'static'; // CSS position type
  display?: 'block' | 'inline-block' | 'flex' | 'grid'; // CSS display type
  margin?: string; // CSS margin shorthand
  padding?: string; // CSS padding shorthand
  border?: string; // CSS border shorthand
  borderRadius?: string; // CSS border-radius
  boxShadow?: string; // CSS box-shadow
  backgroundColor?: string; // CSS background-color
}

// Enhanced Chart Configuration
export interface ChartConfig {
  chart: {
    layout?: {
      backgroundColor?: string;
      textColor?: string;
      fontSize?: number;
      fontFamily?: string;
      paneHeights?: Record<string, PaneHeightOptions>;
    };
    grid?: {
      vertLines?: { color?: string; style?: number; visible?: boolean };
      horzLines?: { color?: string; style?: number; visible?: boolean };
    };
    crosshair?: {
      mode?: number;
      vertLine?: { color?: string; width?: number; style?: number; visible?: boolean };
      horzLine?: { color?: string; width?: number; style?: number; visible?: boolean };
    };
    timeScale?: {
      rightOffset?: number;
      barSpacing?: number;
      minBarSpacing?: number;
      fixLeftEdge?: boolean;
      fixRightEdge?: boolean;
      fitContentOnLoad?: boolean;
      handleDoubleClick?: boolean;
    };
    rightPriceScale?: PriceScaleConfig;
    leftPriceScale?: PriceScaleConfig;
    overlayPriceScales?: Record<string, PriceScaleConfig>;
    localization?: {
      locale?: string;
      priceFormatter?: (_price: number) => string;
      timeFormatter?: (_time: Time) => string;
    };
    handleScroll?: {
      mouseWheel?: boolean;
      pressedMouseMove?: boolean;
      horzTouchDrag?: boolean;
      vertTouchDrag?: boolean;
    };
    handleScale?: {
      axisPressedMouseMove?: {
        time?: boolean;
        price?: boolean;
      };
      axisDoubleClickReset?: {
        time?: boolean;
        price?: boolean;
      };
      mouseWheel?: boolean;
      pinch?: boolean;
    };
    kineticScroll?: {
      mouse?: boolean;
      touch?: boolean;
    };
    trackingMode?: {
      exitMode?: number;
    };
    // Chart dimensions
    width?: number;
    height?: number;
    // Chart behavior
    fitContentOnLoad?: boolean;
    handleDoubleClick?: boolean;
    autoWidth?: boolean;
    autoHeight?: boolean;
    minWidth?: number;
    minHeight?: number;
    maxWidth?: number;
    maxHeight?: number;
    rangeSwitcher?: RangeSwitcherConfig;
  };
  series: SeriesConfig[];
  priceLines?: Array<{
    price: number;
    color?: string;
    lineWidth?: number;
    lineStyle?: number;
    axisLabelVisible?: boolean;
    title?: string;
  }>;
  trades?: TradeConfig[];
  annotations?: Annotation[]; // Add chart-level annotations
  annotationLayers?: AnnotationLayer[]; // Add layer management
  chartId?: string;
  chartGroupId?: number; // Add chart group ID for synchronization
  containerId?: string; // Add containerId for DOM element identification
  chartOptions?: Record<string, unknown>; // Add chartOptions for processed chart configuration
  rangeSwitcher?: RangeSwitcherConfig;
  tooltip?: TooltipConfig; // Add chart-level tooltip configuration
  tooltipConfigs?: Record<string, TooltipConfig>; // Add multiple tooltip configurations
  tradeVisualizationOptions?: TradeVisualizationOptions; // Add chart-level trade visualization options
  paneCollapse?: PaneCollapseConfig; // Add pane collapse/expand functionality
  autoSize?: boolean;
  autoWidth?: boolean;
  autoHeight?: boolean;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  position?: ChartPosition; // Add positioning configuration
  // paneHeights is now accessed from chart.layout.paneHeights
}
export type { RangeConfig } from './primitives/RangeSwitcherPrimitive';
export { TimeRange } from './primitives/RangeSwitcherPrimitive';

export interface RangeSwitcherConfig {
  ranges: ImportedRangeConfig[];
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  visible: boolean;
  defaultRange?: string;
  interval?: string; // Data interval (e.g., '1m', '5m', '1h', '1d') for accurate range calculations
}

// Legend Configuration
export interface LegendConfig {
  visible?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  symbolName?: string;
  textColor?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  padding?: number;
  margin?: number;
  zIndex?: number;
  priceFormat?: string;
  text?: string;
  width?: number;
  height?: number;
  showValues?: boolean;
  valueFormat?: string;
  updateOnCrosshair?: boolean;
}

// Sync Configuration
export interface SyncConfig {
  enabled: boolean;
  crosshair: boolean;
  timeRange: boolean;
  click?: boolean; // Click synchronization support
  groups?: { [groupId: string]: SyncConfig }; // Group-specific sync configurations
}

// Component Configuration
export interface ComponentConfig {
  charts: ChartConfig[];
  syncConfig?: SyncConfig;
  sync?: SyncConfig; // Allow sync as alias for syncConfig in tests
  callbacks?: string[];
}

// Modular Tooltip System
export interface TooltipField {
  label: string;
  valueKey: string;
  formatter?: (_value: unknown) => string;
  color?: string;
  fontSize?: number;
  fontWeight?: string;
}

export interface TooltipConfig {
  enabled: boolean;
  type: 'ohlc' | 'single' | 'multi' | 'custom';
  fields: TooltipField[];
  position?: 'cursor' | 'fixed' | 'auto';
  offset?: { x: number; y: number };
  style?: {
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
    borderRadius?: number;
    padding?: number;
    fontSize?: number;
    fontFamily?: string;
    color?: string;
    boxShadow?: string;
    zIndex?: number;
  };
  showDate?: boolean;
  dateFormat?: string;
  showTime?: boolean;
  timeFormat?: string;
}

// Extend Window interface for chart plugins
declare global {
  interface Window {
    chartPlugins?: Map<string, unknown>;
  }
}
