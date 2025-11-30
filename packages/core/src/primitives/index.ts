/**
 * @fileoverview Primitives module - UI primitive components for chart overlays
 *
 * Exports all primitive classes and utilities for creating chart UI elements
 * like legends, buttons, range switchers, and custom series primitives.
 */

// Base primitives
export { BasePanePrimitive } from './BasePanePrimitive';
export type { BasePrimitiveConfig, PrimitivePriority } from './BasePanePrimitive';
export { BaseSeriesPrimitive } from './BaseSeriesPrimitive';

// UI primitives
export { LegendPrimitive, createLegendPrimitive, DefaultLegendConfigs } from './LegendPrimitive';
export { RangeSwitcherPrimitive, createRangeSwitcherPrimitive } from './RangeSwitcherPrimitive';
export { TradeRectanglePrimitive } from './TradeRectanglePrimitive';
// Note: ButtonPanelPrimitive requires React and is in the React frontend package

// Custom series primitives
export { BandPrimitive } from './BandPrimitive';
export { RibbonPrimitive } from './RibbonPrimitive';
export { GradientRibbonPrimitive } from './GradientRibbonPrimitive';
export { SignalPrimitive } from './SignalPrimitive';
export { TrendFillPrimitive } from './TrendFillPrimitive';

// Primitive utilities
export { PrimitiveStylingUtils } from './PrimitiveStylingUtils';
export type { BaseStyleConfig, TypographyConfig, BorderConfig } from './PrimitiveStylingUtils';
export * from './PrimitiveDefaults';
