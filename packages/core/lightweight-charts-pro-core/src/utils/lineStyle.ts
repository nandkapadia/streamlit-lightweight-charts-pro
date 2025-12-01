/**
 * @fileoverview Line Style Validation and Cleaning Utilities
 *
 * Utilities for validating and cleaning line style options for TradingView Lightweight Charts.
 * Handles format conversion and recursive option cleaning.
 *
 * This module provides:
 * - Line style validation with multiple input formats
 * - Recursive option cleaning for nested configurations
 * - Debug property removal
 * - Format standardization
 *
 * Features:
 * - Supports numeric and string line style formats
 * - Handles snake_case to camelCase conversion
 * - Recursively cleans nested option objects
 * - Removes invalid or debug properties
 *
 * @example
 * ```typescript
 * import { validateLineStyle, cleanLineStyleOptions } from './lineStyle';
 *
 * // Validate line style
 * const style = validateLineStyle('dashed'); // Returns LineStyle.Dashed
 *
 * // Clean options
 * const cleaned = cleanLineStyleOptions({
 *   lineStyle: 'solid',
 *   debug: true,
 *   upperLine: { lineStyle: 2 }
 * });
 * ```
 */

import { LineStyle } from 'lightweight-charts';

/**
 * Validates and converts line style to TradingView format.
 *
 * Accepts multiple input formats:
 * - Numbers: 0-4 (LineStyle enum values)
 * - Strings: 'solid', 'dotted', 'dashed', 'large-dashed', 'sparse-dotted'
 * - Arrays: Custom dash patterns (returns Solid)
 *
 * @param lineStyle - Line style in various formats
 * @returns Validated LineStyle enum value or undefined if invalid
 *
 * @example
 * ```typescript
 * validateLineStyle(0) // LineStyle.Solid
 * validateLineStyle('dashed') // LineStyle.Dashed
 * validateLineStyle([5, 5]) // LineStyle.Solid (custom pattern)
 * validateLineStyle('invalid') // undefined
 * ```
 */
export const validateLineStyle = (lineStyle: any): LineStyle | undefined => {
  if (lineStyle === null || lineStyle === undefined || lineStyle === '') return undefined;

  if (typeof lineStyle === 'number' && LineStyle && Object.values(LineStyle).includes(lineStyle)) {
    return lineStyle;
  }

  if (typeof lineStyle === 'string' && LineStyle) {
    const styleMap: { [key: string]: LineStyle } = {
      solid: LineStyle.Solid,
      dotted: LineStyle.Dotted,
      dashed: LineStyle.Dashed,
      'large-dashed': LineStyle.LargeDashed,
      'sparse-dotted': LineStyle.SparseDotted,
    };
    return styleMap[lineStyle.toLowerCase()];
  }

  if (Array.isArray(lineStyle)) {
    if (
      lineStyle.length > 0 &&
      lineStyle.every(val => typeof val === 'number' && val >= 0) &&
      LineStyle
    ) {
      return LineStyle.Solid;
    }
  }

  return undefined;
};

/**
 * Recursively cleans and validates chart options.
 *
 * Removes debug properties and validates line styles in nested option objects.
 * Handles special properties like upperLine, middleLine, lowerLine.
 *
 * @param options - Chart options object to clean
 * @returns Cleaned options object with validated line styles
 *
 * @example
 * ```typescript
 * const cleaned = cleanLineStyleOptions({
 *   lineStyle: 'dashed',
 *   debug: true,
 *   upperLine: {
 *     lineStyle: 2,
 *     color: '#ff0000'
 *   },
 *   nestedConfig: {
 *     lineStyle: 'solid'
 *   }
 * });
 * // Returns: { lineStyle: LineStyle.Dashed, upperLine: { ... }, nestedConfig: { ... } }
 * ```
 */
export const cleanLineStyleOptions = (options: any): any => {
  if (!options) return options;

  const cleaned: any = { ...options };

  // Remove debug properties
  if (cleaned.debug !== undefined) {
    delete cleaned.debug;
  }

  if (cleaned.lineStyle !== undefined) {
    const validLineStyle = validateLineStyle(cleaned.lineStyle);
    if (validLineStyle !== undefined) {
      cleaned.lineStyle = validLineStyle;
    } else {
      delete cleaned.lineStyle;
    }
  }

  if (cleaned.style && typeof cleaned.style === 'object') {
    cleaned.style = cleanLineStyleOptions(cleaned.style);
  }

  if (cleaned.upperLine && typeof cleaned.upperLine === 'object') {
    cleaned.upperLine = cleanLineStyleOptions(cleaned.upperLine);
  }
  if (cleaned.middleLine && typeof cleaned.middleLine === 'object') {
    cleaned.middleLine = cleanLineStyleOptions(cleaned.middleLine);
  }
  if (cleaned.lowerLine && typeof cleaned.lowerLine === 'object') {
    cleaned.lowerLine = cleanLineStyleOptions(cleaned.lowerLine);
  }

  for (const key in cleaned) {
    if (cleaned[key] && typeof cleaned[key] === 'object' && !Array.isArray(cleaned[key])) {
      cleaned[key] = cleanLineStyleOptions(cleaned[key]);
    }
  }

  return cleaned;
};
