/**
 * @fileoverview React 19 Performance Monitor
 *
 * Enhanced performance monitoring specifically for React 19 features.
 * Tracks concurrent features, transitions, and Suspense performance.
 *
 * This module provides:
 * - React 19 transition tracking
 * - Suspense loading time monitoring
 * - Concurrent rendering metrics
 * - Deferred value performance
 * - FlushSync operation counting
 *
 * Features:
 * - Singleton pattern for global performance tracking
 * - Development-only logging for performance insights
 * - Transition timing with component identification
 * - Suspense boundary performance monitoring
 * - Deferred value delay tracking
 *
 * @example
 * ```typescript
 * import { React19PerformanceMonitor } from './react19PerformanceMonitor';
 *
 * const monitor = React19PerformanceMonitor.getInstance();
 * const transitionId = monitor.startTransition('ChartComponent', 'series');
 * // ... perform transition
 * monitor.endTransition(transitionId);
 * ```
 */

import { logger } from './logger';

interface React19Metrics {
  transitionDuration: number;
  suspenseLoadTime: number;
  concurrentRenderTime: number;
  deferredValueDelay: number;
  flushSyncCount: number;
}

interface TransitionMetrics {
  startTime: number;
  endTime?: number;
  componentName: string;
  transitionType: 'series' | 'sync' | 'chart' | 'resize';
}

class React19PerformanceMonitor {
  private static instance: React19PerformanceMonitor;
  private metrics: React19Metrics = {
    transitionDuration: 0,
    suspenseLoadTime: 0,
    concurrentRenderTime: 0,
    deferredValueDelay: 0,
    flushSyncCount: 0,
  };
  private activeTransitions: Map<string, TransitionMetrics> = new Map();
  private suspenseLoadTimes: Map<string, number> = new Map();
  private deferredValueTimings: Map<string, number> = new Map();

  static getInstance(): React19PerformanceMonitor {
    if (!React19PerformanceMonitor.instance) {
      React19PerformanceMonitor.instance = new React19PerformanceMonitor();
    }
    return React19PerformanceMonitor.instance;
  }

  /**
   * Start tracking a transition
   */
  startTransition(
    componentName: string,
    transitionType: TransitionMetrics['transitionType']
  ): string {
    const transitionId = `${componentName}-${transitionType}-${performance.now()}`;
    const metrics: TransitionMetrics = {
      startTime: performance.now(),
      componentName,
      transitionType,
    };

    this.activeTransitions.set(transitionId, metrics);

    if (process.env.NODE_ENV === 'development') {
      logger.info(
        `Starting transition: ${componentName} (${transitionType})`,
        'React19PerformanceMonitor'
      );
    }

    return transitionId;
  }

  /**
   * End tracking a transition
   */
  endTransition(transitionId: string): void {
    const transition = this.activeTransitions.get(transitionId);
    if (!transition) return;

    const endTime = performance.now();
    const duration = endTime - transition.startTime;

    transition.endTime = endTime;
    this.metrics.transitionDuration = Math.max(this.metrics.transitionDuration, duration);

    if (process.env.NODE_ENV === 'development') {
      const status = duration > 16 ? '⚠️ SLOW' : '✅ FAST';
      logger.info(
        `${status} React 19 Transition Completed: ${transition.componentName} (${transition.transitionType}) - ${duration.toFixed(2)}ms`,
        'React19PerformanceMonitor'
      );
    }

    // Log slow transitions in production
    if (duration > 100) {
      logger.warn(
        `Slow React 19 transition detected: ${transition.componentName} took ${duration.toFixed(2)}ms`,
        'React19PerformanceMonitor'
      );
    }

    this.activeTransitions.delete(transitionId);
  }

  /**
   * Track Suspense component loading time
   */
  startSuspenseLoad(componentName: string): void {
    this.suspenseLoadTimes.set(componentName, performance.now());

    if (process.env.NODE_ENV === 'development') {
      logger.info(`Starting Suspense load: ${componentName}`, 'React19PerformanceMonitor');
    }
  }

  /**
   * End Suspense component loading
   */
  endSuspenseLoad(componentName: string): void {
    const startTime = this.suspenseLoadTimes.get(componentName);
    if (!startTime) return;

    const loadTime = performance.now() - startTime;
    this.metrics.suspenseLoadTime = Math.max(this.metrics.suspenseLoadTime, loadTime);

    if (process.env.NODE_ENV === 'development') {
      const status = loadTime > 1000 ? '⚠️ SLOW' : '✅ FAST';
      logger.info(
        `${status} Suspense load: ${componentName} - ${loadTime.toFixed(2)}ms`,
        'React19PerformanceMonitor'
      );
    }

    this.suspenseLoadTimes.delete(componentName);
  }

  /**
   * Track deferred value processing time
   */
  trackDeferredValue(valueName: string, processingTime: number): void {
    this.deferredValueTimings.set(valueName, processingTime);
    this.metrics.deferredValueDelay = Math.max(this.metrics.deferredValueDelay, processingTime);

    if (process.env.NODE_ENV === 'development' && processingTime > 50) {
      logger.info(
        `Deferred value processing: ${valueName} - ${processingTime.toFixed(2)}ms`,
        'React19PerformanceMonitor'
      );
    }
  }

