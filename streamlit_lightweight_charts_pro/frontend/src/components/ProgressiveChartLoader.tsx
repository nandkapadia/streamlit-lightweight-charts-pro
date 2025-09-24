/**
 * Progressive loading strategy for charts with React 19 optimizations
 * Implements staggered loading, priority-based rendering, and smart preloading
 */

import React, { useState, useEffect, useCallback, useTransition, useDeferredValue, useMemo } from 'react';
import { ChartSuspenseWrapper } from './ChartSuspenseWrapper';
import { react19Monitor } from '../utils/react19PerformanceMonitor';

interface ProgressiveLoadingConfig {
  priority: 'high' | 'medium' | 'low';
  delayMs?: number;
  preload?: boolean;
  staggerIndex?: number;
}

interface ProgressiveChartLoaderProps {
  children: React.ReactNode;
  chartId: string;
  config: ProgressiveLoadingConfig;
  onLoadComplete?: (chartId: string, loadTime: number) => void;
  onLoadError?: (chartId: string, error: Error) => void;
}

/**
 * Priority-based loading queue manager
 */
class LoadingQueue {
  private static instance: LoadingQueue;
  private highPriorityQueue: string[] = [];
  private mediumPriorityQueue: string[] = [];
  private lowPriorityQueue: string[] = [];
  private loading: Set<string> = new Set();
  private maxConcurrent = 3;

  static getInstance(): LoadingQueue {
    if (!LoadingQueue.instance) {
      LoadingQueue.instance = new LoadingQueue();
    }
    return LoadingQueue.instance;
  }

  add(chartId: string, priority: ProgressiveLoadingConfig['priority']): void {
    switch (priority) {
      case 'high':
        this.highPriorityQueue.push(chartId);
        break;
      case 'medium':
        this.mediumPriorityQueue.push(chartId);
        break;
      case 'low':
        this.lowPriorityQueue.push(chartId);
        break;
    }
    this.processQueue();
  }

  remove(chartId: string): void {
    this.loading.delete(chartId);
    this.highPriorityQueue = this.highPriorityQueue.filter(id => id !== chartId);
    this.mediumPriorityQueue = this.mediumPriorityQueue.filter(id => id !== chartId);
    this.lowPriorityQueue = this.lowPriorityQueue.filter(id => id !== chartId);
    this.processQueue();
  }

  private processQueue(): void {
    if (this.loading.size >= this.maxConcurrent) return;

    const nextItem = this.highPriorityQueue.shift() ||
                   this.mediumPriorityQueue.shift() ||
                   this.lowPriorityQueue.shift();

    if (nextItem && !this.loading.has(nextItem)) {
      this.loading.add(nextItem);
      // Notify that loading can proceed
      window.dispatchEvent(new CustomEvent('chart-load-ready', {
        detail: { chartId: nextItem }
      }));
    }
  }

  canLoad(chartId: string): boolean {
    return this.loading.has(chartId);
  }

  getQueueStatus(): { high: number; medium: number; low: number; loading: number } {
    return {
      high: this.highPriorityQueue.length,
      medium: this.mediumPriorityQueue.length,
      low: this.lowPriorityQueue.length,
      loading: this.loading.size,
    };
  }
}

/**
 * Progressive Chart Loader Component
 */
