/**
 * @fileoverview Band Primitive Implementation
 *
 * ISeriesPrimitive for rendering filled areas between three lines (upper, middle, lower).
 * Provides z-order control for background rendering of technical indicators.
 *
 * Architecture:
 * - Extends BaseSeriesPrimitive for common lifecycle management
 * - Implements ISeriesPrimitive interface for TradingView integration
 * - Uses common rendering utilities for consistent behavior
 *
 * Features:
 * - Three configurable lines (upper, middle, lower)
 * - Two fill areas (upper fill between upper/middle, lower fill between middle/lower)
 * - Z-order control (default: -100 for background)
 * - Price axis labels for all three lines
 * - Time-based visible range detection
 *
 * Use cases:
 * - Background indicators (Bollinger Bands, Keltner Channels, etc.)
 * - When using with createBandSeries() factory with usePrimitive: true
 * - Technical analysis overlays that should render behind price series
 *
 * @example
 * ```typescript
 * import { BandPrimitive } from './BandPrimitive';
 *
 * const bandPrimitive = new BandPrimitive(chart, {
 *   upperLineColor: '#ff0000',
 *   middleLineColor: '#00ff00',
 *   lowerLineColor: '#0000ff',
 *   upperFillColor: 'rgba(255,0,0,0.1)',
 *   lowerFillColor: 'rgba(0,0,255,0.1)'
 * });
 * ```
 *
 * @see createBandSeries for the factory function
 * @see BandSeries for the ICustomSeries implementation
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
 * Data structure for band primitive
 */
export interface BandPrimitiveData {
  time: number | string;
  upper?: number | null;
  middle?: number | null;
  lower?: number | null;
}

/**
 * Options for band primitive
 */
export interface BandPrimitiveOptions extends BaseSeriesPrimitiveOptions {
  upperLineColor: string;
  upperLineWidth: 1 | 2 | 3 | 4;
  upperLineStyle: 0 | 1 | 2;
  upperLineVisible: boolean;
  middleLineColor: string;
  middleLineWidth: 1 | 2 | 3 | 4;
  middleLineStyle: 0 | 1 | 2;
  middleLineVisible: boolean;
  lowerLineColor: string;
  lowerLineWidth: 1 | 2 | 3 | 4;
  lowerLineStyle: 0 | 1 | 2;
  lowerLineVisible: boolean;
  upperFillColor: string;
  upperFillVisible: boolean;
  lowerFillColor: string;
  lowerFillVisible: boolean;
}

/**
 * Internal processed data structure
 */
interface BandProcessedData extends BaseProcessedData {
  time: Time;
  upper: number;
  middle: number;
  lower: number;
}

// ============================================================================
// Primitive Pane View
// ============================================================================

class BandPrimitivePaneView extends BaseSeriesPrimitivePaneView<
  BandProcessedData,
  BandPrimitiveOptions
> {
  renderer(): IPrimitivePaneRenderer {
    return new BandPrimitiveRenderer(this._source as BandPrimitive);
  }
}

// ============================================================================
// Primitive Renderer
// ============================================================================

/**
 * Band Primitive Renderer
 * Handles actual drawing on canvas with proper method separation:
 * - draw(): Renders upper, middle, and lower lines (foreground elements)
 * - drawBackground(): Renders filled areas between lines (background elements)
 */
class BandPrimitiveRenderer implements IPrimitivePaneRenderer {
  private _source: BandPrimitive;

  constructor(source: BandPrimitive) {
    this._source = source;
  }

