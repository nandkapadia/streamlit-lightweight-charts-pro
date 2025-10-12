/**
 * Template processing engine for pane primitives
 *
 * Handles smart placeholder replacement with support for:
 * - Chart value placeholders: $$value$$, $$open$$, $$high$$, $$low$$, $$close$$
 * - Band/Ribbon placeholders: $$upper$$, $$middle$$, $$lower$$
 * - Volume placeholder: $$volume$$
 * - Time placeholder: $$time$$
 * - Custom placeholders: $$custom_key$$
 *
 * Following DRY principles - single source of truth for template processing
 */

import { UTCTimestamp } from 'lightweight-charts';
import { TemplateContext, TemplateFormatting } from '../types/ChartInterfaces';
import { Singleton } from '../utils/SingletonBase';

/**
 * Interface for series data used in template processing
 */
export interface SeriesDataValue {
  time?: UTCTimestamp | string | number;
  value?: number;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  upper?: number;
  middle?: number;
  lower?: number;
  volume?: number;
  [key: string]: unknown;
}

/**
 * Template processing options
 */
export interface TemplateOptions {
  /**
   * Whether to process placeholders (default: true)
   */
  processPlaceholders?: boolean;

  /**
   * Whether to escape HTML (default: false)
   */
  escapeHtml?: boolean;

  /**
   * Default value for missing placeholders
   */
  defaultValue?: string;

  /**
   * Whether to throw on missing placeholder data (default: false)
   */
  strict?: boolean;
}

/**
 * Template processing result
 */
export interface TemplateResult {
  /**
   * Processed template content
   */
  content: string;

  /**
   * List of placeholders that were processed
   */
  processedPlaceholders: string[];

  /**
   * List of placeholders that had no data
   */
  missingPlaceholders: string[];

  /**
   * Whether errors occurred during processing
   */
  hasErrors: boolean;

  /**
   * Error messages if errors occurred
   */
  errors: string[];
}

/**
 * TemplateEngine - Centralized template processor for all primitives
 *
 * Provides unified HTML template processing with placeholder replacement
 * for legends, tooltips, trade markers, and other primitives. This is the
 * single source of truth for all template processing in the application.
 *
 * Architecture:
 * - Singleton pattern (shared across all primitives)
 * - Placeholder syntax: $$placeholder_name$$
 * - Supports chart data, custom data, and formatting
 * - Type-safe with comprehensive error handling
 *
 * Supported Placeholders:
 * - **Chart values**: $$value$$, $$open$$, $$high$$, $$low$$, $$close$$
 * - **Band/Ribbon**: $$upper$$, $$middle$$, $$lower$$
 * - **Volume**: $$volume$$
 * - **Time**: $$time$$
 * - **Custom**: $$custom_key$$ (from customData)
 * - **Trade**: $$pnl$$, $$entry_price$$, etc. (flexible)
 *
 * Features:
 * - Automatic number formatting with precision
 * - HTML escaping for security
 * - Missing placeholder detection
 * - Strict mode for validation
 * - Comprehensive error reporting
 *
 * @export
 * @class TemplateEngine
 *
 * @example
 * ```typescript
 * const engine = TemplateEngine.getInstance();
 *
 * const result = engine.processTemplate(
 *   '<div>Price: $$close$$ ($$time$$)</div>',
 *   {
 *     seriesData: { close: 100.50, time: 1704067200 },
 *     formatting: { precision: 2 }
 *   }
 * );
 *
 * console.log(result.content);
 * // '<div>Price: 100.50 (2024-01-01)</div>'
 * ```
 */
// @ts-expect-error - Decorator doesn't support private constructors
@Singleton()
export class TemplateEngine {
  /** Singleton instance getter (set by @Singleton decorator) */
  static getInstance: () => TemplateEngine;

  /**
   * Private constructor (Singleton pattern)
   *
   * @private
   */
  private constructor() {
    // Private constructor enforces singleton pattern
  }

