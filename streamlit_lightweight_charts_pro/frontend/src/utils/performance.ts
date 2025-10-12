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
  log: (..._: any[]) => {
    if (isDevelopment) {
      // Performance logging disabled in favor of logger utility
    }
  },
  warn: (..._: any[]) => {
    if (isDevelopment) {
      // Performance logging disabled in favor of logger utility
    }
  },
  error: (..._: any[]) => {
    // Always log errors, even in production
    // Performance logging disabled in favor of logger utility
  },
};

// Performance logging function for timing operations
export function perfLogFn(_operationName: string, fn: () => any): any {
  const result = fn();
  return result;
}

// Optimized deep comparison without JSON.stringify
export function deepCompare(objA: any, objB: any): boolean {
  if (objA === objB) return true;

  if (typeof objA !== 'object' || objA === null || typeof objB !== 'object' || objB === null) {
    return false;
  }

  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(objB, key)) return false;

    const valA = objA[key];
    const valB = objB[key];

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
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate = false
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

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

// Memoization utility for expensive calculations
export function memoize<T extends (...args: any[]) => any>(
  func: T,
  resolver?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();

  return ((..._args: Parameters<T>) => {
    const key = resolver ? resolver(..._args) : JSON.stringify(_args);

    if (cache.has(key)) {
      return cache.get(key);
    }

    const result = func(..._args);
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
export function shallowEqual(objA: any, objB: any): boolean {
  if (objA === objB) return true;

  if (typeof objA !== 'object' || objA === null || typeof objB !== 'object' || objB === null) {
    return false;
  }

  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(objB, key) || objA[key] !== objB[key]) {
      return false;
    }
  }

  return true;
}

// Deep comparison for complex objects (use sparingly)
export function deepEqual(objA: any, objB: any): boolean {
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

// Efficient event listener management
export class EventManager {
  private listeners: Map<string, Set<EventListener>> = new Map();

  addEventListener(element: EventTarget, event: string, listener: EventListener): void {
    const key = `${element}-${event}`;
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    const listeners = this.listeners.get(key);
    if (listeners) {
      listeners.add(listener);
    }
    element.addEventListener(event, listener);
  }

  removeEventListener(element: EventTarget, event: string, listener: EventListener): void {
    const key = `${element}-${event}`;
    const listeners = this.listeners.get(key);
    if (listeners) {
      listeners.delete(listener);
      element.removeEventListener(event, listener);
      if (listeners.size === 0) {
        this.listeners.delete(key);
      }
    }
  }

  removeAllListeners(): void {
    this.listeners.forEach(listeners => {
      listeners.forEach(() => {
        // Note: This is a simplified version - in practice you'd need to store the actual element reference
        perfLog.warn('EventManager: removeAllListeners called but element reference not available');
      });
    });
    this.listeners.clear();
  }
}

// Global event manager instance
export const globalEventManager = new EventManager();

// Simple style creation for testing
export function createOptimizedStyles(styles: any): any {
  if (styles === null || styles === undefined) {
    return {};
  }
  return styles;
}

// Style optimization utilities
export const createOptimizedStylesAdvanced = memoize(
  (
    width: number | null,
    height: number | null,
    shouldAutoSize: boolean,
    chartOptions: any = {}
  ) => {
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
              : width || '100%',
        height: shouldAutoSize
          ? '100%'
          : typeof height === 'number'
            ? `${height}px`
            : height || '100%',
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
              : width || '100%',
        height: shouldAutoSize
          ? '100%'
          : typeof height === 'number'
            ? `${height}px`
            : height || '100%',
        position: 'relative' as const,
      },
    };
  },
  (width, height, shouldAutoSize, chartOptions) =>
    `${width}-${height}-${shouldAutoSize}-${JSON.stringify(chartOptions)}`
);
