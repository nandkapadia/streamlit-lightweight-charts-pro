/**
 * @fileoverview Comprehensive tests for color utilities
 *
 * Tests cover:
 * - Color parsing (hex, CSS color formats)
 * - Color conversion (hex ↔ rgba, CSS formats)
 * - Color interpolation and gradients
 * - Color validation and sanitization
 * - Color utility functions (contrast, palettes)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  parseHexColor,
  parseCssColor,
  hexToRgbaString,
  hexToRgba,
  rgbaToHex,
  cssToHex,
  toCss,
  interpolateColor,
  calculateGradientColor,
  isTransparent,
  isValidHexColor,
  sanitizeHexColor,
  getContrastColor,
  generateColorPalette,
  clamp,
  getSolidColorFromFill,
  debounce,
} from '../../utils/colorUtils';

describe('Color Parsing Functions', () => {
  describe('parseHexColor', () => {
    it('should parse 6-digit hex color with #', () => {
      const result = parseHexColor('#FF0000');
      expect(result).toEqual({ r: 255, g: 0, b: 0, a: 1 });
    });

    it('should parse 6-digit hex color without #', () => {
      const result = parseHexColor('00FF00');
      expect(result).toEqual({ r: 0, g: 255, b: 0, a: 1 });
    });

    it('should parse 3-digit hex color with #', () => {
      const result = parseHexColor('#F00');
      expect(result).toEqual({ r: 255, g: 0, b: 0, a: 1 });
    });

    it('should parse 3-digit hex color without #', () => {
      const result = parseHexColor('0F0');
      expect(result).toEqual({ r: 0, g: 255, b: 0, a: 1 });
    });

    it('should parse lowercase hex colors', () => {
      const result = parseHexColor('#ff00ff');
      expect(result).toEqual({ r: 255, g: 0, b: 255, a: 1 });
    });

    it('should return null for invalid hex format (wrong length)', () => {
      const result = parseHexColor('#FF00');
      expect(result).toBeNull();
    });

    it('should return null for invalid hex characters', () => {
      const result = parseHexColor('#GGGGGG');
      expect(result).toBeNull();
    });

    it('should return null for empty string', () => {
      const result = parseHexColor('');
      expect(result).toBeNull();
    });

    it('should parse common colors correctly', () => {
      expect(parseHexColor('#FFFFFF')).toEqual({ r: 255, g: 255, b: 255, a: 1 });
      expect(parseHexColor('#000000')).toEqual({ r: 0, g: 0, b: 0, a: 1 });
      expect(parseHexColor('#808080')).toEqual({ r: 128, g: 128, b: 128, a: 1 });
    });
  });

  describe('parseCssColor', () => {
    it('should parse hex color via parseHexColor', () => {
      const result = parseCssColor('#FF0000');
      expect(result).toEqual({ r: 255, g: 0, b: 0, a: 1 });
    });

    it('should parse rgb() format', () => {
      const result = parseCssColor('rgb(255, 128, 64)');
      expect(result).toEqual({ r: 255, g: 128, b: 64, a: 1 });
    });

    it('should parse rgba() format', () => {
      const result = parseCssColor('rgba(255, 128, 64, 0.5)');
      expect(result).toEqual({ r: 255, g: 128, b: 64, a: 0.5 });
    });

    it('should parse rgb() with spaces', () => {
      const result = parseCssColor('rgb( 100 , 150 , 200 )');
      expect(result).toEqual({ r: 100, g: 150, b: 200, a: 1 });
    });

    it('should parse rgba() with decimal alpha', () => {
      const result = parseCssColor('rgba(200, 100, 50, 0.75)');
      expect(result).toEqual({ r: 200, g: 100, b: 50, a: 0.75 });
    });

    it('should return null for invalid CSS color', () => {
      const result = parseCssColor('invalid-color');
      expect(result).toBeNull();
    });

    it('should return null for malformed rgb()', () => {
      const result = parseCssColor('rgb(255, 128)');
      expect(result).toBeNull();
    });
  });
});

describe('Color Conversion Functions', () => {
  describe('hexToRgbaString', () => {
    it('should convert hex to rgba string with default alpha', () => {
      const result = hexToRgbaString('#FF0000');
      expect(result).toBe('rgba(255, 0, 0, 1)');
    });

    it('should convert hex to rgba string with custom alpha', () => {
      const result = hexToRgbaString('#00FF00', 0.5);
      expect(result).toBe('rgba(0, 255, 0, 0.5)');
    });

    it('should convert 3-digit hex correctly', () => {
      const result = hexToRgbaString('#F0F', 0.75);
      expect(result).toBe('rgba(255, 0, 255, 0.75)');
    });

    it('should fallback to black for invalid hex', () => {
      const result = hexToRgbaString('invalid', 0.5);
      expect(result).toBe('rgba(0, 0, 0, 0.5)');
    });

    it('should handle alpha = 0', () => {
      const result = hexToRgbaString('#FFFFFF', 0);
      expect(result).toBe('rgba(255, 255, 255, 0)');
    });
  });

  describe('hexToRgba', () => {
    it('should return RGBA object for valid hex', () => {
      const result = hexToRgba('#FF8800');
      expect(result).toEqual({ r: 255, g: 136, b: 0, a: 1 });
    });

    it('should return null for invalid hex', () => {
      const result = hexToRgba('invalid');
      expect(result).toBeNull();
    });
  });

  describe('rgbaToHex', () => {
    it('should convert RGBA to hex', () => {
      const result = rgbaToHex(255, 0, 0);
      expect(result).toBe('#ff0000');
    });

    it('should handle values requiring padding', () => {
      const result = rgbaToHex(15, 15, 15);
      expect(result).toBe('#0f0f0f');
    });

    it('should clamp values below 0', () => {
      const result = rgbaToHex(-10, 128, 255);
      expect(result).toBe('#0080ff');
    });

    it('should clamp values above 255', () => {
      const result = rgbaToHex(300, 128, 64);
      expect(result).toBe('#ff8040');
    });

    it('should round decimal values', () => {
      const result = rgbaToHex(127.4, 127.5, 127.6);
      expect(result).toBe('#7f8080');
    });

    it('should handle zero values', () => {
      const result = rgbaToHex(0, 0, 0);
      expect(result).toBe('#000000');
    });

    it('should handle max values', () => {
      const result = rgbaToHex(255, 255, 255);
      expect(result).toBe('#ffffff');
    });
  });

  describe('cssToHex', () => {
    it('should convert rgba() to hex', () => {
      const result = cssToHex('rgba(255, 128, 64, 0.5)');
      expect(result).toBe('#ff8040');
    });

    it('should convert rgb() to hex', () => {
      const result = cssToHex('rgb(100, 150, 200)');
      expect(result).toBe('#6496c8');
    });

    it('should pass through hex colors unchanged', () => {
      const result = cssToHex('#FF0000');
      expect(result).toBe('#ff0000');
    });

    it('should return original for invalid colors', () => {
      const result = cssToHex('invalid-color');
      expect(result).toBe('invalid-color');
    });
  });

  describe('toCss', () => {
    it('should return original color for opacity 100', () => {
      const result = toCss('#FF0000', 100);
      expect(result).toBe('#ff0000');
    });

    it('should convert to rgba for opacity < 100', () => {
      const result = toCss('#FF0000', 50);
      expect(result).toBe('rgba(255, 0, 0, 0.5)');
    });

    it('should handle 0 opacity', () => {
      const result = toCss('#00FF00', 0);
      expect(result).toBe('rgba(0, 255, 0, 0)');
    });

    it('should default to 100 opacity', () => {
      const result = toCss('#0000FF');
      expect(result).toBe('#0000ff');
    });

    it('should clamp opacity above 100', () => {
      const result = toCss('#FF00FF', 150);
      expect(result).toBe('#ff00ff');
    });

    it('should handle invalid color gracefully', () => {
      const result = toCss('invalid', 50);
      expect(result).toBe('invalid');
    });

    it('should handle decimal opacity values', () => {
      const result = toCss('#FFFFFF', 25);
      expect(result).toBe('rgba(255, 255, 255, 0.25)');
    });
  });
});

describe('Color Interpolation Functions', () => {
  describe('interpolateColor', () => {
    it('should return start color at factor 0', () => {
      const result = interpolateColor('#FF0000', '#00FF00', 0);
      expect(result).toBe('#ff0000');
    });

    it('should return end color at factor 1', () => {
      const result = interpolateColor('#FF0000', '#00FF00', 1);
      expect(result).toBe('#00ff00');
    });

    it('should interpolate at factor 0.5', () => {
      const result = interpolateColor('#000000', '#FFFFFF', 0.5);
      expect(result).toBe('#808080');
    });

    it('should interpolate colors correctly', () => {
      const result = interpolateColor('#FF0000', '#0000FF', 0.5);
      expect(result).toBe('#800080'); // Purple
    });

    it('should clamp factor below 0', () => {
      const result = interpolateColor('#FF0000', '#00FF00', -0.5);
      expect(result).toBe('#ff0000');
    });

    it('should clamp factor above 1', () => {
      const result = interpolateColor('#FF0000', '#00FF00', 1.5);
      expect(result).toBe('#00ff00');
    });

    it('should handle invalid start color', () => {
      const result = interpolateColor('invalid', '#00FF00', 0.5);
      expect(result).toBe('invalid');
    });

    it('should handle invalid end color', () => {
      const result = interpolateColor('#FF0000', 'invalid', 0.5);
      expect(result).toBe('#FF0000');
    });

    it('should interpolate at factor 0.25', () => {
      const result = interpolateColor('#000000', '#FFFFFF', 0.25);
      expect(result).toBe('#404040');
    });

    it('should interpolate at factor 0.75', () => {
      const result = interpolateColor('#000000', '#FFFFFF', 0.75);
      expect(result).toBe('#bfbfbf');
    });
  });

  describe('calculateGradientColor', () => {
    const testValues = [
      { upper: 110, lower: 100 },
      { upper: 120, lower: 100 },
      { upper: 115, lower: 100 },
    ];

    it('should calculate gradient with normalize = true (spread-based)', () => {
      const result = calculateGradientColor(
        testValues[1], // spread = 20 (max)
        testValues,
        1,
        '#FF0000',
        '#00FF00',
        true
      );

      // Should return end color since spread = maxSpread
      expect(result).toBe('#00ff00');
    });

    it('should calculate gradient with normalize = false (position-based)', () => {
      const result = calculateGradientColor(
        testValues[1], // index = 1
        testValues,
        1,
        '#000000',
        '#FFFFFF',
        false
      );

      // Position: 1 / (3-1) = 0.5, should be middle gray
      expect(result).toBe('#808080');
    });

    it('should handle first element with normalize = false', () => {
      const result = calculateGradientColor(
        testValues[0],
        testValues,
        0,
        '#FF0000',
        '#00FF00',
        false
      );

      // Position: 0 / 2 = 0, should be start color
      expect(result).toBe('#ff0000');
    });

    it('should handle last element with normalize = false', () => {
      const result = calculateGradientColor(
        testValues[2],
        testValues,
        2,
        '#FF0000',
        '#00FF00',
        false
      );

      // Position: 2 / 2 = 1, should be end color
      expect(result).toBe('#00ff00');
    });

    it('should handle single element array', () => {
      const singleValue = [{ upper: 100, lower: 90 }];
      const result = calculateGradientColor(
        singleValue[0],
        singleValue,
        0,
        '#FF0000',
        '#00FF00',
        false
      );

      // Single element: factor = 0
      expect(result).toBe('#ff0000');
    });

    it('should handle zero spread with normalize = true', () => {
      const zeroSpread = [
        { upper: 100, lower: 100 },
        { upper: 100, lower: 100 },
      ];
      const result = calculateGradientColor(
        zeroSpread[0],
        zeroSpread,
        0,
        '#FF0000',
        '#00FF00',
        true
      );

      // Zero spread: factor = 0
      expect(result).toBe('#ff0000');
    });

    it('should clamp spread factor to 1 when > maxSpread', () => {
      const values = [
        { upper: 110, lower: 100 }, // spread = 10
        { upper: 150, lower: 100 }, // spread = 50 (should clamp to 1)
      ];

      const result = calculateGradientColor(values[1], values, 1, '#000000', '#FFFFFF', true);

      // Should return end color due to clamping
      expect(result).toBe('#ffffff');
    });
  });
});

describe('Color Validation Functions', () => {
  describe('isTransparent', () => {
    it('should return true for "transparent" keyword', () => {
      expect(isTransparent('transparent')).toBe(true);
    });

    it('should return true for empty string', () => {
      expect(isTransparent('')).toBe(true);
    });

    it('should return true for rgba with alpha 0', () => {
      expect(isTransparent('rgba(255, 0, 0, 0)')).toBe(true);
    });

    it('should return false for rgba with alpha > 0', () => {
      expect(isTransparent('rgba(255, 0, 0, 0.5)')).toBe(false);
    });

    it('should return true for 8-digit hex with alpha 00', () => {
      expect(isTransparent('#FF000000')).toBe(true);
    });

    it('should return false for 8-digit hex with alpha > 00', () => {
      expect(isTransparent('#FF0000FF')).toBe(false);
    });

    it('should return true for 4-digit hex with alpha 0', () => {
      expect(isTransparent('#F000')).toBe(true);
    });

    it('should return false for 4-digit hex with alpha > 0', () => {
      expect(isTransparent('#F00F')).toBe(false);
    });

    it('should return false for solid hex colors', () => {
      expect(isTransparent('#FF0000')).toBe(false);
    });

    it('should return false for solid rgb colors', () => {
      expect(isTransparent('rgb(255, 0, 0)')).toBe(false);
    });
  });

  describe('isValidHexColor', () => {
    it('should return true for valid 6-digit hex', () => {
      expect(isValidHexColor('#FF0000')).toBe(true);
    });

    it('should return true for valid 3-digit hex', () => {
      expect(isValidHexColor('#F00')).toBe(true);
    });

    it('should return true for lowercase hex', () => {
      expect(isValidHexColor('#ff0000')).toBe(true);
    });

    it('should return false for hex without #', () => {
      expect(isValidHexColor('FF0000')).toBe(false);
    });

    it('should return false for invalid length', () => {
      expect(isValidHexColor('#FF00')).toBe(false);
    });

    it('should return false for invalid characters', () => {
      expect(isValidHexColor('#GGGGGG')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isValidHexColor('')).toBe(false);
    });

    it('should return false for rgba colors', () => {
      expect(isValidHexColor('rgba(255, 0, 0, 1)')).toBe(false);
    });
  });

  describe('sanitizeHexColor', () => {
    it('should add # prefix if missing', () => {
      const result = sanitizeHexColor('FF0000');
      expect(result).toBe('#FF0000');
    });

    it('should convert to uppercase', () => {
      const result = sanitizeHexColor('#ff0000');
      expect(result).toBe('#FF0000');
    });

    it('should return valid color unchanged (except uppercase)', () => {
      const result = sanitizeHexColor('#abc');
      expect(result).toBe('#ABC');
    });

    it('should return default for invalid hex', () => {
      const result = sanitizeHexColor('invalid');
      expect(result).toBe('#2196F3');
    });

    it('should return default for wrong length', () => {
      const result = sanitizeHexColor('#FF00');
      expect(result).toBe('#2196F3');
    });

    it('should handle empty string', () => {
      const result = sanitizeHexColor('');
      expect(result).toBe('#2196F3');
    });

    it('should handle 3-digit hex correctly', () => {
      const result = sanitizeHexColor('f0f');
      expect(result).toBe('#F0F');
    });
  });
});

describe('Color Utility Functions', () => {
  describe('getContrastColor', () => {
    it('should return dark text for light backgrounds', () => {
      const result = getContrastColor('#FFFFFF');
      expect(result).toBe('#333333');
    });

    it('should return light text for dark backgrounds', () => {
      const result = getContrastColor('#000000');
      expect(result).toBe('#ffffff');
    });

    it('should return correct contrast for mid-tone colors', () => {
      // Light gray should get dark text
      const result1 = getContrastColor('#CCCCCC');
      expect(result1).toBe('#333333');

      // Dark gray should get light text
      const result2 = getContrastColor('#333333');
      expect(result2).toBe('#ffffff');
    });

    it('should handle blue correctly', () => {
      // Pure blue is dark (luminance ~0.114)
      const result = getContrastColor('#0000FF');
      expect(result).toBe('#ffffff');
    });

    it('should handle red correctly', () => {
      // Pure red is mid-dark (luminance ~0.299)
      const result = getContrastColor('#FF0000');
      expect(result).toBe('#ffffff');
    });

    it('should handle yellow correctly', () => {
      // Yellow is light (luminance ~0.886)
      const result = getContrastColor('#FFFF00');
      expect(result).toBe('#333333');
    });

    it('should fallback to dark text for invalid color', () => {
      const result = getContrastColor('invalid');
      expect(result).toBe('#333333');
    });
  });

  describe('generateColorPalette', () => {
    it('should generate default 5 colors', () => {
      const result = generateColorPalette('#FF0000');
      expect(result).toHaveLength(5);
    });

    it('should generate requested number of colors', () => {
      const result = generateColorPalette('#00FF00', 3);
      expect(result).toHaveLength(3);
    });

    it('should generate darker shades', () => {
      const result = generateColorPalette('#FF0000', 5);

      // First color should be darkest (factor 0.2)
      expect(result[0]).toBe('#330000');

      // Last color should be lightest (factor 0.8)
      expect(result[4]).toBe('#cc0000');
    });

    it('should handle single color request', () => {
      const result = generateColorPalette('#0000FF', 1);
      expect(result).toHaveLength(1);
      // Factor = 0.2 + (0 / 0) * 0.6 = 0.2 (NaN handled as 0)
    });

    it('should return original for invalid color', () => {
      const result = generateColorPalette('invalid', 3);
      expect(result).toEqual(['invalid']);
    });

    it('should generate evenly distributed shades', () => {
      const result = generateColorPalette('#FFFFFF', 3);

      // Factor progression: 0.2, 0.5, 0.8
      expect(result[0]).toBe('#333333'); // 20% of white
      expect(result[1]).toBe('#808080'); // 50% of white
      expect(result[2]).toBe('#cccccc'); // 80% of white
    });
  });

  describe('clamp', () => {
    it('should clamp value below min', () => {
      expect(clamp(-10, 0, 100)).toBe(0);
    });

    it('should clamp value above max', () => {
      expect(clamp(150, 0, 100)).toBe(100);
    });

    it('should return value if within range', () => {
      expect(clamp(50, 0, 100)).toBe(50);
    });

    it('should handle min = max', () => {
      expect(clamp(50, 100, 100)).toBe(100);
    });

    it('should handle negative ranges', () => {
      expect(clamp(-50, -100, 0)).toBe(-50);
    });

    it('should handle decimal values', () => {
      expect(clamp(0.75, 0, 1)).toBe(0.75);
    });

    it('should clamp decimal below min', () => {
      expect(clamp(-0.5, 0, 1)).toBe(0);
    });

    it('should clamp decimal above max', () => {
      expect(clamp(1.5, 0, 1)).toBe(1);
    });
  });

  describe('getSolidColorFromFill', () => {
    it('should convert rgba to solid color', () => {
      const result = getSolidColorFromFill('rgba(255, 128, 64, 0.5)');
      expect(result).toBe('rgba(255, 128, 64, 1)');
    });

    it('should convert hex to solid rgba', () => {
      const result = getSolidColorFromFill('#FF0000');
      expect(result).toBe('rgba(255, 0, 0, 1)');
    });

    it('should handle rgb without alpha', () => {
      const result = getSolidColorFromFill('rgb(100, 150, 200)');
      expect(result).toBe('rgba(100, 150, 200, 1)');
    });

    it('should preserve rgb values, only set alpha to 1', () => {
      const result = getSolidColorFromFill('rgba(50, 100, 150, 0.25)');
      expect(result).toBe('rgba(50, 100, 150, 1)');
    });

    it('should return original for invalid color', () => {
      const result = getSolidColorFromFill('invalid');
      expect(result).toBe('invalid');
    });

    it('should handle fully transparent color', () => {
      const result = getSolidColorFromFill('rgba(255, 255, 255, 0)');
      expect(result).toBe('rgba(255, 255, 255, 1)');
    });
  });

  describe('debounce', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should delay function execution', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn();
      expect(mockFn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(50);
      expect(mockFn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(50);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should cancel previous timeout on new call', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn();
      vi.advanceTimersByTime(50);

      debouncedFn();
      vi.advanceTimersByTime(50);
      expect(mockFn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(50);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should pass arguments to debounced function', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn('arg1', 'arg2');
      vi.advanceTimersByTime(100);

      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
    });

    it('should handle multiple rapid calls', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn();
      debouncedFn();
      debouncedFn();
      debouncedFn();

      vi.advanceTimersByTime(100);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should allow multiple executions after wait time', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn();
      vi.advanceTimersByTime(100);
      expect(mockFn).toHaveBeenCalledTimes(1);

      debouncedFn();
      vi.advanceTimersByTime(100);
      expect(mockFn).toHaveBeenCalledTimes(2);
    });
  });
});

describe('Edge Cases and Integration', () => {
  it('should handle full color workflow: parse → interpolate → convert', () => {
    const color1 = parseHexColor('#FF0000');
    const color2 = parseHexColor('#0000FF');

    expect(color1).toBeTruthy();
    expect(color2).toBeTruthy();

    const interpolated = interpolateColor('#FF0000', '#0000FF', 0.5);
    expect(interpolated).toBe('#800080');

    const rgba = hexToRgbaString(interpolated, 0.5);
    expect(rgba).toBe('rgba(128, 0, 128, 0.5)');
  });

  it('should handle color validation and sanitization workflow', () => {
    const invalidInput = 'ff0000'; // Missing #
    expect(isValidHexColor(invalidInput)).toBe(false);

    const sanitized = sanitizeHexColor(invalidInput);
    expect(isValidHexColor(sanitized)).toBe(true);
    expect(sanitized).toBe('#FF0000');
  });

  it('should handle CSS color conversion workflow', () => {
    const cssColor = 'rgba(255, 128, 64, 0.75)';
    const parsed = parseCssColor(cssColor);
    expect(parsed).toBeTruthy();

    if (parsed) {
      const hex = rgbaToHex(parsed.r, parsed.g, parsed.b);
      expect(hex).toBe('#ff8040');

      const solid = getSolidColorFromFill(cssColor);
      expect(solid).toBe('rgba(255, 128, 64, 1)');
    }
  });

  it('should handle gradient generation workflow', () => {
    const values = [
      { upper: 105, lower: 100 },
      { upper: 110, lower: 100 },
      { upper: 115, lower: 100 },
    ];

    const colors = values.map((value, index) =>
      calculateGradientColor(value, values, index, '#00FF00', '#FF0000', true)
    );

    expect(colors).toHaveLength(3);
    expect(colors[0]).toBeDefined();
    expect(colors[1]).toBeDefined();
    expect(colors[2]).toBeDefined();
  });

  it('should handle palette generation with contrast check', () => {
    const baseColor = '#2196F3';
    const palette = generateColorPalette(baseColor, 5);

    expect(palette).toHaveLength(5);

    // Check contrast for each color in palette
    palette.forEach(color => {
      const contrast = getContrastColor(color);
      expect(['#333333', '#ffffff']).toContain(contrast);
    });
  });

  it('should handle transparency detection across formats', () => {
    expect(isTransparent('transparent')).toBe(true);
    expect(isTransparent('rgba(0, 0, 0, 0)')).toBe(true);
    expect(isTransparent('#00000000')).toBe(true);
    expect(isTransparent('#0000')).toBe(true);

    expect(isTransparent('#000000')).toBe(false);
    expect(isTransparent('rgba(0, 0, 0, 1)')).toBe(false);
    expect(isTransparent('#000000FF')).toBe(false);
  });
});
