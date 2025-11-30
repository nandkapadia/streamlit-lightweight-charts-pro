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

// ============================================================================
// Managers
// ============================================================================

export { ChartManager, type ChartManagerConfig } from './managers';

// ============================================================================
// Services
// ============================================================================

export {
  ChartCoordinateService,
  TemplateEngine,
  PrimitiveEventManager,
  CornerLayoutManager,
  TradeTemplateProcessor,
  PaneCollapseManager,
  SeriesDialogManager,
  createTradeVisualElements,
  type TemplateResult,
  type TemplateOptions,
  type EventSubscription,
  type PrimitiveEventTypes,
  type TradeTemplateData,
  type PaneCollapseState,
  type PaneCollapseConfig,
  type SeriesInfo,
  type DialogState,
  type SeriesDialogConfig,
} from './services';

// ============================================================================
// Configuration
// ============================================================================

export {
  MARGINS,
  DIMENSIONS,
  FALLBACKS,
  Z_INDEX,
  TIMING,
  CSS_CLASSES,
  getMargins,
  getDimensions,
  getFallback,
  validateConfiguration,
} from './config/positioningConfig';

// ============================================================================
// Dialogs
// ============================================================================

export {
  // Base Dialog
  BaseDialog,

  // Specific Dialogs
  ColorPickerDialog,
  LineEditorDialog,
  SeriesSettingsDialog,
  SeriesSettingsRenderer,

  // State Management
  FormStateManager,
  TabManager,
} from './dialogs';

// ============================================================================
// Buttons
// ============================================================================

export {
  // Base Button
  BaseButton,
  type BaseButtonConfig,
  type ButtonState,
  type ButtonStyling,
  DEFAULT_BUTTON_STYLING,

  // Button Types
  CollapseButton,
  SeriesSettingsButton,

  // Button Registry
  ButtonRegistry,
} from './components/buttons';

// ============================================================================
// Primitives
// ============================================================================

export {
  // Base Primitives
  BasePanePrimitive,
  PrimitivePriority,
  BaseSeriesPrimitive,

  // Series Primitives
  BandPrimitive,
  RibbonPrimitive,
  TrendFillPrimitive,
  GradientRibbonPrimitive,
  SignalPrimitive,

  // UI Primitives
  // ButtonPanelPrimitive - excluded (requires React and Streamlit dependencies)
  LegendPrimitive,
  type LegendPrimitiveConfig,

  // Feature Primitives
  TradeRectanglePrimitive,
  RangeSwitcherPrimitive,
  DefaultRangeConfigs,
  TimeRange,
  type RangeConfig,
  type RangeSwitcherPrimitiveConfig,

  // Utilities - Note: PrimitiveDefaults is exported as individual constants
  PrimitiveStylingUtils,

  // Primitive defaults (exported individually)
  TimeRangeSeconds,
  UniversalSpacing,
  ButtonDimensions,
  ButtonSpacing,
  ButtonColors,
  ButtonEffects,
  LegendDimensions,
  LayoutSpacing,
  LegendColors,
  RangeSwitcherLayout,
  FormatDefaults,
  ContainerDefaults,
  CommonValues,
  AnimationTiming,
  DefaultButtonConfig,
  DefaultLegendConfig,
  DefaultRangeSwitcherConfig,
  DefaultContainerConfig,
} from './primitives';

// ============================================================================
// Series Infrastructure
// ============================================================================

export {
  // Core Types
  type UnifiedSeriesDescriptor,

  // Property Mapping (exported as PropertyMapper, not UnifiedPropertyMapper)
  PropertyMapper,
  apiOptionsToDialogConfig,
  dialogConfigToApiOptions,
  LINE_STYLE_TO_STRING,
  STRING_TO_LINE_STYLE,

  // Series Factory (exported as SeriesFactory, not UnifiedSeriesFactory)
  SeriesFactory,
  createSeries,
  createSeriesWithConfig,
  getSeriesDescriptor,
  getDefaultOptions,
  isCustomSeries,
  getAvailableSeriesTypes,
  updateSeriesData,
  updateSeriesMarkers,
  updateSeriesOptions,
  type ExtendedSeriesConfig,
  type ExtendedSeriesApi,

  // Utilities (exported as normalizeSeriesType, not seriesTypeNormalizer)
  normalizeSeriesType,

  // Descriptors (exported with correct names)
  CUSTOM_SERIES_DESCRIPTORS,
  BUILTIN_SERIES_DESCRIPTORS,
} from './series';

// ============================================================================
// Chart Plugins
// ============================================================================

export {
  TooltipManager,
  TooltipPlugin,
} from './plugins/chart';

// ============================================================================
// Overlay Plugins
// ============================================================================

export {
  RectangleOverlayPlugin,
  // RectangleConfig already exported from './plugins/shared/rendering'
} from './plugins/overlay';

// ============================================================================
// Type Definitions
// ============================================================================

export type {
  // Coordinate types
  BoundingBox,
  ElementPosition,
  PaneCoordinates,

  // Layout types
  Corner,
  Position,
  IPositionableWidget,
  WidgetDimensions,
  TradeVisualizationOptions,

  // Series types
  SeriesConfiguration,
  SeriesType,

  // Chart interface types
  PendingTradeRectangle,
  PendingRectangleBatch,
  ExtendedChartApi,
  BaseDataPoint,
  OHLCDataPoint,
  LineDataPoint,
  HistogramDataPoint,
  BaselineDataPoint,
  BandDataPoint,
  TradeData,
  ShapeData,
  TemplateFormatting,
  TemplateContext,
  LegendData,
  CornerPosition,
  ButtonConfig,
  Annotation,
  AnnotationLayers,
  MarkerData,
  PrimitiveData,
  Destroyable,
  PluginConfig,
  WidgetConfig,
  MouseEventParams,
  CrosshairEventData,
  ChartClickEventData,
  SeriesConfigChangeEvent,
  PaneCollapseEvent,
  SeriesOptionsConfig,
  ChartLayoutConfig,
  TimeScaleConfig,
  DeepPartial,
  ParameterType,
  FunctionReturnType,
  NonNullable,
  ValueOf,

  // Series factory types
  LegendManager,
  PriceLineConfig,
  LegendConfig,
  NestedSeriesOptions,
  FlattenedSeriesOptions,
} from './types';

// ============================================================================
// Utilities
// ============================================================================

export {
  // Logger
  logger,

  // Singleton utilities
  SingletonBase,
  Singleton,
  createSingleton,
  KeyedSingletonManager,

  // Chart utilities
  ChartReadyDetector,
  ResizeObserverManager,

  // Event handling
  EventEmitter,
} from './utils';
