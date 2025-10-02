/**
 * Shared TrendFill Renderer
 *
 * Common rendering logic for TrendFill visualization used by both:
 * - ICustomSeries (trendFillSeriesPlugin.ts)
 * - ISeriesPrimitive (TrendFillPrimitive.ts)
 *
 * This ensures consistent rendering behavior across both implementations.
 */

import { LineStyle } from '../utils/renderingUtils';

// ============================================================================
// Types
// ============================================================================

/**
 * Bar data with coordinates and styling
 */
export interface TrendFillBarData {
  x: number;
  trendLineY: number;
  baseLineY: number;
  trendDirection: number;
  fillColor: string;
  lineColor: string;
  transitionData?: {
    x: number;
    trendLineY: number;
    baseLineY: number;
  };
}

/**
 * Options for rendering
 */
export interface TrendFillRenderOptions {
  // Fill options
  fillVisible: boolean;
  uptrendFillColor: string;
  downtrendFillColor: string;

  // Trend line options
  trendLineVisible: boolean;
  trendLineColor: string;
  trendLineWidth: number;
  trendLineStyle: LineStyle;

  // Base line options
  baseLineVisible: boolean;
  baseLineColor: string;
  baseLineWidth: number;
  baseLineStyle: LineStyle;

  // Bar width handling
  useHalfBarWidth?: boolean;
  barSpacing?: number;
}

// ============================================================================
// Shared Renderer
// ============================================================================

/**
 * Shared renderer for TrendFill visualization
 *
 * Provides common drawing methods that work for both ICustomSeries and ISeriesPrimitive
 */
export class TrendFillRenderer {
  /**
   * Draw filled areas between trend and base lines
   *
   * @param ctx - Canvas 2D rendering context (bitmap space)
   * @param bars - Bar data with coordinates
   * @param visibleRange - Range of visible bar indices
   * @param options - Rendering options
   * @param hRatio - Horizontal pixel ratio (for primitive, 1 for custom series)
   * @param vRatio - Vertical pixel ratio (for primitive, 1 for custom series)
   */
  static drawFills(
    ctx: CanvasRenderingContext2D,
    bars: TrendFillBarData[],
    visibleRange: { from: number; to: number },
    options: TrendFillRenderOptions,
    hRatio: number = 1,
    vRatio: number = 1
  ): void {
    if (bars.length === 0 || visibleRange === null) {
      return;
    }

    // Calculate half bar width if enabled
    const halfBarWidth = options.useHalfBarWidth && options.barSpacing
      ? (options.barSpacing * hRatio) / 2
      : 0;

    // Group consecutive bars with same trend direction
    let currentGroup: TrendFillBarData[] = [];
    let currentColor: string | null = null;
    let currentDirection: number | null = null;

    const flushGroup = () => {
      if (currentGroup.length < 1 || !currentColor) return;

      // Draw continuous fill for this group
      ctx.fillStyle = currentColor;
      ctx.beginPath();

      // Get first and last bars
      const firstBar = currentGroup[0];
      const lastBar = currentGroup[currentGroup.length - 1];

      // Start position (with half bar width offset)
      const startX = firstBar.x * hRatio - halfBarWidth;
      const startTrendY = firstBar.trendLineY * vRatio;
      const startBaseY = firstBar.baseLineY * vRatio;

      ctx.moveTo(startX, startTrendY);

      // Draw to each bar's trend line
      for (let i = 0; i < currentGroup.length; i++) {
        const bar = currentGroup[i];
        ctx.lineTo(bar.x * hRatio, bar.trendLineY * vRatio);
      }

      // End position (with half bar width offset)
      const endX = lastBar.x * hRatio + halfBarWidth;
      const endTrendY = lastBar.trendLineY * vRatio;
      const endBaseY = lastBar.baseLineY * vRatio;

      ctx.lineTo(endX, endTrendY);

      // Draw base line path (right to left, reverse)
      ctx.lineTo(endX, endBaseY);

      for (let i = currentGroup.length - 1; i >= 0; i--) {
        const bar = currentGroup[i];
        ctx.lineTo(bar.x * hRatio, bar.baseLineY * vRatio);
      }

      // Return to start
      ctx.lineTo(startX, startBaseY);

      ctx.closePath();
      ctx.fill();
    };

    // Iterate through visible bars and group them
    for (let i = visibleRange.from; i < visibleRange.to; i++) {
      const bar = bars[i];

      // Skip if bar is undefined or invalid
      if (!bar) {
        continue;
      }

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
   *
   * @param ctx - Canvas 2D rendering context (bitmap space)
   * @param bars - Bar data with coordinates
   * @param visibleRange - Range of visible bar indices
   * @param options - Rendering options
   * @param hRatio - Horizontal pixel ratio (for primitive, 1 for custom series)
   * @param vRatio - Vertical pixel ratio (for primitive, 1 for custom series)
   */
  static drawTrendLine(
    ctx: CanvasRenderingContext2D,
    bars: TrendFillBarData[],
    visibleRange: { from: number; to: number },
    options: TrendFillRenderOptions,
    hRatio: number = 1,
    vRatio: number = 1
  ): void {
    if (bars.length === 0 || visibleRange === null) {
      return;
    }

    ctx.lineWidth = options.trendLineWidth * vRatio;
    TrendFillRenderer.applyLineStyle(ctx, options.trendLineStyle);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Group by color and draw
    let currentColor: string | null = null;
    let currentPath: Path2D | null = null;

    for (let i = visibleRange.from; i < visibleRange.to; i++) {
      const bar = bars[i];

      // Skip if bar is undefined or invalid
      if (!bar) {
        continue;
      }

      const x = bar.x * hRatio;
      const y = bar.trendLineY * vRatio;

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
   *
   * @param ctx - Canvas 2D rendering context (bitmap space)
   * @param bars - Bar data with coordinates
   * @param visibleRange - Range of visible bar indices
   * @param options - Rendering options
   * @param hRatio - Horizontal pixel ratio (for primitive, 1 for custom series)
   * @param vRatio - Vertical pixel ratio (for primitive, 1 for custom series)
   */
  static drawBaseLine(
    ctx: CanvasRenderingContext2D,
    bars: TrendFillBarData[],
    visibleRange: { from: number; to: number },
    options: TrendFillRenderOptions,
    hRatio: number = 1,
    vRatio: number = 1
  ): void {
    if (bars.length === 0 || visibleRange === null) {
      return;
    }

    const baseLine = new Path2D();
    const firstBar = bars[visibleRange.from];
    baseLine.moveTo(firstBar.x * hRatio, firstBar.baseLineY * vRatio);

    for (let i = visibleRange.from + 1; i < visibleRange.to; i++) {
      baseLine.lineTo(bars[i].x * hRatio, bars[i].baseLineY * vRatio);
    }

    ctx.lineJoin = 'round';
    ctx.strokeStyle = options.baseLineColor;
    ctx.lineWidth = options.baseLineWidth * vRatio;
    TrendFillRenderer.applyLineStyle(ctx, options.baseLineStyle);
    ctx.stroke(baseLine);
  }

  /**
   * Apply line dash pattern based on LineStyle
   */
  static applyLineStyle(ctx: CanvasRenderingContext2D, style: LineStyle): void {
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
