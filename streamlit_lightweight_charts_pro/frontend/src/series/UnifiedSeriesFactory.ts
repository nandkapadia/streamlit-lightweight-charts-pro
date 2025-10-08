/**
 * @fileoverview Unified Series Factory
 *
 * Descriptor-driven series factory that replaces the 669-line seriesFactory.ts.
 * All series configuration is now in descriptors - this factory just orchestrates.
 */

import { ISeriesApi, SeriesOptionsCommon } from 'lightweight-charts';
import { UnifiedSeriesDescriptor, extractDefaultOptions } from './core/UnifiedSeriesDescriptor';
import { BUILTIN_SERIES_DESCRIPTORS } from './descriptors/builtinSeriesDescriptors';
import { CUSTOM_SERIES_DESCRIPTORS } from './descriptors/customSeriesDescriptors';

/**
 * Custom error class for series creation failures
 */
export class SeriesCreationError extends Error {
  constructor(
    public seriesType: string,
    public reason: string,
    public originalError?: Error
  ) {
    super(`Failed to create ${seriesType} series: ${reason}`);
    this.name = 'SeriesCreationError';
  }
}

/**
 * Series descriptor registry - all series in one place
 */
const SERIES_REGISTRY = new Map<string, UnifiedSeriesDescriptor>([
  // Built-in series
  ['Line', BUILTIN_SERIES_DESCRIPTORS.Line],
  ['Area', BUILTIN_SERIES_DESCRIPTORS.Area],
  ['Histogram', BUILTIN_SERIES_DESCRIPTORS.Histogram],
  ['Bar', BUILTIN_SERIES_DESCRIPTORS.Bar],
  ['Candlestick', BUILTIN_SERIES_DESCRIPTORS.Candlestick],
  ['Baseline', BUILTIN_SERIES_DESCRIPTORS.Baseline],
  // Custom series
  ['Band', CUSTOM_SERIES_DESCRIPTORS.Band],
  ['Ribbon', CUSTOM_SERIES_DESCRIPTORS.Ribbon],
  ['GradientRibbon', CUSTOM_SERIES_DESCRIPTORS.GradientRibbon],
  ['Signal', CUSTOM_SERIES_DESCRIPTORS.Signal],
]);

/**
 * Get series descriptor by type
 */
export function getSeriesDescriptor(seriesType: string): UnifiedSeriesDescriptor | undefined {
  return SERIES_REGISTRY.get(seriesType);
}

/**
 * Get all available series types
 */
export function getAvailableSeriesTypes(): string[] {
  return Array.from(SERIES_REGISTRY.keys());
}

/**
 * Check if a series type is custom
 */
export function isCustomSeries(seriesType: string): boolean {
  const descriptor = SERIES_REGISTRY.get(seriesType);
  return descriptor?.isCustom ?? false;
}

/**
 * Create a series using the unified descriptor system
 *
 * @param chart - LightweightCharts chart instance
 * @param seriesType - Type of series to create (e.g., 'Line', 'Band')
 * @param data - Series data
 * @param userOptions - User-provided options (merged with defaults)
 * @returns Created series instance
 * @throws {SeriesCreationError} If series creation fails
 */
export function createSeries(
  chart: any,
  seriesType: string,
  data: any[],
  userOptions: Partial<SeriesOptionsCommon> = {}
): ISeriesApi<any> {
  try {
    // Validate inputs
    if (!chart) {
      throw new SeriesCreationError(seriesType, 'Chart instance is required');
    }

    if (!seriesType || typeof seriesType !== 'string') {
      throw new SeriesCreationError(seriesType || 'unknown', 'Series type must be a non-empty string');
    }

    // Get descriptor
    const descriptor = SERIES_REGISTRY.get(seriesType);
    if (!descriptor) {
      const availableTypes = Array.from(SERIES_REGISTRY.keys()).join(', ');
      throw new SeriesCreationError(
        seriesType,
        `Unknown series type. Available types: ${availableTypes}`
      );
    }

    // Extract default options from descriptor
    const defaultOptions = extractDefaultOptions(descriptor);

    // Merge user options with defaults
    const options = { ...defaultOptions, ...userOptions };

    // Create series using descriptor's creator function
    return descriptor.create(chart, data, options);
  } catch (error) {
    // Re-throw SeriesCreationError as-is
    if (error instanceof SeriesCreationError) {
      throw error;
    }

    // Wrap other errors in SeriesCreationError
    throw new SeriesCreationError(
      seriesType,
      'Series creation failed',
      error as Error
    );
  }
}

/**
 * Get default options for a series type
 *
 * @param seriesType - Type of series
 * @returns Default options object
 * @throws {SeriesCreationError} If series type is unknown
 */
export function getDefaultOptions(seriesType: string): Partial<SeriesOptionsCommon> {
  const descriptor = SERIES_REGISTRY.get(seriesType);
  if (!descriptor) {
    const availableTypes = Array.from(SERIES_REGISTRY.keys()).join(', ');
    throw new SeriesCreationError(
      seriesType,
      `Unknown series type. Available types: ${availableTypes}`
    );
  }
  return extractDefaultOptions(descriptor);
}

/**
 * Register a custom series descriptor (for extensibility)
 *
 * @param descriptor - Custom series descriptor
 */
export function registerSeriesDescriptor(descriptor: UnifiedSeriesDescriptor): void {
  SERIES_REGISTRY.set(descriptor.type, descriptor);
}

/**
 * Unregister a series descriptor
 *
 * @param seriesType - Type of series to unregister
 */
export function unregisterSeriesDescriptor(seriesType: string): boolean {
  return SERIES_REGISTRY.delete(seriesType);
}

/**
 * Get series descriptors by category
 *
 * @param category - Category name (e.g., 'Basic', 'Custom')
 * @returns Array of descriptors in that category
 */
export function getSeriesDescriptorsByCategory(category: string): UnifiedSeriesDescriptor[] {
  return Array.from(SERIES_REGISTRY.values()).filter(desc => desc.category === category);
}

/**
 * Legacy compatibility layer for existing code
 * This allows gradual migration from old factory to new factory
 */
export const SeriesFactory = {
  createSeries,
  getSeriesDescriptor,
  getDefaultOptions,
  isCustomSeries,
  getAvailableSeriesTypes,
};

export default SeriesFactory;