export const ProgressiveChartLoader: React.FC<ProgressiveChartLoaderProps> = React.memo(({
  children,
  chartId,
  config,
  onLoadComplete,
  onLoadError,
}) => {
  const [loadingState, setLoadingState] = useState<'queued' | 'loading' | 'loaded' | 'error'>('queued');
  const [loadStartTime, setLoadStartTime] = useState<number>(0);
  const [isPending, startTransition] = useTransition();

  // Use deferred values for non-critical config updates
  const deferredConfig = useDeferredValue(config);

  const queue = useMemo(() => LoadingQueue.getInstance(), []);

  // Memoize loading strategies based on priority
  const loadingStrategy = useMemo(() => {
    const baseDelay = deferredConfig.staggerIndex ? deferredConfig.staggerIndex * 100 : 0;
    const priorityDelay = {
      high: 0,
      medium: 200,
      low: 500,
    }[deferredConfig.priority];

    return {
      totalDelay: baseDelay + priorityDelay + (deferredConfig.delayMs || 0),
      shouldPreload: deferredConfig.preload && deferredConfig.priority === 'high',
    };
  }, [deferredConfig]);

  // Handle load queue events
  useEffect(() => {
    const handleLoadReady = (event: CustomEvent) => {
      if (event.detail.chartId === chartId) {
        startTransition(() => {
          setLoadingState('loading');
          setLoadStartTime(performance.now());
          react19Monitor.startSuspenseLoad(`ProgressiveLoader-${chartId}`);
        });
      }
    };

    window.addEventListener('chart-load-ready', handleLoadReady as EventListener);
    return () => {
      window.removeEventListener('chart-load-ready', handleLoadReady as EventListener);
    };
  }, [chartId, startTransition]);

  // Initialize loading queue
  useEffect(() => {
    queue.add(chartId, deferredConfig.priority);

    return () => {
      queue.remove(chartId);
    };
  }, [chartId, deferredConfig.priority, queue]);

  // Handle load completion
  const handleLoadComplete = useCallback(() => {
    const loadTime = performance.now() - loadStartTime;

    startTransition(() => {
      setLoadingState('loaded');
      react19Monitor.endSuspenseLoad(`ProgressiveLoader-${chartId}`);
      queue.remove(chartId);
      onLoadComplete?.(chartId, loadTime);
    });

    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 Chart ${chartId} loaded in ${loadTime.toFixed(2)}ms (${deferredConfig.priority} priority)`);
    }
  }, [chartId, loadStartTime, deferredConfig.priority, queue, onLoadComplete, startTransition]);

  // Handle load errors
  const handleLoadError = useCallback((error: Error) => {
    startTransition(() => {
      setLoadingState('error');
      react19Monitor.endSuspenseLoad(`ProgressiveLoader-${chartId}`);
      queue.remove(chartId);
      onLoadError?.(chartId, error);
    });
  }, [chartId, queue, onLoadError, startTransition]);

  // Preloading strategy
  useEffect(() => {
    if (loadingStrategy.shouldPreload && loadingState === 'queued') {
      // Preload critical resources
      const preloadTimer = setTimeout(() => {
        // Simulate preloading critical chart resources
        if (process.env.NODE_ENV === 'development') {
          console.log(`🚀 Preloading high-priority chart: ${chartId}`);
        }
      }, 100);

      return () => clearTimeout(preloadTimer);
    }
  }, [loadingStrategy.shouldPreload, loadingState, chartId]);

  // Progressive loading states
  const LoadingIndicator = useMemo(() => {
    const priorityColors = {
      high: '#4CAF50',
      medium: '#FF9800',
      low: '#9E9E9E',
    };

    const priorityLabels = {
      high: 'High Priority',
      medium: 'Standard',
      low: 'Background',
    };

    return (
      <div
        style={{
          width: '100%',
          height: '200px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          border: `2px dashed ${priorityColors[deferredConfig.priority]}`,
          position: 'relative',
        }}
      >
        {/* Priority indicator */}
        <div
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            padding: '4px 8px',
            backgroundColor: priorityColors[deferredConfig.priority],
            color: 'white',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: '600',
          }}
        >
          {priorityLabels[deferredConfig.priority]}
        </div>

        {/* Loading animation */}
        <div
          style={{
            width: '40px',
            height: '40px',
            border: `3px solid ${priorityColors[deferredConfig.priority]}33`,
            borderTop: `3px solid ${priorityColors[deferredConfig.priority]}`,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '15px',
          }}
        />

        {/* Status text */}
        <div style={{ fontSize: '14px', color: '#666', textAlign: 'center' }}>
          {loadingState === 'queued' && `Queued (${deferredConfig.priority} priority)`}
          {loadingState === 'loading' && 'Loading chart...'}
          {isPending && 'Processing...'}
        </div>

        {/* Queue status in development */}
        {process.env.NODE_ENV === 'development' && (
          <div style={{
            position: 'absolute',
            bottom: '10px',
            left: '10px',
            fontSize: '10px',
            color: '#999',
          }}>
            Queue: {JSON.stringify(queue.getQueueStatus())}
          </div>
        )}

        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }, [deferredConfig.priority, loadingState, isPending, queue]);

  // Render based on loading state
  if (loadingState === 'error') {
    return (
      <div style={{
        width: '100%',
        height: '200px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff5f5',
        border: '2px solid #f56565',
        borderRadius: '8px',
        color: '#e53e3e',
        fontSize: '14px',
      }}>
        Failed to load chart {chartId}
      </div>
    );
  }

  if (loadingState === 'queued' || loadingState === 'loading') {
    return LoadingIndicator;
  }

  // Chart is ready to load
  return (
    <ChartSuspenseWrapper
      fallback={LoadingIndicator}
      onLoadingStart={() => setLoadingState('loading')}
      onLoadingComplete={handleLoadComplete}
      onError={handleLoadError}
      minLoadingTime={loadingStrategy.totalDelay}
      showProgressIndicator={deferredConfig.priority === 'high'}
    >
      {children}
    </ChartSuspenseWrapper>
  );
});

ProgressiveChartLoader.displayName = 'ProgressiveChartLoader';

/**
 * Hook for managing progressive loading across multiple charts
 */
export function useProgressiveLoading() {
  const [loadedCharts, setLoadedCharts] = useState<Set<string>>(new Set());
  const [loadingCharts, setLoadingCharts] = useState<Set<string>>(new Set());
  const [queueStatus, setQueueStatus] = useState(LoadingQueue.getInstance().getQueueStatus());

  const updateQueueStatus = useCallback(() => {
    setQueueStatus(LoadingQueue.getInstance().getQueueStatus());
  }, []);

  useEffect(() => {
    const interval = setInterval(updateQueueStatus, 1000);
    return () => clearInterval(interval);
  }, [updateQueueStatus]);

  const handleLoadComplete = useCallback((chartId: string) => {
    setLoadedCharts(prev => new Set(prev).add(chartId));
    setLoadingCharts(prev => {
      const newSet = new Set(prev);
      newSet.delete(chartId);
      return newSet;
    });
  }, []);

  const handleLoadStart = useCallback((chartId: string) => {
    setLoadingCharts(prev => new Set(prev).add(chartId));
  }, []);

  return {
    loadedCharts: Array.from(loadedCharts),
    loadingCharts: Array.from(loadingCharts),
    queueStatus,
    handleLoadComplete,
    handleLoadStart,
    totalLoaded: loadedCharts.size,
    totalLoading: loadingCharts.size,
  };
}
