/**
 * @fileoverview Primitive exports for lightweight-charts-pro-core
 *
 * Primitives are low-level drawing components that attach to series
 * and provide custom rendering on the chart pane.
 */

// Base Primitives
export { BasePanePrimitive, PrimitivePriority, type BasePrimitiveConfig } from './BasePanePrimitive';
export { BaseSeriesPrimitive } from './BaseSeriesPrimitive';

// Series Primitives
export { BandPrimitive } from './BandPrimitive';
export { RibbonPrimitive } from './RibbonPrimitive';
export { TrendFillPrimitive } from './TrendFillPrimitive';
export { GradientRibbonPrimitive } from './GradientRibbonPrimitive';
export { SignalPrimitive } from './SignalPrimitive';

// UI Primitives
// NOTE: ButtonPanelPrimitive excluded - requires React and Streamlit dependencies
// export { ButtonPanelPrimitive } from './ButtonPanelPrimitive';
export { LegendPrimitive, type LegendPrimitiveConfig } from './LegendPrimitive';

// Feature Primitives
export { TradeRectanglePrimitive } from './TradeRectanglePrimitive';
export {
  RangeSwitcherPrimitive,
  DefaultRangeConfigs,
  TimeRange,
  type RangeConfig,
  type RangeSwitcherPrimitiveConfig,
} from './RangeSwitcherPrimitive';

// Utilities - Export all constants from PrimitiveDefaults
export * from './PrimitiveDefaults';
export { PrimitiveStylingUtils } from './PrimitiveStylingUtils';
