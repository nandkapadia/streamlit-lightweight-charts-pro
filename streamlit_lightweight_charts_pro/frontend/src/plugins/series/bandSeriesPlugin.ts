import {
  IChartApi,
  ISeriesApi,
  LineData,
  Time,
  LineSeries,
  ISeriesPrimitive,
  SeriesAttachedParameter,
  IPrimitivePaneView,
  IPrimitivePaneRenderer,
  Coordinate
} from 'lightweight-charts'

// Band data interface
export interface BandData extends LineData {
  upper: number
  middle: number
  lower: number
}

// Line style options interface
export interface LineStyleOptions {
  color?: string
  lineStyle?: number
  lineWidth?: number
  lineVisible?: boolean
  lineType?: number
  crosshairMarkerVisible?: boolean
  crosshairMarkerRadius?: number
  crosshairMarkerBorderColor?: string
  crosshairMarkerBackgroundColor?: string
  crosshairMarkerBorderWidth?: number
  lastPriceAnimation?: number
}

// Band series options
export interface BandSeriesOptions {
  // Z-index for proper layering
  zIndex?: number

  // Line style options
  upperLine?: LineStyleOptions
  middleLine?: LineStyleOptions
  lowerLine?: LineStyleOptions

  // Fill colors
  upperFillColor: string
  lowerFillColor: string

  // Fill visibility
  upperFill: boolean
  lowerFill: boolean

  // Base options
  visible: boolean
  priceScaleId: string
  lastValueVisible: boolean
  priceLineVisible: boolean
  priceLineSource: string
  priceLineWidth: number
  priceLineColor: string
  priceLineStyle: number
  baseLineVisible: boolean
  baseLineWidth: number
  baseLineColor: string
  baseLineStyle: string
  priceFormat: any
}

// Default options
const defaultOptions: BandSeriesOptions = {
  // Line style options
  upperLine: {
    color: '#4CAF50',
    lineStyle: 0, // SOLID
    lineWidth: 2,
    lineVisible: true,
    lineType: 0, // SIMPLE
    crosshairMarkerVisible: true,
    crosshairMarkerRadius: 4,
    crosshairMarkerBorderColor: '',
    crosshairMarkerBackgroundColor: '',
    crosshairMarkerBorderWidth: 2,
    lastPriceAnimation: 0 // DISABLED
  },
  middleLine: {
    color: '#2196F3',
    lineStyle: 0, // SOLID
    lineWidth: 2,
    lineVisible: true,
    lineType: 0, // SIMPLE
    crosshairMarkerVisible: true,
    crosshairMarkerRadius: 4,
    crosshairMarkerBorderColor: '',
    crosshairMarkerBackgroundColor: '',
    crosshairMarkerBorderWidth: 2,
    lastPriceAnimation: 0 // DISABLED
  },
  lowerLine: {
    color: '#F44336',
    lineStyle: 0, // SOLID
    lineWidth: 2,
    lineVisible: true,
    lineType: 0, // SIMPLE
    crosshairMarkerVisible: true,
    crosshairMarkerRadius: 4,
    crosshairMarkerBorderColor: '',
    crosshairMarkerBackgroundColor: '',
    crosshairMarkerBorderWidth: 2,
    lastPriceAnimation: 0 // DISABLED
  },

  // Fill colors
  upperFillColor: 'rgba(76, 175, 80, 0.1)',
  lowerFillColor: 'rgba(244, 67, 54, 0.1)',

  // Fill visibility
  upperFill: true,
  lowerFill: true,

  // Base options
  visible: true,
  priceScaleId: 'right',
  lastValueVisible: false,
  priceLineVisible: true,
  priceLineSource: 'lastBar',
  priceLineWidth: 1,
  priceLineColor: '#2196F3',
  priceLineStyle: 2, // DASHED
  baseLineVisible: false,
  baseLineWidth: 1,
  baseLineColor: '#FF9800',
  baseLineStyle: 'solid',
  priceFormat: {type: 'price', precision: 2}
}

// Band renderer data interface
interface BandRendererData {
  x: Coordinate | number
  upper: Coordinate | number
  middle: Coordinate | number
  lower: Coordinate | number
}

// Band view data interface
interface BandViewData {
  data: BandRendererData[]
  options: BandSeriesOptions
}

// Band primitive pane renderer
class BandPrimitivePaneRenderer implements IPrimitivePaneRenderer {
  _viewData: BandViewData

  constructor(data: BandViewData) {
    this._viewData = data
  }

  draw() {}

