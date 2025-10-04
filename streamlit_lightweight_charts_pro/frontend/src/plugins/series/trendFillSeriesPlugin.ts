/**
 * Trend Fill Series - ICustomSeries Implementation
 *
 * A custom series for TradingView Lightweight Charts that renders filled areas
 * between trend and base lines with direction-based coloring.
 *
 * Common use cases:
 * - Supertrend indicators
 * - Moving average envelopes
 * - Bollinger Bands with trend direction
 * - Any trend-following indicator with fills
 *
 * Rendering (default behavior):
 * - Fill area: Filled between trend and base lines with direction-based color ✅
 * - Trend line: Drawn with direction-based color ✅
 * - Base line: NOT drawn (hidden, only used for fill boundaries) ❌
 *
 * Architecture:
 * - Follows official Lightweight Charts ICustomSeries pattern
 * - Based on hlc-area-series example from TradingView
 * - Coordinates transformed once to bitmap space for performance
 * - Path2D used for efficient rendering
 *
 * @see https://tradingview.github.io/lightweight-charts/docs/api/interfaces/ICustomSeriesPaneView
 */

import {
  CustomData,
  ICustomSeriesPaneView,
  Time,
  customSeriesDefaultOptions,
  CustomSeriesOptions,
  PaneRendererCustomData,
  CustomSeriesPricePlotValues,
  CustomSeriesWhitespaceData,
  PriceToCoordinateConverter,
  LineWidth,
  ICustomSeriesPaneRenderer,
} from 'lightweight-charts';
import {
  BitmapCoordinatesRenderingScope,
} from 'fancy-canvas';
import {
  isWhitespaceDataMultiField,
} from './base/BaseCustomSeriesView';
import {
  LineStyle,
} from '../../utils/renderingUtils';
import { TrendFillPrimitive } from '../../primitives/TrendFillPrimitive';

// ============================================================================
// Data Interface
// ============================================================================

/**
 * Data point for TrendFill series
 *
 * @property time - Timestamp for the data point
 * @property baseLine - Y value of the base/reference line
 * @property trendLine - Y value of the trend line
 * @property trendDirection - Trend direction: -1 (downtrend), 0 (neutral), 1 (uptrend)
 */
export interface TrendFillData extends CustomData<Time> {
  time: Time;
  baseLine: number;
  trendLine: number;
  trendDirection: number;
}

// ============================================================================
// Options Interface
// ============================================================================

/**
 * Configuration options for TrendFill series
 *
 * Fill Colors:
 * @property uptrendFillColor - Fill color for uptrend areas (supports rgba)
 * @property downtrendFillColor - Fill color for downtrend areas (supports rgba)
 * @property fillVisible - Toggle fill visibility
 *
 * Trend Line:
 * @property trendLineColor - Color of the trend line (overridden by trend direction colors)
 * @property trendLineWidth - Width of the trend line in pixels
 * @property trendLineStyle - Line style (Solid, Dotted, Dashed, etc.)
 * @property trendLineVisible - Toggle trend line visibility
 *
 * Base Line:
 * @property baseLineColor - Color of the base/reference line
 * @property baseLineWidth - Width of the base line in pixels
 * @property baseLineStyle - Line style (Solid, Dotted, Dashed, etc.)
 * @property baseLineVisible - Toggle base line visibility
 */
export interface TrendFillSeriesOptions extends CustomSeriesOptions {
  uptrendFillColor: string;
  downtrendFillColor: string;
  fillVisible: boolean;

  trendLineColor: string;
  trendLineWidth: LineWidth;
  trendLineStyle: LineStyle;
  trendLineVisible: boolean;

  baseLineColor: string;
  baseLineWidth: LineWidth;
  baseLineStyle: LineStyle;
  baseLineVisible: boolean;

  // Internal flag (set automatically by factory)
  _usePrimitive?: boolean;
}

// ============================================================================
// Renderer Implementation
// ============================================================================

/**
 * Bar item with coordinates for rendering
 */
interface TrendFillBarItem {
  x: number;
  baseLineY: number;
  trendLineY: number;
  trendDirection: number;
  fillColor: string;
  lineColor: string;
}

