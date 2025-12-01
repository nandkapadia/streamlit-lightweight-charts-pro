/**
 * @fileoverview Integration tests for API client with backend.
 *
 * These tests verify the full integration between the Vue 3 composables
 * and the FastAPI backend, including proper request/response handling
 * and error scenarios.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useChartApi } from '../../src/composables/useChartApi';

// Mock server responses matching FastAPI backend
const mockServerData = {
  charts: new Map<string, {
    chartId: string;
    options: Record<string, unknown>;
    panes: Map<number, Map<string, {
      seriesId: string;
      seriesType: string;
      data: Array<Record<string, unknown>>;
      options: Record<string, unknown>;
    }>>;
  }>(),
};

// Reset mock data before each test
beforeEach(() => {
  mockServerData.charts.clear();
});

/**
 * Create a mock fetch that simulates FastAPI backend behavior.
 */
function createBackendMock() {
  return vi.fn(async (url: string, init?: RequestInit) => {
    const urlObj = new URL(url, 'http://localhost:8000');
    const path = urlObj.pathname;
    const method = init?.method || 'GET';

    // Health check
    if (path === '/health') {
      return createResponse({ status: 'healthy', version: '0.1.0' });
    }

    // Parse chart routes
    const chartMatch = path.match(/^\/api\/charts\/([^/]+)/);
    if (!chartMatch) {
      return createErrorResponse(404, 'Not found');
    }

    const chartId = chartMatch[1];
    const remainingPath = path.slice(`/api/charts/${chartId}`.length);

    // POST /api/charts/{chart_id} - Create chart
    if (method === 'POST' && remainingPath === '') {
      const options = init?.body ? JSON.parse(init.body as string) : {};
      const chart = {
        chartId,
        options,
        panes: new Map(),
      };
      mockServerData.charts.set(chartId, chart);
      return createResponse({ chartId, options });
    }

    // GET /api/charts/{chart_id} - Get chart
    if (method === 'GET' && remainingPath === '') {
      const chart = mockServerData.charts.get(chartId);
      if (!chart) {
        return createErrorResponse(404, 'Chart not found');
      }

      // Convert panes Map to object
      const panes: Record<string, Record<string, unknown>> = {};
      chart.panes.forEach((seriesMap, paneId) => {
        const paneData: Record<string, unknown> = {};
        seriesMap.forEach((series, seriesId) => {
          paneData[seriesId] = {
            seriesType: series.seriesType,
            data: series.data,
            options: series.options,
          };
        });
        panes[String(paneId)] = paneData;
      });

      return createResponse({
        chartId,
        panes,
        options: chart.options,
      });
    }

    // GET /api/charts/{chart_id}/data/{pane_id}/{series_id} - Get series data
    const dataMatch = remainingPath.match(/^\/data\/(\d+)\/([^/]+)$/);
    if (method === 'GET' && dataMatch) {
      const paneId = parseInt(dataMatch[1], 10);
      const seriesId = dataMatch[2];

      const chart = mockServerData.charts.get(chartId);
      if (!chart) {
        return createErrorResponse(404, 'Chart not found');
      }

      const pane = chart.panes.get(paneId);
      if (!pane) {
        return createErrorResponse(404, 'Pane not found');
      }

      const series = pane.get(seriesId);
      if (!series) {
        return createErrorResponse(404, 'Series not found');
      }

      const totalCount = series.data.length;
      const chunkThreshold = 500;

      if (totalCount < chunkThreshold) {
        return createResponse({
          seriesId,
          seriesType: series.seriesType,
          data: series.data,
          options: series.options,
          chunked: false,
          totalCount,
        });
      }

      // Return chunked response
      const chunkData = series.data.slice(-chunkThreshold);
      return createResponse({
        seriesId,
        seriesType: series.seriesType,
        data: chunkData,
        options: series.options,
        chunked: true,
        chunkInfo: {
          startIndex: totalCount - chunkThreshold,
          endIndex: totalCount,
          startTime: (chunkData[0] as { time: number }).time,
          endTime: (chunkData[chunkData.length - 1] as { time: number }).time,
          count: chunkThreshold,
        },
        hasMoreBefore: true,
        hasMoreAfter: false,
        totalCount,
      });
    }

    // POST /api/charts/{chart_id}/data/{series_id} - Set series data
    const setDataMatch = remainingPath.match(/^\/data\/([^/]+)$/);
    if (method === 'POST' && setDataMatch) {
      const seriesId = setDataMatch[1];
      const body = JSON.parse(init?.body as string) as {
        paneId?: number;
        seriesType: string;
        data: Array<Record<string, unknown>>;
        options?: Record<string, unknown>;
      };

      let chart = mockServerData.charts.get(chartId);
      if (!chart) {
        // Auto-create chart
        chart = { chartId, options: {}, panes: new Map() };
        mockServerData.charts.set(chartId, chart);
      }

      const paneId = body.paneId || 0;
      if (!chart.panes.has(paneId)) {
        chart.panes.set(paneId, new Map());
      }

      const pane = chart.panes.get(paneId)!;
      pane.set(seriesId, {
        seriesId,
        seriesType: body.seriesType,
        data: body.data,
        options: body.options || {},
      });

      return createResponse({
        seriesId,
        seriesType: body.seriesType,
        count: body.data.length,
      });
    }

    // GET /api/charts/{chart_id}/history/{pane_id}/{series_id} - Get history
    const historyMatch = remainingPath.match(/^\/history\/(\d+)\/([^/?]+)/);
    if (method === 'GET' && historyMatch) {
      const paneId = parseInt(historyMatch[1], 10);
      const seriesId = historyMatch[2];

      const beforeTime = parseInt(urlObj.searchParams.get('before_time') || '0', 10);
      const count = parseInt(urlObj.searchParams.get('count') || '500', 10);

      const chart = mockServerData.charts.get(chartId);
      if (!chart) {
        return createErrorResponse(404, 'Chart not found');
      }

      const pane = chart.panes.get(paneId);
      if (!pane) {
        return createErrorResponse(404, 'Pane not found');
      }

      const series = pane.get(seriesId);
      if (!series) {
        return createErrorResponse(404, 'Series not found');
      }

      // Find data before the given time
      const sortedData = [...series.data].sort(
        (a, b) => (a as { time: number }).time - (b as { time: number }).time
      );

      let endIndex = sortedData.length;
      for (let i = 0; i < sortedData.length; i++) {
        if ((sortedData[i] as { time: number }).time >= beforeTime) {
          endIndex = i;
          break;
        }
      }

      const startIndex = Math.max(0, endIndex - count);
      const chunkData = sortedData.slice(startIndex, endIndex);

      return createResponse({
        seriesId,
        data: chunkData,
        chunkInfo: {
          startIndex,
          endIndex,
          startTime: chunkData.length > 0 ? (chunkData[0] as { time: number }).time : 0,
          endTime: chunkData.length > 0 ? (chunkData[chunkData.length - 1] as { time: number }).time : 0,
          count: chunkData.length,
        },
        hasMoreBefore: startIndex > 0,
        hasMoreAfter: endIndex < sortedData.length,
        totalCount: sortedData.length,
      });
    }

    return createErrorResponse(404, 'Endpoint not found');
  });
}

