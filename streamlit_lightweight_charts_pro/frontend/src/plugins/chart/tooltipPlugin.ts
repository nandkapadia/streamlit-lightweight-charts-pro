/**
 * Tooltip Plugin for Lightweight Charts
 *
 * This plugin provides comprehensive tooltip functionality with support for:
 * - Dynamic content using placeholders
 * - Multiple tooltip types (OHLC, single, multi, custom, trade, marker)
 * - Flexible positioning and styling
 * - Real-time data substitution
 * - Integration with ChartCoordinateService and PositioningEngine
 */

import {IChartApi, ISeriesApi, SeriesType, Time} from 'lightweight-charts'
import {ChartCoordinateService} from '../../services/ChartCoordinateService'
import {PositioningEngine} from '../../services/PositioningEngine'

export interface TooltipField {
  label: string
  valueKey: string
  color?: string
  fontSize?: number
  fontWeight?: string
  prefix?: string
  suffix?: string
  precision?: number
}

export interface TooltipStyle {
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

export interface TooltipConfig {
  enabled: boolean
  type: 'ohlc' | 'single' | 'multi' | 'custom' | 'trade' | 'marker'
  template?: string
  fields: TooltipField[]
  position?: 'cursor' | 'fixed' | 'auto'
  offset?: {x: number; y: number}
  style?: TooltipStyle
  showDate?: boolean
  dateFormat?: string
  showTime?: boolean
  timeFormat?: string
  // Add trade-specific configuration
  tradeData?: {
    entryPrice: string
    exitPrice: string
    size: string
    pnl: string
    side: string
  }
}

export interface TooltipData {
  time: Time
  series: ISeriesApi<SeriesType>
  data: any
  price: number
  index: number
  // Add trade-specific data
  trade?: {
    entryPrice: number
    exitPrice: number
    size: number
    pnl: number
    side: 'long' | 'short'
    entryTime: Time
    exitTime: Time
  }
}

export class TooltipPlugin {
  private chart: IChartApi
  private container: HTMLElement
  private tooltipElement: HTMLElement | null = null
  private configs: Map<string, TooltipConfig> = new Map()
  private currentData: TooltipData | null = null
  private isVisible = false
  private chartId: string
  private coordinateService: ChartCoordinateService
  private tradeData: Map<string, any> = new Map() // Store trade data for detection

  constructor(chart: IChartApi, container: HTMLElement, chartId: string) {
    this.chart = chart
    this.container = container
    this.chartId = chartId
    this.coordinateService = ChartCoordinateService.getInstance()

    // Register chart with coordinate service
    this.coordinateService.registerChart(this.chartId, this.chart)

    this.setupEventListeners()
  }

  // Public methods for testing and external use
  public updateContent(content: string): void {
    if (this.tooltipElement) {
      this.tooltipElement.innerHTML = content
    }
  }

  public setPosition(position: {x: number; y: number}): void {
    this.positionTooltip(position)
  }

  public formatSeriesData(seriesData: Map<string, any>): string {
    if (!seriesData || seriesData.size === 0) {
      return ''
    }

    let content = ''
    seriesData.forEach((data, seriesName) => {
      content += `<div>${seriesName}: ${JSON.stringify(data)}</div>`
    })
    return content
  }

  public formatPrice(price: number): string {
    return price.toFixed(2)
  }

  public handleMouseEnter(event: MouseEvent): void {
    // Handle mouse enter events
  }

  public handleMouseLeave(event: MouseEvent): void {
    this.hideTooltip()
  }

  public handleMouseMove(event: MouseEvent): void {
    // Handle mouse move events
  }

  public constrainToViewport(position: {x: number; y: number}): {x: number; y: number} {
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    }

    return {
      x: Math.min(Math.max(position.x, 0), viewport.width - 200),
      y: Math.min(Math.max(position.y, 0), viewport.height - 100)
    }
  }

