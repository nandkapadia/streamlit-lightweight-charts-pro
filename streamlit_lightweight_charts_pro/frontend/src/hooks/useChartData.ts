/**
 * React 19 use() hook integration for chart data fetching
 * Provides seamless data loading with Suspense and concurrent features
 */

import { useMemo, useTransition, useDeferredValue } from 'react';
import { react19Monitor } from '../utils/react19PerformanceMonitor';

interface ChartDataOptions {
  chartId: string;
  timeRange?: {
    start: number;
    end: number;
  };
  refreshInterval?: number;
  priority?: 'high' | 'medium' | 'low';
}

interface ChartDataResponse {
  data: Array<{ time: number; value: number; [key: string]: any }>;
  metadata: {
    totalPoints: number;
    timeRange: { start: number; end: number };
    lastUpdated: number;
  };
}

/**
 * Create a promise for chart data that works with modern React data fetching
 */
function createChartDataPromise(options: ChartDataOptions): Promise<ChartDataResponse> {
  const { chartId, timeRange, priority = 'medium' } = options;

  // Start performance monitoring
  const transitionId = react19Monitor.startTransition(`ChartData-${chartId}`, 'chart');

  return new Promise((resolve, reject) => {
    // Simulate different loading times based on priority
    const loadingTime = {
      high: 100,
      medium: 300,
      low: 800,
    }[priority];

    setTimeout(() => {
      try {
        // Generate mock data based on time range
        const now = Date.now();
        const start = timeRange?.start || (now - 24 * 60 * 60 * 1000); // 24 hours ago
        const end = timeRange?.end || now;
        const points = Math.min(1000, Math.floor((end - start) / 60000)); // 1 point per minute, max 1000

        const data = Array.from({ length: points }, (_, i) => {
          const time = start + (i * (end - start)) / points;
          return {
            time,
            value: 100 + Math.sin(i / 10) * 20 + Math.random() * 10,
            volume: Math.floor(Math.random() * 1000000),
          };
        });

        const response: ChartDataResponse = {
          data,
          metadata: {
            totalPoints: data.length,
            timeRange: { start, end },
            lastUpdated: Date.now(),
          },
        };

        // End performance monitoring
        react19Monitor.endTransition(transitionId);

        resolve(response);
      } catch (error) {
        react19Monitor.endTransition(transitionId);
        reject(error);
      }
    }, loadingTime);
  });
}

/**
 * Cache for chart data promises to avoid duplicate requests
 */
const chartDataCache = new Map<string, Promise<ChartDataResponse>>();

/**
 * React 19 compatible hook for chart data fetching with concurrent features
 */
export function useChartData(options: ChartDataOptions) {
  const [,] = useTransition();

  // Defer non-critical options for better performance
  const deferredOptions = useDeferredValue(options);

  // Create a cache key based on options
  const cacheKey = useMemo(() => {
    return `${deferredOptions.chartId}-${deferredOptions.timeRange?.start || 'auto'}-${deferredOptions.timeRange?.end || 'auto'}-${deferredOptions.priority || 'medium'}`;
  }, [deferredOptions]);

  // Get or create promise for this data request
  const dataPromise = useMemo(() => {
    if (!chartDataCache.has(cacheKey)) {
      const promise = createChartDataPromise(deferredOptions);
      chartDataCache.set(cacheKey, promise);

      // Clean up cache after 5 minutes to prevent memory leaks
      setTimeout(() => {
        chartDataCache.delete(cacheKey);
      }, 5 * 60 * 1000);
    }

    return chartDataCache.get(cacheKey) as Promise<any>;
  }, [cacheKey, deferredOptions]);

  return {
    dataPromise,
    chartId: options.chartId,
    priority: options.priority || 'medium',
  };
}

/**
 * Hook for real-time chart data with automatic updates
 */
export function useRealtimeChartData(options: ChartDataOptions & { enabled?: boolean }) {
  const [, startTransition] = useTransition();
  const { refreshInterval = 5000, enabled = true, ...dataOptions } = options;

  // Base data hook
  const baseData = useChartData(dataOptions);

  // Set up real-time updates using transitions
  useMemo(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      startTransition(() => {
        // Invalidate cache to trigger refresh
        const cacheKey = `${dataOptions.chartId}-${dataOptions.timeRange?.start || 'auto'}-${dataOptions.timeRange?.end || 'auto'}-${dataOptions.priority || 'medium'}`;
        chartDataCache.delete(cacheKey);
      });
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [enabled, refreshInterval, dataOptions, startTransition]);

  return baseData;
}

/**
 * Hook for multiple chart data fetching with batching
 */
export function useMultiChartData(chartConfigs: ChartDataOptions[]) {
  const [,] = useTransition();

  // Defer configs for better performance
  const deferredConfigs = useDeferredValue(chartConfigs);

  // Create promises for all charts
  const dataPromises = useMemo(() => {
    const promises: Record<string, Promise<ChartDataResponse>> = {};

    deferredConfigs.forEach(config => {
      const cacheKey = `${config.chartId}-${config.timeRange?.start || 'auto'}-${config.timeRange?.end || 'auto'}-${config.priority || 'medium'}`;

      if (!chartDataCache.has(cacheKey)) {
        const promise = createChartDataPromise(config);
        chartDataCache.set(cacheKey, promise);
      }

      promises[config.chartId] = chartDataCache.get(cacheKey) as Promise<any>;
    });

    return promises;
  }, [deferredConfigs]);

  // Log batch loading in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`📊 Batch preparing ${Object.keys(dataPromises).length} charts:`, Object.keys(dataPromises));
  }

  return dataPromises;
}

/**
 * Hook for prefetching chart data
 */
export function usePrefetchChartData() {
  return useMemo(() => ({
    prefetch: (options: ChartDataOptions) => {
      const cacheKey = `${options.chartId}-${options.timeRange?.start || 'auto'}-${options.timeRange?.end || 'auto'}-${options.priority || 'medium'}`;

      if (!chartDataCache.has(cacheKey)) {
        const promise = createChartDataPromise(options);
        chartDataCache.set(cacheKey, promise);

        // Don't await - just start the fetch
        promise.catch(error => {
          console.warn(`Prefetch failed for chart ${options.chartId}:`, error);
          chartDataCache.delete(cacheKey);
        });
      }
    },

    clearCache: (chartId?: string) => {
      if (chartId) {
        // Clear cache for specific chart
        Array.from(chartDataCache.keys())
          .filter(key => key.startsWith(chartId))
          .forEach(key => chartDataCache.delete(key));
      } else {
        // Clear all cache
        chartDataCache.clear();
      }
    },

    getCacheStatus: () => ({
      size: chartDataCache.size,
      keys: Array.from(chartDataCache.keys()),
    }),
  }), []);
}
