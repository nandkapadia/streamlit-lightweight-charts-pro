/**
 * Chart auto-sizing manager component
 * Extracted from LightweightCharts.tsx for better separation of concerns
 * Handles responsive behavior and container dimension management
 */

import React, { useCallback, useRef, useEffect, useMemo, useTransition, useDeferredValue } from 'react';
import { IChartApi } from 'lightweight-charts';
import { ResizeObserverManager } from '../utils/resizeObserverManager';

interface ChartAutoSizingManagerProps {
  chart: IChartApi | null;
  chartId: string;
  containerRef: React.RefObject<HTMLDivElement>;
  autoSize?: boolean;
  onError?: (_error: Error, _context: string) => void;
}

/**
 * Manages chart auto-sizing and responsive behavior
 */
export const ChartAutoSizingManager: React.FC<ChartAutoSizingManagerProps> = React.memo(({
  chart,
  chartId,
  containerRef,
  autoSize = true,
  onError,
}) => {
  const resizeManagerRef = useRef<ResizeObserverManager>(new ResizeObserverManager());

  // React 19 concurrent features for better resize performance
  const [, startResizeTransition] = useTransition();
  const deferredAutoSize = useDeferredValue(autoSize);

  /**
   * Get container dimensions safely (memoized for better performance)
   */
  const getContainerDimensions = useMemo(
    () => (container: HTMLElement) => {
      try {
        const rect = container.getBoundingClientRect();
        return {
          width: Math.max(200, Math.floor(rect.width)),
          height: Math.max(100, Math.floor(rect.height)),
        };
      } catch (error) {
        onError?.(error as Error, 'getContainerDimensions');
        return { width: 800, height: 400 }; // fallback dimensions
      }
    },
    [onError]
  );

  /**
   * Enhanced resize handler with performance optimizations and React 19 features
   */
  const debouncedResizeHandler = useCallback(
    (entry: ResizeObserverEntry | ResizeObserverEntry[]) => {
      // Handle both single entry and array of entries
      const singleEntry = Array.isArray(entry) ? entry[0] : entry;
      if (!chart || !containerRef.current) return;

      // Use transition for non-critical resize operations
      startResizeTransition(() => {
        try {
          const dimensions = getContainerDimensions(singleEntry.target as HTMLElement);

          // Only resize if dimensions actually changed significantly
          const currentSize = chart.options();
          const widthChanged = Math.abs((currentSize.width || 0) - dimensions.width) > 10;
          const heightChanged = Math.abs((currentSize.height || 0) - dimensions.height) > 10;

          if (widthChanged || heightChanged) {
            chart.resize(dimensions.width, dimensions.height, false);
          }
        } catch (error) {
          onError?.(error as Error, 'resizeHandler');
        }
      });
    },
    [chart, containerRef, getContainerDimensions, onError, startResizeTransition]
  );

  /**
   * Setup auto-sizing behavior
   */
  const setupAutoSizing = useCallback((): (() => void) | undefined => {
    if (!chart || !containerRef.current || !autoSize) return undefined;

    const container = containerRef.current;
    const observerId = `chart-resize-${chartId}`;

    try {
      // Add resize observer with throttling for performance
      resizeManagerRef.current.addObserver(observerId, container, debouncedResizeHandler, {
        throttleMs: 100,
        debounceMs: 50,
      });

      // Initial resize to fit container
      const initialDimensions = getContainerDimensions(container);
      chart.resize(initialDimensions.width, initialDimensions.height, false);
    } catch (error) {
      onError?.(error as Error, 'setupAutoSizing');
    }

    // Cleanup function
    return () => {
      resizeManagerRef.current.removeObserver(observerId);
    };
  }, [
    chart,
    chartId,
    containerRef,
    autoSize,
    debouncedResizeHandler,
    getContainerDimensions,
    onError,
  ]);

  // Setup auto-sizing when chart or container changes (using deferred value)
  useEffect(() => {
    if (deferredAutoSize) {
      return setupAutoSizing();
    }
    return undefined;
  }, [setupAutoSizing, deferredAutoSize]);

  // Cleanup on unmount
  useEffect(() => {
    const resizeManager = resizeManagerRef.current;
    return () => {
      resizeManager.cleanup();
    };
  }, []);

  // This component doesn't render anything - it only manages sizing
  return null;
});