/**
 * Renderer for TrendFill series
 *
 * Implements the ICustomSeriesPaneRenderer interface to draw trend fills on canvas.
 * Follows the official Lightweight Charts pattern from hlc-area-series example.
 *
 * Rendering Strategy:
 * - Transforms all coordinates to bitmap space once for performance
 * - Uses Path2D for efficient path management
 * - Groups consecutive bars by trend direction to create fill segments
 * - Draws in z-order: fills (back) → base line (middle) → trend line (front)
 *
 * @template TData - The data type extending TrendFillData
 * @internal
 */
class TrendFillSeriesRenderer<TData extends TrendFillData>
  implements ICustomSeriesPaneRenderer
{
  _data: PaneRendererCustomData<Time, TData> | null = null;
  _options: TrendFillSeriesOptions | null = null;

  draw(
    target: any,
    priceConverter: PriceToCoordinateConverter
  ): void {
    target.useBitmapCoordinateSpace((scope: BitmapCoordinatesRenderingScope) =>
      this._drawImpl(scope, priceConverter)
    );
  }

  update(
    data: PaneRendererCustomData<Time, TData>,
    options: TrendFillSeriesOptions
  ): void {
    this._data = data;
    this._options = options;
  }

  /**
   * Main drawing implementation
   *
   * Transforms data to bitmap coordinates and delegates to drawing methods.
   * Called by draw() within useBitmapCoordinateSpace for proper pixel rendering.
   *
   * @param renderingScope - Bitmap rendering scope with pixel ratios
   * @param priceToCoordinate - Function to convert price to Y coordinate
   */
  _drawImpl(
    renderingScope: BitmapCoordinatesRenderingScope,
    priceToCoordinate: PriceToCoordinateConverter
  ): void {
    // Early exit if no data to render
    if (
      this._data === null ||
      this._data.bars.length === 0 ||
      this._data.visibleRange === null ||
      this._options === null
    ) {
      return;
    }

    // Early exit if primitive handles rendering
    if (this._options._usePrimitive) {
      return;
    }

    const options = this._options;
    const visibleRange = this._data.visibleRange;

    // Transform all bars to bitmap coordinates once (performance optimization)
    const bars: TrendFillBarItem[] = this._data.bars.map(bar => {
      const { baseLine, trendLine, trendDirection } = bar.originalData;
      const isUptrend = trendDirection > 0;

      return {
        x: bar.x * renderingScope.horizontalPixelRatio,
        baseLineY: (priceToCoordinate(baseLine) ?? 0) * renderingScope.verticalPixelRatio,
        trendLineY: (priceToCoordinate(trendLine) ?? 0) * renderingScope.verticalPixelRatio,
        trendDirection,
        fillColor: isUptrend ? options.uptrendFillColor : options.downtrendFillColor,
        lineColor: isUptrend ? options.uptrendFillColor : options.downtrendFillColor,
      };
    });

    const ctx = renderingScope.context;

    // Draw in z-order (background to foreground)
    if (options.fillVisible) {
      this._drawFills(ctx, bars, visibleRange);
    }

    if (options.baseLineVisible) {
      this._drawBaseLine(ctx, bars, visibleRange);
    }

    if (options.trendLineVisible) {
      this._drawTrendLine(ctx, bars, visibleRange);
    }
  }

  /**
   * Draw filled areas between trend and base lines
   */
  private _drawFills(
    ctx: CanvasRenderingContext2D,
    bars: TrendFillBarItem[],
    visibleRange: { from: number; to: number }
  ): void {
    // Group consecutive bars with same trend direction
    let currentGroup: TrendFillBarItem[] = [];
    let currentColor: string | null = null;
    let currentDirection: number | null = null;

    const flushGroup = () => {
      if (currentGroup.length < 1 || !currentColor) return;

      // Draw continuous fill for this group
      ctx.fillStyle = currentColor;
      ctx.beginPath();

      // Draw trend line path (left to right)
      const firstBar = currentGroup[0];
      ctx.moveTo(firstBar.x, firstBar.trendLineY);

      for (let i = 1; i < currentGroup.length; i++) {
        ctx.lineTo(currentGroup[i].x, currentGroup[i].trendLineY);
      }

      // Draw base line path (right to left, reverse)
      for (let i = currentGroup.length - 1; i >= 0; i--) {
        ctx.lineTo(currentGroup[i].x, currentGroup[i].baseLineY);
      }

      ctx.closePath();
      ctx.fill();
    };

    // Iterate through visible bars and group them
    for (let i = visibleRange.from; i < visibleRange.to; i++) {
      const bar = bars[i];

      // Skip neutral bars
      if (bar.trendDirection === 0) {
        flushGroup();
        currentGroup = [];
        currentColor = null;
        currentDirection = null;
        continue;
      }

      // Start new group if color or direction changes
      if (bar.fillColor !== currentColor || bar.trendDirection !== currentDirection) {
        flushGroup();
        currentGroup = [bar];
        currentColor = bar.fillColor;
        currentDirection = bar.trendDirection;
      } else {
        currentGroup.push(bar);
      }
    }

    flushGroup();
  }

  /**
   * Draw trend line with direction-based coloring
   */
  private _drawTrendLine(
    ctx: CanvasRenderingContext2D,
    bars: TrendFillBarItem[],
    visibleRange: { from: number; to: number }
  ): void {
    if (!this._options) return;

    ctx.lineWidth = this._options.trendLineWidth;
    this._applyLineStyle(ctx, this._options.trendLineStyle);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Group by color and draw
    let currentColor: string | null = null;
    let currentPath: Path2D | null = null;

    for (let i = visibleRange.from; i < visibleRange.to; i++) {
      const bar = bars[i];
      const x = bar.x;
      const y = bar.trendLineY;

      // When color changes, stroke previous path and start new one
      if (bar.lineColor !== currentColor) {
        if (currentPath && currentColor) {
          ctx.strokeStyle = currentColor;
          ctx.stroke(currentPath);
        }
        currentColor = bar.lineColor;
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
   * Draw base line
   */
  private _drawBaseLine(
    ctx: CanvasRenderingContext2D,
    bars: TrendFillBarItem[],
    visibleRange: { from: number; to: number }
  ): void {
    if (!this._options) return;

    const baseLine = new Path2D();
    const firstBar = bars[visibleRange.from];
    baseLine.moveTo(firstBar.x, firstBar.baseLineY);

    for (let i = visibleRange.from + 1; i < visibleRange.to; i++) {
      baseLine.lineTo(bars[i].x, bars[i].baseLineY);
    }

    ctx.lineJoin = 'round';
    ctx.strokeStyle = this._options.baseLineColor;
    ctx.lineWidth = this._options.baseLineWidth;
    this._applyLineStyle(ctx, this._options.baseLineStyle);
    ctx.stroke(baseLine);
  }

  /**
   * Apply line dash pattern based on LineStyle
   */
  private _applyLineStyle(ctx: CanvasRenderingContext2D, style: LineStyle): void {
    switch (style) {
      case LineStyle.Solid:
        ctx.setLineDash([]);
        break;
      case LineStyle.Dotted:
        ctx.setLineDash([1, 1]);
        break;
      case LineStyle.Dashed:
        ctx.setLineDash([4, 2]);
        break;
      case LineStyle.LargeDashed:
        ctx.setLineDash([8, 4]);
        break;
      case LineStyle.SparseDotted:
        ctx.setLineDash([1, 4]);
        break;
      default:
        ctx.setLineDash([]);
    }
  }
}

// ============================================================================
// View Implementation
// ============================================================================

/**
 * View class for TrendFill series
 *
 * Implements ICustomSeriesPaneView to integrate with Lightweight Charts.
 * Delegates rendering to TrendFillSeriesRenderer and manages series lifecycle.
 *
 * @template TData - Data type extending TrendFillData
 * @internal
 */
class TrendFillSeries<TData extends TrendFillData>
  implements ICustomSeriesPaneView<Time, TData, TrendFillSeriesOptions>
{
  _renderer: TrendFillSeriesRenderer<TData>;

  constructor() {
    this._renderer = new TrendFillSeriesRenderer();
  }

  /**
   * Build price values for autoscaling
   *
   * Returns [min, max] to ensure both trend and base lines are visible.
   *
   * @param plotRow - Data point
   * @returns Price values array
   */
  priceValueBuilder(plotRow: TData): CustomSeriesPricePlotValues {
    return [
      Math.min(plotRow.baseLine, plotRow.trendLine),
      Math.max(plotRow.baseLine, plotRow.trendLine),
    ];
  }

  /**
   * Determine if data point is whitespace (gap)
   *
   * A point is considered whitespace if either baseLine or trendLine is missing.
   *
   * @param data - Data point to check
   * @returns True if whitespace
   */
  isWhitespace(data: TData | CustomSeriesWhitespaceData<Time>): data is CustomSeriesWhitespaceData<Time> {
    return isWhitespaceDataMultiField(data, ['baseLine', 'trendLine']);
  }

  renderer(): TrendFillSeriesRenderer<TData> {
    return this._renderer;
  }

  update(
    data: PaneRendererCustomData<Time, TData>,
    options: TrendFillSeriesOptions
  ): void {
    this._renderer.update(data, options);
  }

  /**
   * Default options for TrendFill series
   *
   * @returns Default configuration with green uptrend and red downtrend fills
   */
  defaultOptions(): TrendFillSeriesOptions {
    return {
      ...customSeriesDefaultOptions,
      uptrendFillColor: 'rgba(76, 175, 80, 0.3)',
      downtrendFillColor: 'rgba(244, 67, 54, 0.3)',
      fillVisible: true,

      trendLineColor: '#2196F3',
      trendLineWidth: 2,
      trendLineStyle: LineStyle.Solid,
      trendLineVisible: true, // Show trend line by default

      baseLineColor: '#666666',
      baseLineWidth: 1,
      baseLineStyle: LineStyle.Dotted,
      baseLineVisible: false, // Hide base line by default
    };
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Factory function to create TrendFill series instance
 *
 * This is the main entry point for creating a TrendFill custom series.
 * Called from seriesFactory to create the series with all options.
 *
 * Two rendering modes:
 * 1. **Direct ICustomSeries rendering (default)**
 *    - Series renders its own visuals
 *    - Renders on top of other series (normal z-order)
 *    - Best for most use cases
 *    - Price axis label managed by series
 *
 * 2. **Primitive rendering mode (usePrimitive: true)**
 *    - Series provides autoscaling only
 *    - Primitive attached to series handles rendering
 *    - Renders behind other series (negative z-index)
 *    - Price axis label managed by primitive
 *    - Series' lastValueVisible set to false (primitive handles it)
 *    - Best when you need background fills behind other indicators
 *
 * Default values:
 * - uptrendFillColor: 'rgba(76, 175, 80, 0.3)' (green)
 * - downtrendFillColor: 'rgba(244, 67, 54, 0.3)' (red)
 * - trendLineStyle: LineStyle.Solid
 * - baseLineStyle: LineStyle.Dotted
 * - zIndex: -100 (when using primitive)
 * - useHalfBarWidth: false (full bar width fills)
 *
 * Line style support:
 * - ICustomSeries: All LineStyle values (Solid, Dotted, Dashed, LargeDashed, SparseDotted)
 * - Primitive: Limited to Solid (0), Dotted (1), Dashed (2) - others clamped to Dashed
 *
 * @example Standard usage (via seriesFactory):
 * ```typescript
 * // In seriesFactory.ts
 * const series = createTrendFillSeries(chart, {
 *   uptrendFillColor: 'rgba(76, 175, 80, 0.3)',
 *   downtrendFillColor: 'rgba(244, 67, 54, 0.3)',
 * });
 * series.setData(data);
 * ```
 *
 * @example With primitive for background rendering:
 * ```typescript
 * const series = createTrendFillSeries(chart, {
 *   uptrendFillColor: 'rgba(76, 175, 80, 0.3)',
 *   downtrendFillColor: 'rgba(244, 67, 54, 0.3)',
 *   // Primitive-specific options
 *   usePrimitive: true,
 *   zIndex: -100, // Render behind series
 *   useHalfBarWidth: false, // Full width fills
 * });
 * series.setData(data); // Sets data on series for autoscaling
 * // Primitive automatically syncs data from series
 * ```
 *
 * @param chart - Chart instance from Lightweight Charts
 * @param options - Combined series and primitive options
 * @param options.uptrendFillColor - Fill color for uptrend areas (default: green rgba)
 * @param options.downtrendFillColor - Fill color for downtrend areas (default: red rgba)
 * @param options.fillVisible - Show/hide fills (default: true)
 * @param options.trendLineColor - Trend line color (default: blue)
 * @param options.trendLineWidth - Trend line width 1-4 (default: 2)
 * @param options.trendLineStyle - Line style (default: Solid)
 * @param options.trendLineVisible - Show/hide trend line (default: true)
 * @param options.baseLineColor - Base line color (default: gray)
 * @param options.baseLineWidth - Base line width 1-4 (default: 1)
 * @param options.baseLineStyle - Line style (default: Dotted)
 * @param options.baseLineVisible - Show/hide base line (default: false)
 * @param options.priceScaleId - Price scale ID (default: 'right')
 * @param options.usePrimitive - Enable primitive rendering mode (default: false)
 * @param options.zIndex - Z-order for primitive mode (default: -100)
 * @param options.useHalfBarWidth - Half bar width fills in primitive mode (default: false)
 * @param options.data - Initial data array (optional)
 * @returns ICustomSeries instance (with optional primitive attached)
 */
export function createTrendFillSeries(
  chart: any,
  options: {
    // ICustomSeries options
    uptrendFillColor?: string;
    downtrendFillColor?: string;
    fillVisible?: boolean;
    trendLineColor?: string;
    trendLineWidth?: LineWidth;
    trendLineStyle?: LineStyle;
    trendLineVisible?: boolean;
    baseLineColor?: string;
    baseLineWidth?: LineWidth;
    baseLineStyle?: LineStyle;
    baseLineVisible?: boolean;
    priceScaleId?: string;

    // Primitive-specific options (optional)
    usePrimitive?: boolean;
    zIndex?: number;
    useHalfBarWidth?: boolean;
    data?: any[];
  } = {}
): any {
  // Create the ICustomSeries
  const series = chart.addCustomSeries(new TrendFillSeries(), {
    uptrendFillColor: options.uptrendFillColor ?? 'rgba(76, 175, 80, 0.3)',
    downtrendFillColor: options.downtrendFillColor ?? 'rgba(244, 67, 54, 0.3)',
    fillVisible: options.fillVisible !== false,
    trendLineColor: options.trendLineColor ?? '#2196F3',
    trendLineWidth: options.trendLineWidth ?? 2,
    trendLineStyle: options.trendLineStyle ?? LineStyle.Solid,
    trendLineVisible: options.trendLineVisible !== false,
    baseLineColor: options.baseLineColor ?? '#666666',
    baseLineWidth: options.baseLineWidth ?? 1,
    baseLineStyle: options.baseLineStyle ?? LineStyle.Dotted,
    baseLineVisible: options.baseLineVisible === true,
    priceScaleId: options.priceScaleId ?? 'right',
    lastValueVisible: !options.usePrimitive, // Hide series label when primitive handles it
    _usePrimitive: options.usePrimitive ?? false, // Internal flag to disable rendering
  });

  // Set data on series (for autoscaling)
  if (options.data && options.data.length > 0) {
    series.setData(options.data);
  }

  // If using primitive, create and attach it
  if (options.usePrimitive) {
    const primitive = new TrendFillPrimitive(chart, {
      uptrendFillColor: options.uptrendFillColor ?? 'rgba(76, 175, 80, 0.3)',
      downtrendFillColor: options.downtrendFillColor ?? 'rgba(244, 67, 54, 0.3)',
      trendLine: {
        color: options.trendLineColor ?? '#2196F3',
        lineWidth: options.trendLineWidth ?? 2,
        lineStyle: Math.min((options.trendLineStyle ?? LineStyle.Solid), 2) as 0 | 1 | 2,
        visible: options.trendLineVisible !== false,
      },
      baseLine: {
        color: options.baseLineColor ?? '#666666',
        lineWidth: options.baseLineWidth ?? 1,
        lineStyle: Math.min((options.baseLineStyle ?? LineStyle.Dotted), 2) as 0 | 1 | 2,
        visible: options.baseLineVisible === true,
      },
      visible: true,
      priceScaleId: options.priceScaleId ?? 'right',
      useHalfBarWidth: options.useHalfBarWidth !== false,
      zIndex: options.zIndex ?? 0,
    });

    // Attach primitive to series
    series.attachPrimitive(primitive);

    // Set data on primitive (for rendering)
    if (options.data && options.data.length > 0) {
      primitive.setData(options.data);
    }
  }

  return series;
}
