/**
 * Pane Collapse/Expand Plugin
 * Provides TradingView-style pane collapse and expand functionality using ChartWidgetManager
 */

import {IChartApi, IPanePrimitive, PaneAttachedParameter, Time} from 'lightweight-charts'
import {PaneCollapseConfig} from '../../types'
import {ChartWidgetManager} from '../../services/ChartWidgetManager'

/**
 * Pane state management
 */
interface PaneState {
  isCollapsed: boolean
  originalHeight: number
  collapsedHeight: number
  originalStretchFactor?: number
  collapseButtonWidget?: { destroy: () => void; updateState: (collapsed: boolean) => void }
}

/**
 * Pane Collapse Plugin using ChartWidgetManager
 */
export class PaneCollapsePlugin implements IPanePrimitive<Time> {
  private _paneViews: any[]
  private chartApi: IChartApi | null = null
  private paneId: number
  private config: PaneCollapseConfig
  private paneStates = new Map<number, PaneState>()
  private widgetManager: ChartWidgetManager | null = null
  private chartId: string

  constructor(paneId: number, config: PaneCollapseConfig = {}) {
    this._paneViews = []
    this.paneId = paneId
    this.chartId = '' // Will be set when attached
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
              // React components will handle repositioning automatically
              // No manual positioning needed
            }
          })
        }
      ]
    }
    return this._paneViews
  }

  /**
   * Initialize the plugin with chart using ChartWidgetManager
   */
  attached(param: PaneAttachedParameter<Time>): void {
    this.chartApi = param.chart

    if (this.chartApi) {
      const chartElement = this.chartApi.chartElement()
      if (chartElement && chartElement.id) {
        this.chartId = chartElement.id
        this.widgetManager = ChartWidgetManager.getInstance(this.chartApi, this.chartId)
        this.setupPaneCollapse()
      }
    }
  }

  /**
   * Cleanup resources using ChartWidgetManager
   */
  detached(): void {
    // Cleanup collapse button widgets
    this.paneStates.forEach(state => {
      if (state.collapseButtonWidget) {
        state.collapseButtonWidget.destroy()
      }
    })

    // Clear pane states
    this.paneStates.clear()

    // Reset references
    this.chartApi = null
    this.widgetManager = null
  }

  /**
   * Setup pane collapse functionality using ChartWidgetManager
   */
  private async setupPaneCollapse(): Promise<void> {
    if (!this.chartApi || !this.config.enabled || !this.widgetManager) return

    // Create collapse button using ChartWidgetManager
    try {
      const collapseButtonWidget = await this.widgetManager.addCollapseButton(
        this.paneId,
        false, // initial collapsed state
        () => this.togglePaneCollapse(this.paneId),
        this.config
      )

      // Store widget reference
      if (!this.paneStates.has(this.paneId)) {
        this.paneStates.set(this.paneId, {
          isCollapsed: false,
          originalHeight: 0,
          collapsedHeight: 45,
          collapseButtonWidget: collapseButtonWidget
        })
      } else {
        this.paneStates.get(this.paneId)!.collapseButtonWidget = collapseButtonWidget
      }

    } catch (error) {
      console.error('Error setting up pane collapse:', error)
    }
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
        this.expandPane(paneId)
      } else {
        this.collapsePane(paneId)
      }
    } catch (error) {
      console.error('Error toggling pane collapse:', error)
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
            if (currentStretch > 0.2) {
              pane.setStretchFactor(0.15)
            }
          }
        } catch (error) {
          // Error preserving collapsed state
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


      // Store original stretch factor and pane size
      const panes = this.chartApi.panes()
      if (paneId >= panes.length) {

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


      // Collapse pane to minimal height (show only legends/buttons)
      const minimalStretchFactor = 0.15 // Small but visible for collapsed state
      pane.setStretchFactor(minimalStretchFactor)

      // Hide canvas elements for collapsed pane
      this.setCanvasVisibility(paneId, false)

      // Update state
      state.isCollapsed = true
      state.collapsedHeight = 45 // Enough for legend and button

      // Trigger chart layout recalculation
      const chartElement = this.chartApi.chartElement()
      if (chartElement) {
        this.chartApi.resize(chartElement.clientWidth, chartElement.clientHeight)
      }

      // Update button state through widget manager
      if (state.collapseButtonWidget) {
        state.collapseButtonWidget.updateState(true)
      }

      // Notify callback
      if (this.config.onPaneCollapse) {
        this.config.onPaneCollapse(paneId, true)
      }
    } catch (error) {

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


      // Restore original stretch factor
      const panes = this.chartApi.panes()
      if (paneId >= panes.length) {

        return
      }

      const pane = panes[paneId]
      const originalStretchFactor = state.originalStretchFactor || 0.2 // Fallback



      // Restore original stretch factor
      pane.setStretchFactor(originalStretchFactor)

      // Show canvas elements for expanded pane
      this.setCanvasVisibility(paneId, true)

      // Update state
      state.isCollapsed = false

      // Trigger chart layout recalculation
      const chartElement = this.chartApi.chartElement()
      if (chartElement) {
        this.chartApi.resize(chartElement.clientWidth, chartElement.clientHeight)
      }

      // Update button state through widget manager
      if (state.collapseButtonWidget) {
        state.collapseButtonWidget.updateState(false)
      }

      // Notify callback
      if (this.config.onPaneExpand) {
        this.config.onPaneExpand(paneId, false)
      }
    } catch (error) {

    }
  }


  /**
   * Set canvas visibility and pane height for a specific pane
   */
  private setCanvasVisibility(paneId: number, visible: boolean): void {
    if (!this.chartApi) return

    try {
      // Get the specific pane from the API
      const panes = this.chartApi.panes()
      if (paneId >= panes.length) return

      const pane = panes[paneId]
      const paneElement = pane.getHTMLElement()

      if (!paneElement) return

      // Set pane container height when collapsing/expanding
      if (!visible) {
        // Collapsed: set height to 30px
        paneElement.style.height = '30px'
        paneElement.style.minHeight = '30px'
        paneElement.style.maxHeight = '30px'
      } else {
        // Expanded: restore original height
        paneElement.style.height = ''
        paneElement.style.minHeight = ''
        paneElement.style.maxHeight = ''
      }

      // Find all canvas elements within this specific pane
      const canvases = paneElement.querySelectorAll('canvas')

      canvases.forEach((canvas) => {
        const canvasElement = canvas as HTMLCanvasElement
        if (visible) {
          canvasElement.style.visibility = ''
          canvasElement.style.display = ''
          canvasElement.removeAttribute('aria-hidden')
        } else {
          canvasElement.style.visibility = 'hidden'
          canvasElement.style.display = 'none'
          canvasElement.setAttribute('aria-hidden', 'true')
        }
      })
    } catch (error) {
      // Silently handle canvas visibility errors
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
