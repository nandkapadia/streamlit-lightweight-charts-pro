/**
 * @fileoverview Type exports for lightweight-charts-pro-core
 */

// Export coordinate types (preferred source for BoundingBox, ElementPosition, PaneCoordinates)
export * from './coordinates';

// Export layout types (including new trade and widget types)
export * from './layout';

// Export series types
export * from './SeriesTypes';

// Export from ChartInterfaces (excluding types already exported from coordinates)
export type {
  PendingTradeRectangle,
  PendingRectangleBatch,
  ExtendedChartApi,
  ExtendedSeriesApi,
  BaseDataPoint,
  OHLCDataPoint,
  LineDataPoint,
  HistogramDataPoint,
  BaselineDataPoint,
  BandDataPoint,
  SeriesDataPoint,
  TradeData,
  RectangleConfig,
  ShapeData,
  TemplateFormatting,
  TemplateContext,
  LegendData,
  CornerPosition,
  ButtonConfig,
  CoordinatePoint,
  Annotation,
  AnnotationText,
  AnnotationLayer,
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
  PriceScaleConfig,
  TimeScaleConfig,
  DeepPartial,
  ParameterType,
  FunctionReturnType,
  NonNullable,
  ValueOf,
} from './ChartInterfaces';

// Export series factory types
export * from './seriesFactory';

// Export global types
export type { LegendManager } from './global';
