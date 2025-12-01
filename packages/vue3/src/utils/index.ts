/**
 * @fileoverview Utility functions for the Vue 3 Lightweight Charts package.
 */

/**
 * Convert various time formats to Unix timestamp in seconds.
 *
 * @param time - Time value (number, string, or Date)
 * @returns Unix timestamp in seconds
 */
export function toTimestamp(time: number | string | Date): number {
  if (typeof time === 'number') {
    // If it looks like milliseconds, convert to seconds
    return time > 1e12 ? Math.floor(time / 1000) : time;
  }

  if (typeof time === 'string') {
    const parsed = Date.parse(time);
    return isNaN(parsed) ? 0 : Math.floor(parsed / 1000);
  }

  if (time instanceof Date) {
    return Math.floor(time.getTime() / 1000);
  }

  return 0;
}

/**
 * Format timestamp for display.
 *
 * @param timestamp - Unix timestamp in seconds
 * @param format - Format type ('date', 'datetime', 'time')
 * @returns Formatted string
 */
export function formatTimestamp(
  timestamp: number,
  format: 'date' | 'datetime' | 'time' = 'date'
): string {
  const date = new Date(timestamp * 1000);

  switch (format) {
    case 'date':
      return date.toLocaleDateString();
    case 'datetime':
      return date.toLocaleString();
    case 'time':
      return date.toLocaleTimeString();
    default:
      return date.toLocaleDateString();
  }
}

/**
 * Deep merge two objects.
 *
 * @param target - Target object
 * @param source - Source object
 * @returns Merged object
 */
export function deepMerge<T extends Record<string, unknown>>(
  target: T,
  source: Partial<T>
): T {
  const result = { ...target };

  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const targetValue = target[key];
      const sourceValue = source[key];

      if (
        isPlainObject(targetValue) &&
        isPlainObject(sourceValue)
      ) {
        result[key] = deepMerge(
          targetValue as Record<string, unknown>,
          sourceValue as Record<string, unknown>
        ) as T[typeof key];
      } else if (sourceValue !== undefined) {
        result[key] = sourceValue as T[typeof key];
      }
    }
  }

  return result;
}

/**
 * Check if value is a plain object.
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Debounce a function.
 *
 * @param fn - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delay);
  };
}

/**
 * Throttle a function.
 *
 * @param fn - Function to throttle
 * @param limit - Minimum time between calls in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    const now = Date.now();
    const remaining = limit - (now - lastCall);

    if (remaining <= 0) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      lastCall = now;
      fn(...args);
    } else if (!timeoutId) {
      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        timeoutId = null;
        fn(...args);
      }, remaining);
    }
  };
}

/**
 * Generate a unique ID.
 */
export function generateId(prefix: string = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Clamp a value between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
