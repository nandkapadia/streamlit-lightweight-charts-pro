/**
 * @fileoverview Base factory class for series plugins
 *
 * Provides DRY-compliant factory patterns to eliminate code duplication
 * across series plugin factory functions.
 */

import { IChartApi, ISeriesApi } from 'lightweight-charts';

/**
 * Base options interface for all series plugins
 */
export interface BaseSeriesPluginOptions {
  /** Price scale ID */
  priceScaleId?: string;
  /** Whether to use primitive rendering */
  usePrimitive?: boolean;
  /** Z-index for primitive rendering */
  zIndex?: number;
  /** Initial data */
  data?: any[];
  /** Whether to show last value */
  lastValueVisible?: boolean;
}

/**
 * Factory configuration for series plugins
 */
export interface SeriesFactoryConfig<T extends BaseSeriesPluginOptions> {
  /** Series class constructor */
  SeriesClass: new () => any;
  /** Primitive class constructor (optional) */
  PrimitiveClass?: new (chart: IChartApi, options: any) => any;
  /** Default options */
  defaultOptions: T;
  /** Option mapping function */
  mapOptions?: (options: T) => any;
  /** Primitive option mapping function */
  mapPrimitiveOptions?: (options: T) => any;
}

/**
 * Base factory class for series plugins
 */
export abstract class SeriesPluginFactory<T extends BaseSeriesPluginOptions> {
  protected config: SeriesFactoryConfig<T>;

  constructor(config: SeriesFactoryConfig<T>) {
    this.config = config;
  }

  /**
   * Create series with optional primitive
   *
   * @param chart - Chart instance
   * @param options - Series options
   * @returns Series instance
   */
  create(chart: IChartApi, options: T = {} as T): ISeriesApi<any> {
    // Merge with default options
    const mergedOptions = { ...this.config.defaultOptions, ...options };

    // Map options if mapper provided
    const seriesOptions = this.config.mapOptions
      ? this.config.mapOptions(mergedOptions)
      : mergedOptions;

    // Create the series
    const series = chart.addCustomSeries(new this.config.SeriesClass(), seriesOptions);

    // Set initial data if provided
    if (mergedOptions.data && mergedOptions.data.length > 0) {
      series.setData(mergedOptions.data);
    }

    // Create and attach primitive if requested
    if (mergedOptions.usePrimitive && this.config.PrimitiveClass) {
      this.createPrimitive(chart, series, mergedOptions);
    }

    return series;
  }

  /**
   * Create and attach primitive to series
   *
   * @param chart - Chart instance
   * @param series - Series instance
   * @param options - Series options
   */
  protected createPrimitive(chart: IChartApi, series: ISeriesApi<any>, options: T): void {
    if (!this.config.PrimitiveClass) {
      throw new Error('PrimitiveClass not configured for this factory');
    }

    // Map primitive options if mapper provided
    const primitiveOptions = this.config.mapPrimitiveOptions
      ? this.config.mapPrimitiveOptions(options)
      : options;

    // Create primitive
    const primitive = new this.config.PrimitiveClass(chart, primitiveOptions);

    // Attach primitive to series
    series.attachPrimitive(primitive);

    // Set primitive data if provided
    if (options.data && 'setData' in primitive) {
      (primitive as any).setData(options.data);
    }
  }

  /**
   * Get default options
   */
  getDefaultOptions(): T {
    return { ...this.config.defaultOptions };
  }

  /**
   * Validate options
   *
   * @param _options - Options to validate
   * @returns Validation result
   */
  validateOptions(_options: T): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Add custom validation logic here
    // This can be overridden by subclasses

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

/**
 * Helper function to create series factory
 *
 * @param config - Factory configuration
 * @returns Factory instance
 */
export function createSeriesFactory<T extends BaseSeriesPluginOptions>(
  config: SeriesFactoryConfig<T>
): SeriesPluginFactory<T> {
  return new (class extends SeriesPluginFactory<T> {
    constructor() {
      super(config);
    }
  })();
}

/**
 * Common option mappers
 */
export const OptionMappers = {
  /**
   * Map line options (color, width, style, visible)
   */
  mapLineOptions: (prefix: string) => (options: any) => ({
    [`${prefix}Color`]: options[`${prefix}Color`] || options.color || '#2196F3',
    [`${prefix}Width`]: options[`${prefix}Width`] || options.width || 1,
    [`${prefix}Style`]: options[`${prefix}Style`] || options.style || 0,
    [`${prefix}Visible`]: options[`${prefix}Visible`] !== false,
  }),

  /**
   * Map fill options (color, visible)
   */
  mapFillOptions: (prefix: string) => (options: any) => ({
    [`${prefix}Color`]: options[`${prefix}Color`] || options.fillColor || 'rgba(33, 150, 243, 0.1)',
    [`${prefix}Visible`]: options[`${prefix}Visible`] !== false,
  }),

  /**
   * Map common series options
   */
  mapCommonOptions: (options: any) => ({
    priceScaleId: options.priceScaleId || 'right',
    lastValueVisible: options.lastValueVisible !== false,
    _usePrimitive: options.usePrimitive || false,
  }),
};