  drawBackground(target: any) {
    // Apply Z-index context for proper layering
    const zIndex = this._viewData.options.zIndex || 0
    const points: BandRendererData[] = this._viewData.data
    if (points.length === 0) return

    target.useBitmapCoordinateSpace((scope: any) => {
      const ctx = scope.context
      ctx.scale(scope.horizontalPixelRatio, scope.verticalPixelRatio)

      // Set Z-index context for proper layering
      if (zIndex > 0) {
        // Apply Z-index through canvas context properties
        // This ensures the primitive renders at the correct layer
        ctx.globalCompositeOperation = 'source-over'
        ctx.globalAlpha = 1.0

        // Store Z-index in canvas context for potential use by other renderers
        ;(ctx as any).__zIndex = zIndex
      }

      // Draw upper fill area (between upper and middle) only if enabled
      if (
        this._viewData.options.upperFill &&
        this._viewData.options.upperFillColor !== 'rgba(0, 0, 0, 0)'
      ) {
        ctx.fillStyle = this._viewData.options.upperFillColor
        ctx.beginPath()
        ctx.moveTo(points[0].x, points[0].upper)
        for (const point of points) {
          ctx.lineTo(point.x, point.upper)
        }
        for (let i = points.length - 1; i >= 0; i--) {
          ctx.lineTo(points[i].x, points[i].middle)
        }
        ctx.closePath()
        ctx.fill()
      }

      // Draw lower fill area (between middle and lower) only if enabled
      if (
        this._viewData.options.lowerFill &&
        this._viewData.options.lowerFillColor !== 'rgba(0, 0, 0, 0)'
      ) {
        ctx.fillStyle = this._viewData.options.lowerFillColor
        ctx.beginPath()
        ctx.moveTo(points[0].x, points[0].middle)
        for (const point of points) {
          ctx.lineTo(point.x, point.middle)
        }
        for (let i = points.length - 1; i >= 0; i--) {
          ctx.lineTo(points[i].x, points[i].lower)
        }
        ctx.closePath()
        ctx.fill()
      }
    })
  }
}

// Band primitive pane view
class BandPrimitivePaneView implements IPrimitivePaneView {
  _source: BandSeries
  _data: BandViewData

  constructor(source: BandSeries) {
    this._source = source
    this._data = {
      data: [],
      options: this._source.getOptions()
    }
  }

  update() {
    const timeScale = this._source.getChart().timeScale()
    this._data.data = this._source.getData().map(d => {
      return {
        x: timeScale.timeToCoordinate(d.time) ?? -100,
        upper: this._source.getUpperSeries().priceToCoordinate(d.upper) ?? -100,
        middle: this._source.getMiddleSeries().priceToCoordinate(d.middle) ?? -100,
        lower: this._source.getLowerSeries().priceToCoordinate(d.lower) ?? -100
      }
    })
  }

  renderer() {
    return new BandPrimitivePaneRenderer(this._data)
  }

  // Z-index support: Return the Z-index for proper layering
  zIndex(): number {
    const sourceZIndex = this._source.getOptions().zIndex
    // Validate Z-index is a positive number
    if (typeof sourceZIndex === 'number' && sourceZIndex >= 0) {
      return sourceZIndex
    }
    // Return default Z-index for band series
    return 100
  }
}

// Band series class
export class BandSeries implements ISeriesPrimitive<Time> {
  private chart: IChartApi
  private upperSeries: ISeriesApi<'Line'>
  private middleSeries: ISeriesApi<'Line'>
  private lowerSeries: ISeriesApi<'Line'>
  private options: BandSeriesOptions
  private data: BandData[] = []
  private _paneViews: BandPrimitivePaneView[]

