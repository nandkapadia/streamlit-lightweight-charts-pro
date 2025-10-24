/**
 * @fileoverview Ribbon Primitive Implementation
 *
 * ISeriesPrimitive for rendering filled areas between upper and lower lines.
 * Provides z-order control for background rendering of channel indicators.
 *
 * Architecture:
 * - Extends BaseSeriesPrimitive for common lifecycle management
 * - Implements ISeriesPrimitive interface for TradingView integration
 * - Uses common rendering utilities for consistent behavior
 *
 * Features:
 * - Two configurable lines (upper and lower)
 * - Fill area between lines
 * - Z-order control (default: -100 for background)
 * - Price axis labels for both lines
 * - Time-based visible range detection
 *
 * Use cases:
 * - Background indicators (Bollinger Bands, channels, etc.)
 * - When using with createRibbonSeries() factory with usePrimitive: true
 * - Technical analysis overlays that should render behind price series
 *
 * @example
 * ```typescript
 * import { RibbonPrimitive } from './RibbonPrimitive';
 *
 * const ribbonPrimitive = new RibbonPrimitive(chart, {
 *   upperLineColor: '#ff0000',
 *   lowerLineColor: '#0000ff',
 *   fillColor: 'rgba(128,128,128,0.1)'
 * });
 * ```
 *
 * @see createRibbonSeries for the factory function
 * @see RibbonSeries for the ICustomSeries implementation
 */

import {
  IChartApi,
  IPrimitivePaneRenderer,
  Time,
  PrimitivePaneViewZOrder,
} from 'lightweight-charts';
import { BitmapCoordinatesRenderingScope } from 'fancy-canvas';
import { getSolidColorFromFill } from '../utils/colorUtils';
import {
  convertToCoordinates,
  MultiCoordinatePoint,
  getBarSpacing,
} from '../plugins/series/base/commonRendering';
import {
  drawContinuousLine,
  fillBetweenLines,
  calculateBarWidthExtensions,
  interpolateY,
  RenderPoint,
  LineStyle,
  isValidRenderPoint,
} from '../utils/renderingUtils';
import {
  BaseSeriesPrimitive,
  BaseSeriesPrimitiveOptions,
  BaseProcessedData,
  BaseSeriesPrimitivePaneView,
  BaseSeriesPrimitiveAxisView,
} from './BaseSeriesPrimitive';
import {
  PerPointStyles,
  resolveLineColor,
  resolveLineWidth,
  resolveLineStyle,
  resolveLineVisible,
  resolveFillColor,
  resolveFillVisible,
  groupLineSegments,
  groupFillSegments,
} from './primitiveStyleUtils';

// ============================================================================
// Data Interfaces
// ============================================================================

/**
 * Data structure for ribbon primitive with optional per-point styling
 *
 * @example
 * ```typescript
 * // Basic data point (uses global options)
 * { time: '2024-01-01', upper: 110, lower: 100 }
 *
 * // Per-point style overrides
 * {
 *   time: '2024-01-02',
 *   upper: 112, lower: 102,
 *   styles: {
 *     upperLine: { color: '#ff0000', width: 3 },
 *     fill: { color: 'rgba(255,0,0,0.2)', visible: true }
 *   }
 * }
 * ```
 */
export interface RibbonPrimitiveData {
  time: number | string;
  upper?: number | null;
  lower?: number | null;
  /**
   * Optional per-point style overrides.
   * If not specified, global options are used.
   * All fields in styles are optional - only override what you need.
   */
  styles?: PerPointStyles;
}

/**
 * Options for ribbon primitive
 */
export interface RibbonPrimitiveOptions extends BaseSeriesPrimitiveOptions {
  upperLineColor: string;
  upperLineWidth: 1 | 2 | 3 | 4;
  upperLineStyle: 0 | 1 | 2;
  upperLineVisible: boolean;
  lowerLineColor: string;
  lowerLineWidth: 1 | 2 | 3 | 4;
  lowerLineStyle: 0 | 1 | 2;
  lowerLineVisible: boolean;
  fillColor: string;
  fillVisible: boolean;
}

/**
 * Internal processed data structure with optional per-point styles
 */
interface RibbonProcessedData extends BaseProcessedData {
  time: Time;
  upper: number;
  lower: number;
  styles?: PerPointStyles; // Per-point style overrides
}