  /**
   * Draw method - handles LINE drawing (foreground elements)
   * This method renders upper, middle, and lower boundary lines
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
      const coordinates = convertToCoordinates(data, chart, series, ['upper', 'middle', 'lower']);

      // Scale coordinates
      const scaledCoords: MultiCoordinatePoint[] = coordinates.map(coord => ({
        x: coord.x !== null ? coord.x * hRatio : null,
        upper: coord.upper !== null ? coord.upper * vRatio : null,
        middle: coord.middle !== null ? coord.middle * vRatio : null,
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

      if (options.middleLineVisible) {
        drawMultiLine(
          ctx,
          scaledCoords,
          'middle',
          options.middleLineColor,
          options.middleLineWidth * hRatio,
          options.middleLineStyle
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
   * This method renders the filled areas between upper-middle and middle-lower lines
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
      const coordinates = convertToCoordinates(data, chart, series, ['upper', 'middle', 'lower']);

      // Scale coordinates
      const scaledCoords: MultiCoordinatePoint[] = coordinates.map(coord => ({
        x: coord.x !== null ? coord.x * hRatio : null,
        upper: coord.upper !== null ? coord.upper * vRatio : null,
        middle: coord.middle !== null ? coord.middle * vRatio : null,
        lower: coord.lower !== null ? coord.lower * vRatio : null,
      }));

      // Draw fill areas (background)
      if (options.upperFillVisible && scaledCoords.length > 1) {
        drawFillArea(ctx, scaledCoords, 'upper', 'middle', options.upperFillColor);
      }

      if (options.lowerFillVisible && scaledCoords.length > 1) {
        drawFillArea(ctx, scaledCoords, 'middle', 'lower', options.lowerFillColor);
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
class BandUpperAxisView extends BaseSeriesPrimitiveAxisView<
  BandProcessedData,
  BandPrimitiveOptions
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
 * Price axis view for middle line
 */
class BandMiddleAxisView extends BaseSeriesPrimitiveAxisView<
  BandProcessedData,
  BandPrimitiveOptions
> {
  coordinate(): number {
    const lastItem = this._getLastVisibleItem();
    if (!lastItem) return 0;

    const series = this._source.getAttachedSeries();
    if (!series) return 0;

    const coordinate = series.priceToCoordinate(lastItem.middle);
    return coordinate ?? 0;
  }

  text(): string {
    const lastItem = this._getLastVisibleItem();
    if (!lastItem) return '';
    return lastItem.middle.toFixed(2);
  }

  backColor(): string {
    const options = this._source.getOptions();
    return getSolidColorFromFill(options.middleLineColor);
  }
}

/**
 * Price axis view for lower line
 */
class BandLowerAxisView extends BaseSeriesPrimitiveAxisView<
  BandProcessedData,
  BandPrimitiveOptions
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
 * Band Primitive
 *
 * Implements ISeriesPrimitive for z-order control and independent rendering.
 * Syncs data from attached ICustomSeries for autoscaling.
 *
 * Refactored to extend BaseSeriesPrimitive following DRY principles.
 */
export class BandPrimitive extends BaseSeriesPrimitive<BandProcessedData, BandPrimitiveOptions> {
  constructor(chart: IChartApi, options: BandPrimitiveOptions) {
    super(chart, options);
  }

  /**
   * Returns settings schema for series dialog
   * Maps property names to their types for automatic UI generation
   */
  static getSettings() {
    return {
      upperLine: 'line' as const,
      middleLine: 'line' as const,
      lowerLine: 'line' as const,
      upperFillColor: 'color' as const,
      upperFillVisible: 'boolean' as const,
      lowerFillColor: 'color' as const,
      lowerFillVisible: 'boolean' as const,
    };
  }

  // Required: Initialize views
  protected _initializeViews(): void {
    this._addPaneView(new BandPrimitivePaneView(this));
    this._addPriceAxisView(new BandUpperAxisView(this));
    this._addPriceAxisView(new BandMiddleAxisView(this));
    this._addPriceAxisView(new BandLowerAxisView(this));
  }

  // Required: Process raw data
  protected _processData(rawData: any[]): BandProcessedData[] {
    return rawData
      .map(item => {
        const upper = item.upper;
        const middle = item.middle;
        const lower = item.lower;

        // Validate data
        if (
          upper === null ||
          upper === undefined ||
          isNaN(upper) ||
          middle === null ||
          middle === undefined ||
          isNaN(middle) ||
          lower === null ||
          lower === undefined ||
          isNaN(lower)
        ) {
          return null;
        }

        return {
          time: item.time,
          upper,
          middle,
          lower,
        };
      })
      .filter((item): item is BandProcessedData => item !== null);
  }

  // Optional: Custom z-order default
  protected _getDefaultZOrder(): PrimitivePaneViewZOrder {
    return 'normal'; // Render in normal layer (in front of grid)
  }
}
