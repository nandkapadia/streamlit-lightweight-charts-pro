/**
 * @fileoverview Band Primitive Implementation
 *
 * ISeriesPrimitive for rendering filled areas between three lines (upper, middle, lower).
 * Provides z-order control for background rendering of technical indicators.
 *
 * Architecture:
 * - Extends BaseSeriesPrimitive for common lifecycle management
 * - Implements ISeriesPrimitive interface for TradingView integration
 * - Uses common rendering utilities for consistent behavior
 *
 * Features:
 * - Three configurable lines (upper, middle, lower)
 * - Two fill areas (upper fill between upper/middle, lower fill between middle/lower)
 * - Z-order control (default: -100 for background)
 * - Price axis labels for all three lines
 * - Time-based visible range detection
 *
 * Use cases:
 * - Background indicators (Bollinger Bands, Keltner Channels, etc.)
 * - When using with createBandSeries() factory with usePrimitive: true
 * - Technical analysis overlays that should render behind price series
 *
 * @example
 * ```typescript
 * import { BandPrimitive } from './BandPrimitive';
 *
 * const bandPrimitive = new BandPrimitive(chart, {
 *   upperLineColor: '#ff0000',
 *   middleLineColor: '#00ff00',
 *   lowerLineColor: '#0000ff',
 *   upperFillColor: 'rgba(255,0,0,0.1)',
 *   lowerFillColor: 'rgba(0,0,255,0.1)'
 * });
 * ```
 *
 * @see createBandSeries for the factory function
 * @see BandSeries for the ICustomSeries implementation
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
  createPrimitiveAxisView,
} from './BaseSeriesPrimitive';

// ============================================================================
// Data Interfaces
// ============================================================================

/**
 * Data structure for band primitive with optional per-point color overrides
 *
 * @example
 * ```typescript
 * // Basic data point (uses global options)
 * { time: '2024-01-01', upper: 110, middle: 105, lower: 100 }
 *
 * // Per-point color overrides
 * {
 *   time: '2024-01-02',
 *   upper: 112, middle: 107, lower: 102,
 *   upperLineColor: '#ff0000',
 *   middleLineColor: '#00ff00',
 *   lowerLineColor: '#0000ff',
 *   upperFillColor: 'rgba(255,0,0,0.2)',
 *   lowerFillColor: 'rgba(0,0,255,0.2)'
 * }
 * ```
 */
export interface BandPrimitiveData {
  time: number | string;
  upper?: number | null;
  middle?: number | null;
  lower?: number | null;
  /**
   * Optional per-point color override for upper line.
   * If not specified, global upperLineColor option is used.
   */
  upperLineColor?: string;
  /**
   * Optional per-point color override for middle line.
   * If not specified, global middleLineColor option is used.
   */
  middleLineColor?: string;
  /**
   * Optional per-point color override for lower line.
   * If not specified, global lowerLineColor option is used.
   */
  lowerLineColor?: string;
  /**
   * Optional per-point color override for upper fill area.
   * If not specified, global upperFillColor option is used.
   */
  upperFillColor?: string;
  /**
   * Optional per-point color override for lower fill area.
   * If not specified, global lowerFillColor option is used.
   */
  lowerFillColor?: string;
}

/**
 * Options for band primitive
 */
export interface BandPrimitiveOptions extends BaseSeriesPrimitiveOptions {
  upperLineColor: string;
  upperLineWidth: 1 | 2 | 3 | 4;
  upperLineStyle: 0 | 1 | 2;
  upperLineVisible: boolean;
  middleLineColor: string;
  middleLineWidth: 1 | 2 | 3 | 4;
  middleLineStyle: 0 | 1 | 2;
  middleLineVisible: boolean;
  lowerLineColor: string;
  lowerLineWidth: 1 | 2 | 3 | 4;
  lowerLineStyle: 0 | 1 | 2;
  lowerLineVisible: boolean;
  upperFillColor: string;
  upperFill: boolean; // Changed from upperFillVisible to match Python backend
  lowerFillColor: string;
  lowerFill: boolean; // Changed from lowerFillVisible to match Python backend
}

/**
 * Internal processed data structure with optional per-point color overrides
 */
interface BandProcessedData extends BaseProcessedData {
  time: Time;
  upper: number;
  middle: number;
  lower: number;
  upperLineColor?: string;
  middleLineColor?: string;
  lowerLineColor?: string;
  upperFillColor?: string;
  lowerFillColor?: string;
}

// ============================================================================
// Primitive Pane View
// ============================================================================

class BandPrimitivePaneView extends BaseSeriesPrimitivePaneView<
  BandProcessedData,
  BandPrimitiveOptions
> {
  renderer(): IPrimitivePaneRenderer {
    return new BandPrimitiveRenderer(this._source as BandPrimitive);
  }
}

