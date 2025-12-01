/**
 * @fileoverview Unit tests for the useChartApi composable.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { useChartApi } from '../../../src/composables/useChartApi';

// Helper to create mock fetch
function createMockFetch(responses: Map<string, unknown>) {
  return vi.fn(async (url: string | URL | Request) => {
    const urlString = url.toString();

    // Find matching response
    for (const [pattern, response] of responses.entries()) {
      if (urlString.includes(pattern)) {
        return {
          ok: true,
          status: 200,
          json: async () => response,
        } as Response;
      }
    }

    // Default 404
    return {
      ok: false,
      status: 404,
      statusText: 'Not Found',
      json: async () => ({ error: 'Not found' }),
    } as Response;
  });
}

describe('useChartApi', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('healthCheck', () => {
    it('should return health status on success', async () => {
      const responses = new Map([
        ['/health', { status: 'healthy', version: '0.1.0' }],
      ]);
      mockFetch = createMockFetch(responses);

      const { healthCheck, isLoading, error } = useChartApi({
        baseUrl: '/api/charts',
        fetchFn: mockFetch,
      });

      const result = await healthCheck();

      expect(result).toEqual({ status: 'healthy', version: '0.1.0' });
      expect(isLoading.value).toBe(false);
      expect(error.value).toBeNull();
    });
  });

  describe('createChart', () => {
    it('should create a chart successfully', async () => {
      const responses = new Map([
        ['/my-chart', { chartId: 'my-chart', options: {} }],
      ]);
      mockFetch = createMockFetch(responses);

      const { createChart } = useChartApi({
        baseUrl: '/api/charts',
        fetchFn: mockFetch,
      });

      const result = await createChart('my-chart', { height: 400 });

      expect(result.chartId).toBe('my-chart');
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/charts/my-chart',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ height: 400 }),
        })
      );
    });
  });

  describe('getChart', () => {
    it('should fetch chart data successfully', async () => {
      const chartData = {
        chartId: 'test-chart',
        panes: {
          '0': {
            price: {
              seriesType: 'candlestick',
              data: [{ time: 1234567890, open: 100, high: 105, low: 98, close: 102 }],
              options: {},
            },
          },
        },
        options: {},
      };
      const responses = new Map([
        ['/test-chart', chartData],
      ]);
      mockFetch = createMockFetch(responses);

      const { getChart } = useChartApi({
        baseUrl: '/api/charts',
        fetchFn: mockFetch,
      });

      const result = await getChart('test-chart');

      expect(result).toEqual(chartData);
    });
  });

  describe('getSeriesData', () => {
    it('should fetch non-chunked series data', async () => {
      const seriesData = {
        seriesId: 'price',
        seriesType: 'candlestick',
        data: [{ time: 1234567890, open: 100, high: 105, low: 98, close: 102 }],
        options: {},
        chunked: false,
        totalCount: 1,
      };
      const responses = new Map([
        ['/data/0/price', seriesData],
      ]);
      mockFetch = createMockFetch(responses);

      const { getSeriesData } = useChartApi({
        baseUrl: '/api/charts',
        fetchFn: mockFetch,
      });

      const result = await getSeriesData('test-chart', 0, 'price');

      expect(result.chunked).toBe(false);
      expect(result.data).toHaveLength(1);
    });

    it('should fetch chunked series data', async () => {
      const seriesData = {
        seriesId: 'price',
        seriesType: 'candlestick',
        data: Array(500).fill({ time: 0, open: 100, high: 105, low: 98, close: 102 }),
        options: {},
        chunked: true,
        chunkInfo: {
          startIndex: 500,
          endIndex: 1000,
          startTime: 1234567890,
          endTime: 1234567890 + 500 * 86400,
          count: 500,
        },
        hasMoreBefore: true,
        hasMoreAfter: false,
        totalCount: 1000,
      };
      const responses = new Map([
        ['/data/0/price', seriesData],
      ]);
      mockFetch = createMockFetch(responses);

      const { getSeriesData } = useChartApi({
        baseUrl: '/api/charts',
        fetchFn: mockFetch,
      });

      const result = await getSeriesData('test-chart', 0, 'price');

      expect(result.chunked).toBe(true);
      if (result.chunked) {
        expect(result.hasMoreBefore).toBe(true);
        expect(result.hasMoreAfter).toBe(false);
        expect(result.totalCount).toBe(1000);
      }
    });
  });

  describe('setSeriesData', () => {
    it('should set series data successfully', async () => {
      const responses = new Map([
        ['/data/price', { seriesId: 'price', seriesType: 'line', count: 100 }],
      ]);
      mockFetch = createMockFetch(responses);

      const { setSeriesData } = useChartApi({
        baseUrl: '/api/charts',
        fetchFn: mockFetch,
      });

      const result = await setSeriesData('test-chart', 'price', {
        seriesType: 'line',
        data: Array(100).fill({ time: 0, value: 100 }),
      });

      expect(result.count).toBe(100);
    });
  });

  describe('getHistory', () => {
    it('should fetch historical data chunk', async () => {
      const historyData = {
        seriesId: 'price',
        data: Array(500).fill({ time: 0, open: 100, high: 105, low: 98, close: 102 }),
        chunkInfo: {
          startIndex: 0,
          endIndex: 500,
          startTime: 1234567890 - 500 * 86400,
          endTime: 1234567890,
          count: 500,
        },
        hasMoreBefore: true,
        hasMoreAfter: false,
        totalCount: 2000,
      };
      const responses = new Map([
        ['/history/0/price', historyData],
      ]);
      mockFetch = createMockFetch(responses);

      const { getHistory } = useChartApi({
        baseUrl: '/api/charts',
        fetchFn: mockFetch,
      });

      const result = await getHistory('test-chart', 0, 'price', 1234567890, 500);

      expect(result.data).toHaveLength(500);
      expect(result.hasMoreBefore).toBe(true);
      expect(result.totalCount).toBe(2000);
    });
  });

  describe('error handling', () => {
    it('should handle API errors', async () => {
      mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ error: 'Chart not found' }),
      });

      const { getChart, error } = useChartApi({
        baseUrl: '/api/charts',
        fetchFn: mockFetch,
      });

      await expect(getChart('non-existent')).rejects.toThrow('Chart not found');
      expect(error.value).toBe('Chart not found');
    });

    it('should handle network errors', async () => {
      mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const { getChart, error } = useChartApi({
        baseUrl: '/api/charts',
        fetchFn: mockFetch,
      });

      await expect(getChart('test-chart')).rejects.toThrow('Network error');
      expect(error.value).toBe('Network error');
    });

    it('should handle timeout', async () => {
      // Mock fetch that respects abort signal
      mockFetch = vi.fn().mockImplementation((_url: string, init?: RequestInit) =>
        new Promise((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            resolve({
              ok: true,
              json: async () => ({ chartId: 'test-chart' }),
            } as Response);
          }, 1000);

          // Listen for abort signal
          init?.signal?.addEventListener('abort', () => {
            clearTimeout(timeoutId);
            const abortError = new Error('Aborted');
            abortError.name = 'AbortError';
            reject(abortError);
          });
        })
      );

      const { getChart, error } = useChartApi({
        baseUrl: '/api/charts',
        timeout: 50, // Very short timeout
        fetchFn: mockFetch,
      });

      await expect(getChart('test-chart')).rejects.toThrow();
      expect(error.value).toBe('Request timeout');
    }, 10000);
  });

  describe('clearError', () => {
    it('should clear the error state', async () => {
      mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Server error' }),
      });

      const { getChart, error, clearError } = useChartApi({
        baseUrl: '/api/charts',
        fetchFn: mockFetch,
      });

      try {
        await getChart('test-chart');
      } catch {
        // Expected error
      }

      expect(error.value).toBe('Server error');
      clearError();
      expect(error.value).toBeNull();
    });
  });

  describe('isLoading state', () => {
    it('should set loading state during request', async () => {
      let resolvePromise: (value: Response) => void;
      const pendingPromise = new Promise<Response>((resolve) => {
        resolvePromise = resolve;
      });

      mockFetch = vi.fn().mockReturnValue(pendingPromise);

      const { getChart, isLoading } = useChartApi({
        baseUrl: '/api/charts',
        fetchFn: mockFetch,
      });

      const requestPromise = getChart('test-chart');

      // Should be loading
      expect(isLoading.value).toBe(true);

      // Resolve the request
      resolvePromise!({
        ok: true,
        json: async () => ({ chartId: 'test-chart' }),
      } as Response);

      await requestPromise;

      // Should no longer be loading
      expect(isLoading.value).toBe(false);
    });
  });
});