  /**
   * Process HTML template with placeholder replacement
   *
   * Replaces all $$placeholder$$ tokens in the template with values from
   * the provided context. Supports chart data, custom data, and formatting
   * options. Returns comprehensive result with processed content and errors.
   *
   * Processing order:
   * 1. Check if processing is enabled
   * 2. Extract all placeholders from template
   * 3. For each placeholder, resolve value from context
   * 4. Apply formatting (precision, HTML escaping)
   * 5. Replace placeholder with formatted value
   * 6. Return result with processed content and metadata
   *
   * @public
   * @param {string} template - HTML template with $$placeholder$$ syntax
   * @param {TemplateContext} [context={}] - Data context for replacement
   * @param {TemplateOptions} [options={}] - Processing options
   * @returns {TemplateResult} Result with content, placeholders, and errors
   *
   * @example
   * ```typescript
   * const result = engine.processTemplate(
   *   '<span>$$title$$: $$value$$</span>',
   *   {
   *     seriesData: { value: 123.45 },
   *     customData: { title: 'Price' },
   *     formatting: { precision: 2 }
   *   },
   *   { strict: true }
   * );
   *
   * console.log(result.content); // '<span>Price: 123.45</span>'
   * console.log(result.processedPlaceholders); // ['title', 'value']
   * ```
   */
  public processTemplate(
    template: string,
    context: TemplateContext = {},
    options: TemplateOptions = {}
  ): TemplateResult {
    // Initialize result with template and empty metadata
    const result: TemplateResult = {
      content: template,
      processedPlaceholders: [],
      missingPlaceholders: [],
      hasErrors: false,
      errors: [],
    };

    // Step 1: Early return if processing is disabled
    if (options.processPlaceholders === false) {
      return result;
    }

    try {
      // Find all placeholders in template
      const placeholderRegex = /\$\$([a-zA-Z_][a-zA-Z0-9_]*)\$\$/g;
      const placeholders = [...template.matchAll(placeholderRegex)];

      // Process each placeholder
      for (const match of placeholders) {
        const fullPlaceholder = match[0]; // e.g., "$$value$$"
        const placeholderKey = match[1]; // e.g., "value"

        try {
          const value = this.extractPlaceholderValue(placeholderKey, context);

          if (value !== null && value !== undefined) {
            // Format the value
            const formattedValue = this.formatValue(value, placeholderKey, context.formatting);

            // Replace in content
            result.content = result.content.replace(
              new RegExp(this.escapeRegex(fullPlaceholder), 'g'),
              options.escapeHtml ? this.escapeHtml(formattedValue) : formattedValue
            );

            result.processedPlaceholders.push(fullPlaceholder);
          } else {
            // Handle missing value
            const defaultValue = options.defaultValue || '';
            result.content = result.content.replace(
              new RegExp(this.escapeRegex(fullPlaceholder), 'g'),
              defaultValue
            );

            result.missingPlaceholders.push(fullPlaceholder);

            if (options.strict) {
              throw new Error(`Missing data for placeholder: ${fullPlaceholder}`);
            }
          }
        } catch (error) {
          result.hasErrors = true;
          result.errors.push(`Error processing ${fullPlaceholder}: ${error}`);

          if (options.strict) {
            throw error;
          }
        }
      }
    } catch (error) {
      result.hasErrors = true;
      result.errors.push(`Template processing error: ${error}`);

      if (options.strict) {
        throw error;
      }
    }

    return result;
  }

  /**
   * Extract value for a specific placeholder key
   */
  private extractPlaceholderValue(key: string, context: TemplateContext): unknown {
    const { seriesData, customData } = context;

    // Check custom data first
    if (customData && Object.prototype.hasOwnProperty.call(customData, key)) {
      return customData[key];
    }

    // Check series data
    if (seriesData) {
      const typedSeriesData = seriesData as SeriesDataValue;
      switch (key) {
        case 'value':
          return this.extractSmartValue(typedSeriesData);
        case 'open':
          return typedSeriesData.open;
        case 'high':
          return typedSeriesData.high;
        case 'low':
          return typedSeriesData.low;
        case 'close':
          return typedSeriesData.close;
        case 'upper':
          return typedSeriesData.upper;
        case 'middle':
          return typedSeriesData.middle;
        case 'lower':
          return typedSeriesData.lower;
        case 'volume':
          return typedSeriesData.volume;
        case 'time':
          return typedSeriesData.time;
        default:
          // Check if key exists directly in series data
          if (Object.prototype.hasOwnProperty.call(typedSeriesData, key)) {
            return (typedSeriesData as Record<string, unknown>)[key];
          }
      }
    }

    return null;
  }

  /**
   * Smart value extraction for $$value$$ placeholder
   * Falls back through different value types based on series data structure
   */
  private extractSmartValue(seriesData: SeriesDataValue): number | null {
    // Priority order for value extraction:
    // 1. close (for candlestick/OHLC series)
    // 2. value (for line/area series)
    // 3. middle (for band series)
    // 4. average of upper/lower (for ribbon series)
    // 5. high (fallback)

    if (seriesData.close !== undefined) {
      return seriesData.close;
    }

    if (seriesData.value !== undefined) {
      return seriesData.value;
    }

    if (seriesData.middle !== undefined) {
      return seriesData.middle;
    }

    if (seriesData.upper !== undefined && seriesData.lower !== undefined) {
      return (seriesData.upper + seriesData.lower) / 2;
    }

    if (seriesData.high !== undefined) {
      return seriesData.high;
    }

    return null;
  }

