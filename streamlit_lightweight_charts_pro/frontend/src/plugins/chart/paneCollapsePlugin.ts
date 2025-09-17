/**
 * Pane Collapse/Expand Plugin
 * Follows the same pattern as legends with corner layout manager integration
 */

import {IChartApi, IPanePrimitive, PaneAttachedParameter, Time} from 'lightweight-charts'
import {PaneCollapseConfig} from '../../types'
import React from 'react'
import {createRoot} from 'react-dom/client'
import {CollapseButtonComponent} from '../../components/CollapseButtonComponent'
import {CornerLayoutManager} from '../../services/CornerLayoutManager'

/**
 * Collapse button state management (similar to legend state)
 */
interface CollapseButtonState {
  isCollapsed: boolean
  originalHeight: number
  collapsedHeight: number
  buttonElement: HTMLElement
  reactRoot: ReturnType<typeof createRoot>
  originalStretchFactor?: number
}

/**
 * Pane Collapse Plugin using same pattern as legends
 */
export class PaneCollapsePlugin implements IPanePrimitive<Time> {
  private _paneViews: any[]
  private chartApi: IChartApi | null = null
  private paneId: number
  private config: PaneCollapseConfig
  private buttonState: CollapseButtonState | null = null

  constructor(paneId: number, config: PaneCollapseConfig = {}) {
    this._paneViews = []
    this.paneId = paneId
    this.config = {
      enabled: true,
      buttonSize: 16,
      buttonColor: '#787B86',
      buttonHoverColor: '#131722',
      buttonBackground: 'rgba(255, 255, 255, 0.9)',
      buttonHoverBackground: 'rgba(255, 255, 255, 1)',
      buttonBorderRadius: 3,
      showTooltip: true,
      position: 'top-right', // Default corner position
      tooltipText: {
        collapse: 'Collapse pane',
        expand: 'Expand pane'
      },
      ...config
    }
  }

  /**
   * Required IPanePrimitive interface methods - same pattern as legends
   */
  paneViews(): any[] {
    if (this._paneViews.length === 0) {
      this._paneViews = [
        {
          renderer: () => ({
            draw: (ctx: CanvasRenderingContext2D) => {
              // Same pattern as legends - trigger positioning updates during draw
              if (this.chartApi && this.buttonState) {
                requestAnimationFrame(() => {
                  this.updateButtonPosition()
                })
              }
            }
          })
        }
      ]
    }
    return this._paneViews
  }

  /**
   * Initialize the plugin with chart (same pattern as legends)
   */
  attached(param: PaneAttachedParameter<Time>): void {
    this.chartApi = param.chart
    this.setupCollapseButton()
  }

  /**
   * Cleanup resources (same pattern as legends)
   */
  detached(): void {
    if (this.buttonState) {
      // Cleanup React component
      if (this.buttonState.reactRoot) {
        this.buttonState.reactRoot.unmount()
      }

      // Cleanup DOM element
      if (this.buttonState.buttonElement && this.buttonState.buttonElement.parentNode) {
        this.buttonState.buttonElement.parentNode.removeChild(this.buttonState.buttonElement)
      }
    }

    // Reset state
    this.buttonState = null
    this.chartApi = null
  }

  /**
   * Setup collapse button (same pattern as legend creation)
   */
  private setupCollapseButton(): void {
    if (!this.chartApi || !this.config.enabled) return

    try {
      // Create button container element
      const buttonElement = document.createElement('div')
      buttonElement.className = 'collapse-button-container'
      buttonElement.setAttribute('data-widget-type', 'collapse-button')
      buttonElement.setAttribute('data-pane-id', this.paneId.toString())

      // Create React root and render component with layout manager integration
      const reactRoot = createRoot(buttonElement)
      reactRoot.render(
        React.createElement(CollapseButtonComponent, {
          paneId: this.paneId,
          isCollapsed: false,
          onClick: () => this.togglePaneCollapse(),
          config: this.config,
          layoutManager: this.getLayoutManager() // Pass layout manager like legends do
        })
      )

      // Add to chart container
      const chartElement = this.chartApi.chartElement()
      if (chartElement) {
        chartElement.appendChild(buttonElement)
      }

      // Store state
      this.buttonState = {
        isCollapsed: false,
        originalHeight: 0,
        collapsedHeight: 45,
        buttonElement: buttonElement,
        reactRoot: reactRoot
      }

      // Initial positioning update
      this.updateButtonPosition()

    } catch (error) {
      console.error('Error setting up collapse button:', error)
    }
  }

