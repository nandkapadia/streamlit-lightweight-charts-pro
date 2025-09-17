import {
  Corner,
  Dimensions,
  Position,
  IPositionableWidget,
  LayoutConfig,
  CornerLayoutState,
  LayoutManagerEvents,
  ChartLayoutDimensions
} from '../types/layout'
import { ChartCoordinateService } from './ChartCoordinateService'

/**
 * CornerLayoutManager - Centralized widget positioning system
 *
 * Manages placement of UI widgets (Legend, RangeSwitcher, CollapseButton, etc.)
 * in chart corners with automatic stacking, spacing, and overflow handling.
 */
export class CornerLayoutManager {
  private static instances: Map<string, CornerLayoutManager> = new Map()

  private config: LayoutConfig = {
    edgePadding: 6,
    widgetGap: 6,
    baseZIndex: 1000
  }

  private cornerStates: Record<Corner, CornerLayoutState> = {
    'top-left': { widgets: [], totalHeight: 0, totalWidth: 0 },
    'top-right': { widgets: [], totalHeight: 0, totalWidth: 0 },
    'bottom-left': { widgets: [], totalHeight: 0, totalWidth: 0 },
    'bottom-right': { widgets: [], totalHeight: 0, totalWidth: 0 }
  }

  private chartDimensions: ChartLayoutDimensions = {
    container: { width: 0, height: 0 },
    axis: {
      priceScale: {
        left: { width: 0, height: 0 },
        right: { width: 0, height: 0 }
      },
      timeScale: { width: 0, height: 0 }
    }
  }
  private events: Partial<LayoutManagerEvents> = {}

  private chartId: string
  private paneId: number
  private coordinateService: ChartCoordinateService
  private chartApi: any = null

  private constructor(chartId: string, paneId: number) {
    this.chartId = chartId
    this.coordinateService = ChartCoordinateService.getInstance()
    this.paneId = paneId
  }

  public static getInstance(chartId?: string, paneId?: number): CornerLayoutManager {
    const id = `${chartId || 'default'}-pane-${paneId || 0}`

    if (!CornerLayoutManager.instances.has(id)) {
      CornerLayoutManager.instances.set(id, new CornerLayoutManager(chartId || 'default', paneId || 0))
    }
    return CornerLayoutManager.instances.get(id)!
  }

  public static cleanup(chartId: string, paneId?: number): void {
    if (paneId !== undefined) {
      // Clean up specific pane
      const id = `${chartId}-pane-${paneId}`
      CornerLayoutManager.instances.delete(id)
    } else {
      // Clean up all panes for this chart
      const keysToDelete = []
      for (const key of CornerLayoutManager.instances.keys()) {
        if (key.startsWith(`${chartId}-pane-`)) {
          keysToDelete.push(key)
        }
      }
      keysToDelete.forEach(key => CornerLayoutManager.instances.delete(key))
    }
  }

  /**
   * Configure layout settings
   */
  public configure(config: Partial<LayoutConfig>): void {
    this.config = { ...this.config, ...config }
    this.recalculateAllLayouts()
  }

  /**
   * Set chart API reference for pane coordinate calculations
   */
  public setChartApi(chartApi: any): void {
    this.chartApi = chartApi
    this.recalculateAllLayouts()
  }

  /**
   * Set event handlers
   */
  public on(events: Partial<LayoutManagerEvents>): void {
    this.events = { ...this.events, ...events }
  }

  /**
   * Update chart dimensions and recalculate layouts
   */
  public updateChartDimensions(dimensions: Dimensions): void {
    this.chartDimensions.container = dimensions
    this.recalculateAllLayouts()
  }

  /**
   * Update chart layout with axis dimensions and recalculate layouts
   */
  public updateChartLayout(dimensions: ChartLayoutDimensions): void {
    this.chartDimensions = dimensions
    this.recalculateAllLayouts()
  }

