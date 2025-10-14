/**
 * @fileoverview Unified color utilities for series rendering and UI
 *
 * This module consolidates all color manipulation functions from:
 * - colorUtils.ts (gradient/interpolation functions)
 * - helpers.ts (color conversion and validation functions)
 *
 * Key Features:
 * - Color format conversions (hex ↔ rgba)
 * - Color interpolation for gradients
 * - Color validation and sanitization
 * - CSS color generation with opacity
 * - Contrast color calculation
 */

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * RGBA color components
 */
export interface RgbaColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

// ============================================================================
// Color Parsing Functions
// ============================================================================

/**
 * Parse hex color to RGBA components
 *
 * @param hex - Hex color string (e.g., '#FF0000' or '#F00')
 * @returns RGBA color object or null if invalid
 */
export function parseHexColor(hex: string): RgbaColor | null {
  // Remove # if present
  const cleanHex = hex.replace('#', '');

  // Support both 3-digit and 6-digit hex
  let r: number, g: number, b: number;

  if (cleanHex.length === 3) {
    r = parseInt(cleanHex[0] + cleanHex[0], 16);
    g = parseInt(cleanHex[1] + cleanHex[1], 16);
    b = parseInt(cleanHex[2] + cleanHex[2], 16);
  } else if (cleanHex.length === 6) {
    r = parseInt(cleanHex.substring(0, 2), 16);
    g = parseInt(cleanHex.substring(2, 4), 16);
    b = parseInt(cleanHex.substring(4, 6), 16);
  } else {
    return null; // Invalid hex format
  }

  // Validate parsed values
  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    return null;
  }

  return { r, g, b, a: 1 };
}

/**
 * Parse CSS color value and extract RGBA components
 * Supports hex, rgb(), and rgba() formats
 *
 * @param cssColor - CSS color string
 * @returns RGBA color object or null if invalid
 */
export function parseCssColor(cssColor: string): RgbaColor | null {
  // Handle hex colors
  if (cssColor.startsWith('#')) {
    return parseHexColor(cssColor);
  }

  // Handle rgba/rgb colors
  const rgbaMatch = cssColor.match(/rgba?\(([^)]+)\)/);
  if (rgbaMatch) {
    const values = rgbaMatch[1].split(',').map(v => parseFloat(v.trim()));
    if (values.length >= 3) {
      return {
        r: values[0],
        g: values[1],
        b: values[2],
        a: values[3] || 1,
      };
    }
  }

  return null;
}

// ============================================================================
// Color Conversion Functions
// ============================================================================

/**
 * Convert hex color to RGBA string with alpha
 * This is the primary conversion function for canvas rendering
 *
 * @param hex - Hex color string (e.g., '#FF0000')
 * @param alpha - Alpha value between 0 and 1 (default: 1)
 * @returns RGBA color string (e.g., 'rgba(255, 0, 0, 1)')
 */
export function hexToRgbaString(hex: string, alpha: number = 1): string {
  const parsed = parseHexColor(hex);
  if (!parsed) {
    return `rgba(0, 0, 0, ${alpha})`; // Fallback to black
  }

  return `rgba(${parsed.r}, ${parsed.g}, ${parsed.b}, ${alpha})`;
}

/**
 * Convert hex color to RGBA components object
 * Useful when you need individual color components
 *
 * @param hex - Hex color string
 * @returns RGBA color object or null if invalid
 */
export function hexToRgba(hex: string): RgbaColor | null {
  return parseHexColor(hex);
}

/**
 * Convert RGBA values to hex color
 *
 * @param r - Red component (0-255)
 * @param g - Green component (0-255)
 * @param b - Blue component (0-255)
 * @returns Hex color string (e.g., '#FF0000')
 */
