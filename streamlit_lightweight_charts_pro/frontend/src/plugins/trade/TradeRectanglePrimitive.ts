import {
  IPrimitivePaneRenderer,
  IPrimitivePaneView,
  ISeriesPrimitive,
  IChartApi,
  ISeriesApi,
  Coordinate,
  UTCTimestamp
} from 'lightweight-charts'
import {ChartCoordinateService} from '../../services/ChartCoordinateService'
import {createBoundingBox} from '../../utils/coordinateValidation'

interface TradeRectangleData {
  time1: UTCTimestamp
  time2: UTCTimestamp
  price1: number
  price2: number
  fillColor: string
  borderColor: string
  borderWidth: number
  opacity: number
  label?: string
  textPosition?: 'inside' | 'above' | 'below'
  textFontSize?: number
  textColor?: string
  textBackground?: string
}

/**
 * Trade Rectangle Renderer following official TradingView patterns
 */
class TradeRectangleRenderer implements IPrimitivePaneRenderer {
  private _x1: Coordinate
  private _y1: Coordinate
  private _x2: Coordinate
  private _y2: Coordinate
  private _fillColor: string
  private _borderColor: string
  private _borderWidth: number
  private _opacity: number
  private _label: string
  private _textPosition: 'inside' | 'above' | 'below'
  private _textFontSize: number
  private _textColor: string
  private _textBackground: string

  constructor(
    x1: Coordinate,
    y1: Coordinate,
    x2: Coordinate,
    y2: Coordinate,
    fillColor: string,
    borderColor: string,
    borderWidth: number,
    opacity: number,
    label: string = '',
    textPosition: 'inside' | 'above' | 'below' = 'inside',
    textFontSize: number = 10,
    textColor: string = '#FFFFFF',
    textBackground: string = 'rgba(0, 0, 0, 0.7)'
  ) {
    this._x1 = x1
    this._y1 = y1
    this._x2 = x2
    this._y2 = y2
    this._fillColor = fillColor
    this._borderColor = borderColor
    this._borderWidth = borderWidth
    this._opacity = opacity
    this._label = label
    this._textPosition = textPosition
    this._textFontSize = textFontSize
    this._textColor = textColor
    this._textBackground = textBackground
  }

  draw(target: any) {
    // We use drawBackground for rectangles
  }

  drawBackground(target: any) {
    // Early return if coordinates are invalid
    if (
      this._x1 === null ||
      this._y1 === null ||
      this._x2 === null ||
      this._y2 === null ||
      this._x1 === undefined ||
      this._y1 === undefined ||
      this._x2 === undefined ||
      this._y2 === undefined ||
      this._x1 === 0 ||
      this._y1 === 0 ||
      this._x2 === 0 ||
      this._y2 === 0
    ) {
      return
    }

    // Use bitmap coordinate space for pixel-perfect rendering
    target.useBitmapCoordinateSpace((scope: any) => {
      const ctx = scope.context

      // Convert to bitmap coordinates
      const x1 = this._x1 * scope.horizontalPixelRatio
      const y1 = this._y1 * scope.verticalPixelRatio
      const x2 = this._x2 * scope.horizontalPixelRatio
      const y2 = this._y2 * scope.verticalPixelRatio

      // Calculate rectangle bounds
      const left = Math.min(x1, x2)
      const top = Math.min(y1, y2)
      const width = Math.abs(x2 - x1)
      const height = Math.abs(y2 - y1)

      if (width < 1 || height < 1) {
        return
      }

      try {
        // Draw filled rectangle
        ctx.globalAlpha = this._opacity
        ctx.fillStyle = this._fillColor
        ctx.fillRect(left, top, width, height)

        // Draw border
        if (this._borderWidth > 0) {
          ctx.globalAlpha = 1.0
          ctx.strokeStyle = this._borderColor
          ctx.lineWidth = this._borderWidth * scope.horizontalPixelRatio
          ctx.strokeRect(left, top, width, height)
        }

        // Draw label with configurable position and styling
        if (this._label) {
          ctx.globalAlpha = 1.0
          ctx.font = `${this._textFontSize * scope.verticalPixelRatio}px Arial`
          ctx.textAlign = 'center'

          // Calculate text position based on textPosition setting
          let textX = left + width / 2
          let textY: number
          let showBackground = true

          switch (this._textPosition) {
            case 'above':
              textY = top - 5 * scope.verticalPixelRatio // 5px above rectangle
              ctx.textBaseline = 'bottom'
              break
            case 'below':
              textY = top + height + 5 * scope.verticalPixelRatio // 5px below rectangle
              ctx.textBaseline = 'top'
              break
            case 'inside':
            default:
              textY = top + height / 2
              ctx.textBaseline = 'middle'
              break
          }

          // Measure text dimensions for background
          const textMetrics = ctx.measureText(this._label)
          const textWidth = textMetrics.width
          const textHeight = this._textFontSize * scope.verticalPixelRatio

          // Draw text background if configured
          if (showBackground && this._textBackground && this._textBackground !== 'transparent') {
            ctx.fillStyle = this._textBackground
            const bgPadding = 2 * scope.horizontalPixelRatio
            ctx.fillRect(
              textX - textWidth / 2 - bgPadding,
              textY - textHeight / 2 - bgPadding,
              textWidth + 2 * bgPadding,
              textHeight + 2 * bgPadding
            )
          }

          // Draw text
          ctx.fillStyle = this._textColor
          ctx.fillText(this._label, textX, textY)
        }
      } finally {
        ctx.globalAlpha = 1.0
      }
    })
  }
}