  public getAbsolutePosition(containerPosition: {x: number; y: number}): {x: number; y: number} {
    const containerRect = this.container.getBoundingClientRect()
    return {
      x: containerRect.left + containerPosition.x,
      y: containerRect.top + containerPosition.y
    }
  }

  public cleanup(): void {
    this.hideTooltip()
    if (this.tooltipElement && this.tooltipElement.parentNode) {
      this.tooltipElement.parentNode.removeChild(this.tooltipElement)
    }
  }

  public remove(): void {
    this.cleanup()
  }

  public addToChart(chart: IChartApi, container: HTMLElement): void {
    // This method exists for compatibility with tests
    // The actual setup is done in the constructor
  }

  /**
   * Add tooltip configuration
   */
  addConfig(name: string, config: TooltipConfig): void {
    this.configs.set(name, config)
  }

  /**
   * Remove tooltip configuration
   */
  removeConfig(name: string): boolean {
    return this.configs.delete(name)
  }

  /**
   * Get tooltip configuration
   */
  getConfig(name: string): TooltipConfig | undefined {
    return this.configs.get(name)
  }

  /**
   * Add trade data for tooltip detection
   */
  addTradeData(tradeId: string, tradeInfo: any): void {
    this.tradeData.set(tradeId, tradeInfo)
  }

  /**
   * Remove trade data
   */
  removeTradeData(tradeId: string): boolean {
    return this.tradeData.delete(tradeId)
  }

  /**
   * Setup event listeners for tooltip functionality
   */
  private setupEventListeners(): void {
    // Subscribe to crosshair move events
    if (this.chart && typeof this.chart.subscribeCrosshairMove === 'function') {
      this.chart.subscribeCrosshairMove(param => {
        if (param.time && param.seriesData.size > 0) {
          this.handleCrosshairMove(param)
        } else {
          this.hideTooltip()
        }
      })
    }

    // Subscribe to chart click events to hide tooltip
    if (this.chart && typeof this.chart.subscribeClick === 'function') {
      this.chart.subscribeClick(() => {
        this.hideTooltip()
      })
    }
  }

  /**
   * Enhanced crosshair move handler with trade detection
   */
  private handleCrosshairMove(param: any): void {
    if (!this.isVisible) {
      return
    }

    // Check if we have valid series data (mouse is over a candle)
    const [series, data] = param.seriesData.entries().next().value
    if (!series || !data) {
      // No series data means mouse is not over a candle - hide tooltip
      this.hideTooltip()
      return
    }

    // Check if the data actually contains valid OHLC values
    if (!this.isValidOHLCData(data)) {
      // Data exists but doesn't contain valid OHLC - hide tooltip
      this.hideTooltip()
      return
    }

    // Check if mouse is over a trade rectangle
    const trade = this.detectTradeAtPosition(param)
    if (trade) {
      this.showTradeTooltip(trade, param)
      return
    }

    // Mouse is over a candle with valid OHLC data and not over a trade - show OHLC tooltip
    this.showTooltip(param)
  }

  /**
   * Detect if mouse is over a trade using coordinate service
   */
  private detectTradeAtPosition(param: any): any {
    if (!param.point || !param.time) {
      return null
    }

    const mouseX = param.point.x
    const mouseY = param.point.y

    // Check if we have any trade data
    if (this.tradeData.size === 0) {
      return null
    }

    // For now, use a simpler approach - check if mouse is over any trade
    // We'll improve this later with proper coordinate conversion
    const trade = this.findTradeAtCoordinates(mouseX, mouseY, {})

    return trade
  }

  /**
   * Find trade at specific coordinates
   */
  private findTradeAtCoordinates(x: number, y: number, coordinates: any): any {
    // Iterate through trade data to find matches
    for (const [, trade] of this.tradeData.entries()) {
      if (this.isPointInTrade(x, y, trade, coordinates)) {
        return trade
      }
    }
    return null
  }

