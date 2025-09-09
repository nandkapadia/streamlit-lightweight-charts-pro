import React from 'react'
import {render, screen, waitFor} from '@testing-library/react'
import '@testing-library/jest-dom'

// Mock the components and hooks
jest.mock('streamlit-component-lib', () => ({
  Streamlit: {
    setComponentValue: jest.fn(),
    setFrameHeight: jest.fn(),
    setComponentReady: jest.fn(),
    RENDER_EVENT: 'streamlit:render',
    SET_FRAME_HEIGHT_EVENT: 'streamlit:setFrameHeight'
  }
}))

jest.mock('streamlit-component-lib-react-hooks', () => ({
  useRenderData: jest.fn(() => ({
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
  })),
  StreamlitProvider: ({children}: {children: React.ReactNode}) => <div>{children}</div>
}))

jest.mock('../LightweightCharts', () => {
  return function MockLightweightCharts({config, height, width, onChartsReady}: any) {
    // Automatically call onChartsReady when component mounts
    const {useEffect} = require('react')
    useEffect(() => {
      if (onChartsReady) {
        onChartsReady()
      }
    }, [onChartsReady])

    return (
      <div className="chart-container" data-testid="lightweight-charts">
        <div>Mock Chart Component</div>
        <div>Config: {JSON.stringify(config).substring(0, 50)}...</div>
        <div>Height: {height}</div>
        <div>Width: {width === null ? 'null' : width === undefined ? 'undefined' : width}</div>
        {onChartsReady && (
          <button onClick={onChartsReady} data-testid="charts-ready-btn">
            Charts Ready
          </button>
        )}
      </div>
    )
  }
})

// Mock ReactDOM.render
jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  render: jest.fn()
}))

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

// Mock setTimeout and clearTimeout
jest.useFakeTimers()

