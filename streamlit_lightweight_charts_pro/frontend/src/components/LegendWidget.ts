import { LegendConfig } from '../types'
import { PositionableWidget, WidgetPriority, WidgetType } from './base/PositionableWidget'
import { Position, WidgetDimensions, Corner } from '../types/layout'

/**
 * Legend widget that integrates with CornerLayoutManager
 */
export class LegendWidget extends PositionableWidget {
  private static instanceCounter = 0
  private config: LegendConfig
  private element: HTMLDivElement | null = null
  private updateCallback?: () => void
  private originalTemplate: string
  private currentDisplayText: string

  constructor(config: LegendConfig, layoutManager: any) {
    const corner = (config.position || 'top-left') as Corner
    // Create deterministic ID that ensures proper registration order
    LegendWidget.instanceCounter++
    // Include chart ID from layout manager to make widget IDs unique per chart
    const chartId = layoutManager?.getChartId?.() || 'unknown'
    super(
      `${WidgetType.LEGEND}-${chartId}-${LegendWidget.instanceCounter}`,
      corner,
      WidgetPriority.LEGEND,
      layoutManager
    )

    this.config = config
    this.visible = config.visible ?? true
    this.originalTemplate = config.text || ''

    // Initialize with $$value$$ replaced with empty string
    this.currentDisplayText = this.originalTemplate.replace(/\$\$value\$\$/g, '')
  }

  /**
   * Update legend configuration
   */
  public updateConfig(config: LegendConfig): void {
    this.config = config
    this.setVisible(config.visible ?? true)
    this.originalTemplate = config.text || ''

    // Re-initialize display text with current value
    this.currentDisplayText = this.originalTemplate.replace(/\$\$value\$\$/g, '')

    if (this.updateCallback) {
      this.updateCallback()
    }
  }

  /**
   * Update the $$value$$ placeholder with crosshair data
   */
  public updateValue(value: string | number | null): void {
    if (!this.originalTemplate.includes('$$value$$')) {
      return // No placeholder to update
    }

    let displayValue = ''
    if (value !== null && value !== undefined) {
      if (typeof value === 'number') {
        displayValue = value.toFixed(2)
      } else {
        displayValue = String(value)
      }
    }

    this.currentDisplayText = this.originalTemplate.replace(/\$\$value\$\$/g, displayValue)

    if (this.updateCallback) {
      this.updateCallback()
    }
  }

  /**
   * Get the current display text (with $$value$$ replaced)
   */
  public getCurrentDisplayText(): string {
    return this.currentDisplayText
  }

  /**
   * Set the DOM element reference
   */
  public setElement(element: HTMLDivElement | null): void {
    this.element = element

    if (element) {
      // Wait for element to be properly sized before triggering layout update
      setTimeout(() => {
        if (this.updateCallback) {
          this.updateCallback()
        }
      }, 50) // Small delay to ensure DOM is ready

      // Register callback to update layout manager when element dimensions change
      if (this.updateCallback && typeof ResizeObserver !== 'undefined') {
        const resizeObserver = new ResizeObserver(() => {
          this.updateCallback?.()
        })
        resizeObserver.observe(element)
      }

      // Listen for crosshair value updates
      element.addEventListener('crosshairValueUpdate', () => {
        const value = (element as any)._crosshairValue
        this.updateValue(value)
      })
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
      const elementWidth = this.element.offsetWidth
      const elementHeight = this.element.offsetHeight

      const dimensions = {
        width: elementWidth || 150, // Default fallback
        height: Math.max(elementHeight || 30, 20) // Ensure minimum height of 20px
      }
      return dimensions
    }

    // Estimate dimensions based on text content
    const textLength = this.getTextContent().length
    const estimatedWidth = Math.min(300, Math.max(100, textLength * 8)) // ~8px per character
    const estimatedHeight = Math.max(30, 20) // Ensure minimum height

    const dimensions = {
      width: estimatedWidth,
      height: estimatedHeight
    }
    return dimensions
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
      // Remove all formatting - user handles styling via HTML in the text
      pointerEvents: 'auto'
    }
  }

  /**
   * Extract text content from HTML for accessibility and sizing
   */
  private getTextContent(): string {
    if (!this.config.text) return ''

    try {
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = this.config.text

      // Try multiple methods to extract text
      let text = tempDiv.textContent || tempDiv.innerText || ''

      // If still empty, try to clean up the HTML and extract manually
      if (!text.trim()) {
        text = this.config.text.replace(/<[^>]*>/g, '').trim()
      }

      return text
    } catch (error) {
      // Fallback: return the HTML as-is if parsing fails
      return this.config.text.replace(/<[^>]*>/g, '').trim()
    }
  }

  // Getters for component use
  public get legendConfig() { return this.config }
  public get textContent() { return this.getTextContent() }
  public get isVisible() { return this.visible }
  public get displayText() { return this.currentDisplayText }
}