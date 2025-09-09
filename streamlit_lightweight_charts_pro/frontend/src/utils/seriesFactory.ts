import {MutableRefObject} from 'react'
import {
  IChartApi,
  ISeriesApi,
  AreaSeries,
  LineSeries,
  BarSeries,
  CandlestickSeries,
  HistogramSeries,
  BaselineSeries,
  createSeriesMarkers
} from 'lightweight-charts'
import {SeriesConfig} from '../types'
import {createBandSeries, BandData} from '../plugins/series/bandSeriesPlugin'
import {SignalSeries, createSignalSeriesPlugin} from '../plugins/series/signalSeriesPlugin'
import {createTrendFillSeriesPlugin} from '../plugins/series/trendFillSeriesPlugin'
import {RibbonSeries} from '../plugins/series/ribbonSeriesPlugin'
import {cleanLineStyleOptions} from './lineStyle'
import {createTradeVisualElements} from '../services/tradeVisualization'

interface SeriesFactoryContext {
  signalPluginRefs?: MutableRefObject<{[key: string]: SignalSeries}>
}

export function createSeries(
  chart: IChartApi,
  seriesConfig: SeriesConfig,
  context: SeriesFactoryContext = {},
  chartId?: string,
  seriesIndex?: number
): ISeriesApi<any> | null {
  const {signalPluginRefs} = context

  // Validate inputs - throw errors for invalid inputs
  if (!chart) {
    throw new Error('Chart is required')
  }

  if (!seriesConfig) {
    throw new Error('Series configuration is required')
  }

  if (!seriesConfig.type) {
    throw new Error('Series type is required')
  }

  // Check if chart has addSeries method
  if (typeof chart.addSeries !== 'function') {
    throw new Error('Chart does not have addSeries method')
  }

  const {
    type,
    data,
    options = {},
    priceScale,
    lastValueVisible: topLevelLastValueVisible,
    lastPriceAnimation,
    priceLineVisible: topLevelPriceLineVisible,
    priceLineSource: topLevelPriceLineSource,
    priceLineWidth: topLevelPriceLineWidth,
    priceLineColor: topLevelPriceLineColor,
    priceLineStyle: topLevelPriceLineStyle,
    priceScaleId: topLevelPriceScaleId
  } = seriesConfig

  const lastValueVisible =
    topLevelLastValueVisible !== undefined ? topLevelLastValueVisible : options.lastValueVisible
  const priceLineVisible =
    topLevelPriceLineVisible !== undefined ? topLevelPriceLineVisible : options.priceLineVisible
  const priceLineSource =
    topLevelPriceLineSource !== undefined ? topLevelPriceLineSource : options.priceLineSource
  const priceLineWidth =
    topLevelPriceLineWidth !== undefined ? topLevelPriceLineWidth : options.priceLineWidth
  const priceLineColor =
    topLevelPriceLineColor !== undefined ? topLevelPriceLineColor : options.priceLineColor
  const priceLineStyle =
    topLevelPriceLineStyle !== undefined ? topLevelPriceLineStyle : options.priceLineStyle
  const priceScaleId =
    topLevelPriceScaleId !== undefined ? topLevelPriceScaleId : options.priceScaleId

  // Extract paneId from seriesConfig and ensure it has a default value
  const finalPaneId = seriesConfig.paneId !== undefined ? seriesConfig.paneId : 0

  let series: ISeriesApi<any>
  const normalizedType = type?.toLowerCase()
  const {priceFormat, ...otherOptions} = options
  const cleanedOptions = cleanLineStyleOptions(otherOptions)

  // No Z-index needed - using Z-order system for primitives

  switch (normalizedType) {
    case 'area': {
      const areaOptions: any = {
        ...cleanedOptions,
        lineColor: cleanedOptions.color || '#2196F3',
        topColor: cleanedOptions.topColor || 'rgba(33, 150, 243, 0.4)',
        bottomColor: cleanedOptions.bottomColor || 'rgba(33, 150, 243, 0.0)',
        lineWidth: cleanedOptions.lineWidth || 2,
        relativeGradient: cleanedOptions.relativeGradient || false,
        invertFilledArea: cleanedOptions.invertFilledArea || false,
        priceScaleId: priceScaleId || '',
        lastValueVisible: lastValueVisible !== undefined ? lastValueVisible : true,
        lastPriceAnimation: lastPriceAnimation !== undefined ? lastPriceAnimation : 0,
        priceLineVisible: priceLineVisible !== undefined ? priceLineVisible : true,
        priceLineSource: priceLineSource !== undefined ? priceLineSource : 'lastBar',
        priceLineWidth: priceLineWidth !== undefined ? priceLineWidth : 1,
        priceLineColor: priceLineColor !== undefined ? priceLineColor : '',
        priceLineStyle: priceLineStyle !== undefined ? priceLineStyle : 2
      }
      if (priceFormat) {
        areaOptions.priceFormat = priceFormat
      }
      series = chart.addSeries(AreaSeries, areaOptions, finalPaneId)
      try {
        if (lastValueVisible === false) {
          series.applyOptions({lastValueVisible: false})
        }
      } catch {
        // ignore
      }
      break
    }
    case 'band': {
      try {
        const bandSeriesOptions: any = {
          upperLine: cleanedOptions.upperLine || {
            color: '#4CAF50',
            lineStyle: 0,
            lineWidth: 2,
            lineVisible: true
          },
          middleLine: cleanedOptions.middleLine || {
            color: '#2196F3',
            lineStyle: 0,
            lineWidth: 2,
            lineVisible: true
          },
          lowerLine: cleanedOptions.lowerLine || {
            color: '#F44336',
            lineStyle: 0,
            lineWidth: 2,
            lineVisible: true
          },
          upperFillColor: cleanedOptions.upperFillColor || 'rgba(76, 175, 80, 0.1)',
          lowerFillColor: cleanedOptions.lowerFillColor || 'rgba(244, 67, 54, 0.1)',
          upperFill: cleanedOptions.upperFill !== undefined ? cleanedOptions.upperFill : true,
          lowerFill: cleanedOptions.lowerFill !== undefined ? cleanedOptions.lowerFill : true,
          priceScaleId: priceScaleId || 'right',
          visible: cleanedOptions.visible !== false,
          lastValueVisible: lastValueVisible !== undefined ? lastValueVisible : true,
          priceLineVisible: priceLineVisible !== undefined ? priceLineVisible : true,
          priceLineSource: priceLineSource !== undefined ? priceLineSource : 'lastBar',
          priceLineWidth: priceLineWidth !== undefined ? priceLineWidth : 1,
          priceLineColor: priceLineColor !== undefined ? priceLineColor : '',
          priceLineStyle: priceLineStyle !== undefined ? priceLineStyle : 2
        }
        const bandSeries = createBandSeries(chart, bandSeriesOptions)
        if (data && data.length > 0) {
          bandSeries.setData(data as BandData[])
        }
        return {
          setData: (newData: any[]) => {
            try {
              bandSeries.setData(newData as BandData[])
            } catch {}
          },
          update: (newData: any) => {
            try {
              bandSeries.update(newData as BandData)
            } catch {}
          },
          applyOptions: (options: any) => {
            try {
              bandSeries.setOptions(cleanLineStyleOptions(options))
            } catch {}
          },
          priceScale: () => {
            try {
              return chart.priceScale(priceScaleId || 'right')
            } catch {
              return null
            }
          },
          remove: () => {
            try {
              bandSeries.remove()
            } catch {}
          }
        } as unknown as ISeriesApi<any>
      } catch {
        return null
      }
    }
    case 'ribbon': {
      try {
        const ribbonSeriesOptions: any = {
          upperLine: cleanedOptions.upperLine || {
            color: '#4CAF50',
            lineStyle: 0,
            lineWidth: 2,
            lineVisible: true
          },
          lowerLine: cleanedOptions.lowerLine || {
            color: '#F44336',
            lineStyle: 0,
            lineWidth: 2,
            lineVisible: true
          },
          fill: cleanedOptions.fill || 'rgba(76, 175, 80, 0.1)',
          fillVisible: cleanedOptions.fillVisible !== false,
          priceScaleId: priceScaleId || 'right',
          visible: cleanedOptions.visible !== false,
          lastValueVisible: lastValueVisible !== undefined ? lastValueVisible : true,
          priceLineVisible: priceLineVisible !== undefined ? priceLineVisible : true,
          priceLineSource: priceLineSource !== undefined ? priceLineSource : 'lastBar',
          priceLineWidth: priceLineWidth !== undefined ? priceLineWidth : 1,
          priceLineColor: priceLineColor !== undefined ? priceLineColor : '',
          priceLineStyle: priceLineStyle !== undefined ? priceLineStyle : 2
        }

        const ribbonSeries = new RibbonSeries(chart, ribbonSeriesOptions)
        if (data && data.length > 0) {
          ribbonSeries.setData(data)
        }

        return {
          setData: (newData: any[]) => {
            try {
              ribbonSeries.setData(newData)
            } catch {}
          },
          update: (newData: any) => {
            try {
              // For ribbon, update the entire dataset
              ribbonSeries.setData([newData])
            } catch {}
          },
          applyOptions: (options: any) => {
            try {
              ribbonSeries.setOptions(cleanLineStyleOptions(options))
            } catch {}
          },
          priceScale: () => {
            try {
              return chart.priceScale(priceScaleId || 'right')
            } catch {
              return null
            }
          },
          remove: () => {
            try {
              // For primitives, we need to detach from the series
              // The series will handle cleanup when removed
            } catch {}
          }
        } as unknown as ISeriesApi<any>
      } catch (error) {
        console.error('Error creating ribbon series:', error)
        return null
      }
    }
    case 'signal': {
      try {
        const signalSeries = createSignalSeriesPlugin(chart, {
          type: 'signal',
          data: data || [],
          options: {
            neutralColor: cleanedOptions.neutralColor || '#f0f0f0',
            signalColor: cleanedOptions.signalColor || '#ff0000',
            alertColor: cleanedOptions.alertColor,
            visible: cleanedOptions.visible !== false
          },
          paneId: finalPaneId
        })
        if (signalPluginRefs && chartId !== undefined && seriesIndex !== undefined) {
          signalPluginRefs.current[`${chartId}-${seriesIndex}`] = signalSeries
        }
        return {
          setData: (newData: any[]) => {
            try {
              signalSeries.updateData(newData)
            } catch {}
          },
          update: (newData: any) => {
            try {
              signalSeries.updateData([newData])
            } catch {}
          },
          applyOptions: (options: any) => {
            try {
              signalSeries.updateOptions({
                neutralColor: options.neutralColor || '#f0f0f0',
                signalColor: options.signalColor || '#ff0000',
                alertColor: options.alertColor,
                visible: options.visible !== false
              })
            } catch {}
          },
          priceScale: () => {
            try {
              return chart.priceScale(priceScaleId || 'right')
            } catch {
              return null
            }
          },
          remove: () => {
            try {
              signalSeries.destroy()
              if (signalPluginRefs && chartId !== undefined && seriesIndex !== undefined) {
                delete signalPluginRefs.current[`${chartId}-${seriesIndex}`]
              }
            } catch {}
          }
        } as unknown as ISeriesApi<any>
      } catch {
        return null
      }
    }
    case 'trend_fill': {
      try {
        const trendFillSeries = createTrendFillSeriesPlugin(chart, {
          type: 'trend_fill',
          data: data || [],
          options: {
            uptrendFillColor: cleanedOptions.uptrendFillColor || '#4CAF50',
            downtrendFillColor: cleanedOptions.downtrendFillColor || '#F44336',
            trendLine: {
              color: cleanedOptions.trendLine?.color || '#F44336',
              lineWidth: cleanedOptions.trendLine?.lineWidth || 2,
              lineStyle: cleanedOptions.trendLine?.lineStyle || 0,
              visible: cleanedOptions.trendLine?.visible !== false
            },
            baseLine: {
              color: cleanedOptions.baseLine?.color || '#666666',
              lineWidth: cleanedOptions.baseLine?.lineWidth || 1,
              lineStyle: cleanedOptions.baseLine?.lineStyle || 1,
              visible: cleanedOptions.baseLine?.visible !== false
            },
            visible: cleanedOptions.visible !== false
          },
          paneId: finalPaneId
        })

        // Set the data immediately
        if (data && data.length > 0) {
          trendFillSeries.setData(data)
        }

        return {
          setData: (newData: any[]) => {
            try {
              trendFillSeries.setData(newData)
            } catch (error) {
              // Error handling
            }
          },
          update: (newData: any) => {
            try {
              trendFillSeries.updateData([newData])
            } catch (error) {
              // Error handling
            }
          },
          applyOptions: (options: any) => {
            try {
              trendFillSeries.applyOptions(options)
            } catch (error) {
              // Error handling
            }
          },
          priceScale: () => {
            try {
              return chart.priceScale(priceScaleId || 'right')
            } catch {
              return null
            }
          },
          remove: () => {
            try {
              trendFillSeries.destroy()
            } catch (error) {
              // Error handling
            }
          }
        } as unknown as ISeriesApi<any>
      } catch (error) {
        return null
      }
    }
    case 'baseline': {
      const baselineOptions: any = {
        ...cleanedOptions,
        baseValue: cleanedOptions.baseValue || {price: 0},
        topLineColor: cleanedOptions.topLineColor || 'rgba(76, 175, 80, 0.4)',
        topFillColor1: cleanedOptions.topFillColor1 || 'rgba(76, 175, 80, 0.0)',
        topFillColor2: cleanedOptions.topFillColor2 || 'rgba(76, 175, 80, 0.4)',
        bottomLineColor: cleanedOptions.bottomLineColor || 'rgba(255, 82, 82, 0.4)',
        bottomFillColor1: cleanedOptions.bottomFillColor1 || 'rgba(255, 82, 82, 0.4)',
        bottomFillColor2: cleanedOptions.bottomFillColor2 || 'rgba(255, 82, 82, 0.0)',
        lineWidth: cleanedOptions.lineWidth || 2,
        priceScaleId: priceScaleId || '',
        lastValueVisible: lastValueVisible !== undefined ? lastValueVisible : true,
        priceLineVisible: priceLineVisible !== undefined ? priceLineVisible : true,
        priceLineSource: priceLineSource !== undefined ? priceLineSource : 'lastBar',
        priceLineWidth: priceLineWidth !== undefined ? priceLineWidth : 1,
        priceLineColor: priceLineColor !== undefined ? priceLineColor : '',
        priceLineStyle: priceLineStyle !== undefined ? priceLineStyle : 2
      }
      if (priceFormat) {
        baselineOptions.priceFormat = priceFormat
      }
      series = chart.addSeries(BaselineSeries, baselineOptions, finalPaneId)
      break
    }
    case 'histogram': {
      // Check if data contains individual colors - FIXED VERSION
      const hasIndividualColors =
        seriesConfig.data && seriesConfig.data.some((point: any) => point.color)

      const histogramOptions: any = {
        ...cleanedOptions,
        priceFormat: priceFormat || {
          type: 'volume'
        },
        priceScaleId: priceScaleId || '',
        scaleMargins: cleanedOptions.scaleMargins || {
          top: 0.75,
          bottom: 0
        },
        lastValueVisible: lastValueVisible !== undefined ? lastValueVisible : true,
        // Only set static color if no individual colors are present in data
        color: hasIndividualColors ? undefined : cleanedOptions.color || '#2196F3',
        priceLineVisible: priceLineVisible !== undefined ? priceLineVisible : true,
        priceLineSource: priceLineSource !== undefined ? priceLineSource : 'lastBar',
        priceLineWidth: priceLineWidth !== undefined ? priceLineWidth : 1,
        priceLineColor: priceLineColor !== undefined ? priceLineColor : '',
        priceLineStyle: priceLineStyle !== undefined ? priceLineStyle : 2
      }
      if (priceFormat) {
        histogramOptions.priceFormat = priceFormat
      }
      series = chart.addSeries(HistogramSeries, histogramOptions, finalPaneId)
      break
    }
    case 'line': {
      // Process lineOptions if provided
      const lineSpecificOptions = seriesConfig.lineOptions || {}

      const lineOptions: any = {
        ...cleanedOptions,
        // Apply line-specific options from lineOptions object
        lineStyle:
          lineSpecificOptions.lineStyle !== undefined
            ? lineSpecificOptions.lineStyle
            : cleanedOptions.lineStyle,
        lineType:
          lineSpecificOptions.lineType !== undefined
            ? lineSpecificOptions.lineType
            : cleanedOptions.lineType,
        lineVisible:
          lineSpecificOptions.lineVisible !== undefined
            ? lineSpecificOptions.lineVisible
            : cleanedOptions.lineVisible,
        pointMarkersVisible:
          lineSpecificOptions.pointMarkersVisible !== undefined
            ? lineSpecificOptions.pointMarkersVisible
            : cleanedOptions.pointMarkersVisible,
        pointMarkersRadius:
          lineSpecificOptions.pointMarkersRadius !== undefined
            ? lineSpecificOptions.pointMarkersRadius
            : cleanedOptions.crosshairMarkerRadius,
        crosshairMarkerVisible:
          lineSpecificOptions.crosshairMarkerVisible !== undefined
            ? lineSpecificOptions.crosshairMarkerVisible
            : cleanedOptions.crosshairMarkerVisible,
        crosshairMarkerRadius:
          lineSpecificOptions.crosshairMarkerRadius !== undefined
            ? lineSpecificOptions.crosshairMarkerRadius
            : cleanedOptions.crosshairMarkerRadius,
        crosshairMarkerBorderColor:
          lineSpecificOptions.crosshairMarkerBorderColor !== undefined
            ? lineSpecificOptions.crosshairMarkerBorderColor
            : cleanedOptions.crosshairMarkerBorderColor,
        crosshairMarkerBackgroundColor:
          lineSpecificOptions.crosshairMarkerBackgroundColor !== undefined
            ? lineSpecificOptions.crosshairMarkerBackgroundColor
            : cleanedOptions.crosshairMarkerBackgroundColor,
        crosshairMarkerBorderWidth:
          lineSpecificOptions.crosshairMarkerBorderWidth !== undefined
            ? lineSpecificOptions.crosshairMarkerBorderWidth
            : cleanedOptions.crosshairMarkerBorderWidth,
        lastPriceAnimation:
          lineSpecificOptions.lastPriceAnimation !== undefined
            ? lineSpecificOptions.lastPriceAnimation
            : lastPriceAnimation,
        // Default values
        color: cleanedOptions.color || '#2196F3', // Restore original default color
        lineWidth: cleanedOptions.lineWidth || 2,
        crossHairMarkerVisible:
          lineSpecificOptions.crosshairMarkerVisible !== undefined
            ? lineSpecificOptions.crosshairMarkerVisible
            : cleanedOptions.crossHairMarkerVisible !== undefined
              ? cleanedOptions.crossHairMarkerVisible
              : true,
        priceScaleId: priceScaleId || '',
        lastValueVisible: lastValueVisible !== undefined ? lastValueVisible : true,
        priceLineVisible: priceLineVisible !== undefined ? priceLineVisible : true,
        priceLineSource: priceLineSource !== undefined ? priceLineSource : 'lastBar',
        priceLineWidth: priceLineWidth !== undefined ? priceLineWidth : 1,
        priceLineColor: priceLineColor !== undefined ? priceLineColor : '',
        priceLineStyle: priceLineStyle !== undefined ? priceLineStyle : 2
      }
      if (priceFormat) {
        lineOptions.priceFormat = priceFormat
      }
      series = chart.addSeries(LineSeries, lineOptions, finalPaneId)

      // Apply lastValueVisible: false after series creation if needed
      try {
        if (lastValueVisible === false) {
          series.applyOptions({lastValueVisible: false})
        }
      } catch {
        // ignore
      }
      break
    }
    case 'bar': {
      const barOptions: any = {
        ...cleanedOptions,
        upColor: cleanedOptions.upColor || '#4CAF50',
        downColor: cleanedOptions.downColor || '#F44336',
        openVisible: cleanedOptions.openVisible || false,
        priceScaleId: priceScaleId || '',
        lastValueVisible: lastValueVisible !== undefined ? lastValueVisible : true,
        priceLineVisible: priceLineVisible !== undefined ? priceLineVisible : true,
        priceLineSource: priceLineSource !== undefined ? priceLineSource : 'lastBar',
        priceLineWidth: priceLineWidth !== undefined ? priceLineWidth : 1,
        priceLineColor: priceLineColor !== undefined ? priceLineColor : '',
        priceLineStyle: priceLineStyle !== undefined ? priceLineStyle : 2
      }
      if (priceFormat) {
        barOptions.priceFormat = priceFormat
      }
      series = chart.addSeries(BarSeries, barOptions, finalPaneId)
      break
    }
    case 'candlestick': {
      const candlestickOptions: any = {
        ...cleanedOptions,
        upColor: cleanedOptions.upColor || '#4CAF50',
        downColor: cleanedOptions.downColor || '#F44336',
        borderVisible: cleanedOptions.borderVisible !== false,
        wickUpColor: cleanedOptions.wickUpColor || '#4CAF50',
        wickDownColor: cleanedOptions.wickDownColor || '#F44336',
        priceScaleId: priceScaleId || '',
        lastValueVisible: lastValueVisible !== undefined ? lastValueVisible : true,
        priceLineVisible: priceLineVisible !== undefined ? priceLineVisible : true,
        priceLineSource: priceLineSource !== undefined ? priceLineSource : 'lastBar',
        priceLineWidth: priceLineWidth !== undefined ? priceLineWidth : 1,
        priceLineColor: priceLineColor !== undefined ? priceLineColor : '',
        priceLineStyle: priceLineStyle !== undefined ? priceLineStyle : 2
      }
      if (priceFormat) {
        candlestickOptions.priceFormat = priceFormat
      }
      series = chart.addSeries(CandlestickSeries, candlestickOptions, finalPaneId)
      break
    }
    default:
      throw new Error(`Invalid series type: ${type}`)
  }

  if (priceScale) {
    series.priceScale().applyOptions(cleanLineStyleOptions(priceScale))
  }

  if (data && data.length > 0) {
    series.setData(data)
  }

  if (seriesConfig.priceLines && Array.isArray(seriesConfig.priceLines)) {
    seriesConfig.priceLines.forEach((priceLine: any, index: number) => {
      try {
        series.createPriceLine(priceLine)
      } catch (error) {
        console.warn(`❌ Failed to create price line ${index + 1} for series:`, error)
      }
    })
  }

  if (seriesConfig.markers && Array.isArray(seriesConfig.markers)) {
    try {
      // Apply timestamp snapping to all markers (like trade visualization)
      const snappedMarkers = applyTimestampSnapping(seriesConfig.markers, data)
      createSeriesMarkers(series, snappedMarkers)
    } catch (error) {
      // Error handling
    }
  }

  // Store paneId as a property on the series object for legend functionality
  if (finalPaneId !== undefined) {
    ;(series as any).paneId = finalPaneId
  }

  // Handle series legend if configured - add directly to the correct PaneLegendManager
  if (seriesConfig.legend && seriesConfig.legend.visible) {
    const seriesId = `${chartId || 'default'}-series-${seriesIndex || 0}`

    // Store legend config on the series for reference
    ;(series as any).legendConfig = seriesConfig.legend
    ;(series as any).seriesId = seriesId

    // Add legend directly to the correct PaneLegendManager
    try {
      console.log(
        `🔍 Debug: Looking for legend manager - chartId: ${chartId}, finalPaneId: ${finalPaneId}`
      )
      console.log(`🔍 Debug: paneLegendManagers exists:`, !!(window as any).paneLegendManagers)
      console.log(`🔍 Debug: chartId exists:`, !!(window as any).paneLegendManagers?.[chartId])
      console.log(
        `🔍 Debug: Available pane IDs:`,
        Object.keys((window as any).paneLegendManagers?.[chartId] || {})
      )

      const legendManager = (window as any).paneLegendManagers?.[chartId]?.[finalPaneId]
      if (legendManager) {
        legendManager.addSeriesLegend(seriesId, seriesConfig)
        console.log(`✅ Added legend for series ${seriesId} to pane ${finalPaneId}`)
      } else {
        console.warn(`❌ No legend manager found for pane ${finalPaneId} (chartId: ${chartId})`)
        console.warn(
          `❌ Available panes:`,
          Object.keys((window as any).paneLegendManagers?.[chartId] || {})
        )
      }
    } catch (error) {
      console.error(`❌ Error adding legend for series ${seriesId}:`, error)
    }
  }

  // Add trade visualization if configured for this series
  if (
    seriesConfig.trades &&
    seriesConfig.tradeVisualizationOptions &&
    seriesConfig.trades.length > 0
  ) {
    try {
      // Create trade visual elements (markers, rectangles, annotations)
      const tradeOptions = seriesConfig.tradeVisualizationOptions
      const visualElements = createTradeVisualElements(seriesConfig.trades, tradeOptions, data)

      // Add trade markers to the series
      if (visualElements.markers && visualElements.markers.length > 0) {
        createSeriesMarkers(series, visualElements.markers)
      }

      // Store rectangle data for later processing by the chart component
      if (visualElements.rectangles && visualElements.rectangles.length > 0) {
        // Store the rectangle data in the chart for later processing
        if (!(chart as any)._pendingTradeRectangles) {
          ;(chart as any)._pendingTradeRectangles = []
        }
        ;(chart as any)._pendingTradeRectangles.push({
          rectangles: visualElements.rectangles,
          series: series,
          chartId: chartId
        })
      }
    } catch (error) {
      console.error(`❌ [seriesFactory] Error processing trades:`, error)
    }
  }

  return series
}