// ============================================================================
// Primitive Pane View
// ============================================================================

class RibbonPrimitivePaneView extends BaseSeriesPrimitivePaneView<
  RibbonProcessedData,
  RibbonPrimitiveOptions
> {
  renderer(): IPrimitivePaneRenderer {
    return new RibbonPrimitiveRenderer(this._source as RibbonPrimitive);
  }
}

// ============================================================================
// Primitive Renderer
// ============================================================================

/**
 * Ribbon Primitive Renderer
 * Handles actual drawing on canvas with proper method separation:
 * - draw(): Renders upper and lower lines (foreground elements)
 * - drawBackground(): Renders filled area between lines (background elements)
 */
class RibbonPrimitiveRenderer implements IPrimitivePaneRenderer {
  private _source: RibbonPrimitive;

  constructor(source: RibbonPrimitive) {
    this._source = source;
  }

  /**
   * Draw method - handles LINE drawing (foreground elements)
   * This method renders upper and lower boundary lines
   * that should appear on top of fills and other series
   */
  draw(target: any): void {
    target.useBitmapCoordinateSpace((scope: BitmapCoordinatesRenderingScope) => {
      const ctx = scope.context;
      const hRatio = scope.horizontalPixelRatio;
      const vRatio = scope.verticalPixelRatio;

      const data = this._source.getProcessedData();
      const series = this._source.getAttachedSeries();

      if (!series || data.length === 0) return;

      // Read options from attached series (single source of truth)
      const options = (series as any).options();
      if (!options || options.visible === false) return;

      ctx.save();

      // Convert to screen coordinates
      const chart = this._source.getChart();
      const coordinates = convertToCoordinates(data, chart, series, ['upper', 'lower']);

      // Scale coordinates
      const scaledCoords: MultiCoordinatePoint[] = coordinates.map(coord => ({
        x: coord.x !== null ? coord.x * hRatio : null,
        upper: coord.upper !== null ? coord.upper * vRatio : null,
        lower: coord.lower !== null ? coord.lower * vRatio : null,
      }));

      // Draw lines (foreground) with per-point styling support
      this._drawLineWithStyles(ctx, scaledCoords, data, 'upper', 'upperLine', options, hRatio);
      this._drawLineWithStyles(ctx, scaledCoords, data, 'lower', 'lowerLine', options, hRatio);

      ctx.restore();
    });
  }

