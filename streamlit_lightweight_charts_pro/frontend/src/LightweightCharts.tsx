import React, {useEffect, useRef, useCallback, useMemo} from 'react'
import {
  createChart,
  IChartApi,
  ISeriesApi,
  createSeriesMarkers,
  MouseEventParams
} from 'lightweight-charts'
import {
  ComponentConfig,
  ChartConfig,
  SeriesConfig,
  TradeConfig,
  TradeVisualizationOptions,
  Annotation,
  AnnotationLayer,
  LegendConfig,
  SyncConfig,
  PaneHeightOptions
} from './types'
import {createAnnotationVisualElements} from './services/annotationSystem'
import {SignalSeries} from './plugins/series/signalSeriesPlugin'
import {TradeRectanglePrimitive} from './plugins/trade/TradeRectanglePrimitive'
import {createPaneCollapsePlugin} from './plugins/chart/paneCollapsePlugin'
// Legend management is now handled directly via DOM manipulation like minimize buttons
// Legend management is now handled directly via DOM manipulation like minimize buttons
import {ChartReadyDetector} from './utils/chartReadyDetection'
import {ChartCoordinateService} from './services/ChartCoordinateService'
import {createLegendPanePrimitive} from './plugins/chart/legendPanePrimitive'

import './styles/paneCollapse.css'
import {cleanLineStyleOptions} from './utils/lineStyle'
import {createSeries} from './utils/seriesFactory'
import {getCachedDOMElement, createOptimizedStylesAdvanced} from './utils/performance'
import {ErrorBoundary} from './components/ErrorBoundary'

// Helper function to find nearest available time in chart data
const findNearestTime = (targetTime: number, chartData: any[]): number | null => {
  if (!chartData || chartData.length === 0) {
    return null
  }

  let nearestTime: number | null = null
  let minDiff = Infinity

  for (const item of chartData) {
    if (!item.time) continue

    let itemTime: number | null = null

    if (typeof item.time === 'number') {
      itemTime = item.time > 1000000000000 ? Math.floor(item.time / 1000) : item.time
    } else if (typeof item.time === 'string') {
      const parsed = new Date(item.time).getTime()
      if (!isNaN(parsed)) {
        itemTime = Math.floor(parsed / 1000)
      }
    }

    if (itemTime === null) continue

    const diff = Math.abs(itemTime - targetTime)
    if (diff < minDiff) {
      minDiff = diff
      nearestTime = itemTime
    }
  }

  return nearestTime
}

// Global type declarations for window extensions
declare global {
  interface Window {
    chartApiMap: {[chartId: string]: IChartApi}
    chartResizeObservers: {[chartId: string]: ResizeObserver}
    legendRefreshCallbacks: {[chartId: string]: (() => void)[]}
    // Legend management is now handled directly via DOM manipulation like minimize buttons
    // Legend management is now handled directly via DOM manipulation like minimize buttons
    paneCollapsePlugins: {[chartId: string]: any[]}
    chartGroupMap: {[chartId: string]: number}
    seriesRefsMap: {[chartId: string]: ISeriesApi<any>[]}
  }
}

// Utility function for retrying async operations with exponential backoff
const retryWithBackoff = async (
  operation: () => Promise<any>,
  maxRetries: number = 5,
  baseDelay: number = 100,
  operationName: string = 'operation'
): Promise<any> => {
  let lastError: Error

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error

      if (attempt === maxRetries - 1) {
        throw lastError
      }

      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 100
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError
}

/**
 * Create legend for a series using pane primitive (like minimize buttons)
 */
const createLegendForSeries = async (
  chart: IChartApi,
  seriesConfig: SeriesConfig,
  chartId: string,
  seriesIndex: number,
  legendResizeObserverRefs: React.MutableRefObject<{[key: string]: ResizeObserver}>
): Promise<void> => {
  if (!seriesConfig.legend || !seriesConfig.legend.visible) return

  try {
    const paneId = seriesConfig.paneId || 0

    // Create legend pane primitive (like minimize buttons do)
    const legendPrimitive = createLegendPanePrimitive(
      paneId,
      seriesIndex,
      chartId,
      seriesConfig.legend
    )

    // Store the primitive reference for value updates
    if (!(window as any).legendPrimitives) {
      ;(window as any).legendPrimitives = {}
    }
    const primitiveKey = `${chartId}-${seriesIndex}`
    ;(window as any).legendPrimitives[primitiveKey] = legendPrimitive

    console.log(`✅ [Legend] Stored legend primitive:`, {
      key: primitiveKey,
      chartId: chartId,
      seriesIndex: seriesIndex,
      hasText: !!seriesConfig.legend.text,
      text: seriesConfig.legend.text,
      containsPlaceholder: seriesConfig.legend.text?.includes('$$value$$')
    })

    // Attach the primitive to the pane (like minimize buttons do)
    const panes = chart.panes()
    if (paneId < panes.length) {
      const pane = panes[paneId]
      pane.attachPrimitive(legendPrimitive)
      console.log(
        `✅ [Legend] Attached legend primitive for series ${seriesIndex} to pane ${paneId}`
      )
    } else {
      console.warn(`[Legend] Pane ${paneId} not found for series ${seriesIndex}`)
    }
  } catch (error) {
    console.error(`❌ [Legend] Error creating legend for series ${seriesIndex}:`, error)
  }
}

interface LightweightChartsProps {
  config: ComponentConfig
  height?: number | null
  width?: number | null
  onChartsReady?: () => void
}

