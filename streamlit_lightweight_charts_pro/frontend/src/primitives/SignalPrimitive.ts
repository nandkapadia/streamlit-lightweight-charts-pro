/**
 * @fileoverview Signal Primitive Implementation
 *
 * ISeriesPrimitive for rendering vertical background bands based on signal values.
 * Spans the entire chart height with z-order control for background rendering.
 *
 * Architecture:
 * - Extends BaseSeriesPrimitive for common lifecycle management
 * - Implements ISeriesPrimitive interface for TradingView integration
 * - Uses common rendering utilities for consistent behavior
 *
 * Features:
 * - Vertical bands spanning full chart height
 * - Color-coded by signal value (neutral/signal/alert)
 * - Z-order control (default: 'bottom' for background)
 * - Bar spacing alignment
 *
 * Use cases:
 * - Background market regime indicators
 * - Trading signal zones
 * - When using with createSignalSeries factory with usePrimitive: true
 * - Technical analysis overlays that should render behind price series
 *
 * @example
 * ```typescript
 * import { SignalPrimitive } from './SignalPrimitive';
 *
 * const signalPrimitive = new SignalPrimitive(chart, {
 *   neutralColor: '#808080',
 *   signalColor: '#00ff00',
 *   alertColor: '#ff0000'
 * });
 * ```
 *
 * @see createSignalSeries for the factory function
 * @see SignalSeries for the ICustomSeries implementation
 */

import { IChartApi, IPrimitivePaneRenderer, PrimitivePaneViewZOrder } from 'lightweight-charts';
import { BitmapCoordinatesRenderingScope, CanvasRenderingTarget2D } from 'fancy-canvas';
import { isTransparent } from '../utils/colorUtils';
import { SignalColorCalculator } from '../utils/signalColorUtils';
import { timeToCoordinate, getBarSpacing } from '../plugins/series/base/commonRendering';
import {
  BaseSeriesPrimitive,
  BaseSeriesPrimitiveOptions,
  BaseProcessedData,
  BaseSeriesPrimitivePaneView,
} from './BaseSeriesPrimitive';

// ============================================================================
// Data Interfaces
// ============================================================================

/**
 * Data structure for signal primitive (raw input)
 */
export interface SignalPrimitiveData {
  time: number | string;
  value?: number | null;
  color?: string | null;
}

/**
 * Options for signal primitive
 */
export interface SignalPrimitiveOptions extends BaseSeriesPrimitiveOptions {
  neutralColor: string;
  signalColor: string;
  alertColor?: string;
}

/**
 * Internal processed data structure
 */
interface SignalProcessedData extends BaseProcessedData {
  value: number;
  color?: string;
}

// ============================================================================
// Primitive Pane View
// ============================================================================

class SignalPrimitivePaneView extends BaseSeriesPrimitivePaneView<
  SignalProcessedData,
  SignalPrimitiveOptions
> {
  renderer(): IPrimitivePaneRenderer {
    return new SignalPrimitiveRenderer(this._source as SignalPrimitive);
  }

  zOrder(): PrimitivePaneViewZOrder {
    return 'bottom'; // Render at bottom (behind everything)
  }
}

// ============================================================================
// Primitive Renderer
// ============================================================================

/**
 * Signal Primitive Renderer
 * Handles actual drawing on canvas:
 * - drawBackground(): Renders vertical bands (background elements)
 */
class SignalPrimitiveRenderer implements IPrimitivePaneRenderer {
  private _source: SignalPrimitive;
  private _hasNonBooleanValues: boolean = false;

  constructor(source: SignalPrimitive) {
    this._source = source;
  }

  /**
   * Check if data contains any values that are not 0 or 1
   * This determines whether alertColor should be used
   * Handles both boolean (true/false) and numeric (0/1) values
   */
  private _checkForNonBooleanValues(data: SignalProcessedData[]): boolean {
    const values = data.map(item => item.value);
    return SignalColorCalculator.checkForNonBooleanValues(values);
  }

  /**
   * Draw method - not used for signal series
   * Signals render entirely in background
   */
  draw(): void {
    // Signal series uses drawBackground only
  }

