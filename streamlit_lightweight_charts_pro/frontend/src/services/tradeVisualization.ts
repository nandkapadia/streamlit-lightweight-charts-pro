import {UTCTimestamp, SeriesMarker, Time} from 'lightweight-charts'
import {TradeConfig, TradeVisualizationOptions} from '../types'

// CRITICAL: Timezone-agnostic parsing functions
/**
 * Parse time value to UTC timestamp without timezone conversion
 * Handles both string dates and numeric timestamps
 */
function parseTime(time: string | number): UTCTimestamp | null {
  try {
    // If it's already a number (Unix timestamp), convert to seconds if needed
    if (typeof time === 'number') {
      // If timestamp is in milliseconds, convert to seconds
      if (time > 1000000000000) {
        return Math.floor(time / 1000) as UTCTimestamp
      }
      return Math.floor(time) as UTCTimestamp
    }

    // If it's a string, try to parse as date
    if (typeof time === 'string') {
      // First try to parse as Unix timestamp string
      const timestamp = parseInt(time, 10)
      if (!isNaN(timestamp)) {
        // It's a numeric string (Unix timestamp)
        if (timestamp > 1000000000000) {
          return Math.floor(timestamp / 1000) as UTCTimestamp
        }
        return Math.floor(timestamp) as UTCTimestamp
      }

      // Try to parse as ISO date string - CRITICAL: No timezone conversion
      if (time.includes('T') || time.includes('Z') || time.includes('+')) {
        // ISO format - parse directly to avoid local timezone conversion
        const date = new Date(time)
        if (isNaN(date.getTime())) {
          console.warn(`Failed to parse ISO time: ${time}`)
          return null
        }
        // Use UTC timestamp directly - no timezone conversion
        return Math.floor(date.getTime() / 1000) as UTCTimestamp
      }

      // Regular date string parsing as fallback
      const date = new Date(time)
      if (isNaN(date.getTime())) {
        console.warn(`Failed to parse time: ${time}`)
        return null
      }
      return Math.floor(date.getTime() / 1000) as UTCTimestamp
    }

    return null
  } catch (error) {
    console.error(`Error parsing time ${time}:`, error)
    return null
  }
}

/**
 * Find nearest available timestamp in chart data
 */