  /**
   * Track flushSync usage (should be minimal)
   */
  trackFlushSync(componentName: string, reason: string): void {
    this.metrics.flushSyncCount++;

    if (process.env.NODE_ENV === 'development') {
      logger.info(`flushSync called: ${componentName} - ${reason}`, 'React19PerformanceMonitor');
    }

    // Warn if flushSync is overused
    if (this.metrics.flushSyncCount > 10) {
      logger.warn(
        `High flushSync usage detected (${this.metrics.flushSyncCount}). Consider reducing synchronous updates.`,
        'React19PerformanceMonitor'
      );
    }
  }

  /**
   * Get comprehensive React 19 performance report
   */
  getPerformanceReport(): {
    metrics: React19Metrics;
    recommendations: string[];
    score: number;
  } {
    const recommendations: string[] = [];
    let score = 100;

    // Analyze transition performance
    if (this.metrics.transitionDuration > 100) {
      recommendations.push('Consider breaking down large transitions into smaller chunks');
      score -= 15;
    }

    // Analyze Suspense performance
    if (this.metrics.suspenseLoadTime > 2000) {
      recommendations.push('Suspense components are loading slowly - consider preloading');
      score -= 10;
    }

    // Analyze deferred value performance
    if (this.metrics.deferredValueDelay > 100) {
      recommendations.push('Deferred values are processing slowly - optimize calculations');
      score -= 10;
    }

    // Analyze flushSync usage
    if (this.metrics.flushSyncCount > 5) {
      recommendations.push('High flushSync usage detected - reduce synchronous updates');
      score -= 20;
    }

    // Check for active transitions (memory leaks)
    if (this.activeTransitions.size > 0) {
      recommendations.push(
        `${this.activeTransitions.size} transitions are still active - potential memory leak`
      );
      score -= 25;
    }

    return {
      metrics: { ...this.metrics },
      recommendations,
      score: Math.max(0, score),
    };
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.metrics = {
      transitionDuration: 0,
      suspenseLoadTime: 0,
      concurrentRenderTime: 0,
      deferredValueDelay: 0,
      flushSyncCount: 0,
    };
    this.activeTransitions.clear();
    this.suspenseLoadTimes.clear();
    this.deferredValueTimings.clear();
  }

  /**
   * Get real-time performance insights
   */
  getCurrentInsights(): {
    activeTransitions: number;
    avgTransitionTime: number;
    pendingSuspenseLoads: number;
  } {
    const transitionTimes = Array.from(this.activeTransitions.values())
      .filter(t => t.endTime)
      .map(t => (t.endTime as number) - t.startTime);

    return {
      activeTransitions: this.activeTransitions.size,
      avgTransitionTime:
        transitionTimes.length > 0
          ? transitionTimes.reduce((a, b) => a + b, 0) / transitionTimes.length
          : 0,
      pendingSuspenseLoads: this.suspenseLoadTimes.size,
    };
  }
}

export const react19Monitor = React19PerformanceMonitor.getInstance();

/**
 * Hook for easy React 19 performance monitoring in components
 */
import { useCallback } from 'react';

export function useReact19Performance(componentName: string) {
  const startTransition = useCallback(
    (type: TransitionMetrics['transitionType']) => {
      return react19Monitor.startTransition(componentName, type);
    },
    [componentName]
  );

  const endTransition = useCallback((transitionId: string) => {
    react19Monitor.endTransition(transitionId);
  }, []);

  const trackFlushSync = useCallback(
    (reason: string) => {
      react19Monitor.trackFlushSync(componentName, reason);
    },
    [componentName]
  );

  const startSuspenseLoad = useCallback(() => {
    react19Monitor.startSuspenseLoad(componentName);
  }, [componentName]);

  const endSuspenseLoad = useCallback(() => {
    react19Monitor.endSuspenseLoad(componentName);
  }, [componentName]);

  return {
    startTransition,
    endTransition,
    trackFlushSync,
    startSuspenseLoad,
    endSuspenseLoad,
    getReport: () => react19Monitor.getPerformanceReport(),
    getCurrentInsights: () => react19Monitor.getCurrentInsights(),
  };
}

/**
 * Development-only performance logger for React 19 features
 */
export function logReact19Performance(options?: { skipEnvCheck?: boolean }): void {
  // Use both Vite and Node.js environment variables for better compatibility
  const isDevelopment =
    (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') ||
    // @ts-expect-error - Vite-specific env property
    (typeof import.meta !== 'undefined' && import.meta.env?.MODE === 'development');

  if (!options?.skipEnvCheck && !isDevelopment) {
    return;
  }

  const report = react19Monitor.getPerformanceReport();

  if (report.recommendations.length > 0) {
    logger.info('React 19 Performance Recommendations:', 'React19PerformanceMonitor', {
      score: report.score,
      recommendations: report.recommendations,
    });
  }
}

// Auto-log performance report every 30 seconds in development
if (process.env.NODE_ENV === 'development') {
  setInterval(logReact19Performance, 30000);
}
