/**
 * @fileoverview Unified data validation utilities for series plugins
 *
 * Provides DRY-compliant validation functions to eliminate code duplication
 * across series plugins and ensure consistent data validation.
 */

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Data validation configuration
 */
export interface ValidationConfig {
  /** Required fields that must be present */
  required?: string[];
  /** Numeric fields that must be valid numbers */
  numeric?: string[];
  /** Fields that must be finite numbers */
  finite?: string[];
  /** Fields that can be null */
  nullable?: string[];
  /** Fields that can be undefined */
  optional?: string[];
  /** Custom validation functions */
  custom?: Array<{
    field: string;
    validator: (value: any, data: any) => boolean;
    message: string;
  }>;
}

/**
 * Validate data object against configuration
 *
 * @param data - Data object to validate
 * @param config - Validation configuration
 * @returns Validation result with errors and warnings
 */
export function validateData(
  data: Record<string, any>,
  config: ValidationConfig
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required fields
  if (config.required) {
    for (const field of config.required) {
      if (!(field in data) || data[field] === undefined) {
        errors.push(`Required field '${field}' is missing`);
      }
    }
  }

  // Check numeric fields
  if (config.numeric) {
    for (const field of config.numeric) {
      const value = data[field];
      if (value !== null && value !== undefined) {
        if (typeof value !== 'number') {
          errors.push(`Field '${field}' must be a number, got ${typeof value}`);
        } else if (isNaN(value)) {
          errors.push(`Field '${field}' is NaN`);
        }
      }
    }
  }

  // Check finite fields
  if (config.finite) {
    for (const field of config.finite) {
      const value = data[field];
      if (typeof value === 'number' && !isFinite(value)) {
        errors.push(`Field '${field}' must be finite, got ${value}`);
      }
    }
  }

  // Check nullable fields
  if (config.nullable) {
    for (const field of config.nullable) {
      const value = data[field];
      if (value !== null && value !== undefined && typeof value !== 'number') {
        warnings.push(`Field '${field}' is expected to be numeric or null, got ${typeof value}`);
      }
    }
  }

  // Run custom validators
  if (config.custom) {
    for (const { field, validator, message } of config.custom) {
      const value = data[field];
      if (!validator(value, data)) {
        errors.push(`Custom validation failed for '${field}': ${message}`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate array of data objects
 *
 * @param dataArray - Array of data objects to validate
 * @param config - Validation configuration
 * @returns Array of validation results
 */
export function validateDataArray(
  dataArray: Record<string, any>[],
  config: ValidationConfig
): ValidationResult[] {
  return dataArray.map((data, index) => {
    const result = validateData(data, config);

    // Add index context to errors
    if (!result.isValid) {
      result.errors = result.errors.map(error => `[${index}]: ${error}`);
    }

    return result;
  });
}

/**
 * Filter valid data items from array
 *
 * @param dataArray - Array of data objects to filter
 * @param config - Validation configuration
 * @returns Array of valid data objects
 */
export function filterValidData<T extends Record<string, any>>(
  dataArray: T[],
  config: ValidationConfig
): T[] {
  return dataArray.filter((data, _index) => {
    const result = validateData(data, config);

    if (!result.isValid) {
      return false;
    }

    return true;
  });
}

/**
 * Predefined validation configurations for common series types
 */
export const ValidationConfigs = {
  /** Configuration for ribbon data (upper, lower values) */
  ribbon: {
    required: ['time', 'upper', 'lower'],
    numeric: ['upper', 'lower'],
    finite: ['upper', 'lower'],
  } as ValidationConfig,

  /** Configuration for band data (upper, middle, lower values) */
  band: {
    required: ['time', 'upper', 'middle', 'lower'],
    numeric: ['upper', 'middle', 'lower'],
    finite: ['upper', 'middle', 'lower'],
  } as ValidationConfig,

  /** Configuration for gradient ribbon data */
  gradientRibbon: {
    required: ['time', 'upper', 'lower'],
    numeric: ['upper', 'lower'],
    finite: ['upper', 'lower'],
    optional: ['fillColor'],
    custom: [
      {
        field: 'fillColor',
        validator: value => value === undefined || typeof value === 'string',
        message: 'fillColor must be a string or undefined',
      },
    ],
  } as ValidationConfig,

  /** Configuration for single value data */
  singleValue: {
    required: ['time', 'value'],
    numeric: ['value'],
    finite: ['value'],
  } as ValidationConfig,

  /** Configuration for OHLC data */
  ohlc: {
    required: ['time', 'open', 'high', 'low', 'close'],
    numeric: ['open', 'high', 'low', 'close'],
    finite: ['open', 'high', 'low', 'close'],
    custom: [
      {
        field: 'high',
        validator: (value, data) => value >= Math.max(data.open, data.close),
        message: 'high must be >= max(open, close)',
      },
      {
        field: 'low',
        validator: (value, data) => value <= Math.min(data.open, data.close),
        message: 'low must be <= min(open, close)',
      },
    ],
  } as ValidationConfig,
};

/**
 * Quick validation functions for common patterns
 */
export const QuickValidators = {
  /** Check if value is a valid number */
  isNumber: (value: any): boolean => typeof value === 'number' && !isNaN(value) && isFinite(value),

  /** Check if value is a valid finite number */
  isFiniteNumber: (value: any): boolean => typeof value === 'number' && isFinite(value),

  /** Check if value is null or valid number */
  isNumberOrNull: (value: any): boolean => value === null || QuickValidators.isNumber(value),

  /** Check if value is undefined or valid number */
  isNumberOrUndefined: (value: any): boolean =>
    value === undefined || QuickValidators.isNumber(value),

  /** Check if all values in object are valid numbers */
  areAllNumbers: (data: Record<string, any>, keys: string[]): boolean => {
    return keys.every(key => QuickValidators.isNumber(data[key]));
  },

  /** Check if all values in object are finite numbers */
  areAllFiniteNumbers: (data: Record<string, any>, keys: string[]): boolean => {
    return keys.every(key => QuickValidators.isFiniteNumber(data[key]));
  },
};
