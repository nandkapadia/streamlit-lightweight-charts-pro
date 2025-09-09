/**
 * Trend Fill Series Plugin for Lightweight Charts
 *
 * This plugin renders trend lines with fill areas between trend line and base line,
 * creating a visual representation of trend direction and strength.
 *
 * Features:
 * - Dynamic baseline filling (similar to BaseLineSeries but with variable baseline)
 * - Band filling between trend line and base line
 * - Dynamic color changes based on trend direction
 * - Base line support for reference
 * - Optimized rendering using BaseLineSeries patterns
 */

import {
  IChartApi,
  ISeriesApi,
  ISeriesPrimitive,
  SeriesAttachedParameter,
  IPrimitivePaneView,
  IPrimitivePaneRenderer,
  Time,
  UTCTimestamp,
  LineSeries
} from 'lightweight-charts'

// Data structure for trend fill series
export interface TrendFillData {
  time: number | string
  baseLine?: number | null
  trendLine?: number | null
  trendDirection?: number | null
}

// Options for trend fill series
export interface TrendFillOptions {
  zIndex?: number
  uptrendFillColor: string
  downtrendFillColor: string
  trendLine: {
    color: string
    lineWidth: 1 | 2 | 3 | 4
    lineStyle: 0 | 1 | 2
    visible: boolean
  }
  baseLine: {
    color: string
    lineWidth: 1 | 2 | 3 | 4
    lineStyle: 0 | 1 | 2
    visible: boolean
  }
  visible: boolean
  priceScaleId?: string // Added for price scale ID
}

// Internal data structures for rendering (following BaseLineSeries pattern)
interface TrendFillItem {
  time: UTCTimestamp
  baseLine: number
  trendLine: number
  trendDirection: number
  fillColor: string
  lineColor: string
  lineWidth: number
  lineStyle: number
}

// Pre-converted coordinates for rendering (like BaseLineSeries)
interface TrendFillRenderData {
  x: number | null
  baseLineY: number | null
  trendLineY: number | null
  fillColor: string
  lineColor: string
  lineWidth: number
  lineStyle: number
  trendDirection: number
}

// Renderer data interface (following BaseLineSeries pattern)
interface TrendFillRendererData {
  items: TrendFillRenderData[]
  timeScale: any
  priceScale: any
  chartWidth: number
  // BaseLineSeries-style data
  lineWidth: number
  lineStyle: number
  visibleRange: {from: number; to: number} | null
  barWidth: number
}

// View data interface
interface TrendFillViewData {
  data: TrendFillRendererData
  options: TrendFillOptions
}

// Style cache for efficient rendering (like BaseLineSeries)
class TrendFillStyleCache {
  private _cache = new Map<
    string,
    CanvasRenderingContext2D['fillStyle'] | CanvasRenderingContext2D['strokeStyle']
  >()

  get(
    key: string,
    factory: () => CanvasRenderingContext2D['fillStyle'] | CanvasRenderingContext2D['strokeStyle']
  ): CanvasRenderingContext2D['fillStyle'] | CanvasRenderingContext2D['strokeStyle'] {
    if (this._cache.has(key)) {
      return this._cache.get(key)!
    }
    const style = factory()
    this._cache.set(key, style)
    return style
  }

  clear(): void {
    this._cache.clear()
  }
}

/**
 * Parse time value to timestamp
 * Handles both string dates and numeric timestamps
 */
function parseTime(time: string | number): UTCTimestamp {
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

      // Try to parse as date string
      const date = new Date(time)
      if (isNaN(date.getTime())) {
        console.warn(`Failed to parse time: ${time}`)
        return 0 as UTCTimestamp
      }
      return Math.floor(date.getTime() / 1000) as UTCTimestamp
    }

    return 0 as UTCTimestamp
  } catch (error) {
    console.error(`Error parsing time ${time}:`, error)
    return 0 as UTCTimestamp
  }
}

