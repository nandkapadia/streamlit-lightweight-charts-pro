/**
 * Band Series - Hybrid ICustomSeries + ISeriesPrimitive Implementation
 *
 * A custom series that renders three lines (upper, middle, lower) with filled areas between them.
 *
 * Features:
 * - Three configurable lines (upper, middle, lower)
 * - Two fill areas (upper fill between upper/middle, lower fill between middle/lower)
 * - Hybrid rendering: ICustomSeries (default) or ISeriesPrimitive (background)
 * - Full autoscaling support
 * - Price axis labels for all three lines
 *
 * Use cases:
 * - Bollinger Bands with middle line
 * - Keltner Channels
 * - Any indicator with upper/middle/lower bounds
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
import { drawMultiLine, drawFillArea } from './base/commonRendering';

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

  // Series options
  lastValueVisible: boolean;
  title: string;
  visible: boolean;
  priceLineVisible: boolean;
  upperFillVisible: boolean;
  lowerFillColor: string;
  lowerFillVisible: boolean;

  // Internal flag (set automatically by factory)
  _usePrimitive?: boolean;
}

/**
 * Default options for Band series
 * CRITICAL: Must match Python defaults
 */
const defaultBandOptions: BandSeriesOptions = {
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
  upperFillVisible: true,
  lowerFillColor: 'rgba(244, 67, 54, 0.1)',
  lowerFillVisible: true,
};

// ============================================================================
// ICustomSeries Implementation
// ============================================================================

/**
 * Band Series - ICustomSeries implementation
 * Provides autoscaling and direct rendering
 */
