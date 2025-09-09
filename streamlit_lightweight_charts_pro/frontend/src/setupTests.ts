// jest-dom adds custom jest matchers for asserting on DOM nodes.
import '@testing-library/jest-dom'

// Mock ResizeObserver before any other imports
global.ResizeObserver = jest.fn().mockImplementation(callback => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
}))

// Use real lightweight-charts library in tests

jest.mock('streamlit-component-lib', () => ({
  Streamlit: {
    setComponentValue: () => {},
    setFrameHeight: () => {},
    setComponentReady: () => {},
    RENDER_EVENT: 'streamlit:render',
    SET_FRAME_HEIGHT_EVENT: 'streamlit:setFrameHeight'
  }
}))

jest.mock('streamlit-component-lib-react-hooks', () => ({
  useStreamlit: () => ({
    theme: {
      base: 'light',
      primaryColor: '#ff4b4b',
      backgroundColor: '#ffffff',
      secondaryBackgroundColor: '#f0f2f6',
      textColor: '#262730'
    },
    args: {},
    disabled: false,
    height: 400,
    width: 800
  }),
  useRenderData: () => ({
    args: {
      config: {
        charts: [
          {
            chartId: 'test-chart',
            chart: {
              height: 400,
              autoSize: true,
              layout: {
                color: '#ffffff',
                textColor: '#000000'
              }
            },
            series: [],
            annotations: {
              layers: {}
            }
          }
        ],
        sync: {
          enabled: false,
          crosshair: false,
          timeRange: false
        }
      },
      height: 400,
      width: null
    },
    disabled: false,
    height: 400,
    width: 800,
    theme: {
      base: 'light',
      primaryColor: '#ff4b4b',
      backgroundColor: '#ffffff',
      secondaryBackgroundColor: '#f0f2f6',
      textColor: '#262730'
    }
  }),
  StreamlitProvider: ({children}) => {
    const React = require('react')
    return React.createElement('div', {}, children)
  }
}))

// Mock browser APIs - ResizeObserver
class MockResizeObserver {
  constructor(callback) {
    this.callback = callback
  }
  observe(element) {
    // Mock implementation that doesn't throw
    if (this.callback) {
      // Simulate a resize event
      setTimeout(() => {
        this.callback([
          {
            target: element,
            contentRect: {
              width: 800,
              height: 600,
              top: 0,
              left: 0,
              right: 800,
              bottom: 600
            }
          }
        ])
      }, 0)
    }
  }
  unobserve() {}
  disconnect() {}
}

// Set up ResizeObserver mock in all possible contexts
global.ResizeObserver = MockResizeObserver

// Also mock ResizeObserver on window object and ensure it's available everywhere
if (typeof window !== 'undefined') {
  window.ResizeObserver = MockResizeObserver
}

// Mock ResizeObserver in all possible contexts
Object.defineProperty(global, 'ResizeObserver', {
  value: MockResizeObserver,
  writable: true,
  configurable: true
})

// Ensure ResizeObserver is available in the global scope
if (typeof globalThis !== 'undefined') {
  globalThis.ResizeObserver = MockResizeObserver
}

// Additional mock setup to ensure it's available everywhere
Object.defineProperty(window, 'ResizeObserver', {
  value: MockResizeObserver,
  writable: true,
  configurable: true
})

global.IntersectionObserver = class IntersectionObserver {
  constructor(callback) {
    this.callback = callback
  }
  observe(element) {
    // Mock implementation that doesn't throw
    if (this.callback) {
      // Simulate intersection
      setTimeout(() => {
        this.callback([
          {
            target: element,
            isIntersecting: true,
            intersectionRatio: 1.0,
            boundingClientRect: {
              width: 800,
              height: 600,
              top: 0,
              left: 0,
              right: 800,
              bottom: 600
            }
          }
        ])
      }, 0)
    }
  }
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(window, 'performance', {
  value: {
    now: () => Date.now(),
    mark: () => {},
    measure: () => {},
    getEntriesByType: () => []
  },
  writable: true
})

global.requestAnimationFrame = callback => {
  setTimeout(callback, 0)
  return 1
}

global.cancelAnimationFrame = () => {}

// Mock DOM methods
Object.defineProperty(window, 'getComputedStyle', {
  value: () => ({
    getPropertyValue: () => ''
  })
})

Element.prototype.getBoundingClientRect = () => ({
  width: 800,
  height: 600,
  top: 0,
  left: 0,
  right: 800,
  bottom: 600
})

Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
  configurable: true,
  value: 600
})

Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
  configurable: true,
  value: 600
})

Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
  configurable: true,
  value: 800
})

// Mock HTMLCanvasElement.getContext
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: jest.fn(contextType => {
    if (contextType === '2d') {
      return {
        canvas: {
          width: 800,
          height: 600
        },
        clearRect: jest.fn(),
        fillRect: jest.fn(),
        strokeRect: jest.fn(),
        beginPath: jest.fn(),
        closePath: jest.fn(),
        moveTo: jest.fn(),
        lineTo: jest.fn(),
        arc: jest.fn(),
        fill: jest.fn(),
        stroke: jest.fn(),
        fillStyle: '#000000',
        strokeStyle: '#000000',
        lineWidth: 1,
        save: jest.fn(),
        restore: jest.fn(),
        translate: jest.fn(),
        rotate: jest.fn(),
        scale: jest.fn(),
        setTransform: jest.fn(),
        getImageData: jest.fn(() => ({data: new Uint8ClampedArray(4)})),
        putImageData: jest.fn(),
        createImageData: jest.fn(() => ({data: new Uint8ClampedArray(4)})),
        drawImage: jest.fn(),
        measureText: jest.fn(() => ({width: 100})),
        setLineDash: jest.fn(),
        getLineDash: jest.fn(() => []),
        lineDashOffset: 0,
        font: '10px sans-serif',
        textAlign: 'start',
        textBaseline: 'alphabetic',
        direction: 'ltr',
        globalAlpha: 1,
        globalCompositeOperation: 'source-over',
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'low',
        shadowBlur: 0,
        shadowColor: 'rgba(0, 0, 0, 0)',
        shadowOffsetX: 0,
        shadowOffsetY: 0
      }
    }
    return null
  }),
  writable: true,
  configurable: true
})