  /**
   * Draw a single line with per-point styling support
   * Uses bar-width-aware rendering from renderingUtils.ts
   *
   * @param ctx - Canvas rendering context
   * @param scaledCoords - Scaled screen coordinates
   * @param data - Processed data with optional per-point styles
   * @param coordField - Which coordinate to draw ('upper' or 'lower')
   * @param styleField - Which style field to use ('upperLine' or 'lowerLine')
   * @param options - Global options from attached series
   * @param hRatio - Horizontal pixel ratio for line width scaling
   */
  private _drawLineWithStyles(
    ctx: CanvasRenderingContext2D,
    scaledCoords: MultiCoordinatePoint[],
    data: RibbonProcessedData[],
    coordField: 'upper' | 'lower',
    styleField: 'upperLine' | 'lowerLine',
    options: RibbonPrimitiveOptions,
    hRatio: number
  ): void {
    // Build field names for global options
    const globalVisibleField = `${coordField}LineVisible` as keyof RibbonPrimitiveOptions;
    const globalColorField = `${coordField}LineColor` as keyof RibbonPrimitiveOptions;
    const globalWidthField = `${coordField}LineWidth` as keyof RibbonPrimitiveOptions;
    const globalStyleField = `${coordField}LineStyle` as keyof RibbonPrimitiveOptions;

    // Check global visibility first
    if (!options[globalVisibleField]) return;

    // Convert to RenderPoint format
    const points: RenderPoint[] = scaledCoords.map(coord => ({
      x: coord.x,
      y: coord[coordField] as number | null,
    }));

    // Calculate bar-width extension for proper rendering
    const chart = this._source.getChart();
    const barSpacing = getBarSpacing(chart);
    const halfBarWidth = (barSpacing * hRatio) / 2;

    // Detect if any points have custom styling
    const hasCustomStyling = data.some(point => point.styles?.[styleField] !== undefined);

    if (!hasCustomStyling) {
      // Fast path: no custom styling, draw entire line at once
      drawContinuousLine(
        ctx,
        points,
        {
          color: options[globalColorField] as string,
          lineWidth: (options[globalWidthField] as number) * hRatio,
          lineStyle: (options[globalStyleField] as number) as LineStyle,
        },
        {
          extendStart: halfBarWidth,
          extendEnd: halfBarWidth,
          skipInvalid: true,
        }
      );
    } else {
      // Slow path: segment-based rendering for custom styling
      const segments = groupLineSegments(data, styleField);

      for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        const color = resolveLineColor(segment.style, options[globalColorField] as string);
        const width = resolveLineWidth(segment.style, options[globalWidthField] as 1 | 2 | 3 | 4);
        const style = resolveLineStyle(segment.style, options[globalStyleField] as 0 | 1 | 2);
        const visible = resolveLineVisible(segment.style, true);

        if (visible) {
          // Extract points for this segment
          const segmentPoints = points.slice(segment.startIdx, segment.endIdx + 1);

          // Get first and last valid points from segment
          const validSegmentPoints = segmentPoints.filter(isValidRenderPoint);
          if (validSegmentPoints.length === 0) continue;

          const firstPoint = validSegmentPoints[0];
          const lastPoint = validSegmentPoints[validSegmentPoints.length - 1];

          // Calculate pixel-perfect bar-width extensions (reuse barSpacing from outer scope)
          const { extendStart, extendEnd } = calculateBarWidthExtensions(
            firstPoint,
            lastPoint,
            barSpacing,
            hRatio
          );

          // Get previous and next points for Y interpolation
          const prevPoint = segment.startIdx > 0 ? points[segment.startIdx - 1] : undefined;
          const nextPoint = segment.endIdx + 1 < points.length ? points[segment.endIdx + 1] : undefined;

          drawContinuousLine(
            ctx,
            segmentPoints,
            {
              color: color,
              lineWidth: width * hRatio,
              lineStyle: style as LineStyle,
            },
            {
              extendStart,
              extendEnd,
              skipInvalid: true,
              prevPoint,
              nextPoint,
            }
          );
        }
      }
    }
  }

  /**
   * Draw background method - handles FILL rendering (background elements)
   * This method renders the filled area between upper and lower lines
   * that should appear behind lines and other series
   */
  drawBackground(target: any): void {
    target.useBitmapCoordinateSpace((scope: BitmapCoordinatesRenderingScope) => {
      const ctx = scope.context;
      const hRatio = scope.horizontalPixelRatio;
      const vRatio = scope.verticalPixelRatio;

      const data = this._source.getProcessedData();
      const series = this._source.getAttachedSeries();

      if (!series || data.length === 0) return;

      // Read options from attached series (single source of truth)
      const options = (series as any).options();
      if (!options || options.visible === false) return;

      ctx.save();

      // Convert to screen coordinates
      const chart = this._source.getChart();
      const coordinates = convertToCoordinates(data, chart, series, ['upper', 'lower']);

      // Scale coordinates
      const scaledCoords: MultiCoordinatePoint[] = coordinates.map(coord => ({
        x: coord.x !== null ? coord.x * hRatio : null,
        upper: coord.upper !== null ? coord.upper * vRatio : null,
        lower: coord.lower !== null ? coord.lower * vRatio : null,
      }));

      // Draw fill area (background) with per-point styling support
      this._drawFillWithStyles(ctx, scaledCoords, data, options, hRatio);

      ctx.restore();
    });
  }

  /**
   * Draw a filled area with per-point styling support
   * Uses bar-width-aware rendering from renderingUtils.ts
   *
   * @param ctx - Canvas rendering context
   * @param scaledCoords - Scaled screen coordinates (already multiplied by hRatio/vRatio)
   * @param data - Processed data with optional per-point styles
   * @param options - Global options from attached series
   * @param hRatio - Horizontal pixel ratio (used for calculating halfBarWidth)
   */
  private _drawFillWithStyles(
    ctx: CanvasRenderingContext2D,
    scaledCoords: MultiCoordinatePoint[],
    data: RibbonProcessedData[],
    options: RibbonPrimitiveOptions,
    hRatio: number
  ): void {
    if (scaledCoords.length < 2) return;

    // Convert to RenderPoint format (coordinates are already scaled)
    const upperPoints: RenderPoint[] = scaledCoords.map(coord => ({
      x: coord.x,
      y: coord.upper as number | null,
    }));

    const lowerPoints: RenderPoint[] = scaledCoords.map(coord => ({
      x: coord.x,
      y: coord.lower as number | null,
    }));

    // Calculate bar-width extension using pixel-perfect rendering formula
    const chart = this._source.getChart();
    const barSpacing = getBarSpacing(chart);
    const halfBarSpacing = barSpacing / 2;  // Half spacing in media coordinates

    // Detect if any points have custom styling
    const hasCustomStyling = data.some(point => point.styles?.fill !== undefined);

    if (!hasCustomStyling) {
      // Fast path: no custom styling, check global visibility
      if (!options.fillVisible) return;

      // Calculate pixel-perfect edge extensions
      const firstXMedia = (upperPoints[0].x as number) / hRatio;
      const lastXMedia = (upperPoints[upperPoints.length - 1].x as number) / hRatio;
      const startExtension = (upperPoints[0].x as number) - Math.round((firstXMedia - halfBarSpacing) * hRatio);
      const endExtension = Math.round((lastXMedia + halfBarSpacing) * hRatio) - (upperPoints[upperPoints.length - 1].x as number);

      fillBetweenLines(ctx, upperPoints, lowerPoints, {
        fillStyle: options.fillColor,
        edgeExtension: {
          start: startExtension,
          end: endExtension,
        },
      });
    } else {
      // Slow path: segment-based rendering for custom styling with proper bar-width handling
      const segments = groupFillSegments(data, 'fill');

      for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        const color = resolveFillColor(segment.style, options.fillColor);
        const visible = resolveFillVisible(segment.style, options.fillVisible);

        if (visible) {
          const startIdx = segment.startIdx;
          const endIdx = segment.endIdx;

          // Filter valid points for this segment
          const validUpper = upperPoints.slice(startIdx, endIdx + 1).filter(isValidRenderPoint);
          const validLower = lowerPoints.slice(startIdx, endIdx + 1).filter(isValidRenderPoint);

          if (validUpper.length === 0 || validLower.length === 0) continue;

          ctx.save();
          ctx.fillStyle = color;
          ctx.beginPath();

          const firstUpper = validUpper[0];
          const lastUpper = validUpper[validUpper.length - 1];
          const firstLower = validLower[0];
          const lastLower = validLower[validLower.length - 1];

          // Pixel-perfect full bar width calculation
          // Convert scaled coordinates back to media, apply half-spacing, then scale with rounding
          const firstXMedia = (firstUpper.x as number) / hRatio;
          const lastXMedia = (lastUpper.x as number) / hRatio;

          const startX = Math.round((firstXMedia - halfBarSpacing) * hRatio);
          const endX = Math.round((lastXMedia + halfBarSpacing) * hRatio);

          // Calculate Y coordinates for extended edges (interpolate if next point exists)
          let startUpperY = firstUpper.y as number;
          let startLowerY = firstLower.y as number;
          let endUpperY = lastUpper.y as number;
          let endLowerY = lastLower.y as number;

          // Interpolate end Y if there's a next point
          if (endIdx + 1 < upperPoints.length) {
            const nextUpper = upperPoints[endIdx + 1];
            const nextLower = lowerPoints[endIdx + 1];

            if (isValidRenderPoint(nextUpper)) {
              endUpperY = interpolateY(
                endX,
                lastUpper.x as number,
                lastUpper.y as number,
                nextUpper.x as number,
                nextUpper.y as number
              );
            }

            if (isValidRenderPoint(nextLower)) {
              endLowerY = interpolateY(
                endX,
                lastLower.x as number,
                lastLower.y as number,
                nextLower.x as number,
                nextLower.y as number
              );
            }
          }

          // Interpolate start Y if there's a previous point
          if (startIdx > 0) {
            const prevUpper = upperPoints[startIdx - 1];
            const prevLower = lowerPoints[startIdx - 1];

            if (isValidRenderPoint(prevUpper)) {
              startUpperY = interpolateY(
                startX,
                prevUpper.x as number,
                prevUpper.y as number,
                firstUpper.x as number,
                firstUpper.y as number
              );
            }

            if (isValidRenderPoint(prevLower)) {
              startLowerY = interpolateY(
                startX,
                prevLower.x as number,
                prevLower.y as number,
                firstLower.x as number,
                firstLower.y as number
              );
            }
          }

          // Start at extended upper left
          ctx.moveTo(startX, startUpperY);

          // Draw upper line through all points
          for (const point of validUpper) {
            ctx.lineTo(point.x as number, point.y as number);
          }

          // Always extend to endX (which includes halfBarWidth for last segment)
          ctx.lineTo(endX, endUpperY);

          // Draw lower line backwards (right to left), starting from endX
          ctx.lineTo(endX, endLowerY);

          for (let j = validLower.length - 1; j >= 0; j--) {
            const point = validLower[j];
            ctx.lineTo(point.x as number, point.y as number);
          }

          // Return to start position on lower line
          ctx.lineTo(startX, startLowerY);

          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
      }
    }
  }
}