  /**
   * Register a widget for positioning management
   */
  public registerWidget(widget: IPositionableWidget): void {
    const corner = widget.corner
    const state = this.cornerStates[corner]


    // Remove existing widget with same ID
    this.unregisterWidget(widget.id)

    // Add widget and sort by priority (ascending), then by registration order (FIFO)
    state.widgets.push(widget)
    state.widgets.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority
      }
      // FIFO tie-breaking: maintain registration order for same priority
      return 0
    })


    // Recalculate layout for this corner immediately
    this.recalculateCornerLayout(corner)

    // Also try additional immediate calculation attempts to handle timing issues
    setTimeout(() => {
      this.recalculateCornerLayout(corner)
    }, 1)

    setTimeout(() => {
      this.recalculateCornerLayout(corner)
    }, 50)
  }

  /**
   * Unregister a widget
   */
  public unregisterWidget(widgetId: string): void {
    for (const corner of Object.keys(this.cornerStates) as Corner[]) {
      const state = this.cornerStates[corner]
      const initialLength = state.widgets.length
      state.widgets = state.widgets.filter(w => w.id !== widgetId)

      if (state.widgets.length !== initialLength) {
        this.recalculateCornerLayout(corner)
        break
      }
    }
  }

  /**
   * Update widget visibility and recalculate layout
   */
  public updateWidgetVisibility(widgetId: string, visible: boolean): void {
    for (const corner of Object.keys(this.cornerStates) as Corner[]) {
      const state = this.cornerStates[corner]
      const widget = state.widgets.find(w => w.id === widgetId)

      if (widget && widget.visible !== visible) {
        widget.visible = visible
        this.recalculateCornerLayout(corner)
        break
      }
    }
  }

  /**
   * Get the calculated position for a specific widget
   */
  public getWidgetPosition(widgetId: string): Position | null {
    for (const corner of Object.keys(this.cornerStates) as Corner[]) {
      const state = this.cornerStates[corner]
      const widgetIndex = state.widgets.findIndex(w => w.id === widgetId && w.visible)

      if (widgetIndex !== -1) {
        return this.calculateWidgetPosition(corner, widgetIndex, state.widgets[widgetIndex])
      }
    }
    return null
  }

  /**
   * Recalculate layouts for all corners
   */
  private recalculateAllLayouts(): void {
    for (const corner of Object.keys(this.cornerStates) as Corner[]) {
      this.recalculateCornerLayout(corner)
    }
  }

  /**
   * Recalculate layout for a specific corner
   */
  private recalculateCornerLayout(corner: Corner): void {

    const state = this.cornerStates[corner]
    const visibleWidgets = state.widgets.filter(w => w.visible)


    // Calculate total dimensions
    state.totalHeight = this.calculateTotalHeight(visibleWidgets)
    state.totalWidth = this.calculateTotalWidth(visibleWidgets)

    // Check for overflow
    const overflowingWidgets = this.detectOverflow(corner, visibleWidgets)
    if (overflowingWidgets.length > 0 && this.events.onOverflow) {
      this.events.onOverflow(corner, overflowingWidgets)
    }

    // Update positions for all visible widgets
    visibleWidgets.forEach((widget, index) => {
      const position = this.calculateWidgetPosition(corner, index, widget)
      widget.updatePosition(position)
    })

    // Emit layout changed event
    if (this.events.onLayoutChanged) {
      this.events.onLayoutChanged(corner, visibleWidgets)
    }
  }

  /**
   * Calculate position for a widget at specific index in corner
   * REFACTORED: Now delegates to ChartCoordinateService for single source of truth
   */
  private calculateWidgetPosition(corner: Corner, index: number, widget: IPositionableWidget): Position {
    // Delegate to ChartCoordinateService for positioning calculations
    if (this.chartApi) {
      const stackPosition = this.coordinateService.calculateWidgetStackPosition(
        this.chartApi,
        this.paneId,
        corner,
        this.cornerStates[corner].widgets.filter(w => w.visible),
        index
      )

      if (stackPosition) {
        return stackPosition
      }
    }

    // Fallback position if ChartCoordinateService fails
    return {
      top: this.config.edgePadding,
      left: this.config.edgePadding,
      zIndex: this.config.baseZIndex + index
    }
  }

  /**
   * Calculate total height needed for all widgets in corner
   */
  private calculateTotalHeight(widgets: IPositionableWidget[]): number {
    if (widgets.length === 0) return 0

    const totalWidgetHeight = widgets.reduce((sum, widget) => {
      return sum + widget.getDimensions().height
    }, 0)

    const totalGaps = Math.max(0, widgets.length - 1) * this.config.widgetGap
    const totalPadding = this.config.edgePadding * 2

    return totalWidgetHeight + totalGaps + totalPadding
  }

  /**
   * Calculate total width needed for all widgets in corner
   */
  private calculateTotalWidth(widgets: IPositionableWidget[]): number {
    if (widgets.length === 0) return 0

    const maxWidgetWidth = Math.max(...widgets.map(w => w.getDimensions().width))
    return maxWidgetWidth + (this.config.edgePadding * 2)
  }

  /**
   * Detect widgets that would overflow the chart area
   * REFACTORED: Now delegates to ChartCoordinateService for single source of truth
   */
  private detectOverflow(corner: Corner, widgets: IPositionableWidget[]): IPositionableWidget[] {
    // Delegate to ChartCoordinateService for overflow detection
    const containerBounds = {
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: this.chartDimensions.container.width,
      bottom: this.chartDimensions.container.height,
      width: this.chartDimensions.container.width,
      height: this.chartDimensions.container.height
    }

    const validation = this.coordinateService.validateStackingBounds(corner, widgets, containerBounds)
    return validation.overflowingWidgets
  }

  /**
   * Get the chart ID this layout manager is associated with
   */
  public getChartId(): string {
    return this.chartId
  }
}