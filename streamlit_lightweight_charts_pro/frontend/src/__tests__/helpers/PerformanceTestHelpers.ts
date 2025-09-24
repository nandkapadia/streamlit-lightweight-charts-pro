/**
 * @fileoverview Performance Testing Helper Utilities
 *
 * Following TradingView's performance testing patterns, this module provides
 * comprehensive performance monitoring, benchmarking, and regression detection
 * for chart operations with configurable thresholds and detailed reporting.
 */

export interface PerformanceThresholds {
  chartCreation: number; // milliseconds
  seriesAddition: number; // milliseconds
  dataUpdate: number; // milliseconds
  resize: number; // milliseconds
  cleanup: number; // milliseconds
  memoryUsage: number; // bytes
  frameRate: number; // fps
}

export interface PerformanceReport {
  operation: string;
  duration: number;
  memoryDelta: number;
  passed: boolean;
  threshold: number;
  recommendations: string[];
  detailed: {
    startTime: number;
    endTime: number;
    startMemory: number;
    endMemory: number;
    samples: number[];
  };
}

export interface BenchmarkResult {
  operation: string;
  iterations: number;
  totalTime: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
  standardDeviation: number;
  throughput: number; // operations per second
  passed: boolean;
}

const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  chartCreation: 100, // 100ms
  seriesAddition: 50, // 50ms
  dataUpdate: 25, // 25ms
  resize: 16, // 16ms (60fps)
  cleanup: 50, // 50ms
  memoryUsage: 5 * 1024 * 1024, // 5MB
  frameRate: 30, // 30fps minimum
};

/**
 * Performance Test Helper - Comprehensive performance monitoring utilities
 */
export class PerformanceTestHelpers {
  private static thresholds: PerformanceThresholds = { ...DEFAULT_THRESHOLDS };
  private static measurements: Map<string, number[]> = new Map();
  private static memoryBaseline: number = 0;