class BandSeries<TData extends BandData = BandData>
  implements ICustomSeriesPaneView<Time, TData, BandSeriesOptions>
{
  private _renderer: BandSeriesRenderer<TData>;

  constructor() {
    this._renderer = new BandSeriesRenderer();
  }

  priceValueBuilder(plotRow: TData): CustomSeriesPricePlotValues {
    // Return all three values for autoscaling
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
 * Band Series Renderer - ICustomSeries
 * Only used when primitive is NOT attached
 */
class BandSeriesRenderer<TData extends BandData = BandData> implements ICustomSeriesPaneRenderer {
  private _data: PaneRendererCustomData<Time, TData> | null = null;
  private _options: BandSeriesOptions | null = null;

  update(data: PaneRendererCustomData<Time, TData>, options: BandSeriesOptions): void {
    this._data = data;
    this._options = options;
  }

  draw(target: any, priceConverter: PriceToCoordinateConverter): void {
    target.useBitmapCoordinateSpace((scope: BitmapCoordinatesRenderingScope) => {
      this._drawImpl(scope, priceConverter);
    });
  }

  /**
   * Main drawing implementation following TradingView's plugin pattern
   * Converts all bars to screen coordinates once, then draws visible range
   */
  private _drawImpl(
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
    // Using shared rendering functions with visibleRange for optimal performance
    if (options.upperFillVisible) {
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

    if (options.lowerFillVisible) {
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
// Factory Function
// ============================================================================

/**
 * Factory function to create Band series with optional primitive
 *
 * Two rendering modes:
 * 1. **Direct ICustomSeries rendering (default, usePrimitive: false)**
 *    - Series renders lines and fills directly
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
 * @param options - Band series options
 * @param options.upperLineColor - Upper line color (default: '#4CAF50')
 * @param options.middleLineColor - Middle line color (default: '#2196F3')
 * @param options.lowerLineColor - Lower line color (default: '#F44336')
 * @param options.upperFillColor - Upper fill color (default: 'rgba(76, 175, 80, 0.1)')
 * @param options.lowerFillColor - Lower fill color (default: 'rgba(244, 67, 54, 0.1)')
 * @param options.usePrimitive - Enable primitive rendering mode
 * @param options.zIndex - Z-order for primitive mode (default: -100)
 * @param options.data - Initial data
 * @returns ICustomSeries instance
 *
 * @example Standard usage
 * ```typescript
 * const series = createBandSeries(chart, {
 *   upperLineColor: '#4CAF50',
 *   middleLineColor: '#2196F3',
 *   lowerLineColor: '#F44336',
 * });
 * series.setData(data);
 * ```
 *
 * @example Background rendering with primitive
 * ```typescript
 * const series = createBandSeries(chart, {
 *   usePrimitive: true,
 *   zIndex: -100,
 *   data: bandData,
 * });
 * ```
 */
export function createBandSeries(
  chart: IChartApi,
  options: {
    // Visual options
    upperLineColor?: string;
    upperLineWidth?: LineWidth;
    upperLineStyle?: LineStyle;
    upperLineVisible?: boolean;
    middleLineColor?: string;
    middleLineWidth?: LineWidth;
    middleLineStyle?: LineStyle;
    middleLineVisible?: boolean;
    lowerLineColor?: string;
    lowerLineWidth?: LineWidth;
    lowerLineStyle?: LineStyle;
    lowerLineVisible?: boolean;
    upperFillColor?: string;
    upperFillVisible?: boolean;
    lowerFillColor?: string;
    lowerFillVisible?: boolean;
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
    data?: BandData[];
  } = {}
): any {
  // Create ICustomSeries (always created for autoscaling)
  const series = chart.addCustomSeries(new BandSeries(), {
    _seriesType: 'Band', // Internal property for series type identification
    upperLineColor: options.upperLineColor ?? '#4CAF50',
    upperLineWidth: options.upperLineWidth ?? 2,
    upperLineStyle: options.upperLineStyle ?? LineStyle.Solid,
    upperLineVisible: options.upperLineVisible !== false,
    middleLineColor: options.middleLineColor ?? '#2196F3',
    middleLineWidth: options.middleLineWidth ?? 2,
    middleLineStyle: options.middleLineStyle ?? LineStyle.Solid,
    middleLineVisible: options.middleLineVisible !== false,
    lowerLineColor: options.lowerLineColor ?? '#F44336',
    lowerLineWidth: options.lowerLineWidth ?? 2,
    lowerLineStyle: options.lowerLineStyle ?? LineStyle.Solid,
    lowerLineVisible: options.lowerLineVisible !== false,
    upperFillColor: options.upperFillColor ?? 'rgba(76, 175, 80, 0.1)',
    upperFillVisible: options.upperFillVisible !== false,
    lowerFillColor: options.lowerFillColor ?? 'rgba(244, 67, 54, 0.1)',
    lowerFillVisible: options.lowerFillVisible !== false,
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
    void import('../../primitives/BandPrimitive').then(({ BandPrimitive }) => {
      const primitive = new BandPrimitive(chart, {
        upperLineColor: options.upperLineColor ?? '#4CAF50',
        upperLineWidth: options.upperLineWidth ?? 2,
        upperLineStyle: Math.min(options.upperLineStyle ?? LineStyle.Solid, 2) as 0 | 1 | 2,
        upperLineVisible: options.upperLineVisible !== false,
        middleLineColor: options.middleLineColor ?? '#2196F3',
        middleLineWidth: options.middleLineWidth ?? 2,
        middleLineStyle: Math.min(options.middleLineStyle ?? LineStyle.Solid, 2) as 0 | 1 | 2,
        middleLineVisible: options.middleLineVisible !== false,
        lowerLineColor: options.lowerLineColor ?? '#F44336',
        lowerLineWidth: options.lowerLineWidth ?? 2,
        lowerLineStyle: Math.min(options.lowerLineStyle ?? LineStyle.Solid, 2) as 0 | 1 | 2,
        lowerLineVisible: options.lowerLineVisible !== false,
        upperFillColor: options.upperFillColor ?? 'rgba(76, 175, 80, 0.1)',
        upperFillVisible: options.upperFillVisible !== false,
        lowerFillColor: options.lowerFillColor ?? 'rgba(244, 67, 54, 0.1)',
        lowerFillVisible: options.lowerFillVisible !== false,
        visible: true,
        priceScaleId: options.priceScaleId ?? 'right',
        zIndex: options.zIndex ?? 0,
      });

      series.attachPrimitive(primitive);
    });
  }

  return series;
}
