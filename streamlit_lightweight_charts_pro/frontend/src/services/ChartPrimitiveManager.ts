/**
 * @fileoverview Chart Primitive Manager
 *
 * Centralized manager for all chart primitives (legends, range switchers, buttons).
 * Provides lifecycle management, coordinated positioning, and event handling
 * for primitive-based chart features.
 *
 * This service is responsible for:
 * - Creating and registering primitives (legends, range switchers, buttons)
 * - Managing primitive lifecycle (attach, detach, destroy)
 * - Coordinating with layout and event managers
 * - Tracking primitives by ID for cleanup
 * - Providing unified API for primitive operations
 *
 * Architecture:
 * - Keyed singleton pattern (one instance per chart)
 * - Integration with PrimitiveEventManager
 * - Integration with CornerLayoutManager
 * - Primitive registry with cleanup
 * - Per-pane primitive attachment
 *
 * Managed Primitive Types:
 * - **LegendPrimitive**: Dynamic legends with series data
 * - **RangeSwitcherPrimitive**: Time range switching buttons
 * - **ButtonPanelPrimitive**: Settings and collapse buttons
 *
 * @example
 * ```typescript
 * const manager = ChartPrimitiveManager.getInstance(chartApi, 'chart-1');
 *
 * // Add legend
 * const legend = manager.addLegend({
 *   position: 'top-left',
 *   template: '<div>$$title$$: $$close$$</div>'
 * }, false);
 *
 * // Add range switcher
 * const switcher = manager.addRangeSwitcher({
 *   position: 'top-right',
 *   ranges: [{ text: '1D', seconds: 86400 }]
 * });
 *
 * // Cleanup on unmount
 * ChartPrimitiveManager.cleanup('chart-1');
 * ```
 */

import { IChartApi } from 'lightweight-charts';
import { logger } from '../utils/logger';
import { LegendPrimitive } from '../primitives/LegendPrimitive';
import { RangeSwitcherPrimitive, DefaultRangeConfigs } from '../primitives/RangeSwitcherPrimitive';
import { PrimitiveEventManager } from './PrimitiveEventManager';
import { CornerLayoutManager } from './CornerLayoutManager';
import { LegendConfig, RangeSwitcherConfig, PaneCollapseConfig } from '../types';
import { ExtendedSeriesApi, CrosshairEventData } from '../types/ChartInterfaces';
import { PrimitivePriority } from '../primitives/BasePanePrimitive';
import {
  ButtonPanelPrimitive,
  createButtonPanelPrimitive,
} from '../primitives/ButtonPanelPrimitive';

/**
 * ChartPrimitiveManager - Centralized primitive lifecycle manager
 *
 * Manages all chart primitives with unified API, coordinated positioning,
 * and proper cleanup. Replaces old widget-based approach with pure
 * primitive architecture.
 *
 * @export
 * @class ChartPrimitiveManager
 */
export class ChartPrimitiveManager {
  private static instances: Map<string, ChartPrimitiveManager> = new Map();

  private chart: IChartApi;
  private chartId: string;
  private eventManager: PrimitiveEventManager;
  private primitives: Map<string, LegendPrimitive | RangeSwitcherPrimitive | ButtonPanelPrimitive> =
    new Map();
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
    const instance = ChartPrimitiveManager.instances.get(chartId);
    if (!instance) {
      throw new Error(`ChartPrimitiveManager instance not found for chartId: ${chartId}`);
    }
    return instance;
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
    } catch {
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
        } catch {
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
    } catch {
      return { destroy: () => {} };
    }
  }

  /**
   * Add button panel (gear + collapse buttons) primitive
   */
  public addButtonPanel(
    paneId: number,
    config: PaneCollapseConfig = {}
  ): { destroy: () => void; plugin: ButtonPanelPrimitive } {
    const primitiveId = `button-panel-${this.chartId}-${paneId}`;

    try {
      const buttonPanel = createButtonPanelPrimitive(
        paneId,
        {
          corner: config.corner || 'top-right',
          priority: PrimitivePriority.MINIMIZE_BUTTON,
          paneId,
          chartId: this.chartId,
          buttonSize: config.buttonSize,
          buttonColor: config.buttonColor,
          buttonHoverColor: config.buttonHoverColor,
          buttonBackground: config.buttonBackground,
          buttonHoverBackground: config.buttonHoverBackground,
          buttonBorderRadius: config.buttonBorderRadius,
          showTooltip: config.showTooltip,
          tooltipText: config.tooltipText,
          showCollapseButton: config.showCollapseButton,
          showSeriesSettingsButton: config.showSeriesSettingsButton,
          onPaneCollapse: config.onPaneCollapse,
          onPaneExpand: config.onPaneExpand,
          onSeriesConfigChange: config.onSeriesConfigChange,
        },
        this.chartId
      );

      // Use the same attachment pattern as legends for consistent behavior
      const targetPaneId = (buttonPanel as any).getPaneId
        ? (buttonPanel as any).getPaneId()
        : paneId;
      const isPanePrimitive = targetPaneId > 0; // Follow legend pattern: paneId > 0
      this.attachToPaneAsFallback(buttonPanel, isPanePrimitive, targetPaneId);

      this.primitives.set(primitiveId, buttonPanel);

      return {
        destroy: () => this.destroyPrimitive(primitiveId),
        plugin: buttonPanel,
      };
    } catch {
      return {
        destroy: () => {},
        plugin: createButtonPanelPrimitive(
          paneId,
          {
            corner: 'top-right',
            priority: PrimitivePriority.MINIMIZE_BUTTON,
            paneId,
            chartId: this.chartId,
          },
          this.chartId
        ),
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
      } catch {
        logger.error('Failed to destroy primitive', 'ChartPrimitiveManager');
      }
    }
  }

  /**
   * Get primitive by ID
   */
  public getPrimitive(
    primitiveId: string
  ): LegendPrimitive | RangeSwitcherPrimitive | ButtonPanelPrimitive | undefined {
    return this.primitives.get(primitiveId);
  }

  /**
   * Get all primitives
   */
  public getAllPrimitives(): Map<
    string,
    LegendPrimitive | RangeSwitcherPrimitive | ButtonPanelPrimitive
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
      } catch {
        logger.error('Failed to detach primitive from pane', 'ChartPrimitiveManager');
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
    primitive: LegendPrimitive | RangeSwitcherPrimitive | ButtonPanelPrimitive,
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
