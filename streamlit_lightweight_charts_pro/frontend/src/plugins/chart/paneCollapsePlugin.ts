/**
 * Pane Collapse/Expand Plugin
 * Provides TradingView-style pane collapse and expand functionality
 */

import {IChartApi, IPanePrimitive, PaneAttachedParameter, Time} from 'lightweight-charts'
import {ChartCoordinateService} from '../../services/ChartCoordinateService'
import {PaneCollapseConfig} from '../../types'
import React from 'react'
import {createRoot} from 'react-dom/client'
import {CollapseButtonComponent} from '../../components/CollapseButtonComponent'

/**
 * Pane state management
 */
interface PaneState {
  isCollapsed: boolean
  originalHeight: number
  collapsedHeight: number
  buttonElement: HTMLElement
  tooltipElement?: HTMLElement
  reactRoot?: ReturnType<typeof createRoot>
  originalStretchFactor?: number // Store original stretch factor
}

/**
 * Pane Collapse Plugin using Pane Primitives
 */
export class PaneCollapsePlugin implements IPanePrimitive<Time> {
  private _paneViews: any[]
  private chartApi: IChartApi | null = null
  private paneId: number
  private config: PaneCollapseConfig
  private paneStates = new Map<number, PaneState>()
  private coordinateService: ChartCoordinateService
  private resizeObserver: ResizeObserver | null = null
  private preservationTimer: NodeJS.Timeout | null = null

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
      tooltipText: {
        collapse: 'Collapse pane',
        expand: 'Expand pane'
      },
      ...config
    }
    this.coordinateService = ChartCoordinateService.getInstance()
  }

  /**
   * Required IPanePrimitive interface methods
   */
  paneViews(): any[] {
    if (this._paneViews.length === 0) {
      this._paneViews = [
        {
          renderer: () => ({
            draw: (ctx: CanvasRenderingContext2D) => {
              // This gets called during pane resizing
              // Update button position for smooth movement
              if (this.chartApi) {
                requestAnimationFrame(() => {
                  this.updateButtonPositions()
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
   * Initialize the plugin with chart
   */
  attached(param: PaneAttachedParameter<Time>): void {
    this.chartApi = param.chart
    this.setupPaneCollapse()
  }

  /**
   * Cleanup resources
   */
  detached(): void {
    // Remove all button elements
    this.paneStates.forEach(state => {
      if (state.buttonElement && state.buttonElement.parentNode) {
        state.buttonElement.parentNode.removeChild(state.buttonElement)
      }
      if (state.tooltipElement && state.tooltipElement.parentNode) {
        state.tooltipElement.parentNode.removeChild(state.tooltipElement)
      }
      if (state.reactRoot) {
        state.reactRoot.unmount()
      }
    })

    // Clear pane states
    this.paneStates.clear()

    // Reset chart API
    this.chartApi = null
  }

  /**
   * Setup pane collapse functionality
   */
  private setupPaneCollapse(): void {
    if (!this.chartApi || !this.config.enabled) return

    // Get chart element
    const chartElement = this.chartApi.chartElement()
    if (!chartElement) return

    // Delay button creation to allow chart to stabilize
    // This helps avoid the "Value is undefined" errors during initialization
    setTimeout(() => {
      this.createCollapseButton(chartElement, this.paneId)
    }, 200) // Wait 200ms for chart to stabilize
  }

  /**
   * Create collapse/expand button for a pane
   */
  private createCollapseButton(chartElement: HTMLElement, paneId: number): void {
    // Check if chart is ready by trying to get pane count
    if (!this.chartApi) {
      console.warn(`[PaneCollapse] Chart API not available for pane ${paneId}`)
      return
    }

    try {
      // Test if chart is ready by checking if we can get panes
      const panes = this.chartApi.panes()
      if (!panes || panes.length === 0) {
        console.warn(`[PaneCollapse] Chart not ready, no panes available for pane ${paneId}`)
        // Retry after a delay
        setTimeout(() => this.createCollapseButton(chartElement, paneId), 300)
        return
      }
    } catch (error) {
      console.warn(`[PaneCollapse] Chart not ready, error getting panes for pane ${paneId}:`, error)
      // Retry after a delay
      setTimeout(() => this.createCollapseButton(chartElement, paneId), 300)
      return
    }

    // Create button container (like legends do)
    const buttonContainer = document.createElement('div')
    buttonContainer.className = `pane-collapse-button-container-${paneId}`
    buttonContainer.style.position = 'absolute'
    buttonContainer.style.zIndex = (this.config.zIndex || 1000).toString()
    buttonContainer.style.pointerEvents = 'auto'

    try {
      // Append button container to chart element (like legends do)
      chartElement.appendChild(buttonContainer)

      // Create React root and render button component (like legends do)
      const reactRoot = createRoot(buttonContainer)
      reactRoot.render(
        React.createElement(CollapseButtonComponent, {
          paneId: paneId,
          isCollapsed: false,
          onClick: () => {
            this.togglePaneCollapse(paneId)
          },
          config: this.config
        })
      )

      // Store button container reference
      if (!this.paneStates.has(paneId)) {
        this.paneStates.set(paneId, {
          isCollapsed: false,
          originalHeight: 0,
          collapsedHeight: 45, // Height to show legend and button
          buttonElement: buttonContainer,
          reactRoot: reactRoot
        })
      } else {
        this.paneStates.get(paneId)!.buttonElement = buttonContainer
        this.paneStates.get(paneId)!.reactRoot = reactRoot
      }

      // Try to position immediately like legends do, but with retry mechanism
      this.positionButton(buttonContainer, paneId)
    } catch (error) {
      console.error(`❌ Error adding collapse button to pane ${paneId}:`, error)
    }
  }

  /**
   * Position button using the exact same pattern as legends
   */
  private positionButton(button: HTMLElement, paneId: number): void {
    if (!this.chartApi) return

    try {
      // Use the same coordinate service approach as legends
      const coordinateService = ChartCoordinateService.getInstance()
      const paneCoords = coordinateService.getPaneCoordinates(this.chartApi, paneId)

      if (!paneCoords) {
        console.warn(
          `[PaneCollapse] Pane coordinates not available for pane ${paneId}, retrying...`
        )
        // Simple retry like legends do - retry after 100ms, but limit retries
        const retryCount = (button as any).__retryCount || 0
        if (retryCount < 5) {
          ;(button as any).__retryCount = retryCount + 1
          setTimeout(() => this.positionButton(button, paneId), 100)
        } else {
          console.warn(
            `[PaneCollapse] Max retries reached for pane ${paneId}, using fallback positioning`
          )
          // Use fallback positioning
          button.style.top = '10px'
          button.style.left = '10px'
        }
        return
      }

      // Get legend position to determine button placement
      const legendPosition = this.getLegendPosition(paneId)
      const margin = 8
      const buttonSize = this.config.buttonSize || 16

      // Calculate position relative to pane using configuration
      let top: number, left: number

      // Rule 1: If legend is top-right, button goes top-left
      // Rule 2: For all other legend positions, button goes top-right
      if (legendPosition === 'top-right') {
        top = paneCoords.bounds.top + margin
        left = paneCoords.bounds.left + margin
      } else {
        top = paneCoords.bounds.top + margin
        left = paneCoords.bounds.right - buttonSize - margin
      }

      // Apply positioning directly (exactly like legends)
      button.style.top = `${top}px`
      button.style.left = `${left}px`
      button.style.position = 'absolute'
      button.style.zIndex = '1000'

      // Update button text based on current state
      const state = this.paneStates.get(paneId)
      if (state) {
        // The button text is now managed by the CollapseButtonComponent
        // We need to re-render the component to update its text
        if (state.reactRoot) {
          state.reactRoot.render(
            React.createElement(CollapseButtonComponent, {
              paneId: paneId,
              isCollapsed: state.isCollapsed,
              onClick: () => {
                this.togglePaneCollapse(paneId)
              },
              config: this.config
            })
          )
        }
      }
    } catch (error) {
      console.warn(`Failed to position button for pane ${paneId}:`, error)
      // Simple fallback positioning (exactly like legends)
      button.style.top = '10px'
      button.style.left = '10px'
    }
  }

  /**
   * Get legend position for this pane to avoid button overlap
   */
  private getLegendPosition(paneId: number): string {
    try {
      // Use the actual legend config if available
      if (this.config.legendConfig && this.config.legendConfig.position) {
        return this.config.legendConfig.position
      }

      // Fallback: check if legend exists in DOM
      const chartElement = this.chartApi?.chartElement()
      if (chartElement) {
        // Look for legend elements in the chart
        const legendElements = chartElement.querySelectorAll('.pane-legend, [data-legend-pane]')
        for (const legend of legendElements) {
          const legendPaneId = legend.getAttribute('data-legend-pane')
          if (legendPaneId === paneId.toString()) {
            // Check if legend is visible and positioned
            const computedStyle = window.getComputedStyle(legend)
            const display = computedStyle.display
            const visibility = computedStyle.visibility

            if (display !== 'none' && visibility !== 'hidden') {
              // If legend exists and is visible, assume it's at top-left for now
              return 'top-left'
            }
          }
        }
      }

      // Default to top-left if we can't determine (since user specified it)
      return 'top-left'
    } catch (error) {
      console.error('Error determining legend position:', error)
      return 'top-left'
    }
  }

  /**
   * Show tooltip for the button
   */
  private showTooltip(button: HTMLElement, paneId: number): void {
    const state = this.paneStates.get(paneId)
    if (!state || !this.config.showTooltip) return

    // Remove existing tooltip
    this.hideTooltip()

    // Create tooltip element
    const tooltip = document.createElement('div')
    tooltip.className = 'pane-collapse-tooltip'
    tooltip.textContent = state.isCollapsed
      ? this.config.tooltipText?.expand || 'Expand pane'
      : this.config.tooltipText?.collapse || 'Collapse pane'

    tooltip.style.cssText = `
      position: absolute;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      white-space: nowrap;
      z-index: 1001;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.2s ease;
    `

    // Position tooltip above the button
    const buttonRect = button.getBoundingClientRect()
    const chartElement = this.chartApi?.chartElement()
    if (chartElement) {
      const chartRect = chartElement.getBoundingClientRect()

      tooltip.style.left = `${buttonRect.left - chartRect.left - tooltip.offsetWidth / 2 + button.offsetWidth / 2}px`
      tooltip.style.top = `${buttonRect.top - chartRect.top - tooltip.offsetHeight - 8}px`
    }

    // Append tooltip to chart element
    if (this.chartApi?.chartElement()) {
      this.chartApi.chartElement()!.appendChild(tooltip)

      // Store tooltip reference
      state.tooltipElement = tooltip

      // Show tooltip with animation
      setTimeout(() => {
        tooltip.style.opacity = '1'
      }, 10)
    }
  }

  /**
   * Hide tooltip
   */
  private hideTooltip(): void {
    this.paneStates.forEach(state => {
      if (state.tooltipElement && state.tooltipElement.parentNode) {
        state.tooltipElement.style.opacity = '0'
        setTimeout(() => {
          if (state.tooltipElement && state.tooltipElement.parentNode) {
            state.tooltipElement.parentNode.removeChild(state.tooltipElement)
            state.tooltipElement = undefined
          }
        }, 200)
      }
    })
  }

  /**
   * Toggle pane collapse state
   */
  private togglePaneCollapse(paneId: number): void {
    if (!this.chartApi) return

    const state = this.paneStates.get(paneId)
    if (!state) return

    try {
      if (state.isCollapsed) {
        // Expand the pane
        this.expandPane(paneId)
      } else {
        // Collapse the pane
        this.collapsePane(paneId)
      }
    } catch (error) {
      console.error(`Error toggling pane ${paneId} collapse state:`, error)
    }
  }

  /**
   * Preserve collapsed states during chart resize by re-applying stretch factors
   */
  private preserveCollapsedStates(): void {
    if (!this.chartApi) return

    for (const [paneId, state] of this.paneStates) {
      if (state.isCollapsed) {
        try {
          const panes = this.chartApi.panes()
          if (paneId < panes.length) {
            const pane = panes[paneId]
            const currentStretch = pane.getStretchFactor()

            // Re-apply minimal stretch factor if it's been lost
            if (currentStretch > 0.1) {
              console.log(`[PaneCollapse] Preserving collapsed state for pane ${paneId}`)
              pane.setStretchFactor(0.05)
            }
          }
        } catch (error) {
          console.error(
            `[PaneCollapse] Error preserving collapsed state for pane ${paneId}:`,
            error
          )
        }
      }
    }
  }

  /**
   * Collapse a pane to show only legend and button (TradingView-style: height=0px stops rendering)
   */
  private collapsePane(paneId: number): void {
    if (!this.chartApi) return

    const state = this.paneStates.get(paneId)
    if (!state || state.isCollapsed) return

    try {
      console.log(`[PaneCollapse] Collapsing pane ${paneId} using stretch factor approach`)

      // Store original stretch factor and pane size
      const panes = this.chartApi.panes()
      if (paneId >= panes.length) {
        console.error(`[PaneCollapse] Invalid pane ID ${paneId}`)
        return
      }

      const pane = panes[paneId]
      const currentStretchFactor = pane.getStretchFactor()
      const paneSize = this.chartApi.paneSize(paneId)

      // Store original values
      state.originalStretchFactor = currentStretchFactor
      if (paneSize) {
        state.originalHeight = paneSize.height
      }

      console.log(
        `[PaneCollapse] Storing stretch factor: ${currentStretchFactor}, height: ${paneSize?.height}px for pane ${paneId}`
      )

      // Collapse pane to minimal height (show only legends/buttons)
      const minimalStretchFactor = 0.05 // Very small but not 0 to keep pane active
      pane.setStretchFactor(minimalStretchFactor)

      // Update state
      state.isCollapsed = true
      state.collapsedHeight = 45 // Enough for legend and button

      console.log(`[PaneCollapse] Pane ${paneId} collapsed to minimal height`)

      // Trigger chart layout recalculation
      const chartElement = this.chartApi.chartElement()
      if (chartElement) {
        this.chartApi.resize(chartElement.clientWidth, chartElement.clientHeight)
      }

      // Update button text
      if (state.reactRoot) {
        state.reactRoot.render(
          React.createElement(CollapseButtonComponent, {
            paneId: paneId,
            isCollapsed: true,
            onClick: () => {
              this.togglePaneCollapse(paneId)
            },
            config: this.config
          })
        )
      }

      // Notify callback
      if (this.config.onPaneCollapse) {
        this.config.onPaneCollapse(paneId, true)
      }

      // Reposition button after collapse
      setTimeout(() => {
        this.positionButton(state.buttonElement, paneId)
      }, 100)
    } catch (error) {
      console.error(`Error collapsing pane ${paneId}:`, error)
    }
  }

  /**
   * Expand a pane to restore original size (TradingView-style: restore height to resume rendering)
   */
  private expandPane(paneId: number): void {
    if (!this.chartApi) return

    const state = this.paneStates.get(paneId)
    if (!state || !state.isCollapsed) return

    try {
      console.log(`[PaneCollapse] Expanding pane ${paneId} using stretch factor approach`)

      // Restore original stretch factor
      const panes = this.chartApi.panes()
      if (paneId >= panes.length) {
        console.error(`[PaneCollapse] Invalid pane ID ${paneId}`)
        return
      }

      const pane = panes[paneId]
      const originalStretchFactor = state.originalStretchFactor || 0.2 // Fallback

      console.log(
        `[PaneCollapse] Restoring stretch factor: ${originalStretchFactor} for pane ${paneId}`
      )

      // Restore original stretch factor
      pane.setStretchFactor(originalStretchFactor)

      // Update state
      state.isCollapsed = false

      // Trigger chart layout recalculation
      const chartElement = this.chartApi.chartElement()
      if (chartElement) {
        this.chartApi.resize(chartElement.clientWidth, chartElement.clientHeight)
      }

      // Wait a bit for layout to settle, then reposition the button
      setTimeout(() => {
        this.positionButton(state.buttonElement, paneId)
      }, 100)

      // Update button text
      // The button text is now managed by the CollapseButtonComponent
      // We need to re-render the component to update its text
      if (state.reactRoot) {
        state.reactRoot.render(
          React.createElement(CollapseButtonComponent, {
            paneId: paneId,
            isCollapsed: false,
            onClick: () => {
              this.togglePaneCollapse(paneId)
            },
            config: this.config
          })
        )
      }

      // Notify callback
      if (this.config.onPaneExpand) {
        this.config.onPaneExpand(paneId, false)
      }

      // Reposition button to stay anchored
      this.positionButton(state.buttonElement, paneId)
    } catch (error) {
      console.error(`Error expanding pane ${paneId}:`, error)
    }
  }

  /**
   * Capture the current state of all panes.
   * This is needed because when a pane is collapsed, its stretch factor is set to a very small value,
   * and we need to remember the original stretch factor to restore it.
   */
  private captureAllPaneStates(paneId: number): void {
    if (!this.chartApi) return

    try {
      // Get all panes
      const allPanes = this.chartApi.panes()
      const totalChartHeight = this.chartApi.chartElement()?.clientHeight || 600

      // Capture the state of ALL panes (not just the one being collapsed)
      allPanes.forEach((pane, index) => {
        const paneSize = this.chartApi.paneSize(index)
        if (paneSize) {
          // Store the actual height
          if (!this.paneStates.has(index)) {
            this.paneStates.set(index, {
              isCollapsed: false,
              originalHeight: 0,
              collapsedHeight: 45,
              buttonElement: document.createElement('div'), // Placeholder
              tooltipElement: undefined,
              reactRoot: undefined
            })
          }

          const state = this.paneStates.get(index)!
          state.originalHeight = paneSize.height

          // Calculate and store the stretch factor
          const stretchFactor = paneSize.height / totalChartHeight
          state.originalStretchFactor = stretchFactor
        }
      })
    } catch (error) {
      console.error(`Error capturing pane states:`, error)
    }
  }

  /**
   * Update button positions during pane resizing
   */
  private updateButtonPositions(): void {
    if (!this.chartApi) return

    this.paneStates.forEach((state, paneId) => {
      if (state.buttonElement) {
        this.positionButton(state.buttonElement, paneId)
      }
    })
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
