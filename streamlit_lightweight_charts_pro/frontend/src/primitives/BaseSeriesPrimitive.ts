/**
 * Base Series Primitive - Abstract base class for all series primitives
 *
 * This class eliminates DRY violations by providing common functionality
 * that all series primitives share, following the single source of truth principle.
 *
 * Common patterns abstracted:
 * - Lifecycle management (attached/detached)
 * - Data synchronization from attached series
 * - Z-order management with consistent defaults
 * - View management (pane views, price axis views)
 * - Update handling
 * - Chart and series reference management
 *
 * @template TData - Processed data type
 * @template TOptions - Options type
 */

import {
  IChartApi,
  ISeriesPrimitive,
  SeriesAttachedParameter,
  IPrimitivePaneView,
  ISeriesPrimitiveAxisView,
  ISeriesApi,
  Time,
  PrimitivePaneViewZOrder,
} from 'lightweight-charts';

/**
 * Base interface for series primitive options
 */
export interface BaseSeriesPrimitiveOptions {
  zIndex?: number;
  visible?: boolean;
  priceScaleId?: string;
}

/**
 * Base interface for processed data
 */
export interface BaseProcessedData {
  time: Time;
}

/**
 * Base interface for series primitive source
 */
export interface BaseSeriesPrimitiveSource<TData extends BaseProcessedData> {
  getChart(): IChartApi;
  getAttachedSeries(): ISeriesApi<any> | null;
  getOptions(): BaseSeriesPrimitiveOptions;
  getProcessedData(): TData[];
}

/**
 * Abstract base class for all series primitives
 *
 * Provides common functionality to eliminate DRY violations:
 * - Standardized lifecycle management
 * - Consistent data synchronization
 * - Unified z-order handling
 * - Common view management patterns
 */
export abstract class BaseSeriesPrimitive<
    TData extends BaseProcessedData,
    TOptions extends BaseSeriesPrimitiveOptions,
  >
  implements ISeriesPrimitive<Time>, BaseSeriesPrimitiveSource<TData>
{
  protected _chart: IChartApi;
  protected _series: ISeriesApi<any> | null = null;
  protected _options: TOptions;
  protected _data: TData[] = [];
  protected _paneViews: IPrimitivePaneView[] = [];
  protected _priceAxisViews: ISeriesPrimitiveAxisView[] = [];

  constructor(chart: IChartApi, options: TOptions) {
    this._chart = chart;
    this._options = { ...options };
    this._initializeViews();
  }

  // ===== Abstract Methods (to be implemented by subclasses) =====

  /**
   * Initialize views for this primitive
   * Subclasses must implement this to create their specific views
   */
  protected abstract _initializeViews(): void;

  /**
   * Process raw data into processed data format
   * Subclasses must implement this to handle their specific data format
   */
  protected abstract _processData(rawData: any[]): TData[];

  /**
   * Get the default z-order for this primitive
   * Subclasses can override to provide custom defaults
   */
  protected _getDefaultZOrder(): PrimitivePaneViewZOrder {
    return 'normal'; // Default: render in normal layer (in front of grid)
  }

  // ===== ISeriesPrimitive Implementation =====

  /**
   * Called when primitive is attached to a series
   * Standardized implementation - subclasses can override for custom behavior
   */
  attached(params: SeriesAttachedParameter<Time>): void {
    this._series = params.series;
    this._syncDataFromSeries();
  }

  /**
   * Called when primitive is detached from a series
   * Standardized implementation - subclasses can override for custom behavior
   */
  detached(): void {
    this._series = null;
    this._data = [];
  }

  /**
   * Get pane views for this primitive
   * Standardized implementation
   */
  paneViews(): IPrimitivePaneView[] {
    return this._paneViews;
  }

  /**
   * Get price axis views for this primitive
   * Standardized implementation
   */
  priceAxisViews(): ISeriesPrimitiveAxisView[] {
    return this._priceAxisViews;
  }

  /**
   * Update all views
   * Standardized implementation - subclasses can override for custom behavior
   */
  updateAllViews(): void {
    this._paneViews.forEach(pv => {
      // @ts-expect-error - update() is an optional method on custom pane views
      if (typeof pv.update === 'function') {
        // @ts-expect-error - update() is an optional method on custom pane views
        pv.update();
      }
    });
  }

  // ===== BaseSeriesPrimitiveSource Implementation =====

  /**
   * Get chart instance
   */
  getChart(): IChartApi {
    return this._chart;
  }

  /**
   * Get attached series instance
   */
  getAttachedSeries(): ISeriesApi<any> | null {
    return this._series;
  }

  /**
   * Get options
   */
  getOptions(): TOptions {
    return this._options;
  }

  /**
   * Get processed data
   */
  getProcessedData(): TData[] {
    return this._data;
  }

  // ===== Public API =====

  /**
   * Apply new options
   * Standardized implementation with data reprocessing
   */
  applyOptions(options: Partial<TOptions>): void {
    this._options = { ...this._options, ...options };
    this._syncDataFromSeries();
    this.updateAllViews();
  }

  /**
   * Set data directly (for testing or manual data management)
   */
  setData(rawData: any[]): void {
    this._data = this._processData(rawData);
    this.updateAllViews();
  }

  /**
   * Destroy the primitive (cleanup)
   * Standardized implementation - subclasses can override for custom cleanup
   */
  destroy(): void {
    this._series = null;
    this._data = [];
    this._paneViews = [];
    this._priceAxisViews = [];
  }

  // ===== Protected Helper Methods =====

  /**
   * Sync data from attached series
   * Standardized implementation
   */
  protected _syncDataFromSeries(): void {
    if (!this._series) {
      this._data = [];
      return;
    }

    // Get data from series
    const seriesData = this._series.data() as any[];

    // Process data using subclass implementation
    this._data = this._processData(seriesData);
  }

  /**
   * Add a pane view to this primitive
   * Helper method for subclasses
   */
  protected _addPaneView(view: IPrimitivePaneView): void {
    this._paneViews.push(view);
  }

  /**
   * Add a price axis view to this primitive
   * Helper method for subclasses
   */
  protected _addPriceAxisView(view: ISeriesPrimitiveAxisView): void {
    this._priceAxisViews.push(view);
  }

  /**
   * Get z-order based on options
   * Standardized implementation with consistent mapping
   */
  protected _getZOrder(): PrimitivePaneViewZOrder {
    const zIndex = this._options.zIndex;

    if (typeof zIndex === 'number') {
      if (zIndex < 0) return 'bottom';
      if (zIndex >= 1000) return 'top';
      return 'normal';
    }

    return this._getDefaultZOrder();
  }
}

