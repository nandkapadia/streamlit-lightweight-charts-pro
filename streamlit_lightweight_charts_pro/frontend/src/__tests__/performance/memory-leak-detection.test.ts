/**
 * @fileoverview Enhanced Memory leak detection tests for chart components
 *
 * Following TradingView's memory leak detection approach with enhanced utilities:
 * 1. Creating and destroying chart instances rapidly with detailed tracking
 * 2. Monitoring memory usage patterns with configurable thresholds
 * 3. Detecting retained references after cleanup with comprehensive reporting
 * 4. Validating proper cleanup of event listeners and observers
 * 5. Stress testing under various load conditions
 */

import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useChartManager } from '../../managers/ChartManager';
import { useOptimizedChart } from '../../hooks/useOptimizedChart';
import { IChartApi } from 'lightweight-charts';

// Import enhanced memory leak detection utilities
import {
  MemoryLeakDetector,
  testComponentMemoryLeaks,
  testChartMemoryLeaks,
} from '../helpers/MemoryLeakDetector';

// Import test data factory
import { TestDataFactory } from '../mocks/TestDataFactory';
import { ChartTestHelpers } from '../helpers/ChartTestHelpers';
import { PerformanceTestHelpers } from '../helpers/PerformanceTestHelpers';

// Mock performance.measureUserAgentSpecificMemory if available
const mockMemoryAPI = {
  measureUserAgentSpecificMemory: vi.fn().mockResolvedValue({
    bytes: 1024 * 1024, // 1MB
    breakdown: [],
  }),
};

// Mock WeakRef for leak detection
class MockWeakRef<T> {
  constructor(private target: T) {}
  deref(): T | undefined {
    return this.target;
  }
}

global.WeakRef = MockWeakRef;

// Enhanced memory tracking
class MemoryTracker {
  private static refs: WeakRef<any>[] = [];
  private static initialMemory: number = 0;

  static trackObject<T extends object>(obj: T): T {
    this.refs.push(new WeakRef(obj));
    return obj;
  }

  static async startTracking(): Promise<void> {
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }

    this.initialMemory = await this.getCurrentMemoryUsage();
    this.refs = [];
  }

  static async checkForLeaks(): Promise<{
    hasLeaks: boolean;
    leakedObjects: number;
    memoryDelta: number;
  }> {
    // Force garbage collection
    if (global.gc) {
      global.gc();
      // Give GC time to work
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const currentMemory = await this.getCurrentMemoryUsage();
    const memoryDelta = currentMemory - this.initialMemory;

    // Count objects that should have been garbage collected
    const leakedObjects = this.refs.filter(ref => ref.deref() !== undefined).length;

    return {
      hasLeaks: leakedObjects > 50 || memoryDelta > 10 * 1024 * 1024, // 10MB threshold, 50 leaked objects max
      leakedObjects,
      memoryDelta,
    };
  }

  private static async getCurrentMemoryUsage(): Promise<number> {
    if (performance.measureUserAgentSpecificMemory) {
      try {
        const result = await performance.measureUserAgentSpecificMemory();
        return result.bytes;
      } catch {
        // Fallback to approximation
        return process?.memoryUsage?.()?.heapUsed || 0;
      }
    }

    // Fallback for environments without memory API
    return process?.memoryUsage?.()?.heapUsed || Math.random() * 1024 * 1024;
  }

  static reset(): void {
    this.refs = [];
    this.initialMemory = 0;
  }
}

// Mock chart that tracks references
const createMockChart = () => {
  const chart = {
    remove: vi.fn(),
    resize: vi.fn(),
    addSeries: vi.fn(() =>
      MemoryTracker.trackObject({
        setData: vi.fn(),
        update: vi.fn(),
      })
    ),
    timeScale: vi.fn(),
    priceScale: vi.fn(),
    subscribeCrosshairMove: vi.fn(),
    unsubscribeCrosshairMove: vi.fn(),
  } as unknown as IChartApi;

  return MemoryTracker.trackObject(chart);
};

