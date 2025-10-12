/**
 * @fileoverview Ribbon Primitive Implementation
 *
 * ISeriesPrimitive for rendering filled areas between upper and lower lines.
 * Provides z-order control for background rendering of channel indicators.
 *
 * Architecture:
 * - Extends BaseSeriesPrimitive for common lifecycle management
 * - Implements ISeriesPrimitive interface for TradingView integration
 * - Uses common rendering utilities for consistent behavior
 *
 * Features:
 * - Two configurable lines (upper and lower)
 * - Fill area between lines
 * - Z-order control (default: -100 for background)
 * - Price axis labels for both lines
 * - Time-based visible range detection
 *
 * Use cases:
 * - Background indicators (Bollinger Bands, channels, etc.)
 * - When using with createRibbonSeries() factory with usePrimitive: true
 * - Technical analysis overlays that should render behind price series
 *
 * @example
 * ```typescript
 * import { RibbonPrimitive } from './RibbonPrimitive';
 *
 * const ribbonPrimitive = new RibbonPrimitive(chart, {
 *   upperLineColor: '#ff0000',
 *   lowerLineColor: '#0000ff',
 *   fillColor: 'rgba(128,128,128,0.1)'
 * });
 * ```
 *
 * @see createRibbonSeries for the factory function
 * @see RibbonSeries for the ICustomSeries implementation
 */

import {
  IChartApi,
  IPrimitivePaneRenderer,
  Time,
  PrimitivePaneViewZOrder,
} from 'lightweight-charts';
import { BitmapCoordinatesRenderingScope } from 'fancy-canvas';
import { getSolidColorFromFill } from '../utils/colorUtils';
import {
  convertToCoordinates,
  drawMultiLine,
  drawFillArea,
  MultiCoordinatePoint,
} from '../plugins/series/base/commonRendering';
import {
  BaseSeriesPrimitive,
  BaseSeriesPrimitiveOptions,
  BaseProcessedData,
  BaseSeriesPrimitivePaneView,
  BaseSeriesPrimitiveAxisView,
} from './BaseSeriesPrimitive';

// ============================================================================
// Data Interfaces
// ============================================================================

/**
 * Data structure for ribbon primitive
 */
export interface RibbonPrimitiveData {
  time: number | string;
  upper?: number | null;
  lower?: number | null;
}

/**
 * Options for ribbon primitive
 */
export interface RibbonPrimitiveOptions extends BaseSeriesPrimitiveOptions {
  upperLineColor: string;
  upperLineWidth: 1 | 2 | 3 | 4;
  upperLineStyle: 0 | 1 | 2;
  upperLineVisible: boolean;
  lowerLineColor: string;
  lowerLineWidth: 1 | 2 | 3 | 4;
  lowerLineStyle: 0 | 1 | 2;
  lowerLineVisible: boolean;
  fillColor: string;
  fillVisible: boolean;
}

/**
 * Internal processed data structure
 */
interface RibbonProcessedData extends BaseProcessedData {
  time: Time;
  upper: number;
  lower: number;
}

// ============================================================================
// Primitive Pane View
// ============================================================================

class RibbonPrimitivePaneView extends BaseSeriesPrimitivePaneView<
  RibbonProcessedData,
  RibbonPrimitiveOptions
> {
  renderer(): IPrimitivePaneRenderer {
    return new RibbonPrimitiveRenderer(this._source as RibbonPrimitive);
  }
}

// ============================================================================
// Primitive Renderer
// ============================================================================

/**
 * Ribbon Primitive Renderer
 * Handles actual drawing on canvas with proper method separation:
 * - draw(): Renders upper and lower lines (foreground elements)
 * - drawBackground(): Renders filled area between lines (background elements)
 */
class RibbonPrimitiveRenderer implements IPrimitivePaneRenderer {
  private _source: RibbonPrimitive;

  constructor(source: RibbonPrimitive) {
    this._source = source;
  }

  /**
   * Draw method - handles LINE drawing (foreground elements)
   * This method renders upper and lower boundary lines
   * that should appear on top of fills and other series
   */
  draw(target: any): void {
    target.useBitmapCoordinateSpace((scope: BitmapCoordinatesRenderingScope) => {
      const ctx = scope.context;
      const hRatio = scope.horizontalPixelRatio;
      const vRatio = scope.verticalPixelRatio;

      const data = this._source.getProcessedData();
      const series = this._source.getAttachedSeries();

      if (!series || data.length === 0) return;

      // Read options from attached series (single source of truth)
      const options = (series as any).options();
      if (!options || options.visible === false) return;

      ctx.save();

      // Convert to screen coordinates
      const chart = this._source.getChart();
      const coordinates = convertToCoordinates(data, chart, series, ['upper', 'lower']);

      // Scale coordinates
      const scaledCoords: MultiCoordinatePoint[] = coordinates.map(coord => ({
        x: coord.x !== null ? coord.x * hRatio : null,
        upper: coord.upper !== null ? coord.upper * vRatio : null,
        lower: coord.lower !== null ? coord.lower * vRatio : null,
      }));

      // Draw lines (foreground)
      if (options.upperLineVisible) {
        drawMultiLine(
          ctx,
          scaledCoords,
          'upper',
          options.upperLineColor,
          options.upperLineWidth * hRatio,
          options.upperLineStyle
        );
      }

      if (options.lowerLineVisible) {
        drawMultiLine(
          ctx,
          scaledCoords,
          'lower',
          options.lowerLineColor,
          options.lowerLineWidth * hRatio,
          options.lowerLineStyle
        );
      }

      ctx.restore();
    });
  }

