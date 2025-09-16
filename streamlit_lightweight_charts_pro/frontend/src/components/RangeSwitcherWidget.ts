import { IChartApi, ISeriesApi, Time } from 'lightweight-charts'
import { RangeSwitcherConfig } from '../types'
import { PositionableWidget, WidgetPriority, WidgetType } from './base/PositionableWidget'
import { Position, WidgetDimensions, Corner } from '../types/layout'

/**
 * RangeSwitcher widget that integrates with CornerLayoutManager
 */
export class RangeSwitcherWidget extends PositionableWidget {
  private chart: IChartApi | null = null
  private config: RangeSwitcherConfig
  private onRangeChange?: (range: { text: string; seconds: number | null }) => void
  private activeRange: string = ''
  private element: HTMLDivElement | null = null
  private updateCallback?: () => void

  constructor(config: RangeSwitcherConfig, layoutManager: any, onRangeChange?: (range: { text: string; seconds: number | null }) => void) {
    // Map position to corner - range switcher only supports corner positions, not center
    let corner: Corner
    const position = config.position || 'bottom-right'

    switch (position) {
      case 'top-left':
        corner = 'top-left'
        break
      case 'top-right':
        corner = 'top-right'
        break
      case 'bottom-left':
        corner = 'bottom-left'
        break
      case 'bottom-right':
        corner = 'bottom-right'
        break
      default:
        // Only support the four corners - default to bottom-right for any unsupported position
        corner = 'bottom-right'
        break
    }

    super(
      `${WidgetType.RANGE_SWITCHER}-${Date.now()}`,
      corner,
      WidgetPriority.RANGE_SWITCHER,
      layoutManager
    )

    this.config = config
    this.onRangeChange = onRangeChange
    this.visible = config.visible || false
    this.activeRange = this.getInitialRange()
  }

  /**
   * Set the chart instance
   */
  public setChart(chart: IChartApi | null): void {
    this.chart = chart
  }

  /**
   * Set the DOM element reference
   */
  public setElement(element: HTMLDivElement | null): void {
    this.element = element

    // Register callback to update layout manager when element dimensions change
    if (element && this.updateCallback) {
      // Use ResizeObserver if available
      if (typeof ResizeObserver !== 'undefined') {
        const resizeObserver = new ResizeObserver(this.updateCallback)
        resizeObserver.observe(element)
      }
    }
  }

  /**
   * Set callback for dimension updates
   */
  public setUpdateCallback(callback: () => void): void {
    this.updateCallback = callback
  }

  /**
   * Get current widget dimensions
   */
  public getDimensions(): WidgetDimensions {
    if (this.element) {
      return {
        width: this.element.offsetWidth || 150, // Smaller default fallback
        height: this.element.offsetHeight || 24 // Smaller height
      }
    }

    // Estimate dimensions based on ranges - more compact
    const buttonCount = this.config.ranges.length
    const estimatedWidth = Math.max(120, buttonCount * 32) // ~32px per button + gaps (was 45px)
    return {
      width: estimatedWidth,
      height: 24 // Smaller height for compact design
    }
  }

  /**
   * Handle position update from layout manager
   */
  protected onPositionUpdate(position: Position): void {
    // Position will be applied via getPositionStyle() in the component
    if (this.updateCallback) {
      this.updateCallback()
    }
  }

  /**
   * Get position style for React component
   */
  public getPositionStyle(): React.CSSProperties {
    let positionStyles: React.CSSProperties = {}

    if (this.currentPosition) {
      // Use the position from layout manager
      positionStyles = this.positionToCSS(this.currentPosition)
    } else {
      // Fallback positioning while layout manager is initializing
      // Use the same fallback pattern as legacy implementation
      const corner = this.corner
      const fallbackStyles: React.CSSProperties = {
        position: 'absolute',
        zIndex: 1000
      }

      const margin = 8 // Default margin

      if (corner.startsWith('top')) {
        fallbackStyles.top = `${margin}px`
      } else {
        fallbackStyles.bottom = `${margin}px`
      }

      if (corner.endsWith('right')) {
        fallbackStyles.right = `${margin}px`
      } else {
        fallbackStyles.left = `${margin}px`
      }

      positionStyles = fallbackStyles
    }

    return {
      ...positionStyles,
      display: 'flex',
      alignItems: 'center',
      gap: '2px', // Smaller gap between buttons
      padding: '2px', // Less padding
      margin: '0',
      border: '1px solid #E0E3EB',
      borderRadius: '4px', // Smaller border radius
      backgroundColor: 'rgba(255, 255, 255, 0.25)',
      pointerEvents: 'auto',
      boxSizing: 'border-box',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', // Subtler shadow
      fontFamily: '-apple-system, BlinkMacSystemFont, "Trebuchet MS", Roboto, Ubuntu, sans-serif',
      fontSize: '12px' // Smaller font size
    }
  }