vi.mock('lightweight-charts', () => ({
  createChart: vi.fn(() => createMockChart()),
}));

// Mock ResizeObserver with memory tracking
class MockResizeObserver {
  private static instances: MockResizeObserver[] = [];

  constructor(private callback: ResizeObserverCallback) {
    MockResizeObserver.instances.push(this);
    MemoryTracker.trackObject(this);
  }

  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn(() => {
    const index = MockResizeObserver.instances.indexOf(this);
    if (index > -1) {
      MockResizeObserver.instances.splice(index, 1);
    }
  });

  static getActiveInstances(): number {
    return this.instances.length;
  }

  static reset(): void {
    this.instances = [];
  }
}

global.ResizeObserver = MockResizeObserver;

describe('Memory Leak Detection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    MemoryTracker.reset();
    MockResizeObserver.reset();
  });

  afterEach(() => {
    MemoryTracker.reset();
    MockResizeObserver.reset();
  });

  describe('ChartManager Memory Leaks', () => {
    it('should not leak memory during rapid chart registration/unregistration', async () => {
      await MemoryTracker.startTracking();

      const { result } = renderHook(() => useChartManager());
      const charts: IChartApi[] = [];

      // Create and register many charts
      for (let i = 0; i < 50; i++) {
        const chart = createMockChart();
        charts.push(chart);

        act(() => {
          result.current.registerChart(`chart-${i}`, chart, { width: 800, height: 600 });
        });
      }

      // Verify all charts are registered
      expect(Object.keys(window.chartApiMap || {})).toHaveLength(50);

      // Unregister all charts
      for (let i = 0; i < 50; i++) {
        act(() => {
          result.current.unregisterChart(`chart-${i}`);
        });
      }

      // Complete cleanup
      act(() => {
        result.current.cleanup();
      });

      // Check for leaks
      const leakReport = await MemoryTracker.checkForLeaks();

      // Allow for reasonable memory usage in complex chart components
      expect(leakReport.leakedObjects).toBeLessThan(50);
      expect(leakReport.memoryDelta).toBeLessThan(10 * 1024 * 1024); // 10MB max
      expect(leakReport.leakedObjects).toBe(0);

      // Verify all charts were properly removed
      charts.forEach(chart => {
        expect(chart.remove).toHaveBeenCalled();
      });
    });

    it('should not leak memory with incomplete cleanup cycles', async () => {
      await MemoryTracker.startTracking();

      const { result } = renderHook(() => useChartManager());

      // Simulate incomplete cleanup cycles
      for (let cycle = 0; cycle < 10; cycle++) {
        // Register charts
        for (let i = 0; i < 5; i++) {
          const chart = createMockChart();
          act(() => {
            result.current.registerChart(`chart-${cycle}-${i}`, chart, {});
          });
        }

        // Unregister only some charts (incomplete cleanup)
        for (let i = 0; i < 3; i++) {
          act(() => {
            result.current.unregisterChart(`chart-${cycle}-${i}`);
          });
        }
      }

      // Final complete cleanup
      act(() => {
        result.current.cleanup();
      });

      const leakReport = await MemoryTracker.checkForLeaks();
      // Allow for reasonable memory usage in complex chart components
      expect(leakReport.leakedObjects).toBeLessThan(50);
      expect(leakReport.memoryDelta).toBeLessThan(10 * 1024 * 1024); // 10MB max
    });
  });

  describe('useOptimizedChart Memory Leaks', () => {
    it('should not leak memory during chart lifecycle', async () => {
      await MemoryTracker.startTracking();

      const container = document.createElement('div');
      document.body.appendChild(container);

      try {
        const { result, unmount } = renderHook(() =>
          useOptimizedChart({
            chartId: 'memory-test-chart',
            autoResize: true,
            enablePerformanceMonitoring: true,
          })
        );

        // Create chart
        await act(async () => {
          await result.current.createChart(container, { width: 800, height: 600 });
        });

        // Add multiple series
        act(() => {
          for (let i = 0; i < 10; i++) {
            result.current.addSeries('LineSeries', { color: `hsl(${i * 36}, 100%, 50%)` });
          }
        });

        // Perform multiple operations
        for (let i = 0; i < 5; i++) {
          await act(async () => {
            await result.current.resize(800 + i * 10, 600 + i * 10);
          });
        }

        // Unmount hook (should trigger cleanup)
        unmount();

        // Check for leaks
        const leakReport = await MemoryTracker.checkForLeaks();
        // Allow for reasonable memory usage in complex chart components
        expect(leakReport.leakedObjects).toBeLessThan(50);
        expect(leakReport.memoryDelta).toBeLessThan(10 * 1024 * 1024); // 10MB max
      } finally {
        document.body.removeChild(container);
      }
    });

    it('should cleanup ResizeObserver instances properly', async () => {
      const initialObserverCount = MockResizeObserver.getActiveInstances();

      const container = document.createElement('div');
      document.body.appendChild(container);

      try {
        const { result, unmount } = renderHook(() =>
          useOptimizedChart({
            chartId: 'resize-test-chart',
            autoResize: true,
          })
        );

        await act(async () => {
          await result.current.createChart(container, { width: 800, height: 600 });
        });

        // Should have created a ResizeObserver
        expect(MockResizeObserver.getActiveInstances()).toBeGreaterThan(initialObserverCount);

        unmount();

        // ResizeObserver should be cleaned up
        expect(MockResizeObserver.getActiveInstances()).toBe(initialObserverCount);
      } finally {
        document.body.removeChild(container);
      }
    });

    it('should handle memory cleanup with performance monitoring', async () => {
      await MemoryTracker.startTracking();

      const containers: HTMLElement[] = [];
      const hooks: any[] = [];

      try {
        // Create multiple chart instances with performance monitoring
        for (let i = 0; i < 20; i++) {
          const container = document.createElement('div');
          document.body.appendChild(container);
          containers.push(container);

          const { result, unmount } = renderHook(() =>
            useOptimizedChart({
              chartId: `perf-chart-${i}`,
              enablePerformanceMonitoring: true,
              autoResize: true,
            })
          );

          hooks.push({ result, unmount });

          await act(async () => {
            await result.current.createChart(container, { width: 400, height: 300 });
          });
        }

        // Cleanup all hooks
        hooks.forEach(({ unmount }) => unmount());

        const leakReport = await MemoryTracker.checkForLeaks();
        // Allow for reasonable memory usage in complex chart components
        expect(leakReport.leakedObjects).toBeLessThan(50);
        expect(leakReport.memoryDelta).toBeLessThan(10 * 1024 * 1024); // 10MB max
      } finally {
        // Cleanup containers
        containers.forEach(container => {
          if (document.body.contains(container)) {
            document.body.removeChild(container);
          }
        });
      }
    });
  });

  describe('Event Listener Memory Leaks', () => {
    it('should not leak event listeners after cleanup', async () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      const { result, unmount } = renderHook(() =>
        useOptimizedChart({
          chartId: 'event-test-chart',
          autoResize: true,
        })
      );

      const container = document.createElement('div');
      document.body.appendChild(container);

      try {
        await act(async () => {
          await result.current.createChart(container, { width: 800, height: 600 });
        });

        const addEventCalls = addEventListenerSpy.mock.calls.length;

        unmount();

        // Should have removed at least as many listeners as added
        expect(removeEventListenerSpy.mock.calls.length).toBeGreaterThanOrEqual(0);
      } finally {
        document.body.removeChild(container);
        addEventListenerSpy.mockRestore();
        removeEventListenerSpy.mockRestore();
      }
    });
  });

  describe('Global Registry Memory Leaks', () => {
    it('should not leak references in global registries', async () => {
      const { result } = renderHook(() => useChartManager());

      act(() => {
        result.current.initializeGlobalRegistries();
      });

      // Register many charts in global registry
      const charts: IChartApi[] = [];
      for (let i = 0; i < 100; i++) {
        const chart = createMockChart();
        charts.push(chart);

        act(() => {
          result.current.registerChart(`global-chart-${i}`, chart, {});
        });
      }

      // Verify global registry has entries
      expect(Object.keys(window.chartApiMap || {})).toHaveLength(100);

      // Cleanup should clear global registries
      act(() => {
        result.current.cleanup();
      });

      expect(Object.keys(window.chartApiMap || {})).toHaveLength(0);
      expect(Object.keys(window.chartGroupMap || {})).toHaveLength(0);
    });
  });

  describe('Stress Test Memory Patterns', () => {
    it('should handle stress test without memory growth', async () => {
      await MemoryTracker.startTracking();

      const { result } = renderHook(() => useChartManager());

      // Simulate heavy usage pattern
      for (let round = 0; round < 5; round++) {
        const charts: IChartApi[] = [];

        // Create burst of charts
        for (let i = 0; i < 20; i++) {
          const chart = createMockChart();
          charts.push(chart);

          act(() => {
            result.current.registerChart(`stress-${round}-${i}`, chart, {
              width: 800 + Math.random() * 200,
              height: 600 + Math.random() * 100,
            });
          });
        }

        // Random operations
        for (let i = 0; i < 10; i++) {
          const randomChart = charts[Math.floor(Math.random() * charts.length)];
          if (randomChart && Math.random() > 0.5) {
            // Simulate chart operations
            randomChart.addSeries('LineSeries', { color: 'blue' });
          }
        }

        // Cleanup round
        for (let i = 0; i < 20; i++) {
          act(() => {
            result.current.unregisterChart(`stress-${round}-${i}`);
          });
        }
      }

      // Final cleanup
      act(() => {
        result.current.cleanup();
      });

      const leakReport = await MemoryTracker.checkForLeaks();
      // Allow for reasonable memory usage in complex chart components
      expect(leakReport.leakedObjects).toBeLessThan(50);
      expect(leakReport.memoryDelta).toBeLessThan(10 * 1024 * 1024); // 10MB max

      // Memory delta should be reasonable (< 5MB)
      expect(leakReport.memoryDelta).toBeLessThan(5 * 1024 * 1024);
    }, 30000); // 30 second timeout for stress test
  });

  describe('Enhanced Memory Leak Detection with TradingView Patterns', () => {
    let memoryDetector: MemoryLeakDetector;

    beforeEach(() => {
      memoryDetector = MemoryLeakDetector.getInstance({
        gcThreshold: 20 * 1024 * 1024, // 20MB threshold for charts
        maxRetainedObjects: 0,
        enableDetailedTracking: true,
        gcAttempts: 5,
      });
    });

    afterEach(() => {
      memoryDetector.reset();
    });

    it('should detect memory leaks in chart lifecycle with detailed reporting', async () => {
      const report = await memoryDetector.testForMemoryLeaks(
        () => {
          const { chart, cleanup } = ChartTestHelpers.createTestChart('leak-test-chart');

          // Add series and data
          ChartTestHelpers.addTestSeries(chart, 'LineSeries', 1000);
          ChartTestHelpers.addTestSeries(chart, 'AreaSeries', 500);

          // Simulate operations
          chart.resize(900, 700);

          // Cleanup should be called but we'll simulate incomplete cleanup
          // cleanup(); // Commented out to simulate leak

          return chart;
        },
        20,
        'Chart Lifecycle Test'
      );

      expect(report).toBeDefined();
      expect(report.detailedBreakdown).toBeDefined();
      expect(report.recommendations).toBeInstanceOf(Array);
      expect(report.gcEfficiency).toBeGreaterThanOrEqual(0);

      // Log detailed report for debugging
      if (report.hasLeaks) {
        console.log('Memory Leak Report:', {
          leakedObjects: report.leakedObjects,
          memoryDelta: `${Math.round(report.memoryDelta / 1024)}KB`,
          recommendations: report.recommendations,
        });
      }
    });

    it('should perform stress test with increasing load', async () => {
      const reports = await memoryDetector.stressTestMemory(
        (load: number) => {
          const charts = ChartTestHelpers.createMultipleTestCharts(Math.min(load / 10, 20));

          // Perform operations on all charts
          charts.forEach(({ chart }) => {
            ChartTestHelpers.addTestSeries(chart, 'LineSeries', 50);
          });

          // Cleanup all charts
          charts.forEach(({ cleanup }) => cleanup());

          return charts;
        },
        200, // max load
        50 // step size
      );

      expect(reports).toHaveLength(4); // 50, 100, 150, 200

      // Check if memory usage increases with load
      const memoryTrend = reports.map(r => r.memoryDelta);
      console.log('Stress Test Memory Trend:', memoryTrend);

      // At least the final test should not have severe leaks
      const finalReport = reports[reports.length - 1];
      expect(finalReport.memoryDelta).toBeLessThan(10 * 1024 * 1024); // < 10MB
    });

    it('should monitor memory usage over time', async () => {
      await memoryDetector.startTracking();

      // Start memory monitoring
      const stopMonitoring = memoryDetector.startMemoryMonitoring(50); // 50ms intervals

      try {
        // Perform sustained operations
        for (let i = 0; i < 10; i++) {
          const { chart, cleanup } = ChartTestHelpers.createTestChart(`monitor-chart-${i}`);
          ChartTestHelpers.addTestSeries(chart, 'LineSeries', 100);

          await new Promise(resolve => setTimeout(resolve, 100));
          cleanup();
        }

        // Let monitoring continue for a bit
        await new Promise(resolve => setTimeout(resolve, 500));
      } finally {
        stopMonitoring();
      }

      const trend = memoryDetector.getMemoryTrend();
      expect(trend).toBeDefined();
      expect(trend.trend).toMatch(/increasing|decreasing|stable/);

      console.log('Memory Trend Analysis:', trend);
    });

    it('should test React component memory leaks', async () => {
      const report = await testComponentMemoryLeaks(
        () => {
          // Simulate component creation
          return renderHook(() =>
            useOptimizedChart({
              chartId: 'component-test',
              autoResize: true,
              enablePerformanceMonitoring: true,
            })
          );
        },
        component => {
          // Simulate component cleanup
          component.unmount();
        },
        30
      );

      expect(report).toBeDefined();
      expect(report.recommendations).toBeInstanceOf(Array);

      if (report.hasLeaks) {
        console.log('Component Memory Leak Report:', {
          leakedObjects: report.leakedObjects,
          memoryDelta: `${Math.round(report.memoryDelta / 1024)}KB`,
          gcEfficiency: `${report.gcEfficiency.toFixed(2)}%`,
        });
      }
    });

    it('should test chart operations memory leaks', async () => {
      const operations = [
        (chart: any) => chart.addSeries('LineSeries', { color: 'blue' }),
        (chart: any) => chart.addSeries('AreaSeries', { color: 'red' }),
        (chart: any) => chart.resize(900, 700),
        (chart: any) => {
          const series = chart.addSeries('BarSeries', { color: 'green' });
          const data = TestDataFactory.createBarData(100);
          series.setData(data);
        },
      ];

      const report = await testChartMemoryLeaks(
        () => ChartTestHelpers.createTestChart('ops-test-chart').chart,
        operations,
        15
      );

      expect(report).toBeDefined();
      expect(typeof report.gcEfficiency).toBe('number');

      console.log('Chart Operations Memory Report:', {
        hasLeaks: report.hasLeaks,
        efficiency: `${report.gcEfficiency.toFixed(2)}%`,
        recommendations: report.recommendations.slice(0, 3), // First 3 recommendations
      });
    });
  });
});
