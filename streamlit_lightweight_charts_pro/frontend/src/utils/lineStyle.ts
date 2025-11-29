/**
 * @fileoverview Streamlit-specific line style utilities
 *
 * Provides validation and cleaning functions for line style options.
 * Core LineStyle enum is imported from lightweight-charts-pro-core.
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
 */
export const validateLineStyle = (lineStyle: any): LineStyle | undefined => {
  if (lineStyle === null || lineStyle === undefined || lineStyle === '') return undefined;

  // Handle LineStyle enum values (0-4)
  if (typeof lineStyle === 'number' && lineStyle >= 0 && lineStyle <= 4) {
    return lineStyle as LineStyle;
  }

  // Handle string format
  if (typeof lineStyle === 'string') {
    const styleMap: Record<string, LineStyle> = {
      solid: LineStyle.Solid,
      dotted: LineStyle.Dotted,
      dashed: LineStyle.Dashed,
      'large-dashed': LineStyle.LargeDashed,
      'sparse-dotted': LineStyle.SparseDotted,
    };
    return styleMap[lineStyle.toLowerCase()];
  }

  // Handle array (custom dash pattern) - return Solid as fallback
  if (Array.isArray(lineStyle)) {
    return LineStyle.Solid;
  }

  return undefined;
};

/**
 * Recursively clean line style options by validating line styles and removing debug properties.
 * Used to sanitize chart configuration before passing to TradingView Lightweight Charts.
 *
 * @param options - Chart options object to clean
 * @returns Cleaned options object with validated line styles
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