  /**
   * Get layout manager from chart (create instance for this pane)
   */
  private getLayoutManager(): any {
    if (!this.chartApi) return null

    // Create CornerLayoutManager instance for this specific pane
    // This ensures the collapse button is positioned relative to the correct pane
    const chartElement = this.chartApi.chartElement()
    const chartId = chartElement?.id || 'unknown'

    const layoutManager = CornerLayoutManager.getInstance(chartId, this.paneId)
    layoutManager.setChartApi(this.chartApi)

    return layoutManager
  }

  /**
   * Update button position (called from paneViews draw - same as legends)
   */
  private updateButtonPosition(): void {
    if (!this.chartApi || !this.buttonState) return

    // The button positioning is now handled by the layout manager
    // This method exists for consistency with legend pattern
    // but the actual positioning happens through the CollapseButtonComponent
    // which uses the CollapseButtonWidget with CornerLayoutManager integration
  }

  /**
   * Toggle pane collapse state
   */
  private togglePaneCollapse(): void {
    if (!this.chartApi || !this.buttonState) return

    try {
      if (this.buttonState.isCollapsed) {
        this.expandPane()
      } else {
        this.collapsePane()
      }
    } catch (error) {
      console.error('Error toggling pane collapse:', error)
    }
  }

  /**
   * Collapse a pane
   */
  private collapsePane(): void {
    if (!this.chartApi || !this.buttonState || this.buttonState.isCollapsed) return

    try {
      const panes = this.chartApi.panes()
      if (this.paneId >= panes.length) return

      const pane = panes[this.paneId]
      const currentStretchFactor = pane.getStretchFactor()
      const paneSize = this.chartApi.paneSize(this.paneId)

      // Store original values
      this.buttonState.originalStretchFactor = currentStretchFactor
      if (paneSize) {
        this.buttonState.originalHeight = paneSize.height
      }

      // Collapse pane to minimal height
      const minimalStretchFactor = 0.15
      pane.setStretchFactor(minimalStretchFactor)

      // Update state
      this.buttonState.isCollapsed = true

      // Update button through React re-render
      this.updateButtonState(true)

      // Trigger chart layout recalculation
      const chartElement = this.chartApi.chartElement()
      if (chartElement) {
        this.chartApi.resize(chartElement.clientWidth, chartElement.clientHeight)
      }

      // Notify callback
      if (this.config.onPaneCollapse) {
        this.config.onPaneCollapse(this.paneId, true)
      }
    } catch (error) {
      console.error('Error collapsing pane:', error)
    }
  }

  /**
   * Expand a pane
   */
  private expandPane(): void {
    if (!this.chartApi || !this.buttonState || !this.buttonState.isCollapsed) return

    try {
      const panes = this.chartApi.panes()
      if (this.paneId >= panes.length) return

      const pane = panes[this.paneId]
      const originalStretchFactor = this.buttonState.originalStretchFactor || 0.2

      // Restore original stretch factor
      pane.setStretchFactor(originalStretchFactor)

      // Update state
      this.buttonState.isCollapsed = false

      // Update button through React re-render
      this.updateButtonState(false)

      // Trigger chart layout recalculation
      const chartElement = this.chartApi.chartElement()
      if (chartElement) {
        this.chartApi.resize(chartElement.clientWidth, chartElement.clientHeight)
      }

      // Notify callback
      if (this.config.onPaneExpand) {
        this.config.onPaneExpand(this.paneId, false)
      }
    } catch (error) {
      console.error('Error expanding pane:', error)
    }
  }

  /**
   * Update button state through React re-render (same pattern as legends)
   */
  private updateButtonState(isCollapsed: boolean): void {
    if (!this.buttonState?.reactRoot) return

    try {
      this.buttonState.reactRoot.render(
        React.createElement(CollapseButtonComponent, {
          paneId: this.paneId,
          isCollapsed: isCollapsed,
          onClick: () => this.togglePaneCollapse(),
          config: this.config,
          layoutManager: this.getLayoutManager()
        })
      )
    } catch (error) {
      console.error('Error updating button state:', error)
    }
  }
}

export function createPaneCollapsePlugin(
  paneId: number,
  config?: PaneCollapseConfig
): PaneCollapsePlugin {
  return new PaneCollapsePlugin(paneId, config)
}

export function createPaneCollapsePlugins(
  paneIds: number[],
  config?: PaneCollapseConfig
): PaneCollapsePlugin[] {
  return paneIds.map(paneId => createPaneCollapsePlugin(paneId, config))
}