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
   */
  private calculateWidgetPosition(corner: Corner, index: number, widget: IPositionableWidget): Position {
    const isTopCorner = corner.startsWith('top')
    const isRightCorner = corner.endsWith('right')
    const { axis } = this.chartDimensions


    // Try to get pane-specific coordinates first, especially for non-zero panes
    let paneCoords = null
    if (this.chartApi) {
      paneCoords = this.coordinateService.getPaneCoordinates(this.chartApi, this.paneId)
    }

    // If we have pane coordinates, use them (this bypasses axis dimension requirements)
    if (paneCoords) {
      // Calculate cumulative offset from previous widgets
      const visibleWidgets = this.cornerStates[corner].widgets.filter(w => w.visible)
      let cumulativeHeight = 0

      for (let i = 0; i < index; i++) {
        const prevWidget = visibleWidgets[i]
        if (prevWidget) {
          const dims = prevWidget.getDimensions()
          cumulativeHeight += dims.height + this.config.widgetGap
        }
      }

      const position: Position = {
        zIndex: this.config.baseZIndex + index
      }

      // Set horizontal position relative to pane bounds
      if (isRightCorner) {
        position.right = (this.chartDimensions.container.width - paneCoords.bounds.right) + this.config.edgePadding
      } else {
        position.left = paneCoords.bounds.left + this.config.edgePadding
      }

      // Set vertical position relative to pane bounds
      if (isTopCorner) {
        position.top = paneCoords.bounds.top + this.config.edgePadding + cumulativeHeight
      } else {
        position.bottom = (this.chartDimensions.container.height - paneCoords.bounds.bottom) + this.config.edgePadding + cumulativeHeight
      }

      return position
    }

    // If we don't have proper axis dimensions AND no pane coordinates, return a fallback position
    if (!axis || (axis.priceScale.right.width === 0 && axis.priceScale.left.width === 0)) {

      // Schedule a retry with the same timing pattern as legacy implementation
      setTimeout(() => {
        this.recalculateCornerLayout(corner)
      }, 100)

      return {
        top: this.config.edgePadding,
        left: this.config.edgePadding,
        zIndex: this.config.baseZIndex + index
      }
    }

    // Fallback to axis-based positioning if no pane coordinates available
    // Calculate cumulative offset from previous widgets
    const visibleWidgets = this.cornerStates[corner].widgets.filter(w => w.visible)
    let cumulativeHeight = 0


    for (let i = 0; i < index; i++) {
      const prevWidget = visibleWidgets[i]
      if (prevWidget) {
        const dims = prevWidget.getDimensions()
        cumulativeHeight += dims.height + this.config.widgetGap
      }
    }


    // Calculate base position using axis dimensions (chart container coordinates)
    const position: Position = {
      zIndex: this.config.baseZIndex + index
    }


    // Set horizontal position - respect price scale (Y-axis) width
    if (isRightCorner) {
      // Right corners: position from right edge, accounting for right price scale
      position.right = this.config.edgePadding + axis.priceScale.right.width
    } else {
      // Left corners: position after left price scale width
      position.left = this.config.edgePadding + axis.priceScale.left.width
    }

    // Set vertical position based on stacking direction - respect time scale (X-axis) height
    if (isTopCorner) {
      // Top corners stack downward from top edge
      position.top = this.config.edgePadding + cumulativeHeight
    } else {
      // Bottom corners stack upward from bottom, accounting for time scale height
      position.bottom = this.config.edgePadding + cumulativeHeight + axis.timeScale.height
    }

    return position
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
   */
  private detectOverflow(corner: Corner, widgets: IPositionableWidget[]): IPositionableWidget[] {
    const overflowing: IPositionableWidget[] = []
    const state = this.cornerStates[corner]
    const { container, axis } = this.chartDimensions
    const isLeftCorner = corner.startsWith('top-left') || corner.startsWith('bottom-left')

    // Calculate available space considering axis dimensions
    const availableHeight = container.height - axis.timeScale.height
    const availableWidth = isLeftCorner
      ? container.width - axis.priceScale.left.width
      : container.width - axis.priceScale.right.width

    // Check height overflow
    if (state.totalHeight > availableHeight) {
      // Find widgets that push beyond chart bounds
      let cumulativeHeight = this.config.edgePadding

      for (const widget of widgets) {
        const widgetHeight = widget.getDimensions().height
        const totalHeightRequired = cumulativeHeight + widgetHeight + this.config.edgePadding

        if (totalHeightRequired > availableHeight) {
          overflowing.push(widget)
        }

        cumulativeHeight += widgetHeight + this.config.widgetGap
      }
    }

    // Check width overflow
    if (state.totalWidth > availableWidth) {
      // All widgets in corner would overflow
      overflowing.push(...widgets.filter(w => !overflowing.includes(w)))
    }

    return overflowing
  }

  /**
   * Get the chart ID this layout manager is associated with
   */
  public getChartId(): string {
    return this.chartId
  }
}