// Performance optimization: Memoize the component to prevent unnecessary re-renders
const LightweightCharts: React.FC<LightweightChartsProps> = React.memo(
  ({config, height = 400, width = null, onChartsReady}) => {
    // Component initialization

    const chartRefs = useRef<{[key: string]: IChartApi}>({})
    const seriesRefs = useRef<{[key: string]: ISeriesApi<any>[]}>({})
    const signalPluginRefs = useRef<{[key: string]: SignalSeries}>({})
    const chartConfigs = useRef<{[key: string]: ChartConfig}>({})
    const resizeObserverRef = useRef<ResizeObserver | null>(null)
    const legendResizeObserverRefs = useRef<{[key: string]: ResizeObserver}>({})
    const isInitializedRef = useRef<boolean>(false)
    const isDisposingRef = useRef<boolean>(false)
    const fitContentTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const initializationTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const prevConfigRef = useRef<ComponentConfig | null>(null)
    const chartContainersRef = useRef<{[key: string]: HTMLElement}>({})
    const debounceTimersRef = useRef<{[key: string]: NodeJS.Timeout}>({})

    // Store function references to avoid dependency issues
    const functionRefs = useRef<{
      addTradeVisualization: any
      addAnnotations: any
      addModularTooltip: any
      addAnnotationLayers: any
      addRangeSwitcher: any
      addLegend: any
      updateLegendPositions: any
      setupAutoSizing: any
      setupChartSynchronization: any
      setupFitContent: any
      setupPaneCollapseSupport: any
      cleanupCharts: any
    }>({
      addTradeVisualization: null,
      addAnnotations: null,
      addModularTooltip: null,
      addAnnotationLayers: null,
      addRangeSwitcher: null,
      addLegend: null,
      updateLegendPositions: null,
      setupAutoSizing: null,
      setupChartSynchronization: null,
      setupFitContent: null,
      setupPaneCollapseSupport: null,
      cleanupCharts: null
    })

    // Performance optimization: Memoize container dimensions calculation
    const getContainerDimensions = useCallback((container: HTMLElement) => {
      const rect = container.getBoundingClientRect()
      return {
        width: rect.width,
        height: rect.height
      }
    }, [])

    // Performance optimization: Debounced resize handler
    const debouncedResizeHandler = useCallback(
      (chartId: string, chart: IChartApi, container: HTMLElement, chartConfig: ChartConfig) => {
        // Clear existing timer
        if (debounceTimersRef.current[chartId]) {
          clearTimeout(debounceTimersRef.current[chartId])
        }

        // Set new timer
        debounceTimersRef.current[chartId] = setTimeout(() => {
          try {
            const dimensions = getContainerDimensions(container)
            const newWidth = chartConfig.autoWidth
              ? dimensions.width
              : chartConfig.chart?.width || width
            // Prioritize height from chart options (JSON config) over autoHeight
            const newHeight =
              chartConfig.chart?.height ||
              (chartConfig.autoHeight ? dimensions.height : height) ||
              dimensions.height

            chart.resize(newWidth, newHeight)
          } catch (error) {
            // Auto-sizing resize failed
          }
        }, 100) // 100ms debounce
      },
      [width, height, getContainerDimensions]
    )

    // Function to setup auto-sizing for a chart
    const setupAutoSizing = useCallback(
      (chart: IChartApi, container: HTMLElement, chartConfig: ChartConfig) => {
        // Auto-sizing implementation
        if (chartConfig.autoSize || chartConfig.autoWidth || chartConfig.autoHeight) {
          const chartId = chart.chartElement().id || 'default'

          const resizeObserver =
            typeof ResizeObserver !== 'undefined'
              ? new ResizeObserver(() => {
                  debouncedResizeHandler(chartId, chart, container, chartConfig)
                })
              : null

          if (resizeObserver && typeof resizeObserver.observe === 'function') {
            resizeObserver.observe(container)
          }
          resizeObserverRef.current = resizeObserver
        }
      },
      [debouncedResizeHandler]
    )

    const setupChartSynchronization = useCallback(
      (chart: IChartApi, chartId: string, syncConfig: SyncConfig, chartGroupId: number = 0) => {
        // Store chart reference for synchronization
        if (!chartRefs.current[chartId]) {
          chartRefs.current[chartId] = chart
        }

        // Helper function to get crosshair data point from series data
        const getCrosshairDataPoint = (series: ISeriesApi<any>, param: any) => {
          if (!param.time) {
            return null
          }
          const dataPoint = param.seriesData.get(series)
          return dataPoint || null
        }

        // Helper function to sync crosshair between charts (TradingView's official approach)
        const syncCrosshair = (
          targetChart: IChartApi,
          targetSeries: ISeriesApi<any>,
          dataPoint: any
        ) => {
          if (dataPoint) {
            targetChart.setCrosshairPosition(dataPoint.value, dataPoint.time, targetSeries)
            return
          }
          targetChart.clearCrosshairPosition()
        }

        // Setup crosshair synchronization (TradingView's official approach)
        if (syncConfig.crosshair) {
          // Add localStorage event listener for cross-component sync (only once per chart)
          if (!(chart as any)._storageListenerAdded) {
            let lastSyncTimestamp = 0
            const SYNC_DEBOUNCE_MS = 50 // Prevent rapid-fire sync events

            const handleStorageChange = (e: StorageEvent) => {
              if (e.key === 'chart_sync_data' && e.newValue) {
                try {
                  const syncData = JSON.parse(e.newValue)
                  if (
                    syncData.chartId !== chartId &&
                    syncData.groupId === chartGroupId &&
                    syncData.type === 'crosshair'
                  ) {
                    // Debounce to prevent feedback loops
                    const now = Date.now()
                    if (now - lastSyncTimestamp < SYNC_DEBOUNCE_MS) {
                      return
                    }
                    lastSyncTimestamp = now

                    // Apply crosshair sync from other component
                    if (syncData.time && syncData.value) {
                      const targetSeries = seriesRefs.current[chartId]?.[0]
                      if (targetSeries) {
                        // Set flag to prevent this update from triggering localStorage storage
                        ;(chart as any)._isExternalSync = true
                        chart.setCrosshairPosition(syncData.value, syncData.time, targetSeries)
                        // Clear flag after a short delay
                        setTimeout(() => {
                          ;(chart as any)._isExternalSync = false
                        }, 100)
                      }
                    }
                  }
                } catch (e) {
                  // Silent error handling
                }
              }
            }

            window.addEventListener('storage', handleStorageChange)
            ;(chart as any)._storageListenerAdded = true
          }

          chart.subscribeCrosshairMove(param => {
            // Skip if this is an external sync to prevent feedback loops
            if ((chart as any)._isExternalSync) {
              return
            }

            // Get all series from the current chart using stored references
            const currentSeries = seriesRefs.current[chartId] || []

            // Method 1: Same-component synchronization (direct object references)
            Object.entries(window.chartApiMap || {}).forEach(([id, otherChart]) => {
              if (id !== chartId && otherChart) {
                try {
                  // Get the other chart's group ID from global registry
                  const otherChartGroupId = window.chartGroupMap?.[id] || 0

                  // Only sync charts in the same group
                  if (otherChartGroupId === chartGroupId && param.time) {
                    const otherSeries = window.seriesRefsMap?.[id] || []

                    // Sync using TradingView's approach - sync first series to first series
                    if (currentSeries.length > 0 && otherSeries.length > 0) {
                      const dataPoint = getCrosshairDataPoint(currentSeries[0], param)
                      syncCrosshair(otherChart, otherSeries[0], dataPoint)
                    }
                  }
                } catch (error) {
                  // Silent error handling
                }
              }
            })

            // Method 2: Cross-component synchronization using localStorage
            if (param.time && currentSeries.length > 0) {
              const dataPoint = getCrosshairDataPoint(currentSeries[0], param)
              const syncData = {
                time: param.time,
                value: dataPoint ? dataPoint.value : null,
                chartId: chartId,
                groupId: chartGroupId,
                timestamp: Date.now(),
                type: 'crosshair'
              }

              // Store in localStorage for cross-component communication
              try {
                localStorage.setItem('chart_sync_data', JSON.stringify(syncData))
              } catch (e) {
                // Silent error handling
              }
            }
          })
        }

        // Setup time range synchronization (TradingView's official approach)
        if (syncConfig.timeRange) {
          const timeScale = chart.timeScale()
          if (timeScale) {
            // Add localStorage event listener for cross-component time range sync
            // (only once per chart)
            if (!(chart as any)._timeRangeStorageListenerAdded) {
              let lastTimeRangeSyncTimestamp = 0
              const TIME_RANGE_SYNC_DEBOUNCE_MS = 100 // Prevent rapid-fire time range sync events

              const handleTimeRangeStorageChange = (e: StorageEvent) => {
                if (e.key === 'chart_time_range_sync' && e.newValue) {
                  try {
                    const syncData = JSON.parse(e.newValue)
                    if (
                      syncData.chartId !== chartId &&
                      syncData.groupId === chartGroupId &&
                      syncData.type === 'timeRange'
                    ) {
                      // Debounce to prevent feedback loops
                      const now = Date.now()
                      if (now - lastTimeRangeSyncTimestamp < TIME_RANGE_SYNC_DEBOUNCE_MS) {
                        return
                      }
                      lastTimeRangeSyncTimestamp = now

                      // Apply time range sync from other component
                      if (syncData.timeRange) {
                        const currentTimeScale = chart.timeScale()
                        if (currentTimeScale) {
                          // Set flag to prevent this update from triggering localStorage storage
                          ;(chart as any)._isExternalTimeRangeSync = true
                          currentTimeScale.setVisibleLogicalRange(syncData.timeRange)
                          // Clear flag after a short delay
                          setTimeout(() => {
                            ;(chart as any)._isExternalTimeRangeSync = false
                          }, 150)
                        }
                      }
                    }
                  } catch (e) {
                    // Silent error handling
                  }
                }
              }

              window.addEventListener('storage', handleTimeRangeStorageChange)
              ;(chart as any)._timeRangeStorageListenerAdded = true
            }

            timeScale.subscribeVisibleLogicalRangeChange(timeRange => {
              // Skip if this is an external sync to prevent feedback loops
              if ((chart as any)._isExternalTimeRangeSync) {
                return
              }

              // Method 1: Same-component synchronization (direct object references)
              Object.entries(window.chartApiMap || {}).forEach(([id, otherChart]) => {
                if (id !== chartId && otherChart) {
                  try {
                    // Get the other chart's group ID from global registry
                    const otherChartGroupId = window.chartGroupMap?.[id] || 0

                    // Only sync charts in the same group
                    if (otherChartGroupId === chartGroupId) {
                      const otherTimeScale = otherChart.timeScale()
                      if (otherTimeScale && timeRange) {
                        otherTimeScale.setVisibleLogicalRange(timeRange)
                      }
                    }
                  } catch (error) {
                    // Silent error handling
                  }
                }
              })

              // Method 2: Cross-component synchronization using localStorage
              if (timeRange) {
                const syncData = {
                  timeRange: timeRange,
                  chartId: chartId,
                  groupId: chartGroupId,
                  timestamp: Date.now(),
                  type: 'timeRange'
                }

                // Store in localStorage for cross-component communication
                try {
                  localStorage.setItem('chart_time_range_sync', JSON.stringify(syncData))
                } catch (e) {
                  // Silent error handling
                }
              }
            })
          }
        }
      },
      []
    )

    /**
     * Wrap each pane in its own individual container for proper collapse functionality
     */
    const setupPaneCollapseSupport = useCallback(
      (chart: IChartApi, chartId: string, paneCount: number) => {
        try {
          console.log(`[PaneSetup] Setting up collapse support for ${paneCount} panes`)

          // Initialize pane wrapper registry for collapse plugin to use
          ;(window as any).paneWrappers = (window as any).paneWrappers || {}
          ;(window as any).paneWrappers[chartId] = {}

          // Store chart reference for pane collapse to work with stretch factors
          ;(window as any).chartInstances = (window as any).chartInstances || {}
          ;(window as any).chartInstances[chartId] = chart

          console.log(`[PaneSetup] Collapse support ready for ${paneCount} panes`)
        } catch (error) {
          console.error('[PaneSetup] Error setting up pane collapse support:', error)
        }
      },
      []
    )

    const setupFitContent = useCallback((chart: IChartApi, chartConfig: ChartConfig) => {
      // Safety check for chart.timeScale() method
      if (!chart || typeof chart.timeScale !== 'function') {
        return
      }

      const timeScale = chart.timeScale()
      if (!timeScale) return

      // Track last click time for double-click detection
      let lastClickTime = 0
      const doubleClickThreshold = 300 // milliseconds

      // Check if fitContent on load is enabled
      const shouldFitContentOnLoad =
        chartConfig.chart?.timeScale?.fitContentOnLoad !== false &&
        chartConfig.chart?.fitContentOnLoad !== false

      if (shouldFitContentOnLoad) {
        // Wait for data to be loaded and then fit content
        const handleDataLoaded = async (retryCount = 0) => {
          const maxRetries = 50 // Prevent infinite loops

          if (retryCount >= maxRetries) {
            return
          }

          try {
            // Check if chart has series with data
            const series = Object.values(seriesRefs.current).flat()

            if (series.length === 0) {
              // No series yet, try again after a delay
              setTimeout(() => handleDataLoaded(retryCount + 1), 100)
              return
            }

            // Trade visualization is now handled synchronously in createSeries
            // No need to wait for trade data or call addTradeVisualizationWhenReady

            // Check if chart has a visible range (more reliable than checking series data)
            const visibleRange = timeScale.getVisibleRange()

            if (visibleRange && visibleRange.from && visibleRange.to) {
              timeScale.fitContent()
              // Trade visualization is now handled synchronously in createSeries
            } else {
              // If no visible range, try again after a short delay
              setTimeout(async () => {
                try {
                  timeScale.fitContent()
                  // Trade visualization is now handled synchronously in createSeries
                } catch (error) {
                  // fitContent after delay failed
                }
              }, 100)
            }
          } catch (error) {
            // fitContent failed
          }
        }

        // Clear any existing timeout
        if (fitContentTimeoutRef.current) {
          clearTimeout(fitContentTimeoutRef.current)
        }

        // Call fitContent after a longer delay to ensure data is loaded
        fitContentTimeoutRef.current = setTimeout(async () => {
          await handleDataLoaded()
        }, 1000) // Increased delay to wait for trade data
      }

      // Setup double-click to fit content
      const shouldHandleDoubleClick =
        chartConfig.chart?.timeScale?.handleDoubleClick !== false &&
        chartConfig.chart?.handleDoubleClick !== false

      if (shouldHandleDoubleClick) {
        // Subscribe to chart click events
        chart.subscribeClick(param => {
          const currentTime = Date.now()

          // Check if this is a double-click
          if (currentTime - lastClickTime < doubleClickThreshold) {
            try {
              timeScale.fitContent()
            } catch (error) {
              // fitContent on double-click failed
            }
            lastClickTime = 0 // Reset to prevent triple-click
          } else {
            lastClickTime = currentTime
          }
        })
      }
    }, [])

    // Performance optimization: Enhanced cleanup function with better memory management
    const cleanupCharts = useCallback(() => {
      // Cleanup charts

      // Set disposing flag to prevent async operations
      // But don't set it if this is the initial render
      if (prevConfigRef.current !== null) {
        isDisposingRef.current = true
      }

      // Clear all debounce timers
      Object.values(debounceTimersRef.current).forEach(timer => {
        if (timer) clearTimeout(timer)
      })
      debounceTimersRef.current = {}

      // Clear any pending timeouts
      if (fitContentTimeoutRef.current) {
        clearTimeout(fitContentTimeoutRef.current)
        fitContentTimeoutRef.current = null
      }

      if (initializationTimeoutRef.current) {
        clearTimeout(initializationTimeoutRef.current)
        initializationTimeoutRef.current = null
      }

      // Disconnect resize observer
      if (resizeObserverRef.current) {
        try {
          resizeObserverRef.current.disconnect()
        } catch (error) {
          // ResizeObserver already disconnected
        }
        resizeObserverRef.current = null
      }

      // Clean up signal series plugins
      Object.entries(signalPluginRefs.current).forEach(([key, signalSeries]) => {
        try {
          signalSeries.destroy()
        } catch (error) {
          // Signal series already destroyed
        }
      })

      // Legend management is now handled directly via DOM manipulation

      // Clean up legend resize observers
      Object.values(legendResizeObserverRefs.current).forEach(resizeObserver => {
        try {
          resizeObserver.disconnect()
        } catch (error) {
          // ResizeObserver already disconnected
        }
      })

      // Legend cleanup is now handled automatically by pane primitives

      // Clean up pane collapse plugins
      if ((window as any).paneCollapsePlugins) {
        Object.entries((window as any).paneCollapsePlugins).forEach(
          ([chartId, plugins]: [string, any]) => {
            if (Array.isArray(plugins)) {
              plugins.forEach((plugin: any) => {
                try {
                  if (plugin && typeof plugin.detached === 'function') {
                    // For pane primitives, we need to detach them from the pane
                    // The chart cleanup will handle the actual removal
                    plugin.detached()
                  }
                } catch (error) {
                  // Plugin already detached
                }
              })
            }
          }
        )
        ;(window as any).paneCollapsePlugins = {}
      }

      // Unregister charts from coordinate service
      const coordinateService = ChartCoordinateService.getInstance()
      Object.keys(chartRefs.current).forEach(chartId => {
        coordinateService.unregisterChart(chartId)
      })

      // Remove all charts with better error handling
      Object.values(chartRefs.current).forEach(chart => {
        try {
          // Check if chart is still valid before removing
          if (chart && typeof chart.remove === 'function') {
            chart.remove()
          }
        } catch (error) {
          // Chart already removed or disposed
        }
      })

      // Clear references
      chartRefs.current = {}
      seriesRefs.current = {}
      signalPluginRefs.current = {}
      chartConfigs.current = {}
      legendResizeObserverRefs.current = {}
      chartContainersRef.current = {}

      // Reset initialization flag
      isInitializedRef.current = false
    }, [])

    const addTradeVisualization = useCallback(
      async (
        chart: IChartApi,
        series: ISeriesApi<any>,
        trades: TradeConfig[],
        options: TradeVisualizationOptions,
        chartData?: any[]
      ) => {
        if (!trades || trades.length === 0) {
          return
        }

        try {
          // Create rectangles if style includes rectangles
          const primitives: any[] = []

          if (options.style === 'rectangles' || options.style === 'both') {
            // CRITICAL FIX: Use findNearestTime to adjust timestamps to match available chart data
            const rectanglePrimitives = trades
              .map((trade, index) => {
                // Parse and adjust timestamps using findNearestTime
                const originalEntryTime =
                  typeof trade.entryTime === 'string'
                    ? Math.floor(new Date(trade.entryTime).getTime() / 1000)
                    : trade.entryTime
                const originalExitTime =
                  typeof trade.exitTime === 'string'
                    ? Math.floor(new Date(trade.exitTime).getTime() / 1000)
                    : trade.exitTime

                // Find nearest available times in chart data
                let adjustedEntryTime = originalEntryTime
                let adjustedExitTime = originalExitTime

                if (chartData && chartData.length > 0) {
                  // Use findNearestTime to get the closest available timestamps
                  const nearestEntryTime = findNearestTime(originalEntryTime as any, chartData)
                  const nearestExitTime = findNearestTime(originalExitTime as any, chartData)

                  if (nearestEntryTime) adjustedEntryTime = nearestEntryTime
                  if (nearestExitTime) adjustedExitTime = nearestExitTime
                }

                // Build dynamic text based on TradeVisualizationOptions
                let rectangleText = ''
                if (options.rectangleShowText !== false) {
                  // Default to showing text unless explicitly disabled
                  const textParts: string[] = []

                  // Add trade ID if enabled
                  if (options.showTradeId !== false && (trade as any).id) {
                    textParts.push(`ID: ${(trade as any).id}`)
                  }

                  // Add quantity if enabled
                  if (options.showQuantity !== false && (trade as any).quantity) {
                    textParts.push(`Qty: ${(trade as any).quantity}`)
                  }

                  // Add trade type if enabled
                  if (options.showTradeType !== false) {
                    const tradeType = trade.isProfitable ? 'Profit' : 'Loss'
                    textParts.push(tradeType)
                  }

                  // Add P&L if available
                  if (trade.pnl) {
                    textParts.push(`P&L: ${trade.pnl.toFixed(2)}`)
                  } else if (trade.pnlPercentage) {
                    textParts.push(`P&L: ${trade.pnlPercentage.toFixed(1)}%`)
                  }

                  // Use built text or fallback to notes/text
                  rectangleText =
                    textParts.length > 0 ? textParts.join(' | ') : trade.notes || trade.text || ''
                }

                // Create primitive with adjusted timestamps
                const primitiveData = {
                  time1: adjustedEntryTime as any, // Cast to UTCTimestamp
                  time2: adjustedExitTime as any, // Cast to UTCTimestamp
                  price1: trade.entryPrice,
                  price2: trade.exitPrice,
                  fillColor: trade.isProfitable
                    ? options.rectangleColorProfit || 'rgba(76, 175, 80, 0.2)'
                    : options.rectangleColorLoss || 'rgba(244, 67, 54, 0.2)',
                  borderColor: trade.isProfitable
                    ? options.rectangleColorProfit || 'rgb(76, 175, 80)'
                    : options.rectangleColorLoss || 'rgb(244, 67, 54)',
                  borderWidth: options.rectangleBorderWidth || 1,
                  borderStyle: 'solid' as const,
                  opacity: options.rectangleFillOpacity || 0.2,
                  label: rectangleText,
                  // Pass text configuration to primitive
                  textPosition: options.rectangleTextPosition || 'inside',
                  textFontSize: options.rectangleTextFontSize || 10,
                  textColor: options.rectangleTextColor || '#FFFFFF',
                  textBackground: options.rectangleTextBackground || 'rgba(0, 0, 0, 0.7)'
                }

                return new TradeRectanglePrimitive(primitiveData)
              })
              .filter(primitive => primitive !== null)

            primitives.push(...rectanglePrimitives)
          }

          // Attach primitives to the series (official TradingView approach)
          if (primitives.length > 0) {
            primitives.forEach((primitive, index) => {
              try {
                series.attachPrimitive(primitive)
              } catch (error) {
                console.error(
                  `❌ [addTradeVisualization] Error attaching primitive ${index}:`,
                  error
                )
              }
            })
          }

          // Add entry/exit markers if style includes markers
          if (options.style === 'markers' || options.style === 'both') {
            const markers: any[] = []

            trades.forEach((trade, index) => {
              // Parse and adjust timestamps using findNearestTime (same logic as rectangles)
              const originalEntryTime =
                typeof trade.entryTime === 'string'
                  ? Math.floor(new Date(trade.entryTime).getTime() / 1000)
                  : trade.entryTime
              const originalExitTime =
                typeof trade.exitTime === 'string'
                  ? Math.floor(new Date(trade.exitTime).getTime() / 1000)
                  : trade.exitTime

              // Find nearest available times in chart data
              let adjustedEntryTime = originalEntryTime
              let adjustedExitTime = originalExitTime

              if (chartData && chartData.length > 0) {
                const nearestEntryTime = findNearestTime(originalEntryTime as any, chartData)
                const nearestExitTime = findNearestTime(originalExitTime as any, chartData)

                if (nearestEntryTime) adjustedEntryTime = nearestEntryTime
                if (nearestExitTime) adjustedExitTime = nearestExitTime
              }

              // Entry marker
              if (adjustedEntryTime && typeof trade.entryPrice === 'number') {
                const isLong = trade.tradeType === 'long'
                const markerText = options.showPnlInMarkers
                  ? `Entry: ${trade.entryPrice}`
                  : trade.notes || trade.text || ''

                markers.push({
                  time: adjustedEntryTime as any, // Cast to UTCTimestamp
                  position: isLong ? 'belowBar' : 'aboveBar',
                  color: isLong
                    ? options.entryMarkerColorLong || '#2196F3'
                    : options.entryMarkerColorShort || '#FF9800',
                  shape: isLong ? 'arrowUp' : 'arrowDown',
                  size: options.markerSize || 5,
                  text: markerText
                })
              }

              // Exit marker
              if (adjustedExitTime && typeof trade.exitPrice === 'number') {
                const isLong = trade.tradeType === 'long'
                const isProfit = trade.isProfitable || (trade.pnl && trade.pnl >= 0)
                let markerText = ''

                if (options.showPnlInMarkers) {
                  markerText = `Exit: ${trade.exitPrice}`
                  if (trade.pnl)
                    markerText += ` (${trade.pnl > 0 ? '+' : ''}${trade.pnl.toFixed(2)})`
                  else if (trade.pnlPercentage)
                    markerText += ` (${trade.pnlPercentage > 0 ? '+' : ''}${trade.pnlPercentage.toFixed(1)}%)`
                }

                markers.push({
                  time: adjustedExitTime as any, // Cast to UTCTimestamp
                  position: isLong ? 'aboveBar' : 'belowBar',
                  color: isProfit
                    ? options.exitMarkerColorProfit || '#4CAF50'
                    : options.exitMarkerColorLoss || '#F44336',
                  shape: isLong ? 'arrowDown' : 'arrowUp',
                  size: options.markerSize || 5,
                  text: markerText
                })
              }
            })

            if (markers.length > 0) {
              try {
                // Use createSeriesMarkers instead of setMarkers for compatibility
                createSeriesMarkers(series, markers)
              } catch (error) {
                console.error('❌ [addTradeVisualization] Error adding markers:', error)
              }
            }
          }

          // Handle other style options
          if (
            options.style === 'lines' ||
            options.style === 'arrows' ||
            options.style === 'zones'
          ) {
            console.warn(
              `🚧 [addTradeVisualization] Style '${options.style}' is not yet implemented. Available: rectangles, markers, both`
            )
          }
        } catch (error) {
          console.error('❌ [addTradeVisualization] Error in trade visualization:', error)
        }
      },
      []
    )

    // Trade visualization is now handled synchronously in createSeries function
    // No need for addTradeVisualizationWhenReady anymore

    const addAnnotations = useCallback(
      (chart: IChartApi, annotations: Annotation[] | {layers: any}) => {
        // Handle annotation manager structure from Python side
        let annotationsArray: Annotation[] = []

        if (annotations && typeof annotations === 'object') {
          // Check if this is an annotation manager structure (has layers)
          if ('layers' in annotations && annotations.layers) {
            // Extract annotations from all visible layers
            try {
              const layersArray = Object.values(annotations.layers)
              if (Array.isArray(layersArray)) {
                layersArray.forEach((layer: any) => {
                  if (
                    layer &&
                    layer.visible !== false &&
                    layer.annotations &&
                    Array.isArray(layer.annotations)
                  ) {
                    annotationsArray.push(...layer.annotations)
                  }
                })
              }
            } catch (error) {
              // Error processing annotation layers
            }
          } else if (Array.isArray(annotations)) {
            // Direct array of annotations
            annotationsArray = annotations
          }
        }

        // Validate annotations parameter
        if (!annotationsArray || !Array.isArray(annotationsArray)) {
          return
        }

        // Additional safety check - ensure annotations is actually an array
        try {
          if (typeof annotationsArray.forEach !== 'function') {
            return
          }
        } catch (error) {
          return
        }

        // Filter out invalid annotations
        const validAnnotations = annotationsArray.filter(
          annotation => annotation && typeof annotation === 'object' && annotation.time
        )

        if (validAnnotations.length === 0) {
          return
        }

        // Additional safety check before calling createAnnotationVisualElements
        if (!Array.isArray(validAnnotations) || typeof validAnnotations.forEach !== 'function') {
          console.error(
            'addAnnotations: validAnnotations is still not a proper array:',
            validAnnotations
          )
          return
        }

        const visualElements = createAnnotationVisualElements(validAnnotations)

        // Add markers using the markers plugin
        if (visualElements.markers.length > 0) {
          const seriesList = Object.values(seriesRefs.current).flat()
          if (seriesList.length > 0) {
            createSeriesMarkers(seriesList[0], visualElements.markers)
          }
        }

        // Add shapes using the shapes plugin
        if (visualElements.shapes.length > 0) {
          const seriesList = Object.values(seriesRefs.current).flat()
          if (seriesList.length > 0) {
            visualElements.shapes.forEach(shape => {
              try {
                if ((seriesList[0] as any).addShape) {
                  ;(seriesList[0] as any).addShape(shape)
                } else if ((seriesList[0] as any).setShapes) {
                  ;(seriesList[0] as any).setShapes([shape])
                }
              } catch (error) {
                // Error adding shape
              }
            })
          }
        }
      },
      []
    )

    const addAnnotationLayers = useCallback(
      (chart: IChartApi, layers: AnnotationLayer[] | {layers: any}) => {
        // Handle annotation manager structure from Python side
        let layersArray: AnnotationLayer[] = []

        if (layers && typeof layers === 'object') {
          // Check if this is an annotation manager structure (has layers)
          if ('layers' in layers && layers.layers) {
            // Convert layers object to array
            try {
              const layersValues = Object.values(layers.layers)
              if (Array.isArray(layersValues)) {
                layersArray = layersValues as AnnotationLayer[]
              }
            } catch (error) {
              // Error processing layers object
            }
          } else if (Array.isArray(layers)) {
            // Direct array of layers
            layersArray = layers
          }
        }

        // Validate layers parameter
        if (!layersArray || !Array.isArray(layersArray)) {
          return
        }

        layersArray.forEach((layer, index) => {
          try {
            if (!layer || typeof layer !== 'object') {
              return
            }

            if (layer.visible !== false && layer.annotations) {
              functionRefs.current.addAnnotations(chart, layer.annotations)
            }
          } catch (error) {
            // Error processing layer
          }
        })
      },
      []
    )

    const addModularTooltip = useCallback(
      (
        chart: IChartApi,
        container: HTMLElement,
        seriesList: ISeriesApi<any>[],
        chartConfig: ChartConfig
      ) => {
        if (!chartConfig.tooltipConfigs || Object.keys(chartConfig.tooltipConfigs).length === 0) {
          return
        }

        try {
          // Import tooltip plugin dynamically
          import('./plugins/chart/tooltipPlugin')
            .then(({createTooltipPlugin}) => {
              const tooltipPlugin = createTooltipPlugin(
                chart,
                container,
                chartConfig.chartId || `chart-${Date.now()}`, // Pass chartId as third parameter
                chartConfig.tooltipConfigs, // Pass tooltipConfigs as fourth parameter
                chartConfig // Pass entire chartConfig as fifth parameter for trade data
              )

              // Enable tooltip
              tooltipPlugin.enable()

              // Store plugin reference for cleanup
              if (!window.chartPlugins) {
                window.chartPlugins = new Map()
              }
              window.chartPlugins.set(chart, tooltipPlugin)
            })
            .catch(error => {
              console.error('🎯 [addModularTooltip] Error loading tooltip plugin:', error)
            })
        } catch (error) {
          console.error('🎯 [addModularTooltip] Error setting up tooltip:', error)
        }
      },
      []
    )

    const addRangeSwitcher = useCallback((chart: IChartApi, rangeConfig: any) => {
      // Range switcher implementation will be added here
      // For now, this is a placeholder
    }, [])

    // Function to update legend positions when pane heights change - now handled by plugins
    const updateLegendPositions = useCallback(
      async (chart: IChartApi, legendsConfig: {[paneId: string]: LegendConfig}) => {
        // Check if component is being disposed
        if (isDisposingRef.current) {
          return
        }

        // Check if chart is valid and legends config exists
        if (!chart || !legendsConfig || Object.keys(legendsConfig).length === 0) {
          return
        }

        try {
          // Quick check if chart is still valid
          chart.chartElement()
        } catch (error) {
          return
        }

        // Additional safety check for chart validity
        try {
          chart.timeScale()
        } catch (error) {
          return
        }

        // Additional check to prevent disposal during async operations
        if (isDisposingRef.current) {
          return
        }
      },
      []
    )

    // Store legend element references for dynamic updates
    const legendElementsRef = useRef<Map<string, HTMLElement>>(new Map())
    const legendSeriesDataRef = useRef<
      Map<
        string,
        {
          series: ISeriesApi<any>
          legendConfig: LegendConfig
          paneId: number
          seriesName: string
          seriesIndex: number
        }[]
      >
    >(new Map())

    // Function to update legend values based on crosshair position
    const updateLegendValues = useCallback(
      (chart: IChartApi, chartId: string, param: MouseEventParams) => {
        console.log(`🔍 [updateLegendValues] Called for chart ${chartId}:`, {
          hasTime: !!param.time,
          time: param.time,
          hasLegendSeriesData: !!legendSeriesDataRef.current.get(chartId)
        })

        const legendSeriesData = legendSeriesDataRef.current.get(chartId)
        if (!legendSeriesData || !param.time) {
          console.log(`❌ [updateLegendValues] No legend series data or time for chart ${chartId}`)
          return
        }

        legendSeriesData.forEach(
          ({series, legendConfig, paneId, seriesName, seriesIndex}, index) => {
            try {
              // Safely get series options
              let seriesOptions: any = {}
              try {
                if (typeof series.options === 'function') {
                  seriesOptions = series.options()
                } else if (series.options) {
                  seriesOptions = series.options
                }
              } catch (error) {
                console.warn('Could not get series options:', error)
              }

              // Safely get series type
              let seriesType = 'Unknown'
              try {
                if (typeof series.seriesType === 'function') {
                  seriesType = String(series.seriesType())
                } else if (series.seriesType && typeof series.seriesType === 'string') {
                  seriesType = series.seriesType as any
                }
              } catch (error) {
                console.warn('Could not get series type:', error)
              }

              // Get data point at crosshair time
              const data = series.data()

              if (!data || data.length === 0) {
                return
              }

              // Find the data point closest to the crosshair time
              let closestDataPoint: any = null
              let minTimeDiff = Infinity

              for (const point of data) {
                if (
                  point.time &&
                  param.time &&
                  typeof point.time === 'number' &&
                  typeof param.time === 'number'
                ) {
                  const timeDiff = Math.abs(point.time - param.time)
                  if (timeDiff < minTimeDiff) {
                    minTimeDiff = timeDiff
                    closestDataPoint = point
                  }
                }
              }

              if (!closestDataPoint) {
                // No data point found - clear legend values
                const legendPrimitiveKey = `${chartId}-${seriesIndex}`
                if (
                  (window as any).legendPrimitives &&
                  (window as any).legendPrimitives[legendPrimitiveKey]
                ) {
                  const legendPrimitive = (window as any).legendPrimitives[legendPrimitiveKey]
                  legendPrimitive.updateValue(null) // Clear the value
                }
                return
              }

              // Use the stored seriesName from when the legend was created
              // This ensures consistency between creation and updates

              // Get series color
              let seriesColor = '#2196f3' // default
              if (seriesOptions.color) {
                seriesColor = seriesOptions.color
              } else if (seriesType === 'Candlestick') {
                seriesColor = '#26a69a'
              } else if (seriesType === 'Histogram') {
                seriesColor = '#ff9800'
              } else if (seriesType === 'Area') {
                seriesColor = seriesOptions.topColor || '#4caf50'
              }

              // Prepare template data with crosshair values
              const templateData = {
                title: seriesName, // Use the stored seriesName
                value:
                  closestDataPoint.value || closestDataPoint.close || closestDataPoint.high || '',
                time: closestDataPoint.time || '',
                color: seriesColor,
                type: seriesType,
                ...closestDataPoint // Include all other data fields
              }

              // Update legend primitive if it exists
              // Use the seriesIndex from the legendSeriesData to match the storage key
              const legendPrimitiveKey = `${chartId}-${seriesIndex}`
              console.log(`🔍 [Crosshair] Looking for legend primitive:`, {
                key: legendPrimitiveKey,
                seriesIndex: seriesIndex,
                hasPrimitives: !!(window as any).legendPrimitives,
                primitiveExists: !!(window as any).legendPrimitives?.[legendPrimitiveKey],
                value: templateData.value
              })

              if (
                (window as any).legendPrimitives &&
                (window as any).legendPrimitives[legendPrimitiveKey]
              ) {
                const legendPrimitive = (window as any).legendPrimitives[legendPrimitiveKey]
                console.log(`✅ [Crosshair] Found legend primitive, calling updateValue`)
                legendPrimitive.updateValue(templateData.value)
              } else {
                console.log(
                  `❌ [Crosshair] Legend primitive not found for key: ${legendPrimitiveKey}`
                )
              }

              // Find and update the legend element
              const legendElement = legendElementsRef.current.get(`${chartId}-pane-${paneId}`)
              if (!legendElement) {
                return
              }

              // Find the specific series item in the legend
              const seriesItems = legendElement.querySelectorAll('[data-series-name]')

              seriesItems.forEach(item => {
                const itemElement = item as HTMLElement
                const itemSeriesName = itemElement.getAttribute('data-series-name')

                if (itemSeriesName === seriesName) {
                  if (legendConfig.text) {
                    // Update custom template with new {series} prefix system
                    let template = legendConfig.text

                    // Replace placeholders in template
                    // Only handle $$value$$ placeholder - users handle title and color with HTML
                    if (template.includes('$$value$$')) {
                      let displayValue = '' // Show blank when no crosshair data
                      if (
                        templateData.value !== null &&
                        templateData.value !== undefined &&
                        templateData.value !== ''
                      ) {
                        if (typeof templateData.value === 'number') {
                          // Use the specified value format or default to 2 decimal places
                          const format = legendConfig.valueFormat || '.2f'
                          if (format.includes('.') && format.includes('f')) {
                            // Extract decimal part before 'f' (e.g., '.12f' -> '12')
                            const decimalPart = format.split('.')[1].split('f')[0]
                            const decimals = decimalPart ? parseInt(decimalPart) : 2
                            displayValue = templateData.value.toFixed(decimals)
                          } else {
                            displayValue = templateData.value.toFixed(2)
                          }
                        } else {
                          displayValue = String(templateData.value)
                        }
                      }
                      template = template.replace(/\$\$value\$\$/g, displayValue)
                    }

                    // Set the innerHTML to preserve the text content
                    itemElement.innerHTML = template

                    // Since the template already contains the correct styles, we just need to ensure they persist
                    // by applying them directly to the container and all child elements
                    const targetColor = '#131722'
                    const targetFontFamily =
                      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                    const targetFontSize = '10px'
                    const targetLetterSpacing = '2px'
                    const targetTextAlign = 'left'

                    // Apply styles to the container element
                    itemElement.style.setProperty('color', targetColor, 'important')
                    itemElement.style.setProperty('font-family', targetFontFamily, 'important')
                    itemElement.style.setProperty('font-size', targetFontSize, 'important')
                    itemElement.style.setProperty(
                      'letter-spacing',
                      targetLetterSpacing,
                      'important'
                    )
                    itemElement.style.setProperty('text-align', targetTextAlign, 'important')

                    // Also apply to all child elements to ensure they inherit the styles
                    const childElements = itemElement.querySelectorAll('*')
                    childElements.forEach(child => {
                      if (child instanceof HTMLElement) {
                        child.style.setProperty('color', targetColor, 'important')
                        child.style.setProperty('font-family', targetFontFamily, 'important')
                        child.style.setProperty('font-size', targetFontSize, 'important')
                        child.style.setProperty('letter-spacing', targetLetterSpacing, 'important')
                        child.style.setProperty('text-align', targetTextAlign, 'important')
                      }
                    })

                    // Styles applied successfully
                  } else {
                    // Update default legend format using new options
                    const textContent = itemElement.querySelector('span:last-child') as HTMLElement
                    if (textContent) {
                      const value = templateData.value

                      // Check if dynamic updates are enabled
                      if (legendConfig.updateOnCrosshair === false) {
                        return // Skip updates if disabled
                      }

                      // Format value using the specified format or default
                      let displayValue = 'N/A'
                      if (value !== null && value !== undefined && value !== '') {
                        if (typeof value === 'number') {
                          // Use the specified value format or default to 2 decimal places
                          const format = legendConfig.valueFormat || '.2f'
                          if (format.includes('.') && format.includes('f')) {
                            // Extract decimal part before 'f' (e.g., '.12f' -> '12')
                            const decimalPart = format.split('.')[1].split('f')[0]
                            const decimals = decimalPart ? parseInt(decimalPart) : 2
                            displayValue = value.toFixed(decimals)
                          } else {
                            displayValue = value.toFixed(2)
                          }
                        } else {
                          displayValue = String(value)
                        }
                      }

                      // Show values if enabled (default: true)
                      if (legendConfig.showValues !== false) {
                        textContent.textContent = `${seriesName}: ${displayValue}`
                      } else {
                        textContent.textContent = seriesName
                      }
                    }
                  }
                }
              })
            } catch (error) {
              console.error('❌ Error updating legend for series:', error)
            }
          }
        )
      },
      []
    )

    const addLegend = useCallback(
      async (
        chart: IChartApi,
        legendsConfig: {[paneId: string]: LegendConfig},
        seriesList: ISeriesApi<any>[]
      ) => {
        console.log(`🔍 [addLegend] Called with:`, {
          chartId: chart.chartElement().id,
          legendsConfig,
          seriesListLength: seriesList.length
        })

        // Import the positioning engine (not currently used but kept for future use)

        // Check if component is being disposed
        if (isDisposingRef.current) {
          return
        }

        // Check if chart is valid and legends config exists
        if (
          !chart ||
          !legendsConfig ||
          Object.keys(legendsConfig).length === 0 ||
          seriesList.length === 0
        ) {
          return
        }

        try {
          // Quick check if chart is still valid
          chart.chartElement()
        } catch (error) {
          return
        }

        // Additional safety check for chart validity
        try {
          chart.timeScale()
        } catch (error) {
          return
        }

        // Additional check to prevent disposal during async operations
        if (isDisposingRef.current) {
          return
        }

        // ✅ CRITICAL: Wait for chart API to be ready and get pane information

        try {
          await retryWithBackoff(
            async () => {
              // Check if component is being disposed
              if (isDisposingRef.current) {
                throw new Error('Component disposed during retry')
              }

              // Check if chart has panes available via API
              try {
                let panes = []
                if (chart && typeof chart.panes === 'function') {
                  try {
                    panes = chart.panes()
                  } catch (error) {
                    // chart.panes() failed, use empty array
                    panes = []
                  }
                }

                // Verify we have enough panes for the legend config
                const maxPaneId = Math.max(...Object.keys(legendsConfig).map(id => parseInt(id)))
                if (panes.length <= maxPaneId) {
                  throw new Error(
                    `Not enough panes in chart API. Found: ${panes.length}, Need: ${maxPaneId + 1}`
                  )
                }

                return panes
              } catch (error) {
                throw new Error(`Chart panes not ready: ${error}`)
              }
            },
            10,
            200,
            'Chart API readiness check'
          ) // 10 retries with 200ms base delay (exponential backoff)
        } catch (error) {
          if (error instanceof Error && error.message === 'Component disposed during retry') {
            // Component disposed during retry
          } else {
            console.error('❌ Failed to wait for chart API:', error)
          }
          return
        }

        // Get chart ID for storing legend references
        const chartId = chart.chartElement().id || 'default'
        const legendSeriesData: {
          series: ISeriesApi<any>
          legendConfig: LegendConfig
          paneId: number
          seriesName: string
          seriesIndex: number
        }[] = []

        // Debug: Check for existing legend elements that might be from legacy systems
        const chartElement = chart.chartElement()

        // Check for any elements that might be legends
        const allElements = chartElement.querySelectorAll('*')
        const potentialLegends = Array.from(allElements).filter(el => {
          const text = el.textContent || ''
          return (
            text.includes('Know Sure Thing') ||
            text.includes('KST') ||
            text.includes('Legend') ||
            el.className.includes('legend') ||
            el.id.includes('legend')
          )
        })

        if (potentialLegends.length > 0) {
          // If we find "Know Sure Thing" legend, REMOVE IT from pane 0 and recreate it properly on pane 1
          const kstLegend = potentialLegends.find(el => el.textContent?.includes('Know Sure Thing'))
          if (kstLegend) {
            try {
              // Remove the incorrectly positioned legend
              kstLegend.remove()
            } catch (error) {
              console.error(`❌ Failed to remove "Know Sure Thing" legend:`, error)
            }
          }
        }

        // Group series by pane
        const seriesByPane = new Map<number, ISeriesApi<any>[]>()
        seriesList.forEach((series, index) => {
          // Try to get paneId from series options or fallback to index-based assignment
          let paneId = 0

          // Safely get series options
          let seriesOptions: any = {}
          try {
            if (typeof series.options === 'function') {
              seriesOptions = series.options()
            } else if (series.options) {
              seriesOptions = series.options
            }
          } catch (error) {
            console.warn('Could not get series options:', error)
          }

          // Get the paneId from the series configuration (backend sets this)
          let seriesPaneId: number | undefined = undefined

          // First check if paneId is at the top level of the series (camelCase from backend)
          if ((series as any).paneId !== undefined) {
            seriesPaneId = (series as any).paneId
          }
          // Then check if paneId is in the options
          else if (seriesOptions && (seriesOptions as any).paneId !== undefined) {
            seriesPaneId = (seriesOptions as any).paneId
          }

          if (seriesPaneId !== undefined) {
            // Use the backend-assigned paneId
            paneId = seriesPaneId
          } else {
            // If no paneId from backend, use default pane 0
            paneId = 0
          }

          // No special handling - respect backend pane assignments only

          // Store the actual assigned pane ID on the series for later use (e.g., legend assignment)
          ;(series as any).assignedPaneId = paneId

          if (!seriesByPane.has(paneId)) {
            seriesByPane.set(paneId, [])
          }
          seriesByPane.get(paneId)!.push(series)
        })

        // Create legends only for panes that have explicit legend configurations
        Object.keys(legendsConfig).forEach(paneIdStr => {
          const paneId = parseInt(paneIdStr)
          const legendConfig = legendsConfig[paneId]

          // Skip if no legend config exists for this pane
          if (!legendConfig) {
            return
          }

          // Only create legend if config is visible
          if (!legendConfig.visible) {
            return
          }

          // Check if this pane has series (optional validation)
          const paneSeries = seriesByPane.get(paneId) || []

          // ✅ CORRECT: Use Lightweight Charts Drawing Primitives plugin for proper pane-scoped legends
          // Get pane API to verify it exists
          let paneApi
          try {
            if (chart && typeof chart.panes === 'function') {
              try {
                const allPanes = chart.panes()
                paneApi = allPanes[paneId]
              } catch (error) {
                // chart.panes() failed, use null
                paneApi = null
              }
            } else {
              paneApi = null
            }

            if (!paneApi) {
              console.error(`❌ Pane ${paneId} not found in chart API`)
              return
            }
          } catch (error) {
            console.error(`❌ Error accessing pane ${paneId} in chart API:`, error)
            return
          }

          // Legend management is now handled directly via DOM manipulation like minimize buttons

          // Legend items are now handled by the Drawing Primitives plugin
          // Store series data for crosshair updates
          paneSeries.forEach((series, index) => {
            // Find the actual seriesIndex in the original seriesList
            const actualSeriesIndex = seriesList.findIndex(s => s === series)
            legendSeriesData.push({
              series,
              legendConfig,
              paneId,
              seriesName: `Pane ${paneId}`,
              seriesIndex: actualSeriesIndex >= 0 ? actualSeriesIndex : index
            })
          })

          // Legend items are now handled by the Drawing Primitives plugin
          // No need for manual DOM manipulation

          // Legend items are now handled by the Drawing Primitives plugin
          // No need for manual DOM manipulation
        })

        // Store legend series data for updates
        legendSeriesDataRef.current.set(chartId, legendSeriesData)

        // Setup crosshair event handling for legend updates
        // Debug: Log the legendsConfig to see what we're working with
        console.log(`🔍 [Legend] legendsConfig for chart ${chartId}:`, legendsConfig)
        console.log(`🔍 [Legend] Object.values(legendsConfig):`, Object.values(legendsConfig))

        // Check if any legend has crosshair updates enabled OR contains $$value$$ placeholders
        const hasUpdateOnCrosshair = Object.values(legendsConfig).some(config => {
          const hasUpdate = config.updateOnCrosshair !== false
          const hasPlaceholder = config.text && config.text.includes('$$value$$')
          console.log(`🔍 [Legend] Checking config:`, {
            updateOnCrosshair: config.updateOnCrosshair,
            hasUpdate,
            text: config.text,
            hasPlaceholder,
            result: hasUpdate || hasPlaceholder
          })
          return hasUpdate || hasPlaceholder
        })

        if (hasUpdateOnCrosshair) {
          console.log(`🔍 [Crosshair] Setting up crosshair subscription for chart ${chartId}`)

          // Initialize legends with blank values (no crosshair data yet)
          Object.entries(legendsConfig).forEach(([seriesName, legendConfig]) => {
            if (legendConfig.text && legendConfig.text.includes('$$value$$')) {
              const seriesIndex = legendSeriesData.findIndex(s => s.seriesName === seriesName)
              if (seriesIndex >= 0) {
                const legendPrimitiveKey = `${chartId}-${seriesIndex}`
                if (
                  (window as any).legendPrimitives &&
                  (window as any).legendPrimitives[legendPrimitiveKey]
                ) {
                  const legendPrimitive = (window as any).legendPrimitives[legendPrimitiveKey]
                  legendPrimitive.updateValue(null) // Initialize with blank
                }
              }
            }
          })

          chart.subscribeCrosshairMove(param => {
            console.log(`🔍 [Crosshair] Crosshair moved for chart ${chartId}:`, {
              time: param.time,
              point: param.point,
              hasTime: !!param.time
            })

            if (!param.time || !param.point) {
              // Crosshair left the chart - clear all legend values by calling updateLegendValues with null param
              updateLegendValues(chart, chartId, {time: null, point: null, seriesData: new Map()})
            } else {
              // Crosshair is on the chart - update legend values
              updateLegendValues(chart, chartId, param)
            }
          })
        } else {
          console.log(`ℹ️ [Crosshair] No crosshair updates enabled for chart ${chartId}`)
        }
      },
      [updateLegendValues]
    )

    // Performance optimization: Memoized chart configuration processing
    const processedChartConfigs = useMemo(() => {
      if (!config || !config.charts || config.charts.length === 0) return []

      return config.charts.map((chartConfig: ChartConfig, chartIndex: number) => {
        const chartId = chartConfig.chartId || `chart-${chartIndex}`

        // Chart configuration processed

        return {
          ...chartConfig,
          chartId,
          containerId: `chart-container-${chartId}`,
          chartOptions: cleanLineStyleOptions({
            width: chartConfig.chart?.autoWidth
              ? undefined
              : chartConfig.chart?.width || width || undefined,
            height: chartConfig.chart?.autoHeight
              ? undefined
              : chartConfig.chart?.height || height || undefined,
            ...chartConfig.chart
          })
        }
      })
    }, [config, width, height])

    // Initialize charts
    const initializeCharts = useCallback(
      (isInitialRender = false) => {
        // Prevent re-initialization if already initialized and not disposing
        if (isInitializedRef.current && !isDisposingRef.current) {
          return
        }

        // Additional check to prevent disposal during initialization (but allow initial render)
        if (isDisposingRef.current && !isInitialRender) {
          return
        }

        // Check if we have charts to initialize
        if (!processedChartConfigs || processedChartConfigs.length === 0) {
          return
        }

        // Only clean up existing charts if this is not the initial render
        if (!isInitialRender) {
          functionRefs.current.cleanupCharts()
        }

        if (!processedChartConfigs || processedChartConfigs.length === 0) {
          return
        }

        // Initialize global registries for cross-component synchronization BEFORE creating charts
        if (!(window as any).chartApiMap) {
          ;(window as any).chartApiMap = {}
        }
        if (!(window as any).chartGroupMap) {
          ;(window as any).chartGroupMap = {}
        }
        if (!(window as any).seriesRefsMap) {
          ;(window as any).seriesRefsMap = {}
        }

        processedChartConfigs.forEach((chartConfig: ChartConfig, chartIndex: number) => {
          const chartId = chartConfig.chartId!
          const containerId = chartConfig.containerId || `chart-container-${chartId}`

          // Find or create container
          let container = document.getElementById(containerId)
          if (!container) {
            container = document.createElement('div')
            container.id = containerId
            container.style.width = '100%'
            container.style.height = '100%'

            // Find the main chart container - try multiple selectors with caching
            let mainContainer = getCachedDOMElement('[data-testid="stHorizontalBlock"]')
            if (!mainContainer) {
              mainContainer = getCachedDOMElement('.stHorizontalBlock')
            }
            if (!mainContainer) {
              mainContainer = getCachedDOMElement('[data-testid="stVerticalBlock"]')
            }
            if (!mainContainer) {
              mainContainer = getCachedDOMElement('.stVerticalBlock')
            }
            if (!mainContainer) {
              mainContainer = getCachedDOMElement('[data-testid="stBlock"]')
            }
            if (!mainContainer) {
              mainContainer = getCachedDOMElement('.stBlock')
            }
            if (!mainContainer) {
              mainContainer = document.body
            }

            if (mainContainer) {
              mainContainer.appendChild(container)

              // Ensure container has proper dimensions
              container.style.width = '100%'
              // Use specific height from chart config if available, otherwise use 100%
              const containerHeight = chartConfig.chart?.height
                ? `${chartConfig.chart.height}px`
                : '100%'
              container.style.height = containerHeight
              container.style.minHeight = '300px'
              container.style.minWidth = '200px'
              container.style.display = 'block'
              container.style.position = 'relative'
              container.style.overflow = 'hidden'

              // Store container reference for performance
              chartContainersRef.current[chartId] = container
            } else {
              return
            }
          } else {
            chartContainersRef.current[chartId] = container
          }

          // Create chart in container
          try {
            // Check if container is still valid
            if (!container || !container.isConnected) {
              return
            }

            // Use pre-processed chart options
            const chartOptions = chartConfig.chartOptions || chartConfig.chart || {}

            let chart: IChartApi
            try {
              chart = createChart(container, chartOptions)
            } catch (chartError) {
              return
            }

            // Check if chart was created successfully
            if (!chart) {
              return
            }

            // Set the chart element's ID so we can retrieve it later
            const chartElement = chart.chartElement()
            if (chartElement) {
              chartElement.id = chartId
            }

            chartRefs.current[chartId] = chart

            // Register chart with coordinate service for consistency across services
            const coordinateService = ChartCoordinateService.getInstance()
            coordinateService.registerChart(chartId, chart)

            // Store chart API reference for legend positioning
            if (!(window as any).chartApiMap) {
              ;(window as any).chartApiMap = {}
            }
            ;(window as any).chartApiMap[chartId] = chart

            // Legend management is now handled directly via DOM manipulation

            // Initialize legend refresh callbacks for this chart
            if (!(window as any).legendRefreshCallbacks) {
              ;(window as any).legendRefreshCallbacks = {}
            }
            if (!(window as any).legendRefreshCallbacks[chartId]) {
              ;(window as any).legendRefreshCallbacks[chartId] = []
            }

            // Add resize observer to reposition legends when container resizes
            const resizeObserver =
              typeof ResizeObserver !== 'undefined'
                ? new ResizeObserver(entries => {
                    for (const entry of entries) {
                      if (entry.target === container) {
                        // Trigger legend repositioning for all panes
                        setTimeout(() => {
                          const legendElements = legendElementsRef.current
                          if (legendElements) {
                            // Legend repositioning is now handled by direct DOM manipulation
                          }
                        }, 100) // Small delay to ensure resize is complete
                      }
                    }
                  })
                : null

            // Start observing the container for size changes
            if (resizeObserver && typeof resizeObserver.observe === 'function') {
              resizeObserver.observe(container)
            }

            // Store the observer reference for cleanup
            if (!(window as any).chartResizeObservers) {
              ;(window as any).chartResizeObservers = {}
            }
            ;(window as any).chartResizeObservers[chartId] = resizeObserver

            // Calculate chart dimensions once
            const containerRect = container.getBoundingClientRect()
            const chartWidth = chartConfig.autoWidth
              ? containerRect.width
              : (chartOptions && chartOptions.width) || width || containerRect.width
            // Prioritize height from chart options (JSON config) over autoHeight
            const chartHeight =
              (chartOptions && chartOptions.height) ||
              (chartConfig.autoHeight ? containerRect.height : height) ||
              containerRect.height

            // Ensure minimum dimensions
            const finalWidth = Math.max(chartWidth, 200)
            const finalHeight = Math.max(chartHeight, 200)

            // Resize chart once with calculated dimensions
            chart.resize(finalWidth, finalHeight)

            // Apply layout.panes options if present
            if (chartOptions.layout && chartOptions.layout.panes) {
              chart.applyOptions({layout: {panes: chartOptions.layout.panes}})
            }

            // Create panes if needed for multi-pane charts
            const paneMap = new Map<number, any>()
            let existingPanes = []

            // Safety check for chart.panes() method
            if (chart && typeof chart.panes === 'function') {
              try {
                existingPanes = chart.panes()
              } catch (error) {
                // chart.panes() failed, use empty array
                existingPanes = []
              }
            }

            // Ensure we have enough panes for the series
            chartConfig.series.forEach((seriesConfig: SeriesConfig) => {
              const paneId = seriesConfig.paneId || 0
              if (!paneMap.has(paneId)) {
                if (paneId < existingPanes.length) {
                  paneMap.set(paneId, existingPanes[paneId])
                } else {
                  // Create new pane if it doesn't exist
                  let newPane = null
                  if (chart && typeof chart.addPane === 'function') {
                    try {
                      newPane = chart.addPane()
                    } catch (error) {
                      // chart.addPane() failed, use null
                      newPane = null
                    }
                  }

                  if (newPane) {
                    paneMap.set(paneId, newPane)
                    // Update existingPanes after adding new pane
                    if (chart && typeof chart.panes === 'function') {
                      try {
                        existingPanes = chart.panes()
                      } catch (error) {
                        // chart.panes() failed, keep existing array
                      }
                    }
                  }
                }
              }
            })

            // Note: Pane heights will be applied AFTER series creation to ensure all panes exist

            // Configure overlay price scales (volume, indicators, etc.) if they exist
            if (chartConfig.chart?.overlayPriceScales) {
              Object.entries(chartConfig.chart.overlayPriceScales).forEach(
                ([scaleId, scaleConfig]) => {
                  try {
                    // Create overlay price scale - use the scaleId directly
                    const overlayScale = chart.priceScale(scaleId)
                    if (overlayScale) {
                      overlayScale.applyOptions(cleanLineStyleOptions(scaleConfig as any))
                    } else {
                      // Price scale not found, will be created when series uses it
                    }
                  } catch (error) {
                    // Failed to configure price scale
                  }
                }
              )
            }

            // Legend management is now handled directly via DOM manipulation like minimize buttons

            // Create series for this chart
            const seriesList: ISeriesApi<any>[] = []

            if (chartConfig.series && Array.isArray(chartConfig.series)) {
              chartConfig.series.forEach((seriesConfig: SeriesConfig, seriesIndex: number) => {
                try {
                  if (!seriesConfig || typeof seriesConfig !== 'object') {
                    return
                  }

                  // Pass trade data to the first series (candlestick series) for marker creation
                  if (
                    seriesIndex === 0 &&
                    chartConfig.trades &&
                    chartConfig.trades.length > 0 &&
                    chartConfig.tradeVisualizationOptions
                  ) {
                    seriesConfig.trades = chartConfig.trades
                    seriesConfig.tradeVisualizationOptions = chartConfig.tradeVisualizationOptions
                  }

                  const series = createSeries(
                    chart,
                    seriesConfig,
                    {signalPluginRefs},
                    chartId,
                    seriesIndex
                  )
                  if (series) {
                    seriesList.push(series)

                    // Create legend for this series using the same pattern as minimize buttons
                    if (seriesConfig.legend && seriesConfig.legend.visible) {
                      try {
                        // Wait for chart to be ready before creating legend (like minimize buttons)
                        ChartReadyDetector.waitForChartReady(chart, chart.chartElement(), {
                          minWidth: 200,
                          minHeight: 200
                        }).then(isReady => {
                          if (isReady) {
                            createLegendForSeries(
                              chart,
                              seriesConfig,
                              chartId,
                              seriesIndex,
                              legendResizeObserverRefs
                            )
                          } else {
                            console.warn(
                              `[Legend] Chart not ready for series ${seriesIndex}, retrying...`
                            )
                            // Retry after a delay like minimize buttons
                            setTimeout(() => {
                              ChartReadyDetector.waitForChartReady(chart, chart.chartElement(), {
                                minWidth: 200,
                                minHeight: 200
                              }).then(retryReady => {
                                if (retryReady) {
                                  createLegendForSeries(
                                    chart,
                                    seriesConfig,
                                    chartId,
                                    seriesIndex,
                                    legendResizeObserverRefs
                                  )
                                }
                              })
                            }, 300)
                          }
                        })
                      } catch (error) {
                        console.error(
                          `❌ [Legend] Error creating legend for series ${seriesIndex}:`,
                          error
                        )
                      }
                    }

                    // Apply overlay price scale configuration if this series uses one
                    if (
                      seriesConfig.priceScaleId &&
                      seriesConfig.priceScaleId !== 'right' &&
                      seriesConfig.priceScaleId !== 'left' &&
                      chartConfig.chart?.overlayPriceScales?.[seriesConfig.priceScaleId]
                    ) {
                      const scaleConfig =
                        chartConfig.chart.overlayPriceScales[seriesConfig.priceScaleId]
                      try {
                        const priceScale = series.priceScale()
                        if (priceScale) {
                          priceScale.applyOptions(cleanLineStyleOptions(scaleConfig as any))
                        }
                      } catch (error) {
                        // Failed to apply price scale configuration for series
                      }
                    }

                    // Series legends are now handled directly in seriesFactory.ts

                    // Handle trade visualization for this series

                    if (seriesConfig.trades && seriesConfig.tradeVisualizationOptions) {
                      // CRITICAL: Wait for chart to be ready before attaching primitives

                      try {
                        // Don't block - use setTimeout to wait for chart readiness asynchronously
                        setTimeout(async () => {
                          try {
                            // Wait for chart's coordinate system to be fully initialized
                            const isReady = await ChartReadyDetector.waitForChartReadyForPrimitives(
                              chart,
                              series,
                              {
                                maxAttempts: 100,
                                baseDelay: 100,
                                requireData: true
                              }
                            )

                            if (isReady) {
                              await addTradeVisualization(
                                chart,
                                series,
                                seriesConfig.trades,
                                seriesConfig.tradeVisualizationOptions,
                                seriesConfig.data
                              )
                            } else {
                              console.error('❌ [initializeCharts] Chart readiness check timed out')
                              // Try to attach primitives anyway - sometimes coordinates work even if tests fail

                              try {
                                await addTradeVisualization(
                                  chart,
                                  series,
                                  seriesConfig.trades,
                                  seriesConfig.tradeVisualizationOptions,
                                  seriesConfig.data
                                )
                              } catch (attachError) {
                                console.error(
                                  '❌ [initializeCharts] Primitive attachment also failed:',
                                  attachError
                                )
                              }
                            }
                          } catch (error) {
                            console.error(
                              '❌ [initializeCharts] Error in chart readiness or trade visualization:',
                              error
                            )
                          }
                        }, 50) // Small delay to let chart initialization complete
                      } catch (error) {
                        console.error(
                          '❌ [initializeCharts] Error setting up trade visualization:',
                          error
                        )
                      }
                    } else {
                    }

                    // Add series-level annotations
                    if (seriesConfig.annotations) {
                      functionRefs.current.addAnnotations(chart, seriesConfig.annotations)
                    }
                  } else {
                    // Failed to create series
                  }
                } catch (seriesError) {
                  console.error(
                    `Error creating series at index ${seriesIndex} for chart ${chartId}:`,
                    seriesError
                  )
                }
              })
            } else {
              // No valid series configuration found
            }

            seriesRefs.current[chartId] = seriesList
            // Update global series registry for cross-component synchronization
            if ((window as any).seriesRefsMap) {
              ;(window as any).seriesRefsMap[chartId] = seriesList
            }

            // OLD TRADE RECTANGLE CODE - COMMENTED OUT
            // This is no longer needed since we now handle trade visualization
            // through the new addTradeVisualization function in the series loop above
            /*
            // Process pending trade rectangles after all series are created

            // Also check if there are any trade rectangles in the chart config

            if (
              (chart as any)._pendingTradeRectangles &&
              (chart as any)._pendingTradeRectangles.length > 0
            ) {
              ;(chart as any)._pendingTradeRectangles.forEach(
                async (pendingData: any, index: number) => {
                  try {
                    // Create trade rectangle primitives that automatically update during pan/zoom
                    const firstSeries = seriesList.length > 0 ? seriesList[0] : undefined

                    if (firstSeries) {
                      // Wait for chart to be fully ready before attaching primitives
                      const waitForChartReady = async () => {
                        try {
                          const testTime = pendingData.rectangles[0]?.time1
                          const testPrice = pendingData.rectangles[0]?.price1

                          const isReady = await ChartReadyDetector.waitForChartReadyForPrimitives(
                            chart,
                            firstSeries,
                            {
                              testTime,
                              testPrice,
                              maxAttempts: 30,
                              baseDelay: 150,
                              requireData: true
                            }
                          )

                          if (isReady) {
                            // Chart is fully ready - create and attach primitives  
                            const primitives = createTradeRectanglePrimitives(
                              pendingData.rectangles || []
                            )

                            primitives.forEach(primitive => {
                              firstSeries.attachPrimitive(primitive)
                            })

                            // Force a chart redraw to ensure primitives are visible
                            setTimeout(() => {
                              try {
                                const timeScale = chart.timeScale()
                                const currentRange = timeScale.getVisibleRange()
                                if (currentRange) {
                                  timeScale.setVisibleRange({
                                    from: currentRange.from,
                                    to: currentRange.to
                                  })
                                }
                              } catch (error) {
                                // Ignore redraw errors
                              }
                            }, 50)
                          } else {
                            console.warn('⚠️ Trade rectangles: Chart readiness timeout')
                          }
                        } catch (error) {
                          console.warn('⚠️ Trade rectangles: Error during readiness check:', error)
                        }
                      }

                      // Start the readiness check
                      waitForChartReady()
                    } else {
                    }
                  } catch (error) {}
                }
              )

              // Clear the pending rectangles after processing
              ;(chart as any)._pendingTradeRectangles = []
            }
            */

            // Apply pane heights configuration AFTER series creation to ensure all panes exist
            if (chartConfig.chart?.layout?.paneHeights) {
              // Get all panes after series creation
              let allPanes = []
              if (chart && typeof chart.panes === 'function') {
                try {
                  allPanes = chart.panes()
                } catch (error) {
                  // chart.panes() failed, use empty array
                  allPanes = []
                }
              }

              Object.entries(chartConfig.chart.layout.paneHeights).forEach(
                ([paneIdStr, heightOptions]) => {
                  const paneId = parseInt(paneIdStr)
                  const options = heightOptions as PaneHeightOptions

                  if (paneId < allPanes.length && options.factor) {
                    try {
                      allPanes[paneId].setStretchFactor(options.factor)
                    } catch (error) {
                      // Failed to set stretch factor for pane
                    }
                  } else {
                    // Skipping pane
                  }
                }
              )
            }

            // Add modular tooltip system
            functionRefs.current.addModularTooltip(chart, container, seriesList, chartConfig)

            // Store chart config for trade visualization when chart is ready
            chartConfigs.current[chartId] = chartConfig

            // Add chart-level annotations
            if (chartConfig.annotations) {
              functionRefs.current.addAnnotations(chart, chartConfig.annotations)
            }

            // Add annotation layers
            if (chartConfig.annotationLayers) {
              functionRefs.current.addAnnotationLayers(chart, chartConfig.annotationLayers)
            }

            // Add price lines
            if (chartConfig.priceLines && seriesList.length > 0) {
              chartConfig.priceLines.forEach((priceLine: any) => {
                seriesList[0].createPriceLine(priceLine)
              })
            }

            // Add range switcher if configured
            if (chartConfig.chart?.rangeSwitcher && chartConfig.chart.rangeSwitcher.visible) {
              // Add range switcher after a short delay to ensure chart is fully initialized
              setTimeout(() => {
                functionRefs.current.addRangeSwitcher(chart, chartConfig.chart.rangeSwitcher)
              }, 100)
            }

            // Add legends and setup crosshair subscription
            // Collect all legend configurations from series
            const legendsConfig: {[paneId: string]: LegendConfig} = {}
            seriesList.forEach((series, index) => {
              const seriesConfig = chartConfig.series[index]
              if (seriesConfig?.legend && seriesConfig.legend.visible) {
                const paneId = seriesConfig.paneId || 0
                legendsConfig[paneId.toString()] = seriesConfig.legend
              }
            })

            if (Object.keys(legendsConfig).length > 0) {
              setTimeout(() => {
                functionRefs.current.addLegend(chart, legendsConfig, seriesList)
              }, 200)
            }

            // Ensure chart is properly initialized before adding legends and other features
            setTimeout(() => {
              if (!isDisposingRef.current && chartRefs.current[chartId]) {
                try {
                  // Force chart to fit content
                  chart.timeScale().fitContent()

                  // Legends are now handled at series level through direct DOM manipulation
                } catch (error) {
                  console.warn('Error during chart initialization:', error)
                }

                // Legend positioning is now handled automatically by pane primitives

                // Observe the chart element for size changes
                if (resizeObserver && typeof resizeObserver.observe === 'function') {
                  const chartElement = chart.chartElement()
                  if (chartElement) {
                    resizeObserver.observe(chartElement)
                  }
                }

                // Store the resize observer for cleanup
                legendResizeObserverRefs.current[chartId] = resizeObserver

                // Refresh all legends after chart is fully initialized
                setTimeout(() => {
                  try {
                    // This will trigger legend refresh for all panes
                    if (window.legendRefreshCallbacks && window.legendRefreshCallbacks[chartId]) {
                      window.legendRefreshCallbacks[chartId].forEach((callback: () => void) => {
                        callback()
                      })
                    }
                  } catch (error) {
                    console.warn('Error refreshing legends after initialization:', error)
                  }
                }, 500) // Wait 500ms for legends to be fully created
              }
            }, 200) // Increased delay to ensure chart is fully ready

            // Setup auto-sizing for the chart
            functionRefs.current.setupAutoSizing(chart, container, chartConfig)

            // Setup chart synchronization if enabled
            if (config.syncConfig && config.syncConfig.enabled) {
              const chartGroupId = chartConfig.chartGroupId || 0

              // Initialize global registries if they don't exist (shared across ALL component instances)
              if (!(window as any).chartGroupMap) {
                ;(window as any).chartGroupMap = {}
              }
              if (!(window as any).seriesRefsMap) {
                ;(window as any).seriesRefsMap = {}
              }

              // Register chart in global registry for cross-component synchronization
              ;(window as any).chartGroupMap[chartId] = chartGroupId

              // Get group-specific sync config or use default
              let syncConfig = config.syncConfig
              if (config.syncConfig.groups && config.syncConfig.groups[chartGroupId]) {
                syncConfig = config.syncConfig.groups[chartGroupId]
              }

              functionRefs.current.setupChartSynchronization(
                chart,
                chartId,
                syncConfig,
                chartGroupId
              )
            }

            // Setup fitContent functionality
            functionRefs.current.setupFitContent(chart, chartConfig)

            // Create individual pane containers and add collapse functionality
            const paneCollapseConfig = chartConfig.paneCollapse || {enabled: true}
            if (paneCollapseConfig.enabled !== false) {
              try {
                // Get all panes and wrap each in its own collapsible container
                let allPanes = []
                if (chart && typeof chart.panes === 'function') {
                  try {
                    allPanes = chart.panes()
                  } catch (error) {
                    // chart.panes() failed, use empty array
                    allPanes = []
                  }
                }

                // Only show minimize buttons when there are multiple panes
                if (allPanes.length > 1) {
                  console.log(
                    `[PaneSetup] Creating individual containers for ${allPanes.length} panes`
                  )

                  // Set up pane collapse support
                  setupPaneCollapseSupport(chart, chartId, allPanes.length)

                  allPanes.forEach((pane, paneId) => {
                    // Create collapse plugin for the individual pane container
                    const collapsePlugin = createPaneCollapsePlugin(paneId, {
                      ...paneCollapseConfig
                    })
                    pane.attachPrimitive(collapsePlugin)

                    // Store plugin reference for cleanup
                    if (!(window as any).paneCollapsePlugins) {
                      ;(window as any).paneCollapsePlugins = {}
                    }
                    if (!(window as any).paneCollapsePlugins[chartId]) {
                      ;(window as any).paneCollapsePlugins[chartId] = []
                    }
                    ;(window as any).paneCollapsePlugins[chartId].push(collapsePlugin)
                  })
                }
              } catch (error) {
                console.error('Error adding pane collapse plugins:', error)
              }
            }

            // Call fitContent after all series are created and data is loaded
            const shouldFitContentOnLoad =
              chartConfig.chart?.timeScale?.fitContentOnLoad !== false &&
              chartConfig.chart?.fitContentOnLoad !== false

            if (shouldFitContentOnLoad && seriesList.length > 0) {
              // Call fitContent after a delay to ensure all data is processed
              setTimeout(() => {
                try {
                  const timeScale = chart.timeScale()
                  if (timeScale) {
                    timeScale.fitContent()
                  }
                } catch (error) {
                  // fitContent failed
                }
              }, 100)
            }
          } catch (error) {
            console.error('Error creating chart:', error)
          }
        })

        isInitializedRef.current = true

        // Small delay to ensure charts are rendered before any cleanup
        setTimeout(() => {
          // Notify parent component that charts are ready
          if (onChartsReady) {
            onChartsReady()
          }
        }, 50)
      },
      [
        processedChartConfigs,
        config?.syncConfig,
        width,
        height,
        onChartsReady,
        addTradeVisualization,
        setupPaneCollapseSupport
      ]
    )

    // Update function references to avoid dependency issues
    useEffect(() => {
      functionRefs.current = {
        addTradeVisualization,
        // addTradeVisualizationWhenReady,  // Removed - no longer needed
        addAnnotations,
        addModularTooltip,
        addAnnotationLayers,
        addRangeSwitcher,
        addLegend,
        updateLegendPositions,
        setupAutoSizing,
        setupChartSynchronization,
        setupFitContent,
        setupPaneCollapseSupport,
        cleanupCharts
      }
    }, [
      addTradeVisualization,
      addAnnotations,
      addModularTooltip,
      addAnnotationLayers,
      addRangeSwitcher,
      addLegend,
      updateLegendPositions,
      setupAutoSizing,
      setupChartSynchronization,
      setupFitContent,
      setupPaneCollapseSupport,
      cleanupCharts
    ])

    // Stabilize the config dependency to prevent unnecessary re-initialization
    const stableConfig = useMemo(() => config, [config])

    useEffect(() => {
      if (stableConfig && stableConfig.charts && stableConfig.charts.length > 0) {
        initializeCharts(true)
      }
    }, [stableConfig, initializeCharts])

    // Cleanup on unmount
    useEffect(() => {
      return () => {
        cleanupCharts()
      }
    }, [cleanupCharts])

    // Memoize the chart containers to prevent unnecessary re-renders
    const chartContainers = useMemo(() => {
      if (!config || !config.charts || config.charts.length === 0) {
        return []
      }

      return config.charts.map((chartConfig, index) => {
        const chartId = chartConfig.chartId || `chart-${index}`
        const containerId = `chart-container-${chartId}`

        // Determine container styling based on auto-sizing options
        const shouldAutoSize =
          chartConfig.autoSize || chartConfig.autoWidth || chartConfig.autoHeight
        const chartOptions = chartConfig.chart || {}

        // Use optimized style creation with memoization
        const styles = createOptimizedStylesAdvanced(width, height, !!shouldAutoSize, chartOptions)
        const containerStyle = {
          ...styles.container,
          minWidth:
            chartOptions.minWidth || chartConfig.minWidth || (shouldAutoSize ? 200 : undefined),
          minHeight:
            chartOptions.minHeight || chartConfig.minHeight || (shouldAutoSize ? 200 : undefined),
          maxWidth: chartOptions.maxWidth || chartConfig.maxWidth,
          maxHeight: chartOptions.maxHeight || chartConfig.maxHeight
        }

        const chartContainerStyle = styles.chartContainer

        return (
          <div key={chartId} style={containerStyle}>
            <div id={containerId} style={chartContainerStyle} />
            {/* Legend management is now handled directly via DOM manipulation like minimize buttons */}
          </div>
        )
      })
    }, [config, width, height])

    if (!config || !config.charts || config.charts.length === 0) {
      return <div>No charts configured</div>
    }

    return (
      <ErrorBoundary>
        <div style={{display: 'flex', flexDirection: 'column'}}>{chartContainers}</div>
      </ErrorBoundary>
    )
  }
)

export default LightweightCharts
// Cache busting comment Wed Sep  3 20:49:00 +04 2025
// Cache busting comment Wed Sep  3 20:50:37 +04 2025
// Cache busting comment Wed Sep  3 20:52:59 +04 2025
// Cache busting comment Wed Sep  3 20:54:29 +04 2025
// Cache busting comment 1756918575
