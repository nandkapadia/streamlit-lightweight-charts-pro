/**
 * Gradient Ribbon Series - Hybrid ICustomSeries + ISeriesPrimitive Implementation
 *
 * A custom series that renders two lines (upper and lower) with a gradient-filled area between them.
 *
 * Features:
 * - Two configurable lines (upper and lower)
 * - Gradient fill area between lines with color interpolation
 * - Hybrid rendering: ICustomSeries (default) or ISeriesPrimitive (background)
 * - Full autoscaling support
 * - Price axis labels for both lines
 * - Per-point fill colors or gradient interpolation based on spread
 *
 * Use cases:
 * - Volatility indicators with color-coded intensity
 * - ATR bands with gradient fills
 * - Any indicator where spread magnitude should be visually encoded
 *
 * @see RibbonSeriesPlugin for reference hybrid implementation
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
  IChartApi,
  PriceToCoordinateConverter,
} from 'lightweight-charts';
import { BitmapCoordinatesRenderingScope } from 'fancy-canvas';
import { isWhitespaceDataMultiField } from './base/commonRendering';
import { LineStyle } from '../../utils/renderingUtils';
import { drawMultiLine } from './base/commonRendering';
import { ChartCoordinateService } from '../../services/ChartCoordinateService';

// ============================================================================
// Data Interface
// ============================================================================

/**
 * Data point for Gradient Ribbon series
 *
 * @property time - Timestamp for the data point
 * @property upper - Y value of the upper line
 * @property lower - Y value of the lower line
 * @property fill - Optional override color for this point's fill (matches Python property name)
 */
export interface GradientRibbonData extends CustomData<Time> {
  time: Time;
  upper: number;
  lower: number;
  fill?: string; // Optional per-point fill color override (matches Python property name)
  gradient?: number; // Optional gradient value for color interpolation (0-1 or raw value)
}

// ============================================================================
// Options Interface
// ============================================================================

/**
 * Configuration options for Gradient Ribbon series
 */
export interface GradientRibbonSeriesOptions extends CustomSeriesOptions {
  // Upper line styling
  upperLineColor: string;
  upperLineWidth: LineWidth;
  upperLineStyle: LineStyle;
  upperLineVisible: boolean;

  // Lower line styling
  lowerLineColor: string;
  lowerLineWidth: LineWidth;
  lowerLineStyle: LineStyle;
  lowerLineVisible: boolean;

  // Fill styling
  fillVisible: boolean;

  // Gradient settings
  gradientStartColor: string;
  gradientEndColor: string;
  normalizeGradients: boolean; // If true, gradient is based on spread magnitude

  // Series options
  lastValueVisible: boolean;
  title: string;
  visible: boolean;
  priceLineVisible: boolean;

  // Internal flag (set automatically by factory)
  _usePrimitive?: boolean;
}

/**
 * Default options for Gradient Ribbon series
 * CRITICAL: Must match Python defaults
 */