// Optimized Trend Fill Pane Renderer (following BaseLineSeries pattern)
class TrendFillPrimitivePaneRenderer implements IPrimitivePaneRenderer {
  _viewData: TrendFillViewData
  private readonly _styleCache: TrendFillStyleCache = new TrendFillStyleCache()

  constructor(data: TrendFillViewData) {
    this._viewData = data
  }

  draw(target: any) {
    // Batch all rendering operations (like BaseLineSeries)
    target.useBitmapCoordinateSpace((scope: any) => {
      const ctx = scope.context
      ctx.scale(scope.horizontalPixelRatio, scope.verticalPixelRatio)

      // Save context state once
      ctx.save()

      // Draw all elements efficiently
      this._drawTrendFills(ctx, scope)
      this._drawTrendLines(ctx, scope)

      // Restore context state once
      ctx.restore()
    })
  }

  private _drawTrendFills(ctx: CanvasRenderingContext2D, scope: any): void {
    const {items, visibleRange, barWidth} = this._viewData.data

    if (items.length === 0 || visibleRange === null) return

    // Use BaseLineSeries-style efficient rendering
    this._walkLineForFills(ctx, scope, items, visibleRange, barWidth)
  }

  private _drawTrendLines(ctx: CanvasRenderingContext2D, scope: any): void {
    const {items, visibleRange, barWidth, lineWidth, lineStyle} = this._viewData.data

    if (items.length === 0 || visibleRange === null) return

    // Set line style once (like BaseLineSeries)
    ctx.lineCap = 'butt'
    ctx.lineJoin = 'round'
    ctx.lineWidth = lineWidth
    this._setLineStyle(ctx, lineStyle)

    // Use BaseLineSeries-style efficient rendering
    this._walkLineForLines(ctx, scope, items, visibleRange, barWidth)
  }

  // Efficient line walking (following BaseLineSeries walkLine pattern)
  private _walkLineForFills(
    ctx: CanvasRenderingContext2D,
    scope: any,
    items: TrendFillRenderData[],
    visibleRange: {from: number; to: number},
    barWidth: number
  ): void {
    const {horizontalPixelRatio, verticalPixelRatio} = scope

    if (visibleRange.to - visibleRange.from < 2) {
      // Handle single point case
      const item = items[visibleRange.from]
      if (this._isValidCoordinates(item)) {
        this._drawSinglePointFill(ctx, item, horizontalPixelRatio, verticalPixelRatio)
      }
      return
    }

    // Walk through visible range efficiently
    let currentItem = items[visibleRange.from]
    if (!this._isValidCoordinates(currentItem)) return

    ctx.beginPath()
    ctx.moveTo(currentItem.x! * horizontalPixelRatio, currentItem.baseLineY! * verticalPixelRatio)

    for (let i = visibleRange.from + 1; i < visibleRange.to; i++) {
      const nextItem = items[i]
      if (!this._isValidCoordinates(nextItem)) continue

      // Draw fill area between current and next point
      this._drawFillSegment(ctx, currentItem, nextItem, horizontalPixelRatio, verticalPixelRatio)
      currentItem = nextItem
    }
  }

  private _walkLineForLines(
    ctx: CanvasRenderingContext2D,
    scope: any,
    items: TrendFillRenderData[],
    visibleRange: {from: number; to: number},
    barWidth: number
  ): void {
    const {horizontalPixelRatio, verticalPixelRatio} = scope

    if (visibleRange.to - visibleRange.from < 2) {
      // Handle single point case
      const item = items[visibleRange.from]
      if (this._isValidCoordinates(item)) {
        this._drawSinglePointLine(ctx, item, horizontalPixelRatio, verticalPixelRatio)
      }
      return
    }

    // Walk through visible range efficiently
    for (let i = visibleRange.from; i < visibleRange.to; i++) {
      const item = items[i]
      if (!this._isValidCoordinates(item)) continue

      this._drawTrendLine(ctx, item, horizontalPixelRatio, verticalPixelRatio)
    }
  }

