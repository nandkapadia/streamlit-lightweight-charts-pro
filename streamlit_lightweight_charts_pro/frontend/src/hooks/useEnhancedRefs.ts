/**
 * React 19 Enhanced Ref Patterns with cleanup functions and advanced ref handling
 * Provides automatic cleanup and better ref management for chart components
 */

import { useRef, useCallback, useEffect, useMemo } from 'react';
import type { IChartApi, ISeriesApi } from 'lightweight-charts';
import { react19Monitor } from '../utils/react19PerformanceMonitor';

export interface RefWithCleanup<T> {
  current: T | null;
  cleanup: () => void;
  isActive: boolean;
}

/**
 * Enhanced ref with automatic cleanup for chart instances
 */
export function useChartRef<T extends IChartApi>() {
  const chartRef = useRef<T | null>(null);
  const cleanupCallbacks = useRef<(() => void)[]>([]);
  const isActiveRef = useRef<boolean>(true);

  // React 19 ref with cleanup function
  const enhancedRef = useCallback((node: T | null) => {
    // Cleanup previous instance
    if (chartRef.current && cleanupCallbacks.current.length > 0) {
      const transitionId = react19Monitor.startTransition('ChartRefCleanup', 'chart');

      try {
        cleanupCallbacks.current.forEach(cleanup => {
          try {
            cleanup();
          } catch (error) {
            console.warn('Chart ref cleanup error:', error);
          }
        });

        cleanupCallbacks.current = [];
        react19Monitor.endTransition(transitionId);
      } catch (error) {
        react19Monitor.endTransition(transitionId);
        console.error('Chart ref cleanup failed:', error);
      }
    }

    // Set new ref
    chartRef.current = node;

    // Setup new instance if provided
    if (node) {
      isActiveRef.current = true;

      // Add automatic cleanup for chart disposal
      const chartCleanup = () => {
        if (node && typeof node.remove === 'function') {
          node.remove();
        }
        isActiveRef.current = false;
      };

      cleanupCallbacks.current.push(chartCleanup);

      if (process.env.NODE_ENV === 'development') {
        console.log('📊 Chart ref established with cleanup');
      }
    }
  }, []);

  // Manual cleanup function
  const cleanup = useCallback(() => {
    if (cleanupCallbacks.current.length > 0) {
      cleanupCallbacks.current.forEach(cb => cb());
      cleanupCallbacks.current = [];
    }
    chartRef.current = null;
    isActiveRef.current = false;
  }, []);

  // Add custom cleanup callback
  const addCleanup = useCallback((cleanupFn: () => void) => {
    cleanupCallbacks.current.push(cleanupFn);
  }, []);

  // Component unmount cleanup
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    ref: enhancedRef,
    current: chartRef.current,
    cleanup,
    addCleanup,
    isActive: isActiveRef.current,
  };
}

/**
 * Enhanced ref for series management with automatic cleanup
 */
export function useSeriesRefs<T extends ISeriesApi<any>>() {
  const seriesRefs = useRef<Map<string, T>>(new Map());
  const cleanupMap = useRef<Map<string, (() => void)[]>>(new Map());

  const addSeries = useCallback((id: string, series: T) => {
    // Cleanup existing series with same ID
    if (seriesRefs.current.has(id)) {
      const existingCleanups = cleanupMap.current.get(id) || [];
      existingCleanups.forEach(cleanup => {
        try {
          cleanup();
        } catch (error) {
          console.warn(`Series cleanup error for ${id}:`, error);
        }
      });
    }

    seriesRefs.current.set(id, series);
    cleanupMap.current.set(id, []);

    // Add default cleanup for series removal
    const seriesCleanup = () => {
      if (series && typeof (series as any).remove === 'function') {
        (series as any).remove();
      }
    };

    const cleanups = cleanupMap.current.get(id) || [];
    cleanups.push(seriesCleanup);
    cleanupMap.current.set(id, cleanups);

    if (process.env.NODE_ENV === 'development') {
      console.log(`📈 Series ${id} added with cleanup`);
    }
  }, []);

  const removeSeries = useCallback((id: string) => {
    const cleanups = cleanupMap.current.get(id) || [];
    cleanups.forEach(cleanup => {
      try {
        cleanup();
      } catch (error) {
        console.warn(`Series removal error for ${id}:`, error);
      }
    });

    seriesRefs.current.delete(id);
    cleanupMap.current.delete(id);

    if (process.env.NODE_ENV === 'development') {
      console.log(`📈 Series ${id} removed`);
    }
  }, []);

  const getSeries = useCallback((id: string): T | undefined => {
    return seriesRefs.current.get(id);
  }, []);

  const addSeriesCleanup = useCallback((id: string, cleanupFn: () => void) => {
    const cleanups = cleanupMap.current.get(id) || [];
    cleanups.push(cleanupFn);
    cleanupMap.current.set(id, cleanups);
  }, []);

  const clearAllSeries = useCallback(() => {
    // Cleanup all series
    cleanupMap.current.forEach((cleanups, id) => {
      cleanups.forEach(cleanup => {
        try {
          cleanup();
        } catch (error) {
          console.warn(`Bulk series cleanup error for ${id}:`, error);
        }
      });
    });

    seriesRefs.current.clear();
    cleanupMap.current.clear();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAllSeries();
    };
  }, [clearAllSeries]);

  const allSeries = useMemo(() => {
    return Array.from(seriesRefs.current.entries());
  }, []);

  return {
    addSeries,
    removeSeries,
    getSeries,
    addSeriesCleanup,
    clearAllSeries,
    allSeries,
    seriesCount: seriesRefs.current.size,
  };
}

