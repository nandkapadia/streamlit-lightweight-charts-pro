/**
 * Trend Fill Series - ICustomSeries Implementation
 *
 * A custom series for rendering filled areas between trend and base lines
 * with direction-based coloring.
 *
 * Features:
 * - Direction-based fill colors (uptrend/downtrend)
 * - Direction-based line colors
 * - Separate base line styling
 * - Full autoscaling support
 *
 * Use cases:
 * - Supertrend indicators
 * - Moving average envelopes
 * - Any trend-following indicator with fills
 */

import {
  CustomData,
  Time,
  customSeriesDefaultOptions,
  CustomSeriesOptions,
  PaneRendererCustomData,
  CustomSeriesPricePlotValues,
  CustomSeriesWhitespaceData,
  ICustomSeriesPaneRenderer,
  ICustomSeriesPaneView,
  LineWidth,
  PriceToCoordinateConverter,
} from 'lightweight-charts';
import { BitmapCoordinatesRenderingScope, CanvasRenderingTarget2D } from 'fancy-canvas';
import { isWhitespaceDataMultiField, LineStyle } from '../shared/rendering';

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
 */
export interface TrendFillSeriesOptions extends CustomSeriesOptions {
  // Fill colors
  uptrendFillColor: string;
  downtrendFillColor: string;
  fillVisible: boolean;

  // Uptrend line styling
  uptrendLineColor: string;
  uptrendLineWidth: LineWidth;
  uptrendLineStyle: LineStyle;
  uptrendLineVisible: boolean;

  // Downtrend line styling
  downtrendLineColor: string;
  downtrendLineWidth: LineWidth;
  downtrendLineStyle: LineStyle;
  downtrendLineVisible: boolean;

  // Base line styling
  baseLineColor: string;
  baseLineWidth: LineWidth;
  baseLineStyle: LineStyle;
  baseLineVisible: boolean;

  // Series options
  lastValueVisible: boolean;
  title: string;
  visible: boolean;
  priceLineVisible: boolean;
}

/**
 * Default options for TrendFill series
 */
export const defaultTrendFillOptions: TrendFillSeriesOptions = {
  ...customSeriesDefaultOptions,
  uptrendFillColor: 'rgba(76, 175, 80, 0.3)',
  downtrendFillColor: 'rgba(244, 67, 54, 0.3)',
  fillVisible: true,
  uptrendLineColor: '#4CAF50',
  uptrendLineWidth: 2,
  uptrendLineStyle: LineStyle.Solid,
  uptrendLineVisible: true,
  downtrendLineColor: '#F44336',
  downtrendLineWidth: 2,
  downtrendLineStyle: LineStyle.Solid,
  downtrendLineVisible: true,
  baseLineColor: '#666666',
  baseLineWidth: 1,
  baseLineStyle: LineStyle.Dotted,
  baseLineVisible: false,
};

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
  lineWidth: number;
  lineStyle: LineStyle;
}

/**
 * TrendFill Series Renderer - ICustomSeries
 */
