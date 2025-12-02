/**
 * @fileoverview Lightweight Charts Mocks
 *
 * Unified mock system for TradingView Lightweight Charts library.
 * Provides comprehensive mocks for all chart APIs used in testing.
 *
 * This module provides:
 * - Mock chart API (IChartApi)
 * - Mock series API (ISeriesApi)
 * - Mock time scale and price scale
 * - Mock pane API
 * - Mock enums and constants
 *
 * Features:
 * - Complete API coverage for testing
 * - Reset functionality for test isolation
 * - Configurable mock behaviors
 * - Type-safe mock implementations
 *
 * @example
 * ```typescript
 * import { mockChart, mockSeries, resetMocks } from './lightweightChartsMocks';
 *
 * beforeEach(() => {
 *   resetMocks();
 * });
 *
 * test('chart creation', () => {
 *   const chart = createChart(container);
 *   expect(chart.addSeries).toBeDefined();
 * });
 * ```
 */

import { vi } from 'vitest';

// Mock series object with all required methods
export const mockSeries = {
  setData: vi.fn(),
  update: vi.fn(),
  applyOptions: vi.fn(),
  options: vi.fn().mockReturnValue({}),
  priceFormatter: vi.fn().mockReturnValue((value: number) => value.toFixed(2)),
  priceToCoordinate: vi.fn().mockReturnValue(100),
  coordinateToPrice: vi.fn().mockReturnValue(50),
  barsInLogicalRange: vi.fn().mockReturnValue({ barsBefore: 0, barsAfter: 0 }),
  data: vi.fn().mockReturnValue([]),
  dataByIndex: vi.fn().mockReturnValue(null),
  subscribeDataChanged: vi.fn(),
  unsubscribeDataChanged: vi.fn(),
  seriesType: vi.fn().mockReturnValue('Line'),
  attachPrimitive: vi.fn(),
  detachPrimitive: vi.fn(),
  createPriceLine: vi.fn().mockReturnValue({
    applyOptions: vi.fn(),
    options: vi.fn().mockReturnValue({}),
    remove: vi.fn(),
  }),
  removePriceLine: vi.fn(),
  priceLines: vi.fn().mockReturnValue([]),
  moveToPane: vi.fn(),
  seriesOrder: vi.fn().mockReturnValue(0),
  setSeriesOrder: vi.fn(),
  getPane: vi.fn().mockReturnValue({
    getHeight: vi.fn().mockReturnValue(400),
    setHeight: vi.fn(),
    getStretchFactor: vi.fn().mockReturnValue(1),
    setStretchFactor: vi.fn(),
    paneIndex: vi.fn().mockReturnValue(0),
    moveTo: vi.fn(),
    getSeries: vi.fn().mockReturnValue([]),
    getHTMLElement: vi.fn().mockReturnValue({}),
    attachPrimitive: vi.fn(),
    detachPrimitive: vi.fn(),
    priceScale: vi.fn().mockReturnValue({
      applyOptions: vi.fn(),
      options: vi.fn().mockReturnValue({}),
      width: vi.fn().mockReturnValue(100),
      setVisibleRange: vi.fn(),
      getVisibleRange: vi.fn().mockReturnValue({ from: 0, to: 100 }),
      setAutoScale: vi.fn(),
    }),
    setPreserveEmptyPane: vi.fn(),
    preserveEmptyPane: vi.fn().mockReturnValue(false),
    addCustomSeries: vi.fn(),
    addSeries: vi.fn(),
  }),
};

// Mock price scale
export const mockPriceScale = {
  applyOptions: vi.fn(),
  options: vi.fn().mockReturnValue({}),
  width: vi.fn().mockReturnValue(100),
  setVisibleRange: vi.fn(),
  getVisibleRange: vi.fn().mockReturnValue({ from: 0, to: 100 }),
  setAutoScale: vi.fn(),
};

