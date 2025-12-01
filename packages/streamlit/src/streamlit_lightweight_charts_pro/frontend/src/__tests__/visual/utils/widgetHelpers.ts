/**
 * Widget Helper Utilities for Visual Tests
 *
 * Provides factory functions for creating Legend and RangeSwitcher primitives
 * in visual regression tests. Simplifies test setup with sensible defaults.
 *
 * @module visual/utils/widgetHelpers
 */

import { IChartApi, ISeriesApi } from 'lightweight-charts';
import { LegendPrimitive, LegendPrimitiveConfig } from '../../../primitives/LegendPrimitive';
import {
  RangeSwitcherPrimitive,
  RangeSwitcherPrimitiveConfig,
  TimeRange,
  RangeConfig,
} from '../../../primitives/RangeSwitcherPrimitive';
import { PrimitivePriority } from '../../../primitives/BasePanePrimitive';

/**
 * Corner position type for widget placement
 */
export type CornerPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

/**
 * Configuration for creating a Legend primitive
 */
export interface CreateLegendConfig {
  /**
   * Corner position for the legend
   */
  corner: CornerPosition;

  /**
   * Legend text template (supports placeholders like $$value$$, $$open$$, etc.)
   */
  text: string;

  /**
   * Pane ID for pane-specific legends (0 = first pane, 1 = second pane, etc.)
   * undefined = chart-level legend
   */
  paneId?: number;

  /**
   * Custom styling for the legend
   */
  styling?: Partial<LegendPrimitiveConfig['style']>;

  /**
   * Whether this is a pane-specific primitive (vs chart-level)
   * Default: true if paneId is provided, false otherwise
   */
  isPanePrimitive?: boolean;

  /**
   * Value formatting string (e.g., '.2f' for 2 decimal places)
   */
  valueFormat?: string;

  /**
   * Priority for layout stacking (higher values appear first)
   */
  priority?: number;

  /**
   * Whether the legend is visible
   */
  visible?: boolean;
}

/**
 * Configuration for creating a RangeSwitcher primitive
 */
export interface CreateRangeSwitcherConfig {
  /**
   * Corner position for the range switcher
   */
  corner: CornerPosition;

  /**
   * Time ranges to display
   * Can be:
   * - Predefined ranges: '1D', '1W', '1M', etc.
   * - Custom RangeConfig objects
   */
  ranges: (string | RangeConfig)[];

  /**
   * Pane ID for pane-specific range switchers
   * undefined = chart-level range switcher
   */
  paneId?: number;

  /**
   * Custom styling for the range switcher
   */
  styling?: Partial<RangeSwitcherPrimitiveConfig['style']>;

  /**
   * Whether this is a pane-specific primitive (vs chart-level)
   * Default: true if paneId is provided, false otherwise
   */
  isPanePrimitive?: boolean;

  /**
   * Initial active range index
   */
  activeRangeIndex?: number;

  /**
   * Priority for layout stacking (higher values appear first)
   */
  priority?: number;

  /**
   * Whether the range switcher is visible
   */
  visible?: boolean;
}

/**
 * Predefined range configurations for common use cases
 */
export const PredefinedRanges = {
  /**
   * Standard trading ranges (1D, 1W, 1M, 3M, 6M, 1Y, All)
   */
  TRADING: [
    { text: '1D', range: TimeRange.ONE_DAY },
    { text: '1W', range: TimeRange.ONE_WEEK },
    { text: '1M', range: TimeRange.ONE_MONTH },
    { text: '3M', range: TimeRange.THREE_MONTHS },
    { text: '6M', range: TimeRange.SIX_MONTHS },
    { text: '1Y', range: TimeRange.ONE_YEAR },
    { text: 'All', range: TimeRange.ALL },
  ] as RangeConfig[],

  /**
   * Crypto/intraday ranges (5m, 15m, 1H, 4H, 1D, 1W, All)
   */
  CRYPTO: [
    { text: '5m', range: TimeRange.FIVE_MINUTES },
    { text: '15m', range: TimeRange.FIFTEEN_MINUTES },
    { text: '1H', range: TimeRange.ONE_HOUR },
    { text: '4H', range: TimeRange.FOUR_HOURS },
    { text: '1D', range: TimeRange.ONE_DAY },
    { text: '1W', range: TimeRange.ONE_WEEK },
    { text: 'All', range: TimeRange.ALL },
  ] as RangeConfig[],

  /**
   * Long-term investment ranges (1M, 3M, 6M, 1Y, 2Y, 5Y, All)
   */
  LONGTERM: [
    { text: '1M', range: TimeRange.ONE_MONTH },
    { text: '3M', range: TimeRange.THREE_MONTHS },
    { text: '6M', range: TimeRange.SIX_MONTHS },
    { text: '1Y', range: TimeRange.ONE_YEAR },
    { text: '2Y', range: TimeRange.TWO_YEARS },
    { text: '5Y', range: TimeRange.FIVE_YEARS },
    { text: 'All', range: TimeRange.ALL },
  ] as RangeConfig[],

  /**
   * Simple 4-range configuration (1D, 1W, 1M, All)
   */
  SIMPLE: [
    { text: '1D', range: TimeRange.ONE_DAY },
    { text: '1W', range: TimeRange.ONE_WEEK },
    { text: '1M', range: TimeRange.ONE_MONTH },
    { text: 'All', range: TimeRange.ALL },
  ] as RangeConfig[],
};

/**
 * Parse a range string or RangeConfig to a RangeConfig object
 */
