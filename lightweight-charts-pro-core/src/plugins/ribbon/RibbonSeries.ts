/**
 * Ribbon Series - ICustomSeries Implementation
 *
 * A custom series that renders two lines (upper and lower) with a filled area between them.
 *
 * Features:
 * - Two configurable lines (upper and lower)
 * - Fill area between lines with customizable color
 * - Full autoscaling support
 *
 * Use cases:
 * - Bollinger Bands
 * - Keltner Channels
 * - Donchian Channels
 * - Any indicator with upper/lower bounds
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
import {
  isWhitespaceDataMultiField,
  LineStyle,
  drawFillArea,
  drawMultiLine,
} from '../shared/rendering';

// ============================================================================
// Data Interface
// ============================================================================

/**
 * Data point for Ribbon series
 *
 * @property time - Timestamp for the data point
 * @property upper - Y value of the upper line
 * @property lower - Y value of the lower line
 */
export interface RibbonData extends CustomData<Time> {
  time: Time;
  upper: number;
  lower: number;
}

// ============================================================================
// Options Interface
// ============================================================================

/**
 * Configuration options for Ribbon series
 */
export interface RibbonSeriesOptions extends CustomSeriesOptions {
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
  fillColor: string;
  fillVisible: boolean;

  // Series options
  lastValueVisible: boolean;
  title: string;
  visible: boolean;
  priceLineVisible: boolean;
}

/**
 * Default options for Ribbon series
 */
export const defaultRibbonOptions: RibbonSeriesOptions = {
  ...customSeriesDefaultOptions,
  upperLineColor: '#4CAF50',
  upperLineWidth: 2,
  upperLineStyle: LineStyle.Solid,
  upperLineVisible: true,
  lowerLineColor: '#F44336',
  lowerLineWidth: 2,
  lowerLineStyle: LineStyle.Solid,
  lowerLineVisible: true,
  fillColor: 'rgba(76, 175, 80, 0.1)',
  fillVisible: true,
};

// ============================================================================
// Renderer Implementation
// ============================================================================

/**
 * Ribbon Series Renderer - ICustomSeries
 */
class RibbonSeriesRenderer<TData extends RibbonData = RibbonData>
  implements ICustomSeriesPaneRenderer
{
  private _data: PaneRendererCustomData<Time, TData> | null = null;
  private _options: RibbonSeriesOptions | null = null;

  update(data: PaneRendererCustomData<Time, TData>, options: RibbonSeriesOptions): void {
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
    const bars = this._data.bars.map(bar => {
      const { upper, lower } = bar.originalData;
      return {
        x: bar.x * renderingScope.horizontalPixelRatio,
        upperY: (priceToCoordinate(upper) ?? 0) * renderingScope.verticalPixelRatio,
        lowerY: (priceToCoordinate(lower) ?? 0) * renderingScope.verticalPixelRatio,
      };
    });

    const ctx = renderingScope.context;
    ctx.save();

    // Draw in z-order (background to foreground)
    if (options.fillVisible) {
      drawFillArea(
        ctx,
        bars,
        'upperY',
        'lowerY',
        options.fillColor,
        visibleRange.from,
        visibleRange.to
      );
    }

    if (options.upperLineVisible) {
      drawMultiLine(
        ctx,
        bars,
        'upperY',
        options.upperLineColor,
        options.upperLineWidth * renderingScope.horizontalPixelRatio,
        options.upperLineStyle,
        visibleRange.from,
        visibleRange.to
      );
    }

    if (options.lowerLineVisible) {
      drawMultiLine(
        ctx,
        bars,
        'lowerY',
        options.lowerLineColor,
        options.lowerLineWidth * renderingScope.horizontalPixelRatio,
        options.lowerLineStyle,
        visibleRange.from,
        visibleRange.to
      );
    }

    ctx.restore();
  }
}

// ============================================================================
// ICustomSeries Implementation
// ============================================================================

/**
 * Ribbon Series - ICustomSeries implementation
 * Provides autoscaling and direct rendering
 */
export class RibbonSeries<TData extends RibbonData = RibbonData>
  implements ICustomSeriesPaneView<Time, TData, RibbonSeriesOptions>
{
  private _renderer: RibbonSeriesRenderer<TData>;

  constructor() {
    this._renderer = new RibbonSeriesRenderer();
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

  update(data: PaneRendererCustomData<Time, TData>, options: RibbonSeriesOptions): void {
    this._renderer.update(data, options);
  }

  defaultOptions(): RibbonSeriesOptions {
    return defaultRibbonOptions;
  }
}

/**
 * Factory function to create Ribbon series plugin
 */
export function RibbonSeriesPlugin(): ICustomSeriesPaneView<Time, RibbonData, RibbonSeriesOptions> {
  return new RibbonSeries();
}
