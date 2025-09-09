// Mock for lightweight-charts library
// This mock provides a working implementation for testing

console.log('Lightweight-charts mock loaded')

// Helper function to create mock functions
const createMockFn = returnValue => {
  const fn = function (...args) {
    console.log('Mock function called with args:', args)
    return typeof returnValue === 'function' ? returnValue(...args) : returnValue
  }
  fn.mockReturnValue = value => {
    fn._returnValue = value
    return fn
  }
  fn.mockImplementation = impl => {
    fn._implementation = impl
    return fn
  }
  return fn
}

// Mock chart instance
const mockChart = {
  addSeries: createMockFn({
    setData: createMockFn(),
    update: createMockFn(),
    applyOptions: createMockFn(),
    priceFormatter: createMockFn(value => value.toFixed(2)),
    priceToCoordinate: createMockFn(100),
    coordinateToPrice: createMockFn(50),
    barsInLogicalRange: createMockFn({barsBefore: 0, barsAfter: 0}),
    data: createMockFn([]),
    dataByIndex: createMockFn(null),
    subscribeDataChanged: createMockFn(),
    unsubscribeDataChanged: createMockFn(),
    seriesType: createMockFn('Line'),
    attachPrimitive: createMockFn(),
    detachPrimitive: createMockFn(),
    getPane: createMockFn({
      getHeight: createMockFn(400),
      setHeight: createMockFn(),
      getStretchFactor: createMockFn(1),
      setStretchFactor: createMockFn(),
      paneIndex: createMockFn(0),
      moveTo: createMockFn(),
      getSeries: createMockFn([]),
      getHTMLElement: createMockFn({}),
      attachPrimitive: createMockFn(),
      detachPrimitive: createMockFn(),
      priceScale: createMockFn({
        applyOptions: createMockFn(),
        options: createMockFn({}),
        width: createMockFn(100),
        setVisibleRange: createMockFn(),
        getVisibleRange: createMockFn({from: 0, to: 100}),
        setAutoScale: createMockFn()
      }),
      setPreserveEmptyPane: createMockFn(),
      preserveEmptyPane: createMockFn(false),
      addCustomSeries: createMockFn(),
      addSeries: createMockFn()
    }),
    moveToPane: createMockFn(),
    seriesOrder: createMockFn(0),
    setSeriesOrder: createMockFn(),
    createPriceLine: createMockFn({
      applyOptions: createMockFn(),
      options: createMockFn({}),
      remove: createMockFn()
    }),
    removePriceLine: createMockFn(),
    priceLines: createMockFn([])
  }),
  removeSeries: createMockFn(),
  addCustomSeries: createMockFn({
    setData: createMockFn(),
    update: createMockFn(),
    applyOptions: createMockFn(),
    seriesType: createMockFn('Custom')
  }),
  remove: createMockFn(),
  resize: createMockFn(),
  applyOptions: createMockFn(),
  options: createMockFn({
    layout: {
      background: {type: 'solid', color: '#FFFFFF'},
      textColor: '#191919',
      fontSize: 12,
      fontFamily: 'Arial'
    },
    crosshair: {
      mode: 1,
      vertLine: {visible: true},
      horzLine: {visible: true}
    },
    grid: {
      vertLines: {visible: true},
      horzLines: {visible: true}
    },
    timeScale: {
      visible: true,
      timeVisible: false,
      secondsVisible: false
    },
    rightPriceScale: {
      visible: true,
      autoScale: true
    },
    leftPriceScale: {
      visible: false,
      autoScale: true
    }
  }),
  timeScale: createMockFn({
    scrollPosition: createMockFn(0),
    scrollToPosition: createMockFn(),
    scrollToRealTime: createMockFn(),
    getVisibleRange: createMockFn({from: 0, to: 100}),
    setVisibleRange: createMockFn(),
    getVisibleLogicalRange: createMockFn({from: 0, to: 100}),
    setVisibleLogicalRange: createMockFn(),
    resetTimeScale: createMockFn(),
    fitContent: createMockFn(),
    logicalToCoordinate: createMockFn(100),
    coordinateToLogical: createMockFn(0),
    timeToIndex: createMockFn(0),
    timeToCoordinate: createMockFn(100),
    coordinateToTime: createMockFn(0),
    width: createMockFn(800),
    height: createMockFn(400),
    subscribeVisibleTimeRangeChange: createMockFn(),
    unsubscribeVisibleTimeRangeChange: createMockFn(),
    subscribeVisibleLogicalRangeChange: createMockFn(),
    unsubscribeVisibleLogicalRangeChange: createMockFn(),
    subscribeSizeChange: createMockFn(),
    unsubscribeSizeChange: createMockFn(),
    applyOptions: createMockFn(),
    options: createMockFn({
      barSpacing: 6,
      rightOffset: 0
    })
  }),
  priceScale: createMockFn({
    applyOptions: createMockFn(),
    options: createMockFn({}),
    width: createMockFn(100),
    setVisibleRange: createMockFn(),
    getVisibleRange: createMockFn({from: 0, to: 100}),
    setAutoScale: createMockFn()
  }),
  subscribeClick: createMockFn(),
  unsubscribeClick: createMockFn(),
  subscribeCrosshairMove: createMockFn(),
  unsubscribeCrosshairMove: createMockFn(),
  subscribeDblClick: createMockFn(),
  unsubscribeDblClick: createMockFn(),
  takeScreenshot: createMockFn({}),
  addPane: createMockFn({
    getHeight: createMockFn(400),
    setHeight: createMockFn(),
    getStretchFactor: createMockFn(1),
    setStretchFactor: createMockFn(),
    paneIndex: createMockFn(0),
    moveTo: createMockFn(),
    getSeries: createMockFn([]),
    getHTMLElement: createMockFn({}),
    attachPrimitive: createMockFn(),
    detachPrimitive: createMockFn(),
    priceScale: createMockFn({
      applyOptions: createMockFn(),
      options: createMockFn({}),
      width: createMockFn(100),
      setVisibleRange: createMockFn(),
      getVisibleRange: createMockFn({from: 0, to: 100}),
      setAutoScale: createMockFn()
    }),
    setPreserveEmptyPane: createMockFn(),
    preserveEmptyPane: createMockFn(false),
    addCustomSeries: createMockFn(),
    addSeries: createMockFn()
  }),
  removePane: createMockFn(),
  swapPanes: createMockFn(),
  autoSizeActive: createMockFn(false),
  chartElement: createMockFn({}),
  panes: createMockFn([]),
  paneSize: createMockFn({width: 800, height: 400}),
  setCrosshairPosition: createMockFn(),
  clearCrosshairPosition: createMockFn(),
  horzBehaviour: createMockFn({
    options: createMockFn({}),
    setOptions: createMockFn()
  })
}

