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
import { BitmapCoordinatesRenderingScope } from 'fancy-canvas';
import { isTransparent } from '../utils/colorUtils';
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
  alertColor: string;
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

  constructor(source: SignalPrimitive) {
    this._source = source;
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
  drawBackground(target: any): void {
    target.useBitmapCoordinateSpace((scope: BitmapCoordinatesRenderingScope) => {
      const data = this._source.getProcessedData();
      const series = this._source.getAttachedSeries();

      if (!series || data.length === 0) return;

      // Read options from attached series (single source of truth)
      const options = (series as any).options();
      if (!options || options.visible === false) return;

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

        // Determine color
        let color = item.color;
        if (!color) {
          color = this.getColorForValue(item.value, options);
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
      const value = item.value ?? 0;

      // Validate data
      if (isNaN(value)) {
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
