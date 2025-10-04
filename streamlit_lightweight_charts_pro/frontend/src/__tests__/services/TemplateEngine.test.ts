/**
 * @fileoverview Tests for TemplateEngine
 *
 * Tests cover:
 * - Basic placeholder replacement (value, OHLC, band/ribbon, volume, time, custom)
 * - Smart value extraction with fallback priority
 * - Number formatting (precision, locale, edge cases)
 * - Time formatting (Unix timestamps, ISO strings, custom formats)
 * - HTML escaping
 * - Missing placeholder handling (default values, strict mode)
 * - Template validation (malformed placeholders, unmatched pairs)
 * - Utility methods (getPlaceholders, createContextFromSeriesData)
 * - Error handling and edge cases
 * - Singleton pattern
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TemplateEngine, SeriesDataValue, TemplateOptions } from '../../services/TemplateEngine';
import { TemplateContext } from '../../types/ChartInterfaces';

describe('TemplateEngine', () => {
  let engine: TemplateEngine;

  beforeEach(() => {
    // Clear singleton instance
    (TemplateEngine as any).clearInstance();
    engine = (TemplateEngine as any).getInstance();
  });

  describe('Singleton Pattern', () => {
    it('should return same instance', () => {
      const instance1 = (TemplateEngine as any).getInstance();
      const instance2 = (TemplateEngine as any).getInstance();

      expect(instance1).toBe(instance2);
    });

    it('should clear instance', () => {
      const instance1 = (TemplateEngine as any).getInstance();
      (TemplateEngine as any).clearInstance();
      const instance2 = (TemplateEngine as any).getInstance();

      expect(instance1).not.toBe(instance2);
    });

    it('should check if instance exists', () => {
      (TemplateEngine as any).clearInstance();
      expect((TemplateEngine as any).hasInstance()).toBe(false);

      (TemplateEngine as any).getInstance();
      expect((TemplateEngine as any).hasInstance()).toBe(true);
    });
  });

  describe('Basic Placeholder Replacement', () => {
    it('should replace single value placeholder', () => {
      const template = 'Price: $$value$$';
      const context: TemplateContext = {
        seriesData: { value: 123.45 },
      };

      const result = engine.processTemplate(template, context);

      expect(result.content).toBe('Price: 123.45');
      expect(result.processedPlaceholders).toEqual(['$$value$$']);
      expect(result.hasErrors).toBe(false);
    });

    it('should replace multiple placeholders', () => {
      const template = 'O: $$open$$ H: $$high$$ L: $$low$$ C: $$close$$';
      const context: TemplateContext = {
        seriesData: {
          open: 100,
          high: 110,
          low: 95,
          close: 105,
        },
      };

      const result = engine.processTemplate(template, context);

      expect(result.content).toBe('O: 100.00 H: 110.00 L: 95.00 C: 105.00');
      expect(result.processedPlaceholders).toHaveLength(4);
    });

    it('should replace OHLC placeholders', () => {
      const template = '$$open$$/$$high$$/$$low$$/$$close$$';
      const context: TemplateContext = {
        seriesData: {
          open: 50.5,
          high: 52.75,
          low: 49.25,
          close: 51.0,
        },
      };

      const result = engine.processTemplate(template, context);

      expect(result.content).toBe('50.50/52.75/49.25/51.00');
    });

    it('should replace band/ribbon placeholders', () => {
      const template = 'U: $$upper$$ M: $$middle$$ L: $$lower$$';
      const context: TemplateContext = {
        seriesData: {
          upper: 120,
          middle: 100,
          lower: 80,
        },
      };

      const result = engine.processTemplate(template, context);

      expect(result.content).toBe('U: 120.00 M: 100.00 L: 80.00');
    });

    it('should replace volume placeholder', () => {
      const template = 'Vol: $$volume$$';
      const context: TemplateContext = {
        seriesData: {
          volume: 1500000,
        },
      };

      const result = engine.processTemplate(template, context);

      expect(result.content).toBe('Vol: 1500000.00');
    });

    it('should replace time placeholder', () => {
      const template = 'Time: $$time$$';
      const context: TemplateContext = {
        seriesData: {
          time: 1609459200, // 2021-01-01 00:00:00 UTC
        },
      };

      const result = engine.processTemplate(template, context);

      // Time will be formatted in local time zone
      expect(result.content).toMatch(/Time: .+/);
      expect(result.processedPlaceholders).toContain('$$time$$');
    });

    it('should replace custom data placeholders', () => {
      const template = 'Symbol: $$symbol$$ Type: $$type$$';
      const context: TemplateContext = {
        customData: {
          symbol: 'AAPL',
          type: 'STOCK',
        },
      };

      const result = engine.processTemplate(template, context);

      expect(result.content).toBe('Symbol: AAPL Type: STOCK');
    });

    it('should handle template with no placeholders', () => {
      const template = 'No placeholders here';
      const context: TemplateContext = {};

      const result = engine.processTemplate(template, context);

      expect(result.content).toBe('No placeholders here');
      expect(result.processedPlaceholders).toHaveLength(0);
    });

    it('should handle empty template', () => {
      const template = '';
      const context: TemplateContext = {};

      const result = engine.processTemplate(template, context);

      expect(result.content).toBe('');
    });

    it('should handle special characters in template', () => {
      const template = 'Price: $$value$$ (€)';
      const context: TemplateContext = {
        seriesData: { value: 100 },
      };

      const result = engine.processTemplate(template, context);

      expect(result.content).toBe('Price: 100.00 (€)');
    });
  });

  describe('Smart Value Extraction', () => {
    it('should prioritize close for candlestick data', () => {
      const template = '$$value$$';
      const context: TemplateContext = {
        seriesData: {
          open: 100,
          high: 110,
          low: 95,
          close: 105,
          value: 102,
        },
      };

      const result = engine.processTemplate(template, context);

      expect(result.content).toBe('105.00'); // close has priority
    });

    it('should use value for line series', () => {
      const template = '$$value$$';
      const context: TemplateContext = {
        seriesData: {
          value: 123.45,
        },
      };

      const result = engine.processTemplate(template, context);

      expect(result.content).toBe('123.45');
    });

    it('should use middle for band series', () => {
      const template = '$$value$$';
      const context: TemplateContext = {
        seriesData: {
          upper: 120,
          middle: 100,
          lower: 80,
        },
      };

      const result = engine.processTemplate(template, context);

      expect(result.content).toBe('100.00'); // middle used as value
    });

    it('should calculate average for ribbon series', () => {
      const template = '$$value$$';
      const context: TemplateContext = {
        seriesData: {
          upper: 120,
          lower: 80,
        },
      };

      const result = engine.processTemplate(template, context);

      expect(result.content).toBe('100.00'); // (120 + 80) / 2
    });

    it('should use high as fallback', () => {
      const template = '$$value$$';
      const context: TemplateContext = {
        seriesData: {
          high: 150,
        },
      };

      const result = engine.processTemplate(template, context);

      expect(result.content).toBe('150.00');
    });

    it('should return null when no value available', () => {
      const template = '$$value$$';
      const context: TemplateContext = {
        seriesData: {},
      };

      const result = engine.processTemplate(template, context);

      expect(result.content).toBe(''); // Default to empty
      expect(result.missingPlaceholders).toContain('$$value$$');
    });

    it('should prioritize custom data over series data', () => {
      const template = '$$value$$';
      const context: TemplateContext = {
        seriesData: { value: 100 },
        customData: { value: 200 },
      };

      const result = engine.processTemplate(template, context);

      expect(result.content).toBe('200.00');
    });

    it('should use direct key lookup as fallback', () => {
      const template = '$$customField$$';
      const context: TemplateContext = {
        seriesData: { customField: 999 },
      };

      const result = engine.processTemplate(template, context);

      expect(result.content).toBe('999.00');
    });
  });

  describe('Number Formatting', () => {
    it('should use default formatting (2 decimals)', () => {
      const template = '$$value$$';
      const context: TemplateContext = {
        seriesData: { value: 123.456789 },
      };

      const result = engine.processTemplate(template, context);

      expect(result.content).toBe('123.46');
    });

    it('should apply custom precision .4f', () => {
      const template = '$$value$$';
      const context: TemplateContext = {
        seriesData: { value: 123.456789 },
        formatting: {
          valueFormat: '.4f',
        },
      };

      const result = engine.processTemplate(template, context);

      expect(result.content).toBe('123.4568');
    });

    it('should apply custom precision .0f', () => {
      const template = '$$value$$';
      const context: TemplateContext = {
        seriesData: { value: 123.456789 },
        formatting: {
          valueFormat: '.0f',
        },
      };

      const result = engine.processTemplate(template, context);

      expect(result.content).toBe('123'); // toFixed(0) rounds down
    });

    it('should apply locale formatting', () => {
      const template = '$$value$$';
      const context: TemplateContext = {
        seriesData: { value: 1234.56 },
        formatting: {
          locale: 'en-US',
        },
      };

      const result = engine.processTemplate(template, context);

      expect(result.content).toMatch(/1[,\s]?234/); // Locale-specific
    });

    it('should fallback on invalid locale', () => {
      const template = '$$value$$';
      const context: TemplateContext = {
        seriesData: { value: 123.456 },
        formatting: {
          locale: 'invalid-locale',
        },
      };

      const result = engine.processTemplate(template, context);

      expect(result.content).toBe('123.46'); // Fallback to default
    });

    it('should format zero value', () => {
      const template = '$$value$$';
      const context: TemplateContext = {
        seriesData: { value: 0 },
      };

      const result = engine.processTemplate(template, context);

      expect(result.content).toBe('0.00');
    });

    it('should format negative value', () => {
      const template = '$$value$$';
      const context: TemplateContext = {
        seriesData: { value: -123.45 },
      };

      const result = engine.processTemplate(template, context);

      expect(result.content).toBe('-123.45');
    });

    it('should format very large numbers', () => {
      const template = '$$value$$';
      const context: TemplateContext = {
        seriesData: { value: 1234567890.12 },
      };

      const result = engine.processTemplate(template, context);

      expect(result.content).toBe('1234567890.12');
    });

    it('should format very small numbers', () => {
      const template = '$$value$$';
      const context: TemplateContext = {
        seriesData: { value: 0.000123 },
      };

      const result = engine.processTemplate(template, context);

      expect(result.content).toBe('0.00');
    });

    it('should apply precision .6f for very small numbers', () => {
      const template = '$$value$$';
      const context: TemplateContext = {
        seriesData: { value: 0.000123 },
        formatting: {
          valueFormat: '.6f',
        },
      };

      const result = engine.processTemplate(template, context);

      expect(result.content).toBe('0.000123');
    });
  });

  describe('Time Formatting', () => {
    it('should format Unix timestamp in seconds', () => {
      const template = '$$time$$';
      const context: TemplateContext = {
        seriesData: {
          time: 1609459200, // 2021-01-01 00:00:00 UTC
        },
      };

      const result = engine.processTemplate(template, context);

      // Check that time is formatted (local time zone dependent)
      expect(result.content.length).toBeGreaterThan(0);
      expect(result.processedPlaceholders).toContain('$$time$$');
    });

    it('should format Unix timestamp in milliseconds', () => {
      const template = '$$time$$';
      const context: TemplateContext = {
        seriesData: {
          time: 1609459200000, // 2021-01-01 00:00:00 UTC (ms)
        },
      };

      const result = engine.processTemplate(template, context);

      // Check that time is formatted (local time zone dependent)
      expect(result.content.length).toBeGreaterThan(0);
      expect(result.processedPlaceholders).toContain('$$time$$');
    });

    it('should format ISO string', () => {
      const template = '$$time$$';
      const context: TemplateContext = {
        seriesData: {
          time: '2021-01-01T00:00:00Z',
        },
      };

      const result = engine.processTemplate(template, context);

      // Check that time is formatted (local time zone dependent)
      expect(result.content.length).toBeGreaterThan(0);
      expect(result.processedPlaceholders).toContain('$$time$$');
    });

    it('should format Date object', () => {
      const template = '$$time$$';
      const date = new Date('2021-01-01T00:00:00Z');
      const context: TemplateContext = {
        seriesData: {
          time: date as any,
        },
      };

      const result = engine.processTemplate(template, context);

      // Check that time is formatted (local time zone dependent)
      expect(result.content.length).toBeGreaterThan(0);
      expect(result.processedPlaceholders).toContain('$$time$$');
    });

    it('should apply custom format YYYY-MM-DD', () => {
      const template = '$$time$$';
      const context: TemplateContext = {
        seriesData: {
          time: 1609459200, // 2021-01-01 00:00:00 UTC
        },
        formatting: {
          timeFormat: 'YYYY-MM-DD',
        },
      };

      const result = engine.processTemplate(template, context);

      // Format is YYYY-MM-DD (local time zone)
      expect(result.content).toMatch(/\d{4}-\d{2}-\d{2}/);
    });

    it('should apply custom format HH:mm:ss', () => {
      const template = '$$time$$';
      const context: TemplateContext = {
        seriesData: {
          time: 1609459200, // 2021-01-01 00:00:00 UTC
        },
        formatting: {
          timeFormat: 'HH:mm:ss',
        },
      };

      const result = engine.processTemplate(template, context);

      expect(result.content).toMatch(/\d{2}:\d{2}:\d{2}/);
    });

    it('should apply custom format YYYY-MM-DD HH:mm', () => {
      const template = '$$time$$';
      const context: TemplateContext = {
        seriesData: {
          time: 1609459200,
        },
        formatting: {
          timeFormat: 'YYYY-MM-DD HH:mm',
        },
      };

      const result = engine.processTemplate(template, context);

      // Format is YYYY-MM-DD HH:mm (local time zone)
      expect(result.content).toMatch(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}/);
    });

    it('should handle invalid time value', () => {
      const template = '$$time$$';
      const context: TemplateContext = {
        seriesData: {
          time: 'invalid-time' as any,
        },
      };

      const result = engine.processTemplate(template, context);

      expect(result.content).toBe('Invalid Date');
    });

    it('should handle null time', () => {
      const template = '$$time$$';
      const context: TemplateContext = {
        seriesData: {
          time: null as any,
        },
      };

      const result = engine.processTemplate(template, context);

      expect(result.content).toBe('');
    });

    it('should use default format when no format specified', () => {
      const template = '$$time$$';
      const context: TemplateContext = {
        seriesData: {
          time: 1609459200,
        },
      };

      const result = engine.processTemplate(template, context);

      expect(result.content.length).toBeGreaterThan(0);
    });
  });

  describe('HTML Escaping', () => {
    it('should escape HTML special characters', () => {
      const template = '$$value$$';
      const context: TemplateContext = {
        customData: {
          value: '<script>alert("xss")</script>',
        },
      };
      const options: TemplateOptions = {
        escapeHtml: true,
      };

      const result = engine.processTemplate(template, context, options);

      expect(result.content).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
    });

    it('should not escape when disabled', () => {
      const template = '$$value$$';
      const context: TemplateContext = {
        customData: {
          value: '<b>Bold</b>',
        },
      };
      const options: TemplateOptions = {
        escapeHtml: false,
      };

      const result = engine.processTemplate(template, context, options);

      expect(result.content).toBe('<b>Bold</b>');
    });

    it('should escape ampersand', () => {
      const template = '$$value$$';
      const context: TemplateContext = {
        customData: { value: 'A & B' },
      };
      const options: TemplateOptions = { escapeHtml: true };

      const result = engine.processTemplate(template, context, options);

      expect(result.content).toBe('A &amp; B');
    });

    it('should escape single quote', () => {
      const template = '$$value$$';
      const context: TemplateContext = {
        customData: { value: "It's here" },
      };
      const options: TemplateOptions = { escapeHtml: true };

      const result = engine.processTemplate(template, context, options);

      expect(result.content).toBe('It&#39;s here');
    });

    it('should handle empty string', () => {
      const template = '$$value$$';
      const context: TemplateContext = {
        customData: { value: '' },
      };
      const options: TemplateOptions = { escapeHtml: true };

      const result = engine.processTemplate(template, context, options);

      expect(result.content).toBe('');
    });
  });

  describe('Missing Placeholder Handling', () => {
    it('should use default value for missing placeholder', () => {
      const template = '$$missing$$';
      const context: TemplateContext = {};
      const options: TemplateOptions = {
        defaultValue: 'N/A',
      };

      const result = engine.processTemplate(template, context, options);

      expect(result.content).toBe('N/A');
      expect(result.missingPlaceholders).toContain('$$missing$$');
    });

    it('should use empty string when no default provided', () => {
      const template = '$$missing$$';
      const context: TemplateContext = {};

      const result = engine.processTemplate(template, context);

      expect(result.content).toBe('');
      expect(result.missingPlaceholders).toContain('$$missing$$');
    });

    it('should throw error in strict mode', () => {
      const template = '$$missing$$';
      const context: TemplateContext = {};
      const options: TemplateOptions = {
        strict: true,
      };

      expect(() => engine.processTemplate(template, context, options)).toThrow(
        'Missing data for placeholder: $$missing$$'
      );
    });

    it('should continue processing in non-strict mode', () => {
      const template = '$$value$$ and $$missing$$';
      const context: TemplateContext = {
        seriesData: { value: 100 },
      };
      const options: TemplateOptions = {
        strict: false,
      };

      const result = engine.processTemplate(template, context, options);

      expect(result.content).toBe('100.00 and ');
      expect(result.hasErrors).toBe(false);
    });

    it('should not include missing in processedPlaceholders', () => {
      const template = '$$missing$$';
      const context: TemplateContext = {};

      const result = engine.processTemplate(template, context);

      expect(result.processedPlaceholders).not.toContain('$$missing$$');
    });

    it('should include missing in missingPlaceholders', () => {
      const template = '$$missing1$$ $$missing2$$';
      const context: TemplateContext = {};

      const result = engine.processTemplate(template, context);

      expect(result.missingPlaceholders).toEqual(['$$missing1$$', '$$missing2$$']);
    });
  });

  describe('Template Validation', () => {
    it('should validate correct template', () => {
      const template = '$$value$$ $$open$$ $$close$$';

      const validation = engine.validateTemplate(template);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect malformed placeholders', () => {
      const template = '$$123invalid$$'; // Starts with number

      const validation = engine.validateTemplate(template);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Template contains malformed placeholders');
    });

    it('should detect unmatched $$ pairs', () => {
      const template = '$$value$$ $$$';

      const validation = engine.validateTemplate(template);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Template contains unmatched $$ pairs');
    });

    it('should handle multiple validation errors', () => {
      const template = '$$$invalid$$$ $$valid$$ $';

      const validation = engine.validateTemplate(template);

      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    it('should validate empty template', () => {
      const template = '';

      const validation = engine.validateTemplate(template);

      expect(validation.isValid).toBe(true);
    });
  });

  describe('Template Utilities', () => {
    it('should get all placeholders from template', () => {
      const template = '$$value$$ $$open$$ $$close$$';

      const placeholders = engine.getPlaceholders(template);

      expect(placeholders).toEqual(['$$value$$', '$$open$$', '$$close$$']);
    });

    it('should return empty array for template with no placeholders', () => {
      const template = 'No placeholders here';

      const placeholders = engine.getPlaceholders(template);

      expect(placeholders).toEqual([]);
    });

    it('should handle duplicate placeholders', () => {
      const template = '$$value$$ and $$value$$ again';

      const placeholders = engine.getPlaceholders(template);

      expect(placeholders).toEqual(['$$value$$', '$$value$$']);
    });

    it('should create context from series data', () => {
      const seriesData: SeriesDataValue = {
        open: 100,
        high: 110,
        low: 95,
        close: 105,
      };
      const customData = { symbol: 'AAPL' };
      const formatting = { valueFormat: '.2f' };

      const context = engine.createContextFromSeriesData(seriesData, customData, formatting);

      expect(context.seriesData).toBe(seriesData);
      expect(context.customData).toBe(customData);
      expect(context.formatting).toBe(formatting);
    });

    it('should create context without optional parameters', () => {
      const seriesData: SeriesDataValue = { value: 100 };

      const context = engine.createContextFromSeriesData(seriesData);

      expect(context.seriesData).toBe(seriesData);
      expect(context.customData).toBeUndefined();
      expect(context.formatting).toBeUndefined();
    });
  });

  describe('Options Handling', () => {
    it('should skip processing when processPlaceholders is false', () => {
      const template = '$$value$$';
      const context: TemplateContext = {
        seriesData: { value: 100 },
      };
      const options: TemplateOptions = {
        processPlaceholders: false,
      };

      const result = engine.processTemplate(template, context, options);

      expect(result.content).toBe('$$value$$'); // Unchanged
      expect(result.processedPlaceholders).toHaveLength(0);
    });

    it('should handle all options together', () => {
      const template = '$$value$$ $$missing$$';
      const context: TemplateContext = {
        customData: { value: '<b>Bold</b>' },
      };
      const options: TemplateOptions = {
        processPlaceholders: true,
        escapeHtml: true,
        defaultValue: 'N/A',
        strict: false,
      };

      const result = engine.processTemplate(template, context, options);

      expect(result.content).toBe('&lt;b&gt;Bold&lt;/b&gt; N/A');
      expect(result.missingPlaceholders).toContain('$$missing$$');
      expect(result.hasErrors).toBe(false);
    });

    it('should use default options when none provided', () => {
      const template = '$$value$$';
      const context: TemplateContext = {
        seriesData: { value: 100 },
      };

      const result = engine.processTemplate(template, context);

      expect(result.content).toBe('100.00');
      expect(result.hasErrors).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle error in placeholder extraction', () => {
      const template = '$$value$$';
      const context: TemplateContext = {
        seriesData: null as any, // Invalid data
      };

      const result = engine.processTemplate(template, context);

      expect(result.content).toBe('');
      expect(result.missingPlaceholders).toContain('$$value$$');
    });

    it('should collect errors in non-strict mode', () => {
      const template = '$$value$$';
      const context: TemplateContext = {
        seriesData: { value: 'not-a-number' as any },
      };

      const result = engine.processTemplate(template, context);

      // Should handle gracefully
      expect(result.hasErrors).toBe(false);
    });

    it('should handle null context', () => {
      const template = '$$value$$';

      const result = engine.processTemplate(template, undefined as any);

      expect(result.content).toBe('');
    });

    it('should handle null template', () => {
      const result = engine.processTemplate(null as any);

      // Implementation returns TemplateResult with content = null
      expect(result.content).toBe(null);
    });
  });

  describe('Edge Cases', () => {
    it('should handle placeholder at start of template', () => {
      const template = '$$value$$ is the price';
      const context: TemplateContext = {
        seriesData: { value: 100 },
      };

      const result = engine.processTemplate(template, context);

      expect(result.content).toBe('100.00 is the price');
    });

    it('should handle placeholder at end of template', () => {
      const template = 'Price is $$value$$';
      const context: TemplateContext = {
        seriesData: { value: 100 },
      };

      const result = engine.processTemplate(template, context);

      expect(result.content).toBe('Price is 100.00');
    });

    it('should handle consecutive placeholders', () => {
      const template = '$$value$$$$close$$';
      const context: TemplateContext = {
        seriesData: { close: 105 }, // Only close ($$value$$ will use close due to smart extraction)
      };

      const result = engine.processTemplate(template, context);

      expect(result.content).toBe('105.00105.00');
    });

    it('should handle placeholder with underscores', () => {
      const template = '$$custom_field_123$$';
      const context: TemplateContext = {
        customData: { custom_field_123: 'value' },
      };

      const result = engine.processTemplate(template, context);

      expect(result.content).toBe('value');
    });

    it('should handle very long template', () => {
      const template = '$$value$$ '.repeat(100);
      const context: TemplateContext = {
        seriesData: { value: 100 },
      };

      const result = engine.processTemplate(template, context);

      expect(result.content).toBe('100.00 '.repeat(100));
    });

    it('should handle template with regex special characters', () => {
      const template = 'Price: $$value$$ (.*+?)';
      const context: TemplateContext = {
        seriesData: { value: 100 },
      };

      const result = engine.processTemplate(template, context);

      expect(result.content).toBe('Price: 100.00 (.*+?)');
    });

    it('should handle undefined formatting', () => {
      const template = '$$value$$';
      const context: TemplateContext = {
        seriesData: { value: 100 },
        formatting: undefined,
      };

      const result = engine.processTemplate(template, context);

      expect(result.content).toBe('100.00');
    });

    it('should handle boolean values in custom data', () => {
      const template = '$$flag$$';
      const context: TemplateContext = {
        customData: { flag: true },
      };

      const result = engine.processTemplate(template, context);

      expect(result.content).toBe('true');
    });

    it('should handle array values in custom data', () => {
      const template = '$$array$$';
      const context: TemplateContext = {
        customData: { array: [1, 2, 3] },
      };

      const result = engine.processTemplate(template, context);

      expect(result.content).toBe('1,2,3');
    });

    it('should handle object values in custom data', () => {
      const template = '$$obj$$';
      const context: TemplateContext = {
        customData: { obj: { key: 'value' } },
      };

      const result = engine.processTemplate(template, context);

      expect(result.content).toBe('[object Object]');
    });
  });
});