  /**
   * Draw background method - handles vertical band rendering
   * This method renders vertical bands spanning full chart height
   * that should appear behind all other series
   */
  drawBackground(target: CanvasRenderingTarget2D): void {
    target.useBitmapCoordinateSpace((scope: BitmapCoordinatesRenderingScope) => {
      const data = this._source.getProcessedData();
      const series = this._source.getAttachedSeries();

      if (!series || data.length === 0) return;

      // Read options from attached series (single source of truth)
      const options = (series as any).options();
      if (!options || options.visible === false) return;

      // Check if data contains non-boolean values (values other than 0 or 1)
      this._hasNonBooleanValues = this._checkForNonBooleanValues(data);

      const chart = this._source.getChart();
      const barSpacing = getBarSpacing(chart);
      const halfBarSpacing = barSpacing / 2;
      const chartHeight = scope.bitmapSize.height;
      const ctx = scope.context;

      ctx.save();

      // Draw each signal as a vertical band
      for (const item of data) {
        // Get X coordinate
        const x = timeToCoordinate(item.time, chart);
        if (x === null) continue;

        // Convert boolean to number if needed (handled in _processData, but double-check)
        let value = item.value;
        if (typeof value === 'boolean') {
          value = value ? 1 : 0;
        }

        // Determine color
        let color = item.color;
        if (!color) {
          color = this.getColorForValue(value, options);
        }

        // Skip transparent colors
        if (isTransparent(color)) {
          continue;
        }

        // Calculate band boundaries in bitmap coordinates
        const xScaled = x * scope.horizontalPixelRatio;
        const startX = Math.floor(xScaled - halfBarSpacing * scope.horizontalPixelRatio);
        const endX = Math.floor(xScaled + halfBarSpacing * scope.horizontalPixelRatio);

        // Draw vertical band spanning full chart height
        ctx.fillStyle = color;
        ctx.fillRect(startX, 0, endX - startX, chartHeight);
      }

      ctx.restore();
    });
  }

  private getColorForValue(value: number, options: SignalPrimitiveOptions): string {
    return SignalColorCalculator.getColorForValue(value, options, this._hasNonBooleanValues);
  }
}

// ============================================================================
// Primitive Implementation
// ============================================================================

/**
 * Signal Primitive
 *
 * Implements ISeriesPrimitive for z-order control and background rendering.
 * Syncs data from attached ICustomSeries for autoscaling.
 *
 * Extends BaseSeriesPrimitive following DRY principles.
 */
export class SignalPrimitive extends BaseSeriesPrimitive<
  SignalProcessedData,
  SignalPrimitiveOptions
> {
  constructor(chart: IChartApi, options: SignalPrimitiveOptions) {
    super(chart, options);
  }

  /**
   * Returns settings schema for series dialog
   * Maps property names to their types for automatic UI generation
   */
  static getSettings() {
    return {
      neutralColor: 'color' as const,
      signalColor: 'color' as const,
      alertColor: 'color' as const,
    };
  }

  // Required: Initialize views
  protected _initializeViews(): void {
    this._addPaneView(new SignalPrimitivePaneView(this));
    // No price axis views for signals - they don't show labels
  }

  // Required: Process raw data
  protected _processData(rawData: any[]): SignalProcessedData[] {
    return rawData.flatMap(item => {
      let value = item.value ?? 0;

      // Convert boolean to number (true -> 1, false -> 0)
      // This allows Python users to use bool values naturally
      if (typeof value === 'boolean') {
        value = value ? 1 : 0;
      }

      // Validate data
      if (isNaN(value)) {
        console.warn(`[SignalPrimitive] Invalid signal value at time ${item.time}:`, item.value);
        return [];
      }

      return [
        {
          time: item.time,
          value,
          color: item.color,
        },
      ];
    });
  }

  // Optional: Custom z-order default
  protected _getDefaultZOrder(): PrimitivePaneViewZOrder {
    return 'bottom'; // Render at bottom (behind everything)
  }
}
