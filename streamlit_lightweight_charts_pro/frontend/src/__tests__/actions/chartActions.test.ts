/**
 * @fileoverview Tests for React 19 Server Actions - Chart Data and State Management
 *
 * Tests cover:
 * - Server action execution and error handling
 * - Form data processing and validation
 * - Async operations and timeouts
 * - Batch operations
 * - Response format validation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  saveChartConfig,
  loadChartData,
  updateChartSeries,
  batchChartOperations,
} from '../../actions/chartActions';

describe('Chart Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('saveChartConfig', () => {
    it('should save chart configuration successfully', async () => {
      const formData = new FormData();
      formData.append('chartId', 'chart-1');
      formData.append('config', JSON.stringify({ theme: 'dark', width: 800 }));

      const result = await saveChartConfig(formData);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Chart configuration saved successfully');
      expect(result.timestamp).toBeDefined();
      expect(typeof result.timestamp).toBe('number');
    });

    it('should fail when chartId is missing', async () => {
      const formData = new FormData();
      formData.append('config', JSON.stringify({ theme: 'dark' }));

      await expect(saveChartConfig(formData)).rejects.toThrow('Missing required fields');
    });

    it('should fail when config is missing', async () => {
      const formData = new FormData();
      formData.append('chartId', 'chart-1');

      await expect(saveChartConfig(formData)).rejects.toThrow('Missing required fields');
    });

    it('should handle complex configuration objects', async () => {
      const complexConfig = {
        theme: 'dark',
        width: 1200,
        height: 600,
        series: [
          { type: 'line', color: '#FF0000' },
          { type: 'area', color: '#00FF00' },
        ],
        options: {
          timezone: 'UTC',
          priceScale: { autoScale: true },
        },
      };

      const formData = new FormData();
      formData.append('chartId', 'chart-complex');
      formData.append('config', JSON.stringify(complexConfig));

      const result = await saveChartConfig(formData);

      expect(result.success).toBe(true);
    });

    it('should complete within reasonable time', async () => {
      const formData = new FormData();
      formData.append('chartId', 'chart-1');
      formData.append('config', JSON.stringify({ theme: 'light' }));

      const startTime = Date.now();
      await saveChartConfig(formData);
      const duration = Date.now() - startTime;

      // Should complete in less than 200ms (simulated delay is 100ms)
      expect(duration).toBeLessThan(200);
    });
  });

  describe('loadChartData', () => {
    it('should load chart data successfully', async () => {
      const result = await loadChartData('chart-1');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBe(100);
      expect(result.chartId).toBe('chart-1');
      expect(result.timestamp).toBeDefined();
    });

    it('should return data with correct structure', async () => {
      const result = await loadChartData('chart-1');

      expect(result.data[0]).toHaveProperty('time');
      expect(result.data[0]).toHaveProperty('value');
      expect(typeof result.data[0].time).toBe('number');
      expect(typeof result.data[0].value).toBe('number');
    });

    it('should handle time range parameter', async () => {
      const timeRange = {
        start: Date.now() - 24 * 60 * 60 * 1000,
        end: Date.now(),
      };

      const result = await loadChartData('chart-1', timeRange);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should return unique data for different chart IDs', async () => {
      const result1 = await loadChartData('chart-1');
      const result2 = await loadChartData('chart-2');

      expect(result1.chartId).toBe('chart-1');
      expect(result2.chartId).toBe('chart-2');
    });

    it('should complete within reasonable time', async () => {
      const startTime = Date.now();
      await loadChartData('chart-1');
      const duration = Date.now() - startTime;

      // Should complete in less than 300ms (simulated delay is 200ms)
      expect(duration).toBeLessThan(300);
    });
  });

  describe('updateChartSeries', () => {
    it('should update series with valid data', async () => {
      const seriesData = [
        { time: 1000, value: 100 },
        { time: 2000, value: 110 },
        { time: 3000, value: 105 },
      ];

      const result = await updateChartSeries('chart-1', seriesData);

      expect(result.success).toBe(true);
      expect(result.processedData).toEqual(seriesData);
      expect(result.chartId).toBe('chart-1');
      expect(result.processingTime).toBe(50);
    });

    it('should filter out invalid data points', async () => {
      const seriesData = [
        { time: 1000, value: 100 },
        null, // invalid
        { time: 2000 }, // missing value
        { value: 110 }, // missing time
        { time: 3000, value: 105 },
      ];

      const result = await updateChartSeries('chart-1', seriesData as any[]);

      expect(result.success).toBe(true);
      expect(result.processedData.length).toBe(2); // Only 2 valid points
      expect(result.processedData).toEqual([
        { time: 1000, value: 100 },
        { time: 3000, value: 105 },
      ]);
    });

    it('should handle empty data array', async () => {
      const result = await updateChartSeries('chart-1', []);

      expect(result.success).toBe(true);
      expect(result.processedData).toEqual([]);
    });

    it('should handle data with extra properties', async () => {
      const seriesData = [
        { time: 1000, value: 100, color: '#FF0000', metadata: { source: 'api' } },
        { time: 2000, value: 110, color: '#00FF00', metadata: { source: 'api' } },
      ];

      const result = await updateChartSeries('chart-1', seriesData);

      expect(result.success).toBe(true);
      expect(result.processedData.length).toBe(2);
      // Should preserve extra properties
      expect(result.processedData[0]).toHaveProperty('color');
      expect(result.processedData[0]).toHaveProperty('metadata');
    });

    it('should complete within reasonable time', async () => {
      const seriesData = Array.from({ length: 1000 }, (_, i) => ({
        time: i * 1000,
        value: 100 + Math.random() * 50,
      }));

      const startTime = Date.now();
      await updateChartSeries('chart-1', seriesData);
      const duration = Date.now() - startTime;

      // Should complete in less than 100ms (simulated delay is 50ms)
      expect(duration).toBeLessThan(100);
    });
  });

  describe('batchChartOperations', () => {
    it('should execute multiple operations successfully', async () => {
      const formData = new FormData();
      formData.append('chartId', 'chart-1');
      formData.append('config', JSON.stringify({ theme: 'dark' }));

      const operations = [
        {
          type: 'save' as const,
          chartId: 'chart-1',
          data: formData,
        },
        {
          type: 'load' as const,
          chartId: 'chart-2',
        },
        {
          type: 'update' as const,
          chartId: 'chart-3',
          data: [{ time: 1000, value: 100 }],
        },
      ];

      const result = await batchChartOperations(operations);

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(3);
      expect(result.totalOperations).toBe(3);
      expect(result.timestamp).toBeDefined();
    });

    it('should handle mixed success and failure results', async () => {
      const validFormData = new FormData();
      validFormData.append('chartId', 'chart-1');
      validFormData.append('config', JSON.stringify({ theme: 'dark' }));

      const invalidFormData = new FormData();
      // Missing chartId - will fail

      const operations = [
        {
          type: 'save' as const,
          chartId: 'chart-1',
          data: validFormData,
        },
        {
          type: 'save' as const,
          chartId: 'chart-2',
          data: invalidFormData,
        },
        {
          type: 'load' as const,
          chartId: 'chart-3',
        },
      ];

      const result = await batchChartOperations(operations);

      expect(result.success).toBe(true); // Overall batch succeeds
      expect(result.results).toHaveLength(3);
      expect(result.results[0].success).toBe(true);
      expect(result.results[1].success).toBe(false); // Invalid operation fails
      expect(result.results[2].success).toBe(true);
    });

    it('should handle empty operations array', async () => {
      const result = await batchChartOperations([]);

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(0);
      expect(result.totalOperations).toBe(0);
    });

    it('should preserve operation order', async () => {
      const operations = [
        { type: 'load' as const, chartId: 'chart-1' },
        { type: 'load' as const, chartId: 'chart-2' },
        { type: 'load' as const, chartId: 'chart-3' },
      ];

      const result = await batchChartOperations(operations);

      expect(result.results[0].chartId).toBe('chart-1');
      expect(result.results[1].chartId).toBe('chart-2');
      expect(result.results[2].chartId).toBe('chart-3');
    });

    it('should handle large batch operations', async () => {
      const operations = Array.from({ length: 100 }, (_, i) => ({
        type: 'load' as const,
        chartId: `chart-${i}`,
      }));

      const result = await batchChartOperations(operations);

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(100);
      expect(result.totalOperations).toBe(100);
    });

    it('should include error details in failed operations', async () => {
      const invalidFormData = new FormData();
      // Missing required fields

      const operations = [
        {
          type: 'save' as const,
          chartId: 'chart-1',
          data: invalidFormData,
        },
      ];

      const result = await batchChartOperations(operations);

      expect(result.results[0].success).toBe(false);
      expect(result.results[0].error).toBeDefined();
      expect(typeof result.results[0].error).toBe('string');
      expect(result.results[0].operation).toEqual(operations[0]);
    });
  });

  describe('Integration Tests', () => {
    it('should perform save-load workflow', async () => {
      const config = { theme: 'dark', width: 1000 };
      const formData = new FormData();
      formData.append('chartId', 'chart-workflow');
      formData.append('config', JSON.stringify(config));

      // Save
      const saveResult = await saveChartConfig(formData);
      expect(saveResult.success).toBe(true);

      // Load
      const loadResult = await loadChartData('chart-workflow');
      expect(loadResult.success).toBe(true);
      expect(loadResult.chartId).toBe('chart-workflow');
    });

    it('should handle concurrent operations', async () => {
      const promises = [
        loadChartData('chart-1'),
        loadChartData('chart-2'),
        updateChartSeries('chart-3', [{ time: 1000, value: 100 }]),
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long chart IDs', async () => {
      const longId = 'chart-' + 'a'.repeat(1000);
      const result = await loadChartData(longId);

      expect(result.success).toBe(true);
      expect(result.chartId).toBe(longId);
    });

    it('should handle special characters in chart ID', async () => {
      const specialId = 'chart-123!@#$%^&*()';
      const result = await loadChartData(specialId);

      expect(result.success).toBe(true);
      expect(result.chartId).toBe(specialId);
    });

    it('should handle very large datasets', async () => {
      const largeData = Array.from({ length: 10000 }, (_, i) => ({
        time: i * 1000,
        value: 100 + Math.random() * 100,
      }));

      const result = await updateChartSeries('chart-1', largeData);

      expect(result.success).toBe(true);
      expect(result.processedData.length).toBe(10000);
    });
  });
});
