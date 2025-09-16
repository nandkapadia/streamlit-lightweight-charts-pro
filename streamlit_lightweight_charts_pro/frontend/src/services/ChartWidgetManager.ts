import { IChartApi } from 'lightweight-charts'
import { CornerLayoutManager } from './CornerLayoutManager'
import { ChartCoordinateService } from './ChartCoordinateService'
import { RangeSwitcherConfig, LegendConfig } from '../types'

/**
 * ChartWidgetManager - Centralized management for all chart widgets
 *
 * This service integrates the CornerLayoutManager with chart lifecycle
 * and provides a unified API for adding/removing widgets.
 */
export class ChartWidgetManager {
  private static instances: Map<string, ChartWidgetManager> = new Map()

  private chart: IChartApi
  private chartId: string
  private layoutManager: CornerLayoutManager
  private coordinateService: ChartCoordinateService
  private widgetContainers: Map<string, HTMLElement> = new Map()
  private reactRoots: Map<string, any> = new Map()

  private constructor(chart: IChartApi, chartId: string) {
    this.chart = chart
    this.chartId = chartId
    this.layoutManager = CornerLayoutManager.getInstance(chartId, 0) // Use pane 0 for chart-level widgets like range switcher
    this.coordinateService = ChartCoordinateService.getInstance()

    this.setupLayoutManagerIntegration()
  }

  /**
   * Get or create widget manager for a chart
   */
  public static getInstance(chart: IChartApi, chartId: string): ChartWidgetManager {
    if (!ChartWidgetManager.instances.has(chartId)) {
      ChartWidgetManager.instances.set(chartId, new ChartWidgetManager(chart, chartId))
    }
    return ChartWidgetManager.instances.get(chartId)!
  }

  /**
   * Clean up widget manager for a chart
   */
  public static cleanup(chartId: string): void {
    const instance = ChartWidgetManager.instances.get(chartId)
    if (instance) {
      instance.destroy()
      ChartWidgetManager.instances.delete(chartId)
    }

    // Also cleanup the layout manager for this chart
    CornerLayoutManager.cleanup(chartId)
  }

  /**
   * Setup integration between chart and layout manager
   */
  private setupLayoutManagerIntegration(): void {
    // Configure layout manager with sensible defaults
    this.layoutManager.configure({
      edgePadding: 8,
      widgetGap: 8,
      baseZIndex: 1000
    })

    // Set chart API reference for pane-specific positioning
    this.layoutManager.setChartApi(this.chart)

    // Setup automatic dimension updates
    this.coordinateService.setupLayoutManagerIntegration(this.chart, this.layoutManager)

    // Handle layout changes
    this.layoutManager.on({
      onLayoutChanged: (corner, widgets) => {
        // Optional: Handle layout change events
      },
      onOverflow: (corner, overflowingWidgets) => {
        console.warn(`Widget overflow in ${corner}:`, overflowingWidgets.map(w => w.id))
      }
    })
  }

  /**
   * Add range switcher with layout management
   */
  public async addRangeSwitcher(config: RangeSwitcherConfig): Promise<{ destroy: () => void }> {
    const containerId = `range-switcher-${this.chartId}`

    try {
      const chartElement = this.chart.chartElement()
      if (!chartElement) {
        throw new Error('Chart element not available')
      }

      // Create container
      const container = this.createWidgetContainer(containerId)
      chartElement.appendChild(container)

      // Dynamic import and render
      const { createRoot } = await import('react-dom/client')
      const { RangeSwitcherComponent } = await import('../components/RangeSwitcherComponent')

      const reactRoot = createRoot(container)
      const React = await import('react')

      reactRoot.render(
        React.createElement(RangeSwitcherComponent, {
          chart: this.chart,
          config: config,
          layoutManager: this.layoutManager,
          onRangeChange: (range: { text: string; seconds: number | null }) => {
            // Optional: Handle range change events
          }
        })
      )

      // Store references for cleanup
      this.widgetContainers.set(containerId, container)
      this.reactRoots.set(containerId, reactRoot)

      // Return cleanup function
      return {
        destroy: () => this.destroyWidget(containerId)
      }

    } catch (error) {
      console.error('Error adding RangeSwitcher:', error)
      return { destroy: () => {} }
    }
  }