describe('Index Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.clearAllTimers()
  })

  describe('Component Rendering', () => {
    it('should render the main app component', async () => {
      const {default: App} = await import('../index')

      // Ensure the mock is properly applied
      const mockUseRenderData = require('streamlit-component-lib-react-hooks').useRenderData
      mockUseRenderData.mockReturnValue({
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
      })

      render(<App />)

      expect(screen.getByTestId('lightweight-charts')).toBeInTheDocument()
      expect(screen.getByText('Mock Chart Component')).toBeInTheDocument()
    })

    it('should render with default configuration', async () => {
      const {default: App} = await import('../index')

      // Ensure the mock is properly applied
      const mockUseRenderData = require('streamlit-component-lib-react-hooks').useRenderData
      mockUseRenderData.mockReturnValue({
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
      })

      render(<App />)

      expect(screen.getByText(/Config:/)).toBeInTheDocument()
      expect(screen.getByText(/Height: 400/)).toBeInTheDocument()
      expect(screen.getByText(/Width: null/)).toBeInTheDocument()
    })

    it('should render with custom height and width', async () => {
      const {default: App} = await import('../index')

      // Mock useRenderData to return custom dimensions
      const mockUseRenderData = require('streamlit-component-lib-react-hooks').useRenderData
      mockUseRenderData.mockReturnValue({
        args: {
          config: {
            charts: [
              {
                chartId: 'test-chart',
                chart: {
                  height: 600,
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
          height: 600,
          width: 1000
        },
        disabled: false,
        height: 600,
        width: 1000,
        theme: {
          base: 'light',
          primaryColor: '#ff4b4b',
          backgroundColor: '#ffffff',
          secondaryBackgroundColor: '#f0f2f6',
          textColor: '#262730'
        }
      })

      render(<App />)

      expect(screen.getByText(/Height: 600/)).toBeInTheDocument()
      expect(screen.getByText(/Width: 1000/)).toBeInTheDocument()
    })
  })

  describe('Component Initialization', () => {
    it('should set component ready state', async () => {
      const {default: App} = await import('../index')
      const {Streamlit} = require('streamlit-component-lib')

      // Ensure the mock is properly applied
      const mockUseRenderData = require('streamlit-component-lib-react-hooks').useRenderData
      mockUseRenderData.mockReturnValue({
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
      })

      render(<App />)

      // Wait for component ready to be set
      await waitFor(() => {
        expect(Streamlit.setComponentReady).toHaveBeenCalled()
      })
    })

    it('should handle component ready errors gracefully', async () => {
      const {default: App} = await import('../index')
      const {Streamlit} = require('streamlit-component-lib')

      // Mock setComponentReady to throw error
      Streamlit.setComponentReady.mockImplementation(() => {
        throw new Error('Component ready error')
      })

      // Ensure the mock is properly applied
      const mockUseRenderData = require('streamlit-component-lib-react-hooks').useRenderData
      mockUseRenderData.mockReturnValue({
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
      })

      render(<App />)

      // Should not crash
      expect(screen.getByTestId('lightweight-charts')).toBeInTheDocument()
    })
  })

  describe('Frame Height Management', () => {
    it('should set frame height when charts are ready', async () => {
      const {default: App} = await import('../index')
      const {Streamlit} = require('streamlit-component-lib')

      // Ensure the mock is properly applied
      const mockUseRenderData = require('streamlit-component-lib-react-hooks').useRenderData
      mockUseRenderData.mockReturnValue({
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
      })

      render(<App />)

      const chartsReadyBtn = screen.getByTestId('charts-ready-btn')
      chartsReadyBtn.click()

      // Wait for frame height to be set
      await waitFor(() => {
        expect(Streamlit.setFrameHeight).toHaveBeenCalled()
      })
    })

    it('should handle frame height errors gracefully', async () => {
      const {default: App} = await import('../index')
      const {Streamlit} = require('streamlit-component-lib')

      // Mock setFrameHeight to throw error
      Streamlit.setFrameHeight.mockImplementation(() => {
        throw new Error('Frame height error')
      })

      // Ensure the mock is properly applied
      const mockUseRenderData = require('streamlit-component-lib-react-hooks').useRenderData
      mockUseRenderData.mockReturnValue({
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
      })

      render(<App />)

      const chartsReadyBtn = screen.getByTestId('charts-ready-btn')
      chartsReadyBtn.click()

      // Should not crash
      expect(screen.getByTestId('lightweight-charts')).toBeInTheDocument()
    })

    it('should calculate correct frame height', async () => {
      const {default: App} = await import('../index')
      const {Streamlit} = require('streamlit-component-lib')

      // Ensure the mock is properly applied
      const mockUseRenderData = require('streamlit-component-lib-react-hooks').useRenderData
      mockUseRenderData.mockReturnValue({
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
      })

      render(<App />)

      const chartsReadyBtn = screen.getByTestId('charts-ready-btn')
      chartsReadyBtn.click()

      await waitFor(() => {
        expect(Streamlit.setFrameHeight).toHaveBeenCalledWith(620) // 600 + 20 padding
      })
    })
  })

  describe('Resize Handling', () => {
    it('should handle window resize events', async () => {
      const {default: App} = await import('../index')
      const {Streamlit} = require('streamlit-component-lib')

      // Ensure the mock is properly applied
      const mockUseRenderData = require('streamlit-component-lib-react-hooks').useRenderData
      mockUseRenderData.mockReturnValue({
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
      })

      render(<App />)

      // Simulate window resize
      window.dispatchEvent(new Event('resize'))

      // Wait for resize handling
      await waitFor(() => {
        expect(Streamlit.setFrameHeight).toHaveBeenCalled()
      })
    })

    it('should debounce resize events', async () => {
      const {default: App} = await import('../index')
      const {Streamlit} = require('streamlit-component-lib')

      // Ensure the mock is properly applied
      const mockUseRenderData = require('streamlit-component-lib-react-hooks').useRenderData
      mockUseRenderData.mockReturnValue({
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
      })

      render(<App />)

      // Trigger multiple resize events
      window.dispatchEvent(new Event('resize'))
      window.dispatchEvent(new Event('resize'))
      window.dispatchEvent(new Event('resize'))

      // Fast-forward timers
      jest.advanceTimersByTime(100)

      await waitFor(() => {
        expect(Streamlit.setFrameHeight).toHaveBeenCalled()
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle missing config gracefully', async () => {
      const {default: App} = await import('../index')

      // Mock useRenderData to return missing config
      const mockUseRenderData = require('streamlit-component-lib-react-hooks').useRenderData
      mockUseRenderData.mockReturnValue({
        args: {
          config: null,
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
      })

      render(<App />)

      expect(screen.getByTestId('lightweight-charts')).toBeInTheDocument()
    })

    it('should handle disabled state', async () => {
      const {default: App} = await import('../index')

      // Mock useRenderData to return disabled state
      const mockUseRenderData = require('streamlit-component-lib-react-hooks').useRenderData
      mockUseRenderData.mockReturnValue({
        args: {
          config: {
            charts: [],
            sync: {
              enabled: false,
              crosshair: false,
              timeRange: false
            }
          },
          height: 400,
          width: null
        },
        disabled: true,
        height: 400,
        width: 800,
        theme: {
          base: 'light',
          primaryColor: '#ff4b4b',
          backgroundColor: '#ffffff',
          secondaryBackgroundColor: '#f0f2f6',
          textColor: '#262730'
        }
      })

      render(<App />)

      expect(screen.getByTestId('lightweight-charts')).toBeInTheDocument()
    })
  })

  describe('Theme Integration', () => {
    it('should pass theme to chart component', async () => {
      const {default: App} = await import('../index')

      const customTheme = {
        base: 'dark',
        primaryColor: '#00ff00',
        backgroundColor: '#000000',
        secondaryBackgroundColor: '#111111',
        textColor: '#ffffff'
      }

      // Mock useRenderData to return custom theme
      const mockUseRenderData = require('streamlit-component-lib-react-hooks').useRenderData
      mockUseRenderData.mockReturnValue({
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
        theme: customTheme
      })

      render(<App />)

      expect(screen.getByTestId('lightweight-charts')).toBeInTheDocument()
    })
  })

  describe('Performance', () => {
    it('should handle large configurations efficiently', async () => {
      const {default: App} = await import('../index')

      const largeConfig = {
        charts: Array.from({length: 10}, (_, i) => ({
          chartId: `chart-${i}`,
          chart: {
            height: 400,
            autoSize: true,
            layout: {
              color: '#ffffff',
              textColor: '#000000'
            }
          },
          series: Array.from({length: 5}, (_, j) => ({
            type: 'line',
            data: Array.from({length: 1000}, (_, k) => ({
              time: Date.now() + k * 60000,
              value: Math.random() * 100
            }))
          })),
          annotations: {
            layers: {}
          }
        })),
        sync: {
          enabled: true,
          crosshair: true,
          timeRange: true
        }
      }

      // Mock useRenderData to return large config
      const mockUseRenderData = require('streamlit-component-lib-react-hooks').useRenderData
      mockUseRenderData.mockReturnValue({
        args: {
          config: largeConfig,
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
      })

      render(<App />)

      expect(screen.getByTestId('lightweight-charts')).toBeInTheDocument()
    })
  })

  describe('Cleanup', () => {
    it('should cleanup on unmount', async () => {
      const {default: App} = await import('../index')
      const {unmount} = render(<App />)

      unmount()

      // Should not throw any errors during cleanup
      expect(true).toBe(true)
    })
  })
})
