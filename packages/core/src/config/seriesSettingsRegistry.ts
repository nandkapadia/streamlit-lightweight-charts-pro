/**
 * @fileoverview Series Settings Registry
 *
 * Descriptor-driven settings registry - derives settings from UnifiedSeriesDescriptor.
 * This replaces the old manual settings definitions.
 */

import { getSeriesDescriptor } from '../series/UnifiedSeriesFactory';
import { normalizeSeriesType } from '../series/utils/seriesTypeNormalizer';
import type { PropertyType } from '../series/core/UnifiedSeriesDescriptor';
import { logger } from '../utils/logger';

export type SettingType = 'boolean' | 'number' | 'color' | 'line' | 'lineStyle' | 'lineWidth';

export interface SeriesSettings {
  [propertyName: string]: SettingType;
}

/**
 * Convert PropertyType to SettingType (they're mostly the same)
 */
function propertyTypeToSettingType(propertyType: PropertyType): SettingType {
  return propertyType as SettingType;
}

/**
 * Get settings for a series type by deriving them from the series descriptor
 *
 * @param seriesType - The series type string (case-insensitive)
 * @param primitive - Optional primitive instance to check for static getSettings()
 * @returns Settings object mapping property names to types
 */
export function getSeriesSettings(seriesType: string | undefined, primitive?: any): SeriesSettings {
  if (!seriesType) return {};

  // Normalize type using centralized utility
  const mappedType = normalizeSeriesType(seriesType);

  // Try to get settings from primitive's static method first (custom primitives)
  if (primitive?.constructor?.getSettings) {
    try {
      return primitive.constructor.getSettings();
    } catch (error) {
      logger.warn(`Error calling getSettings on ${seriesType}`, 'seriesSettingsRegistry', error);
    }
  }

  // Get descriptor and derive settings from it
  const descriptor = getSeriesDescriptor(mappedType);
  if (!descriptor) {
    logger.warn(
      `Unknown series type: ${seriesType} (normalized to ${mappedType})`,
      'seriesSettingsRegistry'
    );
    return {};
  }

  // Convert descriptor properties to SeriesSettings format
  const settings: SeriesSettings = {};
  for (const [propName, propDesc] of Object.entries(descriptor.properties)) {
    // Skip hidden properties (they exist in API but not in dialog)
    if (propDesc.hidden) {
      continue;
    }
    settings[propName] = propertyTypeToSettingType(propDesc.type);
  }

  return settings;
}