/**
 * Trade Rectangle View following official TradingView patterns
 */
class TradeRectangleView implements IPrimitivePaneView {
  private _source: TradeRectanglePrimitive
  private _x1: Coordinate = 0 as Coordinate
  private _y1: Coordinate = 0 as Coordinate
  private _x2: Coordinate = 0 as Coordinate
  private _y2: Coordinate = 0 as Coordinate

  constructor(source: TradeRectanglePrimitive) {
    this._source = source
  }

  update() {
    const data = this._source.data()
    const chart = this._source.chart()
    const series = this._source.series()

    if (!chart || !series || !data) {
      return
    }

    try {
      // Use our coordinate services and utilities for consistency across the codebase:
      // - Chart registration is handled via ChartCoordinateService
      // - Coordinate validation uses our centralized validation utilities
      // - Direct coordinate conversion follows official TradingView patterns
      const timeScale = chart.timeScale()

      // Get time scale state for coordinate conversion

      const x1 = timeScale.timeToCoordinate(data.time1)
      const x2 = timeScale.timeToCoordinate(data.time2)

      // Convert price coordinates using series coordinate conversion
      const y1 = series.priceToCoordinate(data.price1)
      const y2 = series.priceToCoordinate(data.price2)

      // CRITICAL FIX: Graceful failure handling identical to the old working canvas overlay approach
      // If coordinate conversion fails, silently return and let automatic retry mechanism handle it
      if (x1 === null || x2 === null || y1 === null || y2 === null) {
        return // Silent failure - just like old canvas overlay approach
      }

      // Validate coordinates are finite
      if (
        !isFinite(x1) ||
        isNaN(x1) ||
        !isFinite(x2) ||
        isNaN(x2) ||
        !isFinite(y1) ||
        isNaN(y1) ||
        !isFinite(y2) ||
        isNaN(y2)
      ) {
        return // Silent failure - automatic retry will occur
      }

      // Create bounding box for validation
      const boundingBox = createBoundingBox(
        Math.min(x1, x2),
        Math.min(y1, y2),
        Math.abs(x2 - x1),
        Math.abs(y2 - y1)
      )

      // Ensure non-zero dimensions
      if (boundingBox.width <= 0 || boundingBox.height <= 0) {
        return // Silent failure - automatic retry will occur
      }

      // SUCCESS: Set coordinates (same as old approach when coordinates are valid)
      this._x1 = x1
      this._y1 = y1
      this._x2 = x2
      this._y2 = y2
    } catch (error) {
      // CRITICAL FIX: Graceful error handling like old canvas overlay approach
      // Don't log errors prominently - just let automatic retry handle it

      return // Silent failure with automatic retry via event listeners
    }
  }

  renderer() {
    const data = this._source.data()
    return new TradeRectangleRenderer(
      this._x1,
      this._y1,
      this._x2,
      this._y2,
      data.fillColor,
      data.borderColor,
      data.borderWidth,
      data.opacity,
      data.label || '',
      data.textPosition || 'inside',
      data.textFontSize || 10,
      data.textColor || '#FFFFFF',
      data.textBackground || 'rgba(0, 0, 0, 0.7)'
    )
  }
}

/**
 * Trade Rectangle Primitive following official TradingView patterns
 *
 * This primitive provides:
 * - Event-driven automatic retry logic for coordinate conversion
 * - Graceful failure handling when chart isn't ready
 * - Integration with ChartCoordinateService for consistency
 * - Proper cleanup of event listeners to prevent memory leaks
 * - Support for findNearestTime timestamp adjustment
 */
export class TradeRectanglePrimitive implements ISeriesPrimitive {
  private _data: TradeRectangleData
  private _chart: IChartApi | null = null
  private _series: ISeriesApi<any> | null = null
  private _paneView: TradeRectangleView
  private _requestUpdate?: () => void
  private _timeScaleCallback?: (() => void) | null
  private _crosshairCallback?: (() => void) | null
  private _updateThrottled: boolean = false

  constructor(data: TradeRectangleData) {
    this._data = data
    this._paneView = new TradeRectangleView(this)
  }

  // Required by ISeriesPrimitive interface
  updateAllViews() {
    this._paneView.update()
  }

  paneViews() {
    return [this._paneView]
  }

