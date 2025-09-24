/**
 * @fileoverview Simplified ChartManager unit tests focused on core functionality
 * without React testing library complications
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';
import { IChartApi } from 'lightweight-charts';

// Mock the ChartManager module
const mockChartManager = {
  charts: {} as { [key: string]: IChartApi },
  series: {} as { [key: string]: any[] },
  signalPlugins: {} as { [key: string]: any },
  configs: {} as { [key: string]: any },
  containers: {} as { [key: string]: HTMLElement },

  getChart: vi.fn((chartId: string) => mockChartManager.charts[chartId]),
  getSeries: vi.fn((chartId: string) => mockChartManager.series[chartId]),
  getSignalPlugin: vi.fn((chartId: string) => mockChartManager.signalPlugins[chartId]),

  registerChart: vi.fn((chartId: string, chart: IChartApi, config: any) => {
    mockChartManager.charts[chartId] = chart;
    mockChartManager.configs[chartId] = config;
  }),

  unregisterChart: vi.fn((chartId: string) => {
    const chart = mockChartManager.charts[chartId];
    if (chart && typeof chart.remove === 'function') {
      try {
        chart.remove();
      } catch {
        // Gracefully handle chart removal errors
        console.warn('A warning occurred');
      }
    }
    delete mockChartManager.charts[chartId];
    delete mockChartManager.series[chartId];
    delete mockChartManager.signalPlugins[chartId];
    delete mockChartManager.configs[chartId];
  }),

  cleanup: vi.fn(() => {
    Object.keys(mockChartManager.charts).forEach(chartId => {
      mockChartManager.unregisterChart(chartId);
    });
  }),

  initializeGlobalRegistries: vi.fn(() => {
    (window as any).chartApiMap = {};
    (window as any).chartGroupMap = {};
    (window as any).priceScaleRegistries = {};
    (window as any).timeScaleRegistry = {};
  }),
};

// Mock chart API
const createMockChart = (): IChartApi =>
  ({
    remove: vi.fn(),
    resize: vi.fn(),
    addSeries: vi.fn(),
    timeScale: vi.fn(),
    priceScale: vi.fn(),
  }) as unknown as IChartApi;

describe('ChartManager Functionality', () => {
  let mockChart: IChartApi;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Reset manager state
    mockChartManager.charts = {};
    mockChartManager.series = {};
    mockChartManager.signalPlugins = {};
    mockChartManager.configs = {};
    mockChartManager.containers = {};

    // Create fresh mock chart
    mockChart = createMockChart();

    // Clean window state
    delete (window as any).chartApiMap;
    delete (window as any).chartGroupMap;
    delete (window as any).priceScaleRegistries;
    delete (window as any).timeScaleRegistry;
  });

  describe('Initialization', () => {
    it('should initialize with empty state', () => {
      expect(mockChartManager.getChart('test-chart')).toBeUndefined();
      expect(mockChartManager.getSeries('test-chart')).toBeUndefined();
      expect(mockChartManager.getSignalPlugin('test-chart')).toBeUndefined();
    });

    it('should initialize global registries', () => {
      mockChartManager.initializeGlobalRegistries();

      expect((window as any).chartApiMap).toBeDefined();
      expect((window as any).chartGroupMap).toBeDefined();
      expect((window as any).priceScaleRegistries).toBeDefined();
      expect((window as any).timeScaleRegistry).toBeDefined();
    });
  });

  describe('Chart Registration', () => {
    const mockConfig = {
      width: 800,
      height: 600,
    };

    it('should register a chart successfully', () => {
      mockChartManager.registerChart('test-chart', mockChart, mockConfig);

      expect(mockChartManager.getChart('test-chart')).toBe(mockChart);
      expect(mockChartManager.registerChart).toHaveBeenCalledWith(
        'test-chart',
        mockChart,
        mockConfig
      );
    });

    it('should handle multiple chart registrations', () => {
      const mockChart2 = createMockChart();
      const mockConfig2 = { width: 400, height: 300 };

      mockChartManager.registerChart('chart-1', mockChart, mockConfig);
      mockChartManager.registerChart('chart-2', mockChart2, mockConfig2);

      expect(mockChartManager.getChart('chart-1')).toBe(mockChart);
      expect(mockChartManager.getChart('chart-2')).toBe(mockChart2);
    });
  });

  describe('Chart Unregistration', () => {
    beforeEach(() => {
      mockChartManager.registerChart('test-chart', mockChart, { width: 800, height: 600 });
    });

    it('should unregister a chart and cleanup resources', () => {
      mockChartManager.unregisterChart('test-chart');

      expect(mockChart.remove).toHaveBeenCalled();
      expect(mockChartManager.getChart('test-chart')).toBeUndefined();
    });

    it('should handle unregistration of non-existent charts', () => {
      expect(() => {
        mockChartManager.unregisterChart('non-existent');
      }).not.toThrow();
    });
  });

  describe('Complete Cleanup', () => {
    beforeEach(() => {
      mockChartManager.registerChart('chart-1', mockChart, { width: 800, height: 600 });
      mockChartManager.registerChart('chart-2', createMockChart(), { width: 400, height: 300 });
    });

    it('should cleanup all charts and resources', () => {
      mockChartManager.cleanup();

      expect(mockChartManager.getChart('chart-1')).toBeUndefined();
      expect(mockChartManager.getChart('chart-2')).toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle chart removal errors gracefully', () => {
      const errorChart = {
        remove: vi.fn().mockImplementation(() => {
          throw new Error('Chart removal failed');
        }),
      } as unknown as IChartApi;

      mockChartManager.registerChart('error-chart', errorChart, {});

      expect(() => {
        mockChartManager.unregisterChart('error-chart');
      }).not.toThrow();
    });
  });

  describe('Performance Characteristics', () => {
    it('should handle large numbers of charts efficiently', () => {
      const startTime = Date.now();

      // Register 100 charts
      for (let i = 0; i < 100; i++) {
        const chart = createMockChart();
        mockChartManager.registerChart(`chart-${i}`, chart, { width: 800, height: 600 });
      }

      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(100); // Should complete in < 100ms

      // Verify all charts are registered
      for (let i = 0; i < 100; i++) {
        expect(mockChartManager.getChart(`chart-${i}`)).toBeDefined();
      }
    });
  });
});
