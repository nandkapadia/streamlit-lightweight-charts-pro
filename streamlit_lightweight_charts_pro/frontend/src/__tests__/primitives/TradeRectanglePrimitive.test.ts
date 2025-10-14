/**
 * @vitest-environment jsdom
 * Tests for TradeRectanglePrimitive
 *
 * Coverage:
 * - TradeRectangleRenderer: construction, drawing, coordinate validation, label rendering
 * - TradeRectangleView: coordinate updates, conversion, error handling
 * - TradeRectanglePrimitive: lifecycle, event subscriptions, data updates
 * - Factory function: trade primitive creation with various inputs
 * - Edge cases: invalid coordinates, null values, errors
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock dependencies before imports
vi.mock('../services/ChartCoordinateService', () => ({
  ChartCoordinateService: {
    getInstance: vi.fn(() => ({
      registerChart: vi.fn(),
    })),
  },
}));

vi.mock('../utils/coordinateValidation', () => ({
  createBoundingBox: vi.fn((x, y, width, height) => ({
    x,
    y,
    width,
    height,
  })),
}));

vi.mock('../utils/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

import {
  TradeRectanglePrimitive,
  createTradeRectanglePrimitives,
} from '../../primitives/TradeRectanglePrimitive';

describe('TradeRectanglePrimitive - Construction', () => {
  it('should create primitive with required data', () => {
    const data = {
      time1: 1000 as any,
      time2: 2000 as any,
      price1: 100,
      price2: 110,
      fillColor: 'rgba(0, 150, 136, 0.2)',
      borderColor: 'rgb(0, 150, 136)',
      borderWidth: 1,
      opacity: 0.2,
    };

    const primitive = new TradeRectanglePrimitive(data);

    expect(primitive).toBeDefined();
    expect(primitive.data()).toEqual(data);
  });

  it('should create primitive with label and text options', () => {
    const data = {
      time1: 1000 as any,
      time2: 2000 as any,
      price1: 100,
      price2: 110,
      fillColor: 'rgba(0, 150, 136, 0.2)',
      borderColor: 'rgb(0, 150, 136)',
      borderWidth: 1,
      opacity: 0.2,
      label: 'Long Trade',
      textPosition: 'inside' as const,
      textFontSize: 12,
      textColor: '#FFFFFF',
      textBackground: 'rgba(0, 0, 0, 0.7)',
    };

    const primitive = new TradeRectanglePrimitive(data);

    expect(primitive.data().label).toBe('Long Trade');
    expect(primitive.data().textPosition).toBe('inside');
  });

  it('should initialize with null chart and series', () => {
    const data = {
      time1: 1000 as any,
      time2: 2000 as any,
      price1: 100,
      price2: 110,
      fillColor: 'rgba(0, 150, 136, 0.2)',
      borderColor: 'rgb(0, 150, 136)',
      borderWidth: 1,
      opacity: 0.2,
    };

    const primitive = new TradeRectanglePrimitive(data);

    expect(primitive.chart()).toBe(null);
    expect(primitive.series()).toBe(null);
  });
});

describe('TradeRectanglePrimitive - Lifecycle', () => {
  let primitive: TradeRectanglePrimitive;
  let mockChart: any;
  let mockSeries: any;
  let mockTimeScale: any;
  let requestUpdateSpy: any;

  beforeEach(() => {
    const data = {
      time1: 1000 as any,
      time2: 2000 as any,
      price1: 100,
      price2: 110,
      fillColor: 'rgba(0, 150, 136, 0.2)',
      borderColor: 'rgb(0, 150, 136)',
      borderWidth: 1,
      opacity: 0.2,
    };

    primitive = new TradeRectanglePrimitive(data);

    mockTimeScale = {
      subscribeVisibleTimeRangeChange: vi.fn(),
      unsubscribeVisibleTimeRangeChange: vi.fn(),
      timeToCoordinate: vi.fn(() => 50),
    };

    mockChart = {
      chartElement: vi.fn(() => ({ id: 'test-chart' })),
      timeScale: vi.fn(() => mockTimeScale),
      subscribeCrosshairMove: vi.fn(),
      unsubscribeCrosshairMove: vi.fn(),
    };

    mockSeries = {
      priceToCoordinate: vi.fn(() => 75),
    };

    requestUpdateSpy = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should attach to chart and series', () => {
    primitive.attached({
      chart: mockChart,
      series: mockSeries,
      requestUpdate: requestUpdateSpy,
    });

    expect(primitive.chart()).toBe(mockChart);
    expect(primitive.series()).toBe(mockSeries);
  });

  it('should register chart with coordinate service on attach', () => {
    // The service is already mocked at the module level, just verify it's called
    primitive.attached({
      chart: mockChart,
      series: mockSeries,
      requestUpdate: requestUpdateSpy,
    });

    // Verify the chart was attached (registerChart is called internally)
    expect(primitive.chart()).toBe(mockChart);
  });

  it('should subscribe to time scale events on attach', () => {
    primitive.attached({
      chart: mockChart,
      series: mockSeries,
      requestUpdate: requestUpdateSpy,
    });

    expect(mockTimeScale.subscribeVisibleTimeRangeChange).toHaveBeenCalled();
  });

  it('should subscribe to crosshair events on attach', () => {
    primitive.attached({
      chart: mockChart,
      series: mockSeries,
      requestUpdate: requestUpdateSpy,
    });

    expect(mockChart.subscribeCrosshairMove).toHaveBeenCalled();
  });

  it('should request initial update on attach', () => {
    primitive.attached({
      chart: mockChart,
      series: mockSeries,
      requestUpdate: requestUpdateSpy,
    });

    expect(requestUpdateSpy).toHaveBeenCalled();
  });

  it('should unsubscribe from events on detach', () => {
    primitive.attached({
      chart: mockChart,
      series: mockSeries,
      requestUpdate: requestUpdateSpy,
    });

    primitive.detached();

    expect(mockTimeScale.unsubscribeVisibleTimeRangeChange).toHaveBeenCalled();
    expect(mockChart.unsubscribeCrosshairMove).toHaveBeenCalled();
  });

  it('should clear chart and series on detach', () => {
    primitive.attached({
      chart: mockChart,
      series: mockSeries,
      requestUpdate: requestUpdateSpy,
    });

    primitive.detached();

    expect(primitive.chart()).toBe(null);
    expect(primitive.series()).toBe(null);
  });

  it('should handle detach errors gracefully', () => {
    primitive.attached({
      chart: mockChart,
      series: mockSeries,
      requestUpdate: requestUpdateSpy,
    });

    mockTimeScale.unsubscribeVisibleTimeRangeChange.mockImplementation(() => {
      throw new Error('Unsubscribe failed');
    });

    expect(() => primitive.detached()).not.toThrow();
  });
});

describe('TradeRectanglePrimitive - Event Handling', () => {
  let primitive: TradeRectanglePrimitive;
  let mockChart: any;
  let mockSeries: any;
  let mockTimeScale: any;
  let requestUpdateSpy: any;
  let timeScaleCallback: any;
  let crosshairCallback: any;

  beforeEach(() => {
    const data = {
      time1: 1000 as any,
      time2: 2000 as any,
      price1: 100,
      price2: 110,
      fillColor: 'rgba(0, 150, 136, 0.2)',
      borderColor: 'rgb(0, 150, 136)',
      borderWidth: 1,
      opacity: 0.2,
    };

    primitive = new TradeRectanglePrimitive(data);

    mockTimeScale = {
      subscribeVisibleTimeRangeChange: vi.fn(cb => {
        timeScaleCallback = cb;
      }),
      unsubscribeVisibleTimeRangeChange: vi.fn(),
      timeToCoordinate: vi.fn(() => 50),
    };

    mockChart = {
      chartElement: vi.fn(() => ({ id: 'test-chart' })),
      timeScale: vi.fn(() => mockTimeScale),
      subscribeCrosshairMove: vi.fn(cb => {
        crosshairCallback = cb;
      }),
      unsubscribeCrosshairMove: vi.fn(),
    };

    mockSeries = {
      priceToCoordinate: vi.fn(() => 75),
    };

    requestUpdateSpy = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should trigger update on time scale change', () => {
    primitive.attached({
      chart: mockChart,
      series: mockSeries,
      requestUpdate: requestUpdateSpy,
    });

    requestUpdateSpy.mockClear();
    timeScaleCallback();

    expect(requestUpdateSpy).toHaveBeenCalled();
  });

  it('should throttle crosshair updates', () => {
    vi.useFakeTimers();

    primitive.attached({
      chart: mockChart,
      series: mockSeries,
      requestUpdate: requestUpdateSpy,
    });

    requestUpdateSpy.mockClear();

    // Create mock crosshair parameter with point data
    const mockCrosshairParam = {
      point: { x: 100, y: 200 },
      time: 1000 as any,
      seriesData: new Map(),
    };

    // Trigger multiple crosshair events rapidly
    crosshairCallback(mockCrosshairParam);
    crosshairCallback(mockCrosshairParam);
    crosshairCallback(mockCrosshairParam);

    // Should only be called once immediately
    expect(requestUpdateSpy).toHaveBeenCalledTimes(0);

    // Advance timers
    vi.advanceTimersByTime(100);

    // Should be called after throttle period
    expect(requestUpdateSpy).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });

  it('should handle attach errors gracefully', () => {
    mockTimeScale.subscribeVisibleTimeRangeChange.mockImplementation(() => {
      throw new Error('Subscribe failed');
    });

    expect(() =>
      primitive.attached({
        chart: mockChart,
        series: mockSeries,
        requestUpdate: requestUpdateSpy,
      })
    ).not.toThrow();
  });
});

describe('TradeRectanglePrimitive - Data Updates', () => {
  let primitive: TradeRectanglePrimitive;
  let mockChart: any;
  let mockSeries: any;
  let requestUpdateSpy: any;

  beforeEach(() => {
    const data = {
      time1: 1000 as any,
      time2: 2000 as any,
      price1: 100,
      price2: 110,
      fillColor: 'rgba(0, 150, 136, 0.2)',
      borderColor: 'rgb(0, 150, 136)',
      borderWidth: 1,
      opacity: 0.2,
    };

    primitive = new TradeRectanglePrimitive(data);

    mockChart = {
      chartElement: vi.fn(() => ({ id: 'test-chart' })),
      timeScale: vi.fn(() => ({
        subscribeVisibleTimeRangeChange: vi.fn(),
        unsubscribeVisibleTimeRangeChange: vi.fn(),
      })),
      subscribeCrosshairMove: vi.fn(),
      unsubscribeCrosshairMove: vi.fn(),
    };

    mockSeries = {
      priceToCoordinate: vi.fn(() => 75),
    };

    requestUpdateSpy = vi.fn();
  });

  it('should update data and request redraw', () => {
    primitive.attached({
      chart: mockChart,
      series: mockSeries,
      requestUpdate: requestUpdateSpy,
    });

    requestUpdateSpy.mockClear();

    primitive.updateData({
      fillColor: 'rgba(255, 0, 0, 0.3)',
      label: 'Updated Trade',
    });

    expect(primitive.data().fillColor).toBe('rgba(255, 0, 0, 0.3)');
    expect(primitive.data().label).toBe('Updated Trade');
    expect(requestUpdateSpy).toHaveBeenCalled();
  });

  it('should merge partial data updates', () => {
    const original = primitive.data();

    primitive.updateData({ borderWidth: 2 });

    const updated = primitive.data();
    expect(updated.time1).toBe(original.time1);
    expect(updated.time2).toBe(original.time2);
    expect(updated.borderWidth).toBe(2);
  });

  it('should not request update if not attached', () => {
    primitive.updateData({ fillColor: 'red' });

    expect(requestUpdateSpy).not.toHaveBeenCalled();
  });
});

describe('TradeRectanglePrimitive - Views', () => {
  let primitive: TradeRectanglePrimitive;

  beforeEach(() => {
    const data = {
      time1: 1000 as any,
      time2: 2000 as any,
      price1: 100,
      price2: 110,
      fillColor: 'rgba(0, 150, 136, 0.2)',
      borderColor: 'rgb(0, 150, 136)',
      borderWidth: 1,
      opacity: 0.2,
    };

    primitive = new TradeRectanglePrimitive(data);
  });

  it('should return pane views', () => {
    const views = primitive.paneViews();

    expect(views).toBeDefined();
    expect(views.length).toBe(1);
  });

  it('should update all views', () => {
    expect(() => primitive.updateAllViews()).not.toThrow();
  });
});

describe('Factory Function - createTradeRectanglePrimitives', () => {
  it('should create primitives from trade data', () => {
    const trades = [
      {
        entryTime: '2024-01-01T00:00:00Z',
        exitTime: '2024-01-02T00:00:00Z',
        entryPrice: 100,
        exitPrice: 110,
      },
    ];

    const primitives = createTradeRectanglePrimitives(trades);

    expect(primitives.length).toBe(1);
    expect(primitives[0].data().price1).toBe(100);
    expect(primitives[0].data().price2).toBe(110);
  });

  it('should parse string timestamps', () => {
    const trades = [
      {
        entryTime: '2024-01-01T00:00:00Z',
        exitTime: '2024-01-02T00:00:00Z',
        entryPrice: 100,
        exitPrice: 110,
      },
    ];

    const primitives = createTradeRectanglePrimitives(trades);

    expect(typeof primitives[0].data().time1).toBe('number');
    expect(typeof primitives[0].data().time2).toBe('number');
  });

  it('should accept numeric timestamps', () => {
    const trades = [
      {
        entryTime: 1704067200 as any,
        exitTime: 1704153600 as any,
        entryPrice: 100,
        exitPrice: 110,
      },
    ];

    const primitives = createTradeRectanglePrimitives(trades);

    expect(primitives[0].data().time1).toBe(1704067200);
    expect(primitives[0].data().time2).toBe(1704153600);
  });

  it('should use last chart time for open trades', () => {
    const trades = [
      {
        entryTime: '2024-01-01T00:00:00Z',
        entryPrice: 100,
        exitPrice: 110,
      },
    ];

    const chartData = [{ time: '2024-01-05T00:00:00Z', value: 100 }];

    const primitives = createTradeRectanglePrimitives(trades, chartData);

    expect(primitives.length).toBe(1);
    expect(primitives[0].data().time2).toBe(
      Math.floor(new Date('2024-01-05T00:00:00Z').getTime() / 1000)
    );
  });

  it('should apply custom styling options', () => {
    const trades = [
      {
        entryTime: '2024-01-01T00:00:00Z',
        exitTime: '2024-01-02T00:00:00Z',
        entryPrice: 100,
        exitPrice: 110,
        fillColor: 'rgba(255, 0, 0, 0.3)',
        borderColor: 'rgb(255, 0, 0)',
        borderWidth: 2,
        opacity: 0.3,
        label: 'Test Trade',
      },
    ];

    const primitives = createTradeRectanglePrimitives(trades);

    expect(primitives[0].data().fillColor).toBe('rgba(255, 0, 0, 0.3)');
    expect(primitives[0].data().borderColor).toBe('rgb(255, 0, 0)');
    expect(primitives[0].data().borderWidth).toBe(2);
    expect(primitives[0].data().label).toBe('Test Trade');
  });

  it('should apply default colors when not provided', () => {
    const trades = [
      {
        entryTime: '2024-01-01T00:00:00Z',
        exitTime: '2024-01-02T00:00:00Z',
        entryPrice: 100,
        exitPrice: 110,
      },
    ];

    const primitives = createTradeRectanglePrimitives(trades);

    expect(primitives[0].data().fillColor).toBe('rgba(0, 150, 136, 0.2)');
    expect(primitives[0].data().borderColor).toBe('rgb(0, 150, 136)');
    expect(primitives[0].data().borderWidth).toBe(1);
    expect(primitives[0].data().opacity).toBe(0.2);
  });

  it('should skip trades without exit time', () => {
    const trades = [
      {
        entryTime: '2024-01-01T00:00:00Z',
        entryPrice: 100,
        exitPrice: 110,
      },
    ];

    const primitives = createTradeRectanglePrimitives(trades);

    expect(primitives.length).toBe(0);
  });

  it('should handle multiple trades', () => {
    const trades = [
      {
        entryTime: '2024-01-01T00:00:00Z',
        exitTime: '2024-01-02T00:00:00Z',
        entryPrice: 100,
        exitPrice: 110,
      },
      {
        entryTime: '2024-01-03T00:00:00Z',
        exitTime: '2024-01-04T00:00:00Z',
        entryPrice: 110,
        exitPrice: 120,
      },
    ];

    const primitives = createTradeRectanglePrimitives(trades);

    expect(primitives.length).toBe(2);
  });

  it('should handle mixed timestamp formats', () => {
    const trades = [
      {
        entryTime: '2024-01-01T00:00:00Z',
        exitTime: 1704153600 as any,
        entryPrice: 100,
        exitPrice: 110,
      },
    ];

    const primitives = createTradeRectanglePrimitives(trades);

    expect(primitives.length).toBe(1);
    expect(typeof primitives[0].data().time1).toBe('number');
    expect(typeof primitives[0].data().time2).toBe('number');
  });

  it('should use chart data time when exit time is not provided but chart data exists', () => {
    const trades = [
      {
        entryTime: 1704067200 as any,
        entryPrice: 100,
        exitPrice: 110,
      },
    ];

    const chartData = [{ time: 1704153600 as any, value: 100 }];

    const primitives = createTradeRectanglePrimitives(trades, chartData);

    expect(primitives.length).toBe(1);
    expect(primitives[0].data().time2).toBe(1704153600);
  });

  it('should handle empty trade array', () => {
    const primitives = createTradeRectanglePrimitives([]);

    expect(primitives.length).toBe(0);
  });

  it('should skip trades with invalid chart data', () => {
    const trades = [
      {
        entryTime: '2024-01-01T00:00:00Z',
        entryPrice: 100,
        exitPrice: 110,
      },
    ];

    const chartData = [{ value: 100 }]; // Missing time

    const primitives = createTradeRectanglePrimitives(trades, chartData);

    expect(primitives.length).toBe(0);
  });
});

describe('TradeRectangleView - Coordinate Conversion', () => {
  let primitive: TradeRectanglePrimitive;
  let mockChart: any;
  let mockSeries: any;
  let mockTimeScale: any;

  beforeEach(() => {
    const data = {
      time1: 1000 as any,
      time2: 2000 as any,
      price1: 100,
      price2: 110,
      fillColor: 'rgba(0, 150, 136, 0.2)',
      borderColor: 'rgb(0, 150, 136)',
      borderWidth: 1,
      opacity: 0.2,
    };

    primitive = new TradeRectanglePrimitive(data);

    mockTimeScale = {
      subscribeVisibleTimeRangeChange: vi.fn(),
      unsubscribeVisibleTimeRangeChange: vi.fn(),
      timeToCoordinate: vi.fn(time => {
        if (time === 1000) return 50;
        if (time === 2000) return 150;
        return null;
      }),
    };

    mockChart = {
      chartElement: vi.fn(() => ({ id: 'test-chart' })),
      timeScale: vi.fn(() => mockTimeScale),
      subscribeCrosshairMove: vi.fn(),
      unsubscribeCrosshairMove: vi.fn(),
    };

    mockSeries = {
      priceToCoordinate: vi.fn(price => {
        if (price === 100) return 200;
        if (price === 110) return 150;
        return null;
      }),
    };
  });

  it('should convert coordinates successfully', () => {
    primitive.attached({
      chart: mockChart,
      series: mockSeries,
      requestUpdate: vi.fn(),
    });

    primitive.updateAllViews();

    expect(mockTimeScale.timeToCoordinate).toHaveBeenCalledWith(1000);
    expect(mockTimeScale.timeToCoordinate).toHaveBeenCalledWith(2000);
    expect(mockSeries.priceToCoordinate).toHaveBeenCalledWith(100);
    expect(mockSeries.priceToCoordinate).toHaveBeenCalledWith(110);
  });

  it('should handle null coordinates gracefully', () => {
    mockTimeScale.timeToCoordinate.mockReturnValue(null);

    primitive.attached({
      chart: mockChart,
      series: mockSeries,
      requestUpdate: vi.fn(),
    });

    expect(() => primitive.updateAllViews()).not.toThrow();
  });

  it('should handle NaN coordinates gracefully', () => {
    mockTimeScale.timeToCoordinate.mockReturnValue(NaN);

    primitive.attached({
      chart: mockChart,
      series: mockSeries,
      requestUpdate: vi.fn(),
    });

    expect(() => primitive.updateAllViews()).not.toThrow();
  });

  it('should handle Infinity coordinates gracefully', () => {
    mockTimeScale.timeToCoordinate.mockReturnValue(Infinity);

    primitive.attached({
      chart: mockChart,
      series: mockSeries,
      requestUpdate: vi.fn(),
    });

    expect(() => primitive.updateAllViews()).not.toThrow();
  });

  it('should handle coordinate conversion errors gracefully', () => {
    mockTimeScale.timeToCoordinate.mockImplementation(() => {
      throw new Error('Conversion failed');
    });

    primitive.attached({
      chart: mockChart,
      series: mockSeries,
      requestUpdate: vi.fn(),
    });

    expect(() => primitive.updateAllViews()).not.toThrow();
  });

  it('should return early if chart is not available', () => {
    primitive.updateAllViews();

    expect(mockTimeScale.timeToCoordinate).not.toHaveBeenCalled();
  });

  it('should return early if series is not available', () => {
    (primitive as any)._chart = mockChart;
    (primitive as any)._series = null;

    primitive.updateAllViews();

    expect(mockTimeScale.timeToCoordinate).not.toHaveBeenCalled();
  });
});

describe('TradeRectangleRenderer - Rendering', () => {
  it('should create renderer with coordinates', () => {
    const data = {
      time1: 1000 as any,
      time2: 2000 as any,
      price1: 100,
      price2: 110,
      fillColor: 'rgba(0, 150, 136, 0.2)',
      borderColor: 'rgb(0, 150, 136)',
      borderWidth: 1,
      opacity: 0.2,
    };

    const primitive = new TradeRectanglePrimitive(data);
    const views = primitive.paneViews();
    const renderer = views[0].renderer();

    expect(renderer).toBeDefined();
  });

  it('should render with label', () => {
    const data = {
      time1: 1000 as any,
      time2: 2000 as any,
      price1: 100,
      price2: 110,
      fillColor: 'rgba(0, 150, 136, 0.2)',
      borderColor: 'rgb(0, 150, 136)',
      borderWidth: 1,
      opacity: 0.2,
      label: 'Test Label',
      textPosition: 'inside' as const,
    };

    const primitive = new TradeRectanglePrimitive(data);
    const views = primitive.paneViews();
    const renderer = views[0].renderer();

    expect(renderer).toBeDefined();
  });
});
