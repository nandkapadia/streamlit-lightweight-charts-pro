/**
 * @fileoverview Gradient Ribbon Primitive Implementation
 *
 * ISeriesPrimitive for rendering filled gradient areas between upper and lower lines.
 * Provides color interpolation with z-order control for background rendering.
 *
 * Architecture:
 * - Extends BaseSeriesPrimitive for common lifecycle management
 * - Implements ISeriesPrimitive interface for TradingView integration
 * - Uses common rendering utilities for consistent behavior
 *
 * Features:
 * - Two configurable lines (upper and lower)
 * - Gradient fill area between lines with color interpolation
 * - Z-order control (default: -100 for background)
 * - Price axis labels for both lines
 * - Time-based visible range detection
 * - Per-point fill colors or gradient based on spread magnitude
 *
 * Use cases:
 * - Background volatility indicators (ATR bands, etc.)
 * - When using with createGradientRibbonSeries() factory with usePrimitive: true
 * - Technical analysis overlays that should render behind price series
 *
 * @example
 * ```typescript
 * import { GradientRibbonPrimitive } from './GradientRibbonPrimitive';
 *
 * const gradientRibbonPrimitive = new GradientRibbonPrimitive(chart, {
 *   upperLineColor: '#ff0000',
 *   lowerLineColor: '#0000ff',
 *   gradientStartColor: '#ff0000',
 *   gradientEndColor: '#0000ff'
 * });
 * ```
 *
 * @see createGradientRibbonSeries for the factory function
 * @see GradientRibbonSeries for the ICustomSeries implementation
 */

import {
  IChartApi,
  IPrimitivePaneRenderer,
  Time,
  PrimitivePaneViewZOrder,
} from 'lightweight-charts';
import { BitmapCoordinatesRenderingScope } from 'fancy-canvas';
import { getSolidColorFromFill } from '../utils/colorUtils';
import { convertToCoordinates, drawMultiLine } from '../plugins/series/base/commonRendering';
import {
  BaseSeriesPrimitive,
  BaseSeriesPrimitiveOptions,
  BaseProcessedData,
  BaseSeriesPrimitivePaneView,
  BaseSeriesPrimitiveAxisView,
} from './BaseSeriesPrimitive';

// ============================================================================
// Data Interfaces
// ============================================================================

/**
 * Data structure for gradient ribbon primitive
 */
export interface GradientRibbonPrimitiveData {
  time: number | string;
  upper?: number | null;
  lower?: number | null;
  fill?: string | null; // Optional fill color override from Python (matches Python property name)
  gradient?: number | null; // Optional gradient value for color interpolation
}

/**
 * Options for gradient ribbon primitive
 */
export interface GradientRibbonPrimitiveOptions extends BaseSeriesPrimitiveOptions {
  upperLineColor: string;
  upperLineWidth: 1 | 2 | 3 | 4;
  upperLineStyle: 0 | 1 | 2;
  upperLineVisible: boolean;
  lowerLineColor: string;
  lowerLineWidth: 1 | 2 | 3 | 4;
  lowerLineStyle: 0 | 1 | 2;
  lowerLineVisible: boolean;
  fillVisible: boolean;
  gradientStartColor: string;
  gradientEndColor: string;
  normalizeGradients: boolean;
}

/**
 * Internal processed data structure
 */
interface GradientRibbonProcessedData extends BaseProcessedData {
  time: Time;
  upper: number;
  lower: number;
  gradientFactor: number; // 0-1 gradient factor for color interpolation at render time
  fillOverride?: string; // Optional explicit fill color from data
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Interpolate between two hex colors
 */
function interpolateColor(startColor: string, endColor: string, factor: number): string {
  factor = Math.max(0, Math.min(1, factor));

  const parseHex = (hex: string) => {
    const clean = hex.replace('#', '');
    return {
      r: parseInt(clean.substr(0, 2), 16),
      g: parseInt(clean.substr(2, 2), 16),
      b: parseInt(clean.substr(4, 2), 16),
    };
  };

  try {
    const start = parseHex(startColor);
    const end = parseHex(endColor);

    const r = Math.round(start.r + (end.r - start.r) * factor);
    const g = Math.round(start.g + (end.g - start.g) * factor);
    const b = Math.round(start.b + (end.b - start.b) * factor);

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  } catch {
    return startColor;
  }
}

// ============================================================================
// Primitive Pane View
// ============================================================================

class GradientRibbonPrimitivePaneView extends BaseSeriesPrimitivePaneView<
  GradientRibbonProcessedData,
  GradientRibbonPrimitiveOptions
> {
  renderer(): IPrimitivePaneRenderer {
    return new GradientRibbonPrimitiveRenderer(this._source as GradientRibbonPrimitive);
  }
}

// ============================================================================
// Primitive Renderer
// ============================================================================

/**
 * Gradient Ribbon Primitive Renderer
 * Handles actual drawing on canvas with proper method separation:
 * - draw(): Renders upper and lower lines (foreground elements)
 * - drawBackground(): Renders gradient filled area between lines (background elements)
 */
class GradientRibbonPrimitiveRenderer implements IPrimitivePaneRenderer {
  private _source: GradientRibbonPrimitive;

