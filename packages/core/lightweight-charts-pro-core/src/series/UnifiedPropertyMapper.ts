/**
 * @fileoverview Unified Property Mapper
 *
 * Descriptor-driven property mapper that replaces the 220-line seriesPropertyMapper.ts.
 * All mapping logic is now in descriptors - this just executes the mapping.
 */

import {
  dialogConfigToApiOptions as descriptorDialogToApi,
  apiOptionsToDialogConfig as descriptorApiToDialog,
} from './core/UnifiedSeriesDescriptor';
import { getSeriesDescriptor } from './UnifiedSeriesFactory';
import { normalizeSeriesType } from './utils/seriesTypeNormalizer';
import { logger } from '../utils/logger';

/**
 * Line style conversion maps (backward compatibility)
 */
export const LINE_STYLE_TO_STRING: Record<number, string> = {
  0: 'solid',
  1: 'dotted',
  2: 'dashed',
  3: 'large_dashed',
  4: 'sparse_dotted',
};

export const STRING_TO_LINE_STYLE: Record<string, number> = {
  solid: 0,
  dotted: 1,
  dashed: 2,
  large_dashed: 3,
  sparse_dotted: 4,
};

/**
 * Convert LightweightCharts API options (flat) to Dialog config (nested)
 *
 * @param seriesType - The series type (e.g., 'Line', 'Band', 'line', 'band')
 * @param apiOptions - Flat options from series.options()
 * @returns Nested config for dialog
 */
export function apiOptionsToDialogConfig(seriesType: string, apiOptions: any): any {
  // Normalize series type (e.g., 'line' -> 'Line', 'band' -> 'Band')
  const normalizedType = normalizeSeriesType(seriesType);
  const descriptor = getSeriesDescriptor(normalizedType);
  if (!descriptor) {
    logger.warn(
      `Unknown series type: ${seriesType} (normalized to ${normalizedType})`,
      'UnifiedPropertyMapper'
    );
    return apiOptions; // Fallback: return as-is
  }

  return descriptorApiToDialog(descriptor, apiOptions);
}

/**
 * Convert Dialog config (nested) to LightweightCharts API options (flat)
 *
 * @param seriesType - The series type (e.g., 'Line', 'Band', 'line', 'band')
 * @param dialogConfig - Nested config from dialog
 * @returns Flat options for series.applyOptions()
 */
export function dialogConfigToApiOptions(seriesType: string, dialogConfig: any): any {
  // Normalize series type (e.g., 'line' -> 'Line', 'band' -> 'Band')
  const normalizedType = normalizeSeriesType(seriesType);

  const descriptor = getSeriesDescriptor(normalizedType);
  if (!descriptor) {
    logger.warn(
      `Unknown series type: ${seriesType} (normalized to ${normalizedType})`,
      'UnifiedPropertyMapper'
    );
    return dialogConfig; // Fallback: return as-is
  }

  const apiOptions = descriptorDialogToApi(descriptor, dialogConfig);
  return apiOptions;
}

/**
 * Legacy compatibility export
 */
export const PropertyMapper = {
  apiOptionsToDialogConfig,
  dialogConfigToApiOptions,
  LINE_STYLE_TO_STRING,
  STRING_TO_LINE_STYLE,
};

export default PropertyMapper;