// ============================================================================
// Axis Views
// ============================================================================

/**
 * Price axis view for upper line
 */
class RibbonUpperAxisView extends BaseSeriesPrimitiveAxisView<
  RibbonProcessedData,
  RibbonPrimitiveOptions
> {
  coordinate(): number {
    const lastItem = this._getLastVisibleItem();
    if (!lastItem) return 0;

    const series = this._source.getAttachedSeries();
    if (!series) return 0;

    const coordinate = series.priceToCoordinate(lastItem.upper);
    return coordinate ?? 0;
  }

  text(): string {
    const lastItem = this._getLastVisibleItem();
    if (!lastItem) return '';
    return lastItem.upper.toFixed(2);
  }

  backColor(): string {
    const options = this._source.getOptions();
    return getSolidColorFromFill(options.upperLineColor);
  }
}

/**
 * Price axis view for lower line
 */
class RibbonLowerAxisView extends BaseSeriesPrimitiveAxisView<
  RibbonProcessedData,
  RibbonPrimitiveOptions
> {
  coordinate(): number {
    const lastItem = this._getLastVisibleItem();
    if (!lastItem) return 0;

    const series = this._source.getAttachedSeries();
    if (!series) return 0;

    const coordinate = series.priceToCoordinate(lastItem.lower);
    return coordinate ?? 0;
  }

  text(): string {
    const lastItem = this._getLastVisibleItem();
    if (!lastItem) return '';
    return lastItem.lower.toFixed(2);
  }

  backColor(): string {
    const options = this._source.getOptions();
    return getSolidColorFromFill(options.lowerLineColor);
  }
}

