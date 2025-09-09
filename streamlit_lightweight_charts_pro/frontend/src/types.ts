import {Time, SeriesMarker} from 'lightweight-charts'

// Enhanced Trade Configuration
export interface TradeConfig {
  entryTime: string | number
  entryPrice: number
  exitTime: string | number
  exitPrice: number
  quantity: number
  tradeType: 'long' | 'short'
  id?: string
  notes?: string
  text?: string // Custom tooltip text
  pnl?: number
  pnlPercentage?: number
  isProfitable?: boolean
}

// Trade Visualization Options
export interface TradeVisualizationOptions {
  style: 'markers' | 'rectangles' | 'both' | 'lines' | 'arrows' | 'zones'

  // Marker options
  entryMarkerColorLong?: string
  entryMarkerColorShort?: string
  exitMarkerColorProfit?: string
  exitMarkerColorLoss?: string
  markerSize?: number
  showPnlInMarkers?: boolean

  // Rectangle options
  rectangleFillOpacity?: number
  rectangleBorderWidth?: number
  rectangleColorProfit?: string
  rectangleColorLoss?: string
  rectangleShowText?: boolean
  rectangleTextPosition?: 'inside' | 'above' | 'below'
  rectangleTextFontSize?: number
  rectangleTextColor?: string
  rectangleTextBackground?: string

  // Line options
  lineWidth?: number
  lineStyle?: string
  lineColorProfit?: string
  lineColorLoss?: string

  // Arrow options
  arrowSize?: number
  arrowColorProfit?: string
  arrowColorLoss?: string

  // Zone options
  zoneOpacity?: number
  zoneColorLong?: string
  zoneColorShort?: string
  zoneExtendBars?: number

  // Annotation options
  showTradeId?: boolean
  showQuantity?: boolean
  showTradeType?: boolean
  showAnnotations?: boolean
  annotationFontSize?: number
  annotationBackground?: string
}

// Annotation System
export interface Annotation {
  time: string
  price: number
  text: string
  type: 'text' | 'arrow' | 'shape' | 'line' | 'rectangle' | 'circle'
  position: 'above' | 'below' | 'inline'
  color?: string
  backgroundColor?: string
  fontSize?: number
  fontWeight?: string
  textColor?: string
  borderColor?: string
  borderWidth?: number
  opacity?: number
  showTime?: boolean
  tooltip?: string
  lineStyle?: string // <-- added for build fix
}

export interface AnnotationLayer {
  name: string
  visible: boolean
  opacity: number
  annotations: Annotation[]
}

export interface AnnotationManager {
  layers: {[key: string]: AnnotationLayer}
}

// Pane Height Configuration
export interface PaneHeightOptions {
  factor: number
}

// Pane Collapse Configuration
export interface PaneCollapseConfig {
  enabled?: boolean // Defaults to true - set to false to disable
  buttonSize?: number
  buttonColor?: string
  buttonHoverColor?: string
  buttonBackground?: string
  buttonHoverBackground?: string
  buttonBorderRadius?: number
  zIndex?: number // Z-index for button positioning
  showTooltip?: boolean
  tooltipText?: {
    collapse?: string
    expand?: string
  }
  legendConfig?: any // Legend configuration for this pane
  onPaneCollapse?: (paneId: number, isCollapsed: boolean) => void
  onPaneExpand?: (paneId: number, isCollapsed: boolean) => void
}

// Signal Series Configuration
export interface SignalData {
  time: string
  value: number
}

// Line Options Configuration
export interface LineOptions {
  color?: string
  lineStyle?: number
  lineWidth?: number
  lineType?: number
  lineVisible?: boolean
  pointMarkersVisible?: boolean
  pointMarkersRadius?: number
  crosshairMarkerVisible?: boolean
  crosshairMarkerRadius?: number
  crosshairMarkerBorderColor?: string
  crosshairMarkerBackgroundColor?: string
  crosshairMarkerBorderWidth?: number
  lastPriceAnimation?: number
}

// Enhanced Series Configuration
export interface SeriesConfig {
  type:
    | 'Area'
    | 'Band'
    | 'Baseline'
    | 'Histogram'
    | 'Line'
    | 'Bar'
    | 'Candlestick'
    | 'signal'
    | 'trend_fill'
    | 'ribbon'
  data: any[]
  options?: any
  name?: string
  priceScale?: any
  priceScaleId?: string // Add priceScaleId support for overlay price scales
  lastValueVisible?: boolean // Add lastValueVisible support for series
  lastPriceAnimation?: number // Add lastPriceAnimation support for series
  markers?: SeriesMarker<Time>[]
  priceLines?: any[] // Add price lines to series
  trades?: TradeConfig[] // Add trades to series
  tradeVisualizationOptions?: TradeVisualizationOptions
  annotations?: Annotation[] // Add annotations to series
  shapes?: any[] // Add shapes support
  tooltip?: TooltipConfig // Add tooltip configuration
  legend?: LegendConfig | null // Add series-level legend support
  paneId?: number // Add support for multi-pane charts
  // Signal series support
  signalData?: SignalData[]