/**
 * Base class for series primitive pane views
 * Eliminates DRY violations in view implementations
 */
export abstract class BaseSeriesPrimitivePaneView<
  TData extends BaseProcessedData,
  TOptions extends BaseSeriesPrimitiveOptions,
> implements IPrimitivePaneView
{
  protected _source: BaseSeriesPrimitive<TData, TOptions>;

  constructor(source: BaseSeriesPrimitive<TData, TOptions>) {
    this._source = source;
  }

  /**
   * Get renderer for this view
   * Subclasses must implement this
   */
  abstract renderer(): any;

  /**
   * Get z-order for this view
   * Standardized implementation using source's z-order
   */
  zOrder(): PrimitivePaneViewZOrder {
    // @ts-expect-error - Accessing protected method within related class
    return this._source._getZOrder();
  }

  /**
   * Update this view
   * Standardized implementation - subclasses can override for custom behavior
   */
  update(): void {
    // Default implementation - subclasses can override
  }
}

/**
 * Base class for series primitive axis views
 * Eliminates DRY violations in axis view implementations
 */
export abstract class BaseSeriesPrimitiveAxisView<
  TData extends BaseProcessedData,
  TOptions extends BaseSeriesPrimitiveOptions,
> implements ISeriesPrimitiveAxisView
{
  protected _source: BaseSeriesPrimitive<TData, TOptions>;

  constructor(source: BaseSeriesPrimitive<TData, TOptions>) {
    this._source = source;
  }

  /**
   * Get coordinate for this axis view
   * Subclasses must implement this
   */
  abstract coordinate(): number;

  /**
   * Get text for this axis view
   * Subclasses must implement this
   */
  abstract text(): string;

  /**
   * Get text color for this axis view
   * Standardized implementation - subclasses can override
   */
  textColor(): string {
    return '#FFFFFF'; // Default: white for contrast
  }

  /**
   * Get background color for this axis view
   * Subclasses must implement this
   */
  abstract backColor(): string;

  /**
   * Check if this axis view is visible
   * Standardized implementation - subclasses can override
   * Checks lastValueVisible since axis view shows the last value label
   */
  visible(): boolean {
    const series = this._source.getAttachedSeries();
    if (series) {
      const seriesOptions = (series as any).options();
      if (seriesOptions) {
        return seriesOptions.lastValueVisible ?? false;
      }
    }
    return false;
  }

  /**
   * Check if tick is visible
   * Standardized implementation - subclasses can override
   */
  tickVisible(): boolean {
    return true;
  }

  /**
   * Get the last visible item using time-based range detection
   * Standardized implementation following TradingView best practices
   */
  protected _getLastVisibleItem(): TData | null {
    const items = this._source.getProcessedData();
    if (items.length === 0) {
      return null;
    }

    // Get the chart's time scale
    const chart = this._source.getChart();
    const timeScale = chart.timeScale();

    // Get visible time range (in time coordinates, not logical indices)
    const visibleTimeRange = timeScale.getVisibleRange();

    if (!visibleTimeRange) {
      return items[items.length - 1];
    }

    // Find the last item that is within or before the visible range
    // Work backwards from the end to find the rightmost visible item
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
