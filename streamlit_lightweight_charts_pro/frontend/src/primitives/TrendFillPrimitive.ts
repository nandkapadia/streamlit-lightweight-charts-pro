/**
 * Trend Fill Primitive - ISeriesPrimitive Implementation
 *
 * This primitive renders filled areas between trend and base lines,
 * with the ability to control z-order (can render behind other series).
 *
 * Features:
 * - Dynamic fill colors based on trend direction (uptrend/downtrend)
 * - Trend line rendering with configurable style (solid/dotted/dashed only)
 * - Base line drawn as part of fill path (not separately)
 * - Full bar width fills (no gaps) - enabled by default, optional half-bar-width mode
 * - Z-order control (defaults to -100 for background rendering)
 * - Proper rendering method separation: fills in drawBackground(), lines in draw()
 * - Price axis label showing last visible trend value with direction-based background color
 * - White text color on price axis labels for optimal contrast
 *
 * Use cases:
 * - When you need TrendFill to render BEHIND other series (background fills)
 * - When you need fine control over z-order positioning
 * - When using with createTrendFillSeries() factory function with usePrimitive: true
 *
 * Architecture:
 * - Attached to ICustomSeries via attachPrimitive()
 * - Provides its own price axis view (ISeriesPrimitiveAxisView)
 * - Detects last visible item using time-based visible range
 * - Uses solid colors for price axis labels (removes transparency from fill colors)
 *
 * Note: For most cases, use createTrendFillSeries() factory function instead.
 * Only instantiate this primitive directly when you need advanced customization.
 *
 * @see createTrendFillSeries for the factory function (recommended for most uses)
 * @see TrendFillSeries for the ICustomSeries implementation
 */

import {
  IChartApi,
  IPrimitivePaneRenderer,
  UTCTimestamp,
  PrimitivePaneViewZOrder,
  ISeriesPrimitiveAxisView,
} from 'lightweight-charts';
import { getSolidColorFromFill } from '../utils/colorUtils';
import {
  BaseSeriesPrimitive,
  BaseSeriesPrimitiveOptions,
  BaseSeriesPrimitivePaneView,
} from './BaseSeriesPrimitive';

// ============================================================================
// Data Interfaces
// ============================================================================

/**
 * Data structure for trend fill primitive
 * Supports both snake_case (Python) and camelCase (JavaScript) field names
 */
export interface TrendFillPrimitiveData {
  time: number | string;
  base_line?: number | null;
  trend_line?: number | null;
  trend_direction?: number | null;
  baseLine?: number | null;
  trendLine?: number | null;
  trendDirection?: number | null;
}

/**
 * Options for trend fill primitive
 *
 * @property zIndex - Z-order for rendering (default: -100, negative values render behind series)
 * @property uptrendFillColor - Fill color for uptrend areas (supports rgba with transparency)
 * @property downtrendFillColor - Fill color for downtrend areas (supports rgba with transparency)
 * @property trendLine - Trend line configuration
 * @property trendLine.color - Line color (can be overridden by direction-based colors)
 * @property trendLine.lineWidth - Line width (1-4 pixels)
 * @property trendLine.lineStyle - Line style: 0=Solid, 1=Dotted, 2=Dashed (LargeDashed and SparseDotted not supported)
 * @property trendLine.visible - Show/hide trend line
 * @property baseLine - Base line configuration (drawn as part of fill path)
 * @property baseLine.color - Line color
 * @property baseLine.lineWidth - Line width (1-4 pixels)
 * @property baseLine.lineStyle - Line style: 0=Solid, 1=Dotted, 2=Dashed
 * @property baseLine.visible - Show/hide base line (currently not rendered separately, part of fill)
 * @property visible - Master visibility toggle for entire primitive
 * @property priceScaleId - Price scale ID ('left', 'right', or custom)
 * @property useHalfBarWidth - When true, fills extend half bar width on each side (default: false = full bar width)
 */
