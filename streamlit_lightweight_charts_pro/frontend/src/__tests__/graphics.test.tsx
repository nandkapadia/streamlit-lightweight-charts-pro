import React from 'react'
import {render, screen, waitFor} from '@testing-library/react'
import '@testing-library/jest-dom'
import {
  createChart,
  LineSeries,
  AreaSeries,
  CandlestickSeries,
  HistogramSeries
} from 'lightweight-charts'
import LightweightCharts from '../LightweightCharts'
import {ComponentConfig} from '../types'

// Helper function to generate test data
function generateData() {
  const res = []
  const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0))
  for (let i = 0; i < 500; ++i) {
    res.push({
      time: time.getTime() / 1000,
      value: i
    })
    time.setUTCDate(time.getUTCDate() + 1)
  }
  return res
}

function generateCandlestickData() {
  const res = []
  const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0))
  for (let i = 0; i < 100; ++i) {
    const open = 100 + Math.random() * 20
    const close = open + (Math.random() - 0.5) * 10
    const high = Math.max(open, close) + Math.random() * 5
    const low = Math.min(open, close) - Math.random() * 5

    res.push({
      time: time.getTime() / 1000,
      open,
      high,
      low,
      close
    })
    time.setUTCDate(time.getUTCDate() + 1)
  }
  return res
}

function generateHistogramData() {
  const res = []
  const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0))
  for (let i = 0; i < 100; ++i) {
    res.push({
      time: time.getTime() / 1000,
      value: Math.random() * 1000000,
      color: Math.random() > 0.5 ? '#00ff00' : '#ff0000'
    })
    time.setUTCDate(time.getUTCDate() + 1)
  }
  return res
}

