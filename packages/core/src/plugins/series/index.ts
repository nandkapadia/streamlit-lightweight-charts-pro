/**
 * @fileoverview Custom series plugins - Band, Ribbon, Signal, TrendFill
 *
 * Exports all custom series implementations for TradingView Lightweight Charts.
 */

// Band series (3 lines with fills)
export { createBandSeries } from './bandSeriesPlugin';
export type { BandData, BandSeriesOptions } from './bandSeriesPlugin';

// Ribbon series (2 lines with fill)
export { createRibbonSeries } from './ribbonSeriesPlugin';
export type { RibbonData, RibbonSeriesOptions } from './ribbonSeriesPlugin';

// Gradient ribbon series (2 lines with gradient fill)
export { createGradientRibbonSeries } from './gradientRibbonSeriesPlugin';
export type { GradientRibbonData, GradientRibbonSeriesOptions } from './gradientRibbonSeriesPlugin';

// Signal series (vertical bands)
export {
  SignalSeries,
  SignalSeriesPlugin,
  createSignalSeries,
  createSignalSeriesPlugin,
  defaultSignalOptions,
} from './signalSeriesPlugin';
export type { SignalData, SignalSeriesOptions } from './signalSeriesPlugin';

// Trend fill series (directional fill)
export { createTrendFillSeries } from './trendFillSeriesPlugin';
export type { TrendFillData, TrendFillSeriesOptions } from './trendFillSeriesPlugin';

// Common rendering utilities
export * from './base';