  /**
   * Check if data contains valid OHLC values
   */
  private isValidOHLCData(data: any): boolean {
    // Check if data has the required OHLC properties
    const hasOHLC =
      data.open !== undefined &&
      data.high !== undefined &&
      data.low !== undefined &&
      data.close !== undefined

    // Check if values are valid numbers
    const hasValidValues =
      hasOHLC &&
      typeof data.open === 'number' &&
      typeof data.high === 'number' &&
      typeof data.low === 'number' &&
      typeof data.close === 'number'

    // Check if values make logical sense (high >= low, etc.)
    const hasLogicalValues =
      hasValidValues &&
      data.high >= data.low &&
      data.high >= data.open &&
      data.high >= data.close &&
      data.low <= data.open &&
      data.low <= data.close

    return hasLogicalValues
  }

  /**
   * Check if point is within trade bounds
   */
  private isPointInTrade(x: number, y: number, trade: any, coordinates: any): boolean {
    try {
      // Convert trade time/price to chart coordinates
      const timeScale = this.chart.timeScale()

      // Check if the mouse is within the time range of the trade
      const entryX = timeScale.timeToCoordinate(trade.entryTime)
      const exitX = timeScale.timeToCoordinate(trade.exitTime)

      if (entryX === null || exitX === null) {
        return false
      }

      // Check if mouse X is within trade time range
      const timeInRange = x >= Math.min(entryX, exitX) && x <= Math.max(entryX, exitX)

      if (!timeInRange) {
        return false
      }

      // For Y coordinate, we need to be more precise
      // Since we can't easily convert prices to coordinates without series access,
      // we'll use a reasonable tolerance around the middle of the chart
      const chartHeight = this.container.clientHeight
      const chartMiddle = chartHeight / 2
      const tolerance = chartHeight * 0.4 // 40% of chart height tolerance

      // Check if mouse Y is within the middle area of the chart (where trades are likely to be)
      const yInRange = y >= chartMiddle - tolerance && y <= chartMiddle + tolerance

      if (!yInRange) {
        return false
      }

      return true
    } catch (error) {
      return false
    }
  }

  /**
   * Show trade-specific tooltip
   */
  private showTradeTooltip(trade: any, param: any): void {
    if (!this.tooltipElement) {
      this.ensureTooltipElement()
    }

    // Create trade tooltip data
    const tooltipData: TooltipData = {
      time: param.time,
      series: param.seriesData.entries().next().value[0],
      data: param.seriesData.entries().next().value[1],
      price: param.price || trade.exitPrice || 0,
      index: param.index || 0,
      trade: {
        entryPrice: trade.entryPrice,
        exitPrice: trade.exitPrice,
        size: trade.size,
        pnl: trade.pnl,
        side: trade.side,
        entryTime: trade.entryTime,
        exitTime: trade.exitTime
      }
    }

    this.currentData = tooltipData
    this.updateTooltipContent()
    this.positionTradeTooltip(param.point, trade)
  }

  /**
   * Position trade tooltip using PositioningEngine
   */
  private positionTradeTooltip(point: {x: number; y: number}, trade: any): void {
    if (!this.tooltipElement || !point) {
      return
    }

    const config = this.getDefaultConfig()
    if (!config) {
      return
    }

    // Get container bounds using coordinate service
    const containerBounds = this.container.getBoundingClientRect()
    const tooltipWidth = this.tooltipElement.offsetWidth || 200
    const tooltipHeight = this.tooltipElement.offsetHeight || 100

    // Use PositioningEngine for optimal positioning
    const position = PositioningEngine.calculateTooltipPosition(
      point.x,
      point.y,
      tooltipWidth,
      tooltipHeight,
      {
        x: 0,
        y: 0,
        left: 0,
        top: 0,
        right: containerBounds.width,
        bottom: containerBounds.height,
        width: containerBounds.width,
        height: containerBounds.height
      },
      'top' // Preferred anchor for trade tooltips
    )

    // Apply position using PositioningEngine
    PositioningEngine.applyPositionToElement(this.tooltipElement, {
      top: position.y,
      left: position.x
    })

    // Show tooltip
    this.tooltipElement.style.display = 'block'
  }

