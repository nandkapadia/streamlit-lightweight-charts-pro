/**
 * Lazy loading utilities for better performance and code splitting
 * Reduces initial bundle size by loading components and services on demand
 */

import React, { ComponentType, lazy, LazyExoticComponent } from 'react';

/**
 * Lazy load a React component with error boundary and React 19 optimizations
 */
export function lazyComponent<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: T
): LazyExoticComponent<T> {
  return lazy(() =>
    importFunc().catch(_error => {
      // Failed to load component - use fallback instead
      // Return a fallback component on error
      return {
        default: fallback || (((): any => null) as any as T),
      };
    })
  );
}

/**
 * Enhanced lazy component with Suspense wrapper integration
 */
export function lazyComponentWithSuspense<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: T,
  suspenseOptions?: {
    minLoadingTime?: number;
    showProgressIndicator?: boolean;
  }
): LazyExoticComponent<T> {
  const LazyComponent = lazyComponent(importFunc, fallback);

  // Return a wrapped component that integrates with our Suspense system
  const WrappedComponent: T = ((...args: any[]) => {
    // Component will be wrapped with ChartSuspenseWrapper by parent
    return React.createElement(LazyComponent, ...args);
  }) as any as T;

  // Store suspense options for use by parent components
  (WrappedComponent as any).__suspenseOptions = suspenseOptions;

  return lazy(() => Promise.resolve({ default: WrappedComponent }));
}

/**
 * Lazy load a service class with singleton pattern
 */
export function lazyService<T>(
  importFunc: () => Promise<{ default: new (..._args: any[]) => T }>,
  ..._args: any[]
): Promise<T> {
  return importFunc().then(module => {
    const ServiceClass = module.default;
    return new ServiceClass(..._args);
  });
}

/**
 * Lazy load a singleton service
 */
export function lazySingleton<T>(
  importFunc: () => Promise<{ [key: string]: { getInstance(): T } }>,
  serviceName: string
): Promise<T> {
  return importFunc().then(module => {
    const ServiceClass = module[serviceName];
    if (!ServiceClass || typeof ServiceClass.getInstance !== 'function') {
      throw new Error(`Service ${serviceName} does not have getInstance method`);
    }
    return ServiceClass.getInstance();
  });
}

/**
 * Lazy load utility functions
 */
export function lazyUtil<T>(importFunc: () => Promise<T>): Promise<T> {
  return importFunc();
}

/**
 * Preload resources for better UX
 */
export class ResourcePreloader {
  private static preloadedModules = new Map<string, Promise<any>>();

  /**
   * Preload a module without executing it
   */
  static preload<T>(key: string, importFunc: () => Promise<T>): void {
    if (!this.preloadedModules.has(key)) {
      this.preloadedModules.set(key, importFunc());
    }
  }

  /**
   * Get preloaded module or load it
   */
  static async get<T>(key: string, importFunc: () => Promise<T>): Promise<T> {
    if (this.preloadedModules.has(key)) {
      return this.preloadedModules.get(key);
    }

    const modulePromise = importFunc();
    this.preloadedModules.set(key, modulePromise);
    return modulePromise;
  }

  /**
   * Clear preloaded modules to free memory
   */
  static clear(): void {
    this.preloadedModules.clear();
  }

  /**
   * Get preload status
   */
  static getStatus(): {
    preloadedCount: number;
    keys: string[];
  } {
    return {
      preloadedCount: this.preloadedModules.size,
      keys: Array.from(this.preloadedModules.keys()),
    };
  }
}

/**
 * Lazy load chart services with preloading
 */
export const ChartServices = {
  dimensions: () =>
    lazySingleton(() => import('../services/ChartDimensionsService'), 'ChartDimensionsService'),

  coordinates: () =>
    lazySingleton(() => import('../services/PaneCoordinatesService'), 'PaneCoordinatesService'),

  cache: () =>
    lazySingleton(() => import('../services/CoordinateCacheManager'), 'CoordinateCacheManager'),

  primitiveManager: () =>
    import('../services/ChartPrimitiveManager').then(module => module.ChartPrimitiveManager),
};

/**
 * Lazy load chart components with enhanced Suspense integration
 */