  constructor(chart: IChartApi, options: Partial<BandSeriesOptions> = {}) {
    this.chart = chart
    this.options = {...defaultOptions, ...options}
    this._paneViews = [new BandPrimitivePaneView(this)]

    // Create the three line series
    this.upperSeries = chart.addSeries(LineSeries, {
      color: this.options.upperLine?.color || '#4CAF50',
      lineStyle: this.options.upperLine?.lineStyle || 0,
      lineWidth: (this.options.upperLine?.lineWidth || 2) as any,
      visible: this.options.upperLine?.lineVisible !== false,
      priceScaleId: this.options.priceScaleId,
      lastValueVisible: this.options.lastValueVisible,
      priceLineVisible: this.options.priceLineVisible,
      priceLineSource: this.options.priceLineSource as any,
      priceLineWidth: this.options.priceLineWidth as any,
      priceLineColor: this.options.priceLineColor,
      priceLineStyle: this.options.priceLineStyle as any,
      baseLineVisible: this.options.baseLineVisible,
      baseLineWidth: this.options.baseLineWidth as any,
      baseLineColor: this.options.baseLineColor,
      baseLineStyle: this.options.baseLineStyle as any,
      priceFormat: this.options.priceFormat,
      crosshairMarkerVisible: this.options.upperLine?.crosshairMarkerVisible !== false,
      crosshairMarkerRadius: this.options.upperLine?.crosshairMarkerRadius || 4,
      crosshairMarkerBorderColor: this.options.upperLine?.crosshairMarkerBorderColor || '',
      crosshairMarkerBackgroundColor: this.options.upperLine?.crosshairMarkerBackgroundColor || '',
      crosshairMarkerBorderWidth: this.options.upperLine?.crosshairMarkerBorderWidth || 2,
      lastPriceAnimation: this.options.upperLine?.lastPriceAnimation || 0,
      lineType: this.options.upperLine?.lineType || 0
    })

    this.middleSeries = chart.addSeries(LineSeries, {
      color: this.options.middleLine?.color || '#2196F3',
      lineStyle: this.options.middleLine?.lineStyle || 0,
      lineWidth: (this.options.middleLine?.lineWidth || 2) as any,
      visible: this.options.middleLine?.lineVisible !== false,
      priceScaleId: this.options.priceScaleId,
      lastValueVisible: this.options.lastValueVisible,
      priceLineVisible: this.options.priceLineVisible,
      priceLineSource: this.options.priceLineSource as any,
      priceLineWidth: this.options.priceLineWidth as any,
      priceLineColor: this.options.priceLineColor,
      priceLineStyle: this.options.priceLineStyle as any,
      baseLineVisible: this.options.baseLineVisible,
      baseLineWidth: this.options.baseLineWidth as any,
      baseLineColor: this.options.baseLineColor,
      baseLineStyle: this.options.baseLineStyle as any,
      priceFormat: this.options.priceFormat,
      crosshairMarkerVisible: this.options.middleLine?.crosshairMarkerVisible !== false,
      crosshairMarkerRadius: this.options.middleLine?.crosshairMarkerRadius || 4,
      crosshairMarkerBorderColor: this.options.middleLine?.crosshairMarkerBorderColor || '',
      crosshairMarkerBackgroundColor: this.options.middleLine?.crosshairMarkerBackgroundColor || '',
      crosshairMarkerBorderWidth: this.options.middleLine?.crosshairMarkerBorderWidth || 2,
      lastPriceAnimation: this.options.middleLine?.lastPriceAnimation || 0,
      lineType: this.options.middleLine?.lineType || 0
    })

    this.lowerSeries = chart.addSeries(LineSeries, {
      color: this.options.lowerLine?.color || '#F44336',
      lineStyle: this.options.lowerLine?.lineStyle || 0,
      lineWidth: (this.options.lowerLine?.lineWidth || 2) as any,
      visible: this.options.lowerLine?.lineVisible !== false,
      priceScaleId: this.options.priceScaleId,
      lastValueVisible: this.options.lastValueVisible,
      priceLineVisible: this.options.priceLineVisible,
      priceLineSource: this.options.priceLineSource as any,
      priceLineWidth: this.options.priceLineWidth as any,
      priceLineColor: this.options.priceLineColor,
      priceLineStyle: this.options.priceLineStyle as any,
      baseLineVisible: this.options.baseLineVisible,
      baseLineWidth: this.options.baseLineWidth as any,
      baseLineColor: this.options.baseLineColor,
      baseLineStyle: this.options.baseLineStyle as any,
      priceFormat: this.options.priceFormat,
      crosshairMarkerVisible: this.options.lowerLine?.crosshairMarkerVisible !== false,
      crosshairMarkerRadius: this.options.lowerLine?.crosshairMarkerRadius || 4,
      crosshairMarkerBorderColor: this.options.lowerLine?.crosshairMarkerBorderColor || '',
      crosshairMarkerBackgroundColor: this.options.lowerLine?.crosshairMarkerBackgroundColor || '',
      crosshairMarkerBorderWidth: this.options.lowerLine?.crosshairMarkerBorderWidth || 2,
      lastPriceAnimation: this.options.lowerLine?.lastPriceAnimation || 0,
      lineType: this.options.lowerLine?.lineType || 0
    })

    // Attach the primitive to the middle series for rendering
    this.middleSeries.attachPrimitive(this)

    // Z-index is handled through the primitive system
    // The primitive's zIndex() method will return the configured Z-index
    if (this.options.zIndex !== undefined) {
    }
  }

  // Getter for options
  getOptions(): BandSeriesOptions {
    return this.options
  }

  // Getter for data
  getData(): BandData[] {
    return this.data
  }

  // Getter for chart
  getChart(): IChartApi {
    return this.chart
  }

  // Getter for series
  getUpperSeries(): ISeriesApi<'Line'> {
    return this.upperSeries
  }

