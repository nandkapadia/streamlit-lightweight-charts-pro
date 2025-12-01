/**
 * @fileoverview Performance Optimization Utilities
 *
 * Performance utilities for optimizing chart rendering and operations.
 * Provides deep comparison, DOM caching, and timing helpers.
 *
 * This module provides:
 * - Deep object comparison without JSON.stringify
 * - DOM query caching for performance
 * - Performance timing wrappers
 * - Development-only logging
 *
 * Features:
 * - Optimized recursive comparison
 * - Automatic cache expiration (5s)
 * - Production-friendly (minimal overhead)
 * - Type-safe comparison helpers
 *
 * @example
 * ```typescript
 * import { deepCompare, getCachedDOMElement } from './performance';
 *
 * // Efficient comparison
 * if (!deepCompare(oldConfig, newConfig)) {
 *   updateChart(newConfig);
 * }
 *
 * // Cached DOM queries
 * const container = getCachedDOMElement('#chart-container');
 * ```
 */

import { Singleton } from './SingletonBase';

// Production logging control
const isDevelopment = process.env.NODE_ENV === 'development';

export const perfLog = {
  log: (..._: unknown[]) => {
    if (isDevelopment) {
      // Performance logging disabled in favor of logger utility
    }
  },
  warn: (..._: unknown[]) => {
    if (isDevelopment) {
      // Performance logging disabled in favor of logger utility
    }
  },
  error: (..._: unknown[]) => {
    // Always log errors, even in production
    // Performance logging disabled in favor of logger utility
  },
};

// Performance logging function for timing operations
export function perfLogFn<T>(_operationName: string, fn: () => T): T {
  const result = fn();
  return result;
}

// Optimized deep comparison without JSON.stringify
export function deepCompare(objA: unknown, objB: unknown): boolean {
  if (objA === objB) return true;

  if (typeof objA !== 'object' || objA === null || typeof objB !== 'object' || objB === null) {
    return false;
  }

  const keysA = Object.keys(objA as Record<string, unknown>);
  const keysB = Object.keys(objB as Record<string, unknown>);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(objB, key)) return false;

    const valA = (objA as Record<string, unknown>)[key];
    const valB = (objB as Record<string, unknown>)[key];

    if (typeof valA === 'object' && typeof valB === 'object') {
      if (!deepCompare(valA, valB)) return false;
    } else if (valA !== valB) {
      return false;
    }
  }

  return true;
}

// Optimized DOM query with caching
const domQueryCache = new Map<string, HTMLElement | null>();

export function getCachedDOMElement(selector: string): HTMLElement | null {
  if (domQueryCache.has(selector)) {
    return domQueryCache.get(selector) || null;
  }

  const element = document.querySelector(selector) as HTMLElement | null;
  domQueryCache.set(selector, element);

  // Clear cache after a delay to allow for DOM changes
  setTimeout(() => {
    domQueryCache.delete(selector);
  }, 5000);

  return element;
}

// Alternative implementation for testing
export function getCachedDOMElementForTesting(
  id: string,
  cache: Map<string, HTMLElement>,
  createFn: ((_id: string) => HTMLElement | null) | null
): HTMLElement | null {
  if (cache.has(id)) {
    return cache.get(id) || null;
  }

  if (!createFn || typeof createFn !== 'function') {
    return null;
  }

  const element = createFn(id);
  if (element) {
    cache.set(id, element);
  }

  return element;
}

// Debounce function with improved performance
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Generic debounce requires any for flexibility
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate = false
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function executedFunction(..._args: Parameters<T>) {
    const later = () => {
      timeout = null;
      if (!immediate) func(..._args);
    };

    const callNow = immediate && !timeout;

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);

    if (callNow) func(..._args);
  };
}

