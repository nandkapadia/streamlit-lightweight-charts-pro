/**
 * @fileoverview Signal Color Utilities
 *
 * Shared utility for determining signal colors based on values.
 * Used by both SignalSeriesPlugin and SignalPrimitive to ensure consistent
 * color rendering behavior across different rendering modes.
 *
 * This utility handles:
 * - Boolean values (true/false) → converted to 0/1
 * - Numeric values (0, 1, negative, positive)
 * - Smart alertColor usage (only for non-boolean datasets)
 *
 * @see signalSeriesPlugin.ts
 * @see SignalPrimitive.ts
 */

/**
 * Options interface for signal colors
 */
export interface SignalColorOptions {
  neutralColor?: string;
  signalColor?: string;
  alertColor?: string;
}

/**
 * Signal Color Calculator
 *
 * Handles color determination logic for Signal series.
 * Detects whether data contains boolean-only values (0/1 or true/false)
 * or includes other numeric values to determine whether to use alertColor.
 */
export class SignalColorCalculator {
  /**
   * Check if data contains any values that are not 0 or 1.
   * This determines whether alertColor should be used.
   *
   * Handles both boolean (true/false) and numeric (0/1) values by
   * converting to numbers first: Number(false) = 0, Number(true) = 1
   *
   * @param values - Array of values to check
   * @returns True if any value is not 0 or 1, false otherwise
   */
  static checkForNonBooleanValues(values: number[]): boolean {
    for (const value of values) {
      const numValue = Number(value);
      if (numValue !== 0 && numValue !== 1) {
        return true; // Has non-boolean values (e.g., 2, -1, etc.)
      }
    }
    return false; // All values are boolean (0/1 or false/true)
  }

  /**
   * Get color for a signal value
   *
   * Color mapping:
   * - value = 0 → neutralColor
   * - value > 0 → signalColor
   * - value < 0 → alertColor (only if hasNonBooleanValues), else signalColor
   *
   * Converts boolean values to numbers to handle both true/false and 0/1:
   * - Number(false) = 0 → neutralColor
   * - Number(true) = 1 → signalColor
   *
   * @param value - The signal value (can be boolean or number)
   * @param options - Color options
   * @param hasNonBooleanValues - Whether dataset contains non-boolean values
   * @returns The appropriate color string
   */
  static getColorForValue(
    value: number,
    options: SignalColorOptions,
    hasNonBooleanValues: boolean
  ): string {
    const numValue = Number(value);

    if (numValue === 0) {
      return options.neutralColor || 'transparent';
    } else if (numValue > 0) {
      return options.signalColor || 'transparent';
    } else {
      // Only use alertColor if data contains non-boolean values
      // For boolean-only data (0, 1), negative values shouldn't exist,
      // but if they do due to data issues, use signalColor as fallback
      if (hasNonBooleanValues) {
        return options.alertColor || options.signalColor || 'transparent';
      } else {
        return options.signalColor || 'transparent';
      }
    }
  }
}
