/**
 * @fileoverview Corner Layout Manager
 *
 * Centralized positioning system for UI widgets in chart corners. Manages
 * automatic stacking, spacing, z-index, and overflow handling for primitives
 * placed in the four chart corners.
 *
 * This service is responsible for:
 * - Widget positioning in corners (top-left, top-right, bottom-left, bottom-right)
 * - Automatic vertical stacking in corners
 * - Consistent spacing and margins
 * - Z-index management for layering
 * - Overflow detection and handling
 * - Dimension tracking per corner
 *
 * Architecture:
 * - Keyed singleton pattern (one instance per chart+pane)
 * - State tracking per corner (widgets, dimensions)
 * - Integration with ChartCoordinateService
 * - Event-driven updates on layout changes
 * - Automatic position recalculation
 *
 * Layout Rules:
 * - Widgets stack vertically in each corner
 * - Edge padding applied to corners
 * - Widget gap applied between stacked widgets
 * - Z-index increases with stack position
 * - Overflow detected when widgets exceed pane height
 *
 * @example
 * ```typescript
 * const manager = CornerLayoutManager.getInstance('chart-1', 0);
 * manager.setChartApi(chartApi);
 *
 * // Register widget
 * manager.register(
 *   'legend-1',
 *   'top-left',
 *   { width: 200, height: 30 },
 *   legendElement
 * );
 *
 * // Calculate positions
 * manager.calculatePositions();
 *
 * // Cleanup
 * CornerLayoutManager.cleanup('chart-1');
 * ```
 */

import {
  Corner,
  Dimensions,
  Position,
  IPositionableWidget,
  LayoutConfig,
  CornerLayoutState,
  LayoutManagerEvents,
  ChartLayoutDimensions,
} from '../types/layout';
import { IChartApi } from 'lightweight-charts';
import { ChartCoordinateService } from './ChartCoordinateService';
import { LayoutSpacing } from '../primitives/PrimitiveDefaults';
import { KeyedSingletonManager, createInstanceKey } from '../utils/KeyedSingletonManager';

/**
 * CornerLayoutManager - Automatic corner-based widget positioning
 *
 * @export
 * @class CornerLayoutManager
 * @extends {KeyedSingletonManager<CornerLayoutManager>}
 */
export class CornerLayoutManager extends KeyedSingletonManager<CornerLayoutManager> {
  private config: LayoutConfig = {
    edgePadding: LayoutSpacing.EDGE_PADDING,
    widgetGap: LayoutSpacing.WIDGET_GAP,
    baseZIndex: LayoutSpacing.BASE_Z_INDEX,
  };

  private cornerStates: Record<Corner, CornerLayoutState> = {
    'top-left': { widgets: [], totalHeight: 0, totalWidth: 0 },
    'top-right': { widgets: [], totalHeight: 0, totalWidth: 0 },
    'bottom-left': { widgets: [], totalHeight: 0, totalWidth: 0 },
    'bottom-right': { widgets: [], totalHeight: 0, totalWidth: 0 },
  };

  private chartDimensions: ChartLayoutDimensions = {
    container: { width: 0, height: 0 },
    axis: {
      priceScale: {
        left: { width: 0, height: 0 },
        right: { width: 0, height: 0 },
      },
      timeScale: { width: 0, height: 0 },
    },
  };
  private events: Partial<LayoutManagerEvents> = {};

  private chartId: string;
  private paneId: number;
  private coordinateService: ChartCoordinateService;
  private chartApi: IChartApi | null = null;

  private constructor(chartId: string, paneId: number) {
    super();
    this.chartId = chartId;
    this.coordinateService = ChartCoordinateService.getInstance();
    this.paneId = paneId;
  }

  public static getInstance(chartId?: string, paneId?: number): CornerLayoutManager {
    const key = createInstanceKey(chartId, 'pane', paneId);
    return KeyedSingletonManager.getOrCreateInstance(
      'CornerLayoutManager',
      key,
      () => new CornerLayoutManager(chartId || 'default', paneId || 0)
    );
  }

