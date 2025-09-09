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

// Ribbon data interface
export interface RibbonData extends LineData {
  upper: number
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

// Ribbon series options
export interface RibbonSeriesOptions {
  // Z-index for proper layering
  zIndex?: number

  // Line style options
  upperLine?: LineStyleOptions
  lowerLine?: LineStyleOptions

  // Fill options
  fill: string
  fillVisible: boolean

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
const defaultOptions: RibbonSeriesOptions = {
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

  // Fill options
  fill: 'rgba(76, 175, 80, 0.1)',
  fillVisible: true,

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

// Ribbon renderer data interface
interface RibbonRendererData {
  x: Coordinate | number
  upper: Coordinate | number
  lower: Coordinate | number
}

// Ribbon view data interface
interface RibbonViewData {
  data: RibbonRendererData[]
  options: RibbonSeriesOptions
}

// Ribbon primitive pane renderer
class RibbonPrimitivePaneRenderer implements IPrimitivePaneRenderer {
  _viewData: RibbonViewData

  constructor(data: RibbonViewData) {
    this._viewData = data
  }

  draw() {}

  drawBackground(target: any) {
    const points: RibbonRendererData[] = this._viewData.data

    if (points.length === 0) {
      return
    }

    target.useBitmapCoordinateSpace((scope: any) => {
      const ctx = scope.context
      ctx.scale(scope.horizontalPixelRatio, scope.verticalPixelRatio)

      // Draw fill area between upper and lower bands only if enabled
      if (this._viewData.options.fillVisible) {
        ctx.fillStyle = this._viewData.options.fill
        ctx.beginPath()

        // Draw upper line forward
        ctx.moveTo(points[0].x, points[0].upper)
        for (const point of points) {
          if (point.upper !== null && point.lower !== null) {
            ctx.lineTo(point.x, point.upper)
          }
        }

        // Draw lower line backward
        for (let i = points.length - 1; i >= 0; i--) {
          const point = points[i]
          if (point.upper !== null && point.lower !== null) {
            ctx.lineTo(point.x, point.lower)
          }
        }

        ctx.closePath()
        ctx.fill()
      } else {
      }
    })
  }
}

// Ribbon primitive pane view
class RibbonPrimitivePaneView implements IPrimitivePaneView {
  _source: RibbonSeries
  _data: RibbonViewData

  constructor(source: RibbonSeries) {
    this._source = source
    this._data = {
      data: [],
      options: this._source.getOptions()
    }
  }

  update() {
    const timeScale = this._source.getChart().timeScale()

    // Get the actual rendered coordinates from the series
    // This ensures compatibility with all line types (SIMPLE, STEPPED, CURVED)
    this._data.data = this._source.getData().map(d => {
      return {
        x: timeScale.timeToCoordinate(d.time) ?? -100,
        // Use the series' actual rendered coordinates for proper line type support
        upper: this._source.getUpperSeries().priceToCoordinate(d.upper) ?? -100,
        lower: this._source.getLowerSeries().priceToCoordinate(d.lower) ?? -100
      }
    })
  }

  renderer() {
    return new RibbonPrimitivePaneRenderer(this._data)
  }

  // Z-index support: Return the Z-index for proper layering
  zIndex(): number {
    const sourceZIndex = this._source.getOptions().zIndex
    // Validate Z-index is a positive number
    if (typeof sourceZIndex === 'number' && sourceZIndex >= 0) {
      return sourceZIndex
    }
    // Return default Z-index for ribbon series
    return 100
  }
}

// Ribbon series class - follows working band series pattern
export class RibbonSeries implements ISeriesPrimitive<Time> {
  private chart: IChartApi
  private upperSeries: ISeriesApi<'Line'>
  private lowerSeries: ISeriesApi<'Line'>
  private options: RibbonSeriesOptions
  private data: RibbonData[] = []
  private _paneViews: RibbonPrimitivePaneView[]

  constructor(chart: IChartApi, options: Partial<RibbonSeriesOptions> = {}) {
    this.chart = chart
    this.options = {...defaultOptions, ...options}
    this._paneViews = [new RibbonPrimitivePaneView(this)]

    // Create the two line series (upper and lower)
    this.upperSeries = chart.addSeries(LineSeries, {
      color: this.options.upperLine?.color || '#4CAF50',
      lineStyle: this.options.upperLine?.lineStyle || 0,
      lineWidth: (this.options.upperLine?.lineWidth || 2) as any,
      visible: this.options.upperLine?.lineVisible !== false,
      priceScaleId: this.options.priceScaleId,
      lastValueVisible: this.options.lastValueVisible,
      priceLineVisible: this.options.priceLineVisible,
      priceLineSource: this.options.priceLineSource as any,
      priceLineWidth: (this.options.priceLineWidth || 1) as any,
      priceLineColor: this.options.priceLineColor,
      priceLineStyle: (this.options.priceLineStyle || 2) as any,
      baseLineVisible: this.options.baseLineVisible,
      baseLineWidth: (this.options.baseLineWidth || 1) as any,
      baseLineColor: this.options.baseLineColor,
      baseLineStyle: (this.options.baseLineStyle || 'solid') as any,
      priceFormat: this.options.priceFormat,
      crosshairMarkerVisible: this.options.upperLine?.crosshairMarkerVisible !== false,
      crosshairMarkerRadius: this.options.upperLine?.crosshairMarkerRadius || 4,
      crosshairMarkerBorderColor: this.options.upperLine?.crosshairMarkerBorderColor || '',
      crosshairMarkerBackgroundColor: this.options.upperLine?.crosshairMarkerBackgroundColor || '',
      crosshairMarkerBorderWidth: this.options.upperLine?.crosshairMarkerBorderWidth || 2,
      lastPriceAnimation: this.options.upperLine?.lastPriceAnimation || 0,
      lineType: this.options.upperLine?.lineType || 0
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
      priceLineWidth: (this.options.priceLineWidth || 1) as any,
      priceLineColor: this.options.priceLineColor,
      priceLineStyle: (this.options.priceLineStyle || 2) as any,
      baseLineVisible: this.options.baseLineVisible,
      baseLineWidth: (this.options.baseLineWidth || 1) as any,
      baseLineColor: this.options.baseLineColor,
      baseLineStyle: (this.options.baseLineStyle || 'solid') as any,
      priceFormat: this.options.priceFormat,
      crosshairMarkerVisible: this.options.lowerLine?.crosshairMarkerVisible !== false,
      crosshairMarkerRadius: this.options.lowerLine?.crosshairMarkerRadius || 4,
      crosshairMarkerBorderColor: this.options.lowerLine?.crosshairMarkerBorderColor || '',
      crosshairMarkerBackgroundColor: this.options.lowerLine?.crosshairMarkerBackgroundColor || '',
      crosshairMarkerBorderWidth: this.options.lowerLine?.crosshairMarkerBorderWidth || 2,
      lastPriceAnimation: this.options.lowerLine?.lastPriceAnimation || 0,
      lineType: this.options.lowerLine?.lineType || 0
    })

    // Attach the primitive to the upper series for rendering
    this.upperSeries.attachPrimitive(this)
  }

  // Getter for options
  getOptions(): RibbonSeriesOptions {
    return this.options
  }

  // Getter for data
  getData(): RibbonData[] {
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

  setData(data: RibbonData[]): void {
    this.data = data

    // Extract individual series data
    const upperData: LineData[] = data.map(item => ({
      time: item.time,
      value: item.upper
    }))

    const lowerData: LineData[] = data.map(item => ({
      time: item.time,
      value: item.lower
    }))

    // Set data for each series
    this.upperSeries.setData(upperData)
    this.lowerSeries.setData(lowerData)

    // Update the primitive view
    this.updateAllViews()
  }

  update(data: RibbonData): void {
    // Update individual series
    this.upperSeries.update({time: data.time, value: data.upper})
    this.lowerSeries.update({time: data.time, value: data.lower})

    // Update the primitive view
    this.updateAllViews()
  }

  setVisible(visible: boolean): void {
    this.upperSeries.applyOptions({visible})
    this.lowerSeries.applyOptions({visible})
  }

  setOptions(options: Partial<RibbonSeriesOptions>): void {
    this.options = {...this.options, ...options}

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

    if (options.lowerLine !== undefined) {
      this.lowerSeries.applyOptions({
        color: options.lowerLine.color,
        lineStyle: options.lowerLine.lineStyle,
        lineWidth: options.lowerLine.lineWidth as any,
        visible: options.lowerLine.lineVisible,
        lineType: 0, // Always force SIMPLE for fill compatibility
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
    this.chart.removeSeries(this.lowerSeries)
  }
}

// Plugin factory function
export function createRibbonSeries(
  chart: IChartApi,
  options: Partial<RibbonSeriesOptions> = {}
): RibbonSeries {
  return new RibbonSeries(chart, options)
}

// Plugin function
export function ribbonSeriesPlugin(): (chart: IChartApi) => void {
  return (chart: IChartApi) => {
    // Plugin initialization if needed
  }
}