/**
 * Enhanced ref for DOM element management with intersection observer
 */
export function useObservedRef<T extends HTMLElement>() {
  const elementRef = useRef<T | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const callbacksRef = useRef<{
    onVisible?: () => void;
    onHidden?: () => void;
    onIntersect?: (entry: IntersectionObserverEntry) => void;
  }>({});

  const setCallbacks = useCallback((callbacks: {
    onVisible?: () => void;
    onHidden?: () => void;
    onIntersect?: (entry: IntersectionObserverEntry) => void;
  }) => {
    callbacksRef.current = callbacks;
  }, []);

  const enhancedRef = useCallback((node: T | null) => {
    // Cleanup previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    elementRef.current = node;

    if (node) {
      // Create intersection observer
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const { onVisible, onHidden, onIntersect } = callbacksRef.current;

            if (onIntersect) {
              onIntersect(entry);
            }

            if (entry.isIntersecting && onVisible) {
              onVisible();
            } else if (!entry.isIntersecting && onHidden) {
              onHidden();
            }
          });
        },
        { threshold: [0, 0.5, 1] }
      );

      observerRef.current.observe(node);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return {
    ref: enhancedRef,
    current: elementRef.current,
    setCallbacks,
    isObserved: Boolean(observerRef.current),
  };
}

/**
 * Enhanced ref for resize observation
 */
export function useResizeObservedRef<T extends HTMLElement>() {
  const elementRef = useRef<T | null>(null);
  const observerRef = useRef<ResizeObserver | null>(null);
  const callbackRef = useRef<((entry: ResizeObserverEntry) => void) | null>(null);

  const setResizeCallback = useCallback((callback: (entry: ResizeObserverEntry) => void) => {
    callbackRef.current = callback;
  }, []);

  const enhancedRef = useCallback((node: T | null) => {
    // Cleanup previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    elementRef.current = node;

    if (node) {
      // Create resize observer
      observerRef.current = new ResizeObserver((entries) => {
        entries.forEach((entry) => {
          if (callbackRef.current) {
            callbackRef.current(entry);
          }
        });
      });

      observerRef.current.observe(node);

      if (process.env.NODE_ENV === 'development') {
        console.log('📏 Resize observer established');
      }
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return {
    ref: enhancedRef,
    current: elementRef.current,
    setResizeCallback,
    isObserving: Boolean(observerRef.current),
  };
}

/**
 * Combined hook for chart component refs with all enhancements
 */
export function useChartComponentRefs() {
  const chartRef = useChartRef<IChartApi>();
  const seriesRefs = useSeriesRefs<ISeriesApi<any>>();
  const containerRef = useResizeObservedRef<HTMLDivElement>();

  // Setup automatic chart resizing
  useEffect(() => {
    containerRef.setResizeCallback((entry) => {
      if (chartRef.current && entry.contentRect) {
        const { width, height } = entry.contentRect;
        chartRef.current.applyOptions({
          width: Math.floor(width),
          height: Math.floor(height),
        });

        if (process.env.NODE_ENV === 'development') {
          console.log(`📊 Chart resized to: ${width}x${height}`);
        }
      }
    });
  }, [chartRef, containerRef]);

  // Master cleanup function
  const cleanupAll = useCallback(() => {
    chartRef.cleanup();
    seriesRefs.clearAllSeries();
  }, [chartRef, seriesRefs]);

  return {
    chart: chartRef,
    series: seriesRefs,
    container: containerRef,
    cleanupAll,
  };
}
