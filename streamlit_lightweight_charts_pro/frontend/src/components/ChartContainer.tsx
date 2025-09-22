import React, { useRef, useEffect, useCallback, useState } from 'react';
import { createChart, IChartApi } from 'lightweight-charts';
import { ChartConfig } from '../types';
import { cleanLineStyleOptions } from '../utils/lineStyle';
import { ErrorBoundary } from './ErrorBoundary';

interface ChartContainerProps {
  chartConfig: ChartConfig;
  chartId: string;
  containerId: string;
  width?: number | null;
  height?: number | null;
  onChartReady?: (chart: IChartApi, chartId: string) => void;
  onChartError?: (error: Error, chartId: string) => void;
}

export const ChartContainer: React.FC<ChartContainerProps> = React.memo(({
  chartConfig,
  chartId,
  containerId,
  width,
  height,
  onChartReady,
  onChartError
}) => {
  const chartRef = useRef<IChartApi | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Create chart options with proper styling
  const chartOptions = cleanLineStyleOptions({
    width: typeof chartConfig.chart?.width === 'number'
      ? chartConfig.chart.width
      : width || undefined,
    height: typeof chartConfig.chart?.height === 'number'
      ? chartConfig.chart.height
      : chartConfig.chart?.height || height || undefined,
    ...chartConfig.chart,
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

  // Initialize chart
  const initializeChart = useCallback(() => {
    if (!containerRef.current || isInitialized) return;

    try {
      // Create the chart
      const chart = createChart(containerRef.current, chartOptions as any);
      chartRef.current = chart;
      setIsInitialized(true);

      // Notify parent component
      if (onChartReady) {
        onChartReady(chart, chartId);
      }
    } catch (error) {
      console.error(`Failed to initialize chart ${chartId}:`, error);
      if (onChartError) {
        onChartError(error as Error, chartId);
      }
    }
  }, [chartOptions, chartId, onChartReady, onChartError, isInitialized]);

  // Cleanup chart
  const cleanup = useCallback(() => {
    if (chartRef.current) {
      try {
        chartRef.current.remove();
      } catch (error) {
        console.error(`Failed to cleanup chart ${chartId}:`, error);
      }
      chartRef.current = null;
      setIsInitialized(false);
    }
  }, [chartId]);

  // Handle resize
  const handleResize = useCallback(() => {
    if (chartRef.current && containerRef.current) {
      const { clientWidth, clientHeight } = containerRef.current;
      chartRef.current.resize(clientWidth, clientHeight);
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
      onError={(error) => {
        console.error(`Chart container error for ${chartId}:`, error);
        if (onChartError) {
          onChartError(error, chartId);
        }
      }}
    >
      <div style={containerStyle}>
        <div
          id={containerId}
          ref={containerRef}
          style={chartContainerStyle}
        />
      </div>
    </ErrorBoundary>
  );
});

ChartContainer.displayName = 'ChartContainer';