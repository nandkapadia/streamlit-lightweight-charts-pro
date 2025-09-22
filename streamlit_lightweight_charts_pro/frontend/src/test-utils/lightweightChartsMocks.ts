/**
 * Unified mock system for lightweight-charts
 * Following TESTING_INFRASTRUCTURE_STRATEGY.md recommendations
 */

// Mock series object with all required methods
export const mockSeries = {
  setData: jest.fn(),
  update: jest.fn(),
  applyOptions: jest.fn(),
  options: jest.fn().mockReturnValue({}),
  priceFormatter: jest.fn().mockReturnValue((value: number) => value.toFixed(2)),
  priceToCoordinate: jest.fn().mockReturnValue(100),
  coordinateToPrice: jest.fn().mockReturnValue(50),
  barsInLogicalRange: jest.fn().mockReturnValue({ barsBefore: 0, barsAfter: 0 }),
  data: jest.fn().mockReturnValue([]),
  dataByIndex: jest.fn().mockReturnValue(null),
  subscribeDataChanged: jest.fn(),
  unsubscribeDataChanged: jest.fn(),
  seriesType: jest.fn().mockReturnValue('Line'),
  attachPrimitive: jest.fn(),
  detachPrimitive: jest.fn(),
  createPriceLine: jest.fn().mockReturnValue({
    applyOptions: jest.fn(),
    options: jest.fn().mockReturnValue({}),
    remove: jest.fn(),
  }),
  removePriceLine: jest.fn(),
  priceLines: jest.fn().mockReturnValue([]),
  moveToPane: jest.fn(),
  seriesOrder: jest.fn().mockReturnValue(0),
  setSeriesOrder: jest.fn(),
  getPane: jest.fn().mockReturnValue({
    getHeight: jest.fn().mockReturnValue(400),
    setHeight: jest.fn(),
    getStretchFactor: jest.fn().mockReturnValue(1),
    setStretchFactor: jest.fn(),
    paneIndex: jest.fn().mockReturnValue(0),
    moveTo: jest.fn(),
    getSeries: jest.fn().mockReturnValue([]),
    getHTMLElement: jest.fn().mockReturnValue({}),
    attachPrimitive: jest.fn(),
    detachPrimitive: jest.fn(),
    priceScale: jest.fn().mockReturnValue({
      applyOptions: jest.fn(),
      options: jest.fn().mockReturnValue({}),
      width: jest.fn().mockReturnValue(100),
      setVisibleRange: jest.fn(),
      getVisibleRange: jest.fn().mockReturnValue({ from: 0, to: 100 }),
      setAutoScale: jest.fn(),
    }),
    setPreserveEmptyPane: jest.fn(),
    preserveEmptyPane: jest.fn().mockReturnValue(false),
    addCustomSeries: jest.fn(),
    addSeries: jest.fn(),
  }),
};

// Mock price scale
export const mockPriceScale = {
  applyOptions: jest.fn(),
  options: jest.fn().mockReturnValue({}),
  width: jest.fn().mockReturnValue(100),
  setVisibleRange: jest.fn(),
  getVisibleRange: jest.fn().mockReturnValue({ from: 0, to: 100 }),
  setAutoScale: jest.fn(),
};

// Mock time scale
export const mockTimeScale = {
  scrollPosition: jest.fn().mockReturnValue(0),
  scrollToPosition: jest.fn(),
  scrollToRealTime: jest.fn(),
  getVisibleRange: jest.fn().mockReturnValue({ from: 0, to: 100 }),
  setVisibleRange: jest.fn(),
  getVisibleLogicalRange: jest.fn().mockReturnValue({ from: 0, to: 100 }),
  setVisibleLogicalRange: jest.fn(),
  resetTimeScale: jest.fn(),
  fitContent: jest.fn(),
  logicalToCoordinate: jest.fn().mockReturnValue(100),
  coordinateToLogical: jest.fn().mockReturnValue(0),
  timeToIndex: jest.fn().mockReturnValue(0),
  timeToCoordinate: jest.fn().mockReturnValue(100),
  coordinateToTime: jest.fn().mockReturnValue(0),
  width: jest.fn().mockReturnValue(800),
  height: jest.fn().mockReturnValue(400),
  subscribeVisibleTimeRangeChange: jest.fn(),
  unsubscribeVisibleTimeRangeChange: jest.fn(),
  subscribeVisibleLogicalRangeChange: jest.fn(),
  unsubscribeVisibleLogicalRangeChange: jest.fn(),
  subscribeSizeChange: jest.fn(),
  unsubscribeSizeChange: jest.fn(),
  applyOptions: jest.fn(),
  options: jest.fn().mockReturnValue({
    barSpacing: 6,
    rightOffset: 0,
  }),
};

