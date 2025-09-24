/**
 * @fileoverview Enhanced useOptimizedChart tests with real chart creation,
 * performance monitoring, and comprehensive lifecycle testing using centralized mocks.
 */

import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useOptimizedChart } from '../../hooks/useOptimizedChart';
import { createChart } from 'lightweight-charts';

// Import centralized testing infrastructure
import { setupTestSuite, TestConfigurationManager } from '../setup/testConfiguration';
import { MockFactory } from '../mocks/MockFactory';
import { TestDataFactory } from '../mocks/TestDataFactory';

// Setup test suite with integration preset for realistic behavior
setupTestSuite('integration');

// Mock lightweight-charts with centralized factory
vi.mock('lightweight-charts', () => MockFactory.createLightweightChartsModule());

describe('useOptimizedChart - Enhanced Tests', () => {
  let container: HTMLElement;
  let mockChart: any;
  let mockSeries: any;

  beforeEach(() => {
    // Reset centralized mocks
    MockFactory.resetAll();

    // Create fresh mocks for each test
    mockChart = MockFactory.createChart();
    mockSeries = MockFactory.createSeries();

    // Create a mock container using centralized factory
    container = MockFactory.createDOMElement('div');
    container.style.width = '800px';
    container.style.height = '600px';
    document.body.appendChild(container);
  });

  afterEach(() => {
    // Use centralized cleanup
    TestConfigurationManager.cleanup();

    if (container && document.body.contains(container)) {
      document.body.removeChild(container);
    }
  });

  describe('Chart Creation and Lifecycle', () => {
    it('should create chart successfully with valid container', async () => {
      const options = {
        chartId: 'test-chart',
        enablePerformanceMonitoring: true,
      };

      const { result } = renderHook(() => useOptimizedChart(options));

      expect(result.current.getChart()).toBeNull();
      expect(result.current.isReady()).toBe(false);

      await act(async () => {
        const chart = await result.current.createChart(
          container,
          TestDataFactory.createChartOptions({
            width: 800,
            height: 600,
          })
        );

        expect(chart).toBeDefined();
      });

      expect(createChart).toHaveBeenCalledWith(
        container,
        TestDataFactory.createChartOptions({
          width: 800,
          height: 600,
        })
      );

      expect(result.current.getChart()).toBeDefined();
    });

    it('should handle chart creation failure gracefully', async () => {
      const options = { chartId: 'test-chart' };

      // Mock createChart to throw error
      vi.mocked(createChart).mockImplementationOnce(() => {
        throw new Error('Chart creation failed');
      });

      const { result } = renderHook(() => useOptimizedChart(options));

      await act(async () => {
        const chart = await result.current.createChart(
          container,
          TestDataFactory.createChartOptions({
            width: 800,
            height: 600,
          })
        );

        expect(chart).toBeNull();
      });

      expect(result.current.getChart()).toBeNull();
    });

    it('should cleanup chart properly on unmount', async () => {
      const options = { chartId: 'test-chart' };
      const { result, unmount } = renderHook(() => useOptimizedChart(options));

      await act(async () => {
        await result.current.createChart(
          container,
          TestDataFactory.createChartOptions({ width: 800, height: 600 })
        );
      });

      expect(result.current.getChart()).toBe(mockChart);

      unmount();

      expect(mockChart.remove).toHaveBeenCalled();
    });
  });

  describe('Series Management', () => {
    it('should add series successfully after chart creation', async () => {
      const options = { chartId: 'test-chart' };
      const { result } = renderHook(() => useOptimizedChart(options));

      await act(async () => {
        await result.current.createChart(
          container,
          TestDataFactory.createChartOptions({ width: 800, height: 600 })
        );
      });

      act(() => {
        const series = result.current.addSeries('Line', { color: 'blue' });
        expect(series).toBe(mockSeries);
      });

      expect(mockChart.addSeries).toHaveBeenCalledWith('Line', { color: 'blue' });
      expect(result.current.getAllSeries()).toHaveLength(1);
      expect(result.current.getSeries(0)).toBe(mockSeries);
    });

    it('should handle multiple series addition', async () => {
      const options = { chartId: 'test-chart' };
      const { result } = renderHook(() => useOptimizedChart(options));

      await act(async () => {
        await result.current.createChart(
          container,
          TestDataFactory.createChartOptions({ width: 800, height: 600 })
        );
      });

      const mockSeries2 = { ...mockSeries };
      const mockSeries3 = { ...mockSeries };

      const mockAddSeries = mockChart.addSeries as ReturnType<typeof vi.fn>;
      mockAddSeries
        .mockReturnValueOnce(mockSeries)
        .mockReturnValueOnce(mockSeries2)
        .mockReturnValueOnce(mockSeries3);

      act(() => {
        result.current.addSeries('Line', { color: 'blue' });
        result.current.addSeries('Candlestick', {});
        result.current.addSeries('Area', { color: 'red' });
      });

      expect(result.current.getAllSeries()).toHaveLength(3);
      expect(result.current.getSeries(0)).toBe(mockSeries);
      expect(result.current.getSeries(1)).toBe(mockSeries2);
      expect(result.current.getSeries(2)).toBe(mockSeries3);
    });

    it('should return null for invalid series index', async () => {
      const options = { chartId: 'test-chart' };
      const { result } = renderHook(() => useOptimizedChart(options));

      await act(async () => {
        await result.current.createChart(
          container,
          TestDataFactory.createChartOptions({ width: 800, height: 600 })
        );
      });

      expect(result.current.getSeries(999)).toBeNull();
      expect(result.current.getSeries(-1)).toBeNull();
    });
  });

  describe('Performance Monitoring', () => {
    it('should track performance metrics when enabled', async () => {
      const options = {
        chartId: 'test-chart',
        enablePerformanceMonitoring: true,
      };

      const { result } = renderHook(() => useOptimizedChart(options));

      await act(async () => {
        await result.current.createChart(
          container,
          TestDataFactory.createChartOptions({ width: 800, height: 600 })
        );
      });

      expect(performance.mark).toHaveBeenCalledWith('chart-test-chart-start');
      expect(performance.mark).toHaveBeenCalledWith('chart-test-chart-end');
      expect(performance.measure).toHaveBeenCalledWith(
        'chart-test-chart',
        'chart-test-chart-start',
        'chart-test-chart-end'
      );
    });

    it('should not track performance when disabled', async () => {
      const options = {
        chartId: 'test-chart',
        enablePerformanceMonitoring: false,
      };

      const { result } = renderHook(() => useOptimizedChart(options));

      await act(async () => {
        await result.current.createChart(
          container,
          TestDataFactory.createChartOptions({ width: 800, height: 600 })
        );
      });

      expect(performance.mark).not.toHaveBeenCalled();
      expect(performance.measure).not.toHaveBeenCalled();
    });

    it('should track series addition performance', async () => {
      const options = {
        chartId: 'test-chart',
        enablePerformanceMonitoring: true,
      };

      const { result } = renderHook(() => useOptimizedChart(options));

      await act(async () => {
        await result.current.createChart(
          container,
          TestDataFactory.createChartOptions({ width: 800, height: 600 })
        );
      });

      // Clear previous marks
      vi.clearAllMocks();

      act(() => {
        result.current.addSeries('Line', { color: 'blue' });
      });

      expect(performance.mark).toHaveBeenCalled();
    });
  });

  describe('Resize Operations', () => {
    it('should resize chart with valid dimensions', async () => {
      const options = {
        chartId: 'test-chart',
        minWidth: 100,
        minHeight: 100,
      };

      const { result } = renderHook(() => useOptimizedChart(options));

      await act(async () => {
        await result.current.createChart(
          container,
          TestDataFactory.createChartOptions({ width: 800, height: 600 })
        );
      });

      await act(async () => {
        await result.current.resize(1000, 800);
      });

      expect(mockChart.resize).toHaveBeenCalledWith(1000, 800);
    });

    it('should not resize with invalid dimensions', async () => {
      const options = {
        chartId: 'test-chart',
        minWidth: 200,
        minHeight: 200,
      };

      const { result } = renderHook(() => useOptimizedChart(options));

      await act(async () => {
        await result.current.createChart(
          container,
          TestDataFactory.createChartOptions({ width: 800, height: 600 })
        );
      });

      await act(async () => {
        await result.current.resize(100, 100); // Below minimum
      });

      expect(mockChart.resize).not.toHaveBeenCalled();
    });

    it('should handle resize errors gracefully', async () => {
      const options = { chartId: 'test-chart' };
      const { result } = renderHook(() => useOptimizedChart(options));

      await act(async () => {
        await result.current.createChart(
          container,
          TestDataFactory.createChartOptions({ width: 800, height: 600 })
        );
      });

      // Mock resize to throw error
      const mockResize = mockChart.resize as ReturnType<typeof vi.fn>;
      mockResize.mockImplementationOnce(() => {
        throw new Error('Resize failed');
      });

      await act(async () => {
        await result.current.resize(1000, 800);
      });

      // Should not throw error
      expect(mockChart.resize).toHaveBeenCalled();
    });
  });

  describe('Chart Ready Detection', () => {
    it('should detect chart ready state correctly', async () => {
      const options = {
        chartId: 'test-chart',
        minWidth: 100,
        minHeight: 100,
      };

      const { result } = renderHook(() => useOptimizedChart(options));

      expect(result.current.isReady()).toBe(false);
      expect(result.current.isChartReadySync()).toBe(false);

      await act(async () => {
        await result.current.createChart(
          container,
          TestDataFactory.createChartOptions({ width: 800, height: 600 })
        );
      });

      // After creation, chart should be ready
      expect(result.current.isReady()).toBe(true);
    });

    it('should wait for chart ready asynchronously', async () => {
      const options = {
        chartId: 'test-chart',
        maxReadyAttempts: 3,
        baseReadyDelay: 100,
      };

      const { result } = renderHook(() => useOptimizedChart(options));

      await act(async () => {
        await result.current.createChart(
          container,
          TestDataFactory.createChartOptions({ width: 800, height: 600 })
        );
      });

      const isReady = await act(async () => {
        return await result.current.waitForChartReady();
      });

      expect(isReady).toBe(true);
    });
  });

  describe('Auto-Resize with ResizeObserver', () => {
    it('should setup ResizeObserver when autoResize is enabled', async () => {
      const options = {
        chartId: 'test-chart',
        autoResize: true,
        throttleMs: 50,
        debounceMs: 100,
      };

      const { result } = renderHook(() => useOptimizedChart(options));

      await act(async () => {
        await result.current.createChart(
          container,
          TestDataFactory.createChartOptions({ width: 800, height: 600 })
        );
      });

      expect(ResizeObserver.prototype.observe).toHaveBeenCalled();
    });

    it('should not setup ResizeObserver when autoResize is disabled', async () => {
      const options = {
        chartId: 'test-chart',
        autoResize: false,
      };

      const { result } = renderHook(() => useOptimizedChart(options));

      await act(async () => {
        await result.current.createChart(
          container,
          TestDataFactory.createChartOptions({ width: 800, height: 600 })
        );
      });

      expect(ResizeObserver.prototype.observe).not.toHaveBeenCalled();
    });
  });

  describe('Memory Management', () => {
    it('should cleanup ResizeObserver on unmount', async () => {
      const options = {
        chartId: 'test-chart',
        autoResize: true,
      };

      const { result, unmount } = renderHook(() => useOptimizedChart(options));

      await act(async () => {
        await result.current.createChart(
          container,
          TestDataFactory.createChartOptions({ width: 800, height: 600 })
        );
      });

      unmount();

      expect(ResizeObserver.prototype.disconnect).toHaveBeenCalled();
    });

    it('should handle multiple cleanup calls safely', async () => {
      const options = { chartId: 'test-chart' };
      const { result } = renderHook(() => useOptimizedChart(options));

      await act(async () => {
        await result.current.createChart(
          container,
          TestDataFactory.createChartOptions({ width: 800, height: 600 })
        );
      });

      // Multiple cleanup calls should not throw
      expect(() => {
        result.current.cleanup();
        result.current.cleanup();
        result.current.cleanup();
      }).not.toThrow();

      expect(mockChart.remove).toHaveBeenCalledTimes(1);
    });
  });

  describe('Configuration Options', () => {
    it('should respect minWidth and minHeight constraints', async () => {
      const options = {
        chartId: 'test-chart',
        minWidth: 400,
        minHeight: 300,
      };

      const { result } = renderHook(() => useOptimizedChart(options));

      await act(async () => {
        await result.current.createChart(
          container,
          TestDataFactory.createChartOptions({ width: 800, height: 600 })
        );
      });

      // Try to resize below minimum
      await act(async () => {
        await result.current.resize(200, 150);
      });

      expect(mockChart.resize).not.toHaveBeenCalled();

      // Resize above minimum should work
      await act(async () => {
        await result.current.resize(500, 400);
      });

      expect(mockChart.resize).toHaveBeenCalledWith(500, 400);
    });

    it('should use correct debounce and throttle settings', () => {
      const options = {
        chartId: 'test-chart',
        debounceMs: 200,
        throttleMs: 100,
      };

      const { result } = renderHook(() => useOptimizedChart(options));

      expect(result.current.chartId).toBe('test-chart');
    });
  });

  describe('Error Scenarios', () => {
    it('should handle container operations without chart', () => {
      const options = { chartId: 'test-chart' };
      const { result } = renderHook(() => useOptimizedChart(options));

      expect(result.current.getContainer()).toBeNull();
      expect(result.current.getChart()).toBeNull();
    });

    it('should handle series operations without chart', () => {
      const options = { chartId: 'test-chart' };
      const { result } = renderHook(() => useOptimizedChart(options));

      expect(result.current.addSeries('Line', {})).toBeNull();
      expect(result.current.getSeries(0)).toBeNull();
      expect(result.current.getAllSeries()).toEqual([]);
    });
  });
});