// Mock time scale
export const mockTimeScale = {
  scrollPosition: vi.fn().mockReturnValue(0),
  scrollToPosition: vi.fn(),
  scrollToRealTime: vi.fn(),
  getVisibleRange: vi.fn().mockReturnValue({ from: 0, to: 100 }),
  setVisibleRange: vi.fn(),
  getVisibleLogicalRange: vi.fn().mockReturnValue({ from: 0, to: 100 }),
  setVisibleLogicalRange: vi.fn(),
  resetTimeScale: vi.fn(),
  fitContent: vi.fn(),
  logicalToCoordinate: vi.fn().mockReturnValue(100),
  coordinateToLogical: vi.fn().mockReturnValue(0),
  timeToIndex: vi.fn().mockReturnValue(0),
  timeToCoordinate: vi.fn().mockReturnValue(100),
  coordinateToTime: vi.fn().mockReturnValue(0),
  width: vi.fn().mockReturnValue(800),
  height: vi.fn().mockReturnValue(400),
  subscribeVisibleTimeRangeChange: vi.fn(),
  unsubscribeVisibleTimeRangeChange: vi.fn(),
  subscribeVisibleLogicalRangeChange: vi.fn(),
  unsubscribeVisibleLogicalRangeChange: vi.fn(),
  subscribeSizeChange: vi.fn(),
  unsubscribeSizeChange: vi.fn(),
  applyOptions: vi.fn(),
  options: vi.fn().mockReturnValue({
    barSpacing: 6,
    rightOffset: 0,
  }),
};

// Mock pane
export const mockPane = {
  getHeight: vi.fn().mockReturnValue(400),
  setHeight: vi.fn(),
  getStretchFactor: vi.fn().mockReturnValue(1),
  setStretchFactor: vi.fn(),
  paneIndex: vi.fn().mockReturnValue(0),
  moveTo: vi.fn(),
  getSeries: vi.fn().mockReturnValue([]),
  getHTMLElement: vi.fn().mockReturnValue({}),
  attachPrimitive: vi.fn(),
  detachPrimitive: vi.fn(),
  priceScale: vi.fn().mockReturnValue(mockPriceScale),
  setPreserveEmptyPane: vi.fn(),
  preserveEmptyPane: vi.fn().mockReturnValue(false),
  addCustomSeries: vi.fn(),
  addSeries: vi.fn(),
};

// Main mock chart object
export const mockChart = {
  // Series methods
  addSeries: vi.fn().mockImplementation((_seriesType, _options, _paneId) => {
    return mockSeries;
  }),
  removeSeries: vi.fn(),
  addCustomSeries: vi.fn().mockReturnValue(mockSeries),

  // Chart methods
  remove: vi.fn(),
  resize: vi.fn(),
  applyOptions: vi.fn(),
  options: vi.fn().mockReturnValue({
    layout: {
      background: { type: 'solid', color: '#FFFFFF' },
      textColor: '#191919',
      fontSize: 12,
      fontFamily: 'Arial',
    },
    crosshair: {
      mode: 1,
      vertLine: { visible: true },
      horzLine: { visible: true },
    },
    grid: {
      vertLines: { visible: true },
      horzLines: { visible: true },
    },
    timeScale: {
      visible: true,
      timeVisible: false,
      secondsVisible: false,
    },
    rightPriceScale: {
      visible: true,
      autoScale: true,
    },
    leftPriceScale: {
      visible: false,
      autoScale: true,
    },
  }),

  // Scale methods
  timeScale: vi.fn().mockReturnValue(mockTimeScale),
  priceScale: vi.fn().mockReturnValue(mockPriceScale),

  // Event methods
  subscribeCrosshairMove: vi.fn(),
  unsubscribeCrosshairMove: vi.fn(),
  subscribeClick: vi.fn(),
  unsubscribeClick: vi.fn(),
  subscribeDblClick: vi.fn(),
  unsubscribeDblClick: vi.fn(),

  // Screenshot and utilities
  takeScreenshot: vi.fn().mockReturnValue({}),
  chartElement: vi.fn().mockReturnValue({
    getBoundingClientRect: vi.fn().mockReturnValue({
      width: 800,
      height: 400,
      top: 0,
      left: 0,
      right: 800,
      bottom: 400,
      x: 0,
      y: 0,
    }),
    querySelector: vi.fn().mockReturnValue(null),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    style: {},
  }),

  // Pane methods
  addPane: vi.fn().mockReturnValue(mockPane),
  removePane: vi.fn(),
  swapPanes: vi.fn(),
  panes: vi.fn().mockReturnValue([mockPane]),
  paneSize: vi.fn().mockReturnValue({ width: 800, height: 400 }),

  // Crosshair methods
  setCrosshairPosition: vi.fn(),
  clearCrosshairPosition: vi.fn(),

  // Miscellaneous
  autoSizeActive: vi.fn().mockReturnValue(false),
  horzBehaviour: vi.fn().mockReturnValue({
    options: vi.fn().mockReturnValue({}),
    setOptions: vi.fn(),
  }),
};

