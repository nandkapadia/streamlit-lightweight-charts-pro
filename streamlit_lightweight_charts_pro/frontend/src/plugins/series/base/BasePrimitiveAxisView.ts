/**
 * @fileoverview Base class for primitive price axis views
 *
 * Provides common functionality for ISeriesPrimitiveAxisView implementations:
 * - Time-based visible range detection
 * - Coordinate conversion
 * - Null handling
 *
 * This base class implements the critical _getLastVisibleItem logic that was
 * debugged and fixed in TrendFill series. All primitives should use this
 * to ensure consistent behavior.
 */

import {
  ISeriesPrimitiveAxisView,
  IChartApi,
  ISeriesApi,
  Time,
} from 'lightweight-charts';

/**
 * Base interface for processed data items
 */
export interface BaseProcessedData {
  time: Time;
  [key: string]: any;
}

/**
 * Base interface for primitive sources
 */
export interface BasePrimitiveSource<TData extends BaseProcessedData = BaseProcessedData> {
  getChart(): IChartApi;
  getAttachedSeries(): ISeriesApi<any> | null;
  getProcessedData(): TData[];
  getOptions(): any;
}

/**
 * Base class for primitive price axis views
 *
 * Subclasses must implement:
 * - coordinate(): number
 * - text(): string
 * - textColor(): string
 * - backColor(): string
 *
 * This class provides:
 * - visible(): boolean (with proper visibility logic)
 * - tickVisible(): boolean
 * - _getLastVisibleItem() (time-based detection)
 */
export abstract class BasePrimitiveAxisView<TData extends BaseProcessedData = BaseProcessedData>
  implements ISeriesPrimitiveAxisView
{
  protected _source: BasePrimitiveSource<TData>;

  constructor(source: BasePrimitiveSource<TData>) {
    this._source = source;
  }

  /**
   * Get Y-coordinate for price axis label
   * Subclasses must implement based on their data structure
   */
  abstract coordinate(): number;

  /**
   * Get text to display on price axis
   * Subclasses must implement based on their data structure
   */
  abstract text(): string;

  /**
   * Get text color for price axis label
   * Subclasses must implement based on their styling
   */
  abstract textColor(): string;

  /**
   * Get background color for price axis label
   * Subclasses must implement based on their styling
   */
  abstract backColor(): string;

  /**
   * Determine if price axis label should be visible
   *
   * Returns true when:
   * - We have data to display
   * - The primitive is visible (options.visible)
   * - The series' lastValueVisible option is NOT controlling this (primitive is independent)
   */
  visible(): boolean {
    const lastItem = this._getLastVisibleItem();
    if (!lastItem) return false;

    const options = this._source.getOptions();
    if (!options.visible) return false;

    // Primitive's price axis view is independent of series' lastValueVisible
    return true;
  }

  /**
   * Determine if price tick should be visible
   */
  tickVisible(): boolean {
    return true;
  }

  /**
   * Get last visible item using time-based range detection
   *
   * This method intelligently detects which data item is actually visible
   * on the chart, not just the last item in the data array. This is critical
   * for price axis labels to show the correct value when the chart is zoomed
   * or scrolled.
   *
   * Algorithm:
   * 1. Get the visible time range from the chart's time scale
   * 2. Work backwards from the end of the data array
   * 3. Find the first item whose time is <= the visible range's end time
   * 4. Return that item as the last visible item
   *
   * Why time-based instead of index-based:
   * - getVisibleRange() returns time coordinates (what user sees)
   * - getVisibleLogicalRange() returns bar indices (can be misleading when zoomed)
   *
   * @returns The last visible data item, or null if no data
   */
  protected _getLastVisibleItem(): TData | null {
    const items = this._source.getProcessedData();
    if (items.length === 0) return null;

    const chart = this._source.getChart();
    const timeScale = chart.timeScale();
    const visibleTimeRange = timeScale.getVisibleRange();

    if (!visibleTimeRange) {
      return items[items.length - 1];
    }

    // Find last item within visible range (work backwards)
    for (let i = items.length - 1; i >= 0; i--) {
      const itemTime = items[i].time;

      // Check if this item's time is within or before the visible range
      // Cast to number for comparison since Time can be number or string
      if ((itemTime as number) <= (visibleTimeRange.to as number)) {
        return items[i];
      }
    }

    // Fallback to first item if nothing found
    return items[0];
  }
}
