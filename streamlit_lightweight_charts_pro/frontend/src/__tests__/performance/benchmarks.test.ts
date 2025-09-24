/**
 * @fileoverview Performance benchmark tests for critical chart operations
 *
 * These tests establish performance baselines and ensure critical operations
 * complete within acceptable time limits, similar to TradingView's approach.
 */

import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useChartManager } from '../../managers/ChartManager';
import { useOptimizedChart } from '../../hooks/useOptimizedChart';
import { IChartApi } from 'lightweight-charts';

// Performance thresholds (in milliseconds)
const PERFORMANCE_THRESHOLDS = {
  CHART_CREATION: 500,
  SERIES_ADDITION: 50,
  CHART_REGISTRATION: 10,
  CHART_UNREGISTRATION: 20,
  BULK_SERIES_ADDITION: 200,
  RESIZE_OPERATION: 16, // ~60fps
  CLEANUP_OPERATION: 100,
};

// Mock chart with realistic timing simulation
const createRealisticMockChart = (creationDelay = 0) => {
  return {
    remove: vi.fn().mockImplementation(() => {
      // Simulate cleanup time
      const start = performance.now();
      while (performance.now() - start < 1) {
        /* small delay */
      }
    }),
    resize: vi.fn().mockImplementation(() => {
      // Simulate resize calculation time
      const start = performance.now();
      while (performance.now() - start < 2) {
        /* small delay */
      }
    }),
    addSeries: vi.fn().mockImplementation(() => {
      // Simulate series creation time
      const start = performance.now();
      while (performance.now() - start < 1) {
        /* small delay */
      }
      return {
        setData: vi.fn(),
        update: vi.fn(),
        applyOptions: vi.fn(),
      };
    }),
    timeScale: vi.fn(() => ({
      fitContent: vi.fn(),
      setVisibleLogicalRange: vi.fn(),
    })),
    priceScale: vi.fn(() => ({
      setScaleMode: vi.fn(),
    })),
    subscribeCrosshairMove: vi.fn(),
    unsubscribeCrosshairMove: vi.fn(),
    applyOptions: vi.fn(),
  } as unknown as IChartApi;
};

vi.mock('lightweight-charts', () => ({
  createChart: vi.fn(() => createRealisticMockChart()),
}));

// Performance measurement utilities
class PerformanceBenchmark {
  private static measurements: { [key: string]: number[] } = {};

  static async measure<T>(name: string, operation: () => Promise<T> | T): Promise<T> {
    const start = performance.now();
    const result = await operation();
    const duration = performance.now() - start;

    if (!this.measurements[name]) {
      this.measurements[name] = [];
    }
    this.measurements[name].push(duration);

    return result;
  }

  static getStats(name: string) {
    const measurements = this.measurements[name] || [];
    if (measurements.length === 0) {
      return { avg: 0, min: 0, max: 0, p95: 0, count: 0 };
    }

    const sorted = [...measurements].sort((a, b) => a - b);
    const avg = measurements.reduce((a, b) => a + b, 0) / measurements.length;
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];

    return { avg, min, max, p95, count: measurements.length };
  }

  static reset(): void {
    this.measurements = {};
  }

  static getAll(): { [key: string]: ReturnType<typeof PerformanceBenchmark.getStats> } {
    const results: { [key: string]: ReturnType<typeof PerformanceBenchmark.getStats> } = {};
    for (const name of Object.keys(this.measurements)) {
      results[name] = this.getStats(name);
    }
    return results;
  }
}