describe('Graphics Tests', () => {
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

  describe('Line Series Graphics', () => {
    it('should render line series with basic data', async () => {
      const chart = createChart(container, {layout: {attributionLogo: false}})
      const lineSeries = chart.addSeries(LineSeries, {
        lineWidth: 1,
        color: '#ff0000'
      })

      lineSeries.setData(generateData())

      await waitFor(() => {
        expect(container.querySelector('canvas')).toBeInTheDocument()
      })

      chart.remove()
    })

    it('should render line series with custom styling', async () => {
      const chart = createChart(container, {layout: {attributionLogo: false}})
      const lineSeries = chart.addSeries(LineSeries, {
        lineWidth: 2,
        color: '#00ff00',
        lineStyle: 1, // Dashed
        crosshairMarkerVisible: true,
        lastValueVisible: true
      })

      lineSeries.setData(generateData())

      await waitFor(() => {
        expect(container.querySelector('canvas')).toBeInTheDocument()
      })

      chart.remove()
    })

    it('should render line series with point markers', async () => {
      const chart = createChart(container, {layout: {attributionLogo: false}})
      const lineSeries = chart.addSeries(LineSeries, {
        lineWidth: 1,
        color: '#ff0000',
        pointMarkersVisible: true,
        pointMarkersRadius: 4
      })

      lineSeries.setData(generateData())

      await waitFor(() => {
        expect(container.querySelector('canvas')).toBeInTheDocument()
      })

      chart.remove()
    })
  })

  describe('Area Series Graphics', () => {
    it('should render area series with basic data', async () => {
      const chart = createChart(container, {layout: {attributionLogo: false}})
      const areaSeries = chart.addSeries(AreaSeries, {
        topColor: 'rgba(255, 0, 0, 0.4)',
        bottomColor: 'rgba(255, 0, 0, 0.1)',
        lineColor: '#ff0000',
        lineWidth: 2
      })

      areaSeries.setData(generateData())

      await waitFor(() => {
        expect(container.querySelector('canvas')).toBeInTheDocument()
      })

      chart.remove()
    })

    it('should render area series with gradient', async () => {
      const chart = createChart(container, {layout: {attributionLogo: false}})
      const areaSeries = chart.addSeries(AreaSeries, {
        topColor: 'rgba(0, 255, 0, 0.8)',
        bottomColor: 'rgba(0, 255, 0, 0.2)',
        lineColor: '#00ff00',
        lineWidth: 1
      })

      areaSeries.setData(generateData())

      await waitFor(() => {
        expect(container.querySelector('canvas')).toBeInTheDocument()
      })

      chart.remove()
    })

    it('should render area series with inverted fill', async () => {
      const chart = createChart(container, {layout: {attributionLogo: false}})
      const areaSeries = chart.addSeries(AreaSeries, {
        topColor: 'rgba(0, 255, 0, 0.4)',
        bottomColor: 'rgba(0, 255, 0, 0.1)',
        lineColor: '#00ff00',
        invertFilledArea: true
      })

      areaSeries.setData(generateData())

      await waitFor(() => {
        expect(container.querySelector('canvas')).toBeInTheDocument()
      })

      chart.remove()
    })
  })

  describe('Candlestick Series Graphics', () => {
    it('should render candlestick series with OHLC data', async () => {
      const chart = createChart(container, {layout: {attributionLogo: false}})
      const candlestickSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#00ff00',
        downColor: '#ff0000',
        borderVisible: true,
        wickVisible: true
      })

      candlestickSeries.setData(generateCandlestickData())

      await waitFor(() => {
        expect(container.querySelector('canvas')).toBeInTheDocument()
      })

      chart.remove()
    })

    it('should render candlestick series with custom colors', async () => {
      const chart = createChart(container, {layout: {attributionLogo: false}})
      const candlestickSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#00ff00',
        downColor: '#ff0000',
        borderUpColor: '#008000',
        borderDownColor: '#800000',
        wickUpColor: '#00ff00',
        wickDownColor: '#ff0000'
      })

      candlestickSeries.setData(generateCandlestickData())

      await waitFor(() => {
        expect(container.querySelector('canvas')).toBeInTheDocument()
      })

      chart.remove()
    })

    it('should render candlestick series with thin bars', async () => {
      const chart = createChart(container, {layout: {attributionLogo: false}})
      const candlestickSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#00ff00',
        downColor: '#ff0000',
        thinBars: true
      })

      candlestickSeries.setData(generateCandlestickData())

      await waitFor(() => {
        expect(container.querySelector('canvas')).toBeInTheDocument()
      })

      chart.remove()
    })
  })

  describe('Histogram Series Graphics', () => {
    it('should render histogram series with volume data', async () => {
      const chart = createChart(container, {layout: {attributionLogo: false}})
      const histogramSeries = chart.addSeries(HistogramSeries, {
        color: '#888888',
        priceFormat: {
          type: 'volume'
        },
        priceScaleId: 'volume'
      })

      histogramSeries.setData(generateHistogramData())

      await waitFor(() => {
        expect(container.querySelector('canvas')).toBeInTheDocument()
      })

      chart.remove()
    })

    it('should render histogram series with custom colors', async () => {
      const chart = createChart(container, {layout: {attributionLogo: false}})
      const histogramSeries = chart.addSeries(HistogramSeries, {
        color: '#888888',
        priceFormat: {
          type: 'volume'
        },
        priceScaleId: 'volume',
        scaleMargins: {
          top: 0.8,
          bottom: 0
        }
      })

      histogramSeries.setData(generateHistogramData())

      await waitFor(() => {
        expect(container.querySelector('canvas')).toBeInTheDocument()
      })

      chart.remove()
    })
  })

  describe('Chart Integration Graphics', () => {
    it('should render multiple series on same chart', async () => {
      const chart = createChart(container, {layout: {attributionLogo: false}})

      const lineSeries = chart.addSeries(LineSeries, {
        color: '#ff0000',
        lineWidth: 2
      })

      const areaSeries = chart.addSeries(AreaSeries, {
        topColor: 'rgba(0, 255, 0, 0.4)',
        bottomColor: 'rgba(0, 255, 0, 0.1)',
        lineColor: '#00ff00'
      })

      lineSeries.setData(generateData())
      areaSeries.setData(generateData())

      await waitFor(() => {
        expect(container.querySelector('canvas')).toBeInTheDocument()
      })

      chart.remove()
    })

    it('should render chart with custom layout', async () => {
      const chart = createChart(container, {
        layout: {
          attributionLogo: false,
          background: {color: '#f0f0f0'},
          textColor: '#333333'
        },
        grid: {
          vertLines: {color: '#e0e0e0'},
          horzLines: {color: '#e0e0e0'}
        },
        crosshair: {
          mode: 1,
          vertLine: {color: '#666666'},
          horzLine: {color: '#666666'}
        }
      })

      const lineSeries = chart.addSeries(LineSeries, {
        color: '#ff0000',
        lineWidth: 2
      })

      lineSeries.setData(generateData())

      await waitFor(() => {
        expect(container.querySelector('canvas')).toBeInTheDocument()
      })

      chart.remove()
    })

    it('should render chart with time scale options', async () => {
      const chart = createChart(container, {
        layout: {attributionLogo: false},
        timeScale: {
          timeVisible: true,
          secondsVisible: false,
          borderVisible: true,
          borderColor: '#cccccc'
        }
      })

      const lineSeries = chart.addSeries(LineSeries, {
        color: '#ff0000',
        lineWidth: 2
      })

      lineSeries.setData(generateData())

      await waitFor(() => {
        expect(container.querySelector('canvas')).toBeInTheDocument()
      })

      chart.remove()
    })

    it('should render chart with price scale options', async () => {
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
        }
      })

      const lineSeries = chart.addSeries(LineSeries, {
        color: '#ff0000',
        lineWidth: 2
      })

      lineSeries.setData(generateData())

      await waitFor(() => {
        expect(container.querySelector('canvas')).toBeInTheDocument()
      })

      chart.remove()
    })
  })

  describe('React Component Graphics', () => {
    it('should render LightweightCharts component with line series', async () => {
      const config: ComponentConfig = {
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
            series: [
              {
                type: 'Line',
                data: generateData(),
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
        expect(document.querySelector('[id^="chart-container-"]')).toBeInTheDocument()
      })
    })

    it('should render LightweightCharts component with multiple series', async () => {
      const config: ComponentConfig = {
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
            series: [
              {
                type: 'Line',
                data: generateData(),
                options: {
                  color: '#ff0000',
                  lineWidth: 2
                }
              },
              {
                type: 'Area',
                data: generateData(),
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
        expect(document.querySelector('[id^="chart-container-"]')).toBeInTheDocument()
      })
    })

    it('should render LightweightCharts component with candlestick series', async () => {
      const config: ComponentConfig = {
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
            series: [
              {
                type: 'Candlestick',
                data: generateCandlestickData(),
                options: {
                  upColor: '#00ff00',
                  downColor: '#ff0000',
                  borderVisible: true,
                  wickVisible: true
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
        expect(document.querySelector('[id^="chart-container-"]')).toBeInTheDocument()
      })
    })
  })

  describe('Performance Graphics', () => {
    it('should handle large datasets efficiently', async () => {
      const largeData = Array.from({length: 10000}, (_, i) => ({
        time: Date.now() / 1000 + i * 60,
        value: 100 + Math.random() * 20
      }))

      const chart = createChart(container, {layout: {attributionLogo: false}})
      const lineSeries = chart.addSeries(LineSeries, {
        color: '#ff0000',
        lineWidth: 1
      })

      const startTime = performance.now()
      lineSeries.setData(largeData)
      const endTime = performance.now()

      expect(endTime - startTime).toBeLessThan(1000) // Should complete within 1 second

      await waitFor(() => {
        expect(container.querySelector('canvas')).toBeInTheDocument()
      })

      chart.remove()
    })

    it('should handle multiple series with large datasets', async () => {
      const largeData = Array.from({length: 5000}, (_, i) => ({
        time: Date.now() / 1000 + i * 60,
        value: 100 + Math.random() * 20
      }))

      const chart = createChart(container, {layout: {attributionLogo: false}})

      const lineSeries = chart.addSeries(LineSeries, {color: '#ff0000'})
      const areaSeries = chart.addSeries(AreaSeries, {
        topColor: 'rgba(0, 255, 0, 0.4)',
        bottomColor: 'rgba(0, 255, 0, 0.1)'
      })

      const startTime = performance.now()
      lineSeries.setData(largeData)
      areaSeries.setData(largeData)
      const endTime = performance.now()

      expect(endTime - startTime).toBeLessThan(2000) // Should complete within 2 seconds

      await waitFor(() => {
        expect(container.querySelector('canvas')).toBeInTheDocument()
      })

      chart.remove()
    })
  })
})