  private _drawFillSegment(
    ctx: CanvasRenderingContext2D,
    current: TrendFillRenderData,
    next: TrendFillRenderData,
    hRatio: number,
    vRatio: number
  ): void {
    // Get cached fill style (like BaseLineSeries)
    const fillStyle = this._getCachedFillStyle(current)
    ctx.fillStyle = fillStyle

    // Draw fill area between trend line and base line
    // For both uptrend and downtrend: fill from base line to trend line
    const currentTrendLineY = current.trendLineY!
    const nextTrendLineY = next.trendLineY!

    ctx.lineTo(next.x! * hRatio, next.baseLineY! * vRatio)
    ctx.lineTo(next.x! * hRatio, nextTrendLineY * vRatio)
    ctx.lineTo(current.x! * hRatio, currentTrendLineY * vRatio)
    ctx.closePath()
    ctx.fill()

    // Start new path for next segment
    ctx.beginPath()
    ctx.moveTo(next.x! * hRatio, next.baseLineY! * vRatio)
  }

  private _drawSinglePointFill(
    ctx: CanvasRenderingContext2D,
    item: TrendFillRenderData,
    hRatio: number,
    vRatio: number
  ): void {
    const fillStyle = this._getCachedFillStyle(item)
    ctx.fillStyle = fillStyle

    // Draw fill area between trend line and base line
    // For both uptrend and downtrend: fill from base line to trend line
    const halfBarWidth = 2
    const trendLineY = item.trendLineY!

    ctx.beginPath()
    ctx.moveTo((item.x! - halfBarWidth) * hRatio, item.baseLineY! * vRatio)
    ctx.lineTo((item.x! + halfBarWidth) * hRatio, item.baseLineY! * vRatio)
    ctx.lineTo((item.x! + halfBarWidth) * hRatio, trendLineY * vRatio)
    ctx.lineTo((item.x! - halfBarWidth) * hRatio, trendLineY * vRatio)
    ctx.closePath()
    ctx.fill()
  }

  private _drawTrendLine(
    ctx: CanvasRenderingContext2D,
    item: TrendFillRenderData,
    hRatio: number,
    vRatio: number
  ): void {
    // Get cached stroke style (like BaseLineSeries)
    const strokeStyle = this._getCachedStrokeStyle(item)
    ctx.strokeStyle = strokeStyle

    // Draw trend line at the appropriate level based on trend direction
    // For both uptrend and downtrend: trend line is at trendLineY level
    const trendLineY = item.trendLineY!

    ctx.beginPath()
    ctx.arc(item.x! * hRatio, trendLineY * vRatio, 2, 0, 2 * Math.PI)
    ctx.fill()
  }

  private _drawSinglePointLine(
    ctx: CanvasRenderingContext2D,
    item: TrendFillRenderData,
    hRatio: number,
    vRatio: number
  ): void {
    const strokeStyle = this._getCachedStrokeStyle(item)
    ctx.strokeStyle = strokeStyle

    // Draw trend line at the appropriate level based on trend direction
    // For both uptrend and downtrend: trend line is at trendLineY level
    const trendLineY = item.trendLineY!

    ctx.beginPath()
    ctx.arc(item.x! * hRatio, trendLineY * vRatio, 2, 0, 2 * Math.PI)
    ctx.fill()
  }

  // Style caching (like BaseLineSeries)
  private _getCachedFillStyle(item: TrendFillRenderData): CanvasRenderingContext2D['fillStyle'] {
    const key = `fill_${item.fillColor}`
    return this._styleCache.get(key, () => {
      // Return the color as-is since opacity is handled in the color value
      return item.fillColor
    })
  }

