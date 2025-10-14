/**
 * @fileoverview Lightweight Charts Utils Test Suite
 *
 * Tests for Lightweight Charts type compatibility utilities.
 */

import { describe, it, expect } from 'vitest';
import {
  asLineWidth,
  asLineStyle,
  asPriceLineSource,
  createSeriesOptions,
  safeSeriesOptions,
} from '../../utils/lightweightChartsUtils';

describe('lightweightChartsUtils', () => {
  describe('asLineWidth', () => {
    it('should return the number as-is', () => {
      expect(asLineWidth(1)).toBe(1);
      expect(asLineWidth(2.5)).toBe(2.5);
      expect(asLineWidth(0)).toBe(0);
      expect(asLineWidth(-1)).toBe(-1);
    });

    it('should handle edge cases', () => {
      expect(asLineWidth(Number.MAX_VALUE)).toBe(Number.MAX_VALUE);
      expect(asLineWidth(Number.MIN_VALUE)).toBe(Number.MIN_VALUE);
      expect(asLineWidth(Infinity)).toBe(Infinity);
      expect(asLineWidth(-Infinity)).toBe(-Infinity);
    });
  });

  describe('asLineStyle', () => {
    it('should return numbers as-is', () => {
      expect(asLineStyle(0)).toBe(0);
      expect(asLineStyle(1)).toBe(1);
      expect(asLineStyle(2)).toBe(2);
      expect(asLineStyle(-1)).toBe(-1);
    });

    it('should convert string numbers to integers', () => {
      expect(asLineStyle('0')).toBe(0);
      expect(asLineStyle('1')).toBe(1);
      expect(asLineStyle('2')).toBe(2);
      expect(asLineStyle('10')).toBe(10);
    });

    it('should handle decimal strings by converting to integer', () => {
      expect(asLineStyle('2.5')).toBe(2);
      expect(asLineStyle('3.9')).toBe(3);
      expect(asLineStyle('0.1')).toBe(0);
    });

    it('should handle hexadecimal strings', () => {
      expect(asLineStyle('0x10')).toBe(0); // parseInt('0x10', 10) = 0 (not 16, because base 10)
      expect(asLineStyle('0xFF')).toBe(0); // parseInt('0xFF', 10) = 0 (not 255, because base 10)
    });

    it('should handle invalid strings gracefully', () => {
      expect(asLineStyle('invalid')).toBeNaN();
      expect(asLineStyle('')).toBeNaN(); // parseInt('', 10) = NaN
      expect(asLineStyle('abc')).toBeNaN();
    });

    it('should handle edge cases', () => {
      expect(asLineStyle('Infinity')).toBeNaN(); // parseInt('Infinity', 10) = NaN
      expect(asLineStyle('-Infinity')).toBeNaN(); // parseInt('-Infinity', 10) = NaN
    });
  });

  describe('asPriceLineSource', () => {
    it('should return the string as-is', () => {
      expect(asPriceLineSource('last-bar')).toBe('last-bar');
      expect(asPriceLineSource('close')).toBe('close');
      expect(asPriceLineSource('open')).toBe('open');
      expect(asPriceLineSource('high')).toBe('high');
      expect(asPriceLineSource('low')).toBe('low');
    });

    it('should handle empty and special strings', () => {
      expect(asPriceLineSource('')).toBe('');
      expect(asPriceLineSource('custom-source')).toBe('custom-source');
      expect(asPriceLineSource('123')).toBe('123');
    });
  });

  describe('createSeriesOptions', () => {
    it('should convert line width properties', () => {
      const input = {
        lineWidth: 2,
        priceLineWidth: 1,
        baseLineWidth: 3,
        otherProp: 'unchanged',
      };

      const result = createSeriesOptions(input);

      expect(result).toEqual({
        lineWidth: 2,
        priceLineWidth: 1,
        baseLineWidth: 3,
        otherProp: 'unchanged',
      });
    });

    it('should convert line style properties', () => {
      const input = {
        lineStyle: '1',
        priceLineStyle: 2,
        baseLineStyle: '0',
        color: 'red',
      };

      const result = createSeriesOptions(input);

      expect(result).toEqual({
        lineStyle: 1,
        priceLineStyle: 2,
        baseLineStyle: 0,
        color: 'red',
      });
    });

    it('should convert price line source properties', () => {
      const input = {
        priceLineSource: 'close',
        title: 'Test Series',
      };

      const result = createSeriesOptions(input);

      expect(result).toEqual({
        priceLineSource: 'close',
        title: 'Test Series',
      });
    });

    it('should handle mixed properties', () => {
      const input = {
        lineWidth: 2,
        lineStyle: '1',
        priceLineSource: 'last-bar',
        color: '#ff0000',
        visible: true,
        priceScale: 'right',
        precision: 2,
        priceLineWidth: 1.5,
        baseLineStyle: 0,
      };

      const result = createSeriesOptions(input);

      expect(result).toEqual({
        lineWidth: 2,
        lineStyle: 1,
        priceLineSource: 'last-bar',
        color: '#ff0000',
        visible: true,
        priceScale: 'right',
        precision: 2,
        priceLineWidth: 1.5,
        baseLineStyle: 0,
      });
    });

    it('should handle empty options', () => {
      const result = createSeriesOptions({});
      expect(result).toEqual({});
    });

    it('should not modify the original object', () => {
      const input = {
        lineWidth: 2,
        lineStyle: '1',
        otherProp: 'test',
      };

      const original = { ...input };
      const result = createSeriesOptions(input);

      expect(input).toEqual(original);
      expect(result).not.toBe(input);
    });

    it('should handle complex nested values', () => {
      const input = {
        lineWidth: 2,
        nestedObject: {
          prop1: 'value1',
          prop2: 42,
        },
        arrayProp: [1, 2, 3],
        nullProp: null,
        undefinedProp: undefined,
      };

      const result = createSeriesOptions(input);

      expect(result).toEqual({
        lineWidth: 2,
        nestedObject: {
          prop1: 'value1',
          prop2: 42,
        },
        arrayProp: [1, 2, 3],
        nullProp: null,
        undefinedProp: undefined,
      });
    });

    it('should handle invalid line style values gracefully', () => {
      const input = {
        lineStyle: 'invalid',
        priceLineStyle: 'not-a-number',
        validProp: 'test',
      };

      const result = createSeriesOptions(input);

      expect(result.lineStyle).toBeNaN();
      expect(result.priceLineStyle).toBeNaN();
      expect(result.validProp).toBe('test');
    });
  });

  describe('safeSeriesOptions', () => {
    it('should return the input as-is', () => {
      const input = { lineWidth: 2, color: 'red' };
      const result = safeSeriesOptions(input);

      expect(result).toBe(input);
      expect(result).toEqual(input);
    });

    it('should handle different types', () => {
      const stringInput = 'test';
      expect(safeSeriesOptions(stringInput)).toBe(stringInput);

      const numberInput = 42;
      expect(safeSeriesOptions(numberInput)).toBe(numberInput);

      const arrayInput = [1, 2, 3];
      expect(safeSeriesOptions(arrayInput)).toBe(arrayInput);

      const nullInput = null;
      expect(safeSeriesOptions(nullInput)).toBe(nullInput);

      const undefinedInput = undefined;
      expect(safeSeriesOptions(undefinedInput)).toBe(undefinedInput);
    });

    it('should work with complex objects', () => {
      const complexObject = {
        series: {
          lineWidth: 2,
          color: 'blue',
          data: [{ time: '2023-01-01', value: 100 }],
        },
        chart: {
          width: 800,
          height: 400,
        },
      };

      const result = safeSeriesOptions(complexObject);
      expect(result).toBe(complexObject);
      expect(result).toEqual(complexObject);
    });
  });
});