  /**
   * Show tooltip with data (existing method, enhanced)
   */
  private showTooltip(param: any): void {
    if (!this.isVisible || !param.time || param.seriesData.size === 0) {
      return
    }

    // Get the first series data
    const [series, data] = param.seriesData.entries().next().value
    if (!series || !data) {
      return
    }

    // Create tooltip data
    const tooltipData: TooltipData = {
      time: param.time,
      series,
      data,
      price: param.price || data.value || data.close || 0,
      index: param.index || 0
    }

    this.currentData = tooltipData
    this.updateTooltipContent()
    this.positionTooltip(param.point)
  }

  /**
   * Hide tooltip
   */
  private hideTooltip(): void {
    if (this.tooltipElement) {
      this.tooltipElement.style.display = 'none'
    }
    this.currentData = null
  }

  /**
   * Create tooltip element if it doesn't exist
   */
  private ensureTooltipElement(): HTMLElement {
    if (!this.tooltipElement) {
      this.tooltipElement = document.createElement('div')
      this.tooltipElement.className = 'chart-tooltip'
      this.tooltipElement.style.cssText = `
        position: absolute;
        z-index: 1000;
        background-color: rgba(255, 255, 255, 0.95);
        border: 1px solid #e1e3e6;
        border-radius: 4px;
        padding: 8px;
        font-family: sans-serif;
        font-size: 12px;
        color: #131722;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        pointer-events: none;
        user-select: none;
        white-space: nowrap;
        display: none;
      `
      this.container.appendChild(this.tooltipElement)
    }
    return this.tooltipElement
  }

  /**
   * Enhanced tooltip content formatting with trade support
   */
  private updateTooltipContent(): void {
    if (!this.currentData) {
      return
    }

    const tooltipElement = this.ensureTooltipElement()
    const config = this.getDefaultConfig()

    if (!config || !config.enabled) {
      return
    }

    const content = this.formatTooltipContent(config, this.currentData)
    tooltipElement.innerHTML = content

    // Apply custom styling
    if (config.style) {
      this.applyTooltipStyle(tooltipElement, config.style)
    }
  }

  /**
   * Format tooltip content using configuration
   */
  private formatTooltipContent(config: TooltipConfig, data: TooltipData): string {
    // Handle trade tooltips specially - if we have trade data, use trade config
    if (data.trade) {
      // Try to get the trade config specifically
      const tradeConfig = this.configs.get('trade')
      if (tradeConfig) {
        return this.formatTradeTooltip(tradeConfig, data)
      }
    }

    // Use existing formatting for other types
    if (config.template) {
      return this.formatWithTemplate(config, data)
    } else {
      return this.formatWithFields(config, data)
    }
  }

  /**
   * Format trade-specific tooltip content
   */
  private formatTradeTooltip(config: TooltipConfig, data: TooltipData): string {
    if (!data.trade) {
      return ''
    }

    const trade = data.trade
    const sideColor = trade.side === 'long' ? '#00ff88' : '#ff4444'
    const pnlColor = trade.pnl >= 0 ? '#00ff88' : '#ff4444'

    return `
      <div class="trade-tooltip">
        <div class="trade-header" style="color: ${sideColor}; font-weight: 600; margin-bottom: 8px;">
          ${trade.side.toUpperCase()} TRADE
        </div>
        <div class="trade-details" style="line-height: 1.4;">
          <div>Entry: $${trade.entryPrice?.toFixed(2)}</div>
          <div>Exit: $${trade.exitPrice?.toFixed(2)}</div>
          <div>Size: ${trade.size}</div>
          <div style="color: ${pnlColor}; font-weight: 600;">
            P&L: $${trade.pnl?.toFixed(2)}
          </div>
        </div>
      </div>
    `
  }

