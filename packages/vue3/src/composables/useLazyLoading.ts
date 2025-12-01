/**
 * @fileoverview Vue 3 composable for lazy loading chart data.
 *
 * This composable monitors the visible range of a chart and automatically
 * requests more data when the user scrolls near the edges of loaded data.
 * It implements the infinite history loading pattern.
 */

import { ref, watch, onUnmounted, type Ref } from 'vue';
import type { IChartApi, LogicalRange } from 'lightweight-charts';
import type { SeriesConfig, LazyLoadingConfig, DataPoint } from '../types';

/**
 * State for tracking lazy loading per series.
 */
interface SeriesLazyState {
  seriesId: string;
  paneId: number;
  lazyLoading: LazyLoadingConfig;
  isLoadingBefore: boolean;
  isLoadingAfter: boolean;
  lastRequestTime: number;
}

/**
 * Lazy loading state returned by the composable.
 */
export interface UseLazyLoadingState {
  /** Whether any series is currently loading */
  isLoading: Ref<boolean>;
  /** Map of series ID to loading state */
  loadingStates: Ref<Map<string, SeriesLazyState>>;
  /** Set of pending request keys */
  pendingRequests: Ref<Set<string>>;
}

/**
 * Lazy loading methods returned by the composable.
 */
export interface UseLazyLoadingMethods {
  /** Manually trigger a history request */
  requestHistory: (
    seriesId: string,
    beforeTime: number,
    direction: 'before' | 'after'
  ) => void;
  /** Update lazy loading state after receiving history */
  handleHistoryResponse: (
    seriesId: string,
    direction: 'before' | 'after',
    hasMoreBefore: boolean,
    hasMoreAfter: boolean
  ) => void;
  /** Reset all loading states */
  reset: () => void;
}

/**
 * Return type of the useLazyLoading composable.
 */
export type UseLazyLoadingReturn = UseLazyLoadingState & UseLazyLoadingMethods;

/**
 * Options for the useLazyLoading composable.
 */
export interface UseLazyLoadingOptions {
  /** Chart API instance ref */
  chart: Ref<IChartApi | null>;
  /** Series configurations ref */
  seriesConfigs: Ref<SeriesConfig[]>;
  /** Threshold (in bars) to trigger loading more data */
  loadThreshold?: number;
  /** Debounce delay in milliseconds */
  debounceMs?: number;
  /** Callback to request history from backend */
  onRequestHistory: (
    seriesId: string,
    paneId: number,
    beforeTime: number,
    direction: 'before' | 'after',
    count: number
  ) => void;
  /** Callback when history is loaded */
  onHistoryLoaded?: (seriesId: string, data: DataPoint[]) => void;
}

/**
 * Vue 3 composable for lazy loading chart data.
 *
 * This composable subscribes to the chart's time scale changes and automatically
 * requests more data when the user scrolls near the boundaries of loaded data.
 *
 * @param options - Lazy loading configuration options
 * @returns Lazy loading state and methods
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { ref } from 'vue';
 * import { useLazyLoading, useChartApi } from '@lightweight-charts-pro/vue3';
 * import type { IChartApi } from 'lightweight-charts';
 *
 * const chart = ref<IChartApi | null>(null);
 * const seriesConfigs = ref([
 *   {
 *     seriesId: 'price',
 *     seriesType: 'candlestick',
 *     data: [],
 *     lazyLoading: {
 *       enabled: true,
 *       chunkSize: 500,
 *       hasMoreBefore: true,
 *       hasMoreAfter: false,
 *     }
 *   }
 * ]);
 *
 * const { getHistory } = useChartApi();
 *
 * const { isLoading, handleHistoryResponse } = useLazyLoading({
 *   chart,
 *   seriesConfigs,
 *   onRequestHistory: async (seriesId, paneId, beforeTime, direction, count) => {
 *     const response = await getHistory('my-chart', paneId, seriesId, beforeTime, count);
 *     handleHistoryResponse(seriesId, direction, response.hasMoreBefore, response.hasMoreAfter);
 *   }
 * });
 * </script>
 * ```
 */