  /**
   * Draw background method - handles FILL rendering (background elements)
   * This method renders the filled area between upper and lower lines
   * that should appear behind lines and other series
   */
  drawBackground(target: any): void {
    target.useBitmapCoordinateSpace((scope: BitmapCoordinatesRenderingScope) => {
      const ctx = scope.context;
      const hRatio = scope.horizontalPixelRatio;
      const vRatio = scope.verticalPixelRatio;

      const data = this._source.getProcessedData();
      const series = this._source.getAttachedSeries();

      if (!series || data.length === 0) return;

      // Read options from attached series (single source of truth)
      const options = (series as any).options();
      if (!options || options.visible === false) return;

      ctx.save();

      // Convert to screen coordinates
      const chart = this._source.getChart();
      const coordinates = convertToCoordinates(data, chart, series, ['upper', 'lower']);

      // Scale coordinates
      const scaledCoords: MultiCoordinatePoint[] = coordinates.map(coord => ({
        x: coord.x !== null ? coord.x * hRatio : null,
        upper: coord.upper !== null ? coord.upper * vRatio : null,
        lower: coord.lower !== null ? coord.lower * vRatio : null,
      }));

      // Draw fill area (background)
      if (options.fillVisible && scaledCoords.length > 1) {
        drawFillArea(ctx, scaledCoords, 'upper', 'lower', options.fillColor);
      }

      ctx.restore();
    });
  }
}

// ============================================================================
// Axis Views
// ============================================================================

/**
 * Price axis view for upper line
 */
class RibbonUpperAxisView extends BaseSeriesPrimitiveAxisView<
  RibbonProcessedData,
  RibbonPrimitiveOptions
> {
  coordinate(): number {
    const lastItem = this._getLastVisibleItem();
    if (!lastItem) return 0;

    const series = this._source.getAttachedSeries();
    if (!series) return 0;

    const coordinate = series.priceToCoordinate(lastItem.upper);
    return coordinate ?? 0;
  }

  text(): string {
    const lastItem = this._getLastVisibleItem();
    if (!lastItem) return '';
    return lastItem.upper.toFixed(2);
  }

  backColor(): string {
    const options = this._source.getOptions();
    return getSolidColorFromFill(options.upperLineColor);
  }
}

/**
 * Price axis view for lower line
 */
class RibbonLowerAxisView extends BaseSeriesPrimitiveAxisView<
  RibbonProcessedData,
  RibbonPrimitiveOptions
> {
  coordinate(): number {
    const lastItem = this._getLastVisibleItem();
    if (!lastItem) return 0;

    const series = this._source.getAttachedSeries();
    if (!series) return 0;

    const coordinate = series.priceToCoordinate(lastItem.lower);
    return coordinate ?? 0;
  }

  text(): string {
    const lastItem = this._getLastVisibleItem();
    if (!lastItem) return '';
    return lastItem.lower.toFixed(2);
  }

  backColor(): string {
    const options = this._source.getOptions();
    return getSolidColorFromFill(options.lowerLineColor);
  }
}

// ============================================================================
// Primitive Implementation
// ============================================================================

/**
 * Ribbon Primitive
 *
 * Implements ISeriesPrimitive for z-order control and independent rendering.
 * Syncs data from attached ICustomSeries for autoscaling.
 *
 * Refactored to extend BaseSeriesPrimitive following DRY principles.
 */
export class RibbonPrimitive extends BaseSeriesPrimitive<
  RibbonProcessedData,
  RibbonPrimitiveOptions
> {
  constructor(chart: IChartApi, options: RibbonPrimitiveOptions) {
    super(chart, options);
  }

  /**
   * Returns settings schema for series dialog
   * Maps property names to their types for automatic UI generation
   */
  static getSettings() {
    return {
      upperLine: 'line' as const,
      lowerLine: 'line' as const,
      fillVisible: 'boolean' as const,
      fillColor: 'color' as const,
    };
  }

  // Required: Initialize views
  protected _initializeViews(): void {
    this._addPaneView(new RibbonPrimitivePaneView(this));
    this._addPriceAxisView(new RibbonUpperAxisView(this));
    this._addPriceAxisView(new RibbonLowerAxisView(this));
  }

  // Required: Process raw data
  protected _processData(rawData: any[]): RibbonProcessedData[] {
    return rawData
      .map(item => {
        const upper = item.upper;
        const lower = item.lower;

        // Validate data
        if (
          upper === null ||
          upper === undefined ||
          isNaN(upper) ||
          lower === null ||
          lower === undefined ||
          isNaN(lower)
        ) {
          return null;
        }

        return {
          time: item.time,
          upper,
          lower,
        };
      })
      .filter((item): item is RibbonProcessedData => item !== null);
  }

  // Optional: Custom z-order default
  protected _getDefaultZOrder(): PrimitivePaneViewZOrder {
    return 'normal'; // Render in normal layer (in front of grid)
  }
}