  /**
   * Format tooltip using template with placeholders
   */
  private formatWithTemplate(config: TooltipConfig, data: TooltipData): string {
    if (!config.template) {
      return ''
    }

    let result = config.template

    // Replace placeholders with actual values
    const dataObj = this.extractDataObject(data)
    const keys = Object.keys(dataObj)
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]
      const value = dataObj[key]
      const placeholder = `{${key}}`
      if (result.includes(placeholder)) {
        const formattedValue = this.formatValue(key, value, config)
        result = result.replace(new RegExp(placeholder, 'g'), formattedValue)
      }
    }

    // Add date/time if configured
    if ((config.showDate || config.showTime) && data.time) {
      const timeStr = this.formatTime(data.time, config)
      if (timeStr) {
        result = `${timeStr}<br>${result}`
      }
    }

    return result
  }

  /**
   * Format tooltip using field configuration
   */
  private formatWithFields(config: TooltipConfig, data: TooltipData): string {
    const lines: string[] = []

    // Add date/time if configured
    if ((config.showDate || config.showTime) && data.time) {
      const timeStr = this.formatTime(data.time, config)
      if (timeStr) {
        lines.push(timeStr)
      }
    }

    // Add field values
    const dataObj = this.extractDataObject(data)
    for (const field of config.fields) {
      if (dataObj[field.valueKey] !== undefined) {
        const value = dataObj[field.valueKey]
        const formattedValue = this.formatFieldValue(field, value)
        lines.push(`${field.label}: ${formattedValue}`)
      }
    }

    return lines.join('<br>')
  }

  /**
   * Extract data object from tooltip data
   */
  private extractDataObject(data: TooltipData): any {
    const result: any = {
      time: data.time,
      price: data.price,
      value: data.data.value,
      open: data.data.open,
      high: data.data.high,
      low: data.data.low,
      close: data.data.close,
      volume: data.data.volume,
      index: data.index
    }

    // Add all properties from the data object
    Object.assign(result, data.data)

    return result
  }

  /**
   * Format a single value
   */
  private formatValue(key: string, value: any, config: TooltipConfig): string {
    const field = config.fields.find(f => f.valueKey === key)
    if (field) {
      return this.formatFieldValue(field, value)
    }
    return String(value)
  }

  /**
   * Format field value according to field configuration
   */
  private formatFieldValue(field: TooltipField, value: any): string {
    let result = String(value)

    // Apply precision for numeric values
    if (field.precision !== undefined && typeof value === 'number') {
      result = value.toFixed(field.precision)
    }

    // Add prefix and suffix
    if (field.prefix) {
      result = `${field.prefix}${result}`
    }
    if (field.suffix) {
      result = `${result}${field.suffix}`
    }

    return result
  }

  /**
   * Format time value according to configuration
   */
  private formatTime(time: Time, config: TooltipConfig): string {
    try {
      const date = new Date((time as number) * 1000)
      const parts: string[] = []

      if (config.showDate) {
        const dateFormat = config.dateFormat || '%Y-%m-%d'
        parts.push(this.formatDate(date, dateFormat))
      }

      if (config.showTime) {
        const timeFormat = config.timeFormat || '%H:%M:%S'
        parts.push(this.formatTimeString(date, timeFormat))
      }

      return parts.join(' ')
    } catch (error) {
      return String(time)
    }
  }

  /**
   * Format date according to format string
   */
  private formatDate(date: Date, format: string): string {
    // Simple date formatting - can be enhanced with a proper date library
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    return format.replace('%Y', String(year)).replace('%m', month).replace('%d', day)
  }

  /**
   * Format time according to format string
   */
  private formatTimeString(date: Date, format: string): string {
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')

    return format.replace('%H', hours).replace('%M', minutes).replace('%S', seconds)
  }

  /**
   * Enhanced tooltip positioning using PositioningEngine
   */
  private positionTooltip(point: {x: number; y: number}): void {
    if (!this.tooltipElement || !point) {
      return
    }

    const config = this.getDefaultConfig()
    if (!config) {
      return
    }

    // Get container bounds using coordinate service
    const containerBounds = this.container.getBoundingClientRect()
    const tooltipWidth = this.tooltipElement.offsetWidth || 200
    const tooltipHeight = this.tooltipElement.offsetHeight || 100

    // Use PositioningEngine for optimal positioning
    const position = PositioningEngine.calculateTooltipPosition(
      point.x,
      point.y,
      tooltipWidth,
      tooltipHeight,
      {
        x: 0,
        y: 0,
        left: 0,
        top: 0,
        right: containerBounds.width,
        bottom: containerBounds.height,
        width: containerBounds.width,
        height: containerBounds.height
      },
      'top'
    )

    // Apply position using PositioningEngine
    PositioningEngine.applyPositionToElement(this.tooltipElement, {
      top: position.y,
      left: position.x
    })

    // Show tooltip
    this.tooltipElement.style.display = 'block'
  }

  /**
   * Apply custom styling to tooltip element
   */
  private applyTooltipStyle(element: HTMLElement, style: TooltipStyle): void {
    if (style.backgroundColor) {
      element.style.backgroundColor = style.backgroundColor
    }
    if (style.borderColor) {
      element.style.borderColor = style.borderColor
    }
    if (style.borderWidth !== undefined) {
      element.style.borderWidth = `${style.borderWidth}px`
    }
    if (style.borderRadius !== undefined) {
      element.style.borderRadius = `${style.borderRadius}px`
    }
    if (style.padding !== undefined) {
      element.style.padding = `${style.padding}px`
    }
    if (style.fontSize !== undefined) {
      element.style.fontSize = `${style.fontSize}px`
    }
    if (style.fontFamily) {
      element.style.fontFamily = style.fontFamily
    }
    if (style.color) {
      element.style.color = style.color
    }
    if (style.boxShadow) {
      element.style.boxShadow = style.boxShadow
    }
    if (style.zIndex !== undefined) {
      element.style.zIndex = String(style.zIndex)
    }
  }

  /**
   * Get default tooltip configuration
   */
  private getDefaultConfig(): TooltipConfig | undefined {
    return this.configs.get('default') || this.configs.values().next().value
  }

  /**
   * Enable tooltip
   */
  enable(): void {
    this.isVisible = true
  }

  /**
   * Disable tooltip
   */
  disable(): void {
    this.isVisible = false
    this.hideTooltip()
  }

  /**
   * Enhanced destroy method with coordinate service cleanup
   */
  destroy(): void {
    if (this.tooltipElement) {
      this.container.removeChild(this.tooltipElement)
      this.tooltipElement = null
    }

    // Unregister from coordinate service
    this.coordinateService.unregisterChart(this.chartId)

    this.configs.clear()
    this.currentData = null
    this.tradeData.clear()
  }
}

