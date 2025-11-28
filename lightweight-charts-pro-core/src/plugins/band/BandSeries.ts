/**
 * Band Series - ICustomSeries Implementation
 *
 * A custom series that renders three lines (upper, middle, lower) with filled areas between them.
 *
 * Features:
 * - Three configurable lines (upper, middle, lower)
 * - Two fill areas (upper fill between upper/middle, lower fill between middle/lower)
 * - Full autoscaling support
 *
 * Use cases:
 * - Bollinger Bands with middle line
 * - Keltner Channels
 * - Any indicator with upper/middle/lower bounds
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
  drawMultiLine,
  drawFillArea,
} from '../shared/rendering';

// ============================================================================
// Data Interface
// ============================================================================

/**
 * Data point for Band series
 *
 * @property time - Timestamp for the data point
 * @property upper - Y value of the upper line
 * @property middle - Y value of the middle line
 * @property lower - Y value of the lower line
 */
export interface BandData extends CustomData<Time> {
  time: Time;
  upper: number;
  middle: number;
  lower: number;
}

// ============================================================================
// Options Interface
// ============================================================================

/**
 * Configuration options for Band series
 */
export interface BandSeriesOptions extends CustomSeriesOptions {
  // Upper line styling
  upperLineColor: string;
  upperLineWidth: LineWidth;
  upperLineStyle: LineStyle;
  upperLineVisible: boolean;

  // Middle line styling
  middleLineColor: string;
  middleLineWidth: LineWidth;
  middleLineStyle: LineStyle;
  middleLineVisible: boolean;

  // Lower line styling
  lowerLineColor: string;
  lowerLineWidth: LineWidth;
  lowerLineStyle: LineStyle;
  lowerLineVisible: boolean;

  // Fill styling
  upperFillColor: string;
  upperFill: boolean;
  lowerFillColor: string;
  lowerFill: boolean;

  // Series options
  lastValueVisible: boolean;
  title: string;
  visible: boolean;
  priceLineVisible: boolean;
}

/**
 * Default options for Band series
 */
export const defaultBandOptions: BandSeriesOptions = {
  ...customSeriesDefaultOptions,
  upperLineColor: '#4CAF50',
  upperLineWidth: 2,
  upperLineStyle: LineStyle.Solid,
  upperLineVisible: true,
  middleLineColor: '#2196F3',
  middleLineWidth: 2,
  middleLineStyle: LineStyle.Solid,
  middleLineVisible: true,
  lowerLineColor: '#F44336',
  lowerLineWidth: 2,
  lowerLineStyle: LineStyle.Solid,
  lowerLineVisible: true,
  upperFillColor: 'rgba(76, 175, 80, 0.1)',
  upperFill: true,
  lowerFillColor: 'rgba(244, 67, 54, 0.1)',
  lowerFill: true,
};

// ============================================================================
// Renderer Implementation
// ============================================================================

/**
 * Band Series Renderer - ICustomSeries
 */
class BandSeriesRenderer<TData extends BandData = BandData> implements ICustomSeriesPaneRenderer {
  private _data: PaneRendererCustomData<Time, TData> | null = null;
  private _options: BandSeriesOptions | null = null;

  update(data: PaneRendererCustomData<Time, TData>, options: BandSeriesOptions): void {
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
      const { upper, middle, lower } = bar.originalData;
      return {
        x: bar.x * renderingScope.horizontalPixelRatio,
        upperY: (priceToCoordinate(upper) ?? 0) * renderingScope.verticalPixelRatio,
        middleY: (priceToCoordinate(middle) ?? 0) * renderingScope.verticalPixelRatio,
        lowerY: (priceToCoordinate(lower) ?? 0) * renderingScope.verticalPixelRatio,
      };
    });

    const ctx = renderingScope.context;
    ctx.save();

    // Draw in z-order (background to foreground)
    if (options.upperFill) {
      drawFillArea(
        ctx,
        bars,
        'upperY',
        'middleY',
        options.upperFillColor,
        visibleRange.from,
        visibleRange.to
      );
    }

    if (options.lowerFill) {
      drawFillArea(
        ctx,
        bars,
        'middleY',
        'lowerY',
        options.lowerFillColor,
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

    if (options.middleLineVisible) {
      drawMultiLine(
        ctx,
        bars,
        'middleY',
        options.middleLineColor,
        options.middleLineWidth * renderingScope.horizontalPixelRatio,
        options.middleLineStyle,
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
 * Band Series - ICustomSeries implementation
 * Provides autoscaling and direct rendering
 */
export class BandSeries<TData extends BandData = BandData>
  implements ICustomSeriesPaneView<Time, TData, BandSeriesOptions>
{
  private _renderer: BandSeriesRenderer<TData>;

  constructor() {
    this._renderer = new BandSeriesRenderer();
  }

  priceValueBuilder(plotRow: TData): CustomSeriesPricePlotValues {
    return [plotRow.lower, plotRow.middle, plotRow.upper];
  }

  isWhitespace(
    data: TData | CustomSeriesWhitespaceData<Time>
  ): data is CustomSeriesWhitespaceData<Time> {
    return isWhitespaceDataMultiField(data, ['upper', 'middle', 'lower']);
  }

  renderer(): ICustomSeriesPaneRenderer {
    return this._renderer;
  }

  update(data: PaneRendererCustomData<Time, TData>, options: BandSeriesOptions): void {
    this._renderer.update(data, options);
  }

  defaultOptions(): BandSeriesOptions {
    return defaultBandOptions;
  }
}

/**
 * Factory function to create Band series plugin
 */
export function BandSeriesPlugin(): ICustomSeriesPaneView<Time, BandData, BandSeriesOptions> {
  return new BandSeries();
}
