/**
 * @fileoverview Chart Container Component
 *
 * React component that manages the lifecycle and rendering of TradingView charts.
 * Provides React 19 concurrent features for optimal performance and user experience.
 *
 * This component provides:
 * - Chart initialization and cleanup
 * - React 19 transitions and deferred values
 * - Error boundary integration
 * - Responsive sizing and positioning
 * - Performance optimizations
 *
 * Features:
 * - Concurrent rendering with useTransition
 * - Deferred value updates for smooth performance
 * - FlushSync for critical DOM updates
 * - Automatic chart cleanup on unmount
 * - Error handling with fallback UI
 *
 * @example
 * ```tsx
 * import { ChartContainer } from './ChartContainer';
 *
 * <ChartContainer
 *   chartConfig={config}
 *   chartId="chart-1"
 *   containerId="container-1"
 *   width={800}
 *   height={400}
 *   onChartReady={(chart, id) => console.log('Chart ready:', id)}
 * />
 * ```
 */

import React, {
  useRef,
  useEffect,
  useCallback,
  useState,
  useTransition,
  useDeferredValue,
} from 'react';
import { flushSync } from 'react-dom';
import { createChart, IChartApi } from 'lightweight-charts';
import { ChartConfig } from '../types';
import { cleanLineStyleOptions } from '../utils/lineStyle';
import { ErrorBoundary } from './ErrorBoundary';
import { logger } from '../utils/logger';

interface ChartContainerProps {
  chartConfig: ChartConfig;
  chartId: string;
  containerId: string;
  width?: number | null;
  height?: number | null;
  onChartReady?: (chart: IChartApi, chartId: string) => void;
  onChartError?: (error: Error, chartId: string) => void;
}

export const ChartContainer: React.FC<ChartContainerProps> = React.memo(
  ({ chartConfig, chartId, containerId, width, height, onChartReady, onChartError }) => {
    const chartRef = useRef<IChartApi | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);

    // React 19 concurrent features
    const [isPendingChart, startChartTransition] = useTransition();
    const deferredChartConfig = useDeferredValue(chartConfig);

    // Create chart options with proper styling (using deferred config for better performance)
    const chartOptions = cleanLineStyleOptions({
      width:
        typeof deferredChartConfig.chart?.width === 'number'
          ? deferredChartConfig.chart.width
          : width || undefined,
      height:
        typeof deferredChartConfig.chart?.height === 'number'
          ? deferredChartConfig.chart.height
          : deferredChartConfig.chart?.height || height || undefined,
      ...deferredChartConfig.chart,
    });

    // Container styles
    const containerStyle: React.CSSProperties = {
      width: width ? `${width}px` : '100%',
      height: height ? `${height}px` : '400px',
      position: 'relative',
    };

    const chartContainerStyle: React.CSSProperties = {
      width: '100%',
      height: '100%',
      position: 'relative',
    };

    // Initialize chart with React 19 optimizations
    const initializeChart = useCallback(() => {
      if (!containerRef.current || isInitialized) return;

      startChartTransition(() => {
        try {
          // Create the chart
          const chart = createChart(containerRef.current as HTMLDivElement, chartOptions as any);
          chartRef.current = chart;

          // Use flushSync for critical DOM update to ensure immediate visual feedback
          flushSync(() => {
            setIsInitialized(true);
          });

          // Notify parent component (non-blocking)
          if (onChartReady) {
            onChartReady(chart, chartId);
          }
        } catch (error) {
          if (onChartError) {
            onChartError(error as Error, chartId);
          }
        }
      });
    }, [chartOptions, chartId, onChartReady, onChartError, isInitialized, startChartTransition]);

    // Cleanup chart
    const cleanup = useCallback(() => {
      if (chartRef.current) {
        try {
          chartRef.current.remove();
        } catch (error) {
          logger.error('Failed to remove chart during cleanup', 'ChartContainer', error);
        }
        chartRef.current = null;
        setIsInitialized(false);
      }
    }, []);

    // Handle resize with flushSync for immediate visual updates
    const handleResize = useCallback(() => {
      if (chartRef.current && containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        // Use flushSync for critical resize updates to avoid layout shift
        flushSync(() => {
          chartRef.current?.resize(clientWidth, clientHeight);
        });
      }
    }, []);

    // Initialize chart on mount
    useEffect(() => {
      initializeChart();
      return cleanup;
    }, [initializeChart, cleanup]);

    // Handle container resize
    useEffect(() => {
      if (!containerRef.current) return;

      const resizeObserver = new ResizeObserver(() => {
        handleResize();
      });

      resizeObserver.observe(containerRef.current);

      return () => {
        resizeObserver.disconnect();
      };
    }, [handleResize]);

    return (
      <ErrorBoundary
        resetKeys={[chartId, JSON.stringify(chartConfig)]}
        onError={error => {
          if (onChartError) {
            onChartError(error, chartId);
          }
        }}
      >
        <div style={containerStyle}>
          {isPendingChart && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                zIndex: 1000,
                fontSize: '14px',
                color: '#666',
              }}
            >
              Loading chart...
            </div>
          )}
          <div id={containerId} ref={containerRef} style={chartContainerStyle} />
        </div>
      </ErrorBoundary>
    );
  }
);

ChartContainer.displayName = 'ChartContainer';
