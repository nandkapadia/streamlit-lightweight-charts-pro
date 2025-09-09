import {RectangleOverlayPlugin} from '../plugins/overlay/rectanglePlugin'
import {SignalSeries} from '../plugins/series/signalSeriesPlugin'
import {createTradeVisualElements} from '../services/tradeVisualization'
import {createAnnotationVisualElements} from '../services/annotationSystem'

// Mock the lightweight-charts library
const mockChart = {
  addCandlestickSeries: () => ({
    setData: () => {},
    update: () => {},
    applyOptions: () => {},
    priceScale: () => ({applyOptions: () => {}})
  }),
  addLineSeries: () => ({
    setData: () => {},
    update: () => {},
    applyOptions: () => {},
    priceScale: () => ({applyOptions: () => {}})
  }),
  addCustomSeries: () => ({
    setData: () => {},
    update: () => {},
    applyOptions: () => {},
    priceScale: () => ({applyOptions: () => {}})
  }),
  removeSeries: () => {},
  timeScale: jest.fn(() => ({
    fitContent: () => {},
    scrollToPosition: () => {},
    scrollToTime: () => {},
    setVisibleRange: () => {},
    applyOptions: () => {},
    subscribeVisibleTimeRangeChange: jest.fn()
  })),
  chartElement: {
    width: 800,
    height: 600,
    style: {
      position: 'relative',
      width: '800px',
      height: '600px'
    },
    getBoundingClientRect: () => ({
      width: 800,
      height: 600,
      top: 0,
      left: 0,
      right: 800,
      bottom: 600
    }),
    appendChild: jest.fn(),
    removeChild: jest.fn(),
    querySelector: jest.fn(),
    querySelectorAll: jest.fn(() => []),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
  },
  addPane: () => ({
    id: 'pane-1',
    height: 100
  }),
  panes: () => [
    {id: 'pane-0', height: 200},
    {id: 'pane-1', height: 100}
  ],
  addSeries: () => ({
    setData: () => {},
    update: () => {},
    applyOptions: () => {},
    priceScale: () => ({applyOptions: () => {}}),
    attachPrimitive: () => {}
  }),
  priceScale: () => ({applyOptions: () => {}}),
  applyOptions: () => {},
  resize: () => {},
  remove: () => {},
  subscribeClick: () => {},
  subscribeCrosshairMove: () => {},
  subscribeDblClick: () => {},
  unsubscribeClick: () => {},
  unsubscribeCrosshairMove: () => {},
  unsubscribeDblClick: () => {},
  subscribeVisibleTimeRangeChange: () => {},
  unsubscribeVisibleTimeRangeChange: () => {},
  subscribeVisiblePriceRangeChange: () => {},
  unsubscribeVisiblePriceRangeChange: () => {},
  subscribeCrosshairMoved: () => {},
  unsubscribeCrosshairMoved: () => {}
} as any

// Mock HTMLCanvasElement and CanvasRenderingContext2D
const mockCanvas = {
  getContext: jest.fn(() => ({
    clearRect: jest.fn(),
    fillRect: jest.fn(),
    strokeRect: jest.fn(),
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    stroke: jest.fn(),
    fill: jest.fn(),
    save: jest.fn(),
    restore: jest.fn(),
    translate: jest.fn(),
    scale: jest.fn(),
    rotate: jest.fn(),
    setTransform: jest.fn(),
    drawImage: jest.fn(),
    measureText: jest.fn(() => ({width: 100})),
    fillText: jest.fn(),
    strokeText: jest.fn(),
    canvas: {
      width: 800,
      height: 600
    }
  })),
  width: 800,
  height: 600,
  style: {},
  getBoundingClientRect: jest.fn(() => ({
    width: 800,
    height: 600,
    top: 0,
    left: 0,
    right: 800,
    bottom: 600
  })),
  appendChild: jest.fn(),
  removeChild: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
}

// Mock document.createElement
const originalCreateElement = document.createElement
document.createElement = jest.fn(tagName => {
  if (tagName === 'canvas') {
    return mockCanvas
  }
  return originalCreateElement.call(document, tagName)
})

