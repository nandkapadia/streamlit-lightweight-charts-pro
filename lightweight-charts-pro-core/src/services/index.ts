/**
 * @fileoverview Service exports for lightweight-charts-pro-core
 */

export { ChartCoordinateService } from './ChartCoordinateService';
export { TemplateEngine, type TemplateResult, type TemplateOptions } from './TemplateEngine';
export { PrimitiveEventManager, type EventSubscription, type PrimitiveEventTypes } from './PrimitiveEventManager';
export { CornerLayoutManager } from './CornerLayoutManager';
export { TradeTemplateProcessor, type TradeTemplateData } from './TradeTemplateProcessor';
export { PaneCollapseManager, type PaneCollapseState, type PaneCollapseConfig } from './PaneCollapseManager';
export {
  type BackendSyncAdapter,
  type ConfigChangeEvent,
  NoOpBackendSyncAdapter,
  InMemoryBackendSyncAdapter,
} from './BackendSyncAdapter';
export {
  SeriesDialogManager,
  type SeriesInfo,
  type DialogState,
  type SeriesDialogConfig,
} from './SeriesDialogManager';
export * from './tradeVisualization';
