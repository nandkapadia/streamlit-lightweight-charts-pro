import { IChartApi } from 'lightweight-charts';
import { LegendPrimitive } from '../primitives/LegendPrimitive';
import { RangeSwitcherPrimitive, DefaultRangeConfigs } from '../primitives/RangeSwitcherPrimitive';
import { PrimitiveEventManager } from './PrimitiveEventManager';
import { CornerLayoutManager } from './CornerLayoutManager';
import { LegendConfig, RangeSwitcherConfig, PaneCollapseConfig } from '../types';
import { ExtendedSeriesApi, CrosshairEventData } from '../types/ChartInterfaces';
import { PrimitivePriority } from '../primitives/BasePanePrimitive';
import {
  PaneButtonPanelPlugin,
  createPaneButtonPanelPlugin,
} from '../plugins/chart/paneButtonPanelPlugin';

/**
 * ChartPrimitiveManager - Centralized management for all chart primitives
 *
 * This service provides unified API for adding/removing primitives and replaces
 * the old ChartWidgetManager system with pure primitive-only approach.
 */
export class ChartPrimitiveManager {
  private static instances: Map<string, ChartPrimitiveManager> = new Map();

  private chart: IChartApi;
  private chartId: string;
  private eventManager: PrimitiveEventManager;
  private primitives: Map<
    string,
    LegendPrimitive | RangeSwitcherPrimitive | PaneButtonPanelPlugin
  > = new Map();
  private legendCounter: number = 0;

  private constructor(chart: IChartApi, chartId: string) {
    this.chart = chart;
    this.chartId = chartId;
    this.eventManager = PrimitiveEventManager.getInstance(chartId);
    this.eventManager.initialize(chart);
  }

  /**
   * Get or create primitive manager for a chart
   */
  public static getInstance(chart: IChartApi, chartId: string): ChartPrimitiveManager {
    if (!ChartPrimitiveManager.instances.has(chartId)) {
      ChartPrimitiveManager.instances.set(chartId, new ChartPrimitiveManager(chart, chartId));
    }
    return ChartPrimitiveManager.instances.get(chartId)!;
  }

  /**
   * Clean up primitive manager for a chart
   */
  public static cleanup(chartId: string): void {
    const instance = ChartPrimitiveManager.instances.get(chartId);
    if (instance) {
      instance.destroy();
      ChartPrimitiveManager.instances.delete(chartId);
    }

    // Also cleanup the layout manager and event manager for this chart
    CornerLayoutManager.cleanup(chartId);
    PrimitiveEventManager.cleanup(chartId);
  }

  /**
   * Add range switcher primitive
   */
  public addRangeSwitcher(config: RangeSwitcherConfig): { destroy: () => void } {
    const primitiveId = `range-switcher-${this.chartId}`;

    try {
      const rangeSwitcher = new RangeSwitcherPrimitive(primitiveId, {
        corner: config.position || 'top-right',
        priority: PrimitivePriority.RANGE_SWITCHER,
        ranges: config.ranges || [...DefaultRangeConfigs.trading],
      });

      // Attach to first pane (chart-level primitives go to pane 0)
      const panes = this.chart.panes();
      if (panes.length > 0) {
        panes[0].attachPrimitive(rangeSwitcher);
      }
      this.primitives.set(primitiveId, rangeSwitcher);

      return {
        destroy: () => this.destroyPrimitive(primitiveId),
      };
    } catch (error) {
      return { destroy: () => {} };
    }
  }