  /**
   * Configure performance thresholds
   */
  static setThresholds(thresholds: Partial<PerformanceThresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds };
  }

  /**
   * Measure performance of a synchronous operation
   */
  static measureSync<T>(
    operation: string,
    fn: () => T,
    expectedThreshold?: number
  ): PerformanceReport {
    const threshold = expectedThreshold ?? this.getThreshold(operation);
    const startMemory = this.getCurrentMemoryUsage();
    const startTime = performance.now();

    fn();

    const endTime = performance.now();
    const endMemory = this.getCurrentMemoryUsage();
    const duration = endTime - startTime;
    const memoryDelta = endMemory - startMemory;

    this.recordMeasurement(operation, duration);

    return {
      operation,
      duration,
      memoryDelta,
      passed: duration <= threshold,
      threshold,
      recommendations: this.generateRecommendations(operation, duration, threshold, memoryDelta),
      detailed: {
        startTime,
        endTime,
        startMemory,
        endMemory,
        samples: [duration],
      },
    };
  }

  /**
   * Measure performance of an asynchronous operation
   */
  static async measureAsync<T>(
    operation: string,
    fn: () => Promise<T>,
    expectedThreshold?: number
  ): Promise<PerformanceReport> {
    const threshold = expectedThreshold ?? this.getThreshold(operation);
    const startMemory = this.getCurrentMemoryUsage();
    const startTime = performance.now();

    await fn();

    const endTime = performance.now();
    const endMemory = this.getCurrentMemoryUsage();
    const duration = endTime - startTime;
    const memoryDelta = endMemory - startMemory;

    this.recordMeasurement(operation, duration);

    return {
      operation,
      duration,
      memoryDelta,
      passed: duration <= threshold,
      threshold,
      recommendations: this.generateRecommendations(operation, duration, threshold, memoryDelta),
      detailed: {
        startTime,
        endTime,
        startMemory,
        endMemory,
        samples: [duration],
      },
    };
  }

  /**
   * Run benchmark with multiple iterations
   */
  static async benchmark<T>(
    operation: string,
    fn: () => T | Promise<T>,
    iterations: number = 100,
    warmupIterations: number = 10
  ): Promise<BenchmarkResult> {
    const samples: number[] = [];

    // Warmup
    for (let i = 0; i < warmupIterations; i++) {
      await fn();
    }

    // Force garbage collection before benchmark
    if (global.gc) {
      global.gc();
    }

    const overallStartTime = performance.now();

    // Run benchmark
    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();
      await fn();
      const endTime = performance.now();
      samples.push(endTime - startTime);
    }

    const overallEndTime = performance.now();
    const totalTime = overallEndTime - overallStartTime;

    // Calculate statistics
    const averageTime = samples.reduce((sum, time) => sum + time, 0) / samples.length;
    const minTime = Math.min(...samples);
    const maxTime = Math.max(...samples);

    const variance =
      samples.reduce((sum, time) => sum + Math.pow(time - averageTime, 2), 0) / samples.length;
    const standardDeviation = Math.sqrt(variance);

    const throughput = 1000 / averageTime; // operations per second
    const threshold = this.getThreshold(operation);
    const passed = averageTime <= threshold;

    this.recordMeasurement(operation, ...samples);

    return {
      operation,
      iterations,
      totalTime,
      averageTime,
      minTime,
      maxTime,
      standardDeviation,
      throughput,
      passed,
    };
  }

  /**
   * Monitor frame rate during operation
   */
  static async monitorFrameRate<T>(
    operation: string,
    fn: () => T | Promise<T>,
    duration: number = 1000
  ): Promise<{
    result: T;
    frameRate: number;
    droppedFrames: number;
    passed: boolean;
  }> {
    const frames: number[] = [];
    let lastFrameTime = performance.now();
    let animationId: number | undefined;

    const frameCallback = () => {
      const now = performance.now();
      frames.push(now - lastFrameTime);
      lastFrameTime = now;
    };

    // Start monitoring - use global requestAnimationFrame with fallback
    const startMonitoring = () => {
      const raf =
        (typeof global !== 'undefined' && global.requestAnimationFrame) ||
        (typeof window !== 'undefined' && window.requestAnimationFrame);
      if (raf) {
        animationId = raf(() => {
          frameCallback();
          startMonitoring();
        });
      } else {
        // Fallback for test environment without RAF
        animationId = setTimeout(() => {
          frameCallback();
          startMonitoring();
        }, 16) as any; // ~60fps
      }
    };

    startMonitoring();

    // Execute operation
    const result = await fn();

    // Stop monitoring after duration
    await new Promise(resolve => setTimeout(resolve, duration));

    // Cancel animation frame with fallback
    const caf =
      (typeof global !== 'undefined' && global.cancelAnimationFrame) ||
      (typeof window !== 'undefined' && window.cancelAnimationFrame);
    if (caf && animationId) {
      caf(animationId);
    } else if (typeof animationId === 'number') {
      clearTimeout(animationId);
    }

    // Calculate frame rate
    const totalFrames = frames.length;
    const actualDuration = frames.reduce((sum, time) => sum + time, 0);
    const frameRate = totalFrames > 0 ? (1000 * totalFrames) / actualDuration : 0;

    const targetFrameTime = 1000 / 60; // 60fps
    const droppedFrames = frames.filter(time => time > targetFrameTime * 1.5).length;

    const passed = frameRate >= this.thresholds.frameRate;

    return {
      result,
      frameRate,
      droppedFrames,
      passed,
    };
  }

  /**
   * Run performance regression test
   */
  static async regressionTest(
    operation: string,
    currentFn: () => any,
    baselineFn: () => any,
    iterations: number = 50,
    regressionThreshold: number = 1.2 // 20% regression threshold
  ): Promise<{
    currentPerformance: BenchmarkResult;
    baselinePerformance: BenchmarkResult;
    regression: number; // ratio (1.0 = no change, >1.0 = slower, <1.0 = faster)
    passed: boolean;
  }> {
    const [currentResult, baselineResult] = await Promise.all([
      this.benchmark(`${operation}-current`, currentFn, iterations),
      this.benchmark(`${operation}-baseline`, baselineFn, iterations),
    ]);

    const regression = currentResult.averageTime / baselineResult.averageTime;
    const passed = regression <= regressionThreshold;

    return {
      currentPerformance: currentResult,
      baselinePerformance: baselineResult,
      regression,
      passed,
    };
  }

  /**
   * Memory usage profiling during operation
   */
  static async profileMemory<T>(
    operation: string,
    fn: () => T | Promise<T>,
    samplingInterval: number = 100
  ): Promise<{
    result: T;
    memoryProfile: {
      samples: Array<{ time: number; memory: number }>;
      peak: number;
      average: number;
      final: number;
      leaked: number;
    };
    passed: boolean;
  }> {
    const samples: Array<{ time: number; memory: number }> = [];
    const startTime = performance.now();
    const startMemory = this.getCurrentMemoryUsage();

    // Start memory sampling
    const samplingInterval_id = setInterval(() => {
      samples.push({
        time: performance.now() - startTime,
        memory: this.getCurrentMemoryUsage(),
      });
    }, samplingInterval);

    try {
      const result = await fn();

      // Stop sampling
      clearInterval(samplingInterval_id);

      // Force garbage collection and take final measurement
      if (global.gc) {
        global.gc();
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const finalMemory = this.getCurrentMemoryUsage();

      // Calculate memory statistics
      const memoryValues = samples.map(s => s.memory);
      const peak = Math.max(...memoryValues, finalMemory);
      const average = memoryValues.reduce((sum, mem) => sum + mem, 0) / memoryValues.length;
      const leaked = Math.max(0, finalMemory - startMemory);

      const passed = leaked <= this.thresholds.memoryUsage;

      return {
        result,
        memoryProfile: {
          samples,
          peak,
          average,
          final: finalMemory,
          leaked,
        },
        passed,
      };
    } finally {
      clearInterval(samplingInterval_id);
    }
  }

  /**
   * Get performance statistics for an operation
   */
  static getPerformanceStats(operation: string): {
    operation: string;
    sampleCount: number;
    averageTime: number;
    minTime: number;
    maxTime: number;
    standardDeviation: number;
    trend: 'improving' | 'degrading' | 'stable';
  } | null {
    const measurements = this.measurements.get(operation);
    if (!measurements || measurements.length === 0) {
      return null;
    }

    const averageTime = measurements.reduce((sum, time) => sum + time, 0) / measurements.length;
    const minTime = Math.min(...measurements);
    const maxTime = Math.max(...measurements);

    const variance =
      measurements.reduce((sum, time) => sum + Math.pow(time - averageTime, 2), 0) /
      measurements.length;
    const standardDeviation = Math.sqrt(variance);

    // Calculate trend (last 25% vs first 25% of measurements)
    const quarterLength = Math.floor(measurements.length / 4);
    const firstQuarter = measurements.slice(0, quarterLength);
    const lastQuarter = measurements.slice(-quarterLength);

    if (firstQuarter.length === 0 || lastQuarter.length === 0) {
      return {
        operation,
        sampleCount: measurements.length,
        averageTime,
        minTime,
        maxTime,
        standardDeviation,
        trend: 'stable',
      };
    }

    const firstAvg = firstQuarter.reduce((sum, time) => sum + time, 0) / firstQuarter.length;
    const lastAvg = lastQuarter.reduce((sum, time) => sum + time, 0) / lastQuarter.length;

    let trend: 'improving' | 'degrading' | 'stable' = 'stable';
    const changeRatio = lastAvg / firstAvg;

    if (changeRatio > 1.1) {
      trend = 'degrading';
    } else if (changeRatio < 0.9) {
      trend = 'improving';
    }

    return {
      operation,
      sampleCount: measurements.length,
      averageTime,
      minTime,
      maxTime,
      standardDeviation,
      trend,
    };
  }

  /**
   * Clear all performance measurements
   */
  static clearMeasurements(): void {
    this.measurements.clear();
  }

  /**
   * Get all recorded measurements
   */
  static getAllMeasurements(): Record<string, number[]> {
    return Object.fromEntries(this.measurements.entries());
  }

  /**
   * Set memory baseline
   */
  static async setMemoryBaseline(): Promise<void> {
    if (global.gc) {
      global.gc();
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    this.memoryBaseline = this.getCurrentMemoryUsage();
  }

  /**
   * Get memory usage relative to baseline
   */
  static getMemoryDelta(): number {
    return this.getCurrentMemoryUsage() - this.memoryBaseline;
  }

  // Private helper methods

  private static getThreshold(operation: string): number {
    const normalizedOp = operation.toLowerCase();

    if (normalizedOp.includes('chart') && normalizedOp.includes('create')) {
      return this.thresholds.chartCreation;
    }
    if (normalizedOp.includes('series') && normalizedOp.includes('add')) {
      return this.thresholds.seriesAddition;
    }
    if (
      normalizedOp.includes('data') &&
      (normalizedOp.includes('update') || normalizedOp.includes('set'))
    ) {
      return this.thresholds.dataUpdate;
    }
    if (normalizedOp.includes('resize')) {
      return this.thresholds.resize;
    }
    if (
      normalizedOp.includes('cleanup') ||
      normalizedOp.includes('destroy') ||
      normalizedOp.includes('remove')
    ) {
      return this.thresholds.cleanup;
    }

    // Default threshold
    return 100;
  }

  private static recordMeasurement(operation: string, ...durations: number[]): void {
    if (!this.measurements.has(operation)) {
      this.measurements.set(operation, []);
    }
    this.measurements.get(operation)!.push(...durations);
  }

  private static getCurrentMemoryUsage(): number {
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      return (performance as any).memory.usedJSHeapSize;
    }

    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed;
    }

    // Fallback for testing environments
    return Date.now() % 1000000;
  }

  private static generateRecommendations(
    operation: string,
    duration: number,
    threshold: number,
    memoryDelta: number
  ): string[] {
    const recommendations: string[] = [];

    if (duration > threshold) {
      const overagePercentage = Math.round(((duration - threshold) / threshold) * 100);
      recommendations.push(
        `${operation} took ${duration.toFixed(2)}ms, exceeding threshold by ${overagePercentage}%`
      );

      // Specific recommendations based on operation type
      if (operation.toLowerCase().includes('chart')) {
        recommendations.push('Consider reducing chart complexity or using progressive rendering');
      }
      if (operation.toLowerCase().includes('data')) {
        recommendations.push('Consider data pagination or virtual scrolling for large datasets');
      }
      if (operation.toLowerCase().includes('series')) {
        recommendations.push('Limit the number of concurrent series or use data aggregation');
      }
    }

    if (memoryDelta > 1024 * 1024) {
      // 1MB
      recommendations.push(
        `Operation used ${Math.round(memoryDelta / 1024)}KB of memory. Consider optimizing data structures.`
      );
    }

    if (recommendations.length === 0) {
      recommendations.push(`${operation} performance is within acceptable limits`);
    }

    return recommendations;
  }
}