export interface TrendFillPrimitiveOptions extends BaseSeriesPrimitiveOptions {
  uptrendFillColor: string;
  downtrendFillColor: string;
  trendLine: {
    color: string;
    lineWidth: 1 | 2 | 3 | 4;
    lineStyle: 0 | 1 | 2; // Solid, Dotted, Dashed only
    visible: boolean;
  };
  baseLine: {
    color: string;
    lineWidth: 1 | 2 | 3 | 4;
    lineStyle: 0 | 1 | 2; // Solid, Dotted, Dashed only
    visible: boolean;
  };
  useHalfBarWidth?: boolean;
}

/**
 * Internal processed data structure
 */
interface TrendFillItem {
  time: UTCTimestamp;
  baseLine: number;
  trendLine: number;
  trendDirection: number;
  fillColor: string;
  lineColor: string;
  lineWidth: number;
  lineStyle: number;
}

/**
 * Render data with converted coordinates
 */
interface TrendFillRenderData {
  x: number | null;
  baseLineY: number | null;
  trendLineY: number | null;
  fillColor: string;
  lineColor: string;
  lineWidth: number;
  lineStyle: number;
  trendDirection: number;
}

/**
 * Renderer data bundle
 */
interface TrendFillRendererData {
  items: TrendFillRenderData[];
  timeScale: any;
  priceScale: any;
  chartWidth: number;
  lineWidth: number;
  lineStyle: number;
  visibleRange: { from: number; to: number } | null;
  barSpacing: number;
  useHalfBarWidth: boolean;
}

/**
 * View data bundle
 */