  public static cleanup(chartId: string, paneId?: number): void {
    if (paneId !== undefined) {
      // Clean up specific pane
      const key = createInstanceKey(chartId, 'pane', paneId);
      KeyedSingletonManager.destroyInstanceByKey('CornerLayoutManager', key);
    } else {
      // Clean up all panes for this chart
      const allKeys = KeyedSingletonManager.getInstanceKeys('CornerLayoutManager');
      const keysToDelete = allKeys.filter(key => key.startsWith(`${chartId}-pane-`));
      keysToDelete.forEach(key => {
        KeyedSingletonManager.destroyInstanceByKey('CornerLayoutManager', key);
      });
    }
  }

  /**
   * Configure layout settings
   */
  public configure(config: Partial<LayoutConfig>): void {
    this.config = { ...this.config, ...config };
    this.recalculateAllLayouts();
  }

  /**
   * Set chart API reference for pane coordinate calculations
   */
  public setChartApi(chartApi: IChartApi): void {
    this.chartApi = chartApi;
    this.recalculateAllLayouts();
  }

  /**
   * Set event handlers
   */
  public on(events: Partial<LayoutManagerEvents>): void {
    this.events = { ...this.events, ...events };
  }

  /**
   * Update chart dimensions and recalculate layouts
   */
  public updateChartDimensions(dimensions: Dimensions): void {
    this.chartDimensions.container = dimensions;
    this.recalculateAllLayouts();
  }

  /**
   * Update chart dimensions immediately from chart element (for fast resize)
   */
  public updateChartDimensionsFromElement(): void {
    if (this.chartApi) {
      try {
        const chartElement = this.chartApi.chartElement();
        if (chartElement) {
          const rect = chartElement.getBoundingClientRect();
          this.chartDimensions.container = {
            width: rect.width || chartElement.offsetWidth || 800,
            height: rect.height || chartElement.offsetHeight || 600,
          };
          this.recalculateAllLayouts();
        }
      } catch {
        // Fallback to cached dimensions if chart element access fails
      }
    }
  }

  /**
   * Update chart layout with axis dimensions and recalculate layouts
   */
  public updateChartLayout(dimensions: ChartLayoutDimensions): void {
    this.chartDimensions = dimensions;
    this.recalculateAllLayouts();
  }