export const ChartComponents = {
  SeriesConfigDialog: lazyComponentWithSuspense(
    () =>
      import('../components/SeriesConfigDialog').then(module => ({
        default: module.SeriesConfigDialog,
      })),
    () => null,
    {
      minLoadingTime: 300,
      showProgressIndicator: true,
    }
  ),

  ButtonPanelComponent: lazyComponentWithSuspense(
    () =>
      import('../components/ButtonPanelComponent').then(module => ({
        default: module.ButtonPanelComponent,
      })),
    () => null,
    {
      minLoadingTime: 200,
      showProgressIndicator: false,
    }
  ),

  ChartContainer: lazyComponentWithSuspense(
    () =>
      import('../components/ChartContainer').then(module => ({
        default: module.ChartContainer,
      })),
    () => null,
    {
      minLoadingTime: 400,
      showProgressIndicator: true,
    }
  ),

  ChartAutoSizingManager: lazyComponentWithSuspense(
    () =>
      import('../components/ChartAutoSizingManager').then(module => ({
        default: module.ChartAutoSizingManager,
      })),
    () => null,
    {
      minLoadingTime: 150,
      showProgressIndicator: false,
    }
  ),
};

/**
 * Lazy load chart plugins
 */
export const ChartPlugins = {
  tooltipPlugin: () => lazyUtil(() => import('../plugins/chart/tooltipPlugin')),

  rectanglePlugin: () => lazyUtil(() => import('../plugins/overlay/rectanglePlugin')),

  signalSeriesPlugin: () => lazyUtil(() => import('../plugins/series/signalSeriesPlugin')),

  trendFillSeriesPlugin: () => lazyUtil(() => import('../plugins/series/trendFillSeriesPlugin')),
};

/**
 * Bundle optimization utilities
 */
export const BundleOptimization = {
  /**
   * Dynamically import large libraries only when needed
   */
  loadLightweightCharts: () => lazyUtil(() => import('lightweight-charts')),

  /**
   * Load testing utilities only in development
   */
  loadTestingUtils: () => {
    if (process.env.NODE_ENV === 'development') {
      return lazyUtil(() => import('@testing-library/react'));
    }
    return Promise.resolve(null);
  },

  /**
   * Load performance monitoring only in production
   */
  loadPerformanceMonitoring: () => {
    if (process.env.NODE_ENV === 'production') {
      return lazyUtil(() => import('../utils/performance'));
    }
    return Promise.resolve(null);
  },
};

/**
 * Preload critical services on app initialization
 */
export function preloadCriticalServices(): void {
  // Preload the most commonly used services
  ResourcePreloader.preload('dimensions', () => import('../services/ChartDimensionsService'));

  ResourcePreloader.preload('cache', () => import('../services/CoordinateCacheManager'));
}

/**
 * Preload services when user interaction is detected
 */
export function preloadOnInteraction(): void {
  const preloadAll = () => {
    ResourcePreloader.preload('coordinates', () => import('../services/PaneCoordinatesService'));

    ResourcePreloader.preload(
      'primitiveManager',
      () => import('../services/ChartPrimitiveManager')
    );

    ResourcePreloader.preload('tooltipPlugin', () => import('../plugins/chart/tooltipPlugin'));
  };

  // Preload on first user interaction
  const events = ['mousedown', 'touchstart', 'keydown'];
  const handler = () => {
    preloadAll();
    events.forEach(event => {
      document.removeEventListener(event, handler, { capture: true });
    });
  };

  events.forEach(event => {
    document.addEventListener(event, handler, { capture: true, once: true });
  });
}

/**
 * Performance monitoring for lazy loading
 */
export const LazyLoadingMetrics = {
  loadTimes: new Map<string, number>(),

  startMeasure(key: string): void {
    this.loadTimes.set(`${key}_start`, performance.now());
  },

  endMeasure(key: string): number {
    const startTime = this.loadTimes.get(`${key}_start`);
    if (startTime) {
      const duration = performance.now() - startTime;
      this.loadTimes.set(`${key}_duration`, duration);
      return duration;
    }
    return 0;
  },

  getMetrics(): Record<string, number> {
    const metrics: Record<string, number> = {};
    for (const [key, value] of this.loadTimes.entries()) {
      if (key.endsWith('_duration')) {
        metrics[key.replace('_duration', '')] = value;
      }
    }
    return metrics;
  },
};
