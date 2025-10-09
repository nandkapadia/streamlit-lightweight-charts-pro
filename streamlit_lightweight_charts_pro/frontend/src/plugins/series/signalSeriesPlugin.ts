/**
 * Signal Series - ICustomSeries Implementation
 *
 * A custom series for TradingView Lightweight Charts that renders vertical
 * background bands based on signal values, spanning the entire chart height.
 *
 * Common use cases:
 * - Trading signal indicators
 * - Market regime indicators
 * - Alert/warning zones
 * - Session highlighting
 *
 * Architecture:
 * - Follows official Lightweight Charts ICustomSeries pattern
 * - Signal values are stored as price data for compatibility
 * - Background bands rendered using full-height vertical fills
 * - Supports per-signal color overrides
 *
 * @see https://tradingview.github.io/lightweight-charts/docs/api/interfaces/ICustomSeriesPaneView
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
  IChartApi,
} from 'lightweight-charts';
import { BitmapCoordinatesRenderingScope } from 'fancy-canvas';
import { isTransparent } from '../../utils/colorUtils';

// ============================================================================
// Data Interface
// ============================================================================

/**
 * Data point for Signal series
 *
 * @property time - Timestamp for the data point
 * @property value - Signal value (0=neutral, >0=signal, <0=alert)
 * @property color - Optional color override for this signal
 */
export interface SignalData extends CustomData<Time> {
  time: Time;
  value: number;
  color?: string;
}

// ============================================================================
// Options Interface
// ============================================================================

/**
 * Configuration options for Signal series
 *
 * Colors:
 * @property neutralColor - Color for value 0 signals
 * @property signalColor - Color for positive value signals
 * @property alertColor - Color for negative value signals
 *
 * Series options:
 * @property lastValueVisible - Toggle last value visibility
 * @property title - Series title
 * @property priceLineVisible - Toggle price line visibility
 */
export interface SignalSeriesOptions extends CustomSeriesOptions {
  neutralColor?: string;
  signalColor?: string;
  alertColor?: string;

  // Series options
  lastValueVisible: boolean;
  title: string;
  visible: boolean;
  priceLineVisible: boolean;

  // Internal flag (set automatically by factory)
  _usePrimitive?: boolean;
}

/**
 * Default options for Signal series
 * Note: lastValueVisible and priceLineVisible are false by default
 * since signals are background indicators
 */
const defaultSignalOptions: SignalSeriesOptions = {
  ...customSeriesDefaultOptions,
  neutralColor: 'rgba(128, 128, 128, 0.1)',
  signalColor: 'rgba(76, 175, 80, 0.2)',
  alertColor: 'rgba(244, 67, 54, 0.2)',
  lastValueVisible: false,
  title: 'Signal',
  visible: true,
  priceLineVisible: false,
};

// ============================================================================
// Renderer Implementation
// ============================================================================

/**
 * Renderer for Signal series
 *
 * Renders vertical background bands for each signal that span the full chart height.
 * Uses bar spacing to properly align bands with candlesticks/bars.
 *
 * @template TData - The data type extending SignalData
 * @internal
 */
class SignalSeriesRenderer<TData extends SignalData> implements ICustomSeriesPaneRenderer {
  private _data: PaneRendererCustomData<Time, TData> | null = null;
  private _options: SignalSeriesOptions | null = null;

  update(data: PaneRendererCustomData<Time, TData>, options: SignalSeriesOptions): void {
    this._data = data;
    this._options = options;
  }

  draw(target: any): void {
    target.useBitmapCoordinateSpace((scope: BitmapCoordinatesRenderingScope) => {
      this._drawImpl(scope);
    });
  }

  private _drawImpl(renderingScope: BitmapCoordinatesRenderingScope): void {
    if (!this._data || !this._options || !this._options.visible) {
      return;
    }

    // Early exit if primitive handles rendering
    if (this._options._usePrimitive) {
      return;
    }

    if (this._data.bars.length === 0) {
      return;
    }

    const ctx = renderingScope.context;
    const barSpacing = this._data.barSpacing;
    const halfBarSpacing = barSpacing / 2;
    const chartHeight = renderingScope.bitmapSize.height;

    ctx.save();

    // Draw each signal as a vertical band
    for (const bar of this._data.bars) {
      const signalData = bar.originalData as TData;

      // Determine color for this signal
      let color = signalData.color;
      if (!color) {
        color = this.getColorForValue(signalData.value, this._options);
      }

      // Skip transparent colors
      if (isTransparent(color)) {
        continue;
      }

      // Calculate band boundaries in bitmap coordinates
      // Center on bar X coordinate and extend by half bar spacing on each side
      const x = bar.x * renderingScope.horizontalPixelRatio;
      const startX = Math.floor(x - halfBarSpacing * renderingScope.horizontalPixelRatio);
      const endX = Math.floor(x + halfBarSpacing * renderingScope.horizontalPixelRatio);

      // Draw vertical band spanning full chart height
      ctx.fillStyle = color;
      ctx.fillRect(startX, 0, endX - startX, chartHeight);
    }

    ctx.restore();
  }

