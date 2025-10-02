/**
 * Base Custom Series for Lightweight Charts
 *
 * This base class provides common functionality for all ISeriesPrimitive-based custom series.
 * It implements the standard patterns for:
 * - Data management and processing
 * - Coordinate conversion
 * - Visibility handling
 * - Options management
 * - Line series management for coordinate conversion
 * - Pane view lifecycle
 *
 * Usage:
 * 1. Extend this class for your custom series
 * 2. Implement abstract methods for series-specific logic
 * 3. Optionally override lifecycle hooks for custom behavior
 */

import {
  IChartApi,
  ISeriesApi,
  ISeriesPrimitive,
  SeriesAttachedParameter,
  IPrimitivePaneView,
  Time,
  UTCTimestamp,
  LineSeries,
} from 'lightweight-charts';

// ============================================================================
// Base Types and Interfaces
// ============================================================================

/**
 * Base data structure for custom series
 * All custom series data should extend this
 */
export interface BaseSeriesData {
  time: number | string;
}

/**
 * Base options for custom series
 * All custom series options should extend this
 */
export interface BaseSeriesOptions {
  visible: boolean;
  priceScaleId?: string;
  zIndex?: number;
}

/**
 * Configuration for line series used for coordinate conversion
 */
export interface LineSeriesConfig {
  color?: string;
  visible?: boolean;
  lastValueVisible?: boolean;
  priceLineVisible?: boolean;
}

// ============================================================================
// Time Parsing Utility
// ============================================================================

/**
 * Parse time value to UTC timestamp
 * Handles both string dates and numeric timestamps
 */
export function parseTime(time: string | number): UTCTimestamp {
  try {
    // If it's already a number (Unix timestamp), convert to seconds if needed
    if (typeof time === 'number') {
      // If timestamp is in milliseconds, convert to seconds
      if (time > 1000000000000) {
        return Math.floor(time / 1000) as UTCTimestamp;
      }
      return Math.floor(time) as UTCTimestamp;
    }

    // If it's a string, try to parse as date
    if (typeof time === 'string') {
      // First try to parse as Unix timestamp string
      const timestamp = parseInt(time, 10);
      if (!isNaN(timestamp)) {
        // It's a numeric string (Unix timestamp)
        if (timestamp > 1000000000000) {
          return Math.floor(timestamp / 1000) as UTCTimestamp;
        }
        return Math.floor(timestamp) as UTCTimestamp;
      }

      // Try to parse as date string
      const date = new Date(time);
      if (isNaN(date.getTime())) {
        return 0 as UTCTimestamp;
      }
      return Math.floor(date.getTime() / 1000) as UTCTimestamp;
    }

    return 0 as UTCTimestamp;
  } catch {
    return 0 as UTCTimestamp;
  }
}

// ============================================================================
// Base Custom Series Class
// ============================================================================

/**
 * Abstract base class for ISeriesPrimitive-based custom series
 *
 * @template TData - The data type for this series (extends BaseSeriesData)
 * @template TOptions - The options type for this series (extends BaseSeriesOptions)
 * @template TItem - The processed internal data type for rendering
 * @template TRenderData - The coordinate-converted render data type
 */
export abstract class BaseCustomSeries<
  TData extends BaseSeriesData,
  TOptions extends BaseSeriesOptions,
  TItem,
  TRenderData
