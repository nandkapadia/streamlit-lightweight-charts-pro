/**
 * Legend Pane Primitive
 * Provides legend functionality as a pane primitive (like minimize buttons)
 */

import React from 'react'
import {createRoot} from 'react-dom/client'
import {IChartApi, IPanePrimitive, PaneAttachedParameter, Time} from 'lightweight-charts'
import {LegendComponent} from '../../components/LegendComponent'
import {ChartCoordinateService} from '../../services/ChartCoordinateService'
import {LegendConfig} from '../../types'

/**
 * Legend state management
 */
interface LegendState {
  legendElement: HTMLElement
  reactRoot: ReturnType<typeof createRoot>
  paneId: number
  seriesIndex: number
  chartId: string
  currentValue: any
}

/**
 * Legend Pane Primitive using Pane Primitives (like minimize buttons)
 */
export class LegendPanePrimitive implements IPanePrimitive<Time> {
  private _paneViews: any[]
  private chartApi: IChartApi | null = null
  private paneId: number
  private seriesIndex: number
  private chartId: string
  private config: LegendConfig
  private legendState: LegendState | null = null
  private coordinateService: ChartCoordinateService

  constructor(
    paneId: number,
    seriesIndex: number,
    chartId: string,
    config: LegendConfig,
    seriesData?: any
  ) {
    this._paneViews = []
    this.paneId = paneId
    this.seriesIndex = seriesIndex
    this.chartId = chartId
    this.config = config
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
              // This gets called during pane resizing (like minimize buttons)
              // Update legend position for smooth movement
              if (this.chartApi && this.legendState) {
                requestAnimationFrame(() => {
                  this.positionLegend()
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
   * Initialize the primitive with chart
   */
  attached(param: PaneAttachedParameter<Time>): void {
    this.chartApi = param.chart
    this.createLegend()
  }

  /**
   * Cleanup resources
   */
  detached(): void {
    if (this.legendState) {
      // Unmount React component
      this.legendState.reactRoot.unmount()

      // Remove from DOM
      if (this.legendState.legendElement.parentNode) {
        this.legendState.legendElement.parentNode.removeChild(this.legendState.legendElement)
      }

      this.legendState = null
    }

    // Reset chart API
    this.chartApi = null
  }

  /**
   * Create legend element (like minimize buttons do)
   */
  private createLegend(): void {
    if (!this.chartApi || !this.config.visible) return

    // Get chart element (like minimize buttons do)
    const chartElement = this.chartApi.chartElement()
    if (!chartElement) {
      console.warn(`[LegendPrimitive] Chart element not available for series ${this.seriesIndex}`)
      return
    }

    // Create legend container (like minimize buttons do)
    const legendContainer = document.createElement('div')
    legendContainer.className = `pane-legend-container-${this.chartId}-${this.seriesIndex}`
    legendContainer.style.position = 'absolute'
    legendContainer.style.zIndex = (this.config.zIndex || 1000).toString()
    legendContainer.style.pointerEvents = 'none'
    legendContainer.setAttribute('data-debug', 'legend')
    legendContainer.setAttribute('data-pane-id', this.paneId.toString())
    legendContainer.setAttribute('data-chart-id', this.chartId)
    legendContainer.setAttribute('data-series-index', this.seriesIndex.toString())

    try {
      // Append legend container to chart element (like minimize buttons do)
      chartElement.appendChild(legendContainer)

      // Create React root and render legend component (like minimize buttons do)
      const reactRoot = createRoot(legendContainer)
      console.log(`[LegendPanePrimitive] Creating LegendComponent with isPanePrimitive: true`)

      // Process legend config to replace $$value$$ with blank initially
      const processedConfig = {...this.config}
      if (processedConfig.text && processedConfig.text.includes('$$value$$')) {
        processedConfig.text = processedConfig.text.replace(/\$\$value\$\$/g, '')
      }

      reactRoot.render(
        React.createElement(LegendComponent, {
          legendConfig: processedConfig,
          isPanePrimitive: true // Flag to indicate this is used as a pane primitive
        })
      )

      // Store legend state
      this.legendState = {
        legendElement: legendContainer,
        reactRoot: reactRoot,
        paneId: this.paneId,
        seriesIndex: this.seriesIndex,
        chartId: this.chartId,
        currentValue: null
      }

      // Position the legend (like minimize buttons do)
      this.positionLegend()
    } catch (error) {
      console.error(
        `❌ [LegendPrimitive] Error creating legend for series ${this.seriesIndex}:`,
        error
      )
    }
  }

  /**
   * Position legend using the exact same pattern as minimize buttons
   */
  private positionLegend(): void {
    if (!this.chartApi || !this.legendState) return

    try {
      // Use the same coordinate service approach as minimize buttons
      const paneCoords = this.coordinateService.getPaneCoordinates(this.chartApi, this.paneId)

      if (!paneCoords) {
        console.warn(
          `[LegendPrimitive] Pane coordinates not available for pane ${this.paneId}, retrying...`
        )
        // Simple retry like minimize buttons do - retry after 100ms, but limit retries
        const retryCount = (this.legendState.legendElement as any).__retryCount || 0
        if (retryCount < 5) {
          ;(this.legendState.legendElement as any).__retryCount = retryCount + 1
          setTimeout(() => this.positionLegend(), 100)
        } else {
          console.warn(
            `[LegendPrimitive] Max retries reached for pane ${this.paneId}, using fallback positioning`
          )
          // Use fallback positioning
          this.legendState.legendElement.style.top = '10px'
          this.legendState.legendElement.style.left = '10px'
        }
        return
      }

      // Calculate position relative to pane using configuration (exactly like minimize buttons)
      const margin = this.config.margin || 8
      let top: number, left: number

      // Position based on legend config
      if (this.config.position?.includes('right')) {
        left =
          paneCoords.bounds.right - (this.legendState.legendElement.offsetWidth || 200) - margin
      } else if (this.config.position?.includes('center')) {
        left =
          paneCoords.bounds.left +
          (paneCoords.bounds.width - (this.legendState.legendElement.offsetWidth || 200)) / 2
      } else {
        left = paneCoords.bounds.left + margin
      }

      if (this.config.position?.includes('bottom')) {
        top =
          paneCoords.bounds.bottom - (this.legendState.legendElement.offsetHeight || 40) - margin
      } else if (this.config.position?.includes('center')) {
        top =
          paneCoords.bounds.top +
          (paneCoords.bounds.height - (this.legendState.legendElement.offsetHeight || 40)) / 2
      } else {
        // Simple height-based positioning: query existing legends for their heights
        // Get all existing legends in this pane from the global registry
        const existingLegends = (window as any).legendPrimitives || {}

        // Find all legends in this pane that have been created before this one
        const previousLegends = Object.values(existingLegends).filter(
          (primitive: any) =>
            primitive.chartId === this.chartId &&
            primitive.paneId === this.paneId &&
            primitive.seriesIndex < this.seriesIndex
        ) as LegendPanePrimitive[]

        // Calculate position based on legend index with proper stacking
        const verticalSpacing = 4 // 4px spacing between legends

        // Calculate cumulative height of all previous legends using actual heights
        let cumulativeHeight = 0
        for (const previousLegend of previousLegends) {
          const actualHeight = previousLegend.getHeight()
          if (actualHeight > 0) {
            cumulativeHeight += actualHeight + verticalSpacing
          } else {
            // Fallback to estimated height if getHeight() returns 0 (legend not yet rendered)
            cumulativeHeight += 40 + verticalSpacing
          }
        }

        console.log(`[Legend ${this.seriesIndex}] Height calculation:`, {
          previousLegendsCount: previousLegends.length,
          cumulativeHeight,
          individualHeights: previousLegends.map((legend, idx) => ({
            seriesIndex: legend.seriesIndex,
            height: legend.getHeight()
          }))
        })

        // Position this legend
        top = paneCoords.bounds.top + margin + cumulativeHeight

        // Use simple cumulative height calculation without setTimeout refinement
        // This ensures stable positioning without delayed updates
      }

      // Check if legend would overflow outside pane bounds (for all position types)
      const currentLegendHeight = this.legendState.legendElement.offsetHeight || 40
      const legendBottom = top + currentLegendHeight
      const isWithinBounds = legendBottom <= paneCoords.bounds.bottom

      console.log(`[Legend ${this.seriesIndex}] Bounds check:`, {
        calculatedTop: top,
        currentLegendHeight,
        legendBottom,
        paneBounds: {
          top: paneCoords.bounds.top,
          bottom: paneCoords.bounds.bottom,
          height: paneCoords.bounds.height
        },
        isWithinBounds,
        willHide: !isWithinBounds
      })

      // Apply positioning and visibility based on bounds check
      if (isWithinBounds) {
        // Legend fits within pane bounds - show it
        this.legendState.legendElement.style.display = 'block'
        this.legendState.legendElement.style.top = `${top}px`
        this.legendState.legendElement.style.left = `${left}px`
        this.legendState.legendElement.style.position = 'absolute'
        this.legendState.legendElement.style.zIndex = (this.config.zIndex || 1000).toString()
      } else {
        // Legend would overflow outside pane bounds - hide it completely
        this.legendState.legendElement.style.display = 'none'
        console.log(`[Legend ${this.seriesIndex}] Hidden - would overflow pane bounds`)
      }

      console.log(`[Legend ${this.seriesIndex}] Coordinates:`, {
        top: `${top}px`,
        left: `${left}px`,
        paneTop: paneCoords.bounds.top,
        paneBottom: paneCoords.bounds.bottom,
        margin: margin
      })
    } catch (error) {
      console.warn(`Failed to position legend for pane ${this.paneId}:`, error)
      // Simple fallback positioning (exactly like minimize buttons)
      if (this.legendState) {
        this.legendState.legendElement.style.top = '10px'
        this.legendState.legendElement.style.left = '10px'
      }
    }
  }

  /**
   * Get the current height of this legend
   */
  public getHeight(): number {
    if (!this.legendState?.legendElement) {
      console.log(`[Legend ${this.seriesIndex}] getHeight: No legend element, returning 0`)
      return 0
    }

    const element = this.legendState.legendElement
    const rect = element.getBoundingClientRect()

    // Try multiple methods to get height
    const offsetHeight = element.offsetHeight
    const clientHeight = element.clientHeight
    const scrollHeight = element.scrollHeight

    console.log(`[Legend ${this.seriesIndex}] getHeight:`, {
      boundingRect: {height: rect.height, width: rect.width, top: rect.top, left: rect.left},
      offsetHeight,
      clientHeight,
      scrollHeight,
      element: element.className,
      computedStyle: window.getComputedStyle(element).height
    })

    // Use the first non-zero height we find
    if (rect.height > 0) return rect.height
    if (offsetHeight > 0) return offsetHeight
    if (clientHeight > 0) return clientHeight
    if (scrollHeight > 0) return scrollHeight

    // Fallback to estimated height
    return 40
  }

  /**
   * Get the current position of this legend
   */
  public getPosition(): {top: number; left: number} {
    if (!this.legendState?.legendElement) {
      return {top: 0, left: 0}
    }

    const rect = this.legendState.legendElement.getBoundingClientRect()
    return {top: rect.top, left: rect.left}
  }

  /**
   * Get the current bottom position of this legend (top + height)
   */
  public getBottomPosition(): number {
    const position = this.getPosition()
    const height = this.getHeight()
    return position.top + height
  }

  /**
   * Update legend value (for dynamic value replacement)
   */
  public updateValue(newValue: any): void {
    if (!this.legendState || !this.config.text) {
      return
    }

    // Check if the legend text contains $$value$$ placeholder
    if (this.config.text.includes('$$value$$')) {
      // Replace $$value$$ with the new value, applying proper formatting
      let displayValue = '' // Show blank when no crosshair data
      if (newValue !== null && newValue !== undefined && newValue !== '') {
        if (typeof newValue === 'number') {
          // Use the specified value format or default to 2 decimal places
          const format = this.config.valueFormat || '.2f'
          if (format.includes('.') && format.includes('f')) {
            // Extract decimal part before 'f' (e.g., '.12f' -> '12')
            const decimalPart = format.split('.')[1].split('f')[0]
            const decimals = decimalPart ? parseInt(decimalPart) : 2
            displayValue = newValue.toFixed(decimals)
          } else {
            displayValue = newValue.toFixed(2)
          }
        } else {
          displayValue = String(newValue)
        }
      }

      const updatedText = this.config.text.replace(/\$\$value\$\$/g, displayValue)

      // Update the legend state
      this.legendState.currentValue = newValue

      // Update the text content directly without re-rendering the entire component
      if (this.legendState.legendElement) {
        const textElement = this.legendState.legendElement.querySelector('[data-legend-text]')
        if (textElement) {
          textElement.innerHTML = updatedText
        } else {
          // Fallback: update the entire legend element content
          this.legendState.legendElement.innerHTML = updatedText
        }
      }
    }
  }

  /**
   * Called when the pane is resized - reposition the legend
   */
  public updateAllViews(): void {
    console.log(`[Legend ${this.seriesIndex}] updateAllViews called - repositioning legend`)
    this.positionLegend()
  }
}

export function createLegendPanePrimitive(
  paneId: number,
  seriesIndex: number,
  chartId: string,
  config: LegendConfig,
  seriesData?: any
): LegendPanePrimitive {
  return new LegendPanePrimitive(paneId, seriesIndex, chartId, config, seriesData)
}