  /**
   * Register a widget for positioning management
   */
  public registerWidget(widget: IPositionableWidget): void {
    const corner = widget.corner;
    const state = this.cornerStates[corner];

    // Remove existing widget with same ID
    this.unregisterWidget(widget.id);

    // Add widget and sort by priority (ascending), then by registration order (FIFO)
    state.widgets.push(widget);
    state.widgets.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      // FIFO tie-breaking: maintain registration order for same priority
      return 0;
    });

    // Recalculate layout for this corner immediately for instant response
    this.recalculateCornerLayout(corner);
  }

  /**
   * Unregister a widget
   */
  public unregisterWidget(widgetId: string): void {
    for (const corner of Object.keys(this.cornerStates) as Corner[]) {
      const state = this.cornerStates[corner];
      const initialLength = state.widgets.length;
      state.widgets = state.widgets.filter(w => w.id !== widgetId);

      if (state.widgets.length !== initialLength) {
        this.recalculateCornerLayout(corner);
        break;
      }
    }
  }

  /**
   * Update widget visibility and recalculate layout
   */
  public updateWidgetVisibility(widgetId: string, visible: boolean): void {
    for (const corner of Object.keys(this.cornerStates) as Corner[]) {
      const state = this.cornerStates[corner];
      const widget = state.widgets.find(w => w.id === widgetId);

      if (widget && widget.visible !== visible) {
        widget.visible = visible;
        this.recalculateCornerLayout(corner);
        break;
      }
    }
  }

  /**
   * Get the calculated position for a specific widget
   */
  public getWidgetPosition(widgetId: string): Position | null {
    for (const corner of Object.keys(this.cornerStates) as Corner[]) {
      const state = this.cornerStates[corner];
      const widgetIndex = state.widgets.findIndex(w => w.id === widgetId && w.visible);

      if (widgetIndex !== -1) {
        return this.calculateWidgetPosition(corner, widgetIndex, state.widgets[widgetIndex]);
      }
    }
    return null;
  }

  /**
   * Recalculate layouts for all corners
   */
  public recalculateAllLayouts(): void {
    for (const corner of Object.keys(this.cornerStates) as Corner[]) {
      this.recalculateCornerLayout(corner);
    }
  }

  /**
   * Recalculate layout for a specific corner
   */
  private recalculateCornerLayout(corner: Corner): void {
    const state = this.cornerStates[corner];
    const visibleWidgets = state.widgets.filter(w => w.visible);

    // Calculate total dimensions
    state.totalHeight = this.calculateTotalHeight(visibleWidgets);
    state.totalWidth = this.calculateTotalWidth(visibleWidgets);

    // Check for overflow
    const overflowingWidgets = this.detectOverflow(corner, visibleWidgets);
    if (overflowingWidgets.length > 0 && this.events.onOverflow) {
      this.events.onOverflow(corner, overflowingWidgets);
    }

    // Update positions for all visible widgets
    visibleWidgets.forEach((widget, index) => {
      const position = this.calculateWidgetPosition(corner, index, widget);
      widget.updatePosition(position);
    });

    // Emit layout changed event
    if (this.events.onLayoutChanged) {
      this.events.onLayoutChanged(corner, visibleWidgets);
    }
  }

  /**
   * Calculate position for a widget at specific index in corner
   * OPTIMIZED: Direct synchronous calculation for immediate resize performance
   */
  private calculateWidgetPosition(
    corner: Corner,
    index: number,
    widget: IPositionableWidget
  ): Position {
    // Use fast synchronous positioning for immediate resize response
    const visibleWidgets = this.cornerStates[corner].widgets.filter(w => w.visible);
    const widgetsBeforeThis = visibleWidgets.slice(0, index);

    // Calculate cumulative height of widgets above this one
    // Add gaps between widgets only (not before the first widget)
    let cumulativeHeight = 0;
    for (let i = 0; i < widgetsBeforeThis.length; i++) {
      const prevWidget = widgetsBeforeThis[i];
      cumulativeHeight += prevWidget.getDimensions().height;
      // Add gap after each widget (space before the next widget)
      cumulativeHeight += this.config.widgetGap;
    }

    // Calculate position based on corner
    let top: number, left: number;

    // For all pane widgets, use pane coordinates (including paneId = 0)
    if (this.chartApi) {
      // Get pane coordinates for proper positioning
      const paneCoords = this.coordinateService.getPaneCoordinates(this.chartApi, this.paneId);

      if (paneCoords) {
        const widgetDimensions = widget.getDimensions();

        // All widgets are pane primitives and should only paint within the pane area
        // Use standard pane bounds for all widgets consistently
        const bounds = {
          top: paneCoords.y,
          left: paneCoords.x,
          right: paneCoords.x + paneCoords.width,
          bottom: paneCoords.y + paneCoords.height,
        };

        switch (corner) {
          case 'top-left':
            top = bounds.top + this.config.edgePadding + cumulativeHeight;
            left = bounds.left + this.config.edgePadding;
            break;
          case 'top-right':
            top = bounds.top + this.config.edgePadding + cumulativeHeight;
            left = bounds.right - widgetDimensions.width - this.config.edgePadding;
            break;
          case 'bottom-left':
            top =
              bounds.bottom -
              this.config.edgePadding -
              this.calculateTotalHeight(visibleWidgets) +
              cumulativeHeight;
            left = bounds.left + this.config.edgePadding;
            break;
          case 'bottom-right':
            top =
              bounds.bottom -
              this.config.edgePadding -
              this.calculateTotalHeight(visibleWidgets) +
              cumulativeHeight;
            left = bounds.right - widgetDimensions.width - this.config.edgePadding;
            break;
          default:
            top = bounds.top + this.config.edgePadding;
            left = bounds.left + this.config.edgePadding;
        }

        return {
          top,
          left,
          zIndex: this.config.baseZIndex + index,
        };
      }
    }

    // Fallback: Use chart container dimensions when pane coordinates are unavailable
    const containerWidth = this.chartDimensions.container.width || 800;
    const containerHeight = this.chartDimensions.container.height || 600;
    const widgetDimensions = widget.getDimensions();

    switch (corner) {
      case 'top-left':
        top = this.config.edgePadding + cumulativeHeight;
        left = this.config.edgePadding;
        break;
      case 'top-right':
        top = this.config.edgePadding + cumulativeHeight;
        left = containerWidth - widgetDimensions.width - this.config.edgePadding;
        break;
      case 'bottom-left':
        top =
          containerHeight -
          this.config.edgePadding -
          this.calculateTotalHeight(visibleWidgets) +
          cumulativeHeight;
        left = this.config.edgePadding;
        break;
      case 'bottom-right':
        top =
          containerHeight -
          this.config.edgePadding -
          this.calculateTotalHeight(visibleWidgets) +
          cumulativeHeight;
        left = containerWidth - widgetDimensions.width - this.config.edgePadding;
        break;
      default:
        top = this.config.edgePadding;
        left = this.config.edgePadding;
    }

    return {
      top,
      left,
      zIndex: this.config.baseZIndex + index,
    };
  }

  /**
   * Calculate total height needed for all widgets in corner
   */
  private calculateTotalHeight(widgets: IPositionableWidget[]): number {
    if (widgets.length === 0) return 0;

    const totalWidgetHeight = widgets.reduce((sum, widget) => {
      return sum + widget.getDimensions().height;
    }, 0);

    const totalGaps = Math.max(0, widgets.length - 1) * this.config.widgetGap;
    const totalPadding = this.config.edgePadding * 2;

    return totalWidgetHeight + totalGaps + totalPadding;
  }

  /**
   * Calculate total width needed for all widgets in corner
   */
  private calculateTotalWidth(widgets: IPositionableWidget[]): number {
    if (widgets.length === 0) return 0;

    const maxWidgetWidth = Math.max(...widgets.map(w => w.getDimensions().width));
    return maxWidgetWidth + this.config.edgePadding * 2;
  }

  /**
   * Detect widgets that would overflow the chart area
   * OPTIMIZED: Direct synchronous overflow detection for immediate resize performance
   */
  private detectOverflow(corner: Corner, widgets: IPositionableWidget[]): IPositionableWidget[] {
    const overflowingWidgets: IPositionableWidget[] = [];
    const containerWidth = this.chartDimensions.container.width || 800;
    const containerHeight = this.chartDimensions.container.height || 600;

    // Check each widget for overflow
    widgets.forEach((widget, index) => {
      const position = this.calculateWidgetPosition(corner, index, widget);
      const dimensions = widget.getDimensions();

      // Check if widget extends beyond container bounds
      const left = position.left ?? 0;
      const top = position.top ?? 0;
      const rightEdge = left + dimensions.width;
      const bottomEdge = top + dimensions.height;

      if (rightEdge > containerWidth || bottomEdge > containerHeight || left < 0 || top < 0) {
        overflowingWidgets.push(widget);
      }
    });

    return overflowingWidgets;
  }

  /**
   * Get the chart ID this layout manager is associated with
   */
  public getChartId(): string {
    return this.chartId;
  }

  /**
   * Cleanup instance resources
   */
  public destroy(): void {
    // Clear all corner states
    Object.keys(this.cornerStates).forEach(corner => {
      this.cornerStates[corner as Corner].widgets = [];
      this.cornerStates[corner as Corner].totalHeight = 0;
      this.cornerStates[corner as Corner].totalWidth = 0;
    });

    // Clear events
    this.events = {};

    // Clear all references to allow garbage collection
    (this as any).chartApi = null;
    (this as any).coordinateService = null;
    (this as any).config = null;
  }
}
