/**
 * @fileoverview Plugin exports for lightweight-charts-pro-core
 *
 * This module exports all custom series plugins:
 * - BandSeries: Three lines (upper, middle, lower) with fills
 * - RibbonSeries: Two lines (upper, lower) with fill
 * - GradientRibbonSeries: Two lines with gradient fill
 * - SignalSeries: Vertical background bands
 * - TrendFillSeries: Direction-based fills
 */

// Shared rendering utilities
export * from './shared';

// Band Series
export {
  BandSeries,
  BandSeriesPlugin,
  type BandData,
  type BandSeriesOptions,
  defaultBandOptions,
} from './band';

// Ribbon Series
export {
  RibbonSeries,
  RibbonSeriesPlugin,
  type RibbonData,
  type RibbonSeriesOptions,
  defaultRibbonOptions,
} from './ribbon';

// Gradient Ribbon Series
export {
  GradientRibbonSeries,
  GradientRibbonSeriesPlugin,
  type GradientRibbonData,
  type GradientRibbonSeriesOptions,
  defaultGradientRibbonOptions,
} from './gradient-ribbon';

// Signal Series
export {
  SignalSeries,
  SignalSeriesPlugin,
  type SignalData,
  type SignalSeriesOptions,
  defaultSignalOptions,
} from './signal';

// Trend Fill Series
export {
  TrendFillSeries,
  TrendFillSeriesPlugin,
  type TrendFillData,
  type TrendFillSeriesOptions,
  defaultTrendFillOptions,
} from './trend-fill';
