/**
 * @fileoverview Tests for alpha/opacity bug fixes and 8-digit hex support
 *
 * BUG 1: When alpha is 0, the expression `values[3] || 1` treats 0 as falsy,
 * returning 1 instead. This caused rgba(255, 0, 0, 0) to be interpreted
 * as 100% opacity instead of 0% opacity.
 *
 * FIX 1: Changed to `values[3] !== undefined ? values[3] : 1` to correctly
 * handle all alpha values including 0.
 *
 * BUG 2: parseHexColor() didn't support 8-digit hex (#RRGGBBAA) or 4-digit
 * hex (#RGBA) formats, causing colors like #00FF0033 to fail parsing.
 *
 * FIX 2: Added support for 4-digit and 8-digit hex formats with alpha channel.
 */

import { describe, it, expect } from 'vitest';
import {
  parseCssColor,
  extractColorAndOpacity,
  toCss,
  parseHexColor,
} from '../../utils/colorUtils';

describe('Alpha=0 Bug Fix', () => {
  describe('parseCssColor', () => {
    it('should correctly parse alpha=0 (fully transparent)', () => {
      const result = parseCssColor('rgba(255, 0, 0, 0)');
      expect(result).not.toBeNull();
      expect(result?.r).toBe(255);
      expect(result?.g).toBe(0);
      expect(result?.b).toBe(0);
      expect(result?.a).toBe(0); // BUG WAS HERE: returned 1 instead of 0
    });

    it('should correctly parse alpha=0.0 (explicit decimal)', () => {
      const result = parseCssColor('rgba(255, 0, 0, 0.0)');
      expect(result).not.toBeNull();
      expect(result?.a).toBe(0);
    });

    it('should correctly parse other alpha values (regression test)', () => {
      expect(parseCssColor('rgba(255, 0, 0, 0.25)')?.a).toBe(0.25);
      expect(parseCssColor('rgba(255, 0, 0, 0.5)')?.a).toBe(0.5);
      expect(parseCssColor('rgba(255, 0, 0, 0.75)')?.a).toBe(0.75);
      expect(parseCssColor('rgba(255, 0, 0, 1)')?.a).toBe(1);
    });

    it('should default to alpha=1 for rgb() without alpha', () => {
      const result = parseCssColor('rgb(255, 0, 0)');
      expect(result).not.toBeNull();
      expect(result?.a).toBe(1);
    });
  });

  describe('extractColorAndOpacity', () => {
    it('should extract 0% opacity from rgba(255, 0, 0, 0)', () => {
      const result = extractColorAndOpacity('rgba(255, 0, 0, 0)');
      expect(result.color).toBe('#ff0000');
      expect(result.opacity).toBe(0); // BUG WAS HERE: returned 100 instead of 0
    });

    it('should extract correct opacity for various alpha values', () => {
      expect(extractColorAndOpacity('rgba(255, 0, 0, 0)').opacity).toBe(0);
      expect(extractColorAndOpacity('rgba(255, 0, 0, 0.25)').opacity).toBe(25);
      expect(extractColorAndOpacity('rgba(255, 0, 0, 0.5)').opacity).toBe(50);
      expect(extractColorAndOpacity('rgba(255, 0, 0, 0.75)').opacity).toBe(75);
      expect(extractColorAndOpacity('rgba(255, 0, 0, 1)').opacity).toBe(100);
    });

    it('should extract 100% opacity for hex colors', () => {
      const result = extractColorAndOpacity('#FF0000');
      expect(result.color).toBe('#ff0000');
      expect(result.opacity).toBe(100);
    });
  });

  describe('Color Roundtrip', () => {
    it('should roundtrip rgba(255, 0, 0, 0) correctly', () => {
      const input = 'rgba(255, 0, 0, 0)';

      // Extract
      const { color, opacity } = extractColorAndOpacity(input);
      expect(color).toBe('#ff0000');
      expect(opacity).toBe(0);

      // Reconstruct
      const output = toCss(color, opacity);
      expect(output).toBe('rgba(255, 0, 0, 0)');
    });

    it('should roundtrip various rgba values correctly', () => {
      const testCases = [
        { input: 'rgba(255, 0, 0, 0)', expected: 'rgba(255, 0, 0, 0)' },
        { input: 'rgba(255, 0, 0, 0.25)', expected: 'rgba(255, 0, 0, 0.25)' },
        { input: 'rgba(255, 0, 0, 0.5)', expected: 'rgba(255, 0, 0, 0.5)' },
        { input: 'rgba(255, 0, 0, 0.75)', expected: 'rgba(255, 0, 0, 0.75)' },
        // Note: When opacity is 100%, toCss returns hex format by design
        { input: 'rgba(255, 0, 0, 1)', expected: '#ff0000' },
      ];

      for (const { input, expected } of testCases) {
        const { color, opacity } = extractColorAndOpacity(input);
        const output = toCss(color, opacity);
        expect(output).toBe(expected);
      }
    });

    it('should convert hex to rgba with 0% opacity', () => {
      const input = '#FF0000';
      const { color, opacity: _ } = extractColorAndOpacity(input);
      const output = toCss(color, 0); // Set opacity to 0%
      expect(output).toBe('rgba(255, 0, 0, 0)');
    });
  });

  describe('Series Dialog Workflow', () => {
    /**
     * Simulates the Series Settings Dialog workflow:
     * 1. User has color set to rgba(255, 0, 0, 0) in Python
     * 2. Dialog opens and extracts color/opacity for UI
     * 3. User doesn't change anything
     * 4. Dialog saves back
     */
    it('should preserve alpha=0 through dialog open/save cycle', () => {
      // Initial color from Python
      const pythonColor = 'rgba(255, 0, 0, 0)';

      // Dialog opens: extract for UI
      const { color, opacity } = extractColorAndOpacity(pythonColor);
      expect(color).toBe('#ff0000');
      expect(opacity).toBe(0); // Must show 0% in UI!

      // User doesn't change anything, dialog saves
      const savedColor = toCss(color, opacity);
      expect(savedColor).toBe(pythonColor); // Must preserve original value!
    });

    it('should allow user to change from alpha=0 to alpha=0.5', () => {
      // Initial color
      const initialColor = 'rgba(255, 0, 0, 0)';

      // Dialog opens
      const { color, opacity: initialOpacity } = extractColorAndOpacity(initialColor);
      expect(initialOpacity).toBe(0);

      // User changes opacity to 50%
      const newOpacity = 50;
      const savedColor = toCss(color, newOpacity);
      expect(savedColor).toBe('rgba(255, 0, 0, 0.5)');
    });

    it('should allow user to change from alpha=0.5 to alpha=0', () => {
      // Initial color
      const initialColor = 'rgba(255, 0, 0, 0.5)';

      // Dialog opens
      const { color, opacity: initialOpacity } = extractColorAndOpacity(initialColor);
      expect(initialOpacity).toBe(50);

      // User changes opacity to 0%
      const newOpacity = 0;
      const savedColor = toCss(color, newOpacity);
      expect(savedColor).toBe('rgba(255, 0, 0, 0)');
    });
  });

  describe('Edge Cases', () => {
    it('should handle rgba with spaces around alpha=0', () => {
      const result = parseCssColor('rgba(255, 0, 0,  0  )');
      expect(result?.a).toBe(0);
    });

    it('should handle rgba with no spaces and alpha=0', () => {
      const result = parseCssColor('rgba(255,0,0,0)');
      expect(result?.a).toBe(0);
    });

    it('should handle multiple colors with alpha=0', () => {
      const colors = [
        'rgba(255, 0, 0, 0)', // Red
        'rgba(0, 255, 0, 0)', // Green
        'rgba(0, 0, 255, 0)', // Blue
        'rgba(0, 0, 0, 0)', // Black
        'rgba(255, 255, 255, 0)', // White
      ];

      for (const color of colors) {
        const { opacity } = extractColorAndOpacity(color);
        expect(opacity).toBe(0);
      }
    });
  });

  describe('8-Digit Hex Support (#RRGGBBAA)', () => {
    it('should parse 8-digit hex with full opacity (#RRGGBBFF)', () => {
      const result = parseHexColor('#FF0000FF');
      expect(result).not.toBeNull();
      expect(result?.r).toBe(255);
      expect(result?.g).toBe(0);
      expect(result?.b).toBe(0);
      expect(result?.a).toBeCloseTo(1, 2);
    });

    it('should parse 8-digit hex with 50% opacity (#RRGGBB80)', () => {
      const result = parseHexColor('#FF000080');
      expect(result).not.toBeNull();
      expect(result?.r).toBe(255);
      expect(result?.g).toBe(0);
      expect(result?.b).toBe(0);
      expect(result?.a).toBeCloseTo(0.5, 2);
    });

    it('should parse 8-digit hex with 0% opacity (#RRGGBB00)', () => {
      const result = parseHexColor('#FF000000');
      expect(result).not.toBeNull();
      expect(result?.r).toBe(255);
      expect(result?.g).toBe(0);
      expect(result?.b).toBe(0);
      expect(result?.a).toBe(0);
    });

    it('should parse user color #00FF0033 correctly', () => {
      // User's reported color: green with ~20% opacity
      const result = parseHexColor('#00FF0033');
      expect(result).not.toBeNull();
      expect(result?.r).toBe(0);
      expect(result?.g).toBe(255);
      expect(result?.b).toBe(0);
      expect(result?.a).toBeCloseTo(0.2, 2);
    });

    it('should extract color and opacity from 8-digit hex', () => {
      const testCases = [
        { hex: '#FF0000FF', expectedOpacity: 100 },
        { hex: '#FF000080', expectedOpacity: 50 },
        { hex: '#00FF0033', expectedOpacity: 20 },
        { hex: '#FF000000', expectedOpacity: 0 },
      ];

      for (const { hex, expectedOpacity } of testCases) {
        const { opacity } = extractColorAndOpacity(hex);
        expect(opacity).toBe(expectedOpacity);
      }
    });
  });

  describe('4-Digit Hex Support (#RGBA)', () => {
    it('should parse 4-digit hex with full opacity (#RGBF)', () => {
      const result = parseHexColor('#F00F');
      expect(result).not.toBeNull();
      expect(result?.r).toBe(255);
      expect(result?.g).toBe(0);
      expect(result?.b).toBe(0);
      expect(result?.a).toBeCloseTo(1, 2);
    });

    it('should parse 4-digit hex with ~50% opacity (#RGB8)', () => {
      const result = parseHexColor('#F008');
      expect(result).not.toBeNull();
      expect(result?.r).toBe(255);
      expect(result?.g).toBe(0);
      expect(result?.b).toBe(0);
      expect(result?.a).toBeCloseTo(0.53, 2); // 0x88 / 255 ≈ 0.53
    });

    it('should parse 4-digit hex with 0% opacity (#RGB0)', () => {
      const result = parseHexColor('#F000');
      expect(result).not.toBeNull();
      expect(result?.r).toBe(255);
      expect(result?.g).toBe(0);
      expect(result?.b).toBe(0);
      expect(result?.a).toBe(0);
    });

    it('should extract color and opacity from 4-digit hex', () => {
      const testCases = [
        { hex: '#F00F', expectedOpacity: 100 },
        { hex: '#0F08', expectedOpacity: 53 }, // 0x88 / 255 = 0.53
        { hex: '#F000', expectedOpacity: 0 },
      ];

      for (const { hex, expectedOpacity } of testCases) {
        const { opacity } = extractColorAndOpacity(hex);
        expect(opacity).toBe(expectedOpacity);
      }
    });
  });

  describe('Series Dialog with 8-Digit Hex', () => {
    it('should display #00FF0033 correctly in dialog', () => {
      // User sets color with 8-digit hex in Python
      const pythonColor = '#00FF0033';

      // Dialog opens and extracts
      const { color, opacity } = extractColorAndOpacity(pythonColor);

      // Verify color swatch shows green
      expect(color).toBe('#00ff00');

      // Verify opacity slider shows 20%
      expect(opacity).toBe(20);
    });

    it('should roundtrip 8-digit hex through dialog', () => {
      const input = '#FF000080'; // Red at 50%

      // Dialog opens
      const { color, opacity } = extractColorAndOpacity(input);
      expect(color).toBe('#ff0000');
      expect(opacity).toBe(50);

      // User doesn't change anything, saves
      const output = toCss(color, opacity);
      expect(output).toBe('rgba(255, 0, 0, 0.5)');
    });
  });
});