/**
 * Create and configure tooltip plugin with chart ID
 */
export function createTooltipPlugin(
  chart: IChartApi,
  container: HTMLElement,
  chartId: string,
  configs: Record<string, TooltipConfig> = {},
  chartConfig?: any
): TooltipPlugin {
  const plugin = new TooltipPlugin(chart, container, chartId)

  // Add configurations
  for (const [name, config] of Object.entries(configs)) {
    plugin.addConfig(name, config)
  }

  // Extract trade data from chart configuration if provided
  if (chartConfig && chartConfig.trades && Array.isArray(chartConfig.trades)) {
    // Add each trade to the tooltip plugin
    chartConfig.trades.forEach((trade: any, index: number) => {
      const tradeId = `trade_${index}`
      plugin.addTradeData(tradeId, {
        entryTime: trade.entry_time || trade.entryTime,
        exitTime: trade.exit_time || trade.exitTime,
        entryPrice: trade.entry_price || trade.entryPrice,
        exitPrice: trade.exit_price || trade.exitPrice,
        size: trade.quantity || trade.size,
        pnl: (trade.exit_price || trade.exitPrice) - (trade.entry_price || trade.entryPrice),
        side: trade.trade_type === 'LONG' ? 'long' : 'short'
      })
    })
  }

  return plugin
}