export function useLazyLoading(options: UseLazyLoadingOptions): UseLazyLoadingReturn {
  const {
    chart,
    seriesConfigs,
    loadThreshold = 50,
    debounceMs = 300,
    onRequestHistory,
  } = options;

  // Reactive state
  const isLoading = ref(false);
  const loadingStates = ref<Map<string, SeriesLazyState>>(new Map());
  const pendingRequests = ref<Set<string>>(new Set());

  // Internal state
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let unsubscribe: (() => void) | null = null;

  /**
   * Initialize lazy loading states from series configs.
   */
  function initializeStates(): void {
    const newStates = new Map<string, SeriesLazyState>();

    seriesConfigs.value.forEach((config, index) => {
      if (config.lazyLoading?.enabled) {
        const seriesId = config.seriesId || config.name || `series_${index}`;
        newStates.set(seriesId, {
          seriesId,
          paneId: config.paneId || 0,
          lazyLoading: { ...config.lazyLoading },
          isLoadingBefore: false,
          isLoadingAfter: false,
          lastRequestTime: 0,
        });
      }
    });

    loadingStates.value = newStates;
  }

  /**
   * Request historical data for a series.
   */
  function requestHistory(
    seriesId: string,
    beforeTime: number,
    direction: 'before' | 'after'
  ): void {
    const state = loadingStates.value.get(seriesId);
    if (!state) return;

    // Prevent duplicate requests
    const requestKey = `${seriesId}_${direction}`;
    if (pendingRequests.value.has(requestKey)) {
      return;
    }

    // Check if we can load more in this direction
    if (direction === 'before' && !state.lazyLoading.hasMoreBefore) {
      return;
    }
    if (direction === 'after' && !state.lazyLoading.hasMoreAfter) {
      return;
    }

    // Mark as loading
    pendingRequests.value.add(requestKey);
    if (direction === 'before') {
      state.isLoadingBefore = true;
    } else {
      state.isLoadingAfter = true;
    }
    state.lastRequestTime = Date.now();
    isLoading.value = true;

    // Call the request callback
    onRequestHistory(
      seriesId,
      state.paneId,
      beforeTime,
      direction,
      state.lazyLoading.chunkSize
    );
  }

  /**
   * Handle history response and update loading state.
   */
  function handleHistoryResponse(
    seriesId: string,
    direction: 'before' | 'after',
    hasMoreBefore: boolean,
    hasMoreAfter: boolean
  ): void {
    const state = loadingStates.value.get(seriesId);
    if (!state) return;

    // Update loading state
    const requestKey = `${seriesId}_${direction}`;
    pendingRequests.value.delete(requestKey);

    if (direction === 'before') {
      state.isLoadingBefore = false;
      state.lazyLoading.hasMoreBefore = hasMoreBefore;
    } else {
      state.isLoadingAfter = false;
      state.lazyLoading.hasMoreAfter = hasMoreAfter;
    }

    // Update global loading state
    isLoading.value = Array.from(loadingStates.value.values()).some(
      (s) => s.isLoadingBefore || s.isLoadingAfter
    );
  }

  /**
   * Check if we need to load more data based on visible range.
   */
  function checkAndLoadData(logicalRange: LogicalRange | null): void {
    if (!logicalRange || !chart.value) return;

    loadingStates.value.forEach((state, seriesId) => {
      if (!state.lazyLoading.enabled) return;

      // Find the series config
      const seriesConfig = seriesConfigs.value.find(
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
        const beforeTime = typeof firstDataTime === 'number'
          ? firstDataTime
          : Date.parse(String(firstDataTime)) / 1000;
        requestHistory(seriesId, beforeTime, 'before');
      }

      // Check if we're near the end (need newer data)
      const dataLength = seriesConfig.data.length;
      if (
        state.lazyLoading.hasMoreAfter &&
        !state.isLoadingAfter &&
        logicalRange.to > dataLength - loadThreshold
      ) {
        const afterTime = typeof lastDataTime === 'number'
          ? lastDataTime
          : Date.parse(String(lastDataTime)) / 1000;
        requestHistory(seriesId, afterTime, 'after');
      }
    });
  }

  /**
   * Debounced range change handler.
   */
  function handleVisibleRangeChange(logicalRange: LogicalRange | null): void {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    debounceTimer = setTimeout(() => {
      checkAndLoadData(logicalRange);
    }, debounceMs);
  }

  /**
   * Subscribe to chart's visible range changes.
   */
  function subscribeToChart(): void {
    if (!chart.value) return;

    // Check if any series has lazy loading enabled
    const hasLazyLoading = Array.from(loadingStates.value.values()).some(
      (state) => state.lazyLoading.enabled
    );

    if (!hasLazyLoading) return;

    const timeScale = chart.value.timeScale();
    timeScale.subscribeVisibleLogicalRangeChange(handleVisibleRangeChange);

    unsubscribe = () => {
      timeScale.unsubscribeVisibleLogicalRangeChange(handleVisibleRangeChange);
    };
  }

  /**
   * Unsubscribe from chart changes.
   */
  function unsubscribeFromChart(): void {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
  }

  /**
   * Reset all loading states.
   */
  function reset(): void {
    unsubscribeFromChart();
    loadingStates.value.clear();
    pendingRequests.value.clear();
    isLoading.value = false;
    initializeStates();
    subscribeToChart();
  }

  // Watch for chart changes
  watch(chart, (newChart) => {
    unsubscribeFromChart();
    if (newChart) {
      subscribeToChart();
    }
  });

  // Watch for series config changes
  watch(
    seriesConfigs,
    () => {
      initializeStates();
    },
    { deep: true }
  );

  // Initialize on creation
  initializeStates();

  // Cleanup on unmount
  onUnmounted(() => {
    unsubscribeFromChart();
  });

  return {
    // State
    isLoading,
    loadingStates,
    pendingRequests,
    // Methods
    requestHistory,
    handleHistoryResponse,
    reset,
  };
}

export default useLazyLoading;
