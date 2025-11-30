/**
 * @fileoverview Chart Primitive Manager (Framework-Agnostic)
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
 * - Framework-agnostic (no React, no Streamlit dependencies)
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
 * // Add button panel (requires BackendSyncAdapter)
 * const adapter = new YourFrameworkBackendSyncAdapter(yourService);
 * const buttonPanel = manager.addButtonPanel(paneId, adapter, config);
 *
 * // Cleanup on unmount
 * ChartPrimitiveManager.cleanup('chart-1');
 * ```
 */

import { IChartApi } from 'lightweight-charts';
import { logger } from '../utils/logger';
import {
  LegendPrimitive,
  RangeSwitcherPrimitive,
  ButtonPanelPrimitive,
  createButtonPanelPrimitive,
  PrimitivePriority,
  DefaultRangeConfigs,
  type RangeConfig,
} from '../primitives';
import { PrimitiveEventManager } from '../services/PrimitiveEventManager';
import { CornerLayoutManager } from '../services/CornerLayoutManager';
import { SeriesDialogManager } from '../services/SeriesDialogManager';
import { PaneCollapseManager } from '../services/PaneCollapseManager';
import { BackendSyncAdapter } from '../services/BackendSyncAdapter';
import type {
  ExtendedSeriesApi,
  CrosshairEventData,
  Corner,
} from '../types';

/**
 * Range switcher configuration options
 */
export interface RangeSwitcherConfig {
  position?: Corner;
  ranges?: RangeConfig[];
}

/**
 * Legend configuration options for ChartPrimitiveManager
 */
export interface LegendManagerConfig {
  position?: Corner;
  text?: string;
  valueFormat?: string;
  visible?: boolean;
  backgroundColor?: string;
  textColor?: string;
}

/**
 * Button panel configuration options for ChartPrimitiveManager
 * This is a simplified config that matches ButtonPanelPrimitiveConfig
 */
export interface ButtonPanelConfig {
  corner?: Corner;
  buttonSize?: number;
  buttonColor?: string;
  buttonHoverColor?: string;
  buttonBackground?: string;
  buttonHoverBackground?: string;
  buttonBorderRadius?: number;
  showTooltip?: boolean;
  tooltipText?: {
    collapse?: string;
    expand?: string;
  };
  showCollapseButton?: boolean;
  showSeriesSettingsButton?: boolean;
  onPaneCollapse?: (paneId: number, isCollapsed: boolean) => void;
  onPaneExpand?: (paneId: number, isCollapsed: boolean) => void;
  onSeriesConfigChange?: (
    paneId: number,
    seriesId: string,
    config: Record<string, unknown>
  ) => void;
}

/**
 * ChartPrimitiveManager - Centralized primitive lifecycle manager (Framework-Agnostic)
 *
 * Manages all chart primitives with unified API, coordinated positioning,
 * and proper cleanup. Replaces old widget-based approach with pure
 * primitive architecture.
 *
 * This is a framework-agnostic implementation with zero React or Streamlit dependencies.
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

    // CRITICAL: Cleanup all singleton managers for this chart
    // SeriesDialogManager and PaneCollapseManager are singletons that persist
    // across reinitialization. We must destroy them to clear their state.
    SeriesDialogManager.destroyInstance(chartId);
    PaneCollapseManager.destroyInstance(chartId);

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
      logger.info(`Creating range switcher - chartId: ${this.chartId}`, 'ChartPrimitiveManager');

      const rangeSwitcher = new RangeSwitcherPrimitive(primitiveId, {
        corner: config.position || 'top-right',
        priority: PrimitivePriority.RANGE_SWITCHER,
        ranges: config.ranges || [...DefaultRangeConfigs.trading],
      });

      logger.info(`Range switcher created, attaching to pane...`, 'ChartPrimitiveManager');

      // Attach to first pane (chart-level primitives go to pane 0)
      const panes = this.chart.panes();
      if (panes.length > 0) {
        panes[0].attachPrimitive(rangeSwitcher);
        logger.info(`Range switcher attached to pane 0`, 'ChartPrimitiveManager');
      } else {
        logger.error('No panes available to attach range switcher', 'ChartPrimitiveManager');
      }
      this.primitives.set(primitiveId, rangeSwitcher);

      return {
        destroy: () => this.destroyPrimitive(primitiveId),
      };
    } catch (error) {
      logger.error('Failed to add range switcher', 'ChartPrimitiveManager', error);
      return { destroy: () => {} };
    }
  }

  /**
   * Add legend primitive
   */
  public addLegend(
    config: LegendManagerConfig,
    isPanePrimitive: boolean = false,
    paneId: number = 0,
    seriesReference?: ExtendedSeriesApi
  ): { destroy: () => void; primitiveId: string } {
    const primitiveId = `legend-${this.chartId}-${++this.legendCounter}`;

    try {
      const legend = new LegendPrimitive(primitiveId, {
        corner: config.position || 'top-left',
        priority: PrimitivePriority.LEGEND,
        text: config.text || '$$value$$',
        valueFormat: config.valueFormat || '.2f',
        isPanePrimitive,
        paneId,
        visible: config.visible !== false, // Pass visible from config
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
        primitiveId, // Return primitiveId so caller can access the primitive later
      };
    } catch {
      return { destroy: () => {}, primitiveId: '' };
    }
  }

  /**
   * Add button panel (gear + collapse buttons) primitive
   *
   * FRAMEWORK-AGNOSTIC: Accepts BackendSyncAdapter as parameter instead of
   * hardcoding framework-specific adapter creation.
   *
   * @param paneId - Pane identifier
   * @param backendAdapter - Backend sync adapter for configuration persistence
   * @param config - Optional configuration overrides
   * @returns Object with destroy function and button panel primitive
   */
  public addButtonPanel(
    paneId: number,
    backendAdapter: BackendSyncAdapter,
    config: ButtonPanelConfig = {}
  ): { destroy: () => void; plugin: ButtonPanelPrimitive } {
    const primitiveId = `button-panel-${this.chartId}-${paneId}`;

    try {
      const buttonPanel = createButtonPanelPrimitive(
        paneId,
        backendAdapter,
        {
          corner: config.corner || 'top-right',
          priority: PrimitivePriority.MINIMIZE_BUTTON,
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
      // Fallback: Create with minimal config
      return {
        destroy: () => {},
        plugin: createButtonPanelPrimitive(
          paneId,
          backendAdapter,
          {
            corner: 'top-right',
            priority: PrimitivePriority.MINIMIZE_BUTTON,
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