describe('Performance Benchmarks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    PerformanceBenchmark.reset();
  });

  describe('ChartManager Performance', () => {
    it('should register charts within performance threshold', async () => {
      const { result } = renderHook(() => useChartManager());

      for (let i = 0; i < 10; i++) {
        const chart = createRealisticMockChart();

        await PerformanceBenchmark.measure('chart-registration', () => {
          return new Promise<void>(resolve => {
            act(() => {
              result.current.registerChart(`chart-${i}`, chart, { width: 800, height: 600 });
              resolve();
            });
          });
        });
      }

      const stats = PerformanceBenchmark.getStats('chart-registration');
      expect(stats.avg).toBeLessThan(PERFORMANCE_THRESHOLDS.CHART_REGISTRATION);
      expect(stats.p95).toBeLessThan(PERFORMANCE_THRESHOLDS.CHART_REGISTRATION * 2);

      console.log('Chart Registration Performance:', stats);
    });

    it('should unregister charts within performance threshold', async () => {
      const { result } = renderHook(() => useChartManager());

      // Setup charts
      const charts: IChartApi[] = [];
      for (let i = 0; i < 10; i++) {
        const chart = createRealisticMockChart();
        charts.push(chart);
        act(() => {
          result.current.registerChart(`chart-${i}`, chart, {});
        });
      }

      // Measure unregistration
      for (let i = 0; i < 10; i++) {
        await PerformanceBenchmark.measure('chart-unregistration', () => {
          return new Promise<void>(resolve => {
            act(() => {
              result.current.unregisterChart(`chart-${i}`);
              resolve();
            });
          });
        });
      }

      const stats = PerformanceBenchmark.getStats('chart-unregistration');
      expect(stats.avg).toBeLessThan(PERFORMANCE_THRESHOLDS.CHART_UNREGISTRATION);

      console.log('Chart Unregistration Performance:', stats);
    });

    it('should cleanup all resources within performance threshold', async () => {
      const { result } = renderHook(() => useChartManager());

      // Setup many charts
      for (let i = 0; i < 50; i++) {
        const chart = createRealisticMockChart();
        act(() => {
          result.current.registerChart(`chart-${i}`, chart, {});
        });
      }

      // Measure cleanup
      await PerformanceBenchmark.measure('bulk-cleanup', () => {
        return new Promise<void>(resolve => {
          act(() => {
            result.current.cleanup();
            resolve();
          });
        });
      });

      const stats = PerformanceBenchmark.getStats('bulk-cleanup');
      expect(stats.avg).toBeLessThan(PERFORMANCE_THRESHOLDS.CLEANUP_OPERATION);

      console.log('Bulk Cleanup Performance:', stats);
    });
  });

  describe('useOptimizedChart Performance', () => {
    it('should create charts within performance threshold', async () => {
      const containers: HTMLElement[] = [];

      try {
        for (let i = 0; i < 5; i++) {
          const container = document.createElement('div');
          container.style.width = '800px';
          container.style.height = '600px';
          document.body.appendChild(container);
          containers.push(container);

          const { result } = renderHook(() => useOptimizedChart({ chartId: `perf-chart-${i}` }));

          await PerformanceBenchmark.measure('chart-creation', async () => {
            await act(async () => {
              await result.current.createChart(container, { width: 800, height: 600 });
            });
          });
        }

        const stats = PerformanceBenchmark.getStats('chart-creation');
        expect(stats.avg).toBeLessThan(PERFORMANCE_THRESHOLDS.CHART_CREATION);

        console.log('Chart Creation Performance:', stats);
      } finally {
        containers.forEach(container => {
          if (document.body.contains(container)) {
            document.body.removeChild(container);
          }
        });
      }
    });

    it('should add series within performance threshold', async () => {
      const container = document.createElement('div');
      document.body.appendChild(container);

      try {
        const { result } = renderHook(() => useOptimizedChart({ chartId: 'series-perf-test' }));

        await act(async () => {
          await result.current.createChart(container, { width: 800, height: 600 });
        });

        // Measure series addition
        for (let i = 0; i < 20; i++) {
          await PerformanceBenchmark.measure('series-addition', () => {
            return new Promise<void>(resolve => {
              act(() => {
                result.current.addSeries('LineSeries', {
                  color: `hsl(${i * 18}, 100%, 50%)`,
                });
                resolve();
              });
            });
          });
        }

        const stats = PerformanceBenchmark.getStats('series-addition');
        expect(stats.avg).toBeLessThan(PERFORMANCE_THRESHOLDS.SERIES_ADDITION);

        console.log('Series Addition Performance:', stats);
      } finally {
        document.body.removeChild(container);
      }
    });

    it('should handle resize operations within performance threshold', async () => {
      const container = document.createElement('div');
      document.body.appendChild(container);

      try {
        const { result } = renderHook(() =>
          useOptimizedChart({
            chartId: 'resize-perf-test',
            debounceMs: 0, // Disable debouncing for accurate measurement
          })
        );

        await act(async () => {
          await result.current.createChart(container, { width: 800, height: 600 });
        });

        // Measure resize operations
        const sizes = [
          [800, 600],
          [900, 700],
          [1000, 800],
          [1100, 900],
          [1200, 1000],
        ];

        for (const [width, height] of sizes) {
          await PerformanceBenchmark.measure('resize-operation', async () => {
            await act(async () => {
              await result.current.resize(width, height);
            });
          });
        }

        const stats = PerformanceBenchmark.getStats('resize-operation');
        expect(stats.avg).toBeLessThan(PERFORMANCE_THRESHOLDS.RESIZE_OPERATION);

        console.log('Resize Operation Performance:', stats);
      } finally {
        document.body.removeChild(container);
      }
    });
  });

  describe('Bulk Operations Performance', () => {
    it('should handle bulk series addition efficiently', async () => {
      const container = document.createElement('div');
      document.body.appendChild(container);

      try {
        const { result } = renderHook(() => useOptimizedChart({ chartId: 'bulk-series-test' }));

        await act(async () => {
          await result.current.createChart(container, { width: 800, height: 600 });
        });

        // Measure bulk series addition
        await PerformanceBenchmark.measure('bulk-series-addition', () => {
          return new Promise<void>(resolve => {
            act(() => {
              // Add 10 series at once
              for (let i = 0; i < 10; i++) {
                result.current.addSeries('LineSeries', {
                  color: `hsl(${i * 36}, 70%, 50%)`,
                });
              }
              resolve();
            });
          });
        });

        const stats = PerformanceBenchmark.getStats('bulk-series-addition');
        expect(stats.avg).toBeLessThan(PERFORMANCE_THRESHOLDS.BULK_SERIES_ADDITION);

        console.log('Bulk Series Addition Performance:', stats);
      } finally {
        document.body.removeChild(container);
      }
    });

    it('should handle concurrent chart operations efficiently', async () => {
      const containers: HTMLElement[] = [];
      const hooks: any[] = [];

      try {
        // Create multiple charts concurrently
        await PerformanceBenchmark.measure('concurrent-operations', async () => {
          const promises = [];

          for (let i = 0; i < 5; i++) {
            const container = document.createElement('div');
            document.body.appendChild(container);
            containers.push(container);

            const { result } = renderHook(() =>
              useOptimizedChart({ chartId: `concurrent-chart-${i}` })
            );
            hooks.push(result);

            const promise = act(async () => {
              await result.current.createChart(container, { width: 400, height: 300 });

              // Add series to each chart
              for (let j = 0; j < 3; j++) {
                result.current.addSeries('LineSeries', { color: 'blue' });
              }
            });

            promises.push(promise);
          }

          await Promise.all(promises);
        });

        const stats = PerformanceBenchmark.getStats('concurrent-operations');
        expect(stats.avg).toBeLessThan(2000); // 2 seconds for all concurrent operations

        console.log('Concurrent Operations Performance:', stats);
      } finally {
        containers.forEach(container => {
          if (document.body.contains(container)) {
            document.body.removeChild(container);
          }
        });
      }
    });
  });

  describe('Memory and Performance Correlation', () => {
    it('should maintain performance under memory pressure', async () => {
      const { result } = renderHook(() => useChartManager());

      // Create memory pressure by allocating large objects
      const largeObjects: number[][] = [];
      for (let i = 0; i < 10; i++) {
        largeObjects.push(new Array(100000).fill(0).map(() => Math.random()));
      }

      try {
        // Measure performance under memory pressure
        for (let i = 0; i < 10; i++) {
          const chart = createRealisticMockChart();

          await PerformanceBenchmark.measure('memory-pressure-registration', () => {
            return new Promise<void>(resolve => {
              act(() => {
                result.current.registerChart(`pressure-chart-${i}`, chart, {});
                resolve();
              });
            });
          });
        }

        const stats = PerformanceBenchmark.getStats('memory-pressure-registration');

        // Performance should still be reasonable under memory pressure
        expect(stats.avg).toBeLessThan(PERFORMANCE_THRESHOLDS.CHART_REGISTRATION * 3);

        console.log('Performance Under Memory Pressure:', stats);
      } finally {
        // Cleanup memory pressure
        largeObjects.length = 0;

        act(() => {
          result.current.cleanup();
        });
      }
    });
  });

  describe('Performance Regression Detection', () => {
    it('should detect performance regressions', async () => {
      const { result } = renderHook(() => useChartManager());

      // Baseline measurements
      const baselineRuns = 5;
      for (let i = 0; i < baselineRuns; i++) {
        const chart = createRealisticMockChart();

        await PerformanceBenchmark.measure('baseline-registration', () => {
          return new Promise<void>(resolve => {
            act(() => {
              result.current.registerChart(`baseline-${i}`, chart, {});
              resolve();
            });
          });
        });
      }

      const baselineStats = PerformanceBenchmark.getStats('baseline-registration');

      // Simulated regression (slower operations)
      const slowMockChart = () =>
        ({
          ...createRealisticMockChart(),
          // Simulate slower operations
          addSeries: vi.fn().mockImplementation(() => {
            const start = performance.now();
            while (performance.now() - start < 10) {
              /* slow operation */
            }
            return { setData: vi.fn(), update: vi.fn() };
          }),
        }) as unknown as IChartApi;

      // Test with regression
      for (let i = 0; i < baselineRuns; i++) {
        const chart = slowMockChart();

        await PerformanceBenchmark.measure('regression-registration', () => {
          return new Promise<void>(resolve => {
            act(() => {
              result.current.registerChart(`regression-${i}`, chart, {});
              resolve();
            });
          });
        });
      }

      const regressionStats = PerformanceBenchmark.getStats('regression-registration');

      console.log('Baseline vs Regression:', {
        baseline: baselineStats,
        regression: regressionStats,
        degradation: `${((regressionStats.avg / baselineStats.avg - 1) * 100).toFixed(1)}%`,
      });

      // This test demonstrates how to detect regressions
      // In a real CI environment, you'd compare against historical data
      expect(regressionStats.avg).toBeGreaterThan(baselineStats.avg);
    });
  });

  afterAll(() => {
    // Print comprehensive performance report
    const allStats = PerformanceBenchmark.getAll();
    console.log('\n=== PERFORMANCE BENCHMARK REPORT ===');

    Object.entries(allStats).forEach(([name, stats]) => {
      console.log(`\n${name}:`);
      console.log(`  Average: ${stats.avg.toFixed(2)}ms`);
      console.log(`  Min: ${stats.min.toFixed(2)}ms`);
      console.log(`  Max: ${stats.max.toFixed(2)}ms`);
      console.log(`  P95: ${stats.p95.toFixed(2)}ms`);
      console.log(`  Runs: ${stats.count}`);
    });

    console.log('\n=== END REPORT ===\n');
  });
});
