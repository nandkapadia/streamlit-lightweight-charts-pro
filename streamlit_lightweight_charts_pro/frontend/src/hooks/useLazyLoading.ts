/**
 * @fileoverview Lazy Loading Hook for Chart Data
 *
 * This hook monitors the visible range of a chart and automatically
 * requests more data when the user scrolls near the edges of loaded data.
 *
 * Features:
 * - Automatic detection of scroll near data boundaries
 * - Debounced history requests to prevent flooding
 * - Integration with Streamlit backend via setComponentValue
 * - Support for multiple series with independent lazy loading
 */

import { useEffect, useRef, useCallback } from 'react';
import { IChartApi, ITimeScaleApi, LogicalRange } from 'lightweight-charts';
import { Streamlit } from 'streamlit-component-lib';
import { SeriesConfig, LazyLoadingConfig, HistoryRequest } from '../types';
import { logger } from '../utils/logger';

/** Configuration for lazy loading behavior */
interface LazyLoadingOptions {
  /** Chart API instance */
  chart: IChartApi | null;
  /** Chart ID for requests */
  chartId: string;
  /** Series configurations with lazy loading info */
  seriesConfigs: SeriesConfig[];
  /** Threshold (in bars) to trigger loading more data */
  loadThreshold?: number;
  /** Debounce delay in milliseconds */
  debounceMs?: number;
  /** Callback when history is loaded */
  onHistoryLoaded?: (seriesId: string, data: unknown[]) => void;
}

/** State for tracking lazy loading per series */
interface SeriesLazyState {
  seriesId: string;
  paneId: number;
  lazyLoading: LazyLoadingConfig;
  isLoadingBefore: boolean;
  isLoadingAfter: boolean;
  lastRequestTime: number;
}

/**
 * Custom hook for lazy loading chart data.
 *
 * This hook subscribes to the chart's time scale changes and automatically
 * requests more data when the user scrolls near the boundaries of loaded data.
 *
 * @param options - Lazy loading configuration options
 *
 * @example
 * ```tsx
 * useLazyLoading({
 *   chart: chartRef.current,
 *   chartId: 'chart-1',
 *   seriesConfigs: config.series,
 *   onHistoryLoaded: (seriesId, data) => {
 *     // Merge new data with existing series
 *     mergeLazyLoadedData(seriesId, data);
 *   }
 * });
 * ```
 */