  /**
   * Format value according to type and formatting options
   */
  private formatValue(value: unknown, key: string, formatting?: TemplateFormatting): string {
    if (value === null || value === undefined) {
      return '';
    }

    // Handle time formatting
    if (key === 'time') {
      return this.formatTime(value, formatting?.timeFormat);
    }

    // Handle numeric formatting with trade-specific enhancements
    if (typeof value === 'number') {
      // Trade-specific formatting for prices and P&L
      if (key.includes('price') || key.includes('pnl')) {
        const formatted = this.formatNumber(value, formatting?.valueFormat, formatting?.locale);
        // Add sign for P&L values
        if (key.includes('pnl') && value >= 0) {
          return `+${formatted}`;
        }
        return formatted;
      }

      // Percentage formatting
      if (key.includes('percentage') || key.includes('percent')) {
        const format = formatting?.percentageFormat || '.1f';
        return `${value.toFixed(format === '.1f' ? 1 : 2)}%`;
      }

      return this.formatNumber(value, formatting?.valueFormat, formatting?.locale);
    }

    // Default to string conversion
    return value.toString();
  }

  /**
   * Format number according to format specification
   */
  private formatNumber(value: number, format?: string, locale?: string): string {
    if (!format) {
      return value.toFixed(2); // Default to 2 decimal places
    }

    // Parse format specification (e.g., '.2f', '.4f', etc.)
    const formatMatch = format.match(/\.(\d+)f/);
    if (formatMatch) {
      const decimals = parseInt(formatMatch[1]);
      return value.toFixed(decimals);
    }

    // Handle locale-specific formatting if specified
    if (locale) {
      try {
        return value.toLocaleString(locale);
      } catch {
        // Invalid locale - fall back to default formatting
      }
    }

    return value.toFixed(2);
  }

  /**
   * Format time value
   */
  private formatTime(time: UTCTimestamp | string | number | unknown, format?: string): string {
    if (!time) return '';

    try {
      let date: Date;

      // Convert time to Date object
      if (time instanceof Date) {
        date = time;
      } else if (typeof time === 'number') {
        // Assume Unix timestamp (seconds or milliseconds)
        date = new Date(time > 1e10 ? time : time * 1000);
      } else if (typeof time === 'string') {
        date = new Date(time);
      } else {
        return time.toString();
      }

      // Apply format if specified
      if (format) {
        return this.formatDateWithCustomFormat(date, format);
      }

      // Default formatting
      return date.toLocaleString();
    } catch {
      // Error formatting time - fall back to string conversion
      return time.toString();
    }
  }

  /**
   * Format date with custom format string
   */
  private formatDateWithCustomFormat(date: Date, format: string): string {
    const formatMap: { [key: string]: string } = {
      YYYY: date.getFullYear().toString(),
      MM: (date.getMonth() + 1).toString().padStart(2, '0'),
      DD: date.getDate().toString().padStart(2, '0'),
      HH: date.getHours().toString().padStart(2, '0'),
      mm: date.getMinutes().toString().padStart(2, '0'),
      ss: date.getSeconds().toString().padStart(2, '0'),
    };

    let result = format;
    for (const [placeholder, value] of Object.entries(formatMap)) {
      result = result.replace(new RegExp(placeholder, 'g'), value);
    }

    return result;
  }

  /**
   * Escape special regex characters
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Escape HTML characters
   */
  private escapeHtml(str: string): string {
    const escapeMap: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };

    return str.replace(/[&<>"']/g, match => escapeMap[match]);
  }

  /**
   * Validate template syntax
   */
  public validateTemplate(template: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    try {
      // Check for malformed placeholders
      const placeholderRegex = /\$\$([a-zA-Z_][a-zA-Z0-9_]*)\$\$/g;
      const invalidPlaceholderRegex = /\$\$[^$]*\$\$/g;

      const validPlaceholders = [...template.matchAll(placeholderRegex)];
      const allDollarPairs = [...template.matchAll(invalidPlaceholderRegex)];

      if (allDollarPairs.length !== validPlaceholders.length) {
        errors.push('Template contains malformed placeholders');
      }

      // Check for unmatched $$ pairs
      const dollarCount = (template.match(/\$/g) || []).length;
      if (dollarCount % 4 !== 0) {
        errors.push('Template contains unmatched $$ pairs');
      }
    } catch (error) {
      errors.push(`Template validation error: ${error}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get list of placeholders in template
   */
  public getPlaceholders(template: string): string[] {
    const placeholderRegex = /\$\$([a-zA-Z_][a-zA-Z0-9_]*)\$\$/g;
    const matches = [...template.matchAll(placeholderRegex)];
    return matches.map(match => match[0]);
  }

  /**
   * Create template context from series data
   */
  public createContextFromSeriesData(
    seriesData: SeriesDataValue,
    customData?: Record<string, unknown>,
    formatting?: TemplateContext['formatting']
  ): TemplateContext {
    return {
      seriesData,
      customData,
      formatting,
    };
  }
}