  constructor(source: GradientRibbonPrimitive) {
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
      const baseCoordinates = convertToCoordinates(data, chart, series, ['upper', 'lower']);

      // Scale coordinates for lines
      const scaledCoordsForLines = baseCoordinates.map(coord => ({
        x: coord.x !== null ? coord.x * hRatio : null,
        upper: coord.upper !== null ? coord.upper * vRatio : null,
        lower: coord.lower !== null ? coord.lower * vRatio : null,
      }));

      // Draw lines (foreground)
      if (options.upperLineVisible) {
        drawMultiLine(
          ctx,
          scaledCoordsForLines,
          'upper',
          options.upperLineColor,
          options.upperLineWidth * hRatio,
          options.upperLineStyle
        );
      }

      if (options.lowerLineVisible) {
        drawMultiLine(
          ctx,
          scaledCoordsForLines,
          'lower',
          options.lowerLineColor,
          options.lowerLineWidth * hRatio,
          options.lowerLineStyle
        );
      }

      ctx.restore();
    });
  }

  /**
   * Draw background method - handles FILL rendering (background elements)
   * This method renders the gradient filled area between upper and lower lines
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
      const baseCoordinates = convertToCoordinates(data, chart, series, ['upper', 'lower']);

      // Calculate fillColor at render time using current options
      interface GradientCoordinate {
        x: number | null;
        upper: number | null;
        lower: number | null;
        fillColor: string;
      }

      const coordinates: GradientCoordinate[] = baseCoordinates.map((coord, idx) => {
        const dataPoint = data[idx];
        let fillColor = options.gradientStartColor; // Use gradient start as fallback

        if (dataPoint) {
          // Use explicit fill override if provided
          if (dataPoint.fillOverride) {
            fillColor = dataPoint.fillOverride;
          } else {
            // Always calculate from gradient factor (factor=0 gives gradientStartColor)
            fillColor = interpolateColor(
              options.gradientStartColor,
              options.gradientEndColor,
              dataPoint.gradientFactor
            );
          }
        }

        return {
          x: coord.x,
          upper: coord.upper,
          lower: coord.lower,
          fillColor,
        };
      });

      // Scale coordinates for fills (with fillColor)
      const scaledCoordsForFills = coordinates.map(coord => ({
        x: coord.x !== null ? coord.x * hRatio : null,
        upper: coord.upper !== null ? coord.upper * vRatio : null,
        lower: coord.lower !== null ? coord.lower * vRatio : null,
        fillColor: coord.fillColor,
      }));

      // Draw gradient fill area (background)
      if (options.fillVisible && scaledCoordsForFills.length > 1) {
        this._drawGradientFill(ctx, scaledCoordsForFills, options);
      }

      ctx.restore();
    });
  }

  private _drawGradientFill(
    ctx: CanvasRenderingContext2D,
    coordinates: Array<{
      x: number | null;
      upper: number | null;
      lower: number | null;
      fillColor?: string;
    }>,
    options: GradientRibbonPrimitiveOptions
  ): void {
    const validCoords = coordinates.filter(
      coord => coord.x !== null && coord.upper !== null && coord.lower !== null
    );

    if (validCoords.length < 2) return;

    // Safe non-null assertions: validCoords filtered for non-null values
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const firstX = validCoords[0].x!;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const lastX = validCoords[validCoords.length - 1].x!;

    // Create linear gradient
    const gradient = ctx.createLinearGradient(firstX, 0, lastX, 0);

    // Add color stops
    for (let i = 0; i < validCoords.length; i++) {
      const coord = validCoords[i];
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const position = (coord.x! - firstX) / (lastX - firstX);
      const clampedPosition = Math.max(0, Math.min(1, position));

      const color = coord.fillColor || options.gradientStartColor;
      gradient.addColorStop(clampedPosition, color);
    }

    // Draw filled area
    ctx.beginPath();

    // Upper boundary (left to right)
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    ctx.moveTo(validCoords[0].x!, validCoords[0].upper!);
    for (let i = 1; i < validCoords.length; i++) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      ctx.lineTo(validCoords[i].x!, validCoords[i].upper!);
    }

    // Lower boundary (right to left)
    for (let i = validCoords.length - 1; i >= 0; i--) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      ctx.lineTo(validCoords[i].x!, validCoords[i].lower!);
    }

    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();
  }
}

// ============================================================================
// Axis Views
// ============================================================================

/**
 * Price axis view for upper line
 */
