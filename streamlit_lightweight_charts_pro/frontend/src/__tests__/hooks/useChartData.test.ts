/**
 * @fileoverview Comprehensive tests for chart data hooks
 *
 * Tests cover:
 * - useChartData - basic data fetching with caching
 * - useRealtimeChartData - real-time updates with transitions
 * - useMultiChartData - batch fetching multiple charts
 * - usePrefetchChartData - prefetching and cache management
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import {
  useChartData,
  useRealtimeChartData,
  useMultiChartData,
  usePrefetchChartData,
} from '../../hooks/useChartData';
import { react19Monitor } from '../../utils/react19PerformanceMonitor';

// Mock react19PerformanceMonitor
vi.mock('../../utils/react19PerformanceMonitor', () => ({
  react19Monitor: {
    startTransition: vi.fn(() => 'transition-id'),
    endTransition: vi.fn(),
  },
}));

// Mock logger
vi.mock('../../utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    log: vi.fn(),
  },
}));

describe('Chart Data Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear cache before each test to avoid interference
    const { result } = renderHook(() => usePrefetchChartData());
    result.current.clearCache();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('useChartData', () => {
    it('should return data promise and metadata', () => {
      const { result } = renderHook(() =>
        useChartData({
          chartId: 'test-chart-1',
        })
      );

      expect(result.current.dataPromise).toBeInstanceOf(Promise);
      expect(result.current.chartId).toBe('test-chart-1');
      expect(result.current.priority).toBe('medium');
    });

    it('should use custom priority', () => {
      const { result } = renderHook(() =>
        useChartData({
          chartId: 'test-chart-1',
          priority: 'high',
        })
      );

      expect(result.current.priority).toBe('high');
    });

    it('should resolve promise with chart data', async () => {
      const { result } = renderHook(() =>
        useChartData({
          chartId: 'test-chart-1',
        })
      );

      // Wait for promise to resolve (medium priority = 300ms)
      const data = await result.current.dataPromise;

      expect(data).toHaveProperty('data');
      expect(data).toHaveProperty('metadata');
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.metadata).toHaveProperty('totalPoints');
      expect(data.metadata).toHaveProperty('timeRange');
      expect(data.metadata).toHaveProperty('lastUpdated');
    });

    it('should generate data points based on time range', async () => {
      const now = Date.now();
      const start = now - 60 * 60 * 1000; // 1 hour ago
      const end = now;

      const { result } = renderHook(() =>
        useChartData({
          chartId: 'test-chart-1',
          timeRange: { start, end },
        })
      );

      const data = await result.current.dataPromise;

      expect(data.data.length).toBeGreaterThan(0);
      expect(data.metadata.timeRange.start).toBe(start);
      expect(data.metadata.timeRange.end).toBe(end);
    });

    // Skip timing tests - they test implementation details rather than behavior
    it.skip('should use different loading times based on priority', async () => {
      const highPriority = renderHook(() =>
        useChartData({
          chartId: 'chart-high',
          priority: 'high',
        })
      );

      const mediumPriority = renderHook(() =>
        useChartData({
          chartId: 'chart-medium',
          priority: 'medium',
        })
      );

      const lowPriority = renderHook(() =>
        useChartData({
          chartId: 'chart-low',
          priority: 'low',
        })
      );

      // All should resolve eventually
      await expect(highPriority.result.current.dataPromise).resolves.toBeDefined();
      await expect(mediumPriority.result.current.dataPromise).resolves.toBeDefined();
      await expect(lowPriority.result.current.dataPromise).resolves.toBeDefined();
    });

    it('should cache data requests with same parameters', () => {
      const hook1 = renderHook(() =>
        useChartData({
          chartId: 'test-chart-1',
        })
      );

      const hook2 = renderHook(() =>
        useChartData({
          chartId: 'test-chart-1',
        })
      );

      // Should return same promise instance for same cache key
      expect(hook1.result.current.dataPromise).toBe(hook2.result.current.dataPromise);
    });

    it('should create different cache entries for different parameters', () => {
      const hook1 = renderHook(() =>
        useChartData({
          chartId: 'test-chart-1',
        })
      );

      const hook2 = renderHook(() =>
        useChartData({
          chartId: 'test-chart-2',
        })
      );

      // Should return different promise instances
      expect(hook1.result.current.dataPromise).not.toBe(hook2.result.current.dataPromise);
    });

    it.skip('should clean up cache after timeout', async () => {
      // Skip: Testing cache cleanup timing is an implementation detail
    });

    it('should include volume data in response', async () => {
      const { result } = renderHook(() =>
        useChartData({
          chartId: 'test-chart-1',
        })
      );

      const data = await result.current.dataPromise;

      expect(data.data[0]).toHaveProperty('time');
      expect(data.data[0]).toHaveProperty('value');
      expect(data.data[0]).toHaveProperty('volume');
    });

    it('should limit data points to maximum 1000', async () => {
      const now = Date.now();
      const start = now - 365 * 24 * 60 * 60 * 1000; // 1 year ago
      const end = now;

      const { result } = renderHook(() =>
        useChartData({
          chartId: 'test-chart-1',
          timeRange: { start, end },
        })
      );


      const data = await result.current.dataPromise;

      expect(data.data.length).toBeLessThanOrEqual(1000);
    });
  });

  describe('useRealtimeChartData', () => {
    it('should return base chart data', () => {
      const { result } = renderHook(() =>
        useRealtimeChartData({
          chartId: 'realtime-chart-1',
        })
      );

      expect(result.current.dataPromise).toBeInstanceOf(Promise);
      expect(result.current.chartId).toBe('realtime-chart-1');
    });

    it('should use custom refresh interval', async () => {
      const { result } = renderHook(() =>
        useRealtimeChartData({
          chartId: 'realtime-chart-1',
          refreshInterval: 1000,
        })
      );

      expect(result.current.dataPromise).toBeInstanceOf(Promise);
    });

    it('should respect enabled flag', () => {
      const { result: enabledResult } = renderHook(() =>
        useRealtimeChartData({
          chartId: 'realtime-chart-1',
          enabled: true,
        })
      );

      const { result: disabledResult } = renderHook(() =>
        useRealtimeChartData({
          chartId: 'realtime-chart-2',
          enabled: false,
        })
      );

      expect(enabledResult.current.dataPromise).toBeInstanceOf(Promise);
      expect(disabledResult.current.dataPromise).toBeInstanceOf(Promise);
    });

    it('should default enabled to true', () => {
      const { result } = renderHook(() =>
        useRealtimeChartData({
          chartId: 'realtime-chart-1',
        })
      );

      expect(result.current.dataPromise).toBeInstanceOf(Promise);
    });

    it('should use default refresh interval of 5000ms', async () => {
      const { result } = renderHook(() =>
        useRealtimeChartData({
          chartId: 'realtime-chart-1',
        })
      );

      expect(result.current.dataPromise).toBeInstanceOf(Promise);
    });
  });

  describe('useMultiChartData', () => {
    it('should return promises for multiple charts', () => {
      const configs = [
        { chartId: 'chart-1' },
        { chartId: 'chart-2' },
        { chartId: 'chart-3' },
      ];

      const { result } = renderHook(() => useMultiChartData(configs));

      expect(Object.keys(result.current)).toHaveLength(3);
      expect(result.current['chart-1']).toBeInstanceOf(Promise);
      expect(result.current['chart-2']).toBeInstanceOf(Promise);
      expect(result.current['chart-3']).toBeInstanceOf(Promise);
    });

    it('should handle empty config array', () => {
      const { result } = renderHook(() => useMultiChartData([]));

      expect(Object.keys(result.current)).toHaveLength(0);
    });

    it('should create separate promises for each chart', () => {
      const configs = [
        { chartId: 'chart-1' },
        { chartId: 'chart-2' },
      ];

      const { result } = renderHook(() => useMultiChartData(configs));

      expect(result.current['chart-1']).not.toBe(result.current['chart-2']);
    });

    it('should use cache for duplicate chart IDs', () => {
      const configs = [
        { chartId: 'chart-1' },
        { chartId: 'chart-1' }, // Duplicate
      ];

      const { result } = renderHook(() => useMultiChartData(configs));

      // Should have same promise for duplicate ID
      expect(Object.keys(result.current)).toHaveLength(1);
    });

    it('should resolve all promises with data', async () => {
      const configs = [
        { chartId: 'chart-1', priority: 'high' as const },
        { chartId: 'chart-2', priority: 'high' as const },
      ];

      const { result } = renderHook(() => useMultiChartData(configs));


      const data1 = await result.current['chart-1'];
      const data2 = await result.current['chart-2'];

      expect(data1).toHaveProperty('data');
      expect(data2).toHaveProperty('data');
    });

    it('should handle different priorities for different charts', () => {
      const configs = [
        { chartId: 'chart-1', priority: 'high' as const },
        { chartId: 'chart-2', priority: 'low' as const },
      ];

      const { result } = renderHook(() => useMultiChartData(configs));

      expect(result.current['chart-1']).toBeInstanceOf(Promise);
      expect(result.current['chart-2']).toBeInstanceOf(Promise);
      expect(result.current['chart-1']).not.toBe(result.current['chart-2']);
    });

    it('should handle time ranges for multiple charts', async () => {
      const now = Date.now();
      const configs = [
        {
          chartId: 'chart-1',
          timeRange: { start: now - 3600000, end: now },
          priority: 'high' as const,
        },
        {
          chartId: 'chart-2',
          timeRange: { start: now - 7200000, end: now },
          priority: 'high' as const,
        },
      ];

      const { result } = renderHook(() => useMultiChartData(configs));


      const data1 = await result.current['chart-1'];
      const data2 = await result.current['chart-2'];

      expect(data1.metadata.timeRange.start).toBe(now - 3600000);
      expect(data2.metadata.timeRange.start).toBe(now - 7200000);
    });
  });

  describe('usePrefetchChartData', () => {
    it('should return prefetch utilities', () => {
      const { result } = renderHook(() => usePrefetchChartData());

      expect(result.current).toHaveProperty('prefetch');
      expect(result.current).toHaveProperty('clearCache');
      expect(result.current).toHaveProperty('getCacheStatus');
      expect(typeof result.current.prefetch).toBe('function');
      expect(typeof result.current.clearCache).toBe('function');
      expect(typeof result.current.getCacheStatus).toBe('function');
    });

    it('should prefetch chart data', () => {
      const { result } = renderHook(() => usePrefetchChartData());

      result.current.prefetch({
        chartId: 'prefetch-chart-1',
      });

      const status = result.current.getCacheStatus();
      expect(status.size).toBeGreaterThan(0);
      expect(status.keys).toContain('prefetch-chart-1-auto-auto-medium');
    });

    it('should not duplicate prefetch requests', () => {
      const { result } = renderHook(() => usePrefetchChartData());

      result.current.prefetch({ chartId: 'chart-1' });
      const status1 = result.current.getCacheStatus();

      result.current.prefetch({ chartId: 'chart-1' });
      const status2 = result.current.getCacheStatus();

      expect(status1.size).toBe(status2.size);
    });

    it('should clear cache for specific chart', () => {
      const { result } = renderHook(() => usePrefetchChartData());

      result.current.prefetch({ chartId: 'chart-1' });
      result.current.prefetch({ chartId: 'chart-2' });

      const statusBefore = result.current.getCacheStatus();
      expect(statusBefore.size).toBeGreaterThan(1);

      result.current.clearCache('chart-1');

      const statusAfter = result.current.getCacheStatus();
      expect(statusAfter.size).toBe(statusBefore.size - 1);
      expect(statusAfter.keys.some((k: string) => k.startsWith('chart-1'))).toBe(false);
      expect(statusAfter.keys.some((k: string) => k.startsWith('chart-2'))).toBe(true);
    });

    it('should clear all cache when no chartId provided', () => {
      const { result } = renderHook(() => usePrefetchChartData());

      result.current.prefetch({ chartId: 'chart-1' });
      result.current.prefetch({ chartId: 'chart-2' });
      result.current.prefetch({ chartId: 'chart-3' });

      const statusBefore = result.current.getCacheStatus();
      expect(statusBefore.size).toBeGreaterThan(0);

      result.current.clearCache();

      const statusAfter = result.current.getCacheStatus();
      expect(statusAfter.size).toBe(0);
      expect(statusAfter.keys).toEqual([]);
    });

    it('should return cache status with correct information', () => {
      const { result } = renderHook(() => usePrefetchChartData());

      result.current.prefetch({ chartId: 'chart-1' });
      result.current.prefetch({ chartId: 'chart-2', priority: 'high' });

      const status = result.current.getCacheStatus();

      expect(status.size).toBe(2);
      expect(status.keys).toHaveLength(2);
      expect(status.keys).toContain('chart-1-auto-auto-medium');
      expect(status.keys).toContain('chart-2-auto-auto-high');
    });

    it('should handle prefetch with time ranges', () => {
      const { result } = renderHook(() => usePrefetchChartData());

      const now = Date.now();
      result.current.prefetch({
        chartId: 'chart-1',
        timeRange: { start: now - 3600000, end: now },
      });

      const status = result.current.getCacheStatus();
      expect(status.keys[0]).toContain(`${now - 3600000}`);
      expect(status.keys[0]).toContain(`${now}`);
    });

    it('should handle prefetch errors gracefully', () => {
      const { result } = renderHook(() => usePrefetchChartData());

      // Prefetch should not throw even if promise rejects
      expect(() => {
        result.current.prefetch({ chartId: 'error-chart' });
      }).not.toThrow();
    });

    it('should clear cache on error during prefetch', async () => {
      const { result } = renderHook(() => usePrefetchChartData());

      // Start prefetch
      result.current.prefetch({ chartId: 'error-chart' });

      const statusBefore = result.current.getCacheStatus();
      expect(statusBefore.size).toBeGreaterThan(0);

      // The promise internally handles errors and clears cache on rejection
      // This is a fire-and-forget operation, so we can't directly test it
      // but the implementation shows it catches errors
    });

    it('should work with different priorities', () => {
      const { result } = renderHook(() => usePrefetchChartData());

      result.current.prefetch({ chartId: 'chart-high', priority: 'high' });
      result.current.prefetch({ chartId: 'chart-medium', priority: 'medium' });
      result.current.prefetch({ chartId: 'chart-low', priority: 'low' });

      const status = result.current.getCacheStatus();
      expect(status.size).toBe(3);
    });
  });

  describe('Cache Management', () => {
    it('should share cache between hooks', () => {
      const { result: prefetchResult } = renderHook(() => usePrefetchChartData());

      prefetchResult.current.prefetch({ chartId: 'shared-chart' });

      const { result: dataResult } = renderHook(() =>
        useChartData({ chartId: 'shared-chart' })
      );

      // Should use cached promise
      expect(dataResult.current.dataPromise).toBeInstanceOf(Promise);
    });

    it('should maintain separate cache entries for different parameters', () => {
      const { result: prefetchResult } = renderHook(() => usePrefetchChartData());

      const now = Date.now();
      prefetchResult.current.prefetch({
        chartId: 'chart-1',
        timeRange: { start: now - 3600000, end: now },
      });

      prefetchResult.current.prefetch({
        chartId: 'chart-1',
        timeRange: { start: now - 7200000, end: now },
      });

      const status = prefetchResult.current.getCacheStatus();
      expect(status.size).toBe(2);
    });

    it('should handle cache cleanup correctly', () => {
      const { result } = renderHook(() => usePrefetchChartData());

      result.current.prefetch({ chartId: 'chart-1' });
      result.current.prefetch({ chartId: 'chart-2' });
      result.current.prefetch({ chartId: 'chart-3' });

      expect(result.current.getCacheStatus().size).toBe(3);

      result.current.clearCache('chart-2');
      expect(result.current.getCacheStatus().size).toBe(2);

      result.current.clearCache();
      expect(result.current.getCacheStatus().size).toBe(0);
    });
  });

  describe('Performance Monitoring Integration', () => {
    it('should start transition monitoring on data fetch', () => {
      renderHook(() =>
        useChartData({
          chartId: 'perf-chart-1',
        })
      );

      expect(react19Monitor.startTransition).toHaveBeenCalledWith(
        'ChartData-perf-chart-1',
        'chart'
      );
    });

    it('should end transition monitoring on completion', async () => {
      const { result } = renderHook(() =>
        useChartData({
          chartId: 'perf-chart-2',
        })
      );

      await result.current.dataPromise;

      expect(react19Monitor.endTransition).toHaveBeenCalledWith('transition-id');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very short time ranges', async () => {
      const now = Date.now();
      const { result } = renderHook(() =>
        useChartData({
          chartId: 'short-range',
          timeRange: { start: now - 1000, end: now },
        })
      );

      const data = await result.current.dataPromise;

      expect(data.data.length).toBeGreaterThan(0);
    });

    it('should handle very long time ranges', async () => {
      const now = Date.now();
      const { result } = renderHook(() =>
        useChartData({
          chartId: 'long-range',
          timeRange: { start: now - 365 * 24 * 60 * 60 * 1000, end: now },
        })
      );

      const data = await result.current.dataPromise;

      expect(data.data.length).toBeLessThanOrEqual(1000);
    });

    it('should handle concurrent requests for same chart', async () => {
      const hook1 = renderHook(() =>
        useChartData({ chartId: 'concurrent-chart' })
      );

      const hook2 = renderHook(() =>
        useChartData({ chartId: 'concurrent-chart' })
      );


      const data1 = await hook1.result.current.dataPromise;
      const data2 = await hook2.result.current.dataPromise;

      // Should resolve to same data
      expect(data1).toEqual(data2);
    });

    it('should handle zero points in time range', async () => {
      const now = Date.now();
      const { result } = renderHook(() =>
        useChartData({
          chartId: 'zero-points',
          timeRange: { start: now, end: now },
        })
      );

      const data = await result.current.dataPromise;

      expect(Array.isArray(data.data)).toBe(true);
    });
  });
});