  /**
   * Get initial range selection
   */
  private getInitialRange(): string {
    // If defaultRange is specified, use it
    if (this.config.defaultRange) {
      return this.config.defaultRange
    }

    // Look for "All" button (with null/undefined seconds) - this should be the default
    // since charts show all data initially
    const allButton = this.config.ranges.find(range => range.seconds === null || range.seconds === undefined)
    if (allButton) {
      return allButton.text
    }

    // Fallback to first range only if no "All" button exists
    return this.config.ranges[0]?.text || ''
  }

  /**
   * Handle range button click
   */
  public handleRangeClick(range: { text: string; seconds: number | null }): void {
    if (!this.chart) return

    this.activeRange = range.text
    this.onRangeChange?.(range)

    const timeScale = this.chart.timeScale()

    if (range.seconds === null || range.seconds === undefined) {
      // "All" button - fit all content
      timeScale.fitContent()
      return
    }

    try {
      // Get the last visible bar's time
      const visibleRange = timeScale.getVisibleRange()
      const series = this.getFirstSeries()

      if (!series || !visibleRange) {
        timeScale.fitContent()
        return
      }

      // Get series data to find the actual last bar
      const data = series.data()
      if (!data || data.length === 0) {
        timeScale.fitContent()
        return
      }

      // Find the last bar's time
      let lastBarTime: number
      const lastDataPoint = data[data.length - 1]

      if (typeof lastDataPoint.time === 'number') {
        lastBarTime = lastDataPoint.time
      } else if (typeof lastDataPoint.time === 'string') {
        lastBarTime = Math.floor(new Date(lastDataPoint.time).getTime() / 1000)
      } else {
        // Use current visible range end as fallback
        lastBarTime = visibleRange.to as number
      }

      // Calculate start time based on the interval and desired range
      const startTime = this.calculateStartTime(lastBarTime, range.seconds, this.config.interval)

      // Set the visible range
      timeScale.setVisibleRange({
        from: startTime as Time,
        to: lastBarTime as Time
      })

    } catch (error) {
      // Fallback to fit content if calculation fails
      timeScale.fitContent()
    }
  }

  /**
   * Get first series from chart
   */
  private getFirstSeries(): ISeriesApi<any> | null {
    if (!this.chart) return null

    try {
      // Access series through window registry if available
      const chartElement = this.chart.chartElement()
      const chartId = chartElement.id

      if ((window as any).seriesRefsMap && (window as any).seriesRefsMap[chartId]) {
        const seriesList = (window as any).seriesRefsMap[chartId]
        return seriesList.length > 0 ? seriesList[0] : null
      }

      return null
    } catch (error) {
      return null
    }
  }

  /**
   * Calculate start time for range
   */
  private calculateStartTime(lastBarTime: number, rangeSeconds: number, interval?: string): number {
    // Base calculation: subtract range seconds from last bar time
    let startTime = lastBarTime - rangeSeconds

    // Adjust for data interval to align with actual candle boundaries
    if (interval) {
      const intervalSeconds = this.parseInterval(interval)
      if (intervalSeconds > 0) {
        // Round down to the nearest interval boundary
        startTime = Math.floor(startTime / intervalSeconds) * intervalSeconds
      }
    }

    return startTime
  }

  /**
   * Parse interval string to seconds
   */
  private parseInterval(interval: string): number {
    // Parse interval string like '1m', '5m', '1h', '1d' into seconds
    const match = interval.match(/^(\d+)([smhd])$/)
    if (!match) return 0

    const value = parseInt(match[1])
    const unit = match[2]

    switch (unit) {
      case 's': return value
      case 'm': return value * 60
      case 'h': return value * 60 * 60
      case 'd': return value * 60 * 60 * 24
      default: return 0
    }
  }

  // Getters for component use
  public get ranges() { return this.config.ranges }
  public get currentActiveRange() { return this.activeRange }
  public get isVisible() { return this.visible }
}