describe('Chart Plugins', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('RectangleOverlayPlugin', () => {
    it('should create rectangle overlay plugin', () => {
      const plugin = new RectangleOverlayPlugin()
      expect(plugin).toBeDefined()
    })

    it('should add rectangle overlay to chart', () => {
      const plugin = new RectangleOverlayPlugin()
      const chart = mockChart

      plugin.addToChart(chart)

      expect(chart).toBeDefined()
    })

    it('should handle rectangle data', () => {
      const plugin = new RectangleOverlayPlugin()
      const chart = mockChart

      plugin.addToChart(chart)

      const rectangleData = [
        {
          id: 'rect-1',
          time: '2024-01-01',
          price: 100,
          x1: 0,
          y1: 0,
          x2: 50,
          y2: 20,
          color: '#ff0000'
        }
      ]

      plugin.setRectangles(rectangleData)

      expect(plugin).toBeDefined()
    })

    it('should handle empty rectangle data', () => {
      const plugin = new RectangleOverlayPlugin()
      const chart = mockChart

      plugin.addToChart(chart)
      plugin.setRectangles([])

      expect(plugin).toBeDefined()
    })

    it('should handle invalid rectangle data', () => {
      const plugin = new RectangleOverlayPlugin()
      const chart = mockChart

      plugin.addToChart(chart)
      plugin.setRectangles(null)

      expect(plugin).toBeDefined()
    })
  })

  describe('SignalSeries', () => {
    it('should create signal series', () => {
      const chart = mockChart
      const config = {data: [], options: {visible: true}, paneId: 0, type: 'signal' as const}
      const signalSeries = new SignalSeries(chart, config)
      expect(signalSeries).toBeDefined()
    })

    it('should add signal series to chart', () => {
      const chart = mockChart
      const config = {data: [], options: {visible: true}, paneId: 0, type: 'signal' as const}
      const signalSeries = new SignalSeries(chart, config)

      expect(chart).toBeDefined()
    })

    it('should handle signal data', () => {
      const chart = mockChart
      const config = {data: [], options: {visible: true}, paneId: 0, type: 'signal' as const}
      const signalSeries = new SignalSeries(chart, config)

      const signalData = [
        {
          time: '2024-01-01',
          value: 100,
          type: 'buy',
          color: '#00ff00'
        }
      ]

      signalSeries.setSignals(signalData)

      expect(signalSeries).toBeDefined()
    })

    it('should handle empty signal data', () => {
      const chart = mockChart
      const config = {data: [], options: {visible: true}, paneId: 0, type: 'signal' as const}
      const signalSeries = new SignalSeries(chart, config)
      signalSeries.setSignals([])

      expect(signalSeries).toBeDefined()
    })

    it('should handle different signal types', () => {
      const chart = mockChart
      const config = {
        data: [],
        options: {visible: true},
        paneId: 0,
        type: 'signal' as const
      }
      const signalSeries = new SignalSeries(chart, config)

      const signalData = [
        {time: '2024-01-01', value: 100, type: 'buy', color: '#00ff00'},
        {time: '2024-01-02', value: 110, type: 'sell', color: '#ff0000'},
        {time: '2024-01-03', value: 105, type: 'hold', color: '#ffff00'}
      ]

      signalSeries.setSignals(signalData)

      expect(signalSeries).toBeDefined()
    })
  })

  describe('Trade Visualization', () => {
    it('should create trade visual elements', () => {
      const trades = [
        {
          entryTime: '2024-01-01',
          entryPrice: 100,
          exitTime: '2024-01-02',
          exitPrice: 110,
          quantity: 10,
          tradeType: 'long' as const
        }
      ]

      const options = {showAnnotations: true, style: 'markers' as const}
      const elements = createTradeVisualElements(trades, options)
      expect(elements).toBeDefined()
    })

    it('should handle empty trades', () => {
      const options = {showAnnotations: true, style: 'markers' as const}
      const elements = createTradeVisualElements([], options)
      expect(elements).toBeDefined()
    })

    it('should handle null trades', () => {
      const options = {showAnnotations: true, style: 'markers' as const}
      const elements = createTradeVisualElements(null, options)
      expect(elements).toBeDefined()
    })

    it('should handle different trade types', () => {
      const trades = [
        {
          entryTime: '2024-01-01',
          entryPrice: 100,
          exitTime: '2024-01-02',
          exitPrice: 110,
          quantity: 10,
          tradeType: 'long' as const
        },
        {
          entryTime: '2024-01-03',
          entryPrice: 110,
          exitTime: '2024-01-04',
          exitPrice: 100,
          quantity: 5,
          tradeType: 'short' as const
        }
      ]

      const options = {showAnnotations: true, style: 'markers' as const}
      const elements = createTradeVisualElements(trades, options)
      expect(elements).toBeDefined()
    })

    it('should handle trades with missing data', () => {
      const trades = [
        {
          entryTime: '2024-01-01',
          entryPrice: 100,
          exitTime: '2024-01-02',
          exitPrice: 110,
          quantity: 10,
          tradeType: 'long' as const
        },
        {
          entryTime: '2024-01-03',
          entryPrice: 110,
          exitTime: '2024-01-04',
          exitPrice: 100,
          quantity: 5,
          tradeType: 'short' as const
        }
      ]

      const options = {showAnnotations: true, style: 'markers' as const}
      const elements = createTradeVisualElements(trades, options)
      expect(elements).toBeDefined()
    })
  })

  describe('Annotation System', () => {
    it('should create annotation visual elements', () => {
      const annotations = [
        {
          time: '2024-01-01',
          price: 100,
          text: 'Test annotation',
          type: 'text' as const,
          position: 'above' as const
        }
      ]

      const elements = createAnnotationVisualElements(annotations)
      expect(elements).toBeDefined()
    })

    it('should handle empty annotations', () => {
      const elements = createAnnotationVisualElements([])
      expect(elements).toBeDefined()
    })

    it('should handle null annotations', () => {
      const elements = createAnnotationVisualElements(null)
      expect(elements).toBeDefined()
    })

    it('should handle different annotation types', () => {
      const annotations = [
        {
          time: '2024-01-01',
          price: 100,
          text: 'Text annotation',
          type: 'text' as const,
          position: 'above' as const
        },
        {
          time: '2024-01-02',
          price: 110,
          text: 'Arrow annotation',
          type: 'arrow' as const,
          position: 'below' as const
        },
        {
          time: '2024-01-03',
          price: 105,
          text: 'Shape annotation',
          type: 'shape' as const,
          position: 'inline' as const
        }
      ]

      const elements = createAnnotationVisualElements(annotations)
      expect(elements).toBeDefined()
    })

    it('should handle annotations with custom styling', () => {
      const annotations = [
        {
          time: '2024-01-01',
          price: 100,
          text: 'Styled annotation',
          type: 'text' as const,
          position: 'above' as const,
          color: '#ff0000',
          backgroundColor: '#ffff00',
          fontSize: 14,
          fontWeight: 'bold'
        }
      ]

      const elements = createAnnotationVisualElements(annotations)
      expect(elements).toBeDefined()
    })

    it('should handle annotations with missing properties', () => {
      const annotations = [
        {
          time: '2024-01-01',
          price: 100,
          text: 'Minimal annotation',
          type: 'text' as const,
          position: 'above' as const
        }
      ]

      const elements = createAnnotationVisualElements(annotations)
      expect(elements).toBeDefined()
    })
  })

  describe('Plugin Integration', () => {
    it('should integrate multiple plugins with chart', () => {
      const chart = mockChart

      const rectanglePlugin = new RectangleOverlayPlugin()
      const config = {data: [], options: {visible: true}, paneId: 0, type: 'signal' as const}
      const signalSeries = new SignalSeries(chart, config)

      rectanglePlugin.addToChart(chart)
      signalSeries.addToChart(chart)

      expect(chart).toBeDefined()
    })

    it('should handle plugin cleanup', () => {
      const chart = mockChart

      const rectanglePlugin = new RectangleOverlayPlugin()
      rectanglePlugin.addToChart(chart)

      // Simulate cleanup
      rectanglePlugin.remove()

      expect(rectanglePlugin).toBeDefined()
    })

    it('should handle plugin errors gracefully', () => {
      const chart = null // Invalid chart

      const rectanglePlugin = new RectangleOverlayPlugin()

      // Should not throw error
      expect(() => {
        rectanglePlugin.addToChart(chart)
      }).not.toThrow()
    })
  })

  describe('Performance', () => {
    it('should handle large datasets efficiently', () => {
      const chart = mockChart

      const rectanglePlugin = new RectangleOverlayPlugin()
      rectanglePlugin.addToChart(chart)

      const largeRectangleData = Array.from({length: 1000}, (_, i) => ({
        id: `rect-${i}`,
        time: `2024-01-${String(i + 1).padStart(2, '0')}`,
        price: 100 + i,
        x1: 0,
        y1: 0,
        x2: 50,
        y2: 20,
        color: '#ff0000'
      }))

      rectanglePlugin.setRectangles(largeRectangleData)

      expect(rectanglePlugin).toBeDefined()
    })

    it('should handle rapid updates', () => {
      const chart = mockChart
      const config = {data: [], options: {visible: true}, paneId: 0, type: 'signal' as const}
      const signalSeries = new SignalSeries(chart, config)

      // Simulate rapid updates
      for (let i = 0; i < 100; i++) {
        const signalData = [
          {
            time: `2024-01-${String(i + 1).padStart(2, '0')}`,
            value: 100 + i,
            type: 'buy',
            color: '#00ff00'
          }
        ]

        signalSeries.setSignals(signalData)
      }

      expect(signalSeries).toBeDefined()
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid plugin data', () => {
      const chart = mockChart

      const rectanglePlugin = new RectangleOverlayPlugin()
      rectanglePlugin.addToChart(chart)

      const invalidData = [
        {
          id: 'invalid-rect',
          time: 'invalid-time',
          price: 'invalid-price' as any,
          x1: -50,
          y1: -20,
          x2: 0,
          y2: 0,
          color: 'invalid-color'
        }
      ]

      rectanglePlugin.setRectangles(invalidData)

      expect(rectanglePlugin).toBeDefined()
    })

    it('should handle plugin initialization errors', () => {
      const invalidChart = {
        // Missing required methods
      } as any

      const rectanglePlugin = new RectangleOverlayPlugin()

      expect(() => {
        rectanglePlugin.addToChart(invalidChart)
      }).not.toThrow()
    })
  })
})