> implements ISeriesPrimitive<Time> {

  // Core properties
  protected chart: IChartApi;
  protected options: TOptions;
  protected data: TData[] = [];
  protected processedItems: TItem[] = [];

  // Line series for coordinate conversion (transparent)
  protected lineSeries: Map<string, ISeriesApi<'Line'>> = new Map();

  // Pane views
  protected _paneViews: IPrimitivePaneView[];

  // ============================================================================
  // Constructor
  // ============================================================================

  constructor(
    chart: IChartApi,
    options: TOptions,
    protected _paneId: number = 0
  ) {
    this.chart = chart;
    this.options = { ...options };

    // Create pane views (subclass must implement createPaneView)
    this._paneViews = [this.createPaneView()];

    // Initialize line series for coordinate conversion
    this.initializeLineSeries();
  }

  // ============================================================================
  // Abstract Methods (must be implemented by subclasses)
  // ============================================================================

  /**
   * Create the pane view for this series
   * This is called once during construction
   */
  protected abstract createPaneView(): IPrimitivePaneView;

  /**
   * Process raw data into internal format for rendering
   * This is called whenever data is updated
   */
  protected abstract processData(): void;

  /**
   * Get the configuration for line series needed for coordinate conversion
   * Return a map of line series name to configuration
   *
   * @example
   * return {
   *   'baseLine': { color: 'rgba(0,0,0,0)', visible: true },
   *   'trendLine': { color: 'rgba(0,0,0,0)', visible: true }
   * };
   */
  protected abstract getLineSeriesConfig(): Record<string, LineSeriesConfig>;

  /**
   * Extract data for each line series from the raw data
   * Return a map of line series name to data array
   *
   * @example
   * return {
   *   'baseLine': this.data.map(item => ({
   *     time: parseTime(item.time),
   *     value: item.baseLine
   *   })),
   *   'trendLine': this.data.map(item => ({
   *     time: parseTime(item.time),
   *     value: item.trendLine
   *   }))
   * };
   */
  protected abstract extractLineSeriesData(): Record<string, Array<{ time: UTCTimestamp; value: number }>>;

  /**
   * Get the default z-index for this series type
   */
  protected abstract getDefaultZIndex(): number;

  // ============================================================================
  // Line Series Management
  // ============================================================================

  /**
   * Initialize line series for coordinate conversion
   * Creates transparent line series based on configuration
   */
  protected initializeLineSeries(): void {
    const config = this.getLineSeriesConfig();

    for (const [name, seriesConfig] of Object.entries(config)) {
      const series = this.chart.addSeries(LineSeries, {
        color: seriesConfig.color || 'rgba(0,0,0,0)',
        lineStyle: 0,
        lineWidth: 1,
        visible: seriesConfig.visible ?? true, // Must be visible for coordinate conversion
        priceScaleId: this.options.priceScaleId || 'right',
        lastValueVisible: seriesConfig.lastValueVisible ?? false,
        priceLineVisible: seriesConfig.priceLineVisible ?? false,
      });

      this.lineSeries.set(name, series);
    }

    // Attach primitive to the first line series for rendering
    const firstSeries = Array.from(this.lineSeries.values())[0];
    if (firstSeries) {
      firstSeries.attachPrimitive(this);
    }
  }

  /**
   * Update line series data from raw data
   */
  protected updateLineSeriesData(): void {
    const lineData = this.extractLineSeriesData();

    for (const [name, data] of Object.entries(lineData)) {
      const series = this.lineSeries.get(name);
      if (series && data.length > 0) {
        series.setData(data);
      }
    }
  }

  /**
   * Get a specific line series by name
   */
  protected getLineSeries(name: string): ISeriesApi<'Line'> | undefined {
    return this.lineSeries.get(name);
  }

  /**
   * Get all line series as an array
   */
  protected getAllLineSeries(): ISeriesApi<'Line'>[] {
    return Array.from(this.lineSeries.values());
  }

  // ============================================================================
  // Data Management
  // ============================================================================

  /**
   * Set data for the series
   * This triggers data processing and line series updates
   */
  public setData(data: TData[]): void {
    this.data = data;
    this.processData();
    this.updateLineSeriesData();
    this.updateAllViews();
  }

  /**
   * Update data (alias for setData)
   */
  public updateData(data: TData[]): void {
    this.setData(data);
  }

  /**
   * Get raw data
   */
  public getData(): TData[] {
    return this.data;
  }

  /**
   * Get processed items for rendering
   */
  public getProcessedData(): TItem[] {
    return this.processedItems;
  }

  // ============================================================================
  // Options Management
  // ============================================================================

  /**
   * Apply options to the series
   * Override this to handle custom option logic
   */
  public applyOptions(options: Partial<TOptions>): void {
    this.options = { ...this.options, ...options };

    // Handle visibility changes
    if (options.visible !== undefined) {
      this.updateVisibility(options.visible);
    }

    // Reprocess data if options affect rendering
    this.processData();
    this.updateAllViews();
  }

  /**
   * Get current options
   */
  public getOptions(): TOptions {
    return this.options;
  }

  // ============================================================================
  // Visibility Management
  // ============================================================================

  /**
   * Set visibility of the series
   */
  public setVisible(visible: boolean): void {
    this.options.visible = visible;
    this.updateVisibility(visible);
    this.updateAllViews();
  }

  /**
   * Update visibility of all line series
   */
  protected updateVisibility(visible: boolean): void {
    for (const series of this.lineSeries.values()) {
      series.applyOptions({ visible });
    }
  }

  // ============================================================================
  // Chart Access
  // ============================================================================

  /**
   * Get the chart instance
   */
  public getChart(): IChartApi {
    return this.chart;
  }

  // ============================================================================
  // Lifecycle Management
  // ============================================================================

  /**
   * Destroy the series and clean up resources
   */
  public destroy(): void {
    try {
      // Remove all line series
      for (const series of this.lineSeries.values()) {
        this.chart.removeSeries(series);
      }
      this.lineSeries.clear();

      // Call custom cleanup hook
      this.onDestroy();
    } catch (error) {
      console.warn('Error during series cleanup:', error);
    }
  }

  /**
   * Hook called during destroy
   * Override this for custom cleanup logic
   */
  protected onDestroy(): void {
    // Override in subclass if needed
  }

  // ============================================================================
  // ISeriesPrimitive Implementation
  // ============================================================================

  attached(_param: SeriesAttachedParameter<Time>): void {
    this.onAttached(_param);
  }

  detached(): void {
    this.onDetached();
  }

  updateAllViews(): void {
    this._paneViews.forEach(pv => pv.update());
  }

  paneViews(): IPrimitivePaneView[] {
    return this._paneViews;
  }

  /**
   * Hook called when primitive is attached
   * Override this for custom attachment logic
   */
  protected onAttached(_param: SeriesAttachedParameter<Time>): void {
    // Override in subclass if needed
  }

  /**
   * Hook called when primitive is detached
   * Override this for custom detachment logic
   */
  protected onDetached(): void {
    // Override in subclass if needed
  }
}