const defaultGradientRibbonOptions: GradientRibbonSeriesOptions = {
  ...customSeriesDefaultOptions,
  upperLineColor: '#4CAF50',
  upperLineWidth: 2,
  upperLineStyle: LineStyle.Solid,
  upperLineVisible: true,
  lowerLineColor: '#F44336',
  lowerLineWidth: 2,
  lowerLineStyle: LineStyle.Solid,
  lowerLineVisible: true,
  fillVisible: true,
  gradientStartColor: '#4CAF50',
  gradientEndColor: '#F44336',
  normalizeGradients: true,
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Interpolate between two hex colors
 */
function interpolateColor(startColor: string, endColor: string, factor: number): string {
  // Clamp factor to 0-1 range
  factor = Math.max(0, Math.min(1, factor));

  // Parse hex colors
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
// ICustomSeries Implementation
// ============================================================================

/**
 * Gradient Ribbon Series - ICustomSeries implementation
 * Provides autoscaling and direct rendering
 */
class GradientRibbonSeries<TData extends GradientRibbonData = GradientRibbonData>
  implements ICustomSeriesPaneView<Time, TData, GradientRibbonSeriesOptions>
{
  private _renderer: GradientRibbonSeriesRenderer<TData>;

  constructor() {
    this._renderer = new GradientRibbonSeriesRenderer();
  }

  priceValueBuilder(plotRow: TData): CustomSeriesPricePlotValues {
    // Return both upper and lower for autoscaling
    return [plotRow.lower, plotRow.upper];
  }

  isWhitespace(
    data: TData | CustomSeriesWhitespaceData<Time>
  ): data is CustomSeriesWhitespaceData<Time> {
    return isWhitespaceDataMultiField(data, ['upper', 'lower']);
  }

  renderer(): ICustomSeriesPaneRenderer {
    return this._renderer;
  }

  update(data: PaneRendererCustomData<Time, TData>, options: GradientRibbonSeriesOptions): void {
    this._renderer.update(data, options);
  }

  defaultOptions(): GradientRibbonSeriesOptions {
    return defaultGradientRibbonOptions;
  }
}

/**
 * Gradient Ribbon Series Renderer - ICustomSeries
 * Only used when primitive is NOT attached
 */
class GradientRibbonSeriesRenderer<TData extends GradientRibbonData = GradientRibbonData>
  implements ICustomSeriesPaneRenderer
{
  private _data: PaneRendererCustomData<Time, TData> | null = null;
  private _options: GradientRibbonSeriesOptions | null = null;

  update(data: PaneRendererCustomData<Time, TData>, options: GradientRibbonSeriesOptions): void {
    this._data = data;
    this._options = options;
  }

  draw(target: any, priceConverter: PriceToCoordinateConverter): void {
    target.useBitmapCoordinateSpace((scope: BitmapCoordinatesRenderingScope) => {
      if (!this._data || !this._options || !this._data.bars.length) return;

      // Early exit if primitive handles rendering
      if (this._options._usePrimitive) return;

      const ctx = scope.context;
      const hRatio = scope.horizontalPixelRatio;

      ctx.save();

      // Convert data to screen coordinates
      const coordinates = this._convertToScreenCoordinates(scope, priceConverter);

      // Draw gradient fill area first (background)
      if (this._options.fillVisible && coordinates.length > 1) {
        this._drawGradientFill(ctx, coordinates, hRatio);
      }

      // Create coordinate arrays for lines (without fillColor)
      const lineCoordinates = coordinates.map(coord => ({
        x: coord.x,
        upper: coord.upper,
        lower: coord.lower,
      }));

      // Draw lines (foreground)
      if (this._options.upperLineVisible) {
        drawMultiLine(
          ctx,
          lineCoordinates,
          'upper',
          this._options.upperLineColor,
          this._options.upperLineWidth * hRatio,
          this._options.upperLineStyle
        );
      }

      if (this._options.lowerLineVisible) {
        drawMultiLine(
          ctx,
          lineCoordinates,
          'lower',
          this._options.lowerLineColor,
          this._options.lowerLineWidth * hRatio,
          this._options.lowerLineStyle
        );
      }

      ctx.restore();
    });
  }

  private _convertToScreenCoordinates(
    scope: BitmapCoordinatesRenderingScope,
    priceConverter: PriceToCoordinateConverter
  ) {
    if (!this._data || !this._options) return [];

    // Use the centralized coordinate service for basic conversion
    const coordinateService = ChartCoordinateService.getInstance();
    const baseCoordinates = coordinateService.convertSeriesDataToScreenCoordinates(
      this._data.bars as unknown as Array<{ x: number; originalData: Record<string, any> }>,
      scope,
      priceConverter,
      ChartCoordinateService.SeriesDataConfigs.gradientRibbon
    );

    // Calculate gradient bounds for normalization
    let maxSpread = 0;
    let minGradient = 0;
    let maxGradient = 1;
    let gradientRange = 1;

    // Calculate gradient bounds if we have gradient data and normalization is enabled
    const gradientValues = this._data.bars
      .map(bar => bar.originalData.gradient)
      .filter(val => val !== undefined && val !== null) as number[];

    if (gradientValues.length > 0 && this._options.normalizeGradients) {
      minGradient = Math.min(...gradientValues);
      maxGradient = Math.max(...gradientValues);
      gradientRange = maxGradient - minGradient;
    }

    // Calculate max spread for fallback gradient calculation
    if (this._options.normalizeGradients && gradientValues.length === 0) {
      for (const bar of this._data.bars) {
        const data = bar.originalData;
        if (
          typeof data.upper === 'number' &&
          typeof data.lower === 'number' &&
          isFinite(data.upper) &&
          isFinite(data.lower)
        ) {
          const spread = Math.abs(data.upper - data.lower);
          maxSpread = Math.max(maxSpread, spread);
        }
      }
    }

    // Calculate gradient factor for each data point, then apply colors at render time
    const coordinates: Array<{
      x: number;
      upper: number;
      lower: number;
      gradientFactor: number;
      fillOverride?: string;
    }> = [];

    for (let i = 0; i < baseCoordinates.length; i++) {
      const coord = baseCoordinates[i];
      const originalData = this._data.bars[i].originalData;

      // Calculate gradient factor (0-1)
      let gradientFactor = 0;
      const fillOverride = originalData.fill || undefined;

      // Calculate gradient factor if no explicit fill override
      if (!fillOverride) {
        if (originalData.gradient !== undefined) {
          // Use explicit gradient value from data
          if (this._options.normalizeGradients && gradientRange > 0) {
            // Use pre-calculated gradient bounds for normalization
            gradientFactor = (originalData.gradient - minGradient) / gradientRange;
            gradientFactor = Math.max(0, Math.min(1, gradientFactor)); // Clamp to 0-1 range
          } else {
            // Use gradient value directly (assuming 0-1 range)
            gradientFactor = Math.max(0, Math.min(1, originalData.gradient));
          }
        } else if (this._options && this._options.normalizeGradients && maxSpread > 0) {
          // Fall back to spread-based calculation
          const spread = Math.abs(originalData.upper - originalData.lower);
          gradientFactor = spread / maxSpread;
        }
      }

      // Skip null coordinates
      if (coord.x !== null && coord.upper !== null && coord.lower !== null) {
        coordinates.push({
          x: coord.x,
          upper: coord.upper,
          lower: coord.lower,
          gradientFactor,
          fillOverride,
        });
      }
    }

    // Convert gradient factors to fill colors using current options
    const coordinatesWithColors = coordinates.map(coord => {
      let fillColor = this._options?.gradientStartColor ?? '#4CAF50'; // Use gradient start as fallback

      if (coord.fillOverride) {
        fillColor = coord.fillOverride;
      } else if (this._options) {
        // Always calculate from gradient factor (factor=0 gives gradientStartColor)
        fillColor = interpolateColor(
          this._options.gradientStartColor,
          this._options.gradientEndColor,
          coord.gradientFactor
        );
      }

      return {
        x: coord.x,
        upper: coord.upper,
        lower: coord.lower,
        fillColor,
      };
    });

    return coordinatesWithColors;
  }

  private _drawGradientFill(
    ctx: CanvasRenderingContext2D,
    coordinates: Array<{ x: number; upper: number; lower: number; fillColor: string }>,
    _hRatio: number
  ): void {
    if (coordinates.length < 2) return;

    const firstX = coordinates[0].x;
    const lastX = coordinates[coordinates.length - 1].x;

    // Create linear gradient from first to last point
    const gradient = ctx.createLinearGradient(firstX, 0, lastX, 0);

    // Add color stops for each coordinate
    for (let i = 0; i < coordinates.length; i++) {
      const coord = coordinates[i];
      const position = (coord.x - firstX) / (lastX - firstX);
      const clampedPosition = Math.max(0, Math.min(1, position));
      gradient.addColorStop(clampedPosition, coord.fillColor);
    }

    // Draw filled area with gradient
    ctx.beginPath();

    // Draw upper boundary (left to right)
    ctx.moveTo(coordinates[0].x, coordinates[0].upper);
    for (let i = 1; i < coordinates.length; i++) {
      ctx.lineTo(coordinates[i].x, coordinates[i].upper);
    }

    // Draw lower boundary (right to left)
    for (let i = coordinates.length - 1; i >= 0; i--) {
      ctx.lineTo(coordinates[i].x, coordinates[i].lower);
    }

    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Factory function to create Gradient Ribbon series with optional primitive
 *
 * Two rendering modes:
 * 1. **Direct ICustomSeries rendering (default, usePrimitive: false)**
 *    - Series renders lines and gradient fill directly
 *    - Normal z-order with other series
 *    - Best for most use cases
 *
 * 2. **Primitive rendering mode (usePrimitive: true)**
 *    - Series provides autoscaling only (no rendering)
 *    - Primitive handles rendering with custom z-order
 *    - Can render in background (zIndex: -100) or foreground
 *    - Best for background indicators
 *
 * @param chart - Chart instance
 * @param options - Gradient Ribbon series options
 * @param options.upperLineColor - Upper line color (default: '#4CAF50')
 * @param options.lowerLineColor - Lower line color (default: '#F44336')
 * @param options.gradientStartColor - Gradient start color (default: '#4CAF50')
 * @param options.gradientEndColor - Gradient end color (default: '#F44336')
 * @param options.normalizeGradients - Normalize gradient by spread (default: true)
 * @param options.usePrimitive - Enable primitive rendering mode
 * @param options.zIndex - Z-order for primitive mode (default: -100)
 * @param options.data - Initial data
 * @returns ICustomSeries instance
 *
 * @example Standard usage
 * ```typescript
 * const series = createGradientRibbonSeries(chart, {
 *   gradientStartColor: '#4CAF50',
 *   gradientEndColor: '#F44336',
 *   normalizeGradients: true,
 * });
 * series.setData(data);
 * ```
 *
 * @example Background rendering with primitive
 * ```typescript
 * const series = createGradientRibbonSeries(chart, {
 *   usePrimitive: true,
 *   zIndex: -100,
 *   data: gradientRibbonData,
 * });
 * ```
 */
export function createGradientRibbonSeries(
  chart: IChartApi,
  options: {
    // Visual options
    upperLineColor?: string;
    upperLineWidth?: LineWidth;
    upperLineStyle?: LineStyle;
    upperLineVisible?: boolean;
    lowerLineColor?: string;
    lowerLineWidth?: LineWidth;
    lowerLineStyle?: LineStyle;
    lowerLineVisible?: boolean;
    fillVisible?: boolean;
    gradientStartColor?: string;
    gradientEndColor?: string;
    normalizeGradients?: boolean;
    priceScaleId?: string;

    // Series options
    lastValueVisible?: boolean;
    title?: string;
    visible?: boolean;
    priceLineVisible?: boolean;

    // Rendering control
    usePrimitive?: boolean;

    // Primitive-specific options
    zIndex?: number;
    data?: GradientRibbonData[];
  } = {}
): any {
  // Create ICustomSeries (always created for autoscaling)
  const series = chart.addCustomSeries(new GradientRibbonSeries(), {
    _seriesType: 'GradientRibbon', // Internal property for series type identification
    upperLineColor: options.upperLineColor ?? '#4CAF50',
    upperLineWidth: options.upperLineWidth ?? 2,
    upperLineStyle: options.upperLineStyle ?? LineStyle.Solid,
    upperLineVisible: options.upperLineVisible !== false,
    lowerLineColor: options.lowerLineColor ?? '#F44336',
    lowerLineWidth: options.lowerLineWidth ?? 2,
    lowerLineStyle: options.lowerLineStyle ?? LineStyle.Solid,
    lowerLineVisible: options.lowerLineVisible !== false,
    fillVisible: options.fillVisible !== false,
    gradientStartColor: options.gradientStartColor ?? '#4CAF50',
    gradientEndColor: options.gradientEndColor ?? '#F44336',
    normalizeGradients: options.normalizeGradients !== false,
    priceScaleId: options.priceScaleId ?? 'right',
    lastValueVisible: options.lastValueVisible ?? false,
    priceLineVisible: options.priceLineVisible ?? false,
    visible: options.visible ?? true,
    title: options.title,
    _usePrimitive: options.usePrimitive ?? false, // Internal flag to disable rendering
  } as any);

  // Set data on series (for autoscaling)
  if (options.data && options.data.length > 0) {
    series.setData(options.data);
  }

  // Attach primitive if requested
  if (options.usePrimitive) {
    // Dynamic import to avoid circular dependencies
    void import('../../primitives/GradientRibbonPrimitive').then(({ GradientRibbonPrimitive }) => {
      const primitive = new GradientRibbonPrimitive(chart, {
        upperLineColor: options.upperLineColor ?? '#4CAF50',
        upperLineWidth: options.upperLineWidth ?? 2,
        upperLineStyle: Math.min(options.upperLineStyle ?? LineStyle.Solid, 2) as 0 | 1 | 2,
        upperLineVisible: options.upperLineVisible !== false,
        lowerLineColor: options.lowerLineColor ?? '#F44336',
        lowerLineWidth: options.lowerLineWidth ?? 2,
        lowerLineStyle: Math.min(options.lowerLineStyle ?? LineStyle.Solid, 2) as 0 | 1 | 2,
        lowerLineVisible: options.lowerLineVisible !== false,
        fillVisible: options.fillVisible !== false,
        gradientStartColor: options.gradientStartColor ?? '#4CAF50',
        gradientEndColor: options.gradientEndColor ?? '#F44336',
        normalizeGradients: options.normalizeGradients !== false,
        visible: true,
        priceScaleId: options.priceScaleId ?? 'right',
        zIndex: options.zIndex ?? 0,
      });

      series.attachPrimitive(primitive);
    });
  }

  return series;
}