  // Line options support
  lineOptions?: LineOptions
  // Line series specific options (for backward compatibility)
  lineStyle?: number
  lineType?: number
  lineVisible?: boolean
  pointMarkersVisible?: boolean
  pointMarkersRadius?: number
  crosshairMarkerVisible?: boolean
  crosshairMarkerRadius?: number
  crosshairMarkerBorderColor?: string
  crosshairMarkerBackgroundColor?: string
  crosshairMarkerBorderWidth?: number
  // Area series specific options
  relativeGradient?: boolean
  invertFilledArea?: boolean
  // Price line properties
  priceLineVisible?: boolean
  priceLineSource?: 'lastBar' | 'lastVisible'
  priceLineWidth?: number
  priceLineColor?: string
  priceLineStyle?: number
}

// Chart Position Configuration
export interface ChartPosition {
  x?: number | string // CSS position: left value (px or %)
  y?: number | string // CSS position: top value (px or %)
  width?: number | string // CSS width (px or %)
  height?: number | string // CSS height (px or %)
  zIndex?: number // CSS z-index
  position?: 'absolute' | 'relative' | 'fixed' | 'static' // CSS position type
  display?: 'block' | 'inline-block' | 'flex' | 'grid' // CSS display type
  margin?: string // CSS margin shorthand
  padding?: string // CSS padding shorthand
  border?: string // CSS border shorthand
  borderRadius?: string // CSS border-radius
  boxShadow?: string // CSS box-shadow
  backgroundColor?: string // CSS background-color
}

// Enhanced Chart Configuration
export interface ChartConfig {
  chart: any
  series: SeriesConfig[]
  priceLines?: any[]
  trades?: TradeConfig[]
  annotations?: Annotation[] // Add chart-level annotations
  annotationLayers?: AnnotationLayer[] // Add layer management
  chartId?: string
  chartGroupId?: number // Add chart group ID for synchronization
  containerId?: string // Add containerId for DOM element identification
  chartOptions?: any // Add chartOptions for processed chart configuration
  rangeSwitcher?: RangeSwitcherConfig
  tooltip?: TooltipConfig // Add chart-level tooltip configuration
  tooltipConfigs?: Record<string, TooltipConfig> // Add multiple tooltip configurations
  tradeVisualizationOptions?: TradeVisualizationOptions // Add chart-level trade visualization options
  paneCollapse?: PaneCollapseConfig // Add pane collapse/expand functionality
  autoSize?: boolean
  autoWidth?: boolean
  autoHeight?: boolean
  minWidth?: number
  minHeight?: number
  maxWidth?: number
  maxHeight?: number
  position?: ChartPosition // Add positioning configuration
  // paneHeights is now accessed from chart.layout.paneHeights
}

// Range Switcher Configuration
export interface RangeConfig {
  label: string
  seconds: number | null
}

export interface RangeSwitcherConfig {
  ranges: RangeConfig[]
  position: string
  visible: boolean
  defaultRange?: string
}

// Legend Configuration
export interface LegendConfig {
  visible?: boolean
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  symbolName?: string
  textColor?: string
  backgroundColor?: string
  borderColor?: string
  borderWidth?: number
  borderRadius?: number
  padding?: number
  margin?: number
  zIndex?: number
  priceFormat?: string
  text?: string
  width?: number
  height?: number
  showValues?: boolean
  valueFormat?: string
  updateOnCrosshair?: boolean
}

// Sync Configuration
export interface SyncConfig {
  enabled: boolean
  crosshair: boolean
  timeRange: boolean
  groups?: {[groupId: string]: SyncConfig} // Group-specific sync configurations
}

// Component Configuration
export interface ComponentConfig {
  charts: ChartConfig[]
  syncConfig: SyncConfig
  callbacks?: string[]
}

// Modular Tooltip System
export interface TooltipField {
  label: string
  valueKey: string
  formatter?: (value: any) => string
  color?: string
  fontSize?: number
  fontWeight?: string
}

export interface TooltipConfig {
  enabled: boolean
  type: 'ohlc' | 'single' | 'multi' | 'custom'
  fields: TooltipField[]
  position?: 'cursor' | 'fixed' | 'auto'
  offset?: {x: number; y: number}
  style?: {
    backgroundColor?: string
    borderColor?: string
    borderWidth?: number
    borderRadius?: number
    padding?: number
    fontSize?: number
    fontFamily?: string
    color?: string
    boxShadow?: string
    zIndex?: number
  }
  showDate?: boolean
  dateFormat?: string
  showTime?: boolean
  timeFormat?: string
}

// Extend Window interface for chart plugins
declare global {
  interface Window {
    chartPlugins?: Map<any, any>
  }
}