  /**
   * Add legend with layout management
   */
  public async addLegend(config: LegendConfig, isPanePrimitive: boolean = false, paneId: number = 0, seriesReference?: any): Promise<{ destroy: () => void }> {
    const containerId = `legend-${this.chartId}-${Date.now()}`

    try {
      const chartElement = this.chart.chartElement()
      if (!chartElement) {
        throw new Error('Chart element not available')
      }

      // Create container
      const container = this.createWidgetContainer(containerId)
      chartElement.appendChild(container)

      // Dynamic import and render
      const { createRoot } = await import('react-dom/client')
      const { LegendComponent } = await import('../components/LegendComponent')

      const reactRoot = createRoot(container)
      const React = await import('react')

      // Get layout manager for the specific pane
      const { CornerLayoutManager } = await import('./CornerLayoutManager')
      const paneLayoutManager = CornerLayoutManager.getInstance(this.chartId, paneId)
      paneLayoutManager.setChartApi(this.chart)

      // Ensure pane-specific layout manager gets chart dimensions
      this.coordinateService.setupLayoutManagerIntegration(this.chart, paneLayoutManager)

      reactRoot.render(
        React.createElement(LegendComponent, {
          legendConfig: config,
          isPanePrimitive: isPanePrimitive,
          layoutManager: paneLayoutManager
        })
      )

      // Store references for cleanup
      this.widgetContainers.set(containerId, container)
      this.reactRoots.set(containerId, reactRoot)

      // Store series reference for crosshair value updates
      if (seriesReference) {
        (container as any)._seriesReference = seriesReference
      }

      // IMPORTANT: Register legend container for $$value$$ updates
      // The updateLegendValues function in LightweightCharts.tsx looks for legends
      // in window.legendElementsRef to update $$value$$ placeholders
      setTimeout(() => {
        try {
          // Find the actual legend element inside the container
          const legendElement = container.querySelector('[role="img"]') as HTMLElement
          if (legendElement && (window as any).legendElementsRef) {
            // Register with the same key pattern used by updateLegendValues
            const legendKey = `${this.chartId}-pane-${paneId}`

            if (!(window as any).legendElementsRef.current) {
              (window as any).legendElementsRef.current = new Map()
            }

            (window as any).legendElementsRef.current.set(legendKey, container)
          }
        } catch (error) {
          console.warn('Failed to register legend for $$value$$ updates:', error)
        }
      }, 100) // Small delay to ensure DOM is ready

      // Return cleanup function
      return {
        destroy: () => this.destroyWidget(containerId)
      }

    } catch (error) {
      console.error('Error adding Legend:', error)
      return { destroy: () => {} }
    }
  }

  /**
   * Add collapse button with layout management
   */
  public async addCollapseButton(
    paneId: number,
    isCollapsed: boolean,
    onClick: () => void,
    config: any = {}
  ): Promise<{ destroy: () => void; updateState: (collapsed: boolean) => void }> {
    const containerId = `collapse-button-${this.chartId}-${paneId}`

    try {
      const chartElement = this.chart.chartElement()
      if (!chartElement) {
        throw new Error('Chart element not available')
      }

      // Create container
      const container = this.createWidgetContainer(containerId)
      chartElement.appendChild(container)

      // Dynamic import and render
      const { createRoot } = await import('react-dom/client')
      const { CollapseButtonComponent } = await import('../components/CollapseButtonComponent')

      const reactRoot = createRoot(container)
      const React = await import('react')

      // Get layout manager for the specific pane
      const { CornerLayoutManager } = await import('./CornerLayoutManager')
      const paneLayoutManager = CornerLayoutManager.getInstance(this.chartId, paneId)
      paneLayoutManager.setChartApi(this.chart)

      // Ensure pane-specific layout manager gets chart dimensions
      this.coordinateService.setupLayoutManagerIntegration(this.chart, paneLayoutManager)

      let currentProps = { paneId, isCollapsed, onClick, config, layoutManager: paneLayoutManager }

      const renderComponent = () => {
        reactRoot.render(
          React.createElement(CollapseButtonComponent, currentProps)
        )
      }

      renderComponent()

      // Store references for cleanup
      this.widgetContainers.set(containerId, container)
      this.reactRoots.set(containerId, reactRoot)

      // Return cleanup and update functions
      return {
        destroy: () => this.destroyWidget(containerId),
        updateState: (collapsed: boolean) => {
          currentProps = { ...currentProps, isCollapsed: collapsed, layoutManager: paneLayoutManager }
          renderComponent()
        }
      }

    } catch (error) {
      console.error('Error adding CollapseButton:', error)
      return {
        destroy: () => {},
        updateState: () => {}
      }
    }
  }

  /**
   * Create a widget container with proper styling
   */
  private createWidgetContainer(id: string): HTMLDivElement {
    const container = document.createElement('div')
    container.id = id
    container.className = 'chart-widget-container'
    container.style.position = 'absolute'
    container.style.top = '0'
    container.style.left = '0'
    container.style.width = '100%'
    container.style.height = '100%'
    container.style.pointerEvents = 'none'
    container.style.zIndex = '1000'

    return container
  }