// Mock createChart function
const createChart = (container, options) => {
  console.log('Mock createChart called with container:', container, 'options:', options)
  console.log('Mock createChart returning mockChart:', mockChart)
  return mockChart
}

// Mock createChartEx function
const createChartEx = (container, horzScaleBehavior, options) => {
  console.log(
    'Mock createChartEx called with container:',
    container,
    'horzScaleBehavior:',
    horzScaleBehavior,
    'options:',
    options
  )
  return mockChart
}

// Mock series factory functions
const createSeries = (chart, seriesType, options) => {
  console.log(
    'Mock createSeries called with chart:',
    chart,
    'seriesType:',
    seriesType,
    'options:',
    options
  )
  return mockChart.addSeries(seriesType, options)
}

// Mock utility functions
const isBusinessDay = time => {
  return typeof time === 'object' && time.year && time.month && time.day
}

const isUTCTimestamp = time => {
  return typeof time === 'number' && time > 0
}

// Mock enums and constants
const ColorType = {
  Solid: 'solid',
  VerticalGradient: 'gradient'
}

const CrosshairMode = {
  Normal: 0,
  Hidden: 1
}

const LineStyle = {
  Solid: 0,
  Dotted: 1,
  Dashed: 2,
  LargeDashed: 3,
  SparseDotted: 4
}

const LineType = {
  Simple: 0,
  WithSteps: 1,
  Curved: 2
}

const PriceScaleMode = {
  Normal: 0,
  Logarithmic: 1,
  Percentage: 2,
  IndexedTo100: 3
}

const TickMarkType = {
  Year: 0,
  Month: 1,
  DayOfMonth: 2,
  Time: 3,
  TimeWithSeconds: 4
}

const TrackingModeExitMode = {
  OnTouchEnd: 0,
  OnMouseLeave: 1
}

const LastPriceAnimationMode = {
  Disabled: 0,
  Continuous: 1,
  OnDataUpdate: 2
}

const PriceLineSource = {
  LastBar: 0,
  LastVisible: 1
}

const MismatchDirection = {
  NearestLeft: 0,
  NearestRight: 1
}

// Mock series types
const AreaSeries = 'Area'
const BarSeries = 'Bar'
const BaselineSeries = 'Baseline'
const CandlestickSeries = 'Candlestick'
const HistogramSeries = 'Histogram'
const LineSeries = 'Line'

// Mock default options
const customSeriesDefaultOptions = {
  color: '#2196f3'
}

// Mock version
const version = '5.0.8'

// Mock default horz scale behavior
const defaultHorzScaleBehavior = {
  options: jest.fn().mockReturnValue({}),
  setOptions: jest.fn()
}

// Export all mocks
module.exports = {
  createChart,
  createChartEx,
  createSeries,
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
  // Additional exports that might be needed
  createImageWatermark: jest.fn(),
  createSeriesMarkers: jest.fn(),
  createTextWatermark: jest.fn(),
  createUpDownMarkers: jest.fn(),
  createYieldCurveChart: jest.fn(),
  createOptionsChart: jest.fn()
}
