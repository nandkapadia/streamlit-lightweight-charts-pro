import {createSeries} from '../seriesFactory'

// Mock lightweight-charts
jest.mock('lightweight-charts', () => {
  console.log('Mock factory function called')
  const mockChart = {
    addSeries: jest.fn().mockImplementation((seriesType, options, paneId) => {
      console.log(
        'Mock addSeries called with seriesType:',
        seriesType,
        'options:',
        options,
        'paneId:',
        paneId
      )
      return {
        setData: jest.fn(),
        update: jest.fn(),
        applyOptions: jest.fn(),
        priceFormatter: jest.fn().mockReturnValue(value => value.toFixed(2)),
        priceToCoordinate: jest.fn().mockReturnValue(100),
        coordinateToPrice: jest.fn().mockReturnValue(50),
        barsInLogicalRange: jest.fn().mockReturnValue({barsBefore: 0, barsAfter: 0}),
        data: jest.fn().mockReturnValue([]),
        dataByIndex: jest.fn().mockReturnValue(null),
        subscribeDataChanged: jest.fn(),
        unsubscribeDataChanged: jest.fn(),
        seriesType: jest.fn().mockReturnValue('Line'),
        attachPrimitive: jest.fn(),
        detachPrimitive: jest.fn(),
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
            getVisibleRange: jest.fn().mockReturnValue({from: 0, to: 100}),
            setAutoScale: jest.fn()
          }),
          setPreserveEmptyPane: jest.fn(),
          preserveEmptyPane: jest.fn().mockReturnValue(false),
          addCustomSeries: jest.fn(),
          addSeries: jest.fn()
        }),
        moveToPane: jest.fn(),
        seriesOrder: jest.fn().mockReturnValue(0),
        setSeriesOrder: jest.fn(),
        createPriceLine: jest.fn().mockReturnValue({
          applyOptions: jest.fn(),
          options: jest.fn().mockReturnValue({}),
          remove: jest.fn()
        }),
        removePriceLine: jest.fn(),
        priceLines: jest.fn().mockReturnValue([])
      }
    }),
    removeSeries: jest.fn(),
    addCustomSeries: jest.fn().mockReturnValue({
      setData: jest.fn(),
      update: jest.fn(),
      applyOptions: jest.fn(),
      seriesType: jest.fn().mockReturnValue('Custom')
    }),
    remove: jest.fn(),
    resize: jest.fn(),
    applyOptions: jest.fn(),
    options: jest.fn().mockReturnValue({
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
    timeScale: jest.fn().mockReturnValue({
      scrollPosition: jest.fn().mockReturnValue(0),
      scrollToPosition: jest.fn(),
      scrollToRealTime: jest.fn(),
      getVisibleRange: jest.fn().mockReturnValue({from: 0, to: 100}),
      setVisibleRange: jest.fn(),
      getVisibleLogicalRange: jest.fn().mockReturnValue({from: 0, to: 100}),
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
        rightOffset: 0
      })
    }),
    priceScale: jest.fn().mockReturnValue({
      applyOptions: jest.fn(),
      options: jest.fn().mockReturnValue({}),
      width: jest.fn().mockReturnValue(100),
      setVisibleRange: jest.fn(),
      getVisibleRange: jest.fn().mockReturnValue({from: 0, to: 100}),
      setAutoScale: jest.fn()
    }),
    subscribeClick: jest.fn(),
    unsubscribeClick: jest.fn(),
    subscribeCrosshairMove: jest.fn(),
    unsubscribeCrosshairMove: jest.fn(),
    subscribeDblClick: jest.fn(),
    unsubscribeDblClick: jest.fn(),
    takeScreenshot: jest.fn().mockReturnValue({}),
    addPane: jest.fn().mockReturnValue({
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
        getVisibleRange: jest.fn().mockReturnValue({from: 0, to: 100}),
        setAutoScale: jest.fn()
      }),
      setPreserveEmptyPane: jest.fn(),
      preserveEmptyPane: jest.fn().mockReturnValue(false),
      addCustomSeries: jest.fn(),
      addSeries: jest.fn()
    }),
    removePane: jest.fn(),
    swapPanes: jest.fn(),
    autoSizeActive: jest.fn().mockReturnValue(false),
    chartElement: jest.fn().mockReturnValue({}),
    panes: jest.fn().mockReturnValue([]),
    paneSize: jest.fn().mockReturnValue({width: 800, height: 400}),
    setCrosshairPosition: jest.fn(),
    clearCrosshairPosition: jest.fn(),
    horzBehaviour: jest.fn().mockReturnValue({
      options: jest.fn().mockReturnValue({}),
      setOptions: jest.fn()
    })
  }

  return {
    createChart: (container, options) => {
      console.log('Mock createChart called with container:', container, 'options:', options)
      console.log('Mock createChart returning mockChart:', mockChart)
      return mockChart
    },
    createChartEx: jest.fn().mockImplementation((container, horzScaleBehavior, options) => {
      console.log(
        'Mock createChartEx called with container:',
        container,
        'horzScaleBehavior:',
        horzScaleBehavior,
        'options:',
        options
      )
      return mockChart
    }),
    createSeries: jest.fn().mockImplementation((chart, seriesType, options) => {
      console.log(
        'Mock createSeries called with chart:',
        chart,
        'seriesType:',
        seriesType,
        'options:',
        options
      )
      return mockChart.addSeries(seriesType, options)
    }),
    isBusinessDay: jest.fn().mockImplementation(time => {
      return typeof time === 'object' && time.year && time.month && time.day
    }),
    isUTCTimestamp: jest.fn().mockImplementation(time => {
      return typeof time === 'number' && time > 0
    }),
    ColorType: {
      Solid: 'solid',
      VerticalGradient: 'gradient'
    },
    CrosshairMode: {
      Normal: 0,
      Hidden: 1
    },
    LineStyle: {
      Solid: 0,
      Dotted: 1,
      Dashed: 2,
      LargeDashed: 3,
      SparseDotted: 4
    },
    LineType: {
      Simple: 0,
      WithSteps: 1,
      Curved: 2
    },
    PriceScaleMode: {
      Normal: 0,
      Logarithmic: 1,
      Percentage: 2,
      IndexedTo100: 3
    },
    TickMarkType: {
      Year: 0,
      Month: 1,
      DayOfMonth: 2,
      Time: 3,
      TimeWithSeconds: 4
    },
    TrackingModeExitMode: {
      OnTouchEnd: 0,
      OnMouseLeave: 1
    },
    LastPriceAnimationMode: {
      Disabled: 0,
      Continuous: 1,
      OnDataUpdate: 2
    },
    PriceLineSource: {
      LastBar: 0,
      LastVisible: 1
    },
    MismatchDirection: {
      NearestLeft: 0,
      NearestRight: 1
    },
    AreaSeries: 'Area',
    BarSeries: 'Bar',
    BaselineSeries: 'Baseline',
    CandlestickSeries: 'Candlestick',
    HistogramSeries: 'Histogram',
    LineSeries: 'Line',
    customSeriesDefaultOptions: {
      color: '#2196f3'
    },
    version: '5.0.8',
    defaultHorzScaleBehavior: {
      options: jest.fn().mockReturnValue({}),
      setOptions: jest.fn()
    }
  }
})