export function rgbaToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const hex = Math.round(Math.max(0, Math.min(255, n))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Convert CSS color to hex format
 *
 * @param cssColor - CSS color string (hex, rgb, or rgba)
 * @returns Hex color string
 */
export function cssToHex(cssColor: string): string {
  const parsed = parseCssColor(cssColor);
  if (parsed) {
    return rgbaToHex(parsed.r, parsed.g, parsed.b);
  }
  return cssColor; // Return original if parsing fails
}

/**
 * Extract hex color and opacity percentage from color string
 * Handles both hex and rgba formats
 *
 * @param color - Color in hex or rgba format
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

// ============================================================================
// Color Interpolation Functions
// ============================================================================

/**
 * Interpolate between two hex colors
 * Used for gradient rendering
 *
 * @param startColor - Starting color in hex format (e.g., '#FF0000')
 * @param endColor - Ending color in hex format (e.g., '#00FF00')
 * @param factor - Interpolation factor between 0 and 1
 * @returns Interpolated color in hex format
 */
export function interpolateColor(startColor: string, endColor: string, factor: number): string {
  // Clamp factor to 0-1 range
  factor = Math.max(0, Math.min(1, factor));

  try {
    const start = parseHexColor(startColor);
    const end = parseHexColor(endColor);

    if (!start || !end) {
      return startColor;
    }

    const r = Math.round(start.r + (end.r - start.r) * factor);
    const g = Math.round(start.g + (end.g - start.g) * factor);
    const b = Math.round(start.b + (end.b - start.b) * factor);

    return rgbaToHex(r, g, b);
  } catch {
    return startColor;
  }
}

/**
 * Generate gradient color based on value position and normalization
 * Used by gradient ribbon series
 *
 * @param value - Current value for gradient calculation
 * @param allValues - Array of all values for normalization
 * @param index - Current index in the array
 * @param startColor - Start color for gradient
 * @param endColor - End color for gradient
 * @param normalize - Whether to normalize based on value spread vs position
 * @returns Calculated gradient color
 */
export function calculateGradientColor(
  value: { upper: number; lower: number },
  allValues: { upper: number; lower: number }[],
  index: number,
  startColor: string,
  endColor: string,
  normalize: boolean = true
): string {
  if (normalize) {
    // Calculate factor based on spread (upper - lower)
    const spread = Math.abs(value.upper - value.lower);
    const maxSpread = Math.max(...allValues.map(d => Math.abs(d.upper - d.lower)));
    const factor = maxSpread > 0 ? Math.min(spread / maxSpread, 1) : 0;

    return interpolateColor(startColor, endColor, factor);
  } else {
    // Use position in data as factor
    const factor = allValues.length > 1 ? index / (allValues.length - 1) : 0;
    return interpolateColor(startColor, endColor, factor);
  }
}

// ============================================================================
// Color Validation Functions
// ============================================================================

/**
 * Check if a color is transparent or effectively invisible
 *
 * @param color - Color string to check
 * @returns True if color is transparent
 */
export function isTransparent(color: string): boolean {
  if (!color) return true;

  // Check for fully transparent colors
  if (color === 'transparent') return true;

  // Check for rgba with alpha = 0
  if (color.startsWith('rgba(')) {
    const match = color.match(/rgba\([^)]+,\s*([^)]+)\)/);
    if (match && parseFloat(match[1]) === 0) return true;
  }

  // Check for hex with alpha = 00 (8-digit hex)
  if (color.startsWith('#') && color.length === 9) {
    const alpha = color.substring(7, 9);
    if (alpha === '00') return true;
  }

  // Check for hex with alpha = 00 (4-digit hex)
  if (color.startsWith('#') && color.length === 5) {
    const alpha = color.substring(4, 5);
    if (alpha === '0') return true;
  }

  return false;
}

/**
 * Validate hex color format
 *
 * @param color - Color string to validate
 * @returns True if valid hex color
 */
export function isValidHexColor(color: string): boolean {
  const hexPattern = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  return hexPattern.test(color);
}

/**
 * Sanitize hex color input
 * Adds # prefix if missing and validates format
 *
 * @param input - Color input string
 * @returns Sanitized hex color or default color if invalid
 */
export function sanitizeHexColor(input: string): string {
  // Add # if missing
  let color = input.startsWith('#') ? input : `#${input}`;

  // Convert to uppercase for consistency
  color = color.toUpperCase();

  // Validate and return default if invalid
  return isValidHexColor(color) ? color : '#2196F3';
}

// ============================================================================
// Color Utility Functions
// ============================================================================

/**
 * Get contrasting text color for a background color
 * Uses relative luminance formula for accessibility
 *
 * @param backgroundColor - Background color in hex format
 * @returns Contrasting text color (light or dark)
 */
export function getContrastColor(backgroundColor: string): string {
  const rgba = parseHexColor(backgroundColor);
  if (!rgba) {
    return '#333333'; // Default dark text
  }

  // Calculate luminance using relative luminance formula
  const { r, g, b } = rgba;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Return white text for dark backgrounds, dark text for light backgrounds
  return luminance > 0.5 ? '#333333' : '#ffffff';
}

/**
 * Generate a palette of related colors for theming
 *
 * @param baseColor - Base color in hex format
 * @param count - Number of colors to generate (default: 5)
 * @returns Array of hex colors
 */
export function generateColorPalette(baseColor: string, count: number = 5): string[] {
  const rgba = parseHexColor(baseColor);
  if (!rgba) {
    return [baseColor];
  }

  const colors: string[] = [];
  const { r, g, b } = rgba;

  for (let i = 0; i < count; i++) {
    const factor = 0.2 + (i / (count - 1)) * 0.6; // Range from 0.2 to 0.8
    const newR = Math.round(r * factor);
    const newG = Math.round(g * factor);
    const newB = Math.round(b * factor);

    colors.push(rgbaToHex(newR, newG, newB));
  }

  return colors;
}

/**
 * Clamp number between min and max values
 * Used for color component validation
 *
 * @param value - Value to clamp
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Clamped value
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Extract solid color from fill color (removes transparency)
 * Used for price axis labels where transparency is not supported
 *
 * @param fillColor - Fill color string (rgba or hex)
 * @returns Solid color string in rgba format
 */
export function getSolidColorFromFill(fillColor: string): string {
  const parsed = parseCssColor(fillColor);
  if (!parsed) {
    return fillColor;
  }

  // Return solid version (alpha = 1)
  return `rgba(${parsed.r}, ${parsed.g}, ${parsed.b}, 1)`;
}

/**
 * Debounce function for performance optimization
 * Useful for throttling color picker updates
 *
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>): void => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
    }, wait);
  };
}
