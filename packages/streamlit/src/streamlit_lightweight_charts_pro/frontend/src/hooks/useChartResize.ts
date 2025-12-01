/**
 * useChartResize Hook
 *
 * Provides chart resize functionality with automatic sizing and debouncing.
 * Extracts resize logic from the main component for better modularity and reusability.
 *
 * Performance Best Practices:
 * - Uses debouncing to prevent excessive resize calls (100ms default)
 * - Leverages ResizeObserver for efficient dimension tracking
 * - Cleanup observers on unmount to prevent memory leaks
 * - Uses useCallback to memoize handlers and prevent recreations
 *
 * @example
 * ```tsx
 * const { setupAutoSizing, cleanup } = useChartResize({
 *   width: 800,
 *   height: 600
 * });
 *
 * useEffect(() => {
 *   setupAutoSizing(chart, container, chartConfig);
 *   return cleanup;
 * }, [chart, container, chartConfig]);
 * ```
 */

import { useCallback, useRef } from 'react';
import { IChartApi } from 'lightweight-charts';
import { ChartConfig } from '../types';
import { logger } from '../utils/logger';

export interface UseChartResizeOptions {
  /**
   * Default width for charts (in pixels)
   */
  width: number | null;

  /**
   * Default height for charts (in pixels)
   */
  height: number | null;

  /**
   * Debounce delay for resize events (in milliseconds)
   * @default 100
   */
  debounceMs?: number;
}

export interface UseChartResizeReturn {
  /**
   * Get container dimensions
   */
  getContainerDimensions(container: HTMLElement): { width: number; height: number };

  /**
   * Setup auto-sizing for a chart
   * Creates a ResizeObserver that watches the container and resizes the chart accordingly
   */
  setupAutoSizing(chart: IChartApi, container: HTMLElement, chartConfig: ChartConfig): void;

  /**
   * Manually resize a chart
   */
  resizeChart(chart: IChartApi, width: number, height: number): void;

  /**
   * Cleanup all resize observers
   * Should be called on component unmount
   */
  cleanup(): void;
}

/**
 * Hook for managing chart resize operations
 *
 * @param options - Configuration options for chart resizing
 * @returns Object with resize helper functions
 */
export function useChartResize(options: UseChartResizeOptions): UseChartResizeReturn {
  const { width, height, debounceMs = 100 } = options;

  // Store resize observers for cleanup
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const debounceTimersRef = useRef<{ [key: string]: NodeJS.Timeout }>({});

  /**
   * Get container dimensions using getBoundingClientRect
   * More accurate than offsetWidth/offsetHeight
   */
  const getContainerDimensions = useCallback((container: HTMLElement) => {
    const rect = container.getBoundingClientRect();
    return {
      width: rect.width,
      height: rect.height,
    };
  }, []);

  /**
   * Debounced resize handler
   * Prevents excessive chart.resize() calls during rapid dimension changes
   */
  const debouncedResizeHandler = useCallback(
    (chartId: string, chart: IChartApi, container: HTMLElement, chartConfig: ChartConfig) => {
      // Clear existing timer
      if (debounceTimersRef.current[chartId]) {
        clearTimeout(debounceTimersRef.current[chartId]);
      }

      // Set new timer
      debounceTimersRef.current[chartId] = setTimeout(() => {
        try {
          const dimensions = getContainerDimensions(container);
          const newWidth = chartConfig.autoWidth
            ? dimensions.width
            : chartConfig.chart?.width || width;
          // Prioritize height from chart options (JSON config) over autoHeight
          const newHeight =
            chartConfig.chart?.height ||
            (chartConfig.autoHeight ? dimensions.height : height) ||
            dimensions.height;

          if (newHeight != null && newWidth != null) {
            chart.resize(newWidth, newHeight);
          }
        } catch (error) {
          logger.warn('Chart auto-resize failed', 'useChartResize', error);
        }
      }, debounceMs);
    },
    [width, height, debounceMs, getContainerDimensions]
  );

  /**
   * Setup auto-sizing for a chart
   * Creates a ResizeObserver that monitors container dimensions
   */
  const setupAutoSizing = useCallback(
    (chart: IChartApi, container: HTMLElement, chartConfig: ChartConfig) => {
      // Only setup auto-sizing if explicitly enabled
      if (chartConfig.autoSize || chartConfig.autoWidth || chartConfig.autoHeight) {
        const chartId = chart.chartElement().id || 'default';

        // Create ResizeObserver if available
        const observer =
          typeof ResizeObserver !== 'undefined'
            ? new ResizeObserver(() => {
                debouncedResizeHandler(chartId, chart, container, chartConfig);
              })
            : null;

        if (observer && typeof observer.observe === 'function') {
          observer.observe(container);
        }

        resizeObserverRef.current = observer;
      }
    },
    [debouncedResizeHandler]
  );

  /**
   * Manually resize a chart
   * Useful for programmatic resizing outside of auto-sizing
   */
  const resizeChart = useCallback((chart: IChartApi, chartWidth: number, chartHeight: number) => {
    try {
      chart.resize(chartWidth, chartHeight);
    } catch (error) {
      logger.warn('Manual chart resize failed', 'useChartResize', error);
    }
  }, []);

  /**
   * Cleanup all resize observers and timers
   */
  const cleanup = useCallback(() => {
    // Disconnect ResizeObserver
    if (resizeObserverRef.current) {
      resizeObserverRef.current.disconnect();
      resizeObserverRef.current = null;
    }

    // Clear all pending debounce timers
    Object.values(debounceTimersRef.current).forEach(timer => {
      clearTimeout(timer);
    });
    debounceTimersRef.current = {};
  }, []);

  return {
    getContainerDimensions,
    setupAutoSizing,
    resizeChart,
    cleanup,
  };
}
