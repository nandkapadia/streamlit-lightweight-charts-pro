/**
 * Signal Series - ICustomSeries Implementation
 *
 * A custom series that renders vertical background bands based on signal values.
 *
 * Features:
 * - Vertical background bands with customizable colors
 * - Three-color support: neutral, signal, and alert colors
 * - Boolean and numeric value support
 * - Full autoscaling support (uses price range of chart)
 *
 * Use cases:
 * - Buy/sell signal indicators
 * - Market regime indicators (trending/ranging)
 * - Alert zones
 * - Any boolean or tri-state signal visualization
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
  PriceToCoordinateConverter,
} from 'lightweight-charts';
import { BitmapCoordinatesRenderingScope, CanvasRenderingTarget2D } from 'fancy-canvas';
import { isWhitespaceDataMultiField } from '../shared/rendering';
import { isTransparent } from '../../utils/colors';
import { SignalColorCalculator, SignalColorOptions } from '../../utils/signalColors';

// ============================================================================
// Data Interface
// ============================================================================

/**
 * Data point for Signal series
 *
 * @property time - Timestamp for the data point
 * @property value - Signal value (0 = neutral, positive = signal, negative = alert)
 */
export interface SignalData extends CustomData<Time> {
  time: Time;
  value: number;
}

// ============================================================================
// Options Interface
// ============================================================================

/**
 * Configuration options for Signal series
 */
export interface SignalSeriesOptions extends CustomSeriesOptions, SignalColorOptions {
  // Color styling
  neutralColor: string;
  signalColor: string;
  alertColor: string;

  // Series options
  lastValueVisible: boolean;
  title: string;
  visible: boolean;
  priceLineVisible: boolean;
}

/**
 * Default options for Signal series
 */
export const defaultSignalOptions: SignalSeriesOptions = {
  ...customSeriesDefaultOptions,
  neutralColor: 'transparent',
  signalColor: 'rgba(76, 175, 80, 0.3)',
  alertColor: 'rgba(244, 67, 54, 0.3)',
};

// ============================================================================
// Renderer Implementation
// ============================================================================

/**
 * Signal Series Renderer - ICustomSeries
 */
class SignalSeriesRenderer<TData extends SignalData = SignalData>
  implements ICustomSeriesPaneRenderer
{
  private _data: PaneRendererCustomData<Time, TData> | null = null;
  private _options: SignalSeriesOptions | null = null;
  private _hasNonBooleanValues: boolean = false;

  update(data: PaneRendererCustomData<Time, TData>, options: SignalSeriesOptions): void {
    this._data = data;
    this._options = options;

    // Check if data contains non-boolean values
    if (data.bars.length > 0) {
      const values = data.bars.map(bar => Number(bar.originalData.value));
      this._hasNonBooleanValues = SignalColorCalculator.checkForNonBooleanValues(values);
    }
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
    _priceToCoordinate: PriceToCoordinateConverter
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
    const ctx = renderingScope.context;

    ctx.save();

    // Get chart height for full vertical bands
    const chartHeight = renderingScope.bitmapSize.height;
    const barWidth = this._calculateBarWidth(renderingScope);

    // Draw vertical bands for each bar
    for (let i = visibleRange.from; i < visibleRange.to; i++) {
      const bar = this._data.bars[i];
      if (!bar) continue;

      const value = Number(bar.originalData.value);
      const color = SignalColorCalculator.getColorForValue(
        value,
        options,
        this._hasNonBooleanValues
      );

      // Skip transparent colors
      if (isTransparent(color)) continue;

      const x = bar.x * renderingScope.horizontalPixelRatio;

      // Draw full-height vertical band
      ctx.fillStyle = color;
      ctx.fillRect(x - barWidth / 2, 0, barWidth, chartHeight);
    }

    ctx.restore();
  }

  private _calculateBarWidth(renderingScope: BitmapCoordinatesRenderingScope): number {
    if (!this._data || this._data.bars.length < 2) {
      return 10 * renderingScope.horizontalPixelRatio;
    }

    // Calculate average bar spacing
    let totalSpacing = 0;
    let count = 0;

    for (let i = 1; i < Math.min(this._data.bars.length, 10); i++) {
      const spacing = Math.abs(this._data.bars[i].x - this._data.bars[i - 1].x);
      if (spacing > 0) {
        totalSpacing += spacing;
        count++;
      }
    }

    const avgSpacing = count > 0 ? totalSpacing / count : 10;
    return avgSpacing * renderingScope.horizontalPixelRatio * 0.95;
  }
}

// ============================================================================
// ICustomSeries Implementation
// ============================================================================

/**
 * Signal Series - ICustomSeries implementation
 * Provides autoscaling and direct rendering
 */
export class SignalSeries<TData extends SignalData = SignalData>
  implements ICustomSeriesPaneView<Time, TData, SignalSeriesOptions>
{
  private _renderer: SignalSeriesRenderer<TData>;

  constructor() {
    this._renderer = new SignalSeriesRenderer();
  }

  priceValueBuilder(_plotRow: TData): CustomSeriesPricePlotValues {
    // Signal series doesn't affect price scale - return empty
    return [];
  }

  isWhitespace(
    data: TData | CustomSeriesWhitespaceData<Time>
  ): data is CustomSeriesWhitespaceData<Time> {
    return isWhitespaceDataMultiField(data, ['value']);
  }

  renderer(): ICustomSeriesPaneRenderer {
    return this._renderer;
  }

  update(data: PaneRendererCustomData<Time, TData>, options: SignalSeriesOptions): void {
    this._renderer.update(data, options);
  }

  defaultOptions(): SignalSeriesOptions {
    return defaultSignalOptions;
  }
}

/**
 * Factory function to create Signal series plugin
 */
export function SignalSeriesPlugin(): ICustomSeriesPaneView<
  Time,
  SignalData,
  SignalSeriesOptions
> {
  return new SignalSeries();
}