/**
 * Convenience functions for common performance testing scenarios
 */

/**
 * Quick performance test wrapper
 */
export function performanceTest<T>(
  operation: string,
  fn: () => T | Promise<T>,
  threshold?: number
) {
  if (fn.constructor.name === 'AsyncFunction') {
    return PerformanceTestHelpers.measureAsync(operation, fn as () => Promise<T>, threshold);
  } else {
    return PerformanceTestHelpers.measureSync(operation, fn as () => T, threshold);
  }
}

/**
 * Chart creation performance test
 */
export async function testChartCreationPerformance(
  createChartFn: () => any,
  iterations: number = 50
): Promise<BenchmarkResult> {
  return PerformanceTestHelpers.benchmark('chart-creation', createChartFn, iterations);
}

/**
 * Data update performance test
 */
export async function testDataUpdatePerformance(
  updateDataFn: () => any,
  iterations: number = 100
): Promise<BenchmarkResult> {
  return PerformanceTestHelpers.benchmark('data-update', updateDataFn, iterations);
}

/**
 * Memory leak performance test
 */
export async function testMemoryPerformance<T>(
  operation: string,
  fn: () => T | Promise<T>
): Promise<{
  result: T;
  memoryProfile: any;
  passed: boolean;
}> {
  return PerformanceTestHelpers.profileMemory(operation, fn);
}
