/**
 * @fileoverview Services module - Framework-agnostic chart services
 *
 * Exports all service classes for chart management, coordinate systems,
 * layout, primitives, and visualization systems.
 */

// Chart management services
export { ChartCoordinateService } from './ChartCoordinateService';
export { CornerLayoutManager } from './CornerLayoutManager';
export { PaneCollapseManager } from './PaneCollapseManager';
export { PrimitiveEventManager } from './PrimitiveEventManager';
// Note: ChartPrimitiveManager and SeriesDialogManager require React and are in the React frontend package

// Template and processing services
export { TemplateEngine } from './TemplateEngine';
export { TradeTemplateProcessor } from './TradeTemplateProcessor';

// Visualization systems
export * from './annotationSystem';
export * from './tradeVisualization';