  private _getCachedStrokeStyle(
    item: TrendFillRenderData
  ): CanvasRenderingContext2D['strokeStyle'] {
    const key = `stroke_${item.lineColor}_${item.lineWidth}_${item.lineStyle}`
    return this._styleCache.get(key, () => item.lineColor)
  }

  private _setLineStyle(ctx: CanvasRenderingContext2D, lineStyle: number): void {
    switch (lineStyle) {
      case 0:
        ctx.setLineDash([]) // Solid
        break
      case 1:
        ctx.setLineDash([5, 5]) // Dotted
        break
      case 2:
        ctx.setLineDash([10, 5]) // Dashed
        break
      default:
        ctx.setLineDash([])
    }
  }

  private _isValidCoordinates(item: TrendFillRenderData): boolean {
    // Strict coordinate validation (like BaseLineSeries)
    if (item.x === null || item.baseLineY === null || item.trendLineY === null) {
      return false
    }

    // Check bounds with tolerance
    const chartWidth = this._viewData.data.chartWidth || 800
    const tolerance = 100

    if (item.x < -tolerance || item.x > chartWidth + tolerance) {
      return false
    }

    // Check for extreme Y values
    if (Math.abs(item.baseLineY) > 10000 || Math.abs(item.trendLineY) > 10000) {
      return false
    }

    return true
  }
}

// Optimized Trend Fill Pane View (following BaseLineSeries pattern)
class TrendFillPrimitivePaneView implements IPrimitivePaneView {
  _source: TrendFillSeries
  _data: TrendFillViewData

  constructor(source: TrendFillSeries) {
    this._source = source
    this._data = {
      data: {
        items: [],
        timeScale: null,
        priceScale: null,
        chartWidth: 0,
        lineWidth: 1,
        lineStyle: 0,
        visibleRange: null,
        barWidth: 1
      },
      options: this._source.getOptions()
    }
  }

  update() {
    const chart = this._source.getChart()
    const timeScale = chart.timeScale()
    const chartElement = chart.chartElement()

    if (!timeScale || !chartElement) {
      return
    }

    // Get the price scale from the dummy series
    const dummySeries = this._source.getDummySeries()
    if (!dummySeries) {
      console.warn('[TrendFillSeries] No dummy series found')
      return
    }

    // Update view data
    this._data.data.timeScale = timeScale
    this._data.data.priceScale = dummySeries

    // Get chart dimensions
    this._data.data.chartWidth = chartElement?.clientWidth || 800

    // Get bar spacing (like BaseLineSeries)
    try {
      // Try to get bar spacing from chart model
      const chartModel = (chart as any)._model
      if (chartModel && chartModel.timeScale && chartModel.timeScale.barSpacing) {
        this._data.data.barWidth = chartModel.timeScale.barSpacing()
      } else {
        this._data.data.barWidth = 1 // Default fallback
      }
    } catch (error) {
      this._data.data.barWidth = 1 // Default fallback
    }

    // Batch coordinate conversion (like BaseLineSeries)
    const items = this._source.getProcessedData()
    const convertedItems = this._batchConvertCoordinates(items, timeScale, dummySeries)

    // Set visible range (like BaseLineSeries)
    this._data.data.visibleRange = this._calculateVisibleRange(convertedItems)

    // Update renderer data efficiently
    this._data.data.items = convertedItems
    this._data.data.lineWidth = this._source.getOptions().trendLine.lineWidth
    this._data.data.lineStyle = this._source.getOptions().trendLine.lineStyle
  }

