/**
 * @fileoverview Line Style Test Suite
 *
 * Tests for line style validation and cleaning utilities.
 */

import { vi, describe, it, expect } from 'vitest';
import { validateLineStyle, cleanLineStyleOptions } from '../../utils/lineStyle';

// Mock the lightweight-charts module
vi.mock('lightweight-charts', () => ({
  LineStyle: {
    Solid: 0,
    Dotted: 1,
    Dashed: 2,
    LargeDashed: 3,
    SparseDotted: 4,
  },
}));

// Define the mock for use in tests
const MockLineStyle = {
  Solid: 0,
  Dotted: 1,
  Dashed: 2,
  LargeDashed: 3,
  SparseDotted: 4,
};

describe('lineStyle utils', () => {
  describe('validateLineStyle', () => {
    it('should return undefined for null/undefined input', () => {
      expect(validateLineStyle(null)).toBeUndefined();
      expect(validateLineStyle(undefined)).toBeUndefined();
      expect(validateLineStyle('')).toBeUndefined();
      expect(validateLineStyle(0)).toBe(0); // 0 is valid (Solid)
    });

    it('should validate numeric line styles', () => {
      expect(validateLineStyle(0)).toBe(MockLineStyle.Solid);
      expect(validateLineStyle(1)).toBe(MockLineStyle.Dotted);
      expect(validateLineStyle(2)).toBe(MockLineStyle.Dashed);
      expect(validateLineStyle(3)).toBe(MockLineStyle.LargeDashed);
      expect(validateLineStyle(4)).toBe(MockLineStyle.SparseDotted);
    });

    it('should reject invalid numeric values', () => {
      expect(validateLineStyle(-1)).toBeUndefined();
      expect(validateLineStyle(5)).toBeUndefined();
      expect(validateLineStyle(100)).toBeUndefined();
    });

    it('should validate string line styles', () => {
      expect(validateLineStyle('solid')).toBe(MockLineStyle.Solid);
      expect(validateLineStyle('dotted')).toBe(MockLineStyle.Dotted);
      expect(validateLineStyle('dashed')).toBe(MockLineStyle.Dashed);
      expect(validateLineStyle('large-dashed')).toBe(MockLineStyle.LargeDashed);
      expect(validateLineStyle('sparse-dotted')).toBe(MockLineStyle.SparseDotted);
    });

    it('should handle case-insensitive string input', () => {
      expect(validateLineStyle('SOLID')).toBe(MockLineStyle.Solid);
      expect(validateLineStyle('Dotted')).toBe(MockLineStyle.Dotted);
      expect(validateLineStyle('DASHED')).toBe(MockLineStyle.Dashed);
    });

    it('should reject invalid string values', () => {
      expect(validateLineStyle('invalid')).toBeUndefined();
      expect(validateLineStyle('random')).toBeUndefined();
      expect(validateLineStyle('line')).toBeUndefined();
    });

    it('should handle array input (returns Solid for valid arrays)', () => {
      expect(validateLineStyle([1, 2, 3])).toBe(MockLineStyle.Solid);
      expect(validateLineStyle([5, 10])).toBe(MockLineStyle.Solid);
      expect(validateLineStyle([0])).toBe(MockLineStyle.Solid);
    });

    it('should reject invalid arrays', () => {
      expect(validateLineStyle([-1, 2])).toBeUndefined();
      expect(validateLineStyle([1, -2])).toBeUndefined();
      expect(validateLineStyle(['a', 'b'])).toBeUndefined();
      expect(validateLineStyle([])).toBeUndefined();
    });

    it('should handle mixed types', () => {
      expect(validateLineStyle({})).toBeUndefined();
      expect(validateLineStyle(true)).toBeUndefined();
      expect(validateLineStyle(false)).toBeUndefined();
    });
  });

  describe('cleanLineStyleOptions', () => {
    it('should return input for null/undefined', () => {
      expect(cleanLineStyleOptions(null)).toBeNull();
      expect(cleanLineStyleOptions(undefined)).toBeUndefined();
    });

    it('should remove debug properties', () => {
      const input = {
        lineStyle: 'solid',
        debug: true,
        color: 'red',
      };

      const result = cleanLineStyleOptions(input);

      expect(result).toEqual({
        lineStyle: MockLineStyle.Solid,
        color: 'red',
      });
      expect(result.debug).toBeUndefined();
    });

    it('should clean and validate lineStyle property', () => {
      const input = {
        lineStyle: 'dashed',
        color: 'blue',
      };

      const result = cleanLineStyleOptions(input);

      expect(result).toEqual({
        lineStyle: MockLineStyle.Dashed,
        color: 'blue',
      });
    });

    it('should remove invalid lineStyle', () => {
      const input = {
        lineStyle: 'invalid-style',
        color: 'green',
      };

      const result = cleanLineStyleOptions(input);

      expect(result).toEqual({
        color: 'green',
      });
      expect(result.lineStyle).toBeUndefined();
    });

    it('should recursively clean nested style objects', () => {
      const input = {
        style: {
          lineStyle: 'dotted',
          debug: true,
          color: 'red',
        },
        upperLine: {
          lineStyle: 'solid',
          width: 2,
        },
        middleLine: {
          lineStyle: 'invalid',
          color: 'blue',
        },
        lowerLine: {
          lineStyle: 'dashed',
          debug: false,
        },
      };

      const result = cleanLineStyleOptions(input);

      expect(result).toEqual({
        style: {
          lineStyle: MockLineStyle.Dotted,
          color: 'red',
        },
        upperLine: {
          lineStyle: MockLineStyle.Solid,
          width: 2,
        },
        middleLine: {
          color: 'blue',
        },
        lowerLine: {
          lineStyle: MockLineStyle.Dashed,
        },
      });
    });

    it('should clean nested objects recursively', () => {
      const input = {
        nested: {
          deep: {
            lineStyle: 'sparse-dotted',
            debug: true,
            value: 42,
          },
        },
      };

      const result = cleanLineStyleOptions(input);

      expect(result).toEqual({
        nested: {
          deep: {
            lineStyle: MockLineStyle.SparseDotted,
            value: 42,
          },
        },
      });
    });

    it('should preserve arrays', () => {
      const input = {
        data: [1, 2, 3],
        colors: ['red', 'blue'],
        lineStyle: 'solid',
      };

      const result = cleanLineStyleOptions(input);

      expect(result).toEqual({
        data: [1, 2, 3],
        colors: ['red', 'blue'],
        lineStyle: MockLineStyle.Solid,
      });
    });

    it('should not modify the original object', () => {
      const input = {
        lineStyle: 'solid',
        debug: true,
        color: 'red',
      };

      const original = { ...input };
      const result = cleanLineStyleOptions(input);

      expect(input).toEqual(original);
      expect(result).not.toBe(input);
    });

    it('should handle complex nested structures', () => {
      const input = {
        series: {
          candlestick: {
            upColor: 'green',
            downColor: 'red',
            borderUpColor: {
              lineStyle: 'solid',
              debug: true,
            },
          },
        },
        layout: {
          backgroundColor: 'white',
          grid: {
            vertLines: {
              lineStyle: 'dotted',
              debug: false,
            },
            horzLines: {
              lineStyle: 'invalid-style',
              color: 'gray',
            },
          },
        },
      };

      const result = cleanLineStyleOptions(input);

      expect(result).toEqual({
        series: {
          candlestick: {
            upColor: 'green',
            downColor: 'red',
            borderUpColor: {
              lineStyle: MockLineStyle.Solid,
            },
          },
        },
        layout: {
          backgroundColor: 'white',
          grid: {
            vertLines: {
              lineStyle: MockLineStyle.Dotted,
            },
            horzLines: {
              color: 'gray',
            },
          },
        },
      });
    });
  });
});
