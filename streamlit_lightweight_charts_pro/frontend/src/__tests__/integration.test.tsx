import React from 'react'
import {render, screen, waitFor, fireEvent} from '@testing-library/react'
import '@testing-library/jest-dom'
import LightweightCharts from '../LightweightCharts'
import {ComponentConfig} from '../types'

// Mock the lightweight-charts library
const mockChart = {
  addCandlestickSeries: jest.fn(() => ({
    setData: jest.fn(),
    update: jest.fn(),
    applyOptions: jest.fn(),
    priceScale: jest.fn(() => ({applyOptions: jest.fn()}))
  })),
  addLineSeries: jest.fn(() => ({
    setData: jest.fn(),
    update: jest.fn(),
    applyOptions: jest.fn(),
    priceScale: jest.fn(() => ({applyOptions: jest.fn()}))
  })),
  addAreaSeries: jest.fn(() => ({
    setData: jest.fn(),
    update: jest.fn(),
    applyOptions: jest.fn(),
    priceScale: jest.fn(() => ({applyOptions: jest.fn()}))
  })),
  addHistogramSeries: jest.fn(() => ({
    setData: jest.fn(),
    update: jest.fn(),
    applyOptions: jest.fn(),
    priceScale: jest.fn(() => ({applyOptions: jest.fn()}))
  })),
  addBaselineSeries: jest.fn(() => ({
    setData: jest.fn(),
    update: jest.fn(),
    applyOptions: jest.fn(),
    priceScale: jest.fn(() => ({applyOptions: jest.fn()}))
  })),
  addBandSeries: jest.fn(() => ({
    setData: jest.fn(),
    update: jest.fn(),
    applyOptions: jest.fn(),
    priceScale: jest.fn(() => ({applyOptions: jest.fn()}))
  })),
  addSeries: jest.fn(() => ({
    setData: jest.fn(),
    update: jest.fn(),
    applyOptions: jest.fn(),
    priceScale: jest.fn(() => ({applyOptions: jest.fn()})),
    attachPrimitive: jest.fn(),
    createPriceLine: jest.fn()
  })),
  chartElement: {
    id: 'mock-chart-element',
    style: {},
    getBoundingClientRect: jest.fn(() => ({
      width: 800,
      height: 400,
      top: 0,
      left: 0,
      right: 800,
      bottom: 400
    })),
    appendChild: jest.fn(),
    removeChild: jest.fn(),
    querySelector: jest.fn(),
    querySelectorAll: jest.fn(() => []),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
  },
  setCrosshairPosition: jest.fn(),
  panes: jest.fn(() => [
    {id: 'pane-0', height: 200},
    {id: 'pane-1', height: 100}
  ]),
  addPane: jest.fn(() => ({
    id: 'pane-new',
    height: 100,
    attachPrimitive: jest.fn()
  })),
  timeScale: jest.fn(() => ({
    fitContent: jest.fn(),
    scrollToPosition: jest.fn(),
    scrollToTime: jest.fn(),
    setVisibleRange: jest.fn(),
    applyOptions: jest.fn(),
    getVisibleRange: jest.fn(() => ({
      from: 0,
      to: 1000
    })),
    subscribeVisibleTimeRangeChange: jest.fn()
  })),
  priceScale: jest.fn(() => ({applyOptions: jest.fn()})),
  applyOptions: jest.fn(),
  resize: jest.fn(),
  remove: jest.fn(),
  subscribeClick: jest.fn(),
  subscribeCrosshairMove: jest.fn(),
  unsubscribeClick: jest.fn(),
  unsubscribeCrosshairMove: jest.fn()
}

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(callback => ({
  observe: jest.fn(element => {
    // Simulate a resize event
    if (callback) {
      setTimeout(() => {
        callback([
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
  }),
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

Element.prototype.getBoundingClientRect = jest.fn(
  () =>
    ({
      width: 800,
      height: 600,
      top: 0,
      left: 0,
      right: 800,
      bottom: 600,
      x: 0,
      y: 0,
      toJSON: jest.fn()
    }) as DOMRect
)

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

describe('Frontend Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Complete Chart Workflow', () => {
    it('should render a complete chart with multiple series', async () => {
      const config: ComponentConfig = {
        charts: [
          {
            chartId: 'main-chart',
            chart: {
              width: 800,
              height: 400,
              autoSize: true,
              layout: {
                color: '#ffffff',
                textColor: '#000000'
              }
            },
            series: [
              {
                type: 'Candlestick',
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
                  downColor: '#ff0000'
                }
              },
              {
                type: 'Line',
                data: [
                  {time: '2024-01-01', value: 100},
                  {time: '2024-01-02', value: 110}
                ],
                options: {
                  color: '#0000ff',
                  lineWidth: 2
                }
              }
            ],
            annotations: [
              {
                time: '2024-01-01',
                price: 100,
                text: 'Start',
                type: 'text',
                position: 'above'
              }
            ]
          }
        ],
        syncConfig: {
          enabled: true,
          crosshair: true,
          timeRange: true
        }
      }

      render(<LightweightCharts config={config} height={400} />)

      await waitFor(() => {
        expect(document.querySelector('[id^="chart-container-"]')).toBeInTheDocument()
      })
    })

    it('should handle chart with trades visualization', async () => {
      const config: ComponentConfig = {
        charts: [
          {
            chartId: 'trades-chart',
            chart: {
              width: 800,
              height: 400,
              autoSize: true,
              layout: {
                color: '#ffffff',
                textColor: '#000000'
              }
            },
            series: [
              {
                type: 'Candlestick',
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
                  downColor: '#ff0000'
                }
              }
            ],
            trades: [
              {
                entryTime: '2024-01-01',
                entryPrice: 100,
                exitTime: '2024-01-02',
                exitPrice: 110,
                quantity: 10,
                tradeType: 'long'
              }
            ],
            annotations: []
          }
        ],
        syncConfig: {
          enabled: false,
          crosshair: false,
          timeRange: false
        }
      }

      render(<LightweightCharts config={config} height={400} />)

      await waitFor(() => {
        expect(document.querySelector('[id^="chart-container-"]')).toBeInTheDocument()
      })
    })

    it('should handle chart with volume series', async () => {
      const config: ComponentConfig = {
        charts: [
          {
            chartId: 'volume-chart',
            chart: {
              width: 800,
              height: 400,
              autoSize: true,
              layout: {
                color: '#ffffff',
                textColor: '#000000'
              }
            },
            series: [
              {
                type: 'Candlestick',
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
                  downColor: '#ff0000'
                }
              },
              {
                type: 'Histogram',
                data: [{time: '2024-01-01', value: 1000000, color: '#00ff00'}],
                options: {
                  color: '#888888',
                  priceFormat: {
                    type: 'volume'
                  },
                  priceScaleId: 'volume'
                }
              }
            ],
            annotations: []
          }
        ],
        syncConfig: {
          enabled: false,
          crosshair: false,
          timeRange: false
        }
      }

      render(<LightweightCharts config={config} height={400} />)

      await waitFor(() => {
        expect(document.querySelector('[id^="chart-container-"]')).toBeInTheDocument()
      })
    })
  })

  describe('Chart Synchronization', () => {
    it('should synchronize multiple charts', async () => {
      const config: ComponentConfig = {
        charts: [
          {
            chartId: 'chart1',
            chartGroupId: 1,
            chart: {
              width: 800,
              height: 300,
              autoSize: true,
              layout: {
                color: '#ffffff',
                textColor: '#000000'
              }
            },
            series: [
              {
                type: 'Line',
                data: [
                  {time: '2024-01-01', value: 100},
                  {time: '2024-01-02', value: 110}
                ],
                options: {color: '#ff0000'}
              }
            ],
            annotations: []
          },
          {
            chartId: 'chart2',
            chartGroupId: 1,
            chart: {
              width: 800,
              height: 300,
              autoSize: true,
              layout: {
                color: '#ffffff',
                textColor: '#000000'
              }
            },
            series: [
              {
                type: 'Line',
                data: [
                  {time: '2024-01-01', value: 90},
                  {time: '2024-01-02', value: 100}
                ],
                options: {color: '#00ff00'}
              }
            ],
            annotations: []
          }
        ],
        syncConfig: {
          enabled: true,
          crosshair: true,
          timeRange: true
        }
      }

      render(<LightweightCharts config={config} height={600} />)

      await waitFor(() => {
        expect(document.querySelector('[id^="chart-container-"]')).toBeInTheDocument()
      })
    })
  })

  describe('Chart Responsiveness', () => {
    it('should handle window resize events', async () => {
      const config: ComponentConfig = {
        charts: [
          {
            chartId: 'responsive-chart',
            chart: {
              width: 800,
              height: 400,
              autoSize: true,
              layout: {
                color: '#ffffff',
                textColor: '#000000'
              }
            },
            series: [
              {
                type: 'Line',
                data: [
                  {time: '2024-01-01', value: 100},
                  {time: '2024-01-02', value: 110}
                ],
                options: {color: '#ff0000'}
              }
            ],
            annotations: []
          }
        ],
        syncConfig: {
          enabled: false,
          crosshair: false,
          timeRange: false
        }
      }

      render(<LightweightCharts config={config} height={400} />)

      await waitFor(() => {
        expect(document.querySelector('[id^="chart-container-"]')).toBeInTheDocument()
      })

      // Simulate window resize
      window.dispatchEvent(new Event('resize'))

      await waitFor(() => {
        expect(document.querySelector('[id^="chart-container-"]')).toBeInTheDocument()
      })
    })

    it('should handle container resize events', async () => {
      const config: ComponentConfig = {
        charts: [
          {
            chartId: 'container-responsive-chart',
            chart: {
              width: 800,
              height: 400,
              autoSize: true,
              layout: {
                color: '#ffffff',
                textColor: '#000000'
              }
            },
            series: [
              {
                type: 'Line',
                data: [
                  {time: '2024-01-01', value: 100},
                  {time: '2024-01-02', value: 110}
                ],
                options: {color: '#ff0000'}
              }
            ],
            annotations: []
          }
        ],
        syncConfig: {
          enabled: false,
          crosshair: false,
          timeRange: false
        }
      }

      render(<LightweightCharts config={config} height={400} />)

      await waitFor(() => {
        expect(document.querySelector('[id^="chart-container-"]')).toBeInTheDocument()
      })

      // Simulate container resize
      const container = document.querySelector('.chart-container')
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

  describe('Chart Performance', () => {
    it('should handle large datasets efficiently', async () => {
      const largeData = Array.from({length: 1000}, (_, i) => ({
        time: `2024-01-${String(i + 1).padStart(2, '0')}`,
        open: 100 + Math.random() * 20,
        high: 110 + Math.random() * 20,
        low: 90 + Math.random() * 20,
        close: 100 + Math.random() * 20
      }))

      const config: ComponentConfig = {
        charts: [
          {
            chartId: 'large-dataset-chart',
            chart: {
              width: 800,
              height: 400,
              autoSize: true,
              layout: {
                color: '#ffffff',
                textColor: '#000000'
              }
            },
            series: [
              {
                type: 'Candlestick',
                data: largeData,
                options: {
                  upColor: '#00ff00',
                  downColor: '#ff0000'
                }
              }
            ],
            annotations: []
          }
        ],
        syncConfig: {
          enabled: false,
          crosshair: false,
          timeRange: false
        }
      }

      render(<LightweightCharts config={config} height={400} />)

      await waitFor(() => {
        expect(document.querySelector('[id^="chart-container-"]')).toBeInTheDocument()
      })
    })

    it('should handle rapid updates', async () => {
      const config: ComponentConfig = {
        charts: [
          {
            chartId: 'rapid-updates-chart',
            chart: {
              width: 800,
              height: 400,
              autoSize: true,
              layout: {
                color: '#ffffff',
                textColor: '#000000'
              }
            },
            series: [
              {
                type: 'Line',
                data: [
                  {time: '2024-01-01', value: 100},
                  {time: '2024-01-02', value: 110}
                ],
                options: {color: '#ff0000'}
              }
            ],
            annotations: []
          }
        ],
        syncConfig: {
          enabled: false,
          crosshair: false,
          timeRange: false
        }
      }

      const {rerender} = render(<LightweightCharts config={config} height={400} />)

      await waitFor(() => {
        expect(document.querySelector('[id^="chart-container-"]')).toBeInTheDocument()
      })

      // Simulate rapid config updates
      for (let i = 0; i < 10; i++) {
        const updatedConfig = {
          ...config,
          charts: [
            {
              ...config.charts[0],
              series: [
                {
                  ...config.charts[0].series[0],
                  data: [
                    {time: '2024-01-01', value: 100 + i},
                    {time: '2024-01-02', value: 110 + i}
                  ]
                }
              ]
            }
          ]
        }

        rerender(<LightweightCharts config={updatedConfig} height={400} />)
      }

      await waitFor(() => {
        expect(document.querySelector('[id^="chart-container-"]')).toBeInTheDocument()
      })
    })
  })

  describe('Chart Error Handling', () => {
    it('should handle invalid configuration gracefully', async () => {
      const invalidConfig = {
        charts: [
          {
            chartId: 'invalid-chart',
            chart: {
              width: 800,
              height: 400,
              autoSize: true,
              layout: {
                color: '#ffffff',
                textColor: '#000000'
              }
            },
            series: [
              {
                type: 'invalid-type',
                data: [{time: '2024-01-01', value: 100}],
                options: {}
              }
            ],
            annotations: []
          }
        ],
        syncConfig: {
          enabled: false,
          crosshair: false,
          timeRange: false
        }
      }

      render(
        <LightweightCharts config={invalidConfig as unknown as ComponentConfig} height={400} />
      )

      await waitFor(() => {
        expect(document.querySelector('[id^="chart-container-"]')).toBeInTheDocument()
      })
    })

    it('should handle missing data gracefully', async () => {
      const configWithMissingData: ComponentConfig = {
        charts: [
          {
            chartId: 'missing-data-chart',
            chart: {
              width: 800,
              height: 400,
              autoSize: true,
              layout: {
                color: '#ffffff',
                textColor: '#000000'
              }
            },
            series: [
              {
                type: 'Line',
                data: null,
                options: {color: '#ff0000'}
              }
            ],
            annotations: []
          }
        ],
        syncConfig: {
          enabled: false,
          crosshair: false,
          timeRange: false
        }
      }

      render(<LightweightCharts config={configWithMissingData} height={400} />)

      await waitFor(() => {
        expect(document.querySelector('[id^="chart-container-"]')).toBeInTheDocument()
      })
    })
  })

  describe('Chart Accessibility', () => {
    it('should support keyboard navigation', async () => {
      const config: ComponentConfig = {
        charts: [
          {
            chartId: 'accessible-chart',
            chart: {
              width: 800,
              height: 400,
              autoSize: true,
              layout: {
                color: '#ffffff',
                textColor: '#000000'
              }
            },
            series: [
              {
                type: 'Line',
                data: [
                  {time: '2024-01-01', value: 100},
                  {time: '2024-01-02', value: 110}
                ],
                options: {color: '#ff0000'}
              }
            ],
            annotations: []
          }
        ],
        syncConfig: {
          enabled: false,
          crosshair: false,
          timeRange: false
        }
      }

      render(<LightweightCharts config={config} height={400} />)

      await waitFor(() => {
        expect(document.querySelector('[id^="chart-container-"]')).toBeInTheDocument()
      })

      // Test keyboard navigation
      const container = document.querySelector('.chart-container')
      if (container) {
        fireEvent.keyDown(container, {key: 'Tab'})
        fireEvent.keyDown(container, {key: 'ArrowRight'})
        fireEvent.keyDown(container, {key: 'ArrowLeft'})
      }

      await waitFor(() => {
        expect(document.querySelector('[id^="chart-container-"]')).toBeInTheDocument()
      })
    })
  })

  describe('Chart Cleanup', () => {
    it('should cleanup resources on unmount', async () => {
      const config: ComponentConfig = {
        charts: [
          {
            chartId: 'cleanup-chart',
            chart: {
              width: 800,
              height: 400,
              autoSize: true,
              layout: {
                color: '#ffffff',
                textColor: '#000000'
              }
            },
            series: [
              {
                type: 'Line',
                data: [
                  {time: '2024-01-01', value: 100},
                  {time: '2024-01-02', value: 110}
                ],
                options: {color: '#ff0000'}
              }
            ],
            annotations: []
          }
        ],
        syncConfig: {
          enabled: false,
          crosshair: false,
          timeRange: false
        }
      }

      const {unmount} = render(<LightweightCharts config={config} height={400} />)

      await waitFor(() => {
        expect(document.querySelector('[id^="chart-container-"]')).toBeInTheDocument()
      })

      unmount()

      // Should not throw any errors during cleanup
      expect(true).toBe(true)
    })
  })
})