  // Batch coordinate conversion (like BaseLineSeries)
  private _batchConvertCoordinates(
    items: TrendFillItem[],
    timeScale: any,
    priceScale: any
  ): TrendFillRenderData[] {
    if (!timeScale || !priceScale) {
      console.warn('[TrendFillSeries] Missing timeScale or priceScale for coordinate conversion')
      return []
    }

    return items
      .map(item => {
        try {
          // Convert coordinates using native methods with error handling
          const x = timeScale.timeToCoordinate(item.time)
          const baseLineY = priceScale.priceToCoordinate(item.baseLine)
          const trendLineY = priceScale.priceToCoordinate(item.trendLine)

          // Validate coordinates
          if (x === null || baseLineY === null || trendLineY === null) {
            return null
          }

          return {
            x,
            baseLineY,
            trendLineY,
            fillColor: item.fillColor,
            lineColor: item.lineColor,
            lineWidth: item.lineWidth,
            lineStyle: item.lineStyle,
            trendDirection: item.trendDirection
          }
        } catch (error) {
          return null
        }
      })
      .filter(item => item !== null) as TrendFillRenderData[]
  }

  // Calculate visible range (like BaseLineSeries)
  private _calculateVisibleRange(items: TrendFillRenderData[]): {from: number; to: number} | null {
    if (items.length === 0) return null

    // Simple visible range calculation
    // In a real implementation, this would consider chart viewport
    return {from: 0, to: items.length}
  }

  renderer() {
    return new TrendFillPrimitivePaneRenderer(this._data)
  }

  // Z-index support: Return the Z-index for proper layering
  zIndex(): number {
    const zIndex = this._source.getOptions().zIndex
    // Validate Z-index is a positive number
    if (typeof zIndex === 'number' && zIndex >= 0) {
      return zIndex
    }
    // Return default Z-index for trend fill series
    return 100
  }
}

// Trend Fill Series Class (following BaseLineSeries pattern but using primitives)
export class TrendFillSeries implements ISeriesPrimitive<Time> {
  private chart: IChartApi
  private dummySeries: ISeriesApi<'Line'>
  private options: TrendFillOptions
  private data: TrendFillData[] = []
  private _paneViews: TrendFillPrimitivePaneView[]
  private paneId: number

  // Processed data for rendering
  private trendFillItems: TrendFillItem[] = []

  constructor(
    chart: IChartApi,
    options: TrendFillOptions = {
      uptrendFillColor: '#4CAF50',
      downtrendFillColor: '#F44336',
      trendLine: {
        color: '#F44336',
        lineWidth: 2,
        lineStyle: 0,
        visible: true
      },
      baseLine: {
        color: '#666666',
        lineWidth: 1,
        lineStyle: 1,
        visible: false
      },
      visible: true,
      priceScaleId: 'right' // Default priceScaleId
    },
    paneId: number = 0
  ) {
    this.chart = chart
    this.options = {...options}
    this.paneId = paneId
    this._paneViews = []

    // Initialize after chart is ready
    this.waitForChartReady()
  }

  private waitForChartReady(): void {
    const checkReady = () => {
      try {
        const timeScale = this.chart.timeScale()
        if (timeScale) {
          this._initializeSeries()
        } else {
          setTimeout(checkReady, 50)
        }
      } catch (error) {
        setTimeout(checkReady, 50)
      }
    }
    setTimeout(checkReady, 100)
  }

  private _initializeSeries(): void {
    // Create pane views
    this._paneViews = [new TrendFillPrimitivePaneView(this)]

    // Create a dummy line series to attach the primitive to
    this.dummySeries = this.chart.addSeries(
      LineSeries,
      {
        color: 'transparent',
        lineWidth: 0 as any,
        visible: false,
        priceScaleId: this.options.priceScaleId || 'right' // Use options priceScaleId
      },
      this.paneId
    )

    // Add minimal dummy data to ensure the time scale is properly initialized
    const dummyData = [
      {
        time: Math.floor(Date.now() / 1000) as UTCTimestamp,
        value: 0
      }
    ]
    this.dummySeries.setData(dummyData)

    // Attach the primitive to the dummy series for rendering
    this.dummySeries.attachPrimitive(this)

    // Initial update
    this.updateAllViews()
  }

  public setData(data: TrendFillData[]): void {
    this.data = data
    this.processData()
    this.updateAllViews()
  }