class GradientRibbonUpperAxisView extends BaseSeriesPrimitiveAxisView<
  GradientRibbonProcessedData,
  GradientRibbonPrimitiveOptions
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

  textColor(): string {
    return '#FFFFFF';
  }

  backColor(): string {
    const options = this._source.getOptions() as GradientRibbonPrimitiveOptions;
    return getSolidColorFromFill(options.upperLineColor);
  }
}

/**
 * Price axis view for lower line
 */
class GradientRibbonLowerAxisView extends BaseSeriesPrimitiveAxisView<
  GradientRibbonProcessedData,
  GradientRibbonPrimitiveOptions
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

  textColor(): string {
    return '#FFFFFF';
  }

  backColor(): string {
    const options = this._source.getOptions() as GradientRibbonPrimitiveOptions;
    return getSolidColorFromFill(options.lowerLineColor);
  }
}

// ============================================================================
// Primitive Implementation
// ============================================================================

/**
 * Gradient Ribbon Primitive
 *
 * Implements ISeriesPrimitive for z-order control and independent rendering.
 * Syncs data from attached ICustomSeries for autoscaling.
 */
export class GradientRibbonPrimitive extends BaseSeriesPrimitive<
  GradientRibbonProcessedData,
  GradientRibbonPrimitiveOptions
> {
  constructor(chart: IChartApi, options: GradientRibbonPrimitiveOptions) {
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
      gradientStartColor: 'color' as const,
      gradientEndColor: 'color' as const,
      normalizeGradients: 'boolean' as const,
    };
  }

  // Required: Initialize views
  protected _initializeViews(): void {
    this._addPaneView(new GradientRibbonPrimitivePaneView(this));
    this._addPriceAxisView(new GradientRibbonUpperAxisView(this));
    this._addPriceAxisView(new GradientRibbonLowerAxisView(this));
  }

  // Required: Process raw data
  protected _processData(rawData: any[]): GradientRibbonProcessedData[] {
    // Calculate gradient bounds for normalization (using primitive's initial options)
    let maxSpread = 0;
    let minGradient = 0;
    let maxGradient = 1;
    let gradientRange = 1;

    // Calculate gradient bounds if we have gradient data and normalization is enabled
    const gradientValues = rawData
      .map(item => item.gradient)
      .filter(val => val !== undefined && val !== null) as number[];

    if (gradientValues.length > 0 && this._options.normalizeGradients) {
      minGradient = Math.min(...gradientValues);
      maxGradient = Math.max(...gradientValues);
      gradientRange = maxGradient - minGradient;
    }

    // Calculate max spread for fallback gradient calculation
    if (this._options.normalizeGradients && gradientValues.length === 0) {
      for (const item of rawData) {
        if (
          typeof item.upper === 'number' &&
          typeof item.lower === 'number' &&
          isFinite(item.upper) &&
          isFinite(item.lower)
        ) {
          const spread = Math.abs(item.upper - item.lower);
          maxSpread = Math.max(maxSpread, spread);
        }
      }
    }

    // Process data - store gradient factor, not final color
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

        // Calculate gradient factor (0-1) for color interpolation at render time
        let gradientFactor = 0;

        // Check for explicit fill color override from Python
        const fillOverride = item.fill || undefined;

        // Calculate gradient factor if no explicit fill color
        if (!fillOverride) {
          if (item.gradient !== undefined && item.gradient !== null) {
            // Use explicit gradient value from data
            if (this._options.normalizeGradients && gradientRange > 0) {
              // Use pre-calculated gradient bounds for normalization
              gradientFactor = (item.gradient - minGradient) / gradientRange;
              gradientFactor = Math.max(0, Math.min(1, gradientFactor)); // Clamp to 0-1 range
            } else {
              // Use gradient value directly (assuming 0-1 range)
              gradientFactor = Math.max(0, Math.min(1, item.gradient));
            }
          } else if (this._options.normalizeGradients && maxSpread > 0) {
            // Fall back to spread-based calculation
            const spread = Math.abs(upper - lower);
            gradientFactor = spread / maxSpread;
          }
        }

        const processed: GradientRibbonProcessedData = {
          time: item.time,
          upper,
          lower,
          gradientFactor,
        };

        if (fillOverride) {
          processed.fillOverride = fillOverride;
        }

        return processed;
      })
      .filter((item): item is GradientRibbonProcessedData => item !== null);
  }

  // Optional: Custom z-order default
  protected _getDefaultZOrder(): PrimitivePaneViewZOrder {
    return 'normal'; // Render in normal layer (in front of grid)
  }
}
