import { IChartApi, ISeriesApi } from 'lightweight-charts'
import { LegendPrimitive } from '../primitives/LegendPrimitive'
import { RangeSwitcherPrimitive, DefaultRangeConfigs } from '../primitives/RangeSwitcherPrimitive'
import { ButtonFactories } from '../primitives/ButtonPrimitive'
import { PrimitiveEventManager } from './PrimitiveEventManager'
import { CornerLayoutManager } from './CornerLayoutManager'
import { LegendConfig, RangeSwitcherConfig } from '../types'
import { PrimitivePriority } from '../primitives/BasePanePrimitive'

/**
 * ChartPrimitiveManager - Centralized management for all chart primitives
 *
 * This service provides unified API for adding/removing primitives and replaces
 * the old ChartWidgetManager system with pure primitive-only approach.
 */
export class ChartPrimitiveManager {
  private static instances: Map<string, ChartPrimitiveManager> = new Map()

  private chart: IChartApi
  private chartId: string
  private eventManager: PrimitiveEventManager
  private primitives: Map<string, any> = new Map()
  private collapseButtonStates: Map<number, boolean> = new Map()
  private legendCounter: number = 0

  private constructor(chart: IChartApi, chartId: string) {
    this.chart = chart
    this.chartId = chartId
    this.eventManager = PrimitiveEventManager.getInstance(chartId)
    this.eventManager.initialize(chart)
  }

  /**
   * Get or create primitive manager for a chart
   */
  public static getInstance(chart: IChartApi, chartId: string): ChartPrimitiveManager {
    if (!ChartPrimitiveManager.instances.has(chartId)) {
      ChartPrimitiveManager.instances.set(chartId, new ChartPrimitiveManager(chart, chartId))
    }
    return ChartPrimitiveManager.instances.get(chartId)!
  }

  /**
   * Clean up primitive manager for a chart
   */
  public static cleanup(chartId: string): void {
    const instance = ChartPrimitiveManager.instances.get(chartId)
    if (instance) {
      instance.destroy()
      ChartPrimitiveManager.instances.delete(chartId)
    }

    // Also cleanup the layout manager and event manager for this chart
    CornerLayoutManager.cleanup(chartId)
    PrimitiveEventManager.cleanup(chartId)
  }

  /**
   * Add range switcher primitive
   */
  public addRangeSwitcher(config: RangeSwitcherConfig): { destroy: () => void } {
    const primitiveId = `range-switcher-${this.chartId}`

    try {
      const rangeSwitcher = new RangeSwitcherPrimitive(primitiveId, {
        corner: config.position || 'top-right',
        priority: PrimitivePriority.RANGE_SWITCHER,
        ranges: config.ranges || [...DefaultRangeConfigs.trading],
      })

      // Attach to first pane (chart-level primitives go to pane 0)
      const panes = this.chart.panes()
      if (panes.length > 0) {
        panes[0].attachPrimitive(rangeSwitcher)
      }
      this.primitives.set(primitiveId, rangeSwitcher)

      return {
        destroy: () => this.destroyPrimitive(primitiveId)
      }
    } catch (error) {
      console.error('Error adding RangeSwitcher primitive:', error)
      return { destroy: () => {} }
    }
  }

  /**
   * Add legend primitive
   */
  public addLegend(
    config: LegendConfig,
    isPanePrimitive: boolean = false,
    paneId: number = 0,
    seriesReference?: ISeriesApi<any>
  ): { destroy: () => void } {
    const primitiveId = `legend-${this.chartId}-${++this.legendCounter}`

    try {
      const legend = new LegendPrimitive(primitiveId, {
        corner: config.position || 'top-left',
        priority: PrimitivePriority.LEGEND,
        text: config.text || '$$value$$',
        valueFormat: config.valueFormat || '.2f',
        isPanePrimitive,
        paneId,
        style: {
          backgroundColor: config.backgroundColor || 'rgba(0, 0, 0, 0.8)',
          color: config.textColor || 'white'
        }
      })

      // Attach to series if we have a series reference (preferred for legends)
      if (seriesReference) {
        try {
          seriesReference.attachPrimitive(legend)
        } catch (error) {
          console.warn(`Failed to attach legend to series, falling back to pane attachment:`, error)
          // Fallback to pane attachment if series attachment fails
          this.attachToPaneAsFallback(legend, isPanePrimitive, paneId)
        }
      } else {
        // Attach to appropriate level (chart or pane) when no series reference
        this.attachToPaneAsFallback(legend, isPanePrimitive, paneId)
      }

      this.primitives.set(primitiveId, legend)

      return {
        destroy: () => this.destroyPrimitive(primitiveId)
      }
    } catch (error) {
      console.error('Error adding Legend primitive:', error)
      return { destroy: () => {} }
    }
  }

