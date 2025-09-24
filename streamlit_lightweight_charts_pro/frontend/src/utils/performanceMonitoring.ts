/**
 * Performance monitoring utilities for production optimization
 * Tracks bundle size, loading times, and runtime performance
 */

import { useEffect, useCallback } from 'react';

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  category: 'bundle' | 'runtime' | 'loading' | 'memory';
}

interface BundleMetrics {
  initialBundleSize: number;
  chunkSizes: Record<string, number>;
  loadTime: number;
  cacheHitRate: number;
}

interface RuntimeMetrics {
  componentRenderTime: Record<string, number>;
  chartInitTime: number;
  seriesCreationTime: number;
  memoryUsage: number;
}

/**
 * Performance monitoring manager
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetric[] = [];
  private observers: PerformanceObserver[] = [];
  private enabled: boolean = false;

  static getInstance(): PerformanceMonitor {
    if (!this.instance) {
      this.instance = new PerformanceMonitor();
    }
    return this.instance;
  }

  /**
   * Enable performance monitoring
   */
  enable(): void {
    if (this.enabled) return;

    this.enabled = true;
    this.setupObservers();
    this.startMonitoring();
  }

  /**
   * Disable performance monitoring
   */
  disable(): void {
    this.enabled = false;
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }

  /**
   * Record a performance metric
   */
  recordMetric(
    name: string,
    value: number,
    category: PerformanceMetric['category'] = 'runtime'
  ): void {
    if (!this.enabled) return;

    this.metrics.push({
      name,
      value,
      timestamp: performance.now(),
      category,
    });

    // Keep only last 1000 metrics to prevent memory issues
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  /**
   * Start timing a process
   */
  startTiming(name: string): () => void {
    if (!this.enabled) return () => {};

    const startTime = performance.now();
    return () => {
      const duration = performance.now() - startTime;
      this.recordMetric(name, duration, 'runtime');
    };
  }

  /**
   * Measure component render time
   */
  measureComponentRender<T>(componentName: string, renderFunction: () => T): T {
    if (!this.enabled) return renderFunction();

    const endTiming = this.startTiming(`${componentName}.render`);
    const result = renderFunction();
    endTiming();
    return result;
  }

  /**
   * Get bundle size metrics
   */
  getBundleMetrics(): BundleMetrics {
    const metrics: BundleMetrics = {
      initialBundleSize: 0,
      chunkSizes: {},
      loadTime: 0,
      cacheHitRate: 0,
    };

    try {
      // Get initial bundle size from performance entries
      const navigationEntry = performance.getEntriesByType(
        'navigation'
      )[0] as PerformanceNavigationTiming;
      if (navigationEntry) {
        metrics.loadTime = navigationEntry.loadEventEnd - navigationEntry.fetchStart;
      }

      // Get resource sizes
      const resourceEntries = performance.getEntriesByType(
        'resource'
      ) as PerformanceResourceTiming[];
      let totalSize = 0;
      let cacheHits = 0;

      resourceEntries.forEach(entry => {
        if (entry.name.includes('.js') || entry.name.includes('.css')) {
          const size = entry.transferSize || 0;
          totalSize += size;

          // Determine if it was cached
          if (entry.transferSize === 0 && entry.decodedBodySize > 0) {
            cacheHits++;
          }

          // Extract chunk name from URL
          const chunkMatch = entry.name.match(/(\w+)\.[a-f0-9]+\.(js|css)$/);
          if (chunkMatch) {
            metrics.chunkSizes[chunkMatch[1]] = size;
          }
        }
      });

      metrics.initialBundleSize = totalSize;
      metrics.cacheHitRate = resourceEntries.length > 0 ? cacheHits / resourceEntries.length : 0;
    } catch {
      // Ignore errors in metrics collection
    }

    return metrics;
  }

  /**
   * Get runtime performance metrics
   */
  getRuntimeMetrics(): RuntimeMetrics {
    const componentRenderTimes: Record<string, number> = {};
    let chartInitTime = 0;
    let seriesCreationTime = 0;
    let memoryUsage = 0;

    // Aggregate component render times
    this.metrics
      .filter(m => m.category === 'runtime' && m.name.includes('.render'))
      .forEach(metric => {
        const componentName = metric.name.replace('.render', '');
        if (!componentRenderTimes[componentName]) {
          componentRenderTimes[componentName] = 0;
        }
        componentRenderTimes[componentName] += metric.value;
      });

    // Get specific timing metrics
    const chartInitMetric = this.metrics.filter(m => m.name === 'chartInit').slice(-1)[0];
    if (chartInitMetric) {
      chartInitTime = chartInitMetric.value;
    }

    const seriesMetric = this.metrics.filter(m => m.name === 'seriesCreation').slice(-1)[0];
    if (seriesMetric) {
      seriesCreationTime = seriesMetric.value;
    }

    // Get memory usage
    try {
      const memInfo = (
        performance as Performance & {
          memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number };
        }
      ).memory;
      if (memInfo) {
        memoryUsage = memInfo.usedJSHeapSize;
      }
    } catch {
      // Memory API not available
    }

    return {
      componentRenderTime: componentRenderTimes,
      chartInitTime,
      seriesCreationTime,
      memoryUsage,
    };
  }

  /**
   * Get performance summary
   */
  getSummary(): {
    bundle: BundleMetrics;
    runtime: RuntimeMetrics;
    recommendations: string[];
  } {
    const bundle = this.getBundleMetrics();
    const runtime = this.getRuntimeMetrics();
    const recommendations: string[] = [];

    // Generate recommendations based on metrics
    if (bundle.initialBundleSize > 1024 * 1024) {
      // > 1MB
      recommendations.push('Consider code splitting to reduce initial bundle size');
    }

    if (bundle.cacheHitRate < 0.5) {
      recommendations.push('Improve caching strategy for better performance');
    }

    if (runtime.chartInitTime > 1000) {
      // > 1 second
      recommendations.push('Chart initialization is slow, consider lazy loading');
    }

    if (runtime.memoryUsage > 50 * 1024 * 1024) {
      // > 50MB
      recommendations.push('High memory usage detected, check for memory leaks');
    }

    const avgRenderTime =
      Object.values(runtime.componentRenderTime).reduce((sum, time) => sum + time, 0) /
      Object.keys(runtime.componentRenderTime).length;

    if (avgRenderTime > 16) {
      // > 16ms (60fps threshold)
      recommendations.push('Component render times are slow, consider optimization');
    }

    return {
      bundle,
      runtime,
      recommendations,
    };
  }

  /**
   * Setup performance observers
   */
  private setupObservers(): void {
    try {
      // Observe long tasks
      if ('PerformanceObserver' in window) {
        const longTaskObserver = new PerformanceObserver(list => {
          list.getEntries().forEach(entry => {
            this.recordMetric('longTask', entry.duration, 'runtime');
          });
        });
        longTaskObserver.observe({ entryTypes: ['longtask'] });
        this.observers.push(longTaskObserver);

        // Observe layout shifts
        const layoutShiftObserver = new PerformanceObserver(list => {
          list.getEntries().forEach(entry => {
            this.recordMetric(
              'layoutShift',
              (entry as PerformanceEntry & { value?: number }).value || 0,
              'runtime'
            );
          });
        });
        layoutShiftObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(layoutShiftObserver);
      }
    } catch {
      // Observers not supported
    }
  }

  /**
   * Start periodic monitoring
   */
  private startMonitoring(): void {
    // Monitor memory usage periodically
    const monitorMemory = () => {
      try {
        const memInfo = (
          performance as Performance & {
            memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number };
          }
        ).memory;
        if (memInfo) {
          this.recordMetric('memoryUsage', memInfo.usedJSHeapSize, 'memory');
        }
      } catch {
        // Memory API not available
      }
    };

    // Run every 30 seconds
    setInterval(monitorMemory, 30000);
    monitorMemory(); // Initial measurement
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics(): string {
    return JSON.stringify(
      {
        timestamp: Date.now(),
        metrics: this.metrics,
        summary: this.getSummary(),
      },
      null,
      2
    );
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
  }
}