import {createChart} from 'lightweight-charts'

// Create a simple mock chart object
const mockChart = {
  addSeries: jest.fn().mockReturnValue({
    setData: jest.fn(),
    update: jest.fn(),
    applyOptions: jest.fn(),
    options: jest.fn().mockReturnValue({}),
    priceFormatter: jest.fn().mockReturnValue(value => value.toFixed(2)),
    priceToCoordinate: jest.fn().mockReturnValue(50),
    coordinateToPrice: jest.fn().mockReturnValue(100),
    barsInLogicalRange: jest.fn().mockReturnValue({barsBefore: 0, barsAfter: 0}),
    dataByIndex: jest.fn().mockReturnValue({time: '2024-01-01', value: 100}),
    data: jest.fn().mockReturnValue([]),
    subscribeDataChanged: jest.fn(),
    unsubscribeDataChanged: jest.fn(),
    createPriceLine: jest.fn().mockReturnValue({
      applyOptions: jest.fn(),
      options: jest.fn().mockReturnValue({}),
      remove: jest.fn()
    }),
    removePriceLine: jest.fn(),
    priceLines: jest.fn().mockReturnValue([]),
    seriesType: jest.fn().mockReturnValue('Line'),
    attachPrimitive: jest.fn(),
    detachPrimitive: jest.fn(),
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
        getVisibleRange: jest.fn().mockReturnValue({from: 0, to: 100}),
        setAutoScale: jest.fn()
      }),
      setPreserveEmptyPane: jest.fn(),
      preserveEmptyPane: jest.fn().mockReturnValue(false),
      addCustomSeries: jest.fn(),
      addSeries: jest.fn()
    }),
    moveToPane: jest.fn(),
    seriesOrder: jest.fn().mockReturnValue(0),
    setSeriesOrder: jest.fn()
  }),
  remove: jest.fn(),
  resize: jest.fn(),
  applyOptions: jest.fn(),
  options: jest.fn().mockReturnValue({}),
  takeScreenshot: jest.fn().mockReturnValue({}),
  addPane: jest.fn().mockReturnValue({
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
      getVisibleRange: jest.fn().mockReturnValue({from: 0, to: 100}),
      setAutoScale: jest.fn()
    }),
    setPreserveEmptyPane: jest.fn(),
    preserveEmptyPane: jest.fn().mockReturnValue(false),
    addCustomSeries: jest.fn(),
    addSeries: jest.fn()
  }),
  removePane: jest.fn(),
  swapPanes: jest.fn(),
  autoSizeActive: jest.fn().mockReturnValue(false),
  chartElement: jest.fn().mockReturnValue({}),
  panes: jest.fn().mockReturnValue([]),
  paneSize: jest.fn().mockReturnValue({height: 400, width: 800}),
  setCrosshairPosition: jest.fn(),
  clearCrosshairPosition: jest.fn(),
  horzBehaviour: jest.fn().mockReturnValue({})
}

