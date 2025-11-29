/**
 * Gradient Ribbon Series - ICustomSeries Implementation
 *
 * A custom series that renders two lines (upper and lower) with a gradient-filled area between them.
 *
 * Features:
 * - Two configurable lines (upper and lower)
 * - Gradient fill area between lines with color interpolation
 * - Full autoscaling support
 * - Per-point fill colors or gradient interpolation based on spread
 *
 * Use cases:
 * - Volatility indicators with color-coded intensity
 * - ATR bands with gradient fills
 * - Any indicator where spread magnitude should be visually encoded
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
  IChartApi,
} from 'lightweight-charts';
import { BitmapCoordinatesRenderingScope, CanvasRenderingTarget2D } from 'fancy-canvas';
import { isWhitespaceDataMultiField, LineStyle, drawMultiLine } from '../shared/rendering';
import { interpolateColor } from '../../utils/colors';

// ============================================================================
// Data Interface
// ============================================================================

/**
 * Data point for Gradient Ribbon series
 *
 * @property time - Timestamp for the data point
 * @property upper - Y value of the upper line
 * @property lower - Y value of the lower line
 * @property fill - Optional override color for this point's fill
 * @property gradient - Optional gradient value for color interpolation (0-1 or raw value)
 */
export interface GradientRibbonData extends CustomData<Time> {
  time: Time;
  upper: number;
  lower: number;
  fill?: string;
  gradient?: number;
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
  normalizeGradients: boolean;

  // Series options
  lastValueVisible: boolean;
  title: string;
  visible: boolean;
  priceLineVisible: boolean;
}

/**
 * Default options for Gradient Ribbon series
 */
export const defaultGradientRibbonOptions: GradientRibbonSeriesOptions = {
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
// Renderer Implementation
// ============================================================================

/**
 * Gradient Ribbon Series Renderer - ICustomSeries
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

  draw(
    target: CanvasRenderingTarget2D,
    priceConverter: PriceToCoordinateConverter,
    _isHovered: boolean,
    _hitTestData?: unknown
  ): void {
    target.useBitmapCoordinateSpace((scope: BitmapCoordinatesRenderingScope) => {
      if (!this._data || !this._options || !this._data.bars.length) return;

      const ctx = scope.context;
      const hRatio = scope.horizontalPixelRatio;

      ctx.save();

      // Convert data to screen coordinates
      const coordinates = this._convertToScreenCoordinates(scope, priceConverter);

      // Draw gradient fill area first (background)
      if (this._options.fillVisible && coordinates.length > 1) {
        this._drawGradientFill(ctx, coordinates);
      }

      // Create coordinate arrays for lines
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

    // Calculate gradient bounds for normalization
    let maxSpread = 0;
    let minGradient = 0;
    let maxGradient = 1;
    let gradientRange = 1;

    const gradientValues = this._data.bars
      .map(bar => bar.originalData.gradient)
      .filter(val => val !== undefined && val !== null) as number[];

    if (gradientValues.length > 0 && this._options.normalizeGradients) {
      minGradient = Math.min(...gradientValues);
      maxGradient = Math.max(...gradientValues);
      gradientRange = maxGradient - minGradient;
    }

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

    const coordinates: Array<{
      x: number;
      upper: number;
      lower: number;
      fillColor: string;
    }> = [];

    for (const bar of this._data.bars) {
      const originalData = bar.originalData;

      // Calculate gradient factor (0-1)
      let gradientFactor = 0;
      const fillOverride = originalData.fill;

      if (!fillOverride) {
        if (originalData.gradient !== undefined) {
          if (this._options.normalizeGradients && gradientRange > 0) {
            gradientFactor = (originalData.gradient - minGradient) / gradientRange;
            gradientFactor = Math.max(0, Math.min(1, gradientFactor));
          } else {
            gradientFactor = Math.max(0, Math.min(1, originalData.gradient));
          }
        } else if (this._options.normalizeGradients && maxSpread > 0) {
          const spread = Math.abs(originalData.upper - originalData.lower);
          gradientFactor = spread / maxSpread;
        }
      }

      // Calculate fill color
      let fillColor = fillOverride;
      if (!fillColor) {
        fillColor = interpolateColor(
          this._options.gradientStartColor,
          this._options.gradientEndColor,
          gradientFactor
        );
      }

      const upperY = priceConverter(originalData.upper);
      const lowerY = priceConverter(originalData.lower);

      if (upperY !== null && lowerY !== null) {
        coordinates.push({
          x: bar.x * scope.horizontalPixelRatio,
          upper: upperY * scope.verticalPixelRatio,
          lower: lowerY * scope.verticalPixelRatio,
          fillColor,
        });
      }
    }

    return coordinates;
  }

  private _drawGradientFill(
    ctx: CanvasRenderingContext2D,
    coordinates: Array<{ x: number; upper: number; lower: number; fillColor: string }>
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

    ctx.moveTo(coordinates[0].x, coordinates[0].upper);
    for (let i = 1; i < coordinates.length; i++) {
      ctx.lineTo(coordinates[i].x, coordinates[i].upper);
    }

    for (let i = coordinates.length - 1; i >= 0; i--) {
      ctx.lineTo(coordinates[i].x, coordinates[i].lower);
    }

    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();
  }
}

// ============================================================================
// ICustomSeries Implementation
// ============================================================================

/**
 * Gradient Ribbon Series - ICustomSeries implementation
 * Provides autoscaling and direct rendering
 */
export class GradientRibbonSeries<TData extends GradientRibbonData = GradientRibbonData>
  implements ICustomSeriesPaneView<Time, TData, GradientRibbonSeriesOptions>
{
  private _renderer: GradientRibbonSeriesRenderer<TData>;

  constructor() {
    this._renderer = new GradientRibbonSeriesRenderer();
  }

  priceValueBuilder(plotRow: TData): CustomSeriesPricePlotValues {
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
 * Factory function to create Gradient Ribbon series plugin
 */
export function GradientRibbonSeriesPlugin(): ICustomSeriesPaneView<
  Time,
  GradientRibbonData,
  GradientRibbonSeriesOptions
> {
  return new GradientRibbonSeries();
}

/**
 * Create GradientRibbon series
 *
 * @param chart - Chart instance
 * @param options - Configuration options
 * @returns ICustomSeries instance
 */
export function createGradientRibbonSeries(
  chart: IChartApi,
  options: Partial<GradientRibbonSeriesOptions> & {
    usePrimitive?: boolean;
    zIndex?: number;
    data?: GradientRibbonData[];
    paneId?: number;
  } = {}
): any {
  const paneId = options.paneId ?? 0;

  const series = (chart as any).addCustomSeries(GradientRibbonSeriesPlugin(), {
    ...defaultGradientRibbonOptions,
    priceScaleId: 'right',
    ...options,
    _seriesType: 'GradientRibbon',
    _usePrimitive: options.usePrimitive ?? false,
  }, paneId);

  if (options.data && options.data.length > 0) {
    series.setData(options.data);
  }

  if (options.usePrimitive) {
    console.warn('GradientRibbonPrimitive not yet available in core - using series rendering instead');
  }

  return series;
}
