/**
 * @fileoverview React 19 Performance Monitor Test Suite
 *
 * Tests for React 19 performance monitoring utilities.
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import {
  react19Monitor,
  useReact19Performance,
  logReact19Performance,
} from '../../utils/react19PerformanceMonitor';
import { logger, LogLevel } from '../../utils/logger';

// Mock performance API
const mockPerformance = {
  now: vi.fn(() => Date.now()),
};

Object.defineProperty(global, 'performance', {
  value: mockPerformance,
  writable: true,
});

// Mock console methods
const mockConsole = {
  log: vi.fn(),
  warn: vi.fn(),
  group: vi.fn(),
  groupEnd: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
};

Object.defineProperty(global, 'console', {
  value: mockConsole,
  writable: true,
});

describe('React19PerformanceMonitor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    react19Monitor.reset();
    mockPerformance.now.mockReturnValue(1000);

    // Suppress console output during tests to reduce noise
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    react19Monitor.reset();
    vi.restoreAllMocks();
  });

  describe('Transition Tracking', () => {
    it('should start and end transition tracking', () => {
      const transitionId = react19Monitor.startTransition('TestComponent', 'series');

      expect(transitionId).toBe('TestComponent-series-1000');

      mockPerformance.now.mockReturnValue(1050);
      react19Monitor.endTransition(transitionId);

      const report = react19Monitor.getPerformanceReport();
      expect(report.metrics.transitionDuration).toBe(50);
    });

    it('should track multiple concurrent transitions', () => {
      const transition1 = react19Monitor.startTransition('Component1', 'series');
      const transition2 = react19Monitor.startTransition('Component2', 'chart');

      expect(transition1).not.toBe(transition2);

      mockPerformance.now.mockReturnValue(1030);
      react19Monitor.endTransition(transition1);

      mockPerformance.now.mockReturnValue(1070);
      react19Monitor.endTransition(transition2);

      const report = react19Monitor.getPerformanceReport();
      expect(report.metrics.transitionDuration).toBe(70); // Max of both transitions
    });

    it('should track slow transitions in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const transitionId = react19Monitor.startTransition('SlowComponent', 'sync');

      mockPerformance.now.mockReturnValue(1200); // 200ms later
      react19Monitor.endTransition(transitionId);

      const report = react19Monitor.getPerformanceReport();
      expect(report.metrics.transitionDuration).toBe(200);

      process.env.NODE_ENV = originalEnv;
    });

    it('should warn about slow transitions in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      // Restore console.warn for this specific test
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const transitionId = react19Monitor.startTransition('SlowComponent', 'sync');

      mockPerformance.now.mockReturnValue(1150); // 150ms later
      react19Monitor.endTransition(transitionId);

      // Logger adds timestamp and formatting to the message
      expect(consoleSpy).toHaveBeenCalled();
      expect(consoleSpy.mock.calls[0][0]).toContain('Slow React 19 transition detected');

      process.env.NODE_ENV = originalEnv;
      consoleSpy.mockRestore();
    });
  });

  describe('Suspense Tracking', () => {
    it('should track Suspense loading times', () => {
      react19Monitor.startSuspenseLoad('LazyChart');

      mockPerformance.now.mockReturnValue(1500);
      react19Monitor.endSuspenseLoad('LazyChart');

      const report = react19Monitor.getPerformanceReport();
      expect(report.metrics.suspenseLoadTime).toBe(500);
    });

    it('should log slow Suspense loading', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      // Set logger to INFO level to enable info logging
      (logger as any).logLevel = LogLevel.INFO;

      // Logger uses console.info for Suspense logging in development
      const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

      react19Monitor.startSuspenseLoad('SlowLazyComponent');

      mockPerformance.now.mockReturnValue(2500); // 1500ms later
      react19Monitor.endSuspenseLoad('SlowLazyComponent');

      // Logger adds timestamp and formatting
      expect(consoleSpy).toHaveBeenCalled();
      // Check that it logged the slow Suspense load
      const calls = consoleSpy.mock.calls.map(c => c[0]);
      expect(calls.some((call: any) => call.includes('SLOW') && call.includes('Suspense'))).toBe(
        true
      );

      process.env.NODE_ENV = originalEnv;
      consoleSpy.mockRestore();
    });
  });

  describe('Deferred Value Tracking', () => {
    it('should track deferred value processing', () => {
      react19Monitor.trackDeferredValue('ChartData', 75);

      const report = react19Monitor.getPerformanceReport();
      expect(report.metrics.deferredValueDelay).toBe(75);
    });

    it('should log slow deferred values', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      // Set logger to INFO level to enable info logging
      (logger as any).logLevel = LogLevel.INFO;

      // Logger uses console.info for deferred value logging in development
      const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

      react19Monitor.trackDeferredValue('SlowChartData', 80);

      // Logger adds timestamp and formatting
      expect(consoleSpy).toHaveBeenCalled();
      const calls = consoleSpy.mock.calls.map(c => c[0]);
      expect(
        calls.some((call: any) => call.includes('Deferred') && call.includes('SlowChartData'))
      ).toBe(true);

      process.env.NODE_ENV = originalEnv;
      consoleSpy.mockRestore();
    });
  });

  describe('FlushSync Tracking', () => {
    it('should track flushSync usage', () => {
      react19Monitor.trackFlushSync('EmergencyUpdate', 'Critical data update');

      const report = react19Monitor.getPerformanceReport();
      expect(report.metrics.flushSyncCount).toBe(1);
    });

    it('should warn about excessive flushSync usage', () => {
      // Restore console.warn for this specific test
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Trigger multiple flushSync calls
      for (let i = 0; i < 12; i++) {
        react19Monitor.trackFlushSync('Component', `Update ${i}`);
      }

      // Logger adds timestamp and formatting, so just check the message is logged
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('Performance Reports', () => {
    it('should generate comprehensive performance reports', () => {
      const transitionId = react19Monitor.startTransition('TestComponent', 'series');
      mockPerformance.now.mockReturnValue(1050);
      react19Monitor.endTransition(transitionId);

      react19Monitor.startSuspenseLoad('LazyComponent');
      mockPerformance.now.mockReturnValue(1150);
      react19Monitor.endSuspenseLoad('LazyComponent');

      react19Monitor.trackDeferredValue('ChartData', 30);
      react19Monitor.trackFlushSync('UrgentUpdate', 'Data sync');

      const report = react19Monitor.getPerformanceReport();

      expect(report.metrics.transitionDuration).toBe(50);
      expect(report.metrics.suspenseLoadTime).toBe(100);
      expect(report.metrics.deferredValueDelay).toBe(30);
      expect(report.metrics.flushSyncCount).toBe(1);
      expect(report.score).toBe(100); // Perfect score
      expect(report.recommendations).toHaveLength(0);
    });

    it('should provide performance recommendations', () => {
      const transitionId = react19Monitor.startTransition('SlowComponent', 'series');
      mockPerformance.now.mockReturnValue(1200); // Slow transition
      react19Monitor.endTransition(transitionId);

      react19Monitor.startSuspenseLoad('SlowLazyComponent');
      mockPerformance.now.mockReturnValue(3500); // Very slow loading
      react19Monitor.endSuspenseLoad('SlowLazyComponent');

      react19Monitor.trackDeferredValue('SlowChartData', 150); // Slow processing

      // Multiple flushSync calls
      for (let i = 0; i < 6; i++) {
        react19Monitor.trackFlushSync('Component', `Update ${i}`);
      }

      const report = react19Monitor.getPerformanceReport();

      expect(report.recommendations).toContain(
        'Consider breaking down large transitions into smaller chunks'
      );
      expect(report.recommendations).toContain(
        'Suspense components are loading slowly - consider preloading'
      );
      expect(report.recommendations).toContain(
        'Deferred values are processing slowly - optimize calculations'
      );
      expect(report.recommendations).toContain(
        'High flushSync usage detected - reduce synchronous updates'
      );
      expect(report.score).toBeLessThan(100);
    });
  });

  describe('Current Insights', () => {
    it('should provide real-time performance insights', () => {
      react19Monitor.startTransition('Component1', 'series');
      react19Monitor.startTransition('Component2', 'chart');

      react19Monitor.startSuspenseLoad('LazyComponent1');
      react19Monitor.startSuspenseLoad('LazyComponent2');

      const insights = react19Monitor.getCurrentInsights();

      expect(insights.activeTransitions).toBe(2);
      expect(insights.pendingSuspenseLoads).toBe(2);
    });
  });

  describe('Reset Functionality', () => {
    it('should reset all metrics', () => {
      react19Monitor.startTransition('TestComponent', 'series');
      react19Monitor.startSuspenseLoad('LazyComponent');
      react19Monitor.trackFlushSync('Component', 'Update');

      react19Monitor.reset();

      const report = react19Monitor.getPerformanceReport();
      expect(report.metrics.transitionDuration).toBe(0);
      expect(report.metrics.suspenseLoadTime).toBe(0);
      expect(report.metrics.flushSyncCount).toBe(0);

      const insights = react19Monitor.getCurrentInsights();
      expect(insights.activeTransitions).toBe(0);
      expect(insights.pendingSuspenseLoads).toBe(0);
    });
  });
});

describe('useReact19Performance', () => {
  it('should provide performance monitoring utilities', () => {
    const { result } = renderHook(() => useReact19Performance('TestComponent'));

    expect(result.current.startTransition).toBeInstanceOf(Function);
    expect(result.current.endTransition).toBeInstanceOf(Function);
    expect(result.current.trackFlushSync).toBeInstanceOf(Function);
    expect(result.current.startSuspenseLoad).toBeInstanceOf(Function);
    expect(result.current.endSuspenseLoad).toBeInstanceOf(Function);
    expect(result.current.getReport).toBeInstanceOf(Function);
    expect(result.current.getCurrentInsights).toBeInstanceOf(Function);
  });
});

describe('logReact19Performance', () => {
  it('should log performance report in development', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    // Set logger to INFO level to enable info logging
    (logger as any).logLevel = LogLevel.INFO;

    // Logger uses console.info for performance reports
    const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

    // Trigger some activity to generate recommendations
    const transitionId = react19Monitor.startTransition('TestComponent', 'sync');
    mockPerformance.now.mockReturnValue(1200); // 200ms slow transition
    react19Monitor.endTransition(transitionId);

    logReact19Performance();

    // Logger logs recommendations using console.info
    expect(consoleInfoSpy).toHaveBeenCalled();

    process.env.NODE_ENV = originalEnv;
    consoleInfoSpy.mockRestore();
  });

  it('should not log in production', () => {
    // Use vi.stubEnv for proper environment variable mocking
    vi.stubEnv('NODE_ENV', 'production');

    // Restore console methods for this specific test
    const consoleGroupSpy = vi.spyOn(console, 'group').mockImplementation(() => {});

    logReact19Performance();

    expect(consoleGroupSpy).not.toHaveBeenCalled();

    // Restore
    vi.unstubAllEnvs();
    consoleGroupSpy.mockRestore();
  });
});