  /**
   * Destroy a specific widget
   */
  private destroyWidget(containerId: string): void {
    try {
      // Cleanup React root
      const reactRoot = this.reactRoots.get(containerId)
      if (reactRoot) {
        reactRoot.unmount()
        this.reactRoots.delete(containerId)
      }

      // Remove container
      const container = this.widgetContainers.get(containerId)
      if (container && container.parentNode) {
        container.parentNode.removeChild(container)
        this.widgetContainers.delete(containerId)
      }

    } catch (error) {
      console.error(`Error destroying widget ${containerId}:`, error)
    }
  }

  /**
   * Update legend values with crosshair data
   */
  public updateLegendValues(crosshairData: { time: any; seriesData: Map<any, any> }): void {
    try {
      // Get all legend widgets and update their values
      this.widgetContainers.forEach((container, containerId) => {
        if (!containerId.startsWith('legend-')) {
          return
        }

        // Find the legend component instance
        const legendElement = container.querySelector('[role="img"]') as HTMLElement
        if (!legendElement) {
          return
        }

        let displayValue = ''

        if (crosshairData.time && crosshairData.seriesData.size > 0) {
          // Get the series reference stored when legend was created
          const seriesReference = (container as any)._seriesReference

          if (seriesReference && crosshairData.seriesData.has(seriesReference)) {
            // Use the specific series value for this legend
            const seriesValue = crosshairData.seriesData.get(seriesReference)
            displayValue = this.formatLegendValue(seriesValue)
          } else {
            // Enhanced fallback strategy: try multiple approaches to find the right series
            let foundValue = null
            const availableSeries = Array.from(crosshairData.seriesData.entries())

            // Strategy 1: Try to match by index if the container ID suggests an order
            const containerMatch = containerId.match(/legend-.*-(\d+)$/)
            if (containerMatch && !foundValue) {
              const possibleIndex = parseInt(containerMatch[1], 10) % availableSeries.length
              if (possibleIndex >= 0 && possibleIndex < availableSeries.length) {
                foundValue = availableSeries[possibleIndex][1]
              }
            }

            // Strategy 2: If we have exactly the same number of legends as series, use round-robin
            if (!foundValue && availableSeries.length > 0) {
              // Extract any numeric identifier from container ID for round-robin
              const numMatch = containerId.match(/(\d+)/)
              const containerNum = numMatch ? parseInt(numMatch[1], 10) : 0
              const seriesIndex = containerNum % availableSeries.length
              foundValue = availableSeries[seriesIndex][1]
            }

            // Strategy 3: Default to first available series
            if (!foundValue && availableSeries.length > 0) {
              foundValue = availableSeries[0][1]
            }

            displayValue = this.formatLegendValue(foundValue)
          }

          // Store the value on the element for the widget to pick up
          ;(legendElement as any)._crosshairValue = displayValue
        } else {
          // Clear value when crosshair is not on chart
          ;(legendElement as any)._crosshairValue = null
        }

        // Trigger a custom event for the legend widget to update
        legendElement.dispatchEvent(new CustomEvent('crosshairValueUpdate'))
      })
    } catch (error) {
      console.warn('Error updating legend values:', error)
    }
  }

  /**
   * Format legend value for display
   */
  private formatLegendValue(seriesValue: any): string {
    if (!seriesValue) return ''

    // Handle different series data structures
    if (typeof seriesValue === 'object') {
      // Candlestick data
      if (seriesValue.close !== undefined) return seriesValue.close.toFixed(2)
      if (seriesValue.value !== undefined) return seriesValue.value.toFixed(2)
      if (seriesValue.high !== undefined) return seriesValue.high.toFixed(2)
    }

    // Simple numeric value
    if (typeof seriesValue === 'number') return seriesValue.toFixed(2)

    return String(seriesValue)
  }

  /**
   * Destroy all widgets for this chart
   */
  public destroy(): void {
    // Destroy all widgets
    for (const containerId of this.widgetContainers.keys()) {
      this.destroyWidget(containerId)
    }

    // Clear references
    this.widgetContainers.clear()
    this.reactRoots.clear()
  }

  /**
   * Get layout manager instance (for advanced usage)
   */
  public getLayoutManager(): CornerLayoutManager {
    return this.layoutManager
  }

  /**
   * Get coordinate service instance (for advanced usage)
   */
  public getCoordinateService(): ChartCoordinateService {
    return this.coordinateService
  }
}