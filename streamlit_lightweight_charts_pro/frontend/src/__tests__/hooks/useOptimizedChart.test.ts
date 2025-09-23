import { renderHook, act } from '@testing-library/react';
import { useOptimizedChart } from '../../hooks/useOptimizedChart';
import { resetMocks } from '../../test-utils/lightweightChartsMocks';

// Use unified mock system
import lightweightChartsMocks from '../../test-utils/lightweightChartsMocks';
jest.mock('lightweight-charts', () => lightweightChartsMocks);

describe('useOptimizedChart', () => {
  beforeEach(() => {
    resetMocks();
  });

  it('should initialize with default values', () => {
    const options = { chartId: 'test-chart' };
    const { result } = renderHook(() => useOptimizedChart(options));

    expect(result.current.getChart()).toBeNull();
    expect(result.current.isReady()).toBe(false);
    expect(result.current.getAllSeries()).toEqual([]);
  });

  it('should handle error cases gracefully', () => {
    const options = { chartId: 'test-chart' };
    const { result } = renderHook(() => useOptimizedChart(options));

    // Test adding series without chart
    const series = result.current.addSeries('LineSeries', { color: 'blue' });
    expect(series).toBeNull();

    // Test getting series without chart
    const allSeries = result.current.getAllSeries();
    expect(allSeries).toEqual([]);
  });

  it('should handle container operations', () => {
    const options = { chartId: 'test-chart' };
    const { result } = renderHook(() => useOptimizedChart(options));

    // Test container operations without chart
    expect(result.current.getContainer()).toBeNull();
  });

  it('should handle performance timing', () => {
    const options = { chartId: 'test-chart', enablePerformanceMonitoring: true };
    const { result } = renderHook(() => useOptimizedChart(options));

    // Test performance timing without chart
    const startTime = performance.now();
    result.current.addSeries('LineSeries', { color: 'blue' });
    const endTime = performance.now();

    expect(endTime - startTime).toBeGreaterThanOrEqual(0);
  });

  it('should handle chart ready detection', () => {
    const options = { chartId: 'test-chart' };
    const { result } = renderHook(() => useOptimizedChart(options));

    // Test chart ready detection without chart
    expect(result.current.isChartReadySync()).toBe(false);
    expect(result.current.isReady()).toBe(false);
  });

  it('should handle series retrieval by index', () => {
    const options = { chartId: 'test-chart' };
    const { result } = renderHook(() => useOptimizedChart(options));

    // Test series retrieval without chart
    expect(result.current.getSeries(0)).toBeNull();
    expect(result.current.getSeries(1)).toBeNull();
    expect(result.current.getSeries(2)).toBeNull();
  });

  it('should handle resize operations', () => {
    const options = { chartId: 'test-chart' };
    const { result } = renderHook(() => useOptimizedChart(options));

    // Test resize without chart - should not throw
    expect(() => {
      void result.current.resize(1000, 800);
    }).not.toThrow();
  });

  it('should handle cleanup operations', () => {
    const options = { chartId: 'test-chart' };
    const { result } = renderHook(() => useOptimizedChart(options));

    // Test cleanup without chart - should not throw
    expect(() => {
      result.current.cleanup();
    }).not.toThrow();
  });

  it('should support different series types', () => {
    const options = { chartId: 'test-chart' };
    const { result } = renderHook(() => useOptimizedChart(options));

    // Test different series types without chart
    const candlestickSeries = result.current.addSeries('CandlestickSeries', {});
    const lineSeries = result.current.addSeries('LineSeries', {});
    const areaSeries = result.current.addSeries('AreaSeries', {});
    const histogramSeries = result.current.addSeries('HistogramSeries', {});
    const barSeries = result.current.addSeries('BarSeries', {});
    const baselineSeries = result.current.addSeries('BaselineSeries', {});

    expect(candlestickSeries).toBeNull();
    expect(lineSeries).toBeNull();
    expect(areaSeries).toBeNull();
    expect(histogramSeries).toBeNull();
    expect(barSeries).toBeNull();
    expect(baselineSeries).toBeNull();

    expect(result.current.getAllSeries()).toEqual([]);
  });
});
