/**
 * @fileoverview Unit tests for the useLazyLoading composable.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ref, nextTick } from 'vue';
import { useLazyLoading } from '../../../src/composables/useLazyLoading';
import type { SeriesConfig } from '../../../src/types';

// Mock chart API
function createMockChart() {
  const rangeChangeHandler = { current: null as ((range: unknown) => void) | null };

  return {
    chart: {
      timeScale: () => ({
        subscribeVisibleLogicalRangeChange: (handler: (range: unknown) => void) => {
          rangeChangeHandler.current = handler;
        },
        unsubscribeVisibleLogicalRangeChange: () => {
          rangeChangeHandler.current = null;
        },
      }),
    },
    triggerRangeChange: (range: { from: number; to: number }) => {
      rangeChangeHandler.current?.(range);
    },
  };
}

describe('useLazyLoading', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('initialization', () => {
    it('should initialize with lazy loading states from configs', () => {
      const mockChart = createMockChart();
      const chart = ref(mockChart.chart as unknown as null);
      const seriesConfigs = ref<SeriesConfig[]>([
        {
          seriesId: 'price',
          seriesType: 'candlestick',
          data: [],
          lazyLoading: {
            enabled: true,
            chunkSize: 500,
            hasMoreBefore: true,
            hasMoreAfter: false,
          },
        },
      ]);

      const onRequestHistory = vi.fn();

      const { loadingStates } = useLazyLoading({
        chart,
        seriesConfigs,
        onRequestHistory,
      });

      expect(loadingStates.value.size).toBe(1);
      expect(loadingStates.value.has('price')).toBe(true);
    });

    it('should not create states for series without lazy loading', () => {
      const mockChart = createMockChart();
      const chart = ref(mockChart.chart as unknown as null);
      const seriesConfigs = ref<SeriesConfig[]>([
        {
          seriesId: 'price',
          seriesType: 'candlestick',
          data: [],
          lazyLoading: {
            enabled: false,
            chunkSize: 500,
            hasMoreBefore: true,
            hasMoreAfter: false,
          },
        },
      ]);

      const onRequestHistory = vi.fn();

      const { loadingStates } = useLazyLoading({
        chart,
        seriesConfigs,
        onRequestHistory,
      });

      expect(loadingStates.value.size).toBe(0);
    });
  });

  describe('requestHistory', () => {
    it('should request history for a series', () => {
      const mockChart = createMockChart();
      const chart = ref(mockChart.chart as unknown as null);
      const seriesConfigs = ref<SeriesConfig[]>([
        {
          seriesId: 'price',
          seriesType: 'candlestick',
          data: [{ time: 1234567890, open: 100, high: 105, low: 98, close: 102 }],
          lazyLoading: {
            enabled: true,
            chunkSize: 500,
            hasMoreBefore: true,
            hasMoreAfter: false,
          },
        },
      ]);

      const onRequestHistory = vi.fn();

      const { requestHistory, pendingRequests, isLoading } = useLazyLoading({
        chart,
        seriesConfigs,
        onRequestHistory,
      });

      requestHistory('price', 1234567890, 'before');

      expect(onRequestHistory).toHaveBeenCalledWith(
        'price',
        0,
        1234567890,
        'before',
        500
      );
      expect(pendingRequests.value.has('price_before')).toBe(true);
      expect(isLoading.value).toBe(true);
    });

    it('should not request if no more data available', () => {
      const mockChart = createMockChart();
      const chart = ref(mockChart.chart as unknown as null);
      const seriesConfigs = ref<SeriesConfig[]>([
        {
          seriesId: 'price',
          seriesType: 'candlestick',
          data: [],
          lazyLoading: {
            enabled: true,
            chunkSize: 500,
            hasMoreBefore: false,
            hasMoreAfter: false,
          },
        },
      ]);

      const onRequestHistory = vi.fn();

      const { requestHistory } = useLazyLoading({
        chart,
        seriesConfigs,
        onRequestHistory,
      });

      requestHistory('price', 1234567890, 'before');

      expect(onRequestHistory).not.toHaveBeenCalled();
    });

    it('should not create duplicate requests', () => {
      const mockChart = createMockChart();
      const chart = ref(mockChart.chart as unknown as null);
      const seriesConfigs = ref<SeriesConfig[]>([
        {
          seriesId: 'price',
          seriesType: 'candlestick',
          data: [],
          lazyLoading: {
            enabled: true,
            chunkSize: 500,
            hasMoreBefore: true,
            hasMoreAfter: false,
          },
        },
      ]);

      const onRequestHistory = vi.fn();

      const { requestHistory } = useLazyLoading({
        chart,
        seriesConfigs,
        onRequestHistory,
      });

      requestHistory('price', 1234567890, 'before');
      requestHistory('price', 1234567890, 'before');

      expect(onRequestHistory).toHaveBeenCalledTimes(1);
    });
  });

  describe('handleHistoryResponse', () => {
    it('should update loading state after response', () => {
      const mockChart = createMockChart();
      const chart = ref(mockChart.chart as unknown as null);
      const seriesConfigs = ref<SeriesConfig[]>([
        {
          seriesId: 'price',
          seriesType: 'candlestick',
          data: [],
          lazyLoading: {
            enabled: true,
            chunkSize: 500,
            hasMoreBefore: true,
            hasMoreAfter: false,
          },
        },
      ]);

      const onRequestHistory = vi.fn();

      const { requestHistory, handleHistoryResponse, isLoading, loadingStates } = useLazyLoading({
        chart,
        seriesConfigs,
        onRequestHistory,
      });

      requestHistory('price', 1234567890, 'before');
      expect(isLoading.value).toBe(true);

      handleHistoryResponse('price', 'before', false, false);

      expect(isLoading.value).toBe(false);
      const state = loadingStates.value.get('price');
      expect(state?.lazyLoading.hasMoreBefore).toBe(false);
    });
  });

  describe('reset', () => {
    it('should reset all loading states', () => {
      const mockChart = createMockChart();
      const chart = ref(mockChart.chart as unknown as null);
      const seriesConfigs = ref<SeriesConfig[]>([
        {
          seriesId: 'price',
          seriesType: 'candlestick',
          data: [],
          lazyLoading: {
            enabled: true,
            chunkSize: 500,
            hasMoreBefore: true,
            hasMoreAfter: false,
          },
        },
      ]);

      const onRequestHistory = vi.fn();

      const { requestHistory, reset, pendingRequests, isLoading } = useLazyLoading({
        chart,
        seriesConfigs,
        onRequestHistory,
      });

      requestHistory('price', 1234567890, 'before');
      expect(isLoading.value).toBe(true);

      reset();

      expect(isLoading.value).toBe(false);
      expect(pendingRequests.value.size).toBe(0);
    });
  });

  describe('automatic loading', () => {
    it('should trigger history request when scrolling near start', async () => {
      const mockChart = createMockChart();
      const chart = ref(mockChart.chart as unknown as null);
      const seriesConfigs = ref<SeriesConfig[]>([
        {
          seriesId: 'price',
          seriesType: 'candlestick',
          data: Array(100).fill(null).map((_, i) => ({
            time: 1234567890 + i * 86400,
            open: 100,
            high: 105,
            low: 98,
            close: 102,
          })),
          lazyLoading: {
            enabled: true,
            chunkSize: 500,
            hasMoreBefore: true,
            hasMoreAfter: false,
          },
        },
      ]);

      const onRequestHistory = vi.fn();

      useLazyLoading({
        chart,
        seriesConfigs,
        loadThreshold: 50,
        debounceMs: 100,
        onRequestHistory,
      });

      // Simulate scrolling near start (from < loadThreshold)
      mockChart.triggerRangeChange({ from: 10, to: 60 });

      // Wait for debounce
      vi.advanceTimersByTime(150);

      expect(onRequestHistory).toHaveBeenCalled();
    });

    it('should trigger history request when scrolling near end', async () => {
      const mockChart = createMockChart();
      const chart = ref(mockChart.chart as unknown as null);
      const dataLength = 100;
      const seriesConfigs = ref<SeriesConfig[]>([
        {
          seriesId: 'price',
          seriesType: 'candlestick',
          data: Array(dataLength).fill(null).map((_, i) => ({
            time: 1234567890 + i * 86400,
            open: 100,
            high: 105,
            low: 98,
            close: 102,
          })),
          lazyLoading: {
            enabled: true,
            chunkSize: 500,
            hasMoreBefore: false,
            hasMoreAfter: true,
          },
        },
      ]);

      const onRequestHistory = vi.fn();

      useLazyLoading({
        chart,
        seriesConfigs,
        loadThreshold: 50,
        debounceMs: 100,
        onRequestHistory,
      });

      // Simulate scrolling near end (to > dataLength - loadThreshold)
      mockChart.triggerRangeChange({ from: 40, to: 90 });

      // Wait for debounce
      vi.advanceTimersByTime(150);

      expect(onRequestHistory).toHaveBeenCalled();
    });
  });

  describe('config changes', () => {
    it('should reinitialize when series configs change', async () => {
      const mockChart = createMockChart();
      const chart = ref(mockChart.chart as unknown as null);
      const seriesConfigs = ref<SeriesConfig[]>([
        {
          seriesId: 'price',
          seriesType: 'candlestick',
          data: [],
          lazyLoading: {
            enabled: true,
            chunkSize: 500,
            hasMoreBefore: true,
            hasMoreAfter: false,
          },
        },
      ]);

      const onRequestHistory = vi.fn();

      const { loadingStates } = useLazyLoading({
        chart,
        seriesConfigs,
        onRequestHistory,
      });

      expect(loadingStates.value.size).toBe(1);

      // Add another series
      seriesConfigs.value = [
        ...seriesConfigs.value,
        {
          seriesId: 'volume',
          seriesType: 'histogram',
          data: [],
          lazyLoading: {
            enabled: true,
            chunkSize: 500,
            hasMoreBefore: true,
            hasMoreAfter: false,
          },
        },
      ];

      await nextTick();

      expect(loadingStates.value.size).toBe(2);
      expect(loadingStates.value.has('volume')).toBe(true);
    });
  });
});