function parseRange(range: string | RangeConfig): RangeConfig {
  if (typeof range === 'object') {
    return range;
  }

  // Map common string formats to TimeRange enums
  const rangeMap: Record<string, TimeRange> = {
    '5m': TimeRange.FIVE_MINUTES,
    '15m': TimeRange.FIFTEEN_MINUTES,
    '30m': TimeRange.THIRTY_MINUTES,
    '1h': TimeRange.ONE_HOUR,
    '1H': TimeRange.ONE_HOUR,
    '4h': TimeRange.FOUR_HOURS,
    '4H': TimeRange.FOUR_HOURS,
    '1d': TimeRange.ONE_DAY,
    '1D': TimeRange.ONE_DAY,
    '1w': TimeRange.ONE_WEEK,
    '1W': TimeRange.ONE_WEEK,
    '2w': TimeRange.TWO_WEEKS,
    '2W': TimeRange.TWO_WEEKS,
    '1m': TimeRange.ONE_MONTH,
    '1M': TimeRange.ONE_MONTH,
    '3m': TimeRange.THREE_MONTHS,
    '3M': TimeRange.THREE_MONTHS,
    '6m': TimeRange.SIX_MONTHS,
    '6M': TimeRange.SIX_MONTHS,
    '1y': TimeRange.ONE_YEAR,
    '1Y': TimeRange.ONE_YEAR,
    '2y': TimeRange.TWO_YEARS,
    '2Y': TimeRange.TWO_YEARS,
    '5y': TimeRange.FIVE_YEARS,
    '5Y': TimeRange.FIVE_YEARS,
    all: TimeRange.ALL,
    All: TimeRange.ALL,
    ALL: TimeRange.ALL,
  };

  const timeRange = rangeMap[range];
  if (!timeRange) {
    throw new Error(`Unknown range format: ${range}`);
  }

  return {
    text: range,
    range: timeRange,
  };
}

/**
 * Create a Legend primitive for visual tests
 *
 * @param chart - Chart instance (currently unused but kept for API consistency)
 * @param config - Legend configuration
 * @returns LegendPrimitive instance ready to attach to a pane/series
 *
 * @example
 * ```typescript
 * const legend = createLegend(chart, {
 *   corner: 'top-right',
 *   text: 'Price: $$close$$',
 *   paneId: 0
 * });
 * ```
 */
export function createLegend(chart: IChartApi, config: CreateLegendConfig): LegendPrimitive {
  const legendId = `legend-${Date.now()}-${Math.random().toString(36).substring(7)}`;

  const legendConfig: LegendPrimitiveConfig = {
    corner: config.corner,
    text: config.text,
    isPanePrimitive: config.isPanePrimitive ?? config.paneId !== undefined,
    paneId: config.paneId ?? 0,
    valueFormat: config.valueFormat,
    priority: config.priority ?? PrimitivePriority.LEGEND,
    visible: config.visible ?? true,
    style: config.styling,
  };

  return new LegendPrimitive(legendId, legendConfig);
}

/**
 * Create a RangeSwitcher primitive for visual tests
 *
 * @param chart - Chart instance (currently unused but kept for API consistency)
 * @param config - RangeSwitcher configuration
 * @returns RangeSwitcherPrimitive instance ready to attach to a pane
 *
 * @example
 * ```typescript
 * const switcher = createRangeSwitcher(chart, {
 *   corner: 'top-right',
 *   ranges: ['1D', '1W', '1M', 'All'],
 *   paneId: 0
 * });
 * ```
 */
export function createRangeSwitcher(
  chart: IChartApi,
  config: CreateRangeSwitcherConfig
): RangeSwitcherPrimitive {
  const switcherId = `switcher-${Date.now()}-${Math.random().toString(36).substring(7)}`;

  const rangeConfigs = config.ranges.map(parseRange);

  const switcherConfig: RangeSwitcherPrimitiveConfig = {
    corner: config.corner,
    ranges: rangeConfigs,
    priority: config.priority ?? PrimitivePriority.RANGE_SWITCHER,
    visible: config.visible ?? true,
    style: config.styling,
  };

  return new RangeSwitcherPrimitive(switcherId, switcherConfig);
}

/**
 * Attach a Legend primitive to a series
 *
 * This is a convenience function for the common pattern of attaching
 * a legend to a specific series.
 *
 * @param legend - Legend primitive to attach
 * @param series - Series to attach the legend to
 *
 * @example
 * ```typescript
 * const legend = createLegend(chart, { corner: 'top-right', text: '$$close$$' });
 * const series = chart.addCandlestickSeries();
 * attachLegendToSeries(legend, series);
 * ```
 */
export function attachLegendToSeries(legend: LegendPrimitive, series: ISeriesApi<any>): void {
  series.attachPrimitive(legend);
}

/**
 * Attach a RangeSwitcher primitive to a series
 *
 * This is a convenience function for attaching a range switcher to a series.
 *
 * @param switcher - RangeSwitcher primitive to attach
 * @param series - Series to attach the switcher to
 *
 * @example
 * ```typescript
 * const switcher = createRangeSwitcher(chart, { corner: 'top-right', ranges: ['1D', '1W'] });
 * const series = chart.addCandlestickSeries();
 * attachRangeSwitcherToSeries(switcher, series);
 * ```
 */
export function attachRangeSwitcherToSeries(
  switcher: RangeSwitcherPrimitive,
  series: ISeriesApi<any>
): void {
  series.attachPrimitive(switcher);
}