// ============================================================================
// Primitive Implementation
// ============================================================================

/**
 * Ribbon Primitive
 *
 * Implements ISeriesPrimitive for z-order control and independent rendering.
 * Syncs data from attached ICustomSeries for autoscaling.
 *
 * Refactored to extend BaseSeriesPrimitive following DRY principles.
 */
export class RibbonPrimitive extends BaseSeriesPrimitive<
  RibbonProcessedData,
  RibbonPrimitiveOptions
> {
  constructor(chart: IChartApi, options: RibbonPrimitiveOptions) {
    super(chart, options);
  }

  /**
   * Returns settings schema for series dialog
   * Maps property names to their types for automatic UI generation
   */
  static getSettings() {
    return {
      upperLine: 'line' as const,
      lowerLine: 'line' as const,
      fillVisible: 'boolean' as const,
      fillColor: 'color' as const,
    };
  }

  // Required: Initialize views
  protected _initializeViews(): void {
    this._addPaneView(new RibbonPrimitivePaneView(this));
    this._addPriceAxisView(new RibbonUpperAxisView(this));
    this._addPriceAxisView(new RibbonLowerAxisView(this));
  }

  // Required: Process raw data
  protected _processData(rawData: any[]): RibbonProcessedData[] {
    return rawData
      .map(item => {
        const upper = item.upper;
        const lower = item.lower;

        // Validate data
        if (
          upper === null ||
          upper === undefined ||
          isNaN(upper) ||
          lower === null ||
          lower === undefined ||
          isNaN(lower)
        ) {
          return null;
        }

        const result: RibbonProcessedData = {
          time: item.time,
          upper,
          lower,
        };

        // Only include styles if present (keep it truly optional)
        if (item.styles !== undefined) {
          result.styles = item.styles;
        }

        return result;
      })
      .filter((item): item is RibbonProcessedData => item !== null);
  }

  // Optional: Custom z-order default
  protected _getDefaultZOrder(): PrimitivePaneViewZOrder {
    return 'normal'; // Render in normal layer (in front of grid)
  }
}