class TrendFillSeriesRenderer<TData extends TrendFillData = TrendFillData>
  implements ICustomSeriesPaneRenderer
{
  private _data: PaneRendererCustomData<Time, TData> | null = null;
  private _options: TrendFillSeriesOptions | null = null;

  update(data: PaneRendererCustomData<Time, TData>, options: TrendFillSeriesOptions): void {
    this._data = data;
    this._options = options;
  }

  draw(
    target: CanvasRenderingTarget2D,
    priceConverter: PriceToCoordinateConverter,
    _isHovered: boolean,
    _hitTestData?: unknown
  ): void {
    target.useBitmapCoordinateSpace((scope: BitmapCoordinatesRenderingScope) => {
      this._drawImpl(scope, priceConverter);
    });
  }

  private _drawImpl(
    renderingScope: BitmapCoordinatesRenderingScope,
    priceToCoordinate: PriceToCoordinateConverter
  ): void {
    if (
      this._data === null ||
      this._data.bars.length === 0 ||
      this._data.visibleRange === null ||
      this._options === null
    ) {
      return;
    }

    const options = this._options;
    const visibleRange = this._data.visibleRange;

    // Transform all bars to bitmap coordinates once
    const bars: TrendFillBarItem[] = this._data.bars.map(bar => {
      const { baseLine, trendLine, trendDirection } = bar.originalData;
      const isUptrend = trendDirection > 0;

      return {
        x: bar.x * renderingScope.horizontalPixelRatio,
        baseLineY: (priceToCoordinate(baseLine) ?? 0) * renderingScope.verticalPixelRatio,
        trendLineY: (priceToCoordinate(trendLine) ?? 0) * renderingScope.verticalPixelRatio,
        trendDirection,
        fillColor: isUptrend ? options.uptrendFillColor : options.downtrendFillColor,
        lineColor: isUptrend ? options.uptrendLineColor : options.downtrendLineColor,
        lineWidth: isUptrend ? options.uptrendLineWidth : options.downtrendLineWidth,
        lineStyle: isUptrend ? options.uptrendLineStyle : options.downtrendLineStyle,
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

    if (options.uptrendLineVisible || options.downtrendLineVisible) {
      this._drawTrendLine(ctx, bars, visibleRange);
    }
  }

  private _drawFills(
    ctx: CanvasRenderingContext2D,
    bars: TrendFillBarItem[],
    visibleRange: { from: number; to: number }
  ): void {
    let currentGroup: TrendFillBarItem[] = [];
    let currentColor: string | null = null;
    let currentDirection: number | null = null;

    const flushGroup = () => {
      if (currentGroup.length < 1 || !currentColor) return;

      ctx.fillStyle = currentColor;
      ctx.beginPath();

      const firstBar = currentGroup[0];
      ctx.moveTo(firstBar.x, firstBar.trendLineY);

      for (let i = 1; i < currentGroup.length; i++) {
        ctx.lineTo(currentGroup[i].x, currentGroup[i].trendLineY);
      }

      for (let i = currentGroup.length - 1; i >= 0; i--) {
        ctx.lineTo(currentGroup[i].x, currentGroup[i].baseLineY);
      }

      ctx.closePath();
      ctx.fill();
    };

    for (let i = visibleRange.from; i < visibleRange.to; i++) {
      const bar = bars[i];

      if (bar.trendDirection === 0) {
        flushGroup();
        currentGroup = [];
        currentColor = null;
        currentDirection = null;
        continue;
      }

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

  private _drawTrendLine(
    ctx: CanvasRenderingContext2D,
    bars: TrendFillBarItem[],
    visibleRange: { from: number; to: number }
  ): void {
    if (!this._options) return;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    let currentColor: string | null = null;
    let currentWidth: number | null = null;
    let currentStyle: LineStyle | null = null;
    let currentPath: Path2D | null = null;

    for (let i = visibleRange.from; i < visibleRange.to; i++) {
      const bar = bars[i];
      const x = bar.x;
      const y = bar.trendLineY;

      if (
        bar.lineColor !== currentColor ||
        bar.lineWidth !== currentWidth ||
        bar.lineStyle !== currentStyle
      ) {
        if (currentPath && currentColor && currentWidth && currentStyle !== null) {
          ctx.strokeStyle = currentColor;
          ctx.lineWidth = currentWidth;
          this._applyLineStyle(ctx, currentStyle);
          ctx.stroke(currentPath);
        }
        currentColor = bar.lineColor;
        currentWidth = bar.lineWidth;
        currentStyle = bar.lineStyle;
        currentPath = new Path2D();
        currentPath.moveTo(x, y);
      } else if (currentPath) {
        currentPath.lineTo(x, y);
      }
    }

    if (currentPath && currentColor && currentWidth && currentStyle !== null) {
      ctx.strokeStyle = currentColor;
      ctx.lineWidth = currentWidth;
      this._applyLineStyle(ctx, currentStyle);
      ctx.stroke(currentPath);
    }
  }

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
// ICustomSeries Implementation
// ============================================================================

/**
 * TrendFill Series - ICustomSeries implementation
 * Provides autoscaling and direct rendering
 */
export class TrendFillSeries<TData extends TrendFillData = TrendFillData>
  implements ICustomSeriesPaneView<Time, TData, TrendFillSeriesOptions>
{
  private _renderer: TrendFillSeriesRenderer<TData>;

  constructor() {
    this._renderer = new TrendFillSeriesRenderer();
  }

  priceValueBuilder(plotRow: TData): CustomSeriesPricePlotValues {
    return [
      Math.min(plotRow.baseLine, plotRow.trendLine),
      Math.max(plotRow.baseLine, plotRow.trendLine),
      plotRow.trendLine,
    ];
  }

  isWhitespace(
    data: TData | CustomSeriesWhitespaceData<Time>
  ): data is CustomSeriesWhitespaceData<Time> {
    return isWhitespaceDataMultiField(data, ['baseLine', 'trendLine']);
  }

  renderer(): ICustomSeriesPaneRenderer {
    return this._renderer;
  }

  update(data: PaneRendererCustomData<Time, TData>, options: TrendFillSeriesOptions): void {
    this._renderer.update(data, options);
  }

  defaultOptions(): TrendFillSeriesOptions {
    return defaultTrendFillOptions;
  }
}

/**
 * Factory function to create TrendFill series plugin
 */
export function TrendFillSeriesPlugin(): ICustomSeriesPaneView<
  Time,
  TrendFillData,
  TrendFillSeriesOptions
> {
  return new TrendFillSeries();
}
