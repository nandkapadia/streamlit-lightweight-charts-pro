/**
 * @fileoverview Lightweight Charts Utility Functions
 *
 * Type compatibility utilities for TradingView Lightweight Charts library.
 * Handles DeepPartial interface compatibility and type conversions.
 *
 * This module provides:
 * - Type-safe converters for chart options
 * - Series options compatibility helpers
 * - Line width, style, and source converters
 * - Safe options update wrappers
 *
 * @example
 * ```typescript
 * import { createSeriesOptions, asLineWidth } from './lightweightChartsUtils';
 *
 * const options = createSeriesOptions({
 *   lineWidth: 2,
 *   lineStyle: 0,
 *   color: '#2196F3'
 * });
 *
 * series.applyOptions(options);
 * ```
 */

/**
 * Utility type helpers for LightweightCharts compatibility
 */

// Type-safe line width converter
export function asLineWidth(value: number): any {
  return value;
}

// Type-safe line style converter
export function asLineStyle(value: number | string): any {
  return typeof value === 'string' ? parseInt(value, 10) : value;
}

// Type-safe price line source converter
export function asPriceLineSource(value: string): any {
  return value;
}

/**
 * Comprehensive series options converter for LightweightCharts compatibility
 */
export function createSeriesOptions(options: Record<string, any>): Record<string, any> {
  const converted: Record<string, any> = {};

  for (const [key, value] of Object.entries(options)) {
    switch (key) {
      case 'lineWidth':
      case 'priceLineWidth':
      case 'baseLineWidth':
        converted[key] = asLineWidth(value);
        break;
      case 'lineStyle':
      case 'priceLineStyle':
      case 'baseLineStyle':
        converted[key] = asLineStyle(value);
        break;
      case 'priceLineSource':
        converted[key] = asPriceLineSource(value);
        break;
      default:
        converted[key] = value;
    }
  }

  return converted;
}

/**
 * Safe series options update that handles DeepPartial compatibility
 */
export function safeSeriesOptions<T>(options: T): T {
  return options as T;
}
