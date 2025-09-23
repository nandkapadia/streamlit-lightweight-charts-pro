/**
 * Chart auto-sizing manager component
 * Extracted from LightweightCharts.tsx for better separation of concerns
 * Handles responsive behavior and container dimension management
 */

import React, { useCallback, useRef, useEffect } from 'react';
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
export const ChartAutoSizingManager: React.FC<ChartAutoSizingManagerProps> = ({
  chart,
  chartId,
  containerRef,
  autoSize = true,
  onError,
}) => {
  const resizeManagerRef = useRef<ResizeObserverManager>(new ResizeObserverManager());

  /**
   * Get container dimensions safely
   */
  const getContainerDimensions = useCallback(
    (container: HTMLElement) => {
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
   * Enhanced resize handler with performance optimizations
   */
  const debouncedResizeHandler = useCallback(
    (entry: ResizeObserverEntry | ResizeObserverEntry[]) => {
      // Handle both single entry and array of entries
      const singleEntry = Array.isArray(entry) ? entry[0] : entry;
      if (!chart || !containerRef.current) return;

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
    },
    [chart, containerRef, getContainerDimensions, onError]
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

  // Setup auto-sizing when chart or container changes
  useEffect(() => {
    if (autoSize) {
      return setupAutoSizing();
    }
    return undefined;
  }, [setupAutoSizing, autoSize]);

  // Cleanup on unmount
  useEffect(() => {
    const resizeManager = resizeManagerRef.current;
    return () => {
      resizeManager.cleanup();
    };
  }, []);

  // This component doesn't render anything - it only manages sizing
  return null;
};