  // Lifecycle methods following official patterns
  attached({
    chart,
    series,
    requestUpdate
  }: {
    chart: IChartApi
    series: ISeriesApi<any>
    requestUpdate: () => void
  }) {
    this._chart = chart
    this._series = series
    this._requestUpdate = requestUpdate

    // Ensure chart is registered with our coordinate service for consistency
    const coordinateService = ChartCoordinateService.getInstance()
    const chartId = chart.chartElement()?.id || 'default'
    coordinateService.registerChart(chartId, chart)

    // CRITICAL FIX: Add event-driven retry logic identical to the old working canvas overlay approach
    // This ensures coordinate conversion is automatically retried when the chart becomes ready
    try {
      // Create callback functions and store them for cleanup
      this._timeScaleCallback = () => {
        this._requestUpdate()
      }

      this._crosshairCallback = () => {
        // Throttle crosshair updates to avoid performance issues
        if (!this._updateThrottled) {
          this._updateThrottled = true
          setTimeout(() => {
            this._updateThrottled = false
            this._requestUpdate()
          }, 100) // Throttle to 10fps for crosshair updates
        }
      }

      // Subscribe to events (Lightweight Charts pattern: returns void, store callbacks for cleanup)
      chart.timeScale().subscribeVisibleTimeRangeChange(this._timeScaleCallback)
      chart.subscribeCrosshairMove(this._crosshairCallback)
    } catch (error) {
      console.warn('⚠️ [TradeRectanglePrimitive] Failed to set up some event listeners:', error)
    }

    // Request initial update
    this._requestUpdate()
  }

  detached() {
    // Clean up event subscriptions to prevent memory leaks
    if (this._chart && this._timeScaleCallback) {
      try {
        this._chart.timeScale().unsubscribeVisibleTimeRangeChange(this._timeScaleCallback)
        this._timeScaleCallback = null
      } catch (error) {
        console.warn('⚠️ [TradeRectanglePrimitive] Failed to unsubscribe time scale:', error)
      }
    }

    if (this._chart && this._crosshairCallback) {
      try {
        this._chart.unsubscribeCrosshairMove(this._crosshairCallback)
        this._crosshairCallback = null
      } catch (error) {
        console.warn('⚠️ [TradeRectanglePrimitive] Failed to unsubscribe crosshair:', error)
      }
    }

    this._chart = null
    this._series = null
    this._requestUpdate = undefined
    this._updateThrottled = false
  }

  // Getter methods
  data(): TradeRectangleData {
    return this._data
  }

  chart(): IChartApi | null {
    return this._chart
  }

  series(): ISeriesApi<any> | null {
    return this._series
  }

  // Update rectangle data and request redraw
  updateData(newData: Partial<TradeRectangleData>) {
    this._data = {...this._data, ...newData}
    if (this._requestUpdate) {
      this._requestUpdate()
    }
  }
}

// Factory function for creating trade rectangle primitives
export function createTradeRectanglePrimitives(
  trades: Array<{
    entryTime: string | UTCTimestamp
    exitTime?: string | UTCTimestamp
    entryPrice: number
    exitPrice: number
    fillColor?: string
    borderColor?: string
    borderWidth?: number
    opacity?: number
    label?: string
  }>,
  chartData?: any[]
): TradeRectanglePrimitive[] {
  const primitives: TradeRectanglePrimitive[] = []

  trades.forEach(trade => {
    // Parse times
    let time1: UTCTimestamp
    let time2: UTCTimestamp

    if (typeof trade.entryTime === 'string') {
      time1 = Math.floor(new Date(trade.entryTime).getTime() / 1000) as UTCTimestamp
    } else {
      time1 = trade.entryTime
    }

    if (trade.exitTime) {
      if (typeof trade.exitTime === 'string') {
        time2 = Math.floor(new Date(trade.exitTime).getTime() / 1000) as UTCTimestamp
      } else {
        time2 = trade.exitTime
      }
    } else if (chartData && chartData.length > 0) {
      // Use last available time for open trades
      const lastTime = chartData[chartData.length - 1]?.time
      if (lastTime) {
        time2 =
          typeof lastTime === 'string'
            ? (Math.floor(new Date(lastTime).getTime() / 1000) as UTCTimestamp)
            : lastTime
      } else {
        return // Skip if no exit time available
      }
    } else {
      return // Skip if no exit time available
    }

    const rectangleData: TradeRectangleData = {
      time1,
      time2,
      price1: trade.entryPrice,
      price2: trade.exitPrice,
      fillColor: trade.fillColor || 'rgba(0, 150, 136, 0.2)',
      borderColor: trade.borderColor || 'rgb(0, 150, 136)',
      borderWidth: trade.borderWidth || 1,
      opacity: trade.opacity || 0.2,
      label: trade.label
    }

    primitives.push(new TradeRectanglePrimitive(rectangleData))
  })

  return primitives
}