export function useLazyLoading({
  chart,
  chartId,
  seriesConfigs,
  loadThreshold = 50,
  debounceMs = 300,
  onHistoryLoaded,
}: LazyLoadingOptions): void {
  // Track lazy loading state per series
  const lazyStatesRef = useRef<Map<string, SeriesLazyState>>(new Map());
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingRequestsRef = useRef<Set<string>>(new Set());

  // Initialize lazy loading states from series configs
  useEffect(() => {
    const newStates = new Map<string, SeriesLazyState>();

    seriesConfigs.forEach((config, index) => {
      if (config.lazyLoading?.enabled) {
        const seriesId = config.seriesId || config.name || `series_${index}`;
        newStates.set(seriesId, {
          seriesId,
          paneId: config.paneId || 0,
          lazyLoading: config.lazyLoading,
          isLoadingBefore: false,
          isLoadingAfter: false,
          lastRequestTime: 0,
        });
      }
    });

    lazyStatesRef.current = newStates;

    logger.debug(`Lazy loading initialized for series: ${Array.from(newStates.keys()).join(', ')}`);
  }, [seriesConfigs]);

  // Request historical data from the backend
  const requestHistory = useCallback(
    (seriesId: string, beforeTime: number, direction: 'before' | 'after') => {
      const state = lazyStatesRef.current.get(seriesId);
      if (!state) return;

      // Prevent duplicate requests
      const requestKey = `${seriesId}_${direction}`;
      if (pendingRequestsRef.current.has(requestKey)) {
        logger.debug(`Skipping duplicate request: ${requestKey}`);
        return;
      }

      // Check if we can load more in this direction
      if (direction === 'before' && !state.lazyLoading.hasMoreBefore) {
        logger.debug(`No more data before for series ${seriesId}`);
        return;
      }
      if (direction === 'after' && !state.lazyLoading.hasMoreAfter) {
        logger.debug(`No more data after for series ${seriesId}`);
        return;
      }

      // Mark as loading
      pendingRequestsRef.current.add(requestKey);
      if (direction === 'before') {
        state.isLoadingBefore = true;
      } else {
        state.isLoadingAfter = true;
      }
      state.lastRequestTime = Date.now();

      // Create the history request
      const request: HistoryRequest = {
        type: 'load_history',
        chartId,
        paneId: state.paneId,
        seriesId,
        beforeTime,
        direction,
        count: state.lazyLoading.chunkSize,
        messageId: `history_${seriesId}_${Date.now()}`,
      };

      logger.info(`Requesting ${direction} history for ${seriesId} (beforeTime: ${beforeTime}, count: ${state.lazyLoading.chunkSize})`);

      // Send request to Streamlit backend
      Streamlit.setComponentValue(request);
    },
    [chartId]
  );

  // Check if we need to load more data based on visible range
  const checkAndLoadData = useCallback(
    (logicalRange: LogicalRange | null) => {
      if (!logicalRange || !chart) return;

      lazyStatesRef.current.forEach((state, seriesId) => {
        if (!state.lazyLoading.enabled) return;

        const { chunkInfo } = state.lazyLoading;
        if (!chunkInfo) return;

        // Get the series data to find boundary times
        const seriesConfig = seriesConfigs.find(
          (c) => (c.seriesId || c.name) === seriesId
        );
        if (!seriesConfig?.data?.length) return;

        const firstDataTime = seriesConfig.data[0]?.time;
        const lastDataTime = seriesConfig.data[seriesConfig.data.length - 1]?.time;

        if (!firstDataTime || !lastDataTime) return;

        // Check if we're near the start (need older data)
        if (
          state.lazyLoading.hasMoreBefore &&
          !state.isLoadingBefore &&
          logicalRange.from < loadThreshold
        ) {
          logger.debug(`Near start of data for ${seriesId}, requesting older data`);
          requestHistory(
            seriesId,
            typeof firstDataTime === 'number' ? firstDataTime : Date.parse(String(firstDataTime)) / 1000,
            'before'
          );
        }

        // Check if we're near the end (need newer data)
        const dataLength = seriesConfig.data.length;
        if (
          state.lazyLoading.hasMoreAfter &&
          !state.isLoadingAfter &&
          logicalRange.to > dataLength - loadThreshold
        ) {
          logger.debug(`Near end of data for ${seriesId}, requesting newer data`);
          requestHistory(
            seriesId,
            typeof lastDataTime === 'number' ? lastDataTime : Date.parse(String(lastDataTime)) / 1000,
            'after'
          );
        }
      });
    },
    [chart, seriesConfigs, loadThreshold, requestHistory]
  );

  // Debounced range change handler
  const handleVisibleRangeChange = useCallback(
    (logicalRange: LogicalRange | null) => {
      // Clear existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set new debounced timer
      debounceTimerRef.current = setTimeout(() => {
        checkAndLoadData(logicalRange);
      }, debounceMs);
    },
    [checkAndLoadData, debounceMs]
  );

  // Subscribe to visible range changes
  useEffect(() => {
    if (!chart) return;

    // Check if any series has lazy loading enabled
    const hasLazyLoading = Array.from(lazyStatesRef.current.values()).some(
      (state) => state.lazyLoading.enabled
    );

    if (!hasLazyLoading) {
      logger.debug('No series with lazy loading enabled, skipping subscription');
      return;
    }

    const timeScale: ITimeScaleApi<unknown> = chart.timeScale();

    // Subscribe to logical range changes (bar indices)
    timeScale.subscribeVisibleLogicalRangeChange(handleVisibleRangeChange);

    logger.info('Subscribed to visible range changes for lazy loading');

    return () => {
      // Cleanup subscription
      timeScale.unsubscribeVisibleLogicalRangeChange(handleVisibleRangeChange);
      // Clear debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      logger.debug('Unsubscribed from visible range changes');
    };
  }, [chart, handleVisibleRangeChange]);

  // Listen for history response from backend
  useEffect(() => {
    const handleHistoryResponse = (event: CustomEvent) => {
      const { messageId, response } = event.detail || {};
      if (!messageId?.startsWith('history_') || !response) return;

      const seriesId = response.seriesId;
      const state = lazyStatesRef.current.get(seriesId);

      if (!state) {
        logger.warn(`Received history for unknown series: ${seriesId}`);
        return;
      }

      // Update loading state
      const direction = response.direction || 'before';
      const requestKey = `${seriesId}_${direction}`;
      pendingRequestsRef.current.delete(requestKey);

      if (direction === 'before') {
        state.isLoadingBefore = false;
        state.lazyLoading.hasMoreBefore = response.hasMoreBefore;
      } else {
        state.isLoadingAfter = false;
        state.lazyLoading.hasMoreAfter = response.hasMoreAfter;
      }

      // Update chunk info
      if (response.chunkInfo) {
        state.lazyLoading.chunkInfo = response.chunkInfo;
      }

      logger.info(`Received ${response.data?.length || 0} points for ${seriesId} (hasMoreBefore: ${response.hasMoreBefore}, hasMoreAfter: ${response.hasMoreAfter})`);

      // Notify callback
      if (onHistoryLoaded && response.data?.length) {
        onHistoryLoaded(seriesId, response.data);
      }
    };

    // Listen for API responses
    document.addEventListener(
      'streamlit:apiResponse',
      handleHistoryResponse as EventListener
    );

    return () => {
      document.removeEventListener(
        'streamlit:apiResponse',
        handleHistoryResponse as EventListener
      );
    };
  }, [onHistoryLoaded]);
}

/**
 * Updates lazy loading state when new history data is received.
 *
 * @param state - Current lazy loading state
 * @param response - History response from backend
 */
export function updateLazyLoadingState(
  state: SeriesLazyState,
  response: {
    hasMoreBefore: boolean;
    hasMoreAfter: boolean;
    chunkInfo?: LazyLoadingConfig['chunkInfo'];
  }
): void {
  state.lazyLoading.hasMoreBefore = response.hasMoreBefore;
  state.lazyLoading.hasMoreAfter = response.hasMoreAfter;
  if (response.chunkInfo) {
    state.lazyLoading.chunkInfo = response.chunkInfo;
  }
}

export default useLazyLoading;
