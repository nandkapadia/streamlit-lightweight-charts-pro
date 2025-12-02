/**
 * @fileoverview Lightweight Charts Pro Core
 *
 * Framework-agnostic core library for TradingView Lightweight Charts.
 * Provides custom series plugins, UI primitives, services, and utilities.
 *
 * @packageDocumentation
 */

// =============================================================================
// PLUGINS - Custom series and chart plugins
// =============================================================================

// Series plugins
export {
  createBandSeries,
  createRibbonSeries,
  createGradientRibbonSeries,
  SignalSeries,
  SignalSeriesPlugin,
  createSignalSeries,
  createSignalSeriesPlugin,
  defaultSignalOptions,
  createTrendFillSeries,
} from './plugins/series';
export type {
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
} from './plugins/series';

// Chart plugins
export { TooltipManager, TooltipPlugin } from './plugins/chart';

// Overlay plugins
export { RectangleOverlayPlugin } from './plugins/overlay';

// =============================================================================
// PRIMITIVES - UI primitive components
// =============================================================================

export {
  BasePanePrimitive,
  BaseSeriesPrimitive,
  LegendPrimitive,
  createLegendPrimitive,
  DefaultLegendConfigs,
  RangeSwitcherPrimitive,
  createRangeSwitcherPrimitive,
  DefaultRangeConfigs,
  TimeRange,
  TradeRectanglePrimitive,
  BandPrimitive,
  RibbonPrimitive,
  GradientRibbonPrimitive,
  SignalPrimitive,
  TrendFillPrimitive,
  PrimitiveStylingUtils,
  UniversalSpacing,
  ButtonDimensions,
  PrimitivePriority,
} from './primitives';
export type { BasePrimitiveConfig } from './primitives';

// =============================================================================
// SERIES - Unified series factory and descriptors
// =============================================================================

export {
  SeriesFactory,
  SeriesCreationError,
  getSeriesDescriptor,
  getAvailableSeriesTypes,
  isCustomSeries,
  createSeries,
  getDefaultOptions,
  registerSeriesDescriptor,
  unregisterSeriesDescriptor,
  getSeriesDescriptorsByCategory,
  createSeriesWithConfig,
  updateSeriesData,
  updateSeriesMarkers,
  updateSeriesOptions,
  PropertyMapper,
} from './series';
export type { ExtendedSeriesConfig, ExtendedSeriesApi } from './series';

// =============================================================================
// SERVICES - Chart management services
// =============================================================================

export {
  ChartCoordinateService,
  CornerLayoutManager,
  PaneCollapseManager,
  PrimitiveEventManager,
  TemplateEngine,
  TradeTemplateProcessor,
  createAnnotationVisualElements,
  createTradeVisualElements,
} from './services';

// =============================================================================
// TYPES - Shared type definitions
// =============================================================================

// Export from types index which handles duplicate resolution
export * from './types';

// =============================================================================
// CONFIG - Configuration utilities
// =============================================================================

export * from './config';

// =============================================================================
// UTILS - Utility functions (selective to avoid duplicates)
// =============================================================================

export {
  KeyedSingletonManager,
  SingletonBase,
  Singleton,
  createSingleton,
  ChartReadyDetector,
  logger,
  LogLevel,
  chartLog,
  primitiveLog,
  perfLog,
  ResizeObserverManager,
} from './utils';

// Export utility functions
export * from './utils/lightweightChartsUtils';
export * from './utils/colorUtils';
export * from './utils/signalColorUtils';
export {
  validateChartCoordinates,
  validateScaleDimensions,
  validatePaneCoordinates,
  validateBoundingBox,
  sanitizeCoordinates,
  createBoundingBox,
  areCoordinatesStale,
  logValidationResult,
  getCoordinateDebugInfo,
} from './utils/coordinateValidation';
// dataValidation - exclude ValidationResult (already in types/coordinates)
export {
  validateData,
  validateDataArray,
  filterValidData,
  ValidationConfigs,
  QuickValidators,
} from './utils/dataValidation';
export type { ValidationConfig } from './utils/dataValidation';
export * from './utils/lineStyle';
export * from './utils/errorHandler';

// Performance utilities - exclude debounce (already in colorUtils)
export {
  perfLogFn,
  deepCompare,
  getCachedDOMElement,
  throttle,
  memoize,
  batchDOMUpdates,
  getCachedDimensions,
  createOptimizedStylesAdvanced,
} from './utils/performance';
