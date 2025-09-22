/**
 * Utility functions for LightweightCharts type compatibility
 * Handles DeepPartial interface compatibility issues
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