// Mock pane
export const mockPane = {
  getHeight: jest.fn().mockReturnValue(400),
  setHeight: jest.fn(),
  getStretchFactor: jest.fn().mockReturnValue(1),
  setStretchFactor: jest.fn(),
  paneIndex: jest.fn().mockReturnValue(0),
  moveTo: jest.fn(),
  getSeries: jest.fn().mockReturnValue([]),
  getHTMLElement: jest.fn().mockReturnValue({}),
  attachPrimitive: jest.fn(),
  detachPrimitive: jest.fn(),
  priceScale: jest.fn().mockReturnValue(mockPriceScale),
  setPreserveEmptyPane: jest.fn(),
  preserveEmptyPane: jest.fn().mockReturnValue(false),
  addCustomSeries: jest.fn(),
  addSeries: jest.fn(),
};

// Main mock chart object
export const mockChart = {
  // Series methods
  addSeries: jest.fn().mockImplementation((seriesType, options, paneId) => {
    return mockSeries;
  }),
  removeSeries: jest.fn(),
  addCustomSeries: jest.fn().mockReturnValue(mockSeries),

  // Chart methods
  remove: jest.fn(),
  resize: jest.fn(),
  applyOptions: jest.fn(),
  options: jest.fn().mockReturnValue({
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
  timeScale: jest.fn().mockReturnValue(mockTimeScale),
  priceScale: jest.fn().mockReturnValue(mockPriceScale),

  // Event methods
  subscribeCrosshairMove: jest.fn(),
  unsubscribeCrosshairMove: jest.fn(),
  subscribeClick: jest.fn(),
  unsubscribeClick: jest.fn(),
  subscribeDblClick: jest.fn(),
  unsubscribeDblClick: jest.fn(),

  // Screenshot and utilities
  takeScreenshot: jest.fn().mockReturnValue({}),
  chartElement: jest.fn().mockReturnValue({}),

  // Pane methods
  addPane: jest.fn().mockReturnValue(mockPane),
  removePane: jest.fn(),
  swapPanes: jest.fn(),
  panes: jest.fn().mockReturnValue([mockPane]),
  paneSize: jest.fn().mockReturnValue({ width: 800, height: 400 }),

  // Crosshair methods
  setCrosshairPosition: jest.fn(),
  clearCrosshairPosition: jest.fn(),

  // Miscellaneous
  autoSizeActive: jest.fn().mockReturnValue(false),
  horzBehaviour: jest.fn().mockReturnValue({
    options: jest.fn().mockReturnValue({}),
    setOptions: jest.fn(),
  }),
};

// Mock createChart function
export const createChart = jest.fn().mockImplementation((container, options) => {
  return mockChart;
});

// Mock createChartEx function
export const createChartEx = jest.fn().mockImplementation((container, horzScaleBehavior, options) => {
  return mockChart;
});

// Mock utility functions
export const isBusinessDay = jest.fn().mockImplementation((time) => {
  return typeof time === 'object' && time.year && time.month && time.day;
});

export const isUTCTimestamp = jest.fn().mockImplementation((time) => {
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
  options: jest.fn().mockReturnValue({}),
  setOptions: jest.fn(),
};

// Reset function for tests
export const resetMocks = () => {
  jest.clearAllMocks();
  createChart.mockImplementation((container, options) => mockChart);
  mockChart.addSeries.mockImplementation((seriesType, options, paneId) => mockSeries);
};

// Default export for jest.mock()
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