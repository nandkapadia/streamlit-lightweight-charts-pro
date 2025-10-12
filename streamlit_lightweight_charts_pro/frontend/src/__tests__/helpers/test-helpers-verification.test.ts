/**
 * @fileoverview Test Helper Verification - Simple tests to verify our enhanced utilities work
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

// Import our enhanced testing utilities
import { MemoryLeakDetector } from './MemoryLeakDetector';
import { ChartTestHelpers } from './ChartTestHelpers';
import { PerformanceTestHelpers } from './PerformanceTestHelpers';

// Import centralized testing infrastructure
import { setupTestSuite } from '../setup/testConfiguration';

// Setup test suite with unit preset for fast execution
setupTestSuite('unit');

describe('Test Helper Verification', () => {
  afterEach(() => {
    // Cleanup all test charts
    ChartTestHelpers.cleanupAll();
  });

  describe('MemoryLeakDetector', () => {
    it('should create instance and track objects', async () => {
      const detector = MemoryLeakDetector.getInstance({
        gcThreshold: 1024 * 1024, // 1MB
        enableDetailedTracking: true,
      });

      expect(detector).toBeDefined();

      // Test object tracking
      const testObj = { test: 'data' };
      const trackedObj = detector.trackObject(testObj);

      expect(trackedObj).toBe(testObj);

      // Reset for cleanup
      detector.reset();
    });

    it('should perform basic memory leak testing', async () => {
      const detector = MemoryLeakDetector.getInstance();

      const report = await detector.testForMemoryLeaks(
        () => {
          const obj = { data: new Array(100).fill(Math.random()) };
          detector.trackObject(obj);
          return obj;
        },
        5, // small number of iterations
        'Simple Test'
      );

      expect(report).toBeDefined();
      expect(typeof report.hasLeaks).toBe('boolean');
      expect(typeof report.leakedObjects).toBe('number');
      expect(typeof report.memoryDelta).toBe('number');
      expect(Array.isArray(report.recommendations)).toBe(true);

      detector.reset();
    });
  });

  describe('ChartTestHelpers', () => {
    it('should create test chart successfully', () => {
      const { chart, container, cleanup } = ChartTestHelpers.createTestChart('test-chart');

      expect(chart).toBeDefined();
      expect(container).toBeDefined();
      expect(typeof cleanup).toBe('function');

      // Verify container properties
      expect(container.style.width).toBe('800px');
      expect(container.style.height).toBe('600px');

      cleanup();
    });

    it('should create multiple test charts', () => {
      const charts = ChartTestHelpers.createMultipleTestCharts(3, {
        width: 400,
        height: 300,
      });

      expect(charts).toHaveLength(3);

      charts.forEach(({ chart, container, cleanup }) => {
        expect(chart).toBeDefined();
        expect(container).toBeDefined();
        expect(typeof cleanup).toBe('function');
      });

      // Cleanup all
      charts.forEach(({ cleanup }) => cleanup());
    });

    it('should track test statistics', () => {
      // Create some test charts
      ChartTestHelpers.createTestChart('stats-1');
      ChartTestHelpers.createTestChart('stats-2');

      const stats = ChartTestHelpers.getTestStatistics();

      expect(stats.activeCharts).toBe(2);
      expect(stats.activeContainers).toBe(2);
      expect(stats.chartIds).toEqual(['stats-1', 'stats-2']);

      ChartTestHelpers.cleanupAll();

      const statsAfterCleanup = ChartTestHelpers.getTestStatistics();
      expect(statsAfterCleanup.activeCharts).toBe(0);
    });
  });

  describe('PerformanceTestHelpers', () => {
    beforeEach(async () => {
      await PerformanceTestHelpers.setMemoryBaseline();
    });

    afterEach(() => {
      PerformanceTestHelpers.clearMeasurements();
    });

    it('should measure synchronous operations', () => {
      const report = PerformanceTestHelpers.measureSync(
        'test-operation',
        () => {
          // Simulate some work
          let sum = 0;
          for (let i = 0; i < 1000; i++) {
            sum += i;
          }
          return sum;
        },
        100 // 100ms threshold
      );

      expect(report).toBeDefined();
      expect(typeof report.duration).toBe('number');
      expect(typeof report.passed).toBe('boolean');
      expect(Array.isArray(report.recommendations)).toBe(true);
    });

    it('should measure asynchronous operations', async () => {
      const report = await PerformanceTestHelpers.measureAsync(
        'async-operation',
        async () => {
          await new Promise(resolve => setTimeout(resolve, 10));
          return 'result';
        },
        50 // 50ms threshold
      );

      expect(report).toBeDefined();
      expect(report.duration).toBeGreaterThan(0); // Should be measurable
      expect(typeof report.passed).toBe('boolean');
    });

    it('should run benchmarks', async () => {
      const benchmark = await PerformanceTestHelpers.benchmark(
        'simple-benchmark',
        () => {
          return Math.random() * 100;
        },
        10, // iterations
        2 // warmup
      );

      expect(benchmark).toBeDefined();
      expect(benchmark.iterations).toBe(10);
      expect(typeof benchmark.averageTime).toBe('number');
      expect(typeof benchmark.throughput).toBe('number');
      expect(benchmark.averageTime).toBeGreaterThan(0);
    });

    it('should get performance statistics', () => {
      // Generate some measurements
      PerformanceTestHelpers.measureSync('test-op', () => Math.random());
      PerformanceTestHelpers.measureSync('test-op', () => Math.random());

      const stats = PerformanceTestHelpers.getPerformanceStats('test-op');

      expect(stats).toBeDefined();
      expect(stats!.operation).toBe('test-op');
      expect(stats!.sampleCount).toBe(2);
      expect(typeof stats!.averageTime).toBe('number');
    });
  });

  describe('Integration Test', () => {
    it('should work together - create chart and measure performance', async () => {
      const detector = MemoryLeakDetector.getInstance();

      const performanceReport = await PerformanceTestHelpers.measureAsync(
        'chart-creation-with-memory-tracking',
        async () => {
          const { chart, cleanup } = ChartTestHelpers.createTestChart('integration-test');

          // Track the chart for memory leaks
          detector.trackObject(chart);

          // Add some series
          ChartTestHelpers.addTestSeries(chart, 'Line' as any, 100);

          // Simulate some operations
          await new Promise(resolve => setTimeout(resolve, 5));

          cleanup();
          return chart;
        }
      );

      const memoryReport = await detector.detectLeaks();

      // Both reports should be successful
      expect(performanceReport.passed).toBe(true);
      expect(performanceReport.duration).toBeGreaterThan(0);

      expect(memoryReport).toBeDefined();
      expect(typeof memoryReport.hasLeaks).toBe('boolean');

      console.log('Integration Test Results:', {
        performancePassed: performanceReport.passed,
        performanceDuration: `${performanceReport.duration.toFixed(2)}ms`,
        memoryLeaks: memoryReport.hasLeaks,
        memoryDelta: `${Math.round(memoryReport.memoryDelta / 1024)}KB`,
      });

      detector.reset();
    });
  });
});