  private getColorForValue(value: number, options: SignalSeriesOptions): string {
    if (value === 0) {
      return options.neutralColor || 'transparent';
    } else if (value > 0) {
      return options.signalColor || 'transparent';
    } else {
      return options.alertColor || options.signalColor || 'transparent';
    }
  }
}

// ============================================================================
// ICustomSeries Implementation
// ============================================================================

/**
 * Signal Series - ICustomSeries implementation
 * Renders vertical background bands based on signal values
 */
export class SignalSeries<TData extends SignalData = SignalData>
  implements ICustomSeriesPaneView<Time, TData, SignalSeriesOptions>
{
  private _renderer: SignalSeriesRenderer<TData>;

  constructor() {
    this._renderer = new SignalSeriesRenderer();
  }

  /**
   * Build price values for autoscaling
   *
   * Signals don't have meaningful price values.
   * When using primitive mode, we return empty array to not affect autoscaling.
   * When not using primitive, we return the signal value to prevent errors.
   *
   * @param _plotRow - Data point (unused)
   * @returns Price value (empty when primitive is used)
   */
  priceValueBuilder(_plotRow: TData): CustomSeriesPricePlotValues {
    // Don't contribute to autoscaling when primitive handles rendering
    return [];
  }

  /**
   * Check if data point is whitespace
   *
   * @param data - Data point to check
   * @returns True if value is null/undefined
   */
  isWhitespace(
    data: TData | CustomSeriesWhitespaceData<Time>
  ): data is CustomSeriesWhitespaceData<Time> {
    return (data as TData).value === undefined || (data as TData).value === null;
  }

  /**
   * Update renderer with new data
   *
   * @param data - Renderer data from chart
   * @param options - Series options
   */
  update(data: PaneRendererCustomData<Time, TData>, options: SignalSeriesOptions): void {
    this._renderer.update(data, options);
  }

  /**
   * Get default options
   *
   * @returns Default options object
   */
  defaultOptions(): SignalSeriesOptions {
    return defaultSignalOptions;
  }

  /**
   * Get renderer
   *
   * @returns Renderer instance
   */
  renderer(): ICustomSeriesPaneRenderer {
    return this._renderer;
  }
}

// ============================================================================
// Plugin Factory
// ============================================================================

/**
 * Create Signal series plugin
 *
 * @returns Signal series instance
 */
export function SignalSeriesPlugin(): ICustomSeriesPaneView<Time, SignalData, SignalSeriesOptions> {
  return new SignalSeries();
}

/**
 * Create Signal series with optional primitive for background rendering
 *
 * Hybrid pattern:
 * - ICustomSeries: Always created for autoscaling
 * - Primitive: Optionally created for background rendering (usePrimitive: true)
 *
 * @param chart - Chart instance
 * @param options - Configuration options
 * @returns Object with series and optional primitive
 */
export function createSignalSeries(
  chart: IChartApi,
  options: {
    // Visual options
    neutralColor?: string;
    signalColor?: string;
    alertColor?: string;
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
    data?: SignalData[];
  } = {}
): any {
  const usePrimitive = options.usePrimitive ?? false;

  // Create ICustomSeries (always created for autoscaling)
  const series = (chart as any).addCustomSeries(SignalSeriesPlugin(), {
    _seriesType: 'Signal', // Internal property for series type identification
    neutralColor: options.neutralColor ?? 'rgba(128, 128, 128, 0.1)',
    signalColor: options.signalColor ?? 'rgba(76, 175, 80, 0.2)',
    alertColor: options.alertColor ?? 'rgba(244, 67, 54, 0.2)',
    priceScaleId: options.priceScaleId ?? 'right',
    lastValueVisible: options.lastValueVisible ?? false,
    title: options.title ?? 'Signal',
    visible: options.visible !== false,
    priceLineVisible: options.priceLineVisible ?? false,
    _usePrimitive: usePrimitive, // Internal flag to disable rendering
  });

  // Set data on series
  if (options.data && options.data.length > 0) {
    series.setData(options.data);
  }

  // Conditionally create primitive for background rendering
  if (usePrimitive) {
    void import('../../primitives/SignalPrimitive').then(({ SignalPrimitive }) => {
      const primitive = new SignalPrimitive(chart, {
        neutralColor: options.neutralColor ?? 'rgba(128, 128, 128, 0.1)',
        signalColor: options.signalColor ?? 'rgba(76, 175, 80, 0.2)',
        alertColor: options.alertColor ?? 'rgba(244, 67, 54, 0.2)',
        visible: options.visible !== false,
        zIndex: options.zIndex ?? -100,
      });
      series.attachPrimitive(primitive);
    });
  }

  return series;
}

/**
 * Legacy factory function for backward compatibility
 * @deprecated Use createSignalSeries instead
 */
export function createSignalSeriesPlugin(): ICustomSeriesPaneView<
  Time,
  SignalData,
  SignalSeriesOptions
> {
  return SignalSeriesPlugin();
}

// Export default options for Python compatibility
export { defaultSignalOptions };