interface TrendFillViewData {
  data: TrendFillRendererData;
  options: TrendFillPrimitiveOptions;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Parse time value to UTC timestamp
 */
function parseTime(time: string | number): UTCTimestamp {
  try {
    if (typeof time === 'number') {
      // Convert milliseconds to seconds if needed
      if (time > 1000000000000) {
        return Math.floor(time / 1000) as UTCTimestamp;
      }
      return Math.floor(time) as UTCTimestamp;
    }

    if (typeof time === 'string') {
      const timestamp = parseInt(time, 10);
      if (!isNaN(timestamp)) {
        if (timestamp > 1000000000000) {
          return Math.floor(timestamp / 1000) as UTCTimestamp;
        }
        return Math.floor(timestamp) as UTCTimestamp;
      }

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
// Renderer Implementation
// ============================================================================

/**
 * Trend Fill Primitive Renderer
 * Handles actual drawing on canvas with proper method separation:
 * - draw(): Renders trend lines (foreground elements)
 * - drawBackground(): Renders filled areas (background elements)
 */
class TrendFillPrimitiveRenderer implements IPrimitivePaneRenderer {
  private _viewData: TrendFillViewData;

  constructor(data: TrendFillViewData) {
    this._viewData = data;
  }

  /**
   * Draw method - handles LINE drawing (foreground elements)
   * This method renders lines, markers, and other foreground elements
   * that should appear on top of fills and other series
   */
  draw(target: any) {
    target.useBitmapCoordinateSpace((scope: any) => {
      const ctx = scope.context;

      // DON'T scale context - multiply coordinates by pixel ratio instead
      const hRatio = scope.horizontalPixelRatio;
      const vRatio = scope.verticalPixelRatio;

      ctx.save();

      // Draw trend lines (foreground)
      if (this._viewData.options.trendLine.visible) {
        this._drawTrendLines(ctx, hRatio, vRatio);
      }

      // Note: Base line is drawn as part of the fill path, not separately

      ctx.restore();
    });
  }

  /**
   * Draw background method - handles FILL rendering (background elements)
   * This method renders fills, areas, and other background elements
   * that should appear behind lines and other series
   */
  drawBackground(target: any) {
    target.useBitmapCoordinateSpace((scope: any) => {
      const ctx = scope.context;

      // DON'T scale context - multiply coordinates by pixel ratio instead
      const hRatio = scope.horizontalPixelRatio;
      const vRatio = scope.verticalPixelRatio;

      ctx.save();

      // Draw fills (background)
      this._drawTrendFills(ctx, hRatio, vRatio);

      ctx.restore();
    });
  }

  /**
   * Draw filled areas between trend and base lines
   * Groups consecutive bars with same trend direction into continuous fills
   */
  private _drawTrendFills(ctx: CanvasRenderingContext2D, hRatio: number, vRatio: number): void {
    const { items, visibleRange, useHalfBarWidth, barSpacing } = this._viewData.data;

    if (items.length === 0 || visibleRange === null) {
      return;
    }

    // Calculate half bar width if enabled
    const halfBarWidth = useHalfBarWidth ? (barSpacing * hRatio) / 2 : 0;

    // Group consecutive bars with same trend direction
    let currentGroup: TrendFillRenderData[] = [];
    let currentColor: string | null = null;
    let currentDirection: number | null = null;

    const flushGroup = () => {
      if (currentGroup.length < 1 || !currentColor) return;

      // Draw continuous fill for this group
      ctx.fillStyle = currentColor;
      ctx.beginPath();

      // Draw trend line path (left to right)
      const firstBar = currentGroup[0];
      const lastBar = currentGroup[currentGroup.length - 1];

      // Check if first/last bars are transition points
      const firstTransitionData = (firstBar as any).transitionData;
      const lastTransitionData = (lastBar as any).transitionData;

      // Start position: if first bar is after transition, use interpolated point, else half-bar before
      let startX, startTrendY, startBaseY;
      if (firstTransitionData) {
        // Start at midpoint between previous and current bar
        startX = firstTransitionData.x * hRatio;
        startTrendY = firstTransitionData.trendLineY * vRatio;
        startBaseY = firstTransitionData.baseLineY * vRatio;
      } else {
        startX = (firstBar.x ?? 0) * hRatio - halfBarWidth;
        startTrendY = (firstBar.trendLineY ?? 0) * vRatio;
        startBaseY = (firstBar.baseLineY ?? 0) * vRatio;
      }

      ctx.moveTo(startX, startTrendY);

      // Draw to each bar's trend line (including first bar)
      for (let i = 0; i < currentGroup.length; i++) {
        const bar = currentGroup[i];
        const x = (bar.x ?? 0) * hRatio;
        const y = (bar.trendLineY ?? 0) * vRatio;
        ctx.lineTo(x, y);
      }

      // End position: if last bar is transition, use interpolated point, else half-bar after
      let endX, endTrendY, endBaseY;
      if (lastTransitionData) {
        endX = lastTransitionData.x * hRatio;
        endTrendY = lastTransitionData.trendLineY * vRatio;
        endBaseY = lastTransitionData.baseLineY * vRatio;
      } else {
        const lastX = (lastBar.x ?? 0) * hRatio;
        endX = lastX + halfBarWidth;
        endTrendY = (lastBar.trendLineY ?? 0) * vRatio;
        endBaseY = (lastBar.baseLineY ?? 0) * vRatio;
      }

      ctx.lineTo(endX, endTrendY);

      // Draw base line path (right to left, reverse)
      ctx.lineTo(endX, endBaseY);

      for (let i = currentGroup.length - 1; i >= 0; i--) {
        const bar = currentGroup[i];
        const x = (bar.x ?? 0) * hRatio;
        const y = (bar.baseLineY ?? 0) * vRatio;
        ctx.lineTo(x, y);
      }

      // Return to start point
      ctx.lineTo(startX, startBaseY);

      ctx.closePath();
      ctx.fill();
    };

    // Track transition data for next group
    let transitionData: { x: number; trendLineY: number; baseLineY: number } | null = null;

    // Iterate through visible bars and group them
    for (let i = visibleRange.from; i < visibleRange.to; i++) {
      const bar = items[i];
      const nextBar = i + 1 < items.length ? items[i + 1] : null;

      if (!this._isValidCoordinates(bar) || bar.trendDirection === 0) {
        // Flush current group and skip
        flushGroup();
        currentGroup = [];
        currentColor = null;
        currentDirection = null;
        transitionData = null;
        continue;
      }

      // Check if next bar has different direction (this bar is end of trend)
      const isDirectionChange =
        nextBar &&
        this._isValidCoordinates(nextBar) &&
        nextBar.trendDirection !== 0 &&
        nextBar.trendDirection !== bar.trendDirection;

      // Start new group if color OR direction changes
      if (bar.fillColor !== currentColor || bar.trendDirection !== currentDirection) {
        flushGroup();

        // If starting after transition, use transition data
        const barToAdd = transitionData
          ? ({
              ...bar,
              transitionData: { ...transitionData },
            } as any)
          : bar;

        currentGroup = [barToAdd];
        currentColor = bar.fillColor;
        currentDirection = bar.trendDirection;
        transitionData = null;
      } else {
        currentGroup.push(bar);
      }

      // If direction changes at next bar, use next bar's coordinates as transition
      if (isDirectionChange && nextBar && currentGroup.length > 0) {
        // Use next bar's X position and current bar's Y values for transition
        // This extends the current trend to the start of the next bar
        const transitionX = nextBar.x ?? 0;
        const transitionTrendY = bar.trendLineY ?? 0;
        const transitionBaseY = bar.baseLineY ?? 0;

        // Store transition data for ending current group
        // Extend current trend to next bar's X position
        currentGroup[currentGroup.length - 1] = {
          ...currentGroup[currentGroup.length - 1],
          transitionData: {
            x: transitionX,
            trendLineY: transitionTrendY,
            baseLineY: transitionBaseY,
          },
        } as any;

        // Store transition data for starting next group
        // Next group starts at same X with its own trend values
        transitionData = {
          x: transitionX,
          trendLineY: nextBar.trendLineY ?? 0,
          baseLineY: nextBar.baseLineY ?? 0,
        };
      }
    }

    // Flush final group
    flushGroup();
  }

  /**
   * Draw trend lines with direction-based coloring
   * Matches ICustomSeries implementation exactly:
   * - Groups consecutive bars by color (trend direction)
   * - Uses moveTo when color changes (creates gap, no connection)
   * - Uses Path2D for efficient rendering
   */
  private _drawTrendLines(ctx: CanvasRenderingContext2D, hRatio: number, vRatio: number): void {
    const { items, visibleRange, lineWidth, lineStyle } = this._viewData.data;

    if (items.length === 0 || visibleRange === null) {
      return;
    }

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = lineWidth * vRatio;
    this._setLineStyle(ctx, lineStyle);

    // Group by color and draw (matches ICustomSeries lines 321-343)
    let currentColor: string | null = null;
    let currentPath: Path2D | null = null;

    for (let i = visibleRange.from; i < visibleRange.to; i++) {
      const item = items[i];
      if (!this._isValidCoordinates(item)) continue;

      const x = (item.x ?? 0) * hRatio;
      const y = (item.trendLineY ?? 0) * vRatio;

      // When color changes, stroke previous path and start new one
      if (item.lineColor !== currentColor) {
        if (currentPath && currentColor) {
          ctx.strokeStyle = currentColor;
          ctx.stroke(currentPath);
        }
        currentColor = item.lineColor;
        currentPath = new Path2D();
        currentPath.moveTo(x, y); // Start new path (creates gap)
      } else if (currentPath) {
        currentPath.lineTo(x, y); // Continue current path
      }
    }

    // Stroke final path
    if (currentPath && currentColor) {
      ctx.strokeStyle = currentColor;
      ctx.stroke(currentPath);
    }
  }

  /**
   * Apply line dash pattern
   */
  private _setLineStyle(ctx: CanvasRenderingContext2D, lineStyle: number): void {
    switch (lineStyle) {
      case 0:
        ctx.setLineDash([]);
        break;
      case 1:
        ctx.setLineDash([5, 5]);
        break;
      case 2:
        ctx.setLineDash([10, 5]);
        break;
      default:
        ctx.setLineDash([]);
    }
  }

  /**
   * Validate coordinates
   */
  private _isValidCoordinates(item: TrendFillRenderData): boolean {
    if (item.x === null || item.baseLineY === null || item.trendLineY === null) {
      return false;
    }

    const chartWidth = this._viewData.data.chartWidth || 800;
    const tolerance = 100;

    if (item.x < -tolerance || item.x > chartWidth + tolerance) {
      return false;
    }

    if (Math.abs(item.baseLineY) > 10000 || Math.abs(item.trendLineY) > 10000) {
      return false;
    }

    return true;
  }
}

// ============================================================================
// View Implementation
// ============================================================================

/**
 * Trend Fill Primitive View
 * Handles data processing and coordinate conversion
 */
class TrendFillPrimitiveView extends BaseSeriesPrimitivePaneView<
  TrendFillItem,
  TrendFillPrimitiveOptions
> {
  private _data: TrendFillViewData;

  constructor(source: TrendFillPrimitive) {
    super(source);
    this._data = {
      data: {
        items: [],
        timeScale: null,
        priceScale: null,
        chartWidth: 0,
        lineWidth: 1,
        lineStyle: 0,
        visibleRange: null,
        barSpacing: 1,
        useHalfBarWidth: false,
      },
      options: this._source.getOptions(),
    };
  }

  update() {
    const chart = this._source.getChart();
    const timeScale = chart.timeScale();
    const chartElement = chart.chartElement();
    const attachedSeries = this._source.getAttachedSeries();

    if (!timeScale || !chartElement || !attachedSeries) {
      return;
    }

    this._data.data.timeScale = timeScale;
    this._data.data.priceScale = attachedSeries; // Use attached series for coordinate conversion
    this._data.data.chartWidth = chartElement?.clientWidth || 800;
    this._data.data.useHalfBarWidth = this._source.getOptions().useHalfBarWidth ?? false;

    // Get bar spacing
    try {
      const extendedChart = chart as any;
      if (extendedChart._model?.timeScale?.barSpacing) {
        this._data.data.barSpacing = extendedChart._model.timeScale.barSpacing();
      } else {
        this._data.data.barSpacing = 6; // Default
      }
    } catch {
      this._data.data.barSpacing = 6;
    }

    // Convert coordinates
    const items = this._source.getProcessedData();
    const convertedItems = this._batchConvertCoordinates(items, timeScale, attachedSeries);

    this._data.data.visibleRange = this._calculateVisibleRange(convertedItems);
    this._data.data.items = convertedItems;
    this._data.data.lineWidth = this._source.getOptions().trendLine.lineWidth;
    this._data.data.lineStyle = this._source.getOptions().trendLine.lineStyle;
  }

  private _batchConvertCoordinates(
    items: TrendFillItem[],
    timeScale: any,
    attachedSeries: any
  ): TrendFillRenderData[] {
    if (!timeScale || !attachedSeries) {
      return [];
    }

    return items
      .map(item => {
        try {
          const x = timeScale.timeToCoordinate(item.time);
          const baseLineY = attachedSeries.priceToCoordinate(item.baseLine);
          const trendLineY = attachedSeries.priceToCoordinate(item.trendLine);

          if (x === null || baseLineY === null || trendLineY === null) {
            return null;
          }

          return {
            x,
            baseLineY,
            trendLineY,
            fillColor: item.fillColor,
            lineColor: item.lineColor,
            lineWidth: item.lineWidth,
            lineStyle: item.lineStyle,
            trendDirection: item.trendDirection,
          };
        } catch {
          return null;
        }
      })
      .filter(item => item !== null) as TrendFillRenderData[];
  }

  private _calculateVisibleRange(
    items: TrendFillRenderData[]
  ): { from: number; to: number } | null {
    if (items.length === 0) return null;
    return { from: 0, to: items.length };
  }

  renderer() {
    return new TrendFillPrimitiveRenderer(this._data);
  }

  zIndex(): number {
    const zIndex = this._source.getOptions().zIndex;
    if (typeof zIndex === 'number' && zIndex >= 0) {
      return zIndex;
    }
    return 0; // Default to normal layer (in front of grid)
  }
}

// ============================================================================
// Axis View Implementation
// ============================================================================

/**
 * Price Axis View for TrendFill Primitive
 *
 * Displays the last visible trend line value on the price axis with:
 * - Text: Trend line value formatted to 2 decimal places
 * - Background color: Solid version of uptrend/downtrend fill color based on direction
 * - Text color: White for optimal contrast
 *
 * The price axis view intelligently detects the last visible item using
 * time-based visible range detection, not just the last data item.
 */
class TrendFillPriceAxisView implements ISeriesPrimitiveAxisView {
  private _source: TrendFillPrimitive;

  constructor(source: TrendFillPrimitive) {
    this._source = source;
  }

  /**
   * Get Y-coordinate for the price axis label
   * Uses the trend line value of the last visible item
   */
  coordinate(): number {
    const lastItem = this._getLastVisibleItem();
    if (!lastItem) {
      return 0;
    }

    // Use the attached series for coordinate conversion
    const attachedSeries = this._source.getAttachedSeries();
    if (!attachedSeries) {
      return 0;
    }

    const coordinate = attachedSeries.priceToCoordinate(lastItem.trendLine);
    return coordinate ?? 0;
  }

  /**
   * Get text to display on price axis
   * Shows the trend line value formatted to 2 decimal places
   */
  text(): string {
    const lastItem = this._getLastVisibleItem();
    if (!lastItem) {
      return '';
    }

    // Format the trend line value
    return lastItem.trendLine.toFixed(2);
  }

  /**
   * Get text color for price axis label
   * Always returns white for optimal contrast against colored backgrounds
   */
  textColor(): string {
    // Always use white text for contrast
    return '#FFFFFF';
  }

  /**
   * Get background color for price axis label
   * Uses solid version of uptrend/downtrend fill color based on trend direction
   * Transparency is removed from fill color for better visibility
   */
  backColor(): string {
    const lastItem = this._getLastVisibleItem();
    if (!lastItem) {
      return 'transparent';
    }

    // Use trend direction to determine background color
    const isUptrend = lastItem.trendDirection > 0;
    const options = this._source.getOptions();

    // Use solid color based on trend direction (remove transparency for axis label)
    const fillColor = isUptrend ? options.uptrendFillColor : options.downtrendFillColor;
    return getSolidColorFromFill(fillColor);
  }

  /**
   * Determine if price axis label should be visible
   * Returns true when:
   * - We have data to display
   * - The primitive is visible (options.visible)
   * - The series' lastValueVisible option is NOT controlling this (primitive is independent)
   */
  visible(): boolean {
    // Check if we have data
    const lastItem = this._getLastVisibleItem();
    if (!lastItem) {
      return false;
    }

    // Check if primitive is visible
    if (!this._source.getOptions().visible) {
      return false;
    }

    // The primitive's price axis view should always be visible when primitive is used
    // (The series' lastValueVisible is set to false when primitive is enabled)
    return true;
  }

  tickVisible(): boolean {
    return true;
  }

  /**
   * Get the last visible item based on the chart's visible time range
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
   * @returns The last visible TrendFillItem, or null if no data
   */
  private _getLastVisibleItem(): TrendFillItem | null {
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

// ============================================================================
// Primitive Implementation
// ============================================================================

/**
 * Trend Fill Primitive
 * ISeriesPrimitive implementation with z-order control and price axis label
 */
export class TrendFillPrimitive extends BaseSeriesPrimitive<
  TrendFillItem,
  TrendFillPrimitiveOptions
> {
  private trendFillItems: TrendFillItem[] = [];

  constructor(
    chart: IChartApi,
    options: TrendFillPrimitiveOptions = {
      uptrendFillColor: 'rgba(76, 175, 80, 0.3)',
      downtrendFillColor: 'rgba(244, 67, 54, 0.3)',
      trendLine: {
        color: '#4CAF50',
        lineWidth: 2,
        lineStyle: 0,
        visible: true, // Show trend line by default
      },
      baseLine: {
        color: '#666666',
        lineWidth: 1,
        lineStyle: 1,
        visible: false,
      },
      visible: true,
      priceScaleId: 'right',
      useHalfBarWidth: true, // Enable to fill full bar width without gaps
      zIndex: 0, // Default to normal layer (in front of grid)
    }
  ) {
    super(chart, options);
  }

  // Required: Initialize views
  protected _initializeViews(): void {
    this._addPaneView(new TrendFillPrimitiveView(this));
    this._addPriceAxisView(new TrendFillPriceAxisView(this));
  }

  // Required: Process raw data
  protected _processData(_rawData: any[]): TrendFillItem[] {
    // This method will be called by the base class
    // For now, return the existing trendFillItems
    return this.trendFillItems;
  }

  // Optional: Custom z-order default
  protected _getDefaultZOrder(): PrimitivePaneViewZOrder {
    return 'normal'; // Render in normal layer (in front of grid)
  }

  setData(data: TrendFillPrimitiveData[]): void {
    // Store the raw data and process it
    (this as any)._rawData = data;
    this.processData();
    this.updateAllViews();
  }

  private processData(): void {
    this.trendFillItems = [];

    if (!(this as any)._rawData || (this as any)._rawData.length === 0) {
      return;
    }

    const sortedData = [...((this as any)._rawData as TrendFillPrimitiveData[])].sort((a, b) => {
      const timeA = parseTime(a.time);
      const timeB = parseTime(b.time);
      return timeA - timeB;
    });

    for (const item of sortedData) {
      const time = parseTime(item.time);
      const baseLine = item.base_line ?? item.baseLine;
      const trendLine = item.trend_line ?? item.trendLine;
      const trendDirection = item.trend_direction ?? item.trendDirection;

      if (
        baseLine === null ||
        baseLine === undefined ||
        trendDirection === null ||
        trendDirection === undefined ||
        trendDirection === 0 ||
        trendLine === null ||
        trendLine === undefined
      ) {
        continue;
      }

      const isUptrend = trendDirection > 0;
      const fillColor = isUptrend
        ? this._options.uptrendFillColor
        : this._options.downtrendFillColor;

      // Use fill color for line color (matches ICustomSeries logic at line 218)
      const lineColor = isUptrend
        ? this._options.uptrendFillColor
        : this._options.downtrendFillColor;

      this.trendFillItems.push({
        time,
        baseLine,
        trendLine,
        trendDirection,
        fillColor,
        lineColor,
        lineWidth: this._options.trendLine.lineWidth,
        lineStyle: this._options.trendLine.lineStyle,
      });
    }
  }

  applyOptions(options: Partial<TrendFillPrimitiveOptions>): void {
    this._options = { ...this._options, ...options };
    this.processData();
    this.updateAllViews();
  }

  destroy(): void {
    // Nothing to clean up - no series created
  }

  // Getters
  getOptions(): TrendFillPrimitiveOptions {
    return this._options;
  }

  getChart(): IChartApi {
    return this._chart;
  }

  getProcessedData(): TrendFillItem[] {
    return this.trendFillItems;
  }

  getAttachedSeries(): any {
    return this._series;
  }

  // Override updateAllViews to also update pane views
  updateAllViews(): void {
    super.updateAllViews();
    // Also update the pane views directly for compatibility
    this._paneViews.forEach(pv => {
      if ('update' in pv && typeof pv.update === 'function') {
        pv.update();
      }
    });
  }

  timeAxisViews(): ISeriesPrimitiveAxisView[] {
    return [];
  }
}
