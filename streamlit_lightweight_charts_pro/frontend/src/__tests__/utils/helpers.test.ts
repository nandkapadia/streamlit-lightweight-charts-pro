/**
 * @fileoverview Color Helper Utilities Test Suite
 *
 * Tests for color conversion and manipulation utilities.
 *
 * @vitest-environment jsdom
 */

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  hexToRgba,
  rgbaToHex,
  toCss,
  isValidHexColor,
  sanitizeHexColor,
  clamp,
  debounce,
  getContrastColor,
  generateColorPalette,
  parseCssColor,
  cssToHex,
} from '../../utils/colorUtils';

describe('helpers', () => {
  describe('hexToRgba', () => {
    it('should convert 6-digit hex to rgba', () => {
      const result = hexToRgba('#2196F3');
      expect(result).toEqual({ r: 33, g: 150, b: 243, a: 1 });
    });

    it('should convert 3-digit hex to rgba', () => {
      const result = hexToRgba('#F0F');
      expect(result).toEqual({ r: 255, g: 0, b: 255, a: 1 });
    });

    it('should handle hex without #', () => {
      const result = hexToRgba('2196F3');
      expect(result).toEqual({ r: 33, g: 150, b: 243, a: 1 });
    });

    it('should return null for invalid hex', () => {
      expect(hexToRgba('invalid')).toBeNull();
      expect(hexToRgba('')).toBeNull();
      expect(hexToRgba('#')).toBeNull();
    });
  });

  describe('rgbaToHex', () => {
    it('should convert rgba values to hex', () => {
      expect(rgbaToHex(33, 150, 243)).toBe('#2196f3');
    });

    it('should handle edge values', () => {
      expect(rgbaToHex(0, 0, 0)).toBe('#000000');
      expect(rgbaToHex(255, 255, 255)).toBe('#ffffff');
    });

    it('should clamp values outside 0-255 range', () => {
      expect(rgbaToHex(-10, 300, 150)).toBe('#00ff96');
    });
  });

  describe('toCss', () => {
    it('should return original color when opacity is 100%', () => {
      expect(toCss('#2196F3', 100)).toBe('#2196f3');
    });

    it('should convert to rgba when opacity < 100%', () => {
      expect(toCss('#2196F3', 50)).toBe('rgba(33, 150, 243, 0.5)');
    });

    it('should handle opacity 0', () => {
      expect(toCss('#2196F3', 0)).toBe('rgba(33, 150, 243, 0)');
    });

    it('should fallback to original color on invalid hex', () => {
      expect(toCss('invalid-color', 50)).toBe('invalid-color');
    });

    it('should default to 100% opacity when not provided', () => {
      expect(toCss('#FF0000')).toBe('#ff0000');
    });
  });

  describe('isValidHexColor', () => {
    it('should validate 6-digit hex colors', () => {
      expect(isValidHexColor('#2196F3')).toBe(true);
      expect(isValidHexColor('#000000')).toBe(true);
      expect(isValidHexColor('#FFFFFF')).toBe(true);
    });

    it('should validate 3-digit hex colors', () => {
      expect(isValidHexColor('#F0F')).toBe(true);
      expect(isValidHexColor('#123')).toBe(true);
    });

    it('should reject invalid hex colors', () => {
      expect(isValidHexColor('2196F3')).toBe(false); // Missing #
      expect(isValidHexColor('#2196F')).toBe(false); // Invalid length
      expect(isValidHexColor('#GGGGGG')).toBe(false); // Invalid characters
      expect(isValidHexColor('')).toBe(false);
    });
  });

  describe('sanitizeHexColor', () => {
    it('should add # if missing', () => {
      expect(sanitizeHexColor('2196F3')).toBe('#2196F3');
    });

    it('should convert to uppercase', () => {
      expect(sanitizeHexColor('#2196f3')).toBe('#2196F3');
    });

    it('should return default for invalid colors', () => {
      expect(sanitizeHexColor('invalid')).toBe('#2196F3');
      expect(sanitizeHexColor('')).toBe('#2196F3');
    });

    it('should preserve valid colors', () => {
      expect(sanitizeHexColor('#FF0000')).toBe('#FF0000');
    });
  });

  describe('clamp', () => {
    it('should clamp values within range', () => {
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(-5, 0, 10)).toBe(0);
      expect(clamp(15, 0, 10)).toBe(10);
    });

    it('should handle edge values', () => {
      expect(clamp(0, 0, 10)).toBe(0);
      expect(clamp(10, 0, 10)).toBe(10);
    });
  });

  describe('debounce', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.runOnlyPendingTimers();
      vi.useRealTimers();
    });

    it('should debounce function calls', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn('arg1');
      debouncedFn('arg2');
      debouncedFn('arg3');

      expect(mockFn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('arg3');
    });

    it('should reset timer on subsequent calls', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn('arg1');
      vi.advanceTimersByTime(50);

      debouncedFn('arg2');
      vi.advanceTimersByTime(50);

      expect(mockFn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(50);

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('arg2');
    });
  });

  describe('getContrastColor', () => {
    it('should return dark text for light backgrounds', () => {
      expect(getContrastColor('#FFFFFF')).toBe('#333333');
      expect(getContrastColor('#FFFF00')).toBe('#333333'); // Yellow
    });

    it('should return light text for dark backgrounds', () => {
      expect(getContrastColor('#000000')).toBe('#ffffff');
      expect(getContrastColor('#000080')).toBe('#ffffff'); // Dark blue
    });

    it('should return default for invalid colors', () => {
      expect(getContrastColor('invalid')).toBe('#333333');
    });
  });

  describe('generateColorPalette', () => {
    it('should generate color palette with default count', () => {
      const palette = generateColorPalette('#2196F3');
      expect(palette).toHaveLength(5);
      expect(palette[0]).toMatch(/^#[0-9A-F]{6}$/i);
    });

    it('should generate color palette with custom count', () => {
      const palette = generateColorPalette('#FF0000', 3);
      expect(palette).toHaveLength(3);
    });

    it('should return original color for invalid input', () => {
      const palette = generateColorPalette('invalid');
      expect(palette).toEqual(['invalid']);
    });
  });

  describe('parseCssColor', () => {
    it('should parse hex colors', () => {
      const result = parseCssColor('#2196F3');
      expect(result).toEqual({ r: 33, g: 150, b: 243, a: 1 });
    });

    it('should parse rgb colors', () => {
      const result = parseCssColor('rgb(33, 150, 243)');
      expect(result).toEqual({ r: 33, g: 150, b: 243, a: 1 });
    });

    it('should parse rgba colors', () => {
      const result = parseCssColor('rgba(33, 150, 243, 0.5)');
      expect(result).toEqual({ r: 33, g: 150, b: 243, a: 0.5 });
    });

    it('should return null for invalid colors', () => {
      expect(parseCssColor('invalid')).toBeNull();
      expect(parseCssColor('')).toBeNull();
    });
  });

  describe('cssToHex', () => {
    it('should convert valid CSS colors to hex', () => {
      expect(cssToHex('#2196F3')).toBe('#2196f3');
      expect(cssToHex('rgb(33, 150, 243)')).toBe('#2196f3');
      expect(cssToHex('rgba(33, 150, 243, 0.5)')).toBe('#2196f3');
    });

    it('should return original for invalid colors', () => {
      expect(cssToHex('invalid')).toBe('invalid');
    });
  });
});
