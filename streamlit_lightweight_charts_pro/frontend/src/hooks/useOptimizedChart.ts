import {useCallback, useEffect, useLayoutEffect, useMemo, useRef} from 'react'
import {IChartApi, ISeriesApi, createChart} from 'lightweight-charts'
import {ChartReadyDetector} from '../utils/chartReadyDetection'
import {ResizeObserverManager} from '../utils/resizeObserverManager'

export interface UseOptimizedChartOptions {
  chartId: string
  autoResize?: boolean
  debounceMs?: number
  throttleMs?: number
  enablePerformanceMonitoring?: boolean
  minWidth?: number
  minHeight?: number
  maxReadyAttempts?: number
  baseReadyDelay?: number
}

export interface ChartRefs {
  chart: IChartApi | null
  container: HTMLElement | null
  series: ISeriesApi<any>[]
  isInitialized: boolean
  isDisposed: boolean
}

export function useOptimizedChart(options: UseOptimizedChartOptions) {
  const {
    chartId,
    autoResize = true,
    debounceMs = 100,
    throttleMs = 50,
    enablePerformanceMonitoring = false,
    minWidth = 200,
    minHeight = 200,
    maxReadyAttempts = 15,
    baseReadyDelay = 200
  } = options

  const chartRefs = useRef<ChartRefs>({
    chart: null,
    container: null,
    series: [],
    isInitialized: false,
    isDisposed: false
  })

  const resizeObserverManager = useRef<ResizeObserverManager>(new ResizeObserverManager())
  const performanceTimer = useRef<{start: () => void; end: () => void} | null>(null)

  // Performance monitoring setup
  useEffect(() => {
    if (enablePerformanceMonitoring) {
      performanceTimer.current = {
        start: () => performance.mark(`chart-${chartId}-start`),
        end: () => {
          performance.mark(`chart-${chartId}-end`)
          performance.measure(`chart-${chartId}`, `chart-${chartId}-start`, `chart-${chartId}-end`)
        }
      }
    }
  }, [chartId, enablePerformanceMonitoring])

  // Chart ready detection
  const waitForChartReady = useCallback(async (): Promise<boolean> => {
    if (!chartRefs.current.chart || !chartRefs.current.container) {
      return false
    }

    return ChartReadyDetector.waitForChartReady(
      chartRefs.current.chart,
      chartRefs.current.container,
      {
        minWidth,
        minHeight,
        maxAttempts: maxReadyAttempts,
        baseDelay: baseReadyDelay
      }
    )
  }, [minWidth, minHeight, maxReadyAttempts, baseReadyDelay])

  // Check if chart is ready synchronously
  const isChartReadySync = useCallback((): boolean => {
    return ChartReadyDetector.isChartReadySync(
      chartRefs.current.chart,
      chartRefs.current.container,
      minWidth,
      minHeight
    )
  }, [minWidth, minHeight])

  // Enhanced resize handler with validation
  const handleResize = useMemo(() => {
    if (!autoResize) return null

    return debounce((width: number, height: number) => {
      if (chartRefs.current.chart && !chartRefs.current.isDisposed) {
        try {
          // Validate dimensions before resizing
          if (width >= minWidth && height >= minHeight) {
            chartRefs.current.chart.resize(width, height)
          }
        } catch (error) {
          console.warn(`❌ Resize failed for chart ${chartId}:`, error)
        }
      }
    }, debounceMs)
  }, [autoResize, debounceMs, chartId, minWidth, minHeight])

  // Enhanced resize observer callback with better coordinate handling
  const enhancedResizeObserverCallback = useMemo(() => {
    if (!autoResize) return null

    return throttle((entries: ResizeObserverEntry[]) => {
      entries.forEach(entry => {
        if (entry.target === chartRefs.current.container) {
          const {width, height} = entry.contentRect

          // Check if dimensions are valid before resizing
          if (width >= minWidth && height >= minHeight) {
            if (handleResize) {
              handleResize(width, height)
            }
          }
        }
      })
    }, throttleMs)
  }, [autoResize, throttleMs, handleResize, minWidth, minHeight])

  // Setup resize observer with better error handling
  const setupResizeObserver = useCallback(() => {
    if (!autoResize || !chartRefs.current.container || !enhancedResizeObserverCallback) {
      return
    }

    try {
      resizeObserverManager.current.addObserver(
        `chart-${chartId}`,
        chartRefs.current.container,
        enhancedResizeObserverCallback,
        {throttleMs, debounceMs}
      )

      // ResizeObserver set up successfully
    } catch (error) {
      console.warn(`⚠️ Failed to setup resize observer for chart ${chartId}:`, error)
    }
  }, [autoResize, enhancedResizeObserverCallback, chartId, throttleMs, debounceMs])

  // Enhanced chart creation with ready detection
  const createChart = useCallback(
    async (container: HTMLElement, chartOptions: any): Promise<IChartApi | null> => {
      if (performanceTimer.current) {
        performanceTimer.current.start()
      }

      try {
        // Store container reference
        chartRefs.current.container = container

        // Create chart
        const chart = createChartFromOptions(container, chartOptions)
        if (!chart) {
          throw new Error('Failed to create chart')
        }

        // Store chart reference
        chartRefs.current.chart = chart
        chartRefs.current.isInitialized = true

        // Wait for chart to be ready
        const isReady = await waitForChartReady()
        if (isReady) {
          // Setup resize observer after chart is ready
          setupResizeObserver()
        }

        if (performanceTimer.current) {
          performanceTimer.current.end()
        }

        return chart
      } catch (error) {
        console.error(`❌ Failed to create chart ${chartId}:`, error)
        if (performanceTimer.current) {
          performanceTimer.current.end()
        }
        return null
      }
    },
    [chartId, waitForChartReady, setupResizeObserver]
  )

  // Enhanced series addition with ready detection
  const addSeries = useCallback(
    (seriesType: any, options: any = {}, paneId?: number): ISeriesApi<any> | null => {
      if (performanceTimer.current) {
        performanceTimer.current.start()
      }

      try {
        if (!chartRefs.current.chart || !chartRefs.current.isInitialized) {
          return null
        }

        // Use the seriesType parameter instead of hardcoded CandlestickSeries
        const series = chartRefs.current.chart.addSeries(seriesType, options)
        if (series) {
          chartRefs.current.series.push(series)
        }

        if (performanceTimer.current) {
          performanceTimer.current.end()
        }

        return series
      } catch (error) {
        console.error(`❌ Failed to add series to chart ${chartId}:`, error)
        if (performanceTimer.current) {
          performanceTimer.current.end()
        }
        return null
      }
    },
    [chartId]
  )

  // Get series by index with validation
  const getSeries = useCallback((index: number): ISeriesApi<any> | null => {
    if (index >= 0 && index < chartRefs.current.series.length) {
      return chartRefs.current.series[index]
    }
    return null
  }, [])

  // Get all series
  const getAllSeries = useCallback((): ISeriesApi<any>[] => {
    return [...chartRefs.current.series]
  }, [])

  // Enhanced ready check
  const isReady = useCallback((): boolean => {
    return chartRefs.current.isInitialized && !chartRefs.current.isDisposed && isChartReadySync()
  }, [isChartReadySync])

  // Get chart instance with validation
  const getChart = useCallback((): IChartApi | null => {
    if (chartRefs.current.chart && !chartRefs.current.isDisposed) {
      return chartRefs.current.chart
    }
    return null
  }, [])

  // Get container with validation
  const getContainer = useCallback((): HTMLElement | null => {
    if (chartRefs.current.container && !chartRefs.current.isDisposed) {
      return chartRefs.current.container
    }
    return null
  }, [])

  // Enhanced manual resize with validation
  const resize = useCallback(
    async (width: number, height: number) => {
      if (chartRefs.current.chart && !chartRefs.current.isDisposed) {
        try {
          // Validate dimensions
          if (width >= minWidth && height >= minHeight) {
            chartRefs.current.chart.resize(width, height)
          }
        } catch (error) {
          console.warn(`❌ Manual resize failed for chart ${chartId}:`, error)
        }
      }
    },
    [chartId, minWidth, minHeight]
  )

  // Enhanced cleanup with observer management
  const cleanup = useCallback(() => {
    // Mark as disposed
    chartRefs.current.isDisposed = true

    // Cleanup resize observers
    resizeObserverManager.current.cleanup()

    // Remove chart
    if (chartRefs.current.chart) {
      try {
        chartRefs.current.chart.remove()
      } catch (error) {
        console.warn(`⚠️ Error removing chart ${chartId}:`, error)
      }
    }

    // Clear references
    chartRefs.current.chart = null
    chartRefs.current.container = null
    chartRefs.current.series = []
    chartRefs.current.isInitialized = false
  }, [chartId])

  // Setup resize observer when chart is created
  useEffect(() => {
    if (chartRefs.current.isInitialized && !chartRefs.current.isDisposed) {
      setupResizeObserver()
    }
  }, [setupResizeObserver])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [cleanup])

  // Use layout effect for immediate cleanup when dependencies change
  useLayoutEffect(() => {
    const manager = resizeObserverManager.current
    return () => {
      // Immediate cleanup for layout changes
      manager.cleanup()
    }
  }, [])

  return {
    createChart,
    addSeries,
    getSeries,
    getAllSeries,
    getChart,
    getContainer,
    isReady,
    resize,
    cleanup,
    chartId,
    waitForChartReady,
    isChartReadySync
  }
}

/**
 * Hook for comparing chart configurations efficiently
 */
export function useChartConfigComparison<T>(config: T): T {
  return useMemo(() => config, [config])
}

// Utility functions
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

function createChartFromOptions(container: HTMLElement, options: any): IChartApi | null {
  try {
    const chart = createChart(container, options)
    return chart
  } catch (error) {
    console.error('❌ Failed to create chart:', error)
    return null
  }
}
