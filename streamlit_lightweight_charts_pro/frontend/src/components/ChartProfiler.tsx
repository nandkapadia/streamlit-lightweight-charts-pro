/**
 * React 19 DevTools Profiler integration for chart performance monitoring
 * Provides detailed performance insights with React 19 concurrent features
 */

import React, { Profiler, useMemo, useCallback, useState } from 'react';
import { react19Monitor } from '../utils/react19PerformanceMonitor';
import { logger } from '../utils/logger';

interface ChartProfilerProps {
  children: React.ReactNode;
  chartId: string;
  enabled?: boolean;
}

interface ProfilerMetrics {
  renderCount: number;
  totalDuration: number;
  averageDuration: number;
  slowestRender: number;
  fastestRender: number;
  lastRender: number;
}

/**
 * Global profiler metrics store
 */
const profilerMetrics = new Map<string, ProfilerMetrics>();

/**
 * Enhanced Chart Profiler with React 19 optimizations
 */
export const ChartProfiler: React.FC<ChartProfilerProps> = React.memo(
  ({ children, chartId, enabled = process.env.NODE_ENV === 'development' }) => {
    // Memoized profiler callback with performance tracking
    const handleRender = useCallback(
      (
        id: string,
        phase: 'mount' | 'update' | 'nested-update',
        actualDuration: number,
        baseDuration: number,
        _startTime: number,
        _commitTime: number
      ) => {
        if (!enabled) return;

        // Update metrics
        const currentMetrics = profilerMetrics.get(chartId) || {
          renderCount: 0,
          totalDuration: 0,
          averageDuration: 0,
          slowestRender: 0,
          fastestRender: Number.MAX_VALUE,
          lastRender: 0,
        };

        const newMetrics: ProfilerMetrics = {
          renderCount: currentMetrics.renderCount + 1,
          totalDuration: currentMetrics.totalDuration + actualDuration,
          averageDuration: 0, // Will be calculated below
          slowestRender: Math.max(currentMetrics.slowestRender, actualDuration),
          fastestRender: Math.min(currentMetrics.fastestRender, actualDuration),
          lastRender: actualDuration,
        };

        newMetrics.averageDuration = newMetrics.totalDuration / newMetrics.renderCount;
        profilerMetrics.set(chartId, newMetrics);

        // Track performance issues
        if (actualDuration > 16) {
          // Longer than 1 frame

          // Track with React 19 monitor
          react19Monitor.trackFlushSync(
            chartId,
            `Slow ${phase} render: ${actualDuration.toFixed(2)}ms`
          );
        }

        // Log detailed profiler info in development
        if (process.env.NODE_ENV === 'development') {
          logger.debug(`Profiler: ${phase}`, 'ChartProfiler', {
            phase,
            actualDuration: `${actualDuration.toFixed(2)}ms`,
            baseDuration: `${baseDuration.toFixed(2)}ms`,
            renderCount: newMetrics.renderCount,
            averageDuration: `${newMetrics.averageDuration.toFixed(2)}ms`,
          });
        }

        // Performance reporting every 10 renders
        if (newMetrics.renderCount % 10 === 0) {
          reportPerformanceMetrics(chartId, newMetrics);
        }
      },
      [chartId, enabled]
    );

    // Don't wrap with Profiler if disabled
    if (!enabled) {
      return <>{children}</>;
    }

    return (
      <Profiler id={`chart-${chartId}`} onRender={handleRender}>
        {children}
      </Profiler>
    );
  }
);

ChartProfiler.displayName = 'ChartProfiler';

/**
 * Performance metrics reporter
 */
function reportPerformanceMetrics(chartId: string, metrics: ProfilerMetrics) {
  if (process.env.NODE_ENV !== 'development') return;

  // Performance recommendations
  const recommendations = [];
  if (metrics.averageDuration > 10) {
    recommendations.push('Consider using React.memo for child components');
  }
  if (metrics.slowestRender > 50) {
    recommendations.push('Break down large components into smaller chunks');
  }
  if (metrics.renderCount > 100 && metrics.averageDuration > 5) {
    recommendations.push('Optimize state updates and prop drilling');
  }
}

/**
 * Hook for accessing profiler metrics
 */
export function useChartProfilerMetrics(chartId: string) {
  const [,] = useState({});

  const metrics = profilerMetrics.get(chartId) || {
    renderCount: 0,
    totalDuration: 0,
    averageDuration: 0,
    slowestRender: 0,
    fastestRender: 0,
    lastRender: 0,
  };

  const refreshMetrics = useCallback(() => {
    // Force re-render would go here
  }, []);

  const resetMetrics = useCallback(() => {
    profilerMetrics.delete(chartId);
  }, [chartId]);

  return {
    metrics,
    refreshMetrics,
    resetMetrics,
  };
}

/**
 * Performance dashboard component for development
 */
export const ChartPerformanceDashboard: React.FC<{
  chartIds: string[];
  position?: 'top-right' | 'bottom-right' | 'bottom-left' | 'top-left';
}> = ({ chartIds, position = 'bottom-right' }) => {
  const [isOpen, setIsOpen] = useState(false);

  const allMetrics = useMemo(() => {
    return chartIds.map(chartId => ({
      chartId,
      ...(profilerMetrics.get(chartId) || {
        renderCount: 0,
        totalDuration: 0,
        averageDuration: 0,
        slowestRender: 0,
        fastestRender: 0,
        lastRender: 0,
      }),
    }));
  }, [chartIds]);

  const positionStyles = {
    'top-right': { top: '10px', right: '10px' },
    'bottom-right': { bottom: '10px', right: '10px' },
    'bottom-left': { bottom: '10px', left: '10px' },
    'top-left': { top: '10px', left: '10px' },
  };

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        ...positionStyles[position],
        zIndex: 9999,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        color: 'white',
        borderRadius: '8px',
        padding: '10px',
        minWidth: '250px',
        fontSize: '12px',
        fontFamily: 'monospace',
      }}
    >
      <div
        style={{
          cursor: 'pointer',
          padding: '5px',
          borderBottom: isOpen ? '1px solid #333' : 'none',
          marginBottom: isOpen ? '10px' : '0',
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        📊 Chart Performance {isOpen ? '▼' : '▶'}
      </div>

      {isOpen && (
        <div>
          {allMetrics.map(metric => (
            <div key={metric.chartId} style={{ marginBottom: '15px' }}>
              <div style={{ fontWeight: 'bold', color: '#4CAF50' }}>Chart: {metric.chartId}</div>
              <div>Renders: {metric.renderCount}</div>
              <div>Avg: {metric.averageDuration.toFixed(2)}ms</div>
              <div>Last: {metric.lastRender.toFixed(2)}ms</div>
              <div
                style={{
                  color: metric.slowestRender > 16 ? '#f56565' : '#68d391',
                }}
              >
                Peak: {metric.slowestRender.toFixed(2)}ms
              </div>
            </div>
          ))}

          <button
            onClick={() => {
              chartIds.forEach(id => profilerMetrics.delete(id));
              setIsOpen(false);
            }}
            style={{
              backgroundColor: '#f56565',
              color: 'white',
              border: 'none',
              padding: '5px 10px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '11px',
            }}
          >
            Reset All
          </button>
        </div>
      )}
    </div>
  );
};
