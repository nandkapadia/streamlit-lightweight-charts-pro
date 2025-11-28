/**
 * @fileoverview Unified color utilities for series rendering
 *
 * This module provides color manipulation functions:
 * - Color format conversions (hex <-> rgba)
 * - Color interpolation for gradients
 * - Color validation
 * - Transparency detection
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
 * Supports 3, 4, 6, and 8 digit hex formats with alpha
 *
 * @param hex - Hex color string
 * @returns RGBA color object or null if invalid
 */
export function parseHexColor(hex: string): RgbaColor | null {
  const cleanHex = hex.replace('#', '');

  let r: number, g: number, b: number, a: number;

  if (cleanHex.length === 3) {
    r = parseInt(cleanHex[0] + cleanHex[0], 16);
    g = parseInt(cleanHex[1] + cleanHex[1], 16);
    b = parseInt(cleanHex[2] + cleanHex[2], 16);
    a = 1;
  } else if (cleanHex.length === 4) {
    r = parseInt(cleanHex[0] + cleanHex[0], 16);
    g = parseInt(cleanHex[1] + cleanHex[1], 16);
    b = parseInt(cleanHex[2] + cleanHex[2], 16);
    a = parseInt(cleanHex[3] + cleanHex[3], 16) / 255;
  } else if (cleanHex.length === 6) {
    r = parseInt(cleanHex.substring(0, 2), 16);
    g = parseInt(cleanHex.substring(2, 4), 16);
    b = parseInt(cleanHex.substring(4, 6), 16);
    a = 1;
  } else if (cleanHex.length === 8) {
    r = parseInt(cleanHex.substring(0, 2), 16);
    g = parseInt(cleanHex.substring(2, 4), 16);
    b = parseInt(cleanHex.substring(4, 6), 16);
    a = parseInt(cleanHex.substring(6, 8), 16) / 255;
  } else {
    return null;
  }

  if (isNaN(r) || isNaN(g) || isNaN(b) || isNaN(a)) {
    return null;
  }

  return { r, g, b, a };
}

/**
 * Parse CSS color value and extract RGBA components
 * Supports hex, rgb(), and rgba() formats
 *
 * @param cssColor - CSS color string
 * @returns RGBA color object or null if invalid
 */
export function parseCssColor(cssColor: string): RgbaColor | null {
  if (cssColor.startsWith('#')) {
    return parseHexColor(cssColor);
  }

  const rgbaMatch = cssColor.match(/rgba?\(([^)]+)\)/);
  if (rgbaMatch) {
    const values = rgbaMatch[1].split(',').map(v => parseFloat(v.trim()));
    if (values.length >= 3) {
      return {
        r: values[0],
        g: values[1],
        b: values[2],
        a: values[3] !== undefined ? values[3] : 1,
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
 *
 * @param hex - Hex color string
 * @param alpha - Alpha value between 0 and 1
 * @returns RGBA color string
 */
export function hexToRgbaString(hex: string, alpha: number = 1): string {
  const parsed = parseHexColor(hex);
  if (!parsed) {
    return `rgba(0, 0, 0, ${alpha})`;
  }

  return `rgba(${parsed.r}, ${parsed.g}, ${parsed.b}, ${alpha})`;
}

/**
 * Convert hex color to RGBA components object
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
 * @returns Hex color string
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
 * @param cssColor - CSS color string
 * @returns Hex color string
 */
export function cssToHex(cssColor: string): string {
  const parsed = parseCssColor(cssColor);
  if (parsed) {
    return rgbaToHex(parsed.r, parsed.g, parsed.b);
  }
  return cssColor;
}

// ============================================================================
// Color Interpolation Functions
// ============================================================================

/**
 * Interpolate between two hex colors
 *
 * @param startColor - Starting color in hex format
 * @param endColor - Ending color in hex format
 * @param factor - Interpolation factor between 0 and 1
 * @returns Interpolated color in hex format
 */
export function interpolateColor(startColor: string, endColor: string, factor: number): string {
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
    const spread = Math.abs(value.upper - value.lower);
    const maxSpread = Math.max(...allValues.map(d => Math.abs(d.upper - d.lower)));
    const factor = maxSpread > 0 ? Math.min(spread / maxSpread, 1) : 0;

    return interpolateColor(startColor, endColor, factor);
  } else {
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

  if (color === 'transparent') return true;

  if (color.startsWith('rgba(')) {
    const match = color.match(/rgba\([^)]+,\s*([^)]+)\)/);
    if (match && parseFloat(match[1]) === 0) return true;
  }

  if (color.startsWith('#') && color.length === 9) {
    const alpha = color.substring(7, 9);
    if (alpha === '00') return true;
  }

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
 *
 * @param input - Color input string
 * @returns Sanitized hex color or default color if invalid
 */
export function sanitizeHexColor(input: string): string {
  let color = input.startsWith('#') ? input : `#${input}`;
  color = color.toUpperCase();
  return isValidHexColor(color) ? color : '#2196F3';
}

// ============================================================================
// Color Utility Functions
// ============================================================================

/**
 * Get contrasting text color for a background color
 *
 * @param backgroundColor - Background color in hex format
 * @returns Contrasting text color (light or dark)
 */
export function getContrastColor(backgroundColor: string): string {
  const rgba = parseHexColor(backgroundColor);
  if (!rgba) {
    return '#333333';
  }

  const { r, g, b } = rgba;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.5 ? '#333333' : '#ffffff';
}

/**
 * Extract solid color from fill color (removes transparency)
 *
 * @param fillColor - Fill color string (rgba or hex)
 * @returns Solid color string in rgba format
 */
export function getSolidColorFromFill(fillColor: string): string {
  const parsed = parseCssColor(fillColor);
  if (!parsed) {
    return fillColor;
  }

  return `rgba(${parsed.r}, ${parsed.g}, ${parsed.b}, 1)`;
}

/**
 * Clamp number between min and max values
 *
 * @param value - Value to clamp
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Clamped value
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
