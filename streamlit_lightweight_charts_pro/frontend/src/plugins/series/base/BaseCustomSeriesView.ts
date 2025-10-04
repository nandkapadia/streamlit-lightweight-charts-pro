/**
 * Base Custom Series View for Lightweight Charts ICustomSeries API
 *
 * This base class provides common functionality for all ICustomSeriesPaneView implementations.
 * It implements the standard patterns for:
 * - Data management and rendering
 * - Coordinate conversion with priceConverter
 * - Whitespace detection
 * - Price value building for autoscaling
 * - Options management
 * - Renderer lifecycle
 *
 * Usage:
 * 1. Extend BaseCustomSeriesPaneView for your custom series view
 * 2. Extend BaseCustomSeriesPaneRenderer for your custom series renderer
 * 3. Implement abstract methods for series-specific logic
 * 4. Use the utility functions from renderingUtils.ts for DRY rendering
 *
 * Based on TradingView Lightweight Charts ICustomSeries API
 */

import {
  ICustomSeriesPaneView,
  ICustomSeriesPaneRenderer,
  CustomData,
  CustomSeriesOptions,
  PaneRendererCustomData,
  CustomSeriesPricePlotValues,
  CustomSeriesWhitespaceData,
  Time,
  // CanvasRenderingTarget2D is declared locally in lightweight-charts
  // @ts-expect-error - Type declared locally but not exported
  type CanvasRenderingTarget2D,
  PriceToCoordinateConverter,
} from 'lightweight-charts';

// ============================================================================
// Base Types and Interfaces
// ============================================================================

/**
 * Base data structure for custom series
 * Extend this interface for your custom series data
 */
export interface BaseCustomSeriesData<HorzScaleItem = Time> extends CustomData<HorzScaleItem> {
  time: HorzScaleItem;
  // Add custom properties in derived interfaces
}

/**
 * Base options for custom series
 * Extend this interface for your custom series options
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface BaseCustomSeriesOptions extends CustomSeriesOptions {
  // Add custom options in derived interfaces
}

/**
 * Renderer data structure containing converted coordinates
 * This is passed from the view to the renderer
 */
export interface BaseRendererData<TData = any> {
  bars: TData[];
  barSpacing: number;
  visibleRange: { from: number; to: number } | null;
}

// ============================================================================
// Base Custom Series Pane Renderer
// ============================================================================

/**
 * Abstract base class for custom series renderers
 * Handles the actual drawing on the canvas
 *
 * @template TData - The data type with coordinates for rendering
 * @template TOptions - The series options type
 */
export abstract class BaseCustomSeriesPaneRenderer<
  TData = any,
  TOptions extends BaseCustomSeriesOptions = BaseCustomSeriesOptions
> implements ICustomSeriesPaneRenderer {

  protected _data: BaseRendererData<TData> | null = null;
  protected _options: TOptions | null = null;

  /**
   * Update renderer with new data and options
   * Called by the view before rendering
   */
  update(data: BaseRendererData<TData>, options: TOptions): void {
    this._data = data;
    this._options = options;
  }

  /**
   * Main draw method called by Lightweight Charts
   * This is the entry point for all rendering
   *
   * IMPORTANT: Draw order matters for z-index!
   * - Draw background elements first (fills, shaded areas)
   * - Draw foreground elements last (lines, markers)
   * This ensures proper layering within the series.
   *
   * @param target - Canvas rendering target from fancy-canvas
   * @param priceConverter - Function to convert prices to y coordinates
   * @param isHovered - Whether the series is currently hovered
   * @param hitTestData - Optional hit test data
   */
  draw(
    target: CanvasRenderingTarget2D,
    priceConverter: PriceToCoordinateConverter,
    isHovered: boolean,
    hitTestData?: unknown
  ): void {
    // Don't draw if no data or not visible
    if (!this._data || !this._options) {
      return;
    }

    // Use bitmap coordinate space for proper pixel-perfect rendering
    target.useBitmapCoordinateSpace((scope: any) => {
      const ctx = scope.context;

      // Call abstract draw method
      // NOTE: Within drawImpl, you should multiply coordinates by pixel ratios
      // for proper bitmap rendering (don't scale the context)
      // NOTE: Draw background elements BEFORE foreground elements
      this.drawImpl(ctx, scope, priceConverter, isHovered, hitTestData);
    });
  }

  /**
   * Abstract draw implementation
   * Override this in your custom renderer
   *
   * @param ctx - Canvas 2D context
   * @param scope - Bitmap scope with pixel ratios
   * @param priceConverter - Function to convert prices to y coordinates
   * @param isHovered - Whether the series is currently hovered
   * @param hitTestData - Optional hit test data
   */
  protected abstract drawImpl(
    ctx: CanvasRenderingContext2D,
    scope: any,
    priceConverter: PriceToCoordinateConverter,
    isHovered: boolean,
    hitTestData?: unknown
  ): void;
}

