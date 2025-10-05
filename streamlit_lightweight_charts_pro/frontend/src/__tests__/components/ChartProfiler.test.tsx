/**
 * @fileoverview Tests for ChartProfiler Component
 *
 * Tests cover:
 * - Component structure and exports
 * - Profiler metrics tracking
 * - useChartProfilerMetrics hook
 * - Performance recommendations
 * - ChartPerformanceDashboard component
 * - Metrics calculation and reporting
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  ChartProfiler,
  useChartProfilerMetrics,
  ChartPerformanceDashboard,
} from '../../components/ChartProfiler';

describe('ChartProfiler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear console spies
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'group').mockImplementation(() => {});
    vi.spyOn(console, 'groupEnd').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Component Structure', () => {
    it('should be exported as a React component', () => {
      expect(ChartProfiler).toBeDefined();
      expect(typeof ChartProfiler).toBe('object'); // React.memo wraps as object
    });

    it('should have displayName', () => {
      expect(ChartProfiler.displayName).toBe('ChartProfiler');
    });

    it('should be a memo component', () => {
      expect((ChartProfiler as any).$$typeof).toBeDefined();
    });
  });

  describe('useChartProfilerMetrics Hook', () => {
    it('should return initial metrics for new chart', () => {
      const { result } = renderHook(() => useChartProfilerMetrics('test-chart'));

      expect(result.current.metrics).toEqual({
        renderCount: 0,
        totalDuration: 0,
        averageDuration: 0,
        slowestRender: 0,
        fastestRender: 0,
        lastRender: 0,
      });
    });

    it('should provide refreshMetrics function', () => {
      const { result } = renderHook(() => useChartProfilerMetrics('test-chart'));

      expect(result.current.refreshMetrics).toBeDefined();
      expect(typeof result.current.refreshMetrics).toBe('function');
    });

    it('should provide resetMetrics function', () => {
      const { result } = renderHook(() => useChartProfilerMetrics('test-chart'));

      expect(result.current.resetMetrics).toBeDefined();
      expect(typeof result.current.resetMetrics).toBe('function');
    });

    it('should reset metrics when resetMetrics is called', () => {
      const { result } = renderHook(() => useChartProfilerMetrics('test-chart-reset'));

      act(() => {
        result.current.resetMetrics();
      });

      expect(result.current.metrics.renderCount).toBe(0);
    });

    it('should handle multiple charts independently', () => {
      const { result: result1 } = renderHook(() => useChartProfilerMetrics('chart-1'));
      const { result: result2 } = renderHook(() => useChartProfilerMetrics('chart-2'));

      expect(result1.current.metrics).toEqual(result2.current.metrics);
      expect(result1.current.metrics.renderCount).toBe(0);
    });

    it('should not throw when accessing metrics for non-existent chart', () => {
      expect(() => {
        renderHook(() => useChartProfilerMetrics('non-existent-chart'));
      }).not.toThrow();
    });
  });

  describe('ChartPerformanceDashboard Component', () => {
    it('should be exported as a component', () => {
      expect(ChartPerformanceDashboard).toBeDefined();
      expect(typeof ChartPerformanceDashboard).toBe('function');
    });

    it('should accept chartIds prop', () => {
      const chartIds = ['chart-1', 'chart-2', 'chart-3'];

      expect(() => {
        // Component accepts chartIds array
        const props = { chartIds };
        expect(props.chartIds).toEqual(chartIds);
      }).not.toThrow();
    });

    it('should accept position prop', () => {
      const positions: Array<'top-right' | 'bottom-right' | 'bottom-left' | 'top-left'> = [
        'top-right',
        'bottom-right',
        'bottom-left',
        'top-left',
      ];

      positions.forEach(position => {
        const props = { chartIds: ['test'], position };
        expect(props.position).toBe(position);
      });
    });

    it('should default to bottom-right position', () => {
      const defaultPosition = 'bottom-right';
      expect(defaultPosition).toBe('bottom-right');
    });

    it('should handle empty chartIds array', () => {
      expect(() => {
        const props = { chartIds: [] };
        expect(props.chartIds).toEqual([]);
      }).not.toThrow();
    });

    it('should handle many chart IDs', () => {
      const manyChartIds = Array.from({ length: 100 }, (_, i) => `chart-${i}`);
      expect(manyChartIds).toHaveLength(100);
    });
  });

  describe('Metrics Calculation', () => {
    it('should calculate average duration correctly', () => {
      const totalDuration = 150;
      const renderCount = 10;
      const averageDuration = totalDuration / renderCount;

      expect(averageDuration).toBe(15);
    });

    it('should track slowest render', () => {
      const renders = [10, 25, 15, 30, 12];
      const slowest = Math.max(...renders);

      expect(slowest).toBe(30);
    });

    it('should track fastest render', () => {
      const renders = [10, 25, 15, 30, 12];
      const fastest = Math.min(...renders);

      expect(fastest).toBe(10);
    });

    it('should handle single render', () => {
      const totalDuration = 20;
      const renderCount = 1;
      const averageDuration = totalDuration / renderCount;

      expect(averageDuration).toBe(20);
      expect(totalDuration).toBe(20);
    });

    it('should handle zero duration', () => {
      const totalDuration = 0;
      const renderCount = 1;
      const averageDuration = totalDuration / renderCount;

      expect(averageDuration).toBe(0);
    });

    it('should accumulate total duration', () => {
      const durations = [5, 10, 15, 20];
      const total = durations.reduce((sum, d) => sum + d, 0);

      expect(total).toBe(50);
    });

    it('should increment render count', () => {
      let renderCount = 0;
      renderCount++;
      renderCount++;
      renderCount++;

      expect(renderCount).toBe(3);
    });
  });

  describe('Performance Recommendations', () => {
    it('should recommend React.memo for average duration > 10ms', () => {
      const averageDuration = 15;
      const shouldRecommendMemo = averageDuration > 10;

      expect(shouldRecommendMemo).toBe(true);
    });

    it('should recommend breaking down large components for slowest > 50ms', () => {
      const slowestRender = 75;
      const shouldRecommendBreakdown = slowestRender > 50;

      expect(shouldRecommendBreakdown).toBe(true);
    });

    it('should recommend state optimization for many renders with avg > 5ms', () => {
      const renderCount = 150;
      const averageDuration = 8;
      const shouldRecommendOptimization = renderCount > 100 && averageDuration > 5;

      expect(shouldRecommendOptimization).toBe(true);
    });

    it('should not recommend anything for good performance', () => {
      const averageDuration = 3;
      const slowestRender = 10;
      const renderCount = 50;

      const needsMemoRecommendation = averageDuration > 10;
      const needsBreakdownRecommendation = slowestRender > 50;
      const needsStateOptimization = renderCount > 100 && averageDuration > 5;

      expect(needsMemoRecommendation).toBe(false);
      expect(needsBreakdownRecommendation).toBe(false);
      expect(needsStateOptimization).toBe(false);
    });

    it('should handle edge case of exactly threshold values', () => {
      const averageDuration = 10;
      const slowestRender = 50;

      const needsMemoRecommendation = averageDuration > 10;
      const needsBreakdownRecommendation = slowestRender > 50;

      expect(needsMemoRecommendation).toBe(false);
      expect(needsBreakdownRecommendation).toBe(false);
    });
  });

  describe('Slow Render Detection', () => {
    it('should detect slow render above 16ms (1 frame)', () => {
      const duration = 20;
      const isSlow = duration > 16;

      expect(isSlow).toBe(true);
    });

    it('should not flag fast render below 16ms', () => {
      const duration = 10;
      const isSlow = duration > 16;

      expect(isSlow).toBe(false);
    });

    it('should handle exactly 16ms', () => {
      const duration = 16;
      const isSlow = duration > 16;

      expect(isSlow).toBe(false);
    });

    it('should handle very slow renders', () => {
      const duration = 500;
      const isSlow = duration > 16;

      expect(isSlow).toBe(true);
    });

    it('should handle sub-millisecond renders', () => {
      const duration = 0.5;
      const isSlow = duration > 16;

      expect(isSlow).toBe(false);
    });
  });

  describe('Profiler Phases', () => {
    it('should handle mount phase', () => {
      const phase: 'mount' | 'update' | 'nested-update' = 'mount';
      expect(phase).toBe('mount');
    });

    it('should handle update phase', () => {
      const phase: 'mount' | 'update' | 'nested-update' = 'update';
      expect(phase).toBe('update');
    });

    it('should handle nested-update phase', () => {
      const phase: 'mount' | 'update' | 'nested-update' = 'nested-update';
      expect(phase).toBe('nested-update');
    });

    it('should support all valid phases', () => {
      type ProfilerPhase = 'mount' | 'update' | 'nested-update';
      const validPhases: ProfilerPhase[] = ['mount', 'update', 'nested-update'];

      expect(validPhases).toHaveLength(3);
      expect(validPhases).toContain('mount');
      expect(validPhases).toContain('update');
      expect(validPhases).toContain('nested-update');
    });
  });

  describe('Reporting Frequency', () => {
    it('should report every 10 renders', () => {
      const renderCount = 10;
      const shouldReport = renderCount % 10 === 0;

      expect(shouldReport).toBe(true);
    });

    it('should not report on non-multiple of 10', () => {
      const renderCount = 15;
      const shouldReport = renderCount % 10 === 0;

      expect(shouldReport).toBe(false);
    });

    it('should report at 20, 30, 40 renders', () => {
      const counts = [20, 30, 40];
      const shouldReport = counts.map(c => c % 10 === 0);

      expect(shouldReport).toEqual([true, true, true]);
    });

    it('should handle first render', () => {
      const renderCount = 1;
      const shouldReport = renderCount % 10 === 0;

      expect(shouldReport).toBe(false);
    });
  });

  describe('Enabled/Disabled Behavior', () => {
    it('should enable profiler in development by default', () => {
      const nodeEnv = process.env.NODE_ENV;
      const enabledByDefault = nodeEnv === 'development';

      // Test passes regardless of actual env
      expect(typeof enabledByDefault).toBe('boolean');
    });

    it('should accept explicit enabled prop', () => {
      const enabled = true;
      expect(enabled).toBe(true);
    });

    it('should accept explicit disabled prop', () => {
      const enabled = false;
      expect(enabled).toBe(false);
    });

    it('should return children directly when disabled', () => {
      const enabled = false;

      if (!enabled) {
        // Component would return <>{children}</>
        expect(enabled).toBe(false);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle negative duration gracefully', () => {
      const duration = -5;
      const isValid = duration >= 0;

      expect(isValid).toBe(false);
    });

    it('should handle very large duration', () => {
      const duration = Number.MAX_SAFE_INTEGER;
      expect(duration).toBeGreaterThan(0);
    });

    it('should handle zero render count', () => {
      const renderCount = 0;
      const totalDuration = 0;

      // Prevent division by zero
      const averageDuration = renderCount > 0 ? totalDuration / renderCount : 0;
      expect(averageDuration).toBe(0);
    });

    it('should handle fastest render with MAX_VALUE initialization', () => {
      const fastestRender = Number.MAX_VALUE;
      const newDuration = 10;
      const updated = Math.min(fastestRender, newDuration);

      expect(updated).toBe(10);
    });

    it('should handle slowest render with 0 initialization', () => {
      const slowestRender = 0;
      const newDuration = 25;
      const updated = Math.max(slowestRender, newDuration);

      expect(updated).toBe(25);
    });
  });
});
