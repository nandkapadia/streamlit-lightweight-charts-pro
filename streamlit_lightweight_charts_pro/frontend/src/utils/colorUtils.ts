/**
 * @fileoverview Streamlit-specific color utility functions
 *
 * These are wrapper functions used by SeriesSettingsDialog for color/opacity controls.
 * Core color utilities are imported from lightweight-charts-pro-core.
 */

import { parseCssColor, rgbaToHex } from 'lightweight-charts-pro-core';

/**
 * Extract color and opacity from a CSS color string
 * Used by SeriesSettingsDialog for color/opacity form controls
 *
 * @param color - Color in CSS format (hex, rgb, rgba)
 * @returns Object with hex color and opacity percentage (0-100)
 */
export function extractColorAndOpacity(color: string): { color: string; opacity: number } {
  const rgba = parseCssColor(color);
  if (!rgba) {
    return { color: color || '#2196F3', opacity: 100 };
  }

  const hexColor = rgbaToHex(rgba.r, rgba.g, rgba.b);
  const opacity = Math.round(rgba.a * 100);

  return { color: hexColor, opacity };
}

/**
 * Convert color and opacity percentage to CSS color string
 * Used by SeriesSettingsDialog for opacity controls
 * Handles both hex and rgba input formats
 *
 * @param color - Color in hex or rgba format
 * @param opacity - Opacity percentage (0-100)
 * @returns CSS color string with applied opacity
 */
export function toCss(color: string, opacity: number = 100): string {
  // Parse color (supports both hex and rgba)
  const rgba = parseCssColor(color);
  if (!rgba) {
    return color; // Fallback to original color if parsing fails
  }

  // If opacity is 100%, return as hex (unless original was rgba)
  if (opacity >= 100 && !color.startsWith('rgba')) {
    return rgbaToHex(rgba.r, rgba.g, rgba.b);
  }

  // Convert opacity percentage to alpha (0-1)
  const alpha = Math.max(0, Math.min(1, opacity / 100));

  // Return rgba format with new opacity
  return `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${alpha})`;
}
