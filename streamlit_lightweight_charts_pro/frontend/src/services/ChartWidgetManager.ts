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
  private static containerIdCounter: number = 0

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
    ChartWidgetManager.containerIdCounter++
    const containerId = `legend-${this.chartId}-${ChartWidgetManager.containerIdCounter}`

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

      // Store series reference and legend config for crosshair value updates
      if (seriesReference) {
        (container as any)._seriesReference = seriesReference
      }
      (container as any)._legendConfig = config

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
      // Collect all legend containers for consistent ordering
      const legendContainers = Array.from(this.widgetContainers.entries())
        .filter(([containerId]) => containerId.startsWith('legend-'))
        .sort(([a], [b]) => a.localeCompare(b)) // Sort by container ID for consistent order

      // Convert series data to consistent array
      const availableSeries = Array.from(crosshairData.seriesData.entries())

      // Process each legend container
      legendContainers.forEach(([containerId, container], legendIndex) => {
        // Find the legend component instance
        const legendElement = container.querySelector('[role="img"]') as HTMLElement
        if (!legendElement) {
          return
        }

        // Get legend template and format from stored configuration
        const legendConfig = (container as any)._legendConfig
        const template = legendConfig?.text || '$$value$$'
        const format = legendConfig?.valueFormat || legendConfig?.value_format || '.2f'

        let processedTemplate = ''

        if (crosshairData.time && crosshairData.seriesData.size > 0) {
          // Get the series reference stored when legend was created
          const seriesReference = (container as any)._seriesReference

          let seriesValue
          if (seriesReference && crosshairData.seriesData.has(seriesReference)) {
            // Use the specific series value for this legend
            seriesValue = crosshairData.seriesData.get(seriesReference)
          } else {
            // Improved strategy: Map legends to series by order
            // This ensures consistent mapping regardless of container IDs or timestamps
            if (legendIndex < availableSeries.length) {
              seriesValue = availableSeries[legendIndex][1]
            } else {
              // If we have more legends than series, use modulo to wrap around
              const seriesIndex = legendIndex % availableSeries.length
              seriesValue = availableSeries[seriesIndex][1]
            }
          }

          // Format the legend using the smart placeholder system
          if (seriesValue) {
            processedTemplate = this.formatLegendValue(seriesValue, template, format)
          }

          // Store the processed template on the element for the widget to pick up
          ;(legendElement as any)._processedTemplate = processedTemplate
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
   * Extract specific value from series data based on placeholder
   */
  private extractValueByPlaceholder(seriesValue: any, placeholder: string, format: string): string {
    if (!seriesValue) return ''

    let extractedValue: number | undefined

    switch (placeholder) {
      case '$$open$$':
        extractedValue = seriesValue.open
        break
      case '$$high$$':
        extractedValue = seriesValue.high
        break
      case '$$low$$':
        extractedValue = seriesValue.low
        break
      case '$$close$$':
        extractedValue = seriesValue.close
        break
      case '$$value$$':
        // Smart fallback for $$value$$ based on series data structure
        if (seriesValue.close !== undefined) {
          // Candlestick series - use close
          extractedValue = seriesValue.close
        } else if (seriesValue.value !== undefined) {
          // Line/Area series - use value
          extractedValue = seriesValue.value
        } else if (seriesValue.middle !== undefined) {
          // Band series - use middle
          extractedValue = seriesValue.middle
        } else if (seriesValue.upper !== undefined && seriesValue.lower !== undefined) {
          // Ribbon series - use average of upper and lower
          extractedValue = (seriesValue.upper + seriesValue.lower) / 2
        } else if (seriesValue.high !== undefined) {
          // Fallback to high if available
          extractedValue = seriesValue.high
        }
        break
      case '$$upper$$':
        extractedValue = seriesValue.upper
        break
      case '$$middle$$':
        extractedValue = seriesValue.middle
        break
      case '$$lower$$':
        extractedValue = seriesValue.lower
        break
      case '$$volume$$':
        extractedValue = seriesValue.volume
        break
      default:
        // Unknown placeholder
        return ''
    }

    if (extractedValue !== undefined) {
      return this.formatNumericValue(extractedValue, format)
    }

    return ''
  }

  /**
   * Format numeric value according to format specification
   */
  private formatNumericValue(value: number, format: string): string {
    if (format.includes('.') && format.includes('f')) {
      // Extract decimal part before 'f' (e.g., '.2f' -> '2')
      const decimalPart = format.split('.')[1].split('f')[0]
      const decimals = decimalPart ? parseInt(decimalPart) : 2
      return value.toFixed(decimals)
    }
    return value.toFixed(2) // Default to 2 decimal places
  }

  /**
   * Format legend value for display with smart placeholder replacement
   */
  private formatLegendValue(seriesValue: any, template: string, format: string): string {
    if (!seriesValue || !template) return ''

    // Find all placeholders in the template
    const placeholderRegex = /\$\$[a-zA-Z]+\$\$/g
    const placeholders = template.match(placeholderRegex) || []

    let result = template

    // Replace each placeholder with its corresponding value
    for (const placeholder of placeholders) {
      const value = this.extractValueByPlaceholder(seriesValue, placeholder, format)
      result = result.replace(new RegExp(placeholder.replace(/\$/g, '\\$'), 'g'), value)
    }

    return result
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