function findNearestTime(targetTime: UTCTimestamp, chartData: any[]): UTCTimestamp | null {
  if (!chartData || chartData.length === 0) {
    return null
  }

  let nearestTime: UTCTimestamp | null = null
  let minDiff = Infinity

  for (const item of chartData) {
    if (!item.time) continue

    let itemTime: UTCTimestamp | null = null

    if (typeof item.time === 'number') {
      itemTime =
        item.time > 1000000000000
          ? (Math.floor(item.time / 1000) as UTCTimestamp)
          : (item.time as UTCTimestamp)
    } else if (typeof item.time === 'string') {
      itemTime = parseTime(item.time)
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

// Trade rectangle data interface (for data creation only)
export interface TradeRectangleData {
  time1: UTCTimestamp
  time2: UTCTimestamp
  price1: number
  price2: number
  fillColor: string
  borderColor: string
  borderWidth: number
  borderStyle: 'solid' | 'dashed' | 'dotted'
  opacity: number
  priceScaleId?: string
}

// Create trade rectangles from trade data
function createTradeRectangles(
  trades: TradeConfig[],
  options: TradeVisualizationOptions,
  chartData?: any[]
): TradeRectangleData[] {
  const rectangles: TradeRectangleData[] = []

  // Enhanced validation using coordinate service

  trades.forEach((trade, index) => {
    // Validate trade data - allow exitTime to be null for open trades
    if (
      !trade.entryTime ||
      typeof trade.entryPrice !== 'number' ||
      typeof trade.exitPrice !== 'number'
    ) {
      return
    }

    // Parse entry time
    const time1 = parseTime(trade.entryTime)
    if (time1 === null) {
      return
    }

    // Handle exit time - can be null for open trades
    let time2: UTCTimestamp | null = null
    if (trade.exitTime) {
      time2 = parseTime(trade.exitTime)
      if (time2 === null) {
        return
      }
    } else {
      // For open trades, use the last available time from chart data
      if (chartData && chartData.length > 0) {
        const lastTime = chartData[chartData.length - 1]?.time
        if (lastTime) {
          time2 = parseTime(lastTime)
        }
      }

      // If still no exit time, skip this trade
      if (time2 === null) {
        return
      }
    }

    // Find nearest available times in chart data if provided
    let adjustedTime1 = time1
    let adjustedTime2 = time2

    if (chartData && chartData.length > 0) {
      const nearestTime1 = findNearestTime(time1, chartData)
      const nearestTime2 = findNearestTime(time2, chartData)

      if (nearestTime1) adjustedTime1 = nearestTime1
      if (nearestTime2) adjustedTime2 = nearestTime2
    }

    // Validate prices
    if (trade.entryPrice <= 0 || trade.exitPrice <= 0) {
      return
    }

    const color = trade.isProfitable
      ? options.rectangleColorProfit || '#4CAF50'
      : options.rectangleColorLoss || '#F44336'

    const opacity = options.rectangleFillOpacity || 1.0

    const rectangle: TradeRectangleData = {
      time1: Math.min(adjustedTime1, adjustedTime2) as UTCTimestamp,
      price1: Math.min(trade.entryPrice, trade.exitPrice),
      time2: Math.max(adjustedTime1, adjustedTime2) as UTCTimestamp,
      price2: Math.max(trade.entryPrice, trade.exitPrice),
      fillColor: color,
      borderColor: color,
      borderWidth: options.rectangleBorderWidth || 3,
      borderStyle: 'solid' as const,
      opacity: opacity
    }

    rectangles.push(rectangle)
  })

  return rectangles
}

// Create trade markers
function createTradeMarkers(
  trades: TradeConfig[],
  options: TradeVisualizationOptions,
  chartData?: any[]
): SeriesMarker<Time>[] {
  const markers: SeriesMarker<Time>[] = []

  // Enhanced validation using coordinate service

  trades.forEach((trade, index) => {
    // Validate trade data - allow exitTime to be null for open trades
    if (
      !trade.entryTime ||
      typeof trade.entryPrice !== 'number' ||
      typeof trade.exitPrice !== 'number'
    ) {
      return
    }

    // Parse entry time
    const entryTime = parseTime(trade.entryTime)
    if (!entryTime) {
      return
    }

    // Handle exit time - can be null for open trades
    let exitTime: UTCTimestamp | null = null
    if (trade.exitTime) {
      exitTime = parseTime(trade.exitTime)
      if (!exitTime) {
        return
      }
    }

    // Find nearest available times in chart data if provided
    let adjustedEntryTime = entryTime
    let adjustedExitTime = exitTime

    if (chartData && chartData.length > 0) {
      const nearestEntryTime = findNearestTime(entryTime, chartData)
      if (nearestEntryTime) adjustedEntryTime = nearestEntryTime

      if (exitTime) {
        const nearestExitTime = findNearestTime(exitTime, chartData)
        if (nearestExitTime) adjustedExitTime = nearestExitTime
      }
    }

    // Entry marker
    const entryColor =
      trade.tradeType === 'long'
        ? options.entryMarkerColorLong || '#2196F3'
        : options.entryMarkerColorShort || '#FF9800'

    const entryMarker: SeriesMarker<Time> = {
      time: adjustedEntryTime,
      position: trade.tradeType === 'long' ? 'belowBar' : 'aboveBar',
      color: entryColor,
      shape: trade.tradeType === 'long' ? 'arrowUp' : 'arrowDown',
      text:
        options.showPnlInMarkers && trade.text
          ? trade.text
          : `Entry: $${trade.entryPrice.toFixed(2)}`
    }
    markers.push(entryMarker)

    // Exit marker - only create if trade has been closed
    if (adjustedExitTime) {
      const exitColor = trade.isProfitable
        ? options.exitMarkerColorProfit || '#4CAF50'
        : options.exitMarkerColorLoss || '#F44336'

      const exitMarker: SeriesMarker<Time> = {
        time: adjustedExitTime,
        position: trade.tradeType === 'long' ? 'aboveBar' : 'belowBar',
        color: exitColor,
        shape: trade.tradeType === 'long' ? 'arrowDown' : 'arrowUp',
        text:
          options.showPnlInMarkers && trade.text
            ? trade.text
            : `Exit: $${trade.exitPrice.toFixed(2)}`
      }
      markers.push(exitMarker)
    }
  })

  return markers
}

// Main function to create trade visual elements
export function createTradeVisualElements(
  trades: TradeConfig[],
  options: TradeVisualizationOptions,
  chartData?: any[],
  priceScaleId?: string
): {
  markers: SeriesMarker<Time>[]
  rectangles: TradeRectangleData[]
  annotations: any[]
} {
  const markers: SeriesMarker<Time>[] = []
  const rectangles: TradeRectangleData[] = []
  const annotations: any[] = []

  if (!trades || trades.length === 0) {
    return {markers, rectangles, annotations}
  }

  // Create markers if enabled
  if (options && (options.style === 'markers' || options.style === 'both')) {
    markers.push(...createTradeMarkers(trades, options, chartData))
  }

  // Create rectangles if enabled - these will be handled by RectanglePlugin
  if (options && (options.style === 'rectangles' || options.style === 'both')) {
    const newRectangles = createTradeRectangles(trades, options, chartData)
    rectangles.push(...newRectangles)
  }

  // Create annotations if enabled
  if (options.showAnnotations) {
    trades.forEach(trade => {
      const textParts: string[] = []

      if (options.showTradeId && trade.id) {
        textParts.push(`#${trade.id}`)
      }

      if (options.showTradeType) {
        textParts.push(trade.tradeType.toUpperCase())
      }

      if (options.showQuantity) {
        textParts.push(`Qty: ${trade.quantity}`)
      }

      if (trade.pnlPercentage !== undefined) {
        textParts.push(`P&L: ${trade.pnlPercentage.toFixed(1)}%`)
      }

      // Calculate midpoint for annotation position
      const entryTime = parseTime(trade.entryTime)
      const exitTime = parseTime(trade.exitTime)

      if (entryTime === null || exitTime === null) {
        return
      }

      const midTime = (entryTime + exitTime) / 2
      const midPrice = (trade.entryPrice + trade.exitPrice) / 2

      annotations.push({
        type: 'text',
        time: midTime,
        price: midPrice,
        text: textParts.join(' | '),
        fontSize: options.annotationFontSize || 12,
        backgroundColor: options.annotationBackground || 'rgba(255, 255, 255, 0.8)',
        color: '#000000',
        padding: 4
      })
    })
  }

  return {markers, rectangles, annotations}
}

/**
 * Convert trade rectangle data to RectanglePlugin format
 * This bridges the gap between trade data and the RectanglePlugin
 */
export function convertTradeRectanglesToPluginFormat(
  tradeRectangles: TradeRectangleData[],
  chart: any,
  series?: any
): any[] {
  if (!chart || !series) {
    return []
  }

  // Check if chart scales are ready
  const timeScale = chart.timeScale()
  const timeScaleWidth = timeScale.width()

  if (timeScaleWidth === 0) {
    return []
  }

  // Import PositioningEngine dynamically to avoid circular dependencies
  const {PositioningEngine} = require('../services/PositioningEngine')

  return tradeRectangles
    .map((rect, index) => {
      try {
        // Use PositioningEngine to calculate proper overlay position
        const boundingBox = PositioningEngine.calculateOverlayPosition(
          rect.time1,
          rect.time2,
          rect.price1,
          rect.price2,
          chart,
          series,
          0 // paneId
        )

        if (!boundingBox) {
          return null
        }

        const pluginRect = {
          id: `trade-rect-${index}`,
          x1: boundingBox.x,
          y1: boundingBox.y,
          x2: boundingBox.x + boundingBox.width,
          y2: boundingBox.y + boundingBox.height,
          color: rect.fillColor,
          borderColor: rect.borderColor,
          borderWidth: rect.borderWidth,
          fillOpacity: rect.opacity,
          borderOpacity: 1.0,
          label: `Trade ${index + 1}`,
          labelColor: '#000000',
          labelFontSize: 12,
          labelBackground: 'rgba(255, 255, 255, 0.8)',
          labelPadding: 4,
          zIndex: 10
        }

        return pluginRect
      } catch (error) {
        return null
      }
    })
    .filter(rect => rect !== null) // Remove null entries
}

/**
 * @deprecated - This function is no longer used. Use createTradeRectanglePrimitives from TradeRectanglePrimitive instead.
 */
export function createTradeRectanglePrimitives(
  tradeRectangles: TradeRectangleData[],
  chart?: any,
  series?: any
): any[] {
  console.warn(
    '[tradeVisualization] This createTradeRectanglePrimitives is deprecated. Use the one from TradeRectanglePrimitive instead.'
  )
  return []
}

/**
 * Convert trade rectangles to plugin format after ensuring chart is ready
 */
export async function convertTradeRectanglesToPluginFormatWhenReady(
  tradeRectangles: TradeRectangleData[],
  chart: any,
  series?: any
): Promise<any[]> {
  if (!chart || !series) {
    return []
  }

  // Import ChartReadyDetector dynamically to avoid circular dependencies
  const {ChartReadyDetector} = await import('../utils/chartReadyDetection')

  try {
    // Wait for chart to be ready with proper dimensions
    const container = chart.chartElement()
    if (!container) {
      return []
    }

    const isReady = await ChartReadyDetector.waitForChartReady(chart, container, {
      minWidth: 200,
      minHeight: 200,
      maxAttempts: 10,
      baseDelay: 200
    })

    if (!isReady) {
    }

    // Now convert coordinates
    return convertTradeRectanglesToPluginFormat(tradeRectangles, chart, series)
  } catch (error) {
    // Fallback to immediate conversion
    return convertTradeRectanglesToPluginFormat(tradeRectangles, chart, series)
  }
}
