/**
 * @fileoverview Main entry point for lightweight-charts-pro-core
 *
 * This package provides framework-agnostic chart plugins and utilities
 * for TradingView's Lightweight Charts library.
 *
 * Features:
 * - Custom series plugins (Band, Ribbon, GradientRibbon, Signal, TrendFill)
 * - Shared rendering utilities
 * - Color manipulation utilities
 * - Signal color calculations
 *
 * @example
 * ```typescript
 * import { BandSeriesPlugin, RibbonSeriesPlugin } from 'lightweight-charts-pro-core';
 * import { createChart } from 'lightweight-charts';
 *
 * const chart = createChart(container);
 * const bandSeries = chart.addCustomSeries(BandSeriesPlugin(), {
 *   upperLineColor: '#4CAF50',
 *   middleLineColor: '#2196F3',
 *   lowerLineColor: '#F44336',
 * });
 * ```
 */

// ============================================================================
// Custom Series Plugins
// ============================================================================

// Band Series - Three lines with fills
export {
  BandSeries,
  BandSeriesPlugin,
  type BandData,
  type BandSeriesOptions,
  defaultBandOptions,
} from './plugins/band';

// Ribbon Series - Two lines with fill
export {
  RibbonSeries,
  RibbonSeriesPlugin,
  createRibbonSeries,
  type RibbonData,
  type RibbonSeriesOptions,
  defaultRibbonOptions,
} from './plugins/ribbon';

// Gradient Ribbon Series - Two lines with gradient fill
export {
  GradientRibbonSeries,
  GradientRibbonSeriesPlugin,
  createGradientRibbonSeries,
  type GradientRibbonData,
  type GradientRibbonSeriesOptions,
  defaultGradientRibbonOptions,
} from './plugins/gradient-ribbon';

// Signal Series - Vertical background bands
export {
  SignalSeries,
  SignalSeriesPlugin,
  createSignalSeries,
  type SignalData,
  type SignalSeriesOptions,
  defaultSignalOptions,
} from './plugins/signal';

// Trend Fill Series - Direction-based fills
export {
  TrendFillSeries,
  TrendFillSeriesPlugin,
  createTrendFillSeries,
  type TrendFillData,
  type TrendFillSeriesOptions,
  defaultTrendFillOptions,
} from './plugins/trend-fill';

// ============================================================================
// Shared Rendering Utilities
// ============================================================================

export {
  // Line Style
  LineStyle,

  // Coordinate Types
  type CoordinatePoint,
  type MultiCoordinatePoint,
  type RendererDataPoint,
  type RenderPoint,
  type ColoredRenderPoint,
  type VisibleRange,

  // Coordinate Functions
  timeToCoordinate,
  priceToCoordinate,
  isValidCoordinate,
  isValidRenderPoint,
  filterValidRenderPoints,
  convertToCoordinates,
  getBarSpacing,

  // Line Drawing
  drawLine,
  drawMultiLine,

  // Fill Area
  drawFillArea,
  createFillPath,

  // Gradients
  createHorizontalGradient,

  // Line Style Configuration
  type LineStyleConfig,
  applyLineDashPattern,
  applyLineStyle,

  // Canvas State
  withSavedState,

  // Rectangle Drawing
  type RectangleConfig,
  drawRectangle,
  fillVerticalBand,

  // Whitespace Detection
  isWhitespaceDataMultiField,
} from './plugins/shared/rendering';

// ============================================================================
// Color Utilities
// ============================================================================

export {
  // Types
  type RgbaColor,

  // Parsing
  parseHexColor,
  parseCssColor,

  // Conversion
  hexToRgbaString,
  hexToRgba,
  rgbaToHex,
  cssToHex,

  // Interpolation
  interpolateColor,
  calculateGradientColor,

  // Validation
  isTransparent,
  isValidHexColor,
  sanitizeHexColor,

  // Utilities
  getContrastColor,
  getSolidColorFromFill,
  clamp,
} from './utils/colors';

// ============================================================================
// Signal Color Utilities
// ============================================================================

export {
  type SignalColorOptions,
  SignalColorCalculator,
} from './utils/signalColors';