// ============================================================================
// Base Pane View Class
// ============================================================================

/**
 * Abstract base class for pane views
 * Provides common functionality for coordinate conversion and visible range calculation
 *
 * @template TSeries - The custom series type
 * @template TItem - The processed data item type
 * @template TRenderData - The render data type with coordinates
 * @template TOptions - The series options type
 */
export abstract class BaseCustomSeriesPaneView<
  TSeries extends BaseCustomSeries<any, TOptions, TItem, TRenderData>,
  TItem,
  TRenderData,
  TOptions extends BaseSeriesOptions
> implements IPrimitivePaneView {

  protected _source: TSeries;

  constructor(source: TSeries) {
    this._source = source;
  }

  /**
   * Update view data
   * This is called before rendering
   */
  abstract update(): void;

  /**
   * Create and return the renderer
   */
  abstract renderer(): any;

  /**
   * Get z-index for layering
   */
  zIndex(): number {
    const zIndex = this._source.getOptions().zIndex;
    if (typeof zIndex === 'number' && zIndex >= 0) {
      return zIndex;
    }
    return this._source['getDefaultZIndex']();
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Calculate visible range from render data
   * Simple implementation - can be overridden for more sophisticated logic
   */
  protected calculateVisibleRange<T extends { x: number | null }>(
    items: T[]
  ): { from: number; to: number } | null {
    if (items.length === 0) return null;
    // Simple visible range - all items
    // In production, this should consider viewport bounds
    return { from: 0, to: items.length };
  }

  /**
   * Get chart dimensions
   */
  protected getChartDimensions(): { width: number; height: number } {
    const chartElement = this._source.getChart().chartElement();
    return {
      width: chartElement?.clientWidth || 800,
      height: chartElement?.clientHeight || 400,
    };
  }

  /**
   * Get bar spacing for the chart
   */
  protected getBarSpacing(): number {
    try {
      const chart = this._source.getChart() as any;
      if (chart._model?.timeScale?.barSpacing) {
        return chart._model.timeScale.barSpacing();
      }
    } catch {
      // Fallback to default
    }
    return 1;
  }
}

// ============================================================================
// Series View Wrapper (for Factory Pattern Compatibility)
// ============================================================================

/**
 * Wrapper class for series factory compatibility
 * This allows series to be created through the factory pattern
 *
 * @template TData - The data type
 * @template TOptions - The options type
 * @template TSeries - The series implementation type
 */
export class BaseSeriesView<
  TData extends BaseSeriesData,
  TOptions extends BaseSeriesOptions,
  TSeries extends BaseCustomSeries<TData, TOptions, any, any>
> {
  private _data: TData[] = [];
  private _options: TOptions;
  private _series: TSeries | null = null;

  constructor(data: TData[], options: TOptions) {
    this._data = data;
    this._options = options;
  }

  processData(): TData[] {
    return this._data;
  }

  setData(newData: TData[]): void {
    this._data = newData;
    if (this._series) {
      this._series.setData(newData);
    }
  }

  getData(): TData[] {
    return this._data;
  }

  getOptions(): TOptions {
    return this._options;
  }

  /**
   * Create the series instance
   * This method will be called by addCustomSeries or the factory
   *
   * @param chart - Chart instance
   * @param paneId - Pane ID for the series
   * @param createFn - Factory function to create the series
   */
  createSeries(
    chart: IChartApi,
    paneId: number,
    createFn: (chart: IChartApi, options: TOptions, paneId: number) => TSeries
  ): TSeries {
    this._series = createFn(chart, this._options, paneId);
    this._series.setData(this._data);
    return this._series;
  }

  /**
   * Get the created series instance
   */
  getSeries(): TSeries | null {
    return this._series;
  }
}