  getMiddleSeries(): ISeriesApi<'Line'> {
    return this.middleSeries
  }

  getLowerSeries(): ISeriesApi<'Line'> {
    return this.lowerSeries
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

  setData(data: BandData[]): void {
    this.data = data

    // Extract individual series data
    const upperData: LineData[] = data.map(item => ({
      time: item.time,
      value: item.upper
    }))

    const middleData: LineData[] = data.map(item => ({
      time: item.time,
      value: item.middle
    }))

    const lowerData: LineData[] = data.map(item => ({
      time: item.time,
      value: item.lower
    }))

    // Set data for each series
    this.upperSeries.setData(upperData)
    this.middleSeries.setData(middleData)
    this.lowerSeries.setData(lowerData)

    // Update the primitive view
    this.updateAllViews()
  }

  update(data: BandData): void {
    // Update individual series
    this.upperSeries.update({time: data.time, value: data.upper})
    this.middleSeries.update({time: data.time, value: data.middle})
    this.lowerSeries.update({time: data.time, value: data.lower})

    // Update the primitive view
    this.updateAllViews()
  }

  setVisible(visible: boolean): void {
    this.upperSeries.applyOptions({visible})
    this.middleSeries.applyOptions({visible})
    this.lowerSeries.applyOptions({visible})
  }

  setOptions(options: Partial<BandSeriesOptions>): void {
    this.options = {...this.options, ...options}

    // Z-index updates are handled through the primitive system
    if (options.zIndex !== undefined) {
    }

    // Update line series options
    if (options.upperLine !== undefined) {
      this.upperSeries.applyOptions({
        color: options.upperLine.color,
        lineStyle: options.upperLine.lineStyle,
        lineWidth: options.upperLine.lineWidth as any,
        visible: options.upperLine.lineVisible,
        lineType: options.upperLine.lineType,
        crosshairMarkerVisible: options.upperLine.crosshairMarkerVisible,
        crosshairMarkerRadius: options.upperLine.crosshairMarkerRadius,
        crosshairMarkerBorderColor: options.upperLine.crosshairMarkerBorderColor,
        crosshairMarkerBackgroundColor: options.upperLine.crosshairMarkerBackgroundColor,
        crosshairMarkerBorderWidth: options.upperLine.crosshairMarkerBorderWidth,
        lastPriceAnimation: options.upperLine.lastPriceAnimation
      })
    }

    if (options.middleLine !== undefined) {
      this.middleSeries.applyOptions({
        color: options.middleLine.color,
        lineStyle: options.middleLine.lineStyle,
        lineWidth: options.middleLine.lineWidth as any,
        visible: options.middleLine.lineVisible,
        lineType: options.middleLine.lineType,
        crosshairMarkerVisible: options.middleLine.crosshairMarkerVisible,
        crosshairMarkerRadius: options.middleLine.crosshairMarkerRadius,
        crosshairMarkerBorderColor: options.middleLine.crosshairMarkerBorderColor,
        crosshairMarkerBackgroundColor: options.middleLine.crosshairMarkerBackgroundColor,
        crosshairMarkerBorderWidth: options.middleLine.crosshairMarkerBorderWidth,
        lastPriceAnimation: options.middleLine.lastPriceAnimation
      })
    }

    if (options.lowerLine !== undefined) {
      this.lowerSeries.applyOptions({
        color: options.lowerLine.color,
        lineStyle: options.lowerLine.lineStyle,
        lineWidth: options.lowerLine.lineWidth as any,
        visible: options.lowerLine.lineVisible,
        lineType: options.lowerLine.lineType,
        crosshairMarkerVisible: options.lowerLine.crosshairMarkerVisible,
        crosshairMarkerRadius: options.lowerLine.crosshairMarkerRadius,
        crosshairMarkerBorderColor: options.lowerLine.crosshairMarkerBorderColor,
        crosshairMarkerBackgroundColor: options.lowerLine.crosshairMarkerBackgroundColor,
        crosshairMarkerBorderWidth: options.lowerLine.crosshairMarkerBorderWidth,
        lastPriceAnimation: options.lowerLine.lastPriceAnimation
      })
    }

    // Update the primitive view
    this.updateAllViews()
  }

  remove(): void {
    this.chart.removeSeries(this.upperSeries)
    this.chart.removeSeries(this.middleSeries)
    this.chart.removeSeries(this.lowerSeries)
  }

  to_frontend_config(): any {
    return {
      type: 'band',
      data: this.data,
      options: this.options
    }
  }
}

// Plugin factory function
export function createBandSeries(
  chart: IChartApi,
  options: Partial<BandSeriesOptions> = {}
): BandSeries {
  return new BandSeries(chart, options)
}