// ============================================================================
// Base Custom Series Pane View
// ============================================================================

/**
 * Abstract base class for custom series pane views
 * Handles data processing, coordinate conversion, and renderer management
 *
 * @template HorzScaleItem - The horizontal scale item type (usually Time)
 * @template TData - The data type for this series (extends CustomData)
 * @template TOptions - The options type for this series (extends CustomSeriesOptions)
 * @template TRenderData - The processed data type for the renderer
 */
export abstract class BaseCustomSeriesPaneView<
  HorzScaleItem = Time,
  TData extends CustomData<HorzScaleItem> = CustomData<HorzScaleItem>,
  TOptions extends CustomSeriesOptions = CustomSeriesOptions,
  TRenderData = any
> implements ICustomSeriesPaneView<HorzScaleItem, TData, TOptions> {

  // Renderer instance
  protected _renderer: BaseCustomSeriesPaneRenderer<TRenderData, TOptions>;

  // Current data and options
  protected _data: PaneRendererCustomData<HorzScaleItem, TData> | null = null;
  protected _options: TOptions | null = null;

  constructor() {
    this._renderer = this.createRenderer();
  }

  // ============================================================================
  // Abstract Methods (must be implemented by subclasses)
  // ============================================================================

  /**
   * Create the renderer instance
   * Called once during construction
   */
  protected abstract createRenderer(): BaseCustomSeriesPaneRenderer<TRenderData, TOptions>;

  /**
   * Convert raw data to render data with coordinates
   * This is where you convert your data structure to something the renderer can use
   *
   * @param data - The pane renderer data with bars
   * @returns Array of render data items
   */
  protected abstract convertToRenderData(
    data: PaneRendererCustomData<HorzScaleItem, TData>
  ): TRenderData[];

  /**
   * Get default options for this series type
   * These will be merged with user-provided options
   */
  abstract defaultOptions(): TOptions;

  /**
   * Build price values for a data point
   * Used for autoscaling and crosshair positioning
   * Return [min, max, current] or just [current]
   *
   * @param plotRow - The data point
   * @returns Array of price values
   */
  abstract priceValueBuilder(plotRow: TData): CustomSeriesPricePlotValues;

  /**
   * Test if a data point is whitespace (no value)
   * Used for determining gaps in data
   *
   * @param data - The data point to test
   * @returns True if the data is whitespace
   */
  abstract isWhitespace(
    data: TData | CustomSeriesWhitespaceData<HorzScaleItem>
  ): data is CustomSeriesWhitespaceData<HorzScaleItem>;

  // ============================================================================
  // ICustomSeriesPaneView Implementation
  // ============================================================================

  /**
   * Get the renderer instance
   * Called by Lightweight Charts before drawing
   */
  renderer(): ICustomSeriesPaneRenderer {
    return this._renderer;
  }

  /**
   * Update the view with new data and options
   * Called by Lightweight Charts before rendering
   *
   * @param data - The pane renderer data with bars and visible range
   * @param options - The current series options
   */
  update(
    data: PaneRendererCustomData<HorzScaleItem, TData>,
    options: TOptions
  ): void {
    this._data = data;
    this._options = options;

    // Convert data to render format
    const renderData = this.convertToRenderData(data);

    // Update the renderer
    this._renderer.update(
      {
        bars: renderData,
        barSpacing: data.barSpacing,
        visibleRange: data.visibleRange
          ? { from: data.visibleRange.from, to: data.visibleRange.to }
          : null,
      },
      options
    );
  }

  /**
   * Cleanup method called when series is removed
   * Override this for custom cleanup logic
   */
  destroy?(): void {
    // Override in subclass if needed
    this.onDestroy();
  }

  /**
   * Hook for custom cleanup logic
   * Override this instead of destroy()
   */
  protected onDestroy(): void {
    // Override in subclass if needed
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Get visible bars from the data
   * Returns only the bars within the visible range
   */
  protected getVisibleBars(): readonly any[] {
    if (!this._data || !this._data.visibleRange) {
      return [];
    }

    const { bars, visibleRange } = this._data;
    return bars.slice(visibleRange.from, visibleRange.to + 1);
  }

  /**
   * Check if the series should be rendered
   * Based on visibility and data availability
   */
  protected shouldRender(): boolean {
    return (
      this._data !== null &&
      this._options !== null &&
      this._data.bars.length > 0
    );
  }
}

// ============================================================================
// Common Whitespace Detection
// ============================================================================

/**
 * Default whitespace checker for data with a 'value' field
 * Use this for simple single-value series
 */
export function isWhitespaceData<HorzScaleItem>(
  data: CustomData<HorzScaleItem> | CustomSeriesWhitespaceData<HorzScaleItem>
): data is CustomSeriesWhitespaceData<HorzScaleItem> {
  return !(data as any).value && (data as any).value !== 0;
}

/**
 * Whitespace checker for data with multiple value fields
 * Checks if all specified fields are null/undefined
 */
export function isWhitespaceDataMultiField<HorzScaleItem>(
  data: CustomData<HorzScaleItem> | CustomSeriesWhitespaceData<HorzScaleItem>,
  fields: string[]
): data is CustomSeriesWhitespaceData<HorzScaleItem> {
  return fields.every(field => {
    const value = (data as any)[field];
    return value === null || value === undefined;
  });
}

// ============================================================================
// Common Price Value Builders
// ============================================================================

/**
 * Price value builder for single-value data
 * Returns [value]
 */
export function singleValuePriceBuilder(data: any): CustomSeriesPricePlotValues {
  return [data.value ?? 0];
}

/**
 * Price value builder for two-line data (e.g., ribbon, band)
 * Returns [min, max] for autoscaling
 */
export function twoLinePriceBuilder(data: any, field1: string, field2: string): CustomSeriesPricePlotValues {
  const val1 = data[field1] ?? 0;
  const val2 = data[field2] ?? 0;
  return [Math.min(val1, val2), Math.max(val1, val2)];
}

/**
 * Price value builder for three-value data
 * Returns [min, max, current]
 */
export function threeValuePriceBuilder(
  data: any,
  minField: string,
  maxField: string,
  currentField: string
): CustomSeriesPricePlotValues {
  return [
    data[minField] ?? 0,
    data[maxField] ?? 0,
    data[currentField] ?? 0,
  ];
}

// ============================================================================
// Default Options Helper
// ============================================================================

/**
 * Merge default options with custom options
 * Useful for creating defaultOptions() implementation
 */
export function mergeDefaultOptions<T extends CustomSeriesOptions>(
  baseDefaults: CustomSeriesOptions,
  customDefaults: Partial<T>
): T {
  return {
    ...baseDefaults,
    ...customDefaults,
  } as T;
}
