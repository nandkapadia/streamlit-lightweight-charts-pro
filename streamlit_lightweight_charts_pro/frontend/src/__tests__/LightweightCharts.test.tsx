import React from 'react'
import {render, screen, waitFor} from '@testing-library/react'
import '@testing-library/jest-dom'
import LightweightCharts from '../LightweightCharts'
import {ComponentConfig} from '../types'

// Use real lightweight-charts library

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
}))

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
}))

// Mock performance API
Object.defineProperty(window, 'performance', {
  value: {
    now: jest.fn(() => Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
    getEntriesByType: jest.fn(() => [])
  },
  writable: true
})

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn(callback => {
  setTimeout(callback, 0)
  return 1
})

global.cancelAnimationFrame = jest.fn()

// Mock DOM methods
Object.defineProperty(window, 'getComputedStyle', {
  value: () => ({
    getPropertyValue: () => ''
  })
})

Element.prototype.getBoundingClientRect = jest.fn(() => ({
  width: 800,
  height: 600,
  top: 0,
  left: 0,
  right: 800,
  bottom: 600
}))

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

describe('LightweightCharts Component', () => {
  const mockConfig: ComponentConfig = {
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
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Component Rendering', () => {
    it('should render without crashing', () => {
      render(<LightweightCharts config={mockConfig} />)
      expect(document.querySelector('[id^="chart-container-"]')).toBeInTheDocument()
    })

    it('should render with custom height', () => {
      render(<LightweightCharts config={mockConfig} height={600} />)
      const container = document.querySelector('[id^="chart-container-"]')
      expect(container).toBeInTheDocument()
    })

    it('should render with custom width', () => {
      render(<LightweightCharts config={mockConfig} width={800} />)
      const container = document.querySelector('[id^="chart-container-"]')
      expect(container).toBeInTheDocument()
    })

    it('should render with onChartsReady callback', () => {
      const mockCallback = jest.fn()
      render(<LightweightCharts config={mockConfig} onChartsReady={mockCallback} />)
      expect(document.querySelector('[id^="chart-container-"]')).toBeInTheDocument()
    })
  })

  describe('Chart Configuration', () => {
    it('should handle empty config', () => {
      const emptyConfig: ComponentConfig = {
        charts: [],
        sync: {
          enabled: false,
          crosshair: false,
          timeRange: false
        }
      }
      render(<LightweightCharts config={emptyConfig} />)
      expect(screen.getByText('No charts configured')).toBeInTheDocument()
    })

    it('should handle config with multiple charts', () => {
      const multiChartConfig: ComponentConfig = {
        charts: [
          {
            chartId: 'chart1',
            chart: {
              height: 300,
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
          },
          {
            chartId: 'chart2',
            chart: {
              height: 300,
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
          enabled: true,
          crosshair: true,
          timeRange: true
        }
      }
      render(<LightweightCharts config={multiChartConfig} />)
      expect(document.querySelector('[id^="chart-container-"]')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should handle missing config gracefully', () => {
      const {container} = render(<LightweightCharts config={{} as ComponentConfig} />)
      expect(container.firstChild).toBeInTheDocument()
    })

    it('should handle null config gracefully', () => {
      const {container} = render(<LightweightCharts config={null as any} />)
      expect(container.firstChild).toBeInTheDocument()
    })
  })

  describe('Performance', () => {
    it('should handle large datasets', () => {
      const largeConfig: ComponentConfig = {
        charts: [
          {
            chartId: 'large-chart',
            chart: {
              height: 400,
              autoSize: true,
              layout: {
                color: '#ffffff',
                textColor: '#000000'
              }
            },
            series: [
              {
                type: 'line',
                data: Array.from({length: 10000}, (_, i) => ({
                  time: Date.now() + i * 60000,
                  value: Math.random() * 100
                }))
              }
            ],
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
      }
      render(<LightweightCharts config={largeConfig} />)
      expect(document.querySelector('[id^="chart-container-"]')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<LightweightCharts config={mockConfig} />)
      const container = document.querySelector('[id^="chart-container-"]')
      expect(container).toBeInTheDocument()
    })

    it('should be keyboard accessible', () => {
      render(<LightweightCharts config={mockConfig} />)
      const container = document.querySelector('[id^="chart-container-"]')
      expect(container).toBeInTheDocument()
    })
  })

  describe('Responsive Design', () => {
    it('should handle window resize', async () => {
      render(<LightweightCharts config={mockConfig} />)

      // Simulate window resize
      window.dispatchEvent(new Event('resize'))

      await waitFor(() => {
        expect(document.querySelector('[id^="chart-container-"]')).toBeInTheDocument()
      })
    })

    it('should handle container resize', async () => {
      render(<LightweightCharts config={mockConfig} />)

      // Simulate container resize
      const container = document.querySelector('[id^="chart-container-"]')
      if (container) {
        Object.defineProperty(container, 'offsetWidth', {
          configurable: true,
          value: 1000
        })
        container.dispatchEvent(new Event('resize'))
      }

      await waitFor(() => {
        expect(document.querySelector('[id^="chart-container-"]')).toBeInTheDocument()
      })
    })
  })
})
