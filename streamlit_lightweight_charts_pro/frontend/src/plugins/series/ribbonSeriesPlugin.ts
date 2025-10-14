/**
 * Ribbon Series - Hybrid ICustomSeries + ISeriesPrimitive Implementation
 *
 * A custom series that renders two lines (upper and lower) with a filled area between them.
 *
 * Features:
 * - Two configurable lines (upper and lower)
 * - Fill area between lines with customizable color
 * - Hybrid rendering: ICustomSeries (default) or ISeriesPrimitive (background)
 * - Full autoscaling support
 * - Price axis labels for both lines
 *
 * Use cases:
 * - Bollinger Bands
 * - Keltner Channels
 * - Donchian Channels
 * - Any indicator with upper/lower bounds
 *
 * @see TrendFillSeriesPlugin for reference hybrid implementation
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
import { drawFillArea, drawMultiLine } from './base/commonRendering';

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

  // Internal flag (set automatically by factory)
  _usePrimitive?: boolean;
}

/**
 * Default options for Ribbon series
 * CRITICAL: Must match Python defaults
 */
const defaultRibbonOptions: RibbonSeriesOptions = {
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
// ICustomSeries Implementation
// ============================================================================

/**
 * Ribbon Series - ICustomSeries implementation
 * Provides autoscaling and direct rendering
 */
class RibbonSeries<TData extends RibbonData = RibbonData>
  implements ICustomSeriesPaneView<Time, TData, RibbonSeriesOptions>
{
  private _renderer: RibbonSeriesRenderer<TData>;

  constructor() {
    this._renderer = new RibbonSeriesRenderer();
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

  update(data: PaneRendererCustomData<Time, TData>, options: RibbonSeriesOptions): void {
    this._renderer.update(data, options);
  }

  defaultOptions(): RibbonSeriesOptions {
    return defaultRibbonOptions;
  }
}

/**
 * Ribbon Series Renderer - ICustomSeries
 * Only used when primitive is NOT attached
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
    // Using shared rendering functions with visibleRange for optimal performance
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
// Factory Function
// ============================================================================

/**
 * Factory function to create Ribbon series with optional primitive
 *
 * Two rendering modes:
 * 1. **Direct ICustomSeries rendering (default, usePrimitive: false)**
 *    - Series renders lines and fill directly
 *    - Normal z-order with other series
 *    - Best for most use cases
 *
 * 2. **Primitive rendering mode (usePrimitive: true)**
 *    - Series provides autoscaling only (no rendering)
 *    - Primitive handles rendering with custom z-order
 *    - Can render in background (zIndex: -100) or foreground
 *    - Best for background indicators like Bollinger Bands
 *
 * @param chart - Chart instance
 * @param options - Ribbon series options
 * @param options.upperLineColor - Upper line color (default: '#4CAF50')
 * @param options.lowerLineColor - Lower line color (default: '#F44336')
 * @param options.fillColor - Fill color (default: 'rgba(76, 175, 80, 0.1)')
 * @param options.usePrimitive - Enable primitive rendering mode
 * @param options.zIndex - Z-order for primitive mode (default: -100)
 * @param options.data - Initial data
 * @returns ICustomSeries instance
 *
 * @example Standard usage
 * ```typescript
 * const series = createRibbonSeries(chart, {
 *   upperLineColor: '#4CAF50',
 *   lowerLineColor: '#F44336',
 *   fillColor: 'rgba(76, 175, 80, 0.1)',
 * });
 * series.setData(data);
 * ```
 *
 * @example Background rendering with primitive
 * ```typescript
 * const series = createRibbonSeries(chart, {
 *   usePrimitive: true,
 *   zIndex: -100,
 *   data: ribbonData,
 * });
 * ```
 */
export function createRibbonSeries(
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
    fillColor?: string;
    fillVisible?: boolean;
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
    data?: RibbonData[];
  } = {}
): any {
  // Create ICustomSeries (always created for autoscaling)
  const series = chart.addCustomSeries(new RibbonSeries(), {
    _seriesType: 'Ribbon', // Internal property for series type identification
    upperLineColor: options.upperLineColor ?? '#4CAF50',
    upperLineWidth: options.upperLineWidth ?? 2,
    upperLineStyle: options.upperLineStyle ?? LineStyle.Solid,
    upperLineVisible: options.upperLineVisible !== false,
    lowerLineColor: options.lowerLineColor ?? '#F44336',
    lowerLineWidth: options.lowerLineWidth ?? 2,
    lowerLineStyle: options.lowerLineStyle ?? LineStyle.Solid,
    lowerLineVisible: options.lowerLineVisible !== false,
    fillColor: options.fillColor ?? 'rgba(76, 175, 80, 0.1)',
    fillVisible: options.fillVisible !== false,
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
    void import('../../primitives/RibbonPrimitive').then(({ RibbonPrimitive }) => {
      const primitive = new RibbonPrimitive(chart, {
        upperLineColor: options.upperLineColor ?? '#4CAF50',
        upperLineWidth: options.upperLineWidth ?? 2,
        upperLineStyle: Math.min(options.upperLineStyle ?? LineStyle.Solid, 2) as 0 | 1 | 2,
        upperLineVisible: options.upperLineVisible !== false,
        lowerLineColor: options.lowerLineColor ?? '#F44336',
        lowerLineWidth: options.lowerLineWidth ?? 2,
        lowerLineStyle: Math.min(options.lowerLineStyle ?? LineStyle.Solid, 2) as 0 | 1 | 2,
        lowerLineVisible: options.lowerLineVisible !== false,
        fillColor: options.fillColor ?? 'rgba(76, 175, 80, 0.1)',
        fillVisible: options.fillVisible !== false,
        visible: true,
        priceScaleId: options.priceScaleId ?? 'right',
        zIndex: options.zIndex ?? 0,
      });

      series.attachPrimitive(primitive);
    });
  }

  return series;
}