  /**
   * Add legend primitive
   */
  public addLegend(
    config: LegendConfig,
    isPanePrimitive: boolean = false,
    paneId: number = 0,
    seriesReference?: ExtendedSeriesApi
  ): { destroy: () => void } {
    const primitiveId = `legend-${this.chartId}-${++this.legendCounter}`;

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
          color: config.textColor || 'white',
        },
      });

      // Attach to series if we have a series reference (preferred for legends)
      if (seriesReference) {
        try {
          seriesReference.attachPrimitive(legend);
        } catch (error) {
          // Fallback to pane attachment if series attachment fails
          this.attachToPaneAsFallback(legend, isPanePrimitive, paneId);
        }
      } else {
        // Attach to appropriate level (chart or pane) when no series reference
        this.attachToPaneAsFallback(legend, isPanePrimitive, paneId);
      }

      this.primitives.set(primitiveId, legend);

      return {
        destroy: () => this.destroyPrimitive(primitiveId),
      };
    } catch (error) {
      return { destroy: () => {} };
    }
  }

  /**
   * Add button panel (gear + collapse buttons) primitive
   */
  public addButtonPanel(
    paneId: number,
    config: PaneCollapseConfig = {}
  ): { destroy: () => void; plugin: PaneButtonPanelPlugin } {
    const primitiveId = `button-panel-${this.chartId}-${paneId}`;

    try {
      const buttonPanel = createPaneButtonPanelPlugin(paneId, config, this.chartId);

      // Attach to appropriate pane
      const panes = this.chart.panes();
      if (panes.length > paneId) {
        panes[paneId].attachPrimitive(buttonPanel);
      } else {
        // Fallback to first pane if pane doesn't exist
        const fallbackPanes = this.chart.panes();
        if (fallbackPanes.length > 0) {
          fallbackPanes[0].attachPrimitive(buttonPanel);
        }
      }

      this.primitives.set(primitiveId, buttonPanel);

      return {
        destroy: () => this.destroyPrimitive(primitiveId),
        plugin: buttonPanel,
      };
    } catch (error) {
      return {
        destroy: () => {},
        plugin: createPaneButtonPanelPlugin(paneId, config, this.chartId),
      };
    }
  }

  /**
   * Update legend values with crosshair data
   */
  public updateLegendValues(_crosshairData: CrosshairEventData): void {
    // The legend primitives automatically handle crosshair updates through the event system
    // This method is kept for backward compatibility but functionality is now handled
    // by the primitive event system and crosshair subscriptions in BasePanePrimitive
  }

  /**
   * Destroy a specific primitive
   */
  private destroyPrimitive(primitiveId: string): void {
    const primitive = this.primitives.get(primitiveId);
    if (primitive) {
      try {
        // Detach from all panes (does nothing if not attached to that pane)
        const panes = this.chart.panes();
        panes.forEach(pane => {
          pane.detachPrimitive(primitive);
        });
        this.primitives.delete(primitiveId);
      } catch (error) {
        console.error('Chart primitive manager operation failed:', error);
      }
    }
  }

  /**
   * Get primitive by ID
   */
  public getPrimitive(
    primitiveId: string
  ): LegendPrimitive | RangeSwitcherPrimitive | PaneButtonPanelPlugin | undefined {
    return this.primitives.get(primitiveId);
  }

  /**
   * Get all primitives
   */
  public getAllPrimitives(): Map<
    string,
    LegendPrimitive | RangeSwitcherPrimitive | PaneButtonPanelPlugin
  > {
    return new Map(this.primitives);
  }

  /**
   * Destroy all primitives for this chart
   */
  public destroy(): void {
    // Destroy all primitives
    for (const [, primitive] of this.primitives) {
      try {
        // Detach from all panes (does nothing if not attached to that pane)
        const panes = this.chart.panes();
        panes.forEach(pane => {
          pane.detachPrimitive(primitive);
        });
      } catch (error) {
        console.error('Chart primitive manager operation failed:', error);
      }
    }

    // Clear references
    this.primitives.clear();
  }

  /**
   * Get event manager instance (for advanced usage)
   */
  public getEventManager(): PrimitiveEventManager {
    return this.eventManager;
  }

  /**
   * Get chart ID
   */
  public getChartId(): string {
    return this.chartId;
  }

  /**
   * Helper method to attach primitive to pane as fallback
   */
  private attachToPaneAsFallback(
    primitive: LegendPrimitive | RangeSwitcherPrimitive | PaneButtonPanelPlugin,
    isPanePrimitive: boolean,
    paneId: number
  ): void {
    if (isPanePrimitive && paneId >= 0) {
      // Get pane and attach to it
      const panes = this.chart.panes();
      if (panes.length > paneId) {
        panes[paneId].attachPrimitive(primitive);
      } else {
        // Fallback to first pane if pane doesn't exist
        const fallbackPanes = this.chart.panes();
        if (fallbackPanes.length > 0) {
          fallbackPanes[0].attachPrimitive(primitive);
        }
      }
    } else {
      // Attach to first pane (chart-level)
      const panes = this.chart.panes();
      if (panes.length > 0) {
        panes[0].attachPrimitive(primitive);
      }
    }
  }
}