// Mock createChart function
export const createChart = vi.fn().mockImplementation((_container, _options) => {
  return mockChart;
});

// Mock createChartEx function
export const createChartEx = vi
  .fn()
  .mockImplementation((_container, _horzScaleBehavior, _options) => {
    return mockChart;
  });

// Mock utility functions
export const isBusinessDay = vi.fn().mockImplementation(time => {
  return typeof time === 'object' && time.year && time.month && time.day;
});

export const isUTCTimestamp = vi.fn().mockImplementation(time => {
  return typeof time === 'number' && time > 0;
});

// Series types
export const AreaSeries = 'Area';
export const BarSeries = 'Bar';
export const BaselineSeries = 'Baseline';
export const CandlestickSeries = 'Candlestick';
export const HistogramSeries = 'Histogram';
export const LineSeries = 'Line';

// Enums and constants
export const ColorType = {
  Solid: 'solid',
  VerticalGradient: 'gradient',
};

export const CrosshairMode = {
  Normal: 0,
  Hidden: 1,
};

export const LineStyle = {
  Solid: 0,
  Dotted: 1,
  Dashed: 2,
  LargeDashed: 3,
  SparseDotted: 4,
};

export const LineType = {
  Simple: 0,
  WithSteps: 1,
  Curved: 2,
};

export const PriceScaleMode = {
  Normal: 0,
  Logarithmic: 1,
  Percentage: 2,
  IndexedTo100: 3,
};

export const TickMarkType = {
  Year: 0,
  Month: 1,
  DayOfMonth: 2,
  Time: 3,
  TimeWithSeconds: 4,
};

export const TrackingModeExitMode = {
  OnTouchEnd: 0,
  OnMouseLeave: 1,
};

export const LastPriceAnimationMode = {
  Disabled: 0,
  Continuous: 1,
  OnDataUpdate: 2,
};

export const PriceLineSource = {
  LastBar: 0,
  LastVisible: 1,
};

export const MismatchDirection = {
  NearestLeft: 0,
  NearestRight: 1,
};

// Custom series and defaults
export const customSeriesDefaultOptions = {
  color: '#2196f3',
};

export const version = '5.0.8';

export const defaultHorzScaleBehavior = {
  options: vi.fn().mockReturnValue({}),
  setOptions: vi.fn(),
};

// Reset function for tests
export const resetMocks = () => {
  vi.clearAllMocks();
  createChart.mockImplementation((_container, _options) => mockChart);
  mockChart.addSeries.mockImplementation((_seriesType, _options, _paneId) => mockSeries);
};

// Default export for vi.mock()
const lightweightChartsMock = {
  createChart,
  createChartEx,
  isBusinessDay,
  isUTCTimestamp,
  ColorType,
  CrosshairMode,
  LineStyle,
  LineType,
  PriceScaleMode,
  TickMarkType,
  TrackingModeExitMode,
  LastPriceAnimationMode,
  PriceLineSource,
  MismatchDirection,
  AreaSeries,
  BarSeries,
  BaselineSeries,
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
  customSeriesDefaultOptions,
  version,
  defaultHorzScaleBehavior,
  resetMocks,
};

export default lightweightChartsMock;