  /**
   * Add collapse button primitive
   */
  public addCollapseButton(
    paneId: number,
    isCollapsed: boolean,
    onClick: () => void,
    config: any = {}
  ): { destroy: () => void; updateState: (collapsed: boolean) => void } {
    const primitiveId = `collapse-button-${this.chartId}-${paneId}`

    try {
      const collapseButton = ButtonFactories.collapse(
        primitiveId,
        paneId,
        config.corner || 'top-right',
        (state, primitive) => {
          // Update internal state tracking
          this.collapseButtonStates.set(paneId, state.pressed || false)
          onClick()
        }
      )

      // Set initial state
      collapseButton.setState({ pressed: isCollapsed })
      this.collapseButtonStates.set(paneId, isCollapsed)

      // Attach to appropriate pane
      const panes = this.chart.panes()
      if (panes.length > paneId) {
        panes[paneId].attachPrimitive(collapseButton)
      } else {
        // Fallback to first pane if pane doesn't exist
        const fallbackPanes = this.chart.panes()
        if (fallbackPanes.length > 0) {
          fallbackPanes[0].attachPrimitive(collapseButton)
        }
      }

      this.primitives.set(primitiveId, collapseButton)

      return {
        destroy: () => this.destroyPrimitive(primitiveId),
        updateState: (collapsed: boolean) => {
          collapseButton.setState({ pressed: collapsed })
          this.collapseButtonStates.set(paneId, collapsed)
        }
      }
    } catch (error) {
      console.error('Error adding CollapseButton primitive:', error)
      return {
        destroy: () => {},
        updateState: () => {}
      }
    }
  }

  /**
   * Update legend values with crosshair data
   */
  public updateLegendValues(crosshairData: { time: any; seriesData: Map<any, any> }): void {
    // The legend primitives automatically handle crosshair updates through the event system
    // This method is kept for backward compatibility but functionality is now handled
    // by the primitive event system and crosshair subscriptions in BasePanePrimitive
  }

  /**
   * Destroy a specific primitive
   */
  private destroyPrimitive(primitiveId: string): void {
    const primitive = this.primitives.get(primitiveId)
    if (primitive) {
      try {
        // Detach from all panes (does nothing if not attached to that pane)
        const panes = this.chart.panes()
        panes.forEach(pane => {
          pane.detachPrimitive(primitive)
        })
        this.primitives.delete(primitiveId)
      } catch (error) {
        console.error(`Error destroying primitive ${primitiveId}:`, error)
      }
    }
  }

  /**
   * Get primitive by ID
   */
  public getPrimitive(primitiveId: string): any {
    return this.primitives.get(primitiveId)
  }

  /**
   * Get all primitives
   */
  public getAllPrimitives(): Map<string, any> {
    return new Map(this.primitives)
  }

  /**
   * Get collapse button state for a pane
   */
  public getCollapseButtonState(paneId: number): boolean {
    return this.collapseButtonStates.get(paneId) || false
  }

  /**
   * Destroy all primitives for this chart
   */
  public destroy(): void {
    // Destroy all primitives
    for (const [primitiveId, primitive] of this.primitives) {
      try {
        // Detach from all panes (does nothing if not attached to that pane)
        const panes = this.chart.panes()
        panes.forEach(pane => {
          pane.detachPrimitive(primitive)
        })
      } catch (error) {
        console.error(`Error detaching primitive ${primitiveId}:`, error)
      }
    }

    // Clear references
    this.primitives.clear()
    this.collapseButtonStates.clear()
  }

  /**
   * Get event manager instance (for advanced usage)
   */
  public getEventManager(): PrimitiveEventManager {
    return this.eventManager
  }

  /**
   * Get chart ID
   */
  public getChartId(): string {
    return this.chartId
  }

  /**
   * Helper method to attach primitive to pane as fallback
   */
  private attachToPaneAsFallback(primitive: any, isPanePrimitive: boolean, paneId: number): void {
    if (isPanePrimitive && paneId >= 0) {
      // Get pane and attach to it
      const panes = this.chart.panes()
      if (panes.length > paneId) {
        panes[paneId].attachPrimitive(primitive)
      } else {
        // Fallback to first pane if pane doesn't exist
        const fallbackPanes = this.chart.panes()
        if (fallbackPanes.length > 0) {
          fallbackPanes[0].attachPrimitive(primitive)
        }
      }
    } else {
      // Attach to first pane (chart-level)
      const panes = this.chart.panes()
      if (panes.length > 0) {
        panes[0].attachPrimitive(primitive)
      }
    }
  }
}