/**
 * Apply timestamp snapping to markers to ensure they align with chart data.
 * This function implements the same logic as the trade visualization system
 * but applies it to all markers, not just trade markers.
 *
 * @param markers Array of markers to snap
 * @param chartData Chart data for timestamp reference
 * @returns Array of markers with snapped timestamps
 */
function applyTimestampSnapping(markers: any[], chartData?: any[]): any[] {
  if (!chartData || chartData.length === 0) {
    return markers
  }

  // Extract available timestamps from chart data
  const availableTimes = chartData
    .map(item => {
      if (typeof item.time === 'number') {
        return item.time
      } else if (typeof item.time === 'string') {
        return Math.floor(new Date(item.time).getTime() / 1000)
      }
      return null
    })
    .filter(time => time !== null)

  if (availableTimes.length === 0) {
    return markers
  }

  // Apply timestamp snapping to each marker
  const snappedMarkers = markers.map((marker, index) => {
    if (marker.time && typeof marker.time === 'number') {
      // Find nearest available timestamp
      const nearestTime = availableTimes.reduce((nearest, current) => {
        const currentDiff = Math.abs(current - marker.time)
        const nearestDiff = Math.abs(nearest - marker.time)
        return currentDiff < nearestDiff ? current : nearest
      })

      // Return marker with snapped timestamp
      return {
        ...marker,
        time: nearestTime
      }
    } else {
      return marker
    }
  })

  return snappedMarkers
}
