/**
 * @fileoverview Types module - Shared type definitions
 *
 * Exports all shared type definitions for chart interfaces,
 * series types, coordinates, and layout configurations.
 */

// Coordinates - canonical source for coordinate types
export * from './coordinates';

// Layout types
export * from './layout';

// Series types
export * from './SeriesTypes';

// Chart interfaces - selective export to avoid duplicates
// The duplicated types (BoundingBox, ElementPosition, PaneCoordinates) are
// exported from coordinates.ts which is the canonical source
export type {
  // Extended APIs
  ExtendedChartApi,
  ExtendedSeriesApi,

  // Data point types
  BaseDataPoint,
  OHLCDataPoint,
  LineDataPoint,
  HistogramDataPoint,
  BaselineDataPoint,
  BandDataPoint,
  SeriesDataPoint,

  // Trade types
  TradeData,
  PendingTradeRectangle,
  PendingRectangleBatch,

  // Shape and config types
  ShapeData,
  TemplateFormatting,
  TemplateContext,

  // Legend types
  LegendData,
  CornerPosition,

  // Button types
  ButtonConfig,

  // Coordinate types (use from coordinates.ts instead for canonical)
  CoordinatePoint,

  // Annotation types
  Annotation,
  AnnotationLayers,
  AnnotationLayer,
  AnnotationText,

  // Marker and primitive types
  MarkerData,
  PrimitiveData,
  Destroyable,

  // Plugin and widget types
  PluginConfig,
  WidgetConfig,

  // Series config change event
  SeriesConfigChangeEvent,

  // Trade types
  TradeConfig,
  TradeVisualizationOptions,
} from './ChartInterfaces';