// Create a real chart instance for testing
const createTestChart = () => {
  const container = document.createElement('div')
  container.style.width = '800px'
  container.style.height = '400px'
  document.body.appendChild(container)

  console.log('createChart import:', createChart)
  console.log('createChart type:', typeof createChart)
  console.log('Calling createChart with container:', container)
  const chart = createChart(container, {
    layout: {
      attributionLogo: false
    }
  })
  console.log('createChart returned:', chart)

  return {chart, container}
}

describe('Series Factory', () => {
  let chart: any
  let container: HTMLElement

  beforeEach(() => {
    jest.clearAllMocks()
    const testChart = createTestChart()
    chart = testChart.chart
    container = testChart.container
    console.log('Chart in beforeEach:', chart)
    console.log('Chart type:', typeof chart)
    console.log('Chart addSeries:', chart?.addSeries)
  })

  afterEach(() => {
    if (chart) {
      chart.remove()
    }
    if (container && container.parentNode) {
      container.parentNode.removeChild(container)
    }
  })

  describe('Line Series', () => {
    it('should create line series with basic data', () => {
      // First test if the mock is working
      console.log('Testing mock createChart directly...')
      const testChart = createChart(document.createElement('div'), {})
      console.log('Direct createChart call result:', testChart)

      const seriesConfig = {
        type: 'Line' as const,
        data: [
          {time: '2024-01-01', value: 100},
          {time: '2024-01-02', value: 110},
          {time: '2024-01-03', value: 105}
        ],
        options: {
          color: '#ff0000',
          lineWidth: 2
        }
      }

      const series = createSeries(chart, seriesConfig)
      expect(series).toBeDefined()
    })

    it('should create line series with custom options', () => {
      const seriesConfig = {
        type: 'Line' as const,
        data: [
          {time: '2024-01-01', value: 100},
          {time: '2024-01-02', value: 110}
        ],
        options: {
          color: '#00ff00',
          lineWidth: 3,
          lineStyle: 1, // Dashed
          crosshairMarkerVisible: true,
          lastValueVisible: true,
          priceLineVisible: true
        }
      }

      const series = createSeries(chart, seriesConfig)
      expect(series).toBeDefined()
    })

    it('should handle empty line series data', () => {
      const seriesConfig = {
        type: 'Line' as const,
        data: [],
        options: {}
      }

      const series = createSeries(chart, seriesConfig)
      expect(series).toBeDefined()
    })
  })

  describe('Candlestick Series', () => {
    it('should create candlestick series with OHLC data', () => {
      const seriesConfig = {
        type: 'Candlestick' as const,
        data: [
          {
            time: '2024-01-01',
            open: 100,
            high: 110,
            low: 95,
            close: 105
          },
          {
            time: '2024-01-02',
            open: 105,
            high: 115,
            low: 100,
            close: 110
          }
        ],
        options: {
          upColor: '#00ff00',
          downColor: '#ff0000',
          borderVisible: true,
          wickVisible: true
        }
      }

      const series = createSeries(chart, seriesConfig)
      expect(series).toBeDefined()
    })

    it('should create candlestick series with custom styling', () => {
      const seriesConfig = {
        type: 'Candlestick' as const,
        data: [
          {
            time: '2024-01-01',
            open: 100,
            high: 110,
            low: 95,
            close: 105
          }
        ],
        options: {
          upColor: '#00ff00',
          downColor: '#ff0000',
          borderUpColor: '#008000',
          borderDownColor: '#800000',
          wickUpColor: '#00ff00',
          wickDownColor: '#ff0000'
        }
      }

      const series = createSeries(chart, seriesConfig)
      expect(series).toBeDefined()
    })
  })

  describe('Area Series', () => {
    it('should create area series with basic data', () => {
      const seriesConfig = {
        type: 'Area' as const,
        data: [
          {time: '2024-01-01', value: 100},
          {time: '2024-01-02', value: 110},
          {time: '2024-01-03', value: 105}
        ],
        options: {
          topColor: 'rgba(255, 0, 0, 0.5)',
          bottomColor: 'rgba(255, 0, 0, 0.1)',
          lineColor: '#ff0000',
          lineWidth: 2
        }
      }

      const series = createSeries(chart, seriesConfig)
      expect(series).toBeDefined()
    })

    it('should create area series with gradient', () => {
      const seriesConfig = {
        type: 'Area' as const,
        data: [
          {time: '2024-01-01', value: 100},
          {time: '2024-01-02', value: 110}
        ],
        options: {
          topColor: 'rgba(0, 255, 0, 0.8)',
          bottomColor: 'rgba(0, 255, 0, 0.2)',
          lineColor: '#00ff00',
          lineWidth: 1,
          crosshairMarkerVisible: true
        }
      }

      const series = createSeries(chart, seriesConfig)
      expect(series).toBeDefined()
    })
  })

  describe('Histogram Series', () => {
    it('should create histogram series with volume data', () => {
      const seriesConfig = {
        type: 'Histogram' as const,
        data: [
          {time: '2024-01-01', value: 1000000, color: '#00ff00'},
          {time: '2024-01-02', value: 1500000, color: '#ff0000'},
          {time: '2024-01-03', value: 800000, color: '#00ff00'}
        ],
        options: {
          color: '#888888',
          priceFormat: {
            type: 'volume'
          },
          priceScaleId: 'volume'
        }
      }

      const series = createSeries(chart, seriesConfig)
      expect(series).toBeDefined()
    })

    it('should create histogram series with custom colors', () => {
      const seriesConfig = {
        type: 'Histogram' as const,
        data: [
          {time: '2024-01-01', value: 1000000, color: '#00ff00'},
          {time: '2024-01-02', value: 1500000, color: '#ff0000'}
        ],
        options: {
          color: '#888888',
          priceFormat: {
            type: 'volume'
          },
          priceScaleId: 'volume',
          scaleMargins: {
            top: 0.8,
            bottom: 0
          }
        }
      }

      const series = createSeries(chart, seriesConfig)
      expect(series).toBeDefined()
    })
  })

  describe('Baseline Series', () => {
    it('should create baseline series with reference data', () => {
      const seriesConfig = {
        type: 'Baseline' as const,
        data: [
          {time: '2024-01-01', value: 100},
          {time: '2024-01-02', value: 110},
          {time: '2024-01-03', value: 105}
        ],
        options: {
          baseValue: {price: 100},
          topFillColor: 'rgba(0, 255, 0, 0.3)',
          bottomFillColor: 'rgba(255, 0, 0, 0.3)',
          topLineColor: '#00ff00',
          bottomLineColor: '#ff0000',
          lineWidth: 2
        }
      }

      const series = createSeries(chart, seriesConfig)
      expect(series).toBeDefined()
    })

    it('should create baseline series with custom baseline', () => {
      const seriesConfig = {
        type: 'Baseline' as const,
        data: [
          {time: '2024-01-01', value: 100},
          {time: '2024-01-02', value: 110}
        ],
        options: {
          baseValue: {price: 105},
          topFillColor: 'rgba(0, 255, 0, 0.5)',
          bottomFillColor: 'rgba(255, 0, 0, 0.5)',
          topLineColor: '#00ff00',
          bottomLineColor: '#ff0000',
          lineWidth: 1
        }
      }

      const series = createSeries(chart, seriesConfig)
      expect(series).toBeDefined()
    })
  })

  describe('Band Series', () => {
    it('should create band series with upper and lower data', () => {
      const seriesConfig = {
        type: 'Band' as const,
        data: [
          {
            time: '2024-01-01',
            upper: 110,
            lower: 90
          },
          {
            time: '2024-01-02',
            upper: 115,
            lower: 95
          }
        ],
        options: {
          upperColor: 'rgba(0, 255, 0, 0.3)',
          lowerColor: 'rgba(255, 0, 0, 0.3)',
          lineColor: '#888888',
          lineWidth: 1
        }
      }

      const series = createSeries(chart, seriesConfig)
      expect(series).toBeDefined()
    })

    it('should create band series with custom styling', () => {
      const seriesConfig = {
        type: 'Band' as const,
        data: [
          {
            time: '2024-01-01',
            upper: 110,
            lower: 90
          }
        ],
        options: {
          upperColor: 'rgba(0, 255, 0, 0.5)',
          lowerColor: 'rgba(255, 0, 0, 0.5)',
          lineColor: '#888888',
          lineWidth: 2,
          crosshairMarkerVisible: true
        }
      }

      const series = createSeries(chart, seriesConfig)
      expect(series).toBeDefined()
    })
  })

  describe('Series Configuration', () => {
    it('should handle series with price scale configuration', () => {
      const seriesConfig = {
        type: 'Line' as const,
        data: [
          {time: '2024-01-01', value: 100},
          {time: '2024-01-02', value: 110}
        ],
        options: {
          color: '#ff0000',
          priceScaleId: 'right'
        }
      }

      const series = createSeries(chart, seriesConfig)
      expect(series).toBeDefined()
    })

    it('should handle series with time scale configuration', () => {
      const seriesConfig = {
        type: 'Line' as const,
        data: [
          {time: '2024-01-01', value: 100},
          {time: '2024-01-02', value: 110}
        ],
        options: {
          color: '#ff0000',
          timeScaleId: 'time'
        }
      }

      const series = createSeries(chart, seriesConfig)
      expect(series).toBeDefined()
    })

    it('should handle series with autoscale info', () => {
      const seriesConfig = {
        type: 'Line' as const,
        data: [
          {time: '2024-01-01', value: 100},
          {time: '2024-01-02', value: 110}
        ],
        options: {
          color: '#ff0000',
          autoscaleInfoProvider: () => ({
            priceRange: {minValue: 90, maxValue: 120},
            margins: {above: 0.1, below: 0.1}
          })
        }
      }

      const series = createSeries(chart, seriesConfig)
      expect(series).toBeDefined()
    })
  })

  describe('Data Validation', () => {
    it('should handle invalid series type', () => {
      const seriesConfig = {
        type: 'invalid' as any,
        data: [{time: '2024-01-01', value: 100}],
        options: {}
      }

      expect(() => {
        createSeries(chart, seriesConfig)
      }).toThrow()
    })

    it('should handle null data', () => {
      const seriesConfig = {
        type: 'Line' as const,
        data: null,
        options: {}
      }

      const series = createSeries(chart, seriesConfig)
      expect(series).toBeDefined()
    })

    it('should handle undefined data', () => {
      const seriesConfig = {
        type: 'Line' as const,
        data: undefined,
        options: {}
      }

      const series = createSeries(chart, seriesConfig)
      expect(series).toBeDefined()
    })

    it('should handle malformed data', () => {
      const seriesConfig = {
        type: 'Line' as const,
        data: [
          {time: '2024-01-01'}, // Missing value
          {value: 100}, // Missing time
          {time: '2024-01-03', value: 'invalid'} // Invalid value
        ],
        options: {}
      }

      const series = createSeries(chart, seriesConfig)
      expect(series).toBeDefined()
    })
  })

  describe('Performance', () => {
    it('should handle large datasets efficiently', () => {
      const largeData = Array.from({length: 10000}, (_, i) => ({
        time: `2024-01-${String(i + 1).padStart(2, '0')}`,
        value: 100 + Math.random() * 20
      }))

      const seriesConfig = {
        type: 'Line' as const,
        data: largeData,
        options: {
          color: '#ff0000'
        }
      }

      const series = createSeries(chart, seriesConfig)
      expect(series).toBeDefined()
    })

    it('should handle multiple series creation', () => {
      const seriesConfigs = [
        {
          type: 'Line' as const,
          data: [
            {time: '2024-01-01', value: 100},
            {time: '2024-01-02', value: 110}
          ],
          options: {color: '#ff0000'}
        },
        {
          type: 'Area' as const,
          data: [
            {time: '2024-01-01', value: 90},
            {time: '2024-01-02', value: 100}
          ],
          options: {color: '#00ff00'}
        },
        {
          type: 'Histogram' as const,
          data: [
            {time: '2024-01-01', value: 1000000},
            {time: '2024-01-02', value: 1500000}
          ],
          options: {color: '#0000ff'}
        }
      ]

      seriesConfigs.forEach(config => {
        const series = createSeries(chart, config)
        expect(series).toBeDefined()
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle missing chart', () => {
      const seriesConfig = {
        type: 'Line' as const,
        data: [{time: '2024-01-01', value: 100}],
        options: {}
      }

      expect(() => {
        createSeries(null as any, seriesConfig)
      }).toThrow()
    })

    it('should handle missing series configuration', () => {
      expect(() => {
        createSeries(chart, null as any)
      }).toThrow()
    })

    it('should handle missing series type', () => {
      const seriesConfig = {
        data: [{time: '2024-01-01', value: 100}],
        options: {}
      } as any

      expect(() => {
        createSeries(chart, seriesConfig)
      }).toThrow()
    })

    it('should handle chart without required methods', () => {
      const invalidChart = {
        // Missing required methods
      }

      const seriesConfig = {
        type: 'Line' as const,
        data: [{time: '2024-01-01', value: 100}],
        options: {}
      }

      expect(() => {
        createSeries(invalidChart as any, seriesConfig)
      }).toThrow()
    })
  })
})