// Throttle function for performance-critical operations
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Generic throttle requires any for flexibility
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(..._args: Parameters<T>) {
    if (!inThrottle) {
      func(..._args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * LRU (Least Recently Used) cache implementation for memoization.
 * Automatically evicts oldest entries when maxSize is reached.
 */
class LRUCache<K, V> {
  private cache = new Map<K, V>();
  private readonly maxSize: number;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    if (!this.cache.has(key)) {
      return undefined;
    }
    // Move to end (most recently used)
    const value = this.cache.get(key)!;
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  set(key: K, value: V): void {
    // If key exists, delete it first to update position
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Evict oldest entry (first key in map)
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, value);
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}

/**
 * Memoization utility for expensive calculations with LRU cache eviction.
 *
 * @param func - The function to memoize
 * @param resolver - Optional custom key resolver function
 * @param maxCacheSize - Maximum number of entries to cache (default: 100)
 * @returns Memoized function with bounded cache
 *
 * @example
 * ```typescript
 * const expensiveCalc = memoize(
 *   (x: number, y: number) => x * y,
 *   (x, y) => `${x}-${y}`,
 *   50 // Cache up to 50 results
 * );
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Generic memoize requires any for flexibility
export function memoize<T extends (...args: any[]) => any>(
  func: T,
  resolver?: (...args: Parameters<T>) => string,
  maxCacheSize: number = 100
): T {
  const cache = new LRUCache<string, ReturnType<T>>(maxCacheSize);

  return ((..._args: Parameters<T>) => {
    const key = resolver ? resolver(..._args) : JSON.stringify(_args);

    const cached = cache.get(key);
    if (cached !== undefined) {
      return cached;
    }

    const result = func(..._args) as ReturnType<T>;
    cache.set(key, result);
    return result;
  }) as T;
}

// Batch DOM updates for better performance
export function batchDOMUpdates(updates: (() => void)[]): void {
  if (typeof window !== 'undefined') {
    requestAnimationFrame(() => {
      updates.forEach(update => update());
    });
  } else {
    updates.forEach(update => update());
  }
}

// Efficient dimension calculation with caching
export const getCachedDimensions = memoize(
  (element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    return {
      width: rect.width,
      height: rect.height,
      top: rect.top,
      left: rect.left,
    };
  },
  (element: HTMLElement) => `${element.offsetWidth}-${element.offsetHeight}`
);

// Performance monitoring utility
@Singleton()
export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();

  startTimer(name: string): () => void {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      if (!this.metrics.has(name)) {
        this.metrics.set(name, []);
      }
      const metrics = this.metrics.get(name);
      if (metrics) {
        metrics.push(duration);
      }

      // Log slow operations in development
      if (isDevelopment && duration > 16) {
        perfLog.warn(`Slow operation detected: ${name} took ${duration.toFixed(2)}ms`);
      }
    };
  }

  getMetrics(
    name?: string
  ): Record<string, { avg: number; min: number; max: number; count: number }> {
    const result: Record<string, { avg: number; min: number; max: number; count: number }> = {};

    if (name) {
      const values = this.metrics.get(name);
      if (values && values.length > 0) {
        result[name] = {
          avg: values.reduce((a, b) => a + b, 0) / values.length,
          min: Math.min(...values),
          max: Math.max(...values),
          count: values.length,
        };
      }
    } else {
      this.metrics.forEach((values, key) => {
        if (values.length > 0) {
          result[key] = {
            avg: values.reduce((a, b) => a + b, 0) / values.length,
            min: Math.min(...values),
            max: Math.max(...values),
            count: values.length,
          };
        }
      });
    }

    return result;
  }

  clearMetrics(): void {
    this.metrics.clear();
  }
}

// Efficient object comparison for React dependencies
export function shallowEqual(objA: unknown, objB: unknown): boolean {
  if (objA === objB) return true;

  if (typeof objA !== 'object' || objA === null || typeof objB !== 'object' || objB === null) {
    return false;
  }

  const keysA = Object.keys(objA as Record<string, unknown>);
  const keysB = Object.keys(objB as Record<string, unknown>);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    const recA = objA as Record<string, unknown>;
    const recB = objB as Record<string, unknown>;
    if (!Object.prototype.hasOwnProperty.call(objB, key) || recA[key] !== recB[key]) {
      return false;
    }
  }

  return true;
}

// Deep comparison for complex objects (use sparingly)
export function deepEqual(objA: unknown, objB: unknown): boolean {
  return deepCompare(objA, objB);
}

// Efficient array operations
export function arrayEquals<T>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((val, index) => val === b[index]);
}

// Memory-efficient object cloning
export function shallowClone<T>(obj: T): T {
  if (Array.isArray(obj)) {
    return [...obj] as T;
  }
  if (obj && typeof obj === 'object') {
    return { ...obj };
  }
  return obj;
}

// Intersection Observer for lazy loading
export function createIntersectionObserver(
  callback: (_entries: IntersectionObserverEntry[]) => void,
  options: IntersectionObserverInit = {}
): IntersectionObserver {
  return new IntersectionObserver(callback, {
    rootMargin: '50px',
    threshold: 0.1,
    ...options,
  });
}

/**
 * Stored listener entry with element reference for proper cleanup.
 */
interface ListenerEntry {
  element: EventTarget;
  event: string;
  listener: EventListener;
}

/**
 * Efficient event listener management with proper cleanup support.
 * Stores element references to enable removeAllListeners() to actually
 * remove the listeners from the DOM.
 */
export class EventManager {
  private listeners: Map<string, ListenerEntry[]> = new Map();
  private elementIdCounter = 0;
  private elementIds = new WeakMap<EventTarget, number>();

  private getElementId(element: EventTarget): number {
    let id = this.elementIds.get(element);
    if (id === undefined) {
      id = ++this.elementIdCounter;
      this.elementIds.set(element, id);
    }
    return id;
  }

  addEventListener(element: EventTarget, event: string, listener: EventListener): void {
    const elementId = this.getElementId(element);
    const key = `${elementId}-${event}`;

    if (!this.listeners.has(key)) {
      this.listeners.set(key, []);
    }

    const entries = this.listeners.get(key)!;
    entries.push({ element, event, listener });
    element.addEventListener(event, listener);
  }

  removeEventListener(element: EventTarget, event: string, listener: EventListener): void {
    const elementId = this.getElementId(element);
    const key = `${elementId}-${event}`;
    const entries = this.listeners.get(key);

    if (entries) {
      const index = entries.findIndex(e => e.listener === listener);
      if (index !== -1) {
        entries.splice(index, 1);
        element.removeEventListener(event, listener);
        if (entries.length === 0) {
          this.listeners.delete(key);
        }
      }
    }
  }

  removeAllListeners(): void {
    this.listeners.forEach(entries => {
      entries.forEach(({ element, event, listener }) => {
        try {
          element.removeEventListener(event, listener);
        } catch {
          // Element may have been removed from DOM
        }
      });
    });
    this.listeners.clear();
  }

  /**
   * Remove all listeners for a specific element.
   */
  removeAllListenersForElement(element: EventTarget): void {
    const elementId = this.getElementId(element);
    const keysToDelete: string[] = [];

    this.listeners.forEach((entries, key) => {
      if (key.startsWith(`${elementId}-`)) {
        entries.forEach(({ event, listener }) => {
          try {
            element.removeEventListener(event, listener);
          } catch {
            // Element may have been removed from DOM
          }
        });
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.listeners.delete(key));
  }
}

// Global event manager instance
export const globalEventManager = new EventManager();

/** Style object type for CSS properties */
export type StyleObject = Record<string, string | number | undefined>;

// Simple style creation for testing
export function createOptimizedStyles<T extends StyleObject | null | undefined>(styles: T): T extends null | undefined ? Record<string, never> : T {
  if (styles === null || styles === undefined) {
    return {} as T extends null | undefined ? Record<string, never> : T;
  }
  return styles as T extends null | undefined ? Record<string, never> : T;
}

/** Chart options for style calculation */
export interface ChartStyleOptions {
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number | string;
  maxHeight?: number | string;
}

/** Optimized styles result */
export interface OptimizedStyles {
  container: {
    position: 'relative';
    border: string;
    borderRadius: string;
    padding: string;
    width: string;
    height: string;
    minWidth?: number;
    minHeight?: number;
    maxWidth?: number | string;
    maxHeight?: number | string;
  };
  chartContainer: {
    width: string;
    height: string;
    position: 'relative';
  };
}

// Style optimization utilities
export const createOptimizedStylesAdvanced = memoize(
  (
    width: number | null,
    height: number | null,
    shouldAutoSize: boolean,
    chartOptions: ChartStyleOptions = {}
  ): OptimizedStyles => {
    return {
      container: {
        position: 'relative' as const,
        border: 'none',
        borderRadius: '0px',
        padding: '0px',
        width:
          shouldAutoSize || width === null
            ? '100%'
            : typeof width === 'number'
              ? `${width}px`
              : '100%',
        height: shouldAutoSize
          ? '100%'
          : typeof height === 'number'
            ? `${height}px`
            : '100%',
        minWidth: chartOptions.minWidth || (shouldAutoSize ? 200 : undefined),
        minHeight: chartOptions.minHeight || (shouldAutoSize ? 200 : undefined),
        maxWidth: chartOptions.maxWidth,
        maxHeight: chartOptions.maxHeight,
      },
      chartContainer: {
        width:
          shouldAutoSize || width === null
            ? '100%'
            : typeof width === 'number'
              ? `${width}px`
              : '100%',
        height: shouldAutoSize
          ? '100%'
          : typeof height === 'number'
            ? `${height}px`
            : '100%',
        position: 'relative' as const,
      },
    };
  },
  (width, height, shouldAutoSize, chartOptions) =>
    `${width}-${height}-${shouldAutoSize}-${JSON.stringify(chartOptions)}`
);
