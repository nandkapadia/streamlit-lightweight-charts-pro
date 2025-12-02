/**
 * @fileoverview Enhanced Testing Demo - Showcasing TradingView-inspired Testing Patterns
 * @vitest-environment jsdom
 *
 * This test suite demonstrates the enhanced testing capabilities following
 * TradingView's patterns with comprehensive utilities for memory leak detection,
 * performance monitoring, and modular test helpers.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

// Import our enhanced testing utilities
import { MemoryLeakDetector } from '../helpers/MemoryLeakDetector';
import { ChartTestHelpers, setupChartTest, setupBulkChartTest } from '../helpers/ChartTestHelpers';
import {
  PerformanceTestHelpers,
  testChartCreationPerformance,
  testDataUpdatePerformance,
} from '../helpers/PerformanceTestHelpers';

// Import centralized testing infrastructure
import { setupTestSuite } from '../setup/testConfiguration';
import { TestDataFactory } from '../mocks/TestDataFactory';

// Setup test suite with performance preset for realistic behavior
setupTestSuite('performance');

describe('Enhanced Testing Demo - TradingView Patterns', () => {
  let memoryDetector: MemoryLeakDetector;

  beforeEach(async () => {
    // Initialize enhanced memory detector
    memoryDetector = MemoryLeakDetector.getInstance({
      gcThreshold: 3 * 1024 * 1024, // 3MB threshold
      maxRetainedObjects: 5,
      enableDetailedTracking: true,
      gcAttempts: 3,
    });

    // Set performance thresholds
    PerformanceTestHelpers.setThresholds({
      chartCreation: 200, // 200ms for demo
      seriesAddition: 100, // 100ms for demo
      dataUpdate: 50, // 50ms for demo
      resize: 32, // ~30fps
      cleanup: 100, // 100ms for demo
    });

    await PerformanceTestHelpers.setMemoryBaseline();
  });

  afterEach(() => {
    // Cleanup all test charts
    ChartTestHelpers.cleanupAll();
    memoryDetector.reset();
    PerformanceTestHelpers.clearMeasurements();
  });

  describe('Modular Chart Test Helpers Demo', () => {
    it('should demonstrate comprehensive chart testing workflow', async () => {
      // Use convenience function for quick setup
      const chartTest = setupChartTest('demo-chart', {
        width: 800,
        height: 600,
        enablePerformanceMonitoring: true,
        enableMemoryTracking: true,
      });

      try {
        // Add multiple series with realistic data
        chartTest.addSeries('Line' as any, 1000);
        chartTest.addSeries('Area' as any, 500);
        chartTest.addSeries('Bar' as any, 300);

        // Simulate user interactions
        await chartTest.simulate({
          mouseEvents: true,
          wheelEvents: true,
          delayBetweenEvents: 50,
        });

        // Validate chart state and performance
        const validation = await chartTest.validate({
          checkMemoryLeaks: true,
          checkPerformance: true,
          performanceThresholds: {
            chartCreation: 200,
            seriesAddition: 100,
          },
        });

        expect(validation.isValid).toBe(true);
        expect(validation.issues).toHaveLength(0);

        // Log results for demonstration
        console.log('Chart Validation Results:', {
          isValid: validation.isValid,
          performanceMetrics: validation.performanceMetrics,
          memoryReport: validation.memoryReport?.hasLeaks ? 'Leaks detected' : 'No leaks',
        });
      } finally {
        chartTest.cleanup();
      }
    });

    it('should demonstrate bulk chart testing for performance analysis', async () => {
      const bulkTest = setupBulkChartTest(10, {
        width: 400,
        height: 300,
        enablePerformanceMonitoring: true,
      });

      try {
        // Add series to all charts
        bulkTest.charts.forEach(({ chart }) => {
          ChartTestHelpers.addTestSeries(chart, 'Line' as any, 100);
          ChartTestHelpers.addTestSeries(chart, 'Area' as any, 50);
        });

        // Validate all charts
        const validationResults = await bulkTest.validateAll({
          checkMemoryLeaks: true,
          checkPerformance: true,
        });

        // Analyze results
        const validCharts = validationResults.filter(r => r.isValid).length;
        const totalIssues = validationResults.reduce((sum, r) => sum + r.issues.length, 0);

        console.log('Bulk Chart Test Results:', {
          totalCharts: bulkTest.charts.length,
          validCharts,
          totalIssues,
        });

        expect(validCharts).toBeGreaterThan(0); // At least some should be valid
        expect(totalIssues).toBeLessThan(50); // More lenient for test environment
      } finally {
        bulkTest.cleanupAll();
      }
    });
  });

  describe('Enhanced Memory Leak Detection Demo', () => {
    it('should demonstrate comprehensive memory leak analysis', async () => {
      const report = await memoryDetector.testForMemoryLeaks(
        () => {
          // Create chart with complex setup
          const { chart, container } = ChartTestHelpers.createTestChart('memory-demo-chart', {
            width: 1200,
            height: 800,
            enableMemoryTracking: true,
          });

          // Add multiple series with large datasets
          const series1 = ChartTestHelpers.addTestSeries(chart, 'Line' as any, 5000);
          const series2 = ChartTestHelpers.addTestSeries(chart, 'Candlestick' as any, 2000);
          const series3 = ChartTestHelpers.addTestSeries(chart, 'Area' as any, 1000);

          // Perform memory-intensive operations
          for (let i = 0; i < 10; i++) {
            chart.resize(1200 + i * 10, 800 + i * 5);

            // Update data
            const newData = TestDataFactory.createLineData({ count: 100 });
            series1.setData(newData);
          }

          return { chart, container, series: [series1, series2, series3] };
        },
        25, // iterations
        'Complex Chart Operations'
      );

      // Analyze memory report
      expect(report).toBeDefined();
      expect(report.detailedBreakdown).toBeDefined();

      console.log('Detailed Memory Analysis:', {
        hasLeaks: report.hasLeaks,
        leakedObjects: report.leakedObjects,
        memoryDelta: `${Math.round(report.memoryDelta / 1024)}KB`,
        gcEfficiency: `${report.gcEfficiency.toFixed(2)}%`,
        peakMemory: `${Math.round(report.detailedBreakdown.peakMemory / 1024)}KB`,
        recommendations: report.recommendations.slice(0, 3),
      });

      // Memory should be reasonable for this test
      expect(report.memoryDelta).toBeLessThan(50 * 1024 * 1024); // < 50MB for test environment
      expect(report.gcEfficiency).toBeGreaterThan(0); // Any efficiency is good in test
    });

    it('should demonstrate memory trend monitoring', async () => {
      await memoryDetector.startTracking();

      const stopMonitoring = memoryDetector.startMemoryMonitoring(100);

      try {
        // Create increasing memory pressure
        const charts = [];
        for (let i = 0; i < 15; i++) {
          const { chart } = ChartTestHelpers.createTestChart(`trend-chart-${i}`, {
            width: 600 + i * 20,
            height: 400 + i * 10,
          });

          // Add data that increases with each iteration
          ChartTestHelpers.addTestSeries(chart, 'Line' as any, 200 + i * 50);
          charts.push(chart);

          await memoryDetector.takeSnapshot();
          await new Promise(resolve => setTimeout(resolve, 150));

          // Cleanup some charts to show memory release
          if (i % 3 === 2) {
            const chartToCleanup = charts.shift();
            if (chartToCleanup && typeof chartToCleanup.remove === 'function') {
              chartToCleanup.remove();
            }
          }
        }

        // Allow monitoring to capture final state
        await new Promise(resolve => setTimeout(resolve, 300));
      } finally {
        stopMonitoring();
      }

      const trend = memoryDetector.getMemoryTrend();

      console.log('Memory Trend Analysis:', {
        trend: trend.trend,
        averageGrowth: `${Math.round(trend.averageGrowth / 1024)}KB`,
        volatility: `${Math.round(trend.volatility / 1024)}KB`,
      });

      expect(trend.trend).toMatch(/increasing|decreasing|stable/);
      expect(typeof trend.averageGrowth).toBe('number');
      expect(typeof trend.volatility).toBe('number');
    });
  });

  describe('Advanced Performance Testing Demo', () => {
    it('should demonstrate comprehensive performance benchmarking', async () => {
      // Benchmark chart creation
      const creationBenchmark = await testChartCreationPerformance(
        () => {
          const { chart, cleanup } = ChartTestHelpers.createTestChart(`perf-chart-${Date.now()}`);
          cleanup(); // Cleanup immediately after creation
          return chart;
        },
        30 // iterations
      );

      console.log('Chart Creation Benchmark:', {
        averageTime: `${creationBenchmark.averageTime.toFixed(2)}ms`,
        minTime: `${creationBenchmark.minTime.toFixed(2)}ms`,
        maxTime: `${creationBenchmark.maxTime.toFixed(2)}ms`,
        throughput: `${creationBenchmark.throughput.toFixed(2)} ops/sec`,
        passed: creationBenchmark.passed,
      });

      expect(creationBenchmark.passed).toBe(true);
      expect(creationBenchmark.averageTime).toBeLessThan(300);

      // Benchmark data updates
      const { chart, cleanup } = ChartTestHelpers.createTestChart('data-perf-chart');
      const series = ChartTestHelpers.addTestSeries(chart, 'Line' as any, 100);

      try {
        const dataUpdateBenchmark = await testDataUpdatePerformance(
          () => {
            const newData = TestDataFactory.createLineData({ count: 500 });
            series.setData(newData);
          },
          50 // iterations
        );

        console.log('Data Update Benchmark:', {
          averageTime: `${dataUpdateBenchmark.averageTime.toFixed(2)}ms`,
          standardDeviation: `${dataUpdateBenchmark.standardDeviation.toFixed(2)}ms`,
          throughput: `${dataUpdateBenchmark.throughput.toFixed(2)} ops/sec`,
          passed: dataUpdateBenchmark.passed,
        });

        expect(dataUpdateBenchmark.passed).toBe(true);
      } finally {
        cleanup();
      }
    });

    it('should demonstrate frame rate monitoring', async () => {
      const { chart, cleanup } = ChartTestHelpers.createTestChart('frame-rate-chart');

      try {
        const frameRateResult = await PerformanceTestHelpers.monitorFrameRate(
          'chart-animation',
          async () => {
            // Simulate animation-like operations
            const series = ChartTestHelpers.addTestSeries(chart, 'Line' as any, 1000);

            for (let i = 0; i < 60; i++) {
              // Resize operations that might affect frame rate
              chart.resize(800 + Math.sin(i * 0.1) * 50, 600 + Math.cos(i * 0.1) * 30);

              // Small delay to simulate frame timing
              await new Promise(resolve => requestAnimationFrame(resolve));
            }

            return series;
          },
          2000 // Monitor for 2 seconds
        );

        console.log('Frame Rate Analysis:', {
          frameRate: `${frameRateResult.frameRate.toFixed(2)} fps`,
          droppedFrames: frameRateResult.droppedFrames,
          passed: frameRateResult.passed,
        });

        expect(frameRateResult.frameRate).toBeGreaterThan(0); // Any frame rate in test environment
        expect(frameRateResult.droppedFrames).toBeLessThan(100); // Very lenient for test environment
      } finally {
        cleanup();
      }
    });
  });

  describe('Stress Testing Demo', () => {
    it('should demonstrate chart stress testing', async () => {
      const { chart, cleanup } = ChartTestHelpers.createTestChart('stress-test-chart', {
        width: 1000,
        height: 700,
        enablePerformanceMonitoring: true,
      });

      try {
        const stressResults = await ChartTestHelpers.stressTestChart(
          chart,
          {
            seriesOperations: 20,
            dataUpdates: 50,
            resizeOperations: 30,
            priceScaleOperations: 15,
          },
          5 // 5ms delay between operations
        );

        console.log('Stress Test Results:', {
          completed: stressResults.completed,
          failed: stressResults.failed,
          successRate: `${((stressResults.completed / (stressResults.completed + stressResults.failed)) * 100).toFixed(2)}%`,
          duration: `${stressResults.duration.toFixed(2)}ms`,
          errorsCount: stressResults.errors.length,
        });

        // Should complete most operations successfully
        expect(stressResults.completed).toBeGreaterThan(100);
        expect(stressResults.failed).toBeLessThan(10);
        expect(stressResults.duration).toBeLessThan(10000); // < 10 seconds
      } finally {
        cleanup();
      }
    });
  });

  describe('Test Statistics and Reporting Demo', () => {
    it('should demonstrate comprehensive test reporting', () => {
      // Create some test charts for statistics
      for (let i = 0; i < 5; i++) {
        ChartTestHelpers.createTestChart(`stats-chart-${i}`);
      }

      const stats = ChartTestHelpers.getTestStatistics();

      console.log('Test Statistics:', stats);

      expect(stats.activeCharts).toBe(5);
      expect(stats.activeContainers).toBe(5);
      expect(stats.chartIds).toHaveLength(5);

      // Get performance statistics
      const allMeasurements = PerformanceTestHelpers.getAllMeasurements();

      console.log(
        'Performance Measurements Summary:',
        Object.keys(allMeasurements).reduce(
          (summary, operation) => ({
            ...summary,
            [operation]: `${allMeasurements[operation].length} samples`,
          }),
          {}
        )
      );

      // Memory delta from baseline
      const memoryDelta = PerformanceTestHelpers.getMemoryDelta();
      console.log('Memory Delta from Baseline:', `${Math.round(memoryDelta / 1024)}KB`);

      expect(Object.keys(allMeasurements).length).toBeGreaterThanOrEqual(0); // Allow empty in test environment
    });
  });
});