// ============================================================================
// Primitive Renderer
// ============================================================================

/**
 * Band Primitive Renderer
 * Handles actual drawing on canvas with proper method separation:
 * - draw(): Renders upper, middle, and lower lines (foreground elements)
 * - drawBackground(): Renders filled areas between lines (background elements)
 */
class BandPrimitiveRenderer implements IPrimitivePaneRenderer {
  private _source: BandPrimitive;

  constructor(source: BandPrimitive) {
    this._source = source;
  }

  /**
   * Draw method - handles LINE drawing (foreground elements)
   * This method renders upper, middle, and lower boundary lines
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
      const coordinates = convertToCoordinates(data, chart, series, ['upper', 'middle', 'lower']);

      // Scale coordinates
      const scaledCoords: MultiCoordinatePoint[] = coordinates.map(coord => ({
        x: coord.x !== null ? coord.x * hRatio : null,
        upper: coord.upper !== null ? coord.upper * vRatio : null,
        middle: coord.middle !== null ? coord.middle * vRatio : null,
        lower: coord.lower !== null ? coord.lower * vRatio : null,
      }));

      // Draw lines (foreground) with per-point color support
      this._drawLineWithStyles(ctx, scaledCoords, data, 'upper', 'upperLineColor', options, hRatio);

      this._drawLineWithStyles(
        ctx,
        scaledCoords,
        data,
        'middle',
        'middleLineColor',
        options,
        hRatio
      );

      this._drawLineWithStyles(ctx, scaledCoords, data, 'lower', 'lowerLineColor', options, hRatio);

      ctx.restore();
    });
  }

  /**
   * Draw a single line with per-point color support
   *
   * @param ctx - Canvas rendering context
   * @param scaledCoords - Scaled screen coordinates
   * @param data - Processed data with optional per-point colors
   * @param coordField - Which coordinate to draw ('upper', 'middle', 'lower')
   * @param colorField - Which color property to check ('upperLineColor', 'middleLineColor', 'lowerLineColor')
   * @param options - Global options from attached series
   * @param hRatio - Horizontal pixel ratio for line width scaling
   */
  private _drawLineWithStyles(
    ctx: CanvasRenderingContext2D,
    scaledCoords: MultiCoordinatePoint[],
    data: BandProcessedData[],
    coordField: 'upper' | 'middle' | 'lower',
    colorField: 'upperLineColor' | 'middleLineColor' | 'lowerLineColor',
    options: BandPrimitiveOptions,
    hRatio: number
  ): void {
    // Build field names for global options
    const globalVisibleField = `${coordField}LineVisible` as keyof BandPrimitiveOptions;
    const globalColorField = `${coordField}LineColor` as keyof BandPrimitiveOptions;
    const globalWidthField = `${coordField}LineWidth` as keyof BandPrimitiveOptions;
    const globalStyleField = `${coordField}LineStyle` as keyof BandPrimitiveOptions;

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

    // Detect if any points have per-point colors
    const hasPerPointColors = data.some(point => point[colorField] !== undefined);

    if (!hasPerPointColors) {
      // Fast path: no per-point colors, draw entire line at once
      drawContinuousLine(
        ctx,
        points,
        {
          color: options[globalColorField] as string,
          lineWidth: options[globalWidthField] as number,
          lineStyle: options[globalStyleField] as number as LineStyle,
        },
        {
          extendStart: halfBarWidth,
          extendEnd: halfBarWidth,
          skipInvalid: true,
        }
      );
    } else {
      // Slow path: segment-based rendering for per-point colors
      // Group consecutive points with the same color
      interface ColorSegment {
        startIdx: number;
        endIdx: number;
        color: string;
      }

      const segments: ColorSegment[] = [];
      let currentColor = data[0][colorField] ?? (options[globalColorField] as string);
      let segmentStart = 0;

      for (let i = 1; i < data.length; i++) {
        const pointColor = data[i][colorField] ?? (options[globalColorField] as string);

        if (pointColor !== currentColor) {
          // Color changed, save current segment
          segments.push({
            startIdx: segmentStart,
            endIdx: i - 1,
            color: currentColor,
          });

          // Start new segment
          currentColor = pointColor;
          segmentStart = i;
        }
      }

      // Add final segment
      segments.push({
        startIdx: segmentStart,
        endIdx: data.length - 1,
        color: currentColor,
      });

      // Draw each segment
      for (const segment of segments) {
        // Extract points for this segment
        const segmentPoints = points.slice(segment.startIdx, segment.endIdx + 1);

        // Get first and last valid points from segment
        const validSegmentPoints = segmentPoints.filter(isValidRenderPoint);
        if (validSegmentPoints.length === 0) continue;

        const firstPoint = validSegmentPoints[0];
        const lastPoint = validSegmentPoints[validSegmentPoints.length - 1];

        // Calculate pixel-perfect bar-width extensions
        const { extendStart, extendEnd } = calculateBarWidthExtensions(
          firstPoint,
          lastPoint,
          barSpacing,
          hRatio
        );

        // Get previous and next points for Y interpolation
        const prevPoint = segment.startIdx > 0 ? points[segment.startIdx - 1] : undefined;
        const nextPoint =
          segment.endIdx + 1 < points.length ? points[segment.endIdx + 1] : undefined;

        drawContinuousLine(
          ctx,
          segmentPoints,
          {
            color: segment.color,
            lineWidth: options[globalWidthField] as number,
            lineStyle: options[globalStyleField] as number as LineStyle,
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

  /**
   * Draw a filled area with per-point color support using bar-width-aware rendering
   *
   * @param ctx - Canvas rendering context
   * @param scaledCoords - Scaled screen coordinates
   * @param data - Processed data with optional per-point fill colors
   * @param upperKey - Upper boundary key ('upper')
   * @param lowerKey - Lower boundary key ('middle' or 'lower')
   * @param colorField - Which color property to check ('upperFillColor' or 'lowerFillColor')
   * @param options - Global options from attached series
   */
  private _drawFillWithStyles(
    ctx: CanvasRenderingContext2D,
    scaledCoords: MultiCoordinatePoint[],
    data: BandProcessedData[],
    upperKey: 'upper' | 'middle',
    lowerKey: 'middle' | 'lower',
    colorField: 'upperFillColor' | 'lowerFillColor',
    options: BandPrimitiveOptions,
    hRatio: number
  ): void {
    // Build field names for global options
    const fillField = colorField === 'upperFillColor' ? 'upperFill' : 'lowerFill';
    const globalVisibleField = fillField as keyof BandPrimitiveOptions;
    const globalColorField = colorField as keyof BandPrimitiveOptions;

    if (scaledCoords.length < 2) return;

    // Convert to RenderPoint format (coordinates are already scaled)
    const upperPoints: RenderPoint[] = scaledCoords.map(coord => ({
      x: coord.x,
      y: coord[upperKey] as number | null,
    }));
    const lowerPoints: RenderPoint[] = scaledCoords.map(coord => ({
      x: coord.x,
      y: coord[lowerKey] as number | null,
    }));

    // Calculate bar-width extension using pixel-perfect rendering formula
    const chart = this._source.getChart();
    const barSpacing = getBarSpacing(chart);
    const halfBarSpacing = barSpacing / 2; // Half spacing in media coordinates

    // Detect if any points have per-point fill colors
    const hasPerPointColors = data.some(point => point[colorField] !== undefined);

    if (!hasPerPointColors) {
      // Fast path: no per-point colors, check global visibility
      if (!options[globalVisibleField]) return;

      // Calculate pixel-perfect edge extensions
      const firstXMedia = (upperPoints[0].x as number) / hRatio;
      const lastXMedia = (upperPoints[upperPoints.length - 1].x as number) / hRatio;
      const startExtension =
        (upperPoints[0].x as number) - Math.round((firstXMedia - halfBarSpacing) * hRatio);
      const endExtension =
        Math.round((lastXMedia + halfBarSpacing) * hRatio) -
        (upperPoints[upperPoints.length - 1].x as number);

      // Draw entire fill with bar-width extensions at edges
      fillBetweenLines(ctx, upperPoints, lowerPoints, {
        fillStyle: options[globalColorField] as string,
        edgeExtension: {
          start: startExtension,
          end: endExtension,
        },
      });
    } else {
      // Slow path: segment-based rendering for per-point colors
      // Group consecutive points with the same fill color
      interface FillSegment {
        startIdx: number;
        endIdx: number;
        color: string;
      }

      const segments: FillSegment[] = [];
      let currentColor = data[0][colorField] ?? (options[globalColorField] as string);
      let segmentStart = 0;

      for (let i = 1; i < data.length; i++) {
        const pointColor = data[i][colorField] ?? (options[globalColorField] as string);

        if (pointColor !== currentColor) {
          // Color changed, save current segment
          segments.push({
            startIdx: segmentStart,
            endIdx: i - 1,
            color: currentColor,
          });

          // Start new segment
          currentColor = pointColor;
          segmentStart = i;
        }
      }

      // Add final segment
      segments.push({
        startIdx: segmentStart,
        endIdx: data.length - 1,
        color: currentColor,
      });

      // Draw each segment
      for (const segment of segments) {
        const startIdx = segment.startIdx;
        const endIdx = segment.endIdx;

        // Filter valid points for this segment
        const validUpper = upperPoints.slice(startIdx, endIdx + 1).filter(isValidRenderPoint);
        const validLower = lowerPoints.slice(startIdx, endIdx + 1).filter(isValidRenderPoint);

        if (validUpper.length === 0 || validLower.length === 0) continue;

        ctx.save();
        ctx.fillStyle = segment.color;
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

  /**
   * Draw background method - handles FILL rendering (background elements)
   * This method renders the filled areas between upper-middle and middle-lower lines
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
      const coordinates = convertToCoordinates(data, chart, series, ['upper', 'middle', 'lower']);

      // Scale coordinates
      const scaledCoords: MultiCoordinatePoint[] = coordinates.map(coord => ({
        x: coord.x !== null ? coord.x * hRatio : null,
        upper: coord.upper !== null ? coord.upper * vRatio : null,
        middle: coord.middle !== null ? coord.middle * vRatio : null,
        lower: coord.lower !== null ? coord.lower * vRatio : null,
      }));

      // Draw fill areas (background) with per-point color support
      this._drawFillWithStyles(
        ctx,
        scaledCoords,
        data,
        'upper',
        'middle',
        'upperFillColor',
        options,
        hRatio
      );
      this._drawFillWithStyles(
        ctx,
        scaledCoords,
        data,
        'middle',
        'lower',
        'lowerFillColor',
        options,
        hRatio
      );

      ctx.restore();
    });
  }
}

// ============================================================================
// Axis Views (using factory to eliminate duplication)
// ============================================================================

/**
 * Price axis views for Band primitive
 * Generated using createPrimitiveAxisView factory to eliminate code duplication
 *
 * Before: 90 lines of duplicate code (3 classes × 30 lines each)
 * After: 3 lines using factory pattern
 */
const BandUpperAxisView = createPrimitiveAxisView<BandProcessedData, BandPrimitiveOptions>(
  'upper',
  'upperLineColor'
);

const BandMiddleAxisView = createPrimitiveAxisView<BandProcessedData, BandPrimitiveOptions>(
  'middle',
  'middleLineColor'
);

const BandLowerAxisView = createPrimitiveAxisView<BandProcessedData, BandPrimitiveOptions>(
  'lower',
  'lowerLineColor'
);

// ============================================================================
// Primitive Implementation
// ============================================================================

/**
 * Band Primitive
 *
 * Implements ISeriesPrimitive for z-order control and independent rendering.
 * Syncs data from attached ICustomSeries for autoscaling.
 *
 * Refactored to extend BaseSeriesPrimitive following DRY principles.
 */
export class BandPrimitive extends BaseSeriesPrimitive<BandProcessedData, BandPrimitiveOptions> {
  constructor(chart: IChartApi, options: BandPrimitiveOptions) {
    super(chart, options);
  }

  /**
   * Returns settings schema for series dialog
   * Maps property names to their types for automatic UI generation
   */
  static getSettings() {
    return {
      upperLine: 'line' as const,
      middleLine: 'line' as const,
      lowerLine: 'line' as const,
      upperFillColor: 'color' as const,
      upperFill: 'boolean' as const,
      lowerFillColor: 'color' as const,
      lowerFill: 'boolean' as const,
    };
  }

  // Required: Initialize views
  protected _initializeViews(): void {
    this._addPaneView(new BandPrimitivePaneView(this));
    this._addPriceAxisView(new BandUpperAxisView(this));
    this._addPriceAxisView(new BandMiddleAxisView(this));
    this._addPriceAxisView(new BandLowerAxisView(this));
  }

  // Required: Process raw data
  protected _processData(rawData: any[]): BandProcessedData[] {
    return rawData
      .map(item => {
        const upper = item.upper;
        const middle = item.middle;
        const lower = item.lower;

        // Validate data
        if (
          upper === null ||
          upper === undefined ||
          isNaN(upper) ||
          middle === null ||
          middle === undefined ||
          isNaN(middle) ||
          lower === null ||
          lower === undefined ||
          isNaN(lower)
        ) {
          return null;
        }

        const result: BandProcessedData = {
          time: item.time,
          upper,
          middle,
          lower,
        };

        // Include per-point color overrides if present
        if (item.upperLineColor !== undefined) {
          result.upperLineColor = item.upperLineColor;
        }
        if (item.middleLineColor !== undefined) {
          result.middleLineColor = item.middleLineColor;
        }
        if (item.lowerLineColor !== undefined) {
          result.lowerLineColor = item.lowerLineColor;
        }
        if (item.upperFillColor !== undefined) {
          result.upperFillColor = item.upperFillColor;
        }
        if (item.lowerFillColor !== undefined) {
          result.lowerFillColor = item.lowerFillColor;
        }

        return result;
      })
      .filter((item): item is BandProcessedData => item !== null);
  }

  // Optional: Custom z-order default
  protected _getDefaultZOrder(): PrimitivePaneViewZOrder {
    return 'normal'; // Render in normal layer (in front of grid)
  }
}