  public updateData(data: TrendFillData[]): void {
    this.setData(data)
  }

  private processData(): void {
    this.trendFillItems = []

    if (!this.data || this.data.length === 0) return

    // Sort data by time
    const sortedData = [...this.data].sort((a, b) => {
      const timeA = parseTime(a.time)
      const timeB = parseTime(b.time)
      return timeA - timeB
    })

    // Process each data point
    for (const item of sortedData) {
      const time = parseTime(item.time)
      const baseLine = item.baseLine
      const trendLine = item.trendLine
      const trendDirection = item.trendDirection

      if (
        baseLine === null ||
        baseLine === undefined ||
        trendLine === null ||
        trendLine === undefined ||
        trendDirection === null ||
        trendDirection === undefined
      ) {
        continue
      }

      // Determine colors and styles based on trend direction
      const isUptrend = trendDirection > 0

      // Use trend line colors and styles
      const fillColor = isUptrend ? this.options.uptrendFillColor : this.options.downtrendFillColor

      // For both uptrend and downtrend: use trend line and base line
      const lineColor = isUptrend ? this.options.trendLine.color : this.options.trendLine.color

      const lineWidth = isUptrend
        ? this.options.trendLine.lineWidth
        : this.options.trendLine.lineWidth

      const lineStyle = isUptrend
        ? this.options.trendLine.lineStyle
        : this.options.trendLine.lineStyle

      // Create trend fill item (like BaseLineSeries data structure)
      this.trendFillItems.push({
        time,
        baseLine,
        trendLine,
        trendDirection,
        fillColor,
        lineColor,
        lineWidth,
        lineStyle
      })
    }
  }

  public applyOptions(options: Partial<TrendFillOptions>): void {
    this.options = {...this.options, ...options}
    this.processData()
    this.updateAllViews()
  }

  public setVisible(visible: boolean): void {
    this.options.visible = visible
    this.processData()
    this.updateAllViews()
  }

  public destroy(): void {
    try {
      this.chart.removeSeries(this.dummySeries)
    } catch (error) {
      console.warn('Failed to remove trend fill series:', error)
    }
  }

  // Getter methods
  getOptions(): TrendFillOptions {
    return this.options
  }

  getChart(): IChartApi {
    return this.chart
  }

  getProcessedData(): TrendFillItem[] {
    return this.trendFillItems
  }

  getDummySeries(): ISeriesApi<'Line'> {
    return this.dummySeries
  }

  // ISeriesPrimitive implementation
  attached(param: SeriesAttachedParameter<Time>): void {
    // Primitive is attached to the series
  }

  detached(): void {
    // Primitive is detached from the series
  }

  updateAllViews(): void {
    this._paneViews.forEach(pv => pv.update())
  }

  paneViews(): IPrimitivePaneView[] {
    return this._paneViews
  }
}

// Factory function to create trend fill series
export function createTrendFillSeriesPlugin(
  chart: IChartApi,
  config: {
    type: string
    data: TrendFillData[]
    options?: TrendFillOptions
    paneId?: number
  }
): TrendFillSeries {
  // Merge options with defaults, ensuring priceScaleId is properly set
  const defaultOptions: TrendFillOptions = {
    uptrendFillColor: '#4CAF50',
    downtrendFillColor: '#F44336',
    trendLine: {
      color: '#F44336',
      lineWidth: 2,
      lineStyle: 0,
      visible: true
    },
    baseLine: {
      color: '#666666',
      lineWidth: 1,
      lineStyle: 1,
      visible: false
    },
    visible: true,
    priceScaleId: 'right' // Default priceScaleId
  }

  const mergedOptions = {...defaultOptions, ...config.options}

  const series = new TrendFillSeries(chart, mergedOptions, config.paneId || 0)
  if (config.data) {
    series.setData(config.data)
  }
  return series
}