function createResponse(data: unknown): Response {
  return {
    ok: true,
    status: 200,
    json: async () => data,
  } as Response;
}

function createErrorResponse(status: number, message: string): Response {
  return {
    ok: false,
    status,
    statusText: message,
    json: async () => ({ error: message }),
  } as Response;
}

describe('API Integration Tests', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = createBackendMock();
  });

  describe('Chart Lifecycle', () => {
    it('should create, populate, and retrieve a chart', async () => {
      const api = useChartApi({
        baseUrl: '/api/charts',
        fetchFn: mockFetch,
      });

      // Create chart
      const createResult = await api.createChart('integration-test', {
        height: 400,
        layout: { backgroundColor: '#1e1e1e' },
      });
      expect(createResult.chartId).toBe('integration-test');

      // Set series data
      const setResult = await api.setSeriesData('integration-test', 'price', {
        seriesType: 'candlestick',
        data: [
          { time: 1234567890, open: 100, high: 105, low: 98, close: 102 },
          { time: 1234567890 + 86400, open: 102, high: 108, low: 101, close: 106 },
        ],
      });
      expect(setResult.count).toBe(2);

      // Get chart
      const chartData = await api.getChart('integration-test');
      expect(chartData.chartId).toBe('integration-test');
      expect(chartData.panes['0']['price']).toBeDefined();
    });

    it('should handle chunked data for large datasets', async () => {
      const api = useChartApi({
        baseUrl: '/api/charts',
        fetchFn: mockFetch,
      });

      // Create chart with large dataset
      await api.createChart('large-data-test');

      // Create 1000 data points
      const largeData = Array(1000).fill(null).map((_, i) => ({
        time: 1234567890 + i * 86400,
        open: 100 + Math.random() * 10,
        high: 110 + Math.random() * 10,
        low: 90 + Math.random() * 10,
        close: 100 + Math.random() * 10,
      }));

      await api.setSeriesData('large-data-test', 'price', {
        seriesType: 'candlestick',
        data: largeData,
      });

      // Get series data - should be chunked
      const seriesData = await api.getSeriesData('large-data-test', 0, 'price');

      expect(seriesData.chunked).toBe(true);
      if (seriesData.chunked) {
        expect(seriesData.data.length).toBe(500);
        expect(seriesData.hasMoreBefore).toBe(true);
        expect(seriesData.totalCount).toBe(1000);
      }
    });
  });

  describe('Infinite History Loading', () => {
    it('should load historical chunks progressively', async () => {
      const api = useChartApi({
        baseUrl: '/api/charts',
        fetchFn: mockFetch,
      });

      // Create chart with large dataset
      await api.createChart('history-test');

      const largeData = Array(2000).fill(null).map((_, i) => ({
        time: 1234567890 + i * 86400,
        value: 100 + Math.sin(i / 10) * 10,
      }));

      await api.setSeriesData('history-test', 'price', {
        seriesType: 'line',
        data: largeData,
      });

      // Get initial chunk (latest data)
      const initialData = await api.getSeriesData('history-test', 0, 'price');
      expect(initialData.chunked).toBe(true);

      if (initialData.chunked) {
        // Request history before the initial chunk
        const firstHistoryChunk = await api.getHistory(
          'history-test',
          0,
          'price',
          initialData.chunkInfo.startTime,
          500
        );

        expect(firstHistoryChunk.data.length).toBeLessThanOrEqual(500);
        expect(firstHistoryChunk.hasMoreBefore).toBe(true);

        // Request another history chunk
        const secondHistoryChunk = await api.getHistory(
          'history-test',
          0,
          'price',
          firstHistoryChunk.chunkInfo.startTime,
          500
        );

        expect(secondHistoryChunk.hasMoreBefore).toBe(true);
      }
    });

    it('should indicate no more data when reaching the start', async () => {
      const api = useChartApi({
        baseUrl: '/api/charts',
        fetchFn: mockFetch,
      });

      await api.createChart('boundary-test');

      // Small dataset
      const smallData = Array(100).fill(null).map((_, i) => ({
        time: 1234567890 + i * 86400,
        value: 100,
      }));

      await api.setSeriesData('boundary-test', 'price', {
        seriesType: 'line',
        data: smallData,
      });

      // Request more than available
      const history = await api.getHistory(
        'boundary-test',
        0,
        'price',
        1234567890 + 50 * 86400,
        500
      );

      expect(history.hasMoreBefore).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent chart', async () => {
      const api = useChartApi({
        baseUrl: '/api/charts',
        fetchFn: mockFetch,
      });

      await expect(api.getChart('non-existent')).rejects.toThrow('Chart not found');
      expect(api.error.value).toBe('Chart not found');
    });

    it('should return 404 for non-existent series', async () => {
      const api = useChartApi({
        baseUrl: '/api/charts',
        fetchFn: mockFetch,
      });

      await api.createChart('error-test');

      await expect(
        api.getSeriesData('error-test', 0, 'non-existent')
      ).rejects.toThrow('Pane not found');
    });
  });

  describe('Multiple Series', () => {
    it('should handle multiple series in different panes', async () => {
      const api = useChartApi({
        baseUrl: '/api/charts',
        fetchFn: mockFetch,
      });

      await api.createChart('multi-series-test');

      // Add price series to pane 0
      await api.setSeriesData('multi-series-test', 'price', {
        paneId: 0,
        seriesType: 'candlestick',
        data: [{ time: 1234567890, open: 100, high: 105, low: 98, close: 102 }],
      });

      // Add volume series to pane 1
      await api.setSeriesData('multi-series-test', 'volume', {
        paneId: 1,
        seriesType: 'histogram',
        data: [{ time: 1234567890, value: 10000 }],
      });

      // Add indicator to pane 0
      await api.setSeriesData('multi-series-test', 'sma', {
        paneId: 0,
        seriesType: 'line',
        data: [{ time: 1234567890, value: 101 }],
      });

      // Verify chart structure
      const chart = await api.getChart('multi-series-test');
      expect(chart.panes['0']['price']).toBeDefined();
      expect(chart.panes['0']['sma']).toBeDefined();
      expect(chart.panes['1']['volume']).toBeDefined();
    });
  });

  describe('Concurrent Requests', () => {
    it('should handle multiple concurrent requests', async () => {
      const api = useChartApi({
        baseUrl: '/api/charts',
        fetchFn: mockFetch,
      });

      await api.createChart('concurrent-test');

      // Create multiple series concurrently
      const promises = Array(5).fill(null).map((_, i) =>
        api.setSeriesData('concurrent-test', `series_${i}`, {
          seriesType: 'line',
          data: [{ time: 1234567890, value: 100 + i }],
        })
      );

      const results = await Promise.all(promises);
      expect(results.every((r) => r.count === 1)).toBe(true);

      // Verify all series were created
      const chart = await api.getChart('concurrent-test');
      expect(Object.keys(chart.panes['0']).length).toBe(5);
    });
  });
});
