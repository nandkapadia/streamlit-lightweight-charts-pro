import React from 'react'
import {render, screen, waitFor} from '@testing-library/react'
import '@testing-library/jest-dom'
import {createChart, LineSeries, AreaSeries, CandlestickSeries} from 'lightweight-charts'
import LightweightCharts from '../LightweightCharts'
import {ComponentConfig} from '../types'

// Helper function to generate consistent test data
function generateTestData() {
  return [
    {time: '2024-01-01', value: 100},
    {time: '2024-01-02', value: 110},
    {time: '2024-01-03', value: 105},
    {time: '2024-01-04', value: 115},
    {time: '2024-01-05', value: 120},
    {time: '2024-01-06', value: 118},
    {time: '2024-01-07', value: 125},
    {time: '2024-01-08', value: 130},
    {time: '2024-01-09', value: 128},
    {time: '2024-01-10', value: 135}
  ]
}

function generateCandlestickTestData() {
  return [
    {time: '2024-01-01', open: 100, high: 110, low: 95, close: 105},
    {time: '2024-01-02', open: 105, high: 115, low: 100, close: 110},
    {time: '2024-01-03', open: 110, high: 120, low: 105, close: 115},
    {time: '2024-01-04', open: 115, high: 125, low: 110, close: 120},
    {time: '2024-01-05', open: 120, high: 130, low: 115, close: 125}
  ]
}

