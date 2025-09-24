/**
 * Chart series management component
 * Extracted from LightweightCharts.tsx for better separation of concerns
 */

import React, { useEffect, useRef, useCallback, useTransition, useDeferredValue } from 'react';
import { IChartApi, createSeriesMarkers, Time } from 'lightweight-charts';
import { SeriesConfig, TradeConfig } from '../types';
import { ExtendedSeriesApi, SeriesDataPoint } from '../types/ChartInterfaces';
import { createSeries } from '../utils/seriesFactory';
import { cleanLineStyleOptions } from '../utils/lineStyle';

interface ChartSeriesManagerProps {
  chart: IChartApi | null;
  chartId: string;
  seriesConfigs: SeriesConfig[];
  trades?: TradeConfig[];
  onSeriesCreated?: (_series: ExtendedSeriesApi, _config: SeriesConfig) => void;
  onError?: (_error: Error, _context: string) => void;
}

/**
 * Manages chart series creation, updates, and lifecycle
 */
export const ChartSeriesManager: React.FC<ChartSeriesManagerProps> = ({
  chart,
  chartId,
  seriesConfigs,
  trades = [],
  onSeriesCreated,
  onError,
}) => {
  const seriesRefsRef = useRef<Map<string, ExtendedSeriesApi>>(new Map());
  const signalSeriesRefsRef = useRef<Map<string, ExtendedSeriesApi>>(new Map());

  // React 19 concurrent features for better performance
  const [, startSeriesTransition] = useTransition();
  const [, startDataTransition] = useTransition();
  const deferredSeriesConfigs = useDeferredValue(seriesConfigs);
  const deferredTrades = useDeferredValue(trades);

  /**
   * Create a single series with error handling
   */
  const createSeriesWithErrorHandling = useCallback(
    (seriesConfig: SeriesConfig, index: number): ExtendedSeriesApi | null => {
      if (!chart) return null;

      try {
        // Clean line style options before creating series
        const cleanedConfig = {
          ...seriesConfig,
          ...('line_style' in seriesConfig && seriesConfig.line_style
            ? cleanLineStyleOptions(seriesConfig.line_style as Record<string, unknown>)
            : {}),
        };

        const series = createSeries(chart, cleanedConfig, {}, chartId, index);

        if (series) {
          const seriesKey = `series-${chartId}-${index}`;
          seriesRefsRef.current.set(seriesKey, series);
          onSeriesCreated?.(series, seriesConfig);
          return series;
        }
      } catch (error) {
        onError?.(error as Error, `createSeries-${index}`);
      }

      return null;
    },
    [chart, chartId, onSeriesCreated, onError]
  );

  /**
   * Setup trade markers for a series (uses deferred trades for better performance)
   */
  const setupTradeMarkers = useCallback(
    (series: ExtendedSeriesApi, seriesConfig: SeriesConfig, index: number) => {
      if (!deferredTrades || deferredTrades.length === 0) return;

      try {
        const seriesData = seriesConfig.data || [];
        const markers = deferredTrades
          .filter(trade => {
            // Filter trades relevant to this series
            return (
              trade.series_id === seriesConfig.name ||
              trade.series_index === index ||
              !trade.series_id
            ); // Apply to all series if no specific ID
          })
          .map(trade => {
            const nearestTime = findNearestTimeInData(trade.entryTime, seriesData);
            return {
              time: (nearestTime || convertToTimestamp(trade.entryTime)) as Time,
              position:
                (trade.side || trade.tradeType) === 'long'
                  ? 'belowBar'
                  : ('aboveBar' as 'belowBar' | 'aboveBar'),
              color: (trade.side || trade.tradeType) === 'long' ? '#4CAF50' : '#f44336',
              shape:
                (trade.side || trade.tradeType) === 'long'
                  ? 'arrowUp'
                  : ('arrowDown' as 'arrowUp' | 'arrowDown'),
              text: `${(trade.side || trade.tradeType).toUpperCase()} ${trade.quantity || ''}`,
              price: trade.entryPrice,
            };
          });

        if (markers.length > 0) {
          createSeriesMarkers(series, markers);
        }
      } catch (error) {
        onError?.(error as Error, `tradeMarkers-${index}`);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [deferredTrades, onError]
  );

  /**
   * Create all series from configurations (with React 19 concurrent features)
   */
  const createAllSeries = useCallback(() => {
    if (!chart || !deferredSeriesConfigs || deferredSeriesConfigs.length === 0) return;

    // Use transition for non-urgent series creation to avoid blocking UI
    startSeriesTransition(() => {
      // Clear existing series
      seriesRefsRef.current.clear();
      signalSeriesRefsRef.current.clear();

      // Create each series with concurrent rendering
      deferredSeriesConfigs.forEach((seriesConfig, index) => {
        const series = createSeriesWithErrorHandling(seriesConfig, index);

        if (series) {
          // Setup trade markers if available (non-blocking)
          setupTradeMarkers(series, seriesConfig, index);

          // Handle special series types
          if (seriesConfig.type === 'signal') {
            const seriesKey = `signal-${chartId}-${index}`;
            signalSeriesRefsRef.current.set(seriesKey, series);
          }
        }
      });
    });
  }, [chart, deferredSeriesConfigs, chartId, createSeriesWithErrorHandling, setupTradeMarkers, startSeriesTransition]);

  /**
   * Update existing series data (with React 19 concurrent features)
   */
  const updateSeriesData = useCallback(() => {
    // Use transition for non-urgent data updates to maintain responsiveness
    startDataTransition(() => {
      deferredSeriesConfigs.forEach((seriesConfig, index) => {
        const seriesKey = `series-${chartId}-${index}`;
        const series = seriesRefsRef.current.get(seriesKey);

        if (series && seriesConfig.data) {
          try {
            series.setData(seriesConfig.data as any);
          } catch (error) {
            onError?.(error as Error, `updateSeriesData-${index}`);
          }
        }
      });
    });
  }, [deferredSeriesConfigs, chartId, onError, startDataTransition]);

  /**
   * Find nearest time in series data
   */
  /**
   * Convert time value to Unix timestamp in seconds
   */
  const convertToTimestamp = useCallback((time: string | number): number => {
    if (typeof time === 'number') {
      return time > 1000000000000 ? Math.floor(time / 1000) : time;
    } else {
      return Math.floor(new Date(time).getTime() / 1000);
    }
  }, []);

  const findNearestTimeInData = useCallback(
    (targetTime: string | number, data: SeriesDataPoint[]): number | null => {
      const targetTimestamp = convertToTimestamp(targetTime);
      if (!data || data.length === 0) return null;

      let nearestTime: number | null = null;
      let minDiff = Infinity;

      for (const item of data) {
        if (!item.time) continue;

        let itemTime: number | null = null;
        if (typeof item.time === 'number') {
          itemTime = item.time > 1000000000000 ? Math.floor(item.time / 1000) : item.time;
        } else if (typeof item.time === 'string') {
          itemTime = Math.floor(new Date(item.time).getTime() / 1000);
        }

        if (itemTime !== null) {
          const diff = Math.abs(itemTime - targetTimestamp);
          if (diff < minDiff) {
            minDiff = diff;
            nearestTime = itemTime;
          }
        }
      }

      return nearestTime;
    },
    [convertToTimestamp]
  );

  /**
   * Cleanup series on unmount
   */
  const cleanup = useCallback(() => {
    try {
      // Remove all series from chart
      for (const series of seriesRefsRef.current.values()) {
        if (chart && series) {
          chart.removeSeries(series);
        }
      }

      seriesRefsRef.current.clear();
      signalSeriesRefsRef.current.clear();
    } catch (error) {
      onError?.(error as Error, 'seriesCleanup');
    }
  }, [chart, onError]);

  // Create series when chart or configs change
  useEffect(() => {
    createAllSeries();
    return cleanup;
  }, [createAllSeries, cleanup]);

  // Update series data when configs change (without recreating series)
  useEffect(() => {
    updateSeriesData();
  }, [updateSeriesData]);

  // Note: useImperativeHandle removed - not properly used without forwardRef

  // This component doesn't render anything - it only manages series
  return null;
};