/**
 * Decorator for measuring function execution time
 */
export function measureExecutionTime(
  target: any,
  propertyName: string,
  descriptor: PropertyDescriptor
): PropertyDescriptor {
  const method = descriptor.value;

  descriptor.value = function (...args: any[]) {
    const monitor = PerformanceMonitor.getInstance();
    const endTiming = monitor.startTiming(`${target.constructor.name}.${propertyName}`);

    try {
      const result = method.apply(this, args);

      // Handle async functions
      if (result && typeof result.then === 'function') {
        return result.finally(() => endTiming());
      }

      endTiming();
      return result;
    } catch (error) {
      endTiming();
      throw error;
    }
  };

  return descriptor;
}

/**
 * Hook for measuring React component performance
 */
export function usePerformanceMonitoring(componentName: string) {
  const monitor = PerformanceMonitor.getInstance();

  useEffect(() => {
    const endTiming = monitor.startTiming(`${componentName}.mount`);
    return endTiming;
  }, [componentName, monitor]);

  const measureRender = useCallback(
    (renderFn: () => any) => {
      return monitor.measureComponentRender(componentName, renderFn);
    },
    [componentName, monitor]
  );

  return { measureRender };
}

// Initialize monitoring in production
if (process.env.NODE_ENV === 'production') {
  PerformanceMonitor.getInstance().enable();
}

export default PerformanceMonitor;