describe('Visual Regression Tests', () => {
  let container: HTMLElement

  beforeEach(() => {
    container = document.createElement('div')
    container.style.width = '800px'
    container.style.height = '400px'
    document.body.appendChild(container)
  })

  afterEach(() => {
    if (container && container.parentNode) {
      container.parentNode.removeChild(container)
    }
  })

  describe('Line Series Visual Consistency', () => {
    it('should render line series with consistent styling', async () => {
      const chart = createChart(container, {
        layout: {attributionLogo: false},
        width: 800,
        height: 400
      })

      const lineSeries = chart.addSeries(LineSeries, {
        lineWidth: 2,
        color: '#ff0000',
        lineStyle: 0, // Solid
        crosshairMarkerVisible: true,
        lastValueVisible: true
      })

      lineSeries.setData(generateTestData())

      await waitFor(() => {
        const canvas = container.querySelector('canvas')
        expect(canvas).toBeInTheDocument()
        expect(canvas).toHaveStyle({width: '800px', height: '400px'})
      })

      chart.remove()
    })

    it('should render dashed line series consistently', async () => {
      const chart = createChart(container, {
        layout: {attributionLogo: false},
        width: 800,
        height: 400
      })

      const lineSeries = chart.addSeries(LineSeries, {
        lineWidth: 2,
        color: '#00ff00',
        lineStyle: 1, // Dashed
        crosshairMarkerVisible: false,
        lastValueVisible: false
      })

      lineSeries.setData(generateTestData())

      await waitFor(() => {
        const canvas = container.querySelector('canvas')
        expect(canvas).toBeInTheDocument()
        expect(canvas).toHaveStyle({width: '800px', height: '400px'})
      })

      chart.remove()
    })

    it('should render dotted line series consistently', async () => {
      const chart = createChart(container, {
        layout: {attributionLogo: false},
        width: 800,
        height: 400
      })

      const lineSeries = chart.addSeries(LineSeries, {
        lineWidth: 3,
        color: '#0000ff',
        lineStyle: 2, // Dotted
        crosshairMarkerVisible: true,
        lastValueVisible: true
      })

      lineSeries.setData(generateTestData())

      await waitFor(() => {
        const canvas = container.querySelector('canvas')
        expect(canvas).toBeInTheDocument()
        expect(canvas).toHaveStyle({width: '800px', height: '400px'})
      })

      chart.remove()
    })
  })

  describe('Area Series Visual Consistency', () => {
    it('should render area series with consistent gradient', async () => {
      const chart = createChart(container, {
        layout: {attributionLogo: false},
        width: 800,
        height: 400
      })

      const areaSeries = chart.addSeries(AreaSeries, {
        topColor: 'rgba(255, 0, 0, 0.4)',
        bottomColor: 'rgba(255, 0, 0, 0.1)',
        lineColor: '#ff0000',
        lineWidth: 2
      })

      areaSeries.setData(generateTestData())

      await waitFor(() => {
        const canvas = container.querySelector('canvas')
        expect(canvas).toBeInTheDocument()
        expect(canvas).toHaveStyle({width: '800px', height: '400px'})
      })

      chart.remove()
    })

    it('should render area series with solid colors consistently', async () => {
      const chart = createChart(container, {
        layout: {attributionLogo: false},
        width: 800,
        height: 400
      })

      const areaSeries = chart.addSeries(AreaSeries, {
        topColor: 'rgba(0, 255, 0, 0.8)',
        bottomColor: 'rgba(0, 255, 0, 0.2)',
        lineColor: '#00ff00',
        lineWidth: 1,
        invertFilledArea: false
      })

      areaSeries.setData(generateTestData())

      await waitFor(() => {
        const canvas = container.querySelector('canvas')
        expect(canvas).toBeInTheDocument()
        expect(canvas).toHaveStyle({width: '800px', height: '400px'})
      })

      chart.remove()
    })

    it('should render inverted area series consistently', async () => {
      const chart = createChart(container, {
        layout: {attributionLogo: false},
        width: 800,
        height: 400
      })

      const areaSeries = chart.addSeries(AreaSeries, {
        topColor: 'rgba(0, 0, 255, 0.4)',
        bottomColor: 'rgba(0, 0, 255, 0.1)',
        lineColor: '#0000ff',
        lineWidth: 2,
        invertFilledArea: true
      })

      areaSeries.setData(generateTestData())

      await waitFor(() => {
        const canvas = container.querySelector('canvas')
        expect(canvas).toBeInTheDocument()
        expect(canvas).toHaveStyle({width: '800px', height: '400px'})
      })

      chart.remove()
    })
  })

  describe('Candlestick Series Visual Consistency', () => {
    it('should render candlestick series with consistent colors', async () => {
      const chart = createChart(container, {
        layout: {attributionLogo: false},
        width: 800,
        height: 400
      })

      const candlestickSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#00ff00',
        downColor: '#ff0000',
        borderVisible: true,
        wickVisible: true,
        borderUpColor: '#008000',
        borderDownColor: '#800000',
        wickUpColor: '#00ff00',
        wickDownColor: '#ff0000'
      })

      candlestickSeries.setData(generateCandlestickTestData())

      await waitFor(() => {
        const canvas = container.querySelector('canvas')
        expect(canvas).toBeInTheDocument()
        expect(canvas).toHaveStyle({width: '800px', height: '400px'})
      })

      chart.remove()
    })

    it('should render candlestick series with thin bars consistently', async () => {
      const chart = createChart(container, {
        layout: {attributionLogo: false},
        width: 800,
        height: 400
      })

      const candlestickSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#00ff00',
        downColor: '#ff0000',
        thinBars: true,
        borderVisible: true,
        wickVisible: true
      })

      candlestickSeries.setData(generateCandlestickTestData())

      await waitFor(() => {
        const canvas = container.querySelector('canvas')
        expect(canvas).toBeInTheDocument()
        expect(canvas).toHaveStyle({width: '800px', height: '400px'})
      })

      chart.remove()
    })
  })

  describe('Chart Layout Visual Consistency', () => {
    it('should render chart with consistent dark theme', async () => {
      const chart = createChart(container, {
        layout: {
          attributionLogo: false,
          background: {color: '#1e1e1e'},
          textColor: '#ffffff'
        },
        grid: {
          vertLines: {color: '#333333'},
          horzLines: {color: '#333333'}
        },
        crosshair: {
          mode: 1,
          vertLine: {color: '#666666'},
          horzLine: {color: '#666666'}
        },
        width: 800,
        height: 400
      })

      const lineSeries = chart.addSeries(LineSeries, {
        color: '#ff0000',
        lineWidth: 2
      })

      lineSeries.setData(generateTestData())

      await waitFor(() => {
        const canvas = container.querySelector('canvas')
        expect(canvas).toBeInTheDocument()
        expect(canvas).toHaveStyle({width: '800px', height: '400px'})
      })

      chart.remove()
    })

    it('should render chart with consistent light theme', async () => {
      const chart = createChart(container, {
        layout: {
          attributionLogo: false,
          background: {color: '#ffffff'},
          textColor: '#000000'
        },
        grid: {
          vertLines: {color: '#e0e0e0'},
          horzLines: {color: '#e0e0e0'}
        },
        crosshair: {
          mode: 1,
          vertLine: {color: '#cccccc'},
          horzLine: {color: '#cccccc'}
        },
        width: 800,
        height: 400
      })

      const lineSeries = chart.addSeries(LineSeries, {
        color: '#0000ff',
        lineWidth: 2
      })

      lineSeries.setData(generateTestData())

      await waitFor(() => {
        const canvas = container.querySelector('canvas')
        expect(canvas).toBeInTheDocument()
        expect(canvas).toHaveStyle({width: '800px', height: '400px'})
      })

      chart.remove()
    })

    it('should render chart with consistent time scale', async () => {
      const chart = createChart(container, {
        layout: {attributionLogo: false},
        timeScale: {
          timeVisible: true,
          secondsVisible: false,
          borderVisible: true,
          borderColor: '#cccccc',
          rightOffset: 10,
          barSpacing: 6
        },
        width: 800,
        height: 400
      })

      const lineSeries = chart.addSeries(LineSeries, {
        color: '#ff0000',
        lineWidth: 2
      })

      lineSeries.setData(generateTestData())

      await waitFor(() => {
        const canvas = container.querySelector('canvas')
        expect(canvas).toBeInTheDocument()
        expect(canvas).toHaveStyle({width: '800px', height: '400px'})
      })

      chart.remove()
    })

    it('should render chart with consistent price scale', async () => {
      const chart = createChart(container, {
        layout: {attributionLogo: false},
        rightPriceScale: {
          visible: true,
          borderVisible: true,
          borderColor: '#cccccc',
          scaleMargins: {
            top: 0.1,
            bottom: 0.1
          }
        },
        width: 800,
        height: 400
      })

      const lineSeries = chart.addSeries(LineSeries, {
        color: '#ff0000',
        lineWidth: 2
      })

      lineSeries.setData(generateTestData())

      await waitFor(() => {
        const canvas = container.querySelector('canvas')
        expect(canvas).toBeInTheDocument()
        expect(canvas).toHaveStyle({width: '800px', height: '400px'})
      })

      chart.remove()
    })
  })

  describe('React Component Visual Consistency', () => {
    it('should render LightweightCharts component with consistent styling', async () => {
      const config: ComponentConfig = {
        charts: [
          {
            chartId: 'test-chart',
            chart: {
              height: 400,
              width: 800,
              autoSize: false,
              layout: {
                color: '#ffffff',
                textColor: '#000000'
              }
            },
            series: [
              {
                type: 'Line',
                data: generateTestData(),
                options: {
                  color: '#ff0000',
                  lineWidth: 2
                }
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

      render(<LightweightCharts config={config} />)

      await waitFor(() => {
        const chartContainer = document.querySelector('[id^="chart-container-"]')
        expect(chartContainer).toBeInTheDocument()
        expect(chartContainer).toHaveStyle({width: '800px', height: '400px'})
      })
    })

    it('should render multiple series with consistent layout', async () => {
      const config: ComponentConfig = {
        charts: [
          {
            chartId: 'test-chart',
            chart: {
              height: 400,
              width: 800,
              autoSize: false,
              layout: {
                color: '#ffffff',
                textColor: '#000000'
              }
            },
            series: [
              {
                type: 'Line',
                data: generateTestData(),
                options: {
                  color: '#ff0000',
                  lineWidth: 2
                }
              },
              {
                type: 'Area',
                data: generateTestData(),
                options: {
                  topColor: 'rgba(0, 255, 0, 0.4)',
                  bottomColor: 'rgba(0, 255, 0, 0.1)',
                  lineColor: '#00ff00'
                }
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

      render(<LightweightCharts config={config} />)

      await waitFor(() => {
        const chartContainer = document.querySelector('[id^="chart-container-"]')
        expect(chartContainer).toBeInTheDocument()
        expect(chartContainer).toHaveStyle({width: '800px', height: '400px'})
      })
    })
  })

  describe('Responsive Design Visual Consistency', () => {
    it('should maintain visual consistency across different sizes', async () => {
      const sizes = [
        {width: 400, height: 200},
        {width: 600, height: 300},
        {width: 800, height: 400},
        {width: 1000, height: 500}
      ]

      for (const size of sizes) {
        const testContainer = document.createElement('div')
        testContainer.style.width = `${size.width}px`
        testContainer.style.height = `${size.height}px`
        document.body.appendChild(testContainer)

        const chart = createChart(testContainer, {
          layout: {attributionLogo: false},
          width: size.width,
          height: size.height
        })

        const lineSeries = chart.addSeries(LineSeries, {
          color: '#ff0000',
          lineWidth: 2
        })

        lineSeries.setData(generateTestData())

        await waitFor(() => {
          const canvas = testContainer.querySelector('canvas')
          expect(canvas).toBeInTheDocument()
          expect(canvas).toHaveStyle({
            width: `${size.width}px`,
            height: `${size.height}px`
          })
        })

        chart.remove()
        testContainer.parentNode?.removeChild(testContainer)
      }
    })
  })
})
