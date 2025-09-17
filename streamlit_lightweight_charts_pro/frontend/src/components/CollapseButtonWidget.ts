import { PositionableWidget, WidgetPriority, WidgetType } from './base/PositionableWidget'
import { Position, WidgetDimensions, Corner } from '../types/layout'

interface CollapseButtonConfig {
  buttonSize?: number
  buttonColor?: string
  buttonBackground?: string
  buttonBorderRadius?: number
  buttonHoverColor?: string
  buttonHoverBackground?: string
  showTooltip?: boolean
  position?: string
}

/**
 * CollapseButton widget that integrates with CornerLayoutManager
 * Follows the exact same pattern as LegendWidget
 */
export class CollapseButtonWidget extends PositionableWidget {
  private static instanceCounter = 0
  private paneId: number
  private isCollapsed: boolean
  private onClick: () => void
  private config: CollapseButtonConfig
  private element: HTMLDivElement | null = null
  private updateCallback?: () => void

  constructor(
    paneId: number,
    isCollapsed: boolean,
    onClick: () => void,
    config: CollapseButtonConfig = {},
    layoutManager: any
  ) {
    const corner = (config.position || 'top-right') as Corner

    // Create deterministic ID that ensures proper registration order (same as LegendWidget)
    CollapseButtonWidget.instanceCounter++
    // Include chart ID from layout manager to make widget IDs unique per chart
    const chartId = layoutManager?.getChartId?.() || 'unknown'
    super(
      `${WidgetType.MINIMIZE_BUTTON}-${chartId}-pane-${paneId}-${CollapseButtonWidget.instanceCounter}`,
      corner,
      WidgetPriority.MINIMIZE_BUTTON, // Highest priority
      layoutManager
    )

    this.paneId = paneId
    this.isCollapsed = isCollapsed
    this.onClick = onClick
    this.config = config
    this.visible = true // Collapse buttons are always visible when needed
  }

  /**
   * Update collapse state
   */
  public updateState(isCollapsed: boolean): void {
    this.isCollapsed = isCollapsed
    if (this.updateCallback) {
      this.updateCallback()
    }
  }

  /**
   * Update configuration
   */
  public updateConfig(config: CollapseButtonConfig): void {
    this.config = { ...this.config, ...config }
    if (this.updateCallback) {
      this.updateCallback()
    }
  }

  /**
   * Set the DOM element reference (same pattern as LegendWidget.setElement)
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
    }
  }

  /**
   * Set callback for updates
   */
  public setUpdateCallback(callback: () => void): void {
    this.updateCallback = callback
  }

  /**
   * Get current widget dimensions
   */
  public getDimensions(): WidgetDimensions {
    const buttonSize = 19 // 15px SVG + 2px padding on each side = 19px total

    return {
      width: buttonSize + 4, // Button size + small margin
      height: buttonSize + 4
    }
  }

  /**
   * Handle position update from layout manager
   */
  protected onPositionUpdate(position: Position): void {
    if (this.updateCallback) {
      this.updateCallback()
    }
  }

  /**
   * Get position style for React component
   */
  public getPositionStyle(): React.CSSProperties {
    // TradingView-style collapse button - SVG icon (15x15) + padding (2px each side)
    const buttonSize = 19 // 15px SVG + 2px padding on each side = 19px total

    let positionStyles: React.CSSProperties = {}

    if (this.currentPosition) {
      // Use the position from layout manager
      positionStyles = this.positionToCSS(this.currentPosition)
    } else {
      // Fallback positioning while layout manager is initializing
      const corner = this.corner
      const fallbackStyles: React.CSSProperties = {
        position: 'absolute',
        zIndex: 1000
      }

      const margin = 8

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
      width: `${buttonSize}px`,
      height: `${buttonSize}px`,
      cursor: 'pointer',
      pointerEvents: 'auto',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: this.config.buttonColor || '#5D6069', // Slightly darker grey
      backgroundColor: 'transparent',
      // Add light border when expanded (not collapsed)
      border: this.isCollapsed ? 'none' : '1px solid rgba(120, 123, 134, 0.3)',
      borderRadius: '4px',
      padding: '2px', // 2px padding around 15x15 SVG
      transition: 'all 0.15s ease',
      userSelect: 'none',
      opacity: 0.7,
      // TradingView-like button styling
      boxSizing: 'border-box'
    }
  }

  /**
   * Get hover style for React component
   */
  public getHoverStyle(): React.CSSProperties {
    const buttonHoverColor = this.config.buttonHoverColor || '#2962FF'
    const buttonHoverBackground = this.config.buttonHoverBackground || '#E5E5E5' // Light grey background

    return {
      color: buttonHoverColor,
      backgroundColor: buttonHoverBackground,
      opacity: 1
    }
  }

  /**
   * Handle button click
   */
  public handleClick(): void {
    this.onClick()
  }

  /**
   * Get tooltip text
   */
  public getTooltipText(): string {
    return this.isCollapsed ? 'Expand pane' : 'Collapse pane'
  }

  /**
   * Get button icon/symbol - returns SVG as React element
   */
  public getButtonSymbol(): JSX.Element {
    // TradingView-style SVG icon with bracket arrows - different paths based on collapse state
    const React = require('react')

    if (this.isCollapsed) {
      // Collapsed state - arrows pointing inward (expand)
      return React.createElement('svg', {
        xmlns: 'http://www.w3.org/2000/svg',
        viewBox: '0 0 15 15',
        width: '15',
        height: '15',
        fill: 'none',
        style: { display: 'block' }
      }, [
        React.createElement('path', {
          key: 'bracket-up',
          stroke: 'currentColor',
          d: 'm4 5 3.5-3L11 5',
          className: 'bracket-up'
        }),
        React.createElement('path', {
          key: 'bracket-down',
          stroke: 'currentColor',
          d: 'M11 10l-3.5 3L4 10',
          className: 'bracket-down'
        })
      ])
    } else {
      // Expanded state - arrows pointing outward (collapse)
      return React.createElement('svg', {
        xmlns: 'http://www.w3.org/2000/svg',
        viewBox: '0 0 15 15',
        width: '15',
        height: '15',
        fill: 'none',
        style: { display: 'block' }
      }, [
        React.createElement('path', {
          key: 'bracket-up',
          stroke: 'currentColor',
          d: 'M11 2 7.5 5 4 2',
          className: 'bracket-up'
        }),
        React.createElement('path', {
          key: 'bracket-down',
          stroke: 'currentColor',
          d: 'M4 13l3.5-3 3.5 3',
          className: 'bracket-down'
        })
      ])
    }
  }

  // Getters for component use
  public get buttonPaneId() { return this.paneId }
  public get buttonIsCollapsed() { return this.isCollapsed }
  public get buttonConfig() { return this.config }
  public get showTooltip() { return this.config.showTooltip ?? true }
}