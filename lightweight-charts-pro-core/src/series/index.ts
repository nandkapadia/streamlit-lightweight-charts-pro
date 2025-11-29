/**
 * @fileoverview Series infrastructure exports for lightweight-charts-pro-core
 *
 * Provides unified series creation, property mapping, and descriptors
 * for all series types (built-in and custom).
 */

// Core Types
export type { UnifiedSeriesDescriptor } from './core/UnifiedSeriesDescriptor';

// Property Mapping
export { default as PropertyMapper } from './UnifiedPropertyMapper';
export { apiOptionsToDialogConfig, dialogConfigToApiOptions, LINE_STYLE_TO_STRING, STRING_TO_LINE_STYLE } from './UnifiedPropertyMapper';

// Series Factory
export { default as SeriesFactory } from './UnifiedSeriesFactory';
export * from './UnifiedSeriesFactory';

// Utilities
export { normalizeSeriesType } from './utils/seriesTypeNormalizer';

// Descriptors
export { CUSTOM_SERIES_DESCRIPTORS } from './descriptors/customSeriesDescriptors';
export { BUILTIN_SERIES_DESCRIPTORS } from './descriptors/builtinSeriesDescriptors';
