/**
 * @fileoverview Pane Collapse Manager
 *
 * Manages pane collapse/expand functionality for Lightweight Charts using the official API.
 *
 * ✅ MANUAL REDISTRIBUTION APPROACH (Simple and Explicit):
 *
 * This manager uses the lightweight-charts Pane API:
 * - pane.setHeight(height) - Set pane height explicitly
 * - chart.paneSize(paneId) - Get current pane dimensions
 *
 * MANUAL REDISTRIBUTION STRATEGY:
 * Instead of relying on stretch factors or automatic redistribution, we explicitly
 * control where freed/reclaimed space goes:
 *
 * When collapsing a pane:
 * 1. Get current heights of ALL panes
 * 2. Save original height of collapsing pane
 * 3. Calculate freed space: originalHeight - 30px
 * 4. Add freed space to Pane 0 (first pane)
 * 5. Set Pane 0 to new height, then set collapsing pane to 30px
 *
 * When expanding a pane:
 * 1. Get current heights of ALL panes
 * 2. Calculate space to reclaim: originalHeight - 30px
 * 3. Subtract that space from Pane 0 (reverse operation)
 * 4. Set Pane 0 to new height, then set expanding pane to originalHeight
 *
 * Why Pane 0?
 * - Simple and predictable (always the same target)
 * - Avoids complex multi-pane redistribution logic
 * - Works for any number of panes
 * - Easy to debug and understand
 *
 * This approach is explicit, deterministic, and works perfectly for all scenarios!
 *
 * Responsibilities:
 * - Collapse/expand panes via explicit height setting
 * - Track collapse state per pane
 * - Store/restore original heights
 * - Manually redistribute space to/from Pane 0
 * - Trigger callbacks on state changes
 */

import { IChartApi } from 'lightweight-charts';
import { logger } from '../utils/logger';
import { KeyedSingletonManager } from '../utils/KeyedSingletonManager';
import { handleError, ErrorSeverity } from '../utils/errorHandler';
import { DIMENSIONS } from '../config/positioningConfig';

/**
 * Pane collapse state
 */
export interface PaneCollapseState {
  isCollapsed: boolean;
  originalHeight: number;
  collapsedHeight: number;
  onPaneCollapse?: (paneId: number, isCollapsed: boolean) => void;
  onPaneExpand?: (paneId: number, isCollapsed: boolean) => void;
}

/**
 * Pane collapse configuration
 */
export interface PaneCollapseConfig {
  collapsedHeight?: number;
  chartId?: string;
  onPaneCollapse?: (paneId: number, isCollapsed: boolean) => void;
  onPaneExpand?: (paneId: number, isCollapsed: boolean) => void;
}

/**
 * Manager for pane collapse/expand functionality
 */
export class PaneCollapseManager extends KeyedSingletonManager<PaneCollapseManager> {
  private chartApi: IChartApi;
  private states = new Map<number, PaneCollapseState>();
  private config: PaneCollapseConfig;

  private constructor(chartApi: IChartApi, config: PaneCollapseConfig = {}) {
    super();
    this.chartApi = chartApi;
    this.config = {
      collapsedHeight: DIMENSIONS.pane.collapsedHeight,
      chartId: config.chartId || 'default',
      ...config,
    };
  }

  /**
   * Get or create singleton instance for a chart
   */
  public static getInstance(
    chartApi: IChartApi,
    chartId?: string,
    config: PaneCollapseConfig = {}
  ): PaneCollapseManager {
    const key = chartId || 'default';
    return KeyedSingletonManager.getOrCreateInstance(
      'PaneCollapseManager',
      key,
      () => new PaneCollapseManager(chartApi, { ...config, chartId: key })
    );
  }

  /**
   * Destroy singleton instance for a chart
   */
  public static destroyInstance(chartId?: string): void {
    const key = chartId || 'default';
    KeyedSingletonManager.destroyInstanceByKey('PaneCollapseManager', key);
  }

  /**
   * Initialize state for a pane with optional callbacks
   *
   * Callbacks are stored per-pane to support multiple panes with different handlers.
   * This fixes the singleton issue where only the first pane's callbacks were used.
   */
  public initializePane(
    paneId: number,
    callbacks?: {
      onPaneCollapse?: (paneId: number, isCollapsed: boolean) => void;
      onPaneExpand?: (paneId: number, isCollapsed: boolean) => void;
    }
  ): void {
    if (!this.states.has(paneId)) {
      this.states.set(paneId, {
        isCollapsed: false,
        originalHeight: 0,
        collapsedHeight: this.config?.collapsedHeight || DIMENSIONS.pane.collapsedHeight,
        // Use per-pane callbacks if provided, otherwise fallback to config callbacks
        onPaneCollapse: callbacks?.onPaneCollapse || this.config?.onPaneCollapse,
        onPaneExpand: callbacks?.onPaneExpand || this.config?.onPaneExpand,
      });
    }
  }

  /**
   * Get collapse state for a pane
   */
  public getState(paneId: number): PaneCollapseState | undefined {
    return this.states.get(paneId);
  }

  /**
   * Check if a pane is collapsed
   */
  public isCollapsed(paneId: number): boolean {
    return this.states.get(paneId)?.isCollapsed || false;
  }

  /**
   * Toggle pane collapse state
   */
  public toggle(paneId: number): void {
    const state = this.states.get(paneId);
    if (!state) {
      logger.error('Pane state not initialized', 'PaneCollapseManager', { paneId });
      return;
    }

    try {
      if (state.isCollapsed) {
        this.expand(paneId);
      } else {
        this.collapse(paneId);
      }
    } catch (error) {
      handleError(error, 'PaneCollapseManager.toggle', ErrorSeverity.WARNING);
    }
  }

  /**
   * Collapse a pane using manual redistribution to non-collapsed panes
   *
   * MANUAL REDISTRIBUTION STRATEGY:
   * 1. Save original height of collapsing pane
   * 2. Calculate freed space: originalHeight - collapsedHeight
   * 3. Find all EXPANDED (non-collapsed) panes
   * 4. Distribute freed space ONLY among expanded panes
   * 5. Set ALL pane heights (collapsed + expanded) to prevent chart's auto-redistribution
   *
   * This ensures collapsed panes stay collapsed when collapsing additional panes!
   */
  public collapse(paneId: number): void {
    const state = this.states.get(paneId);
    if (!state || state.isCollapsed) return;

    try {
      const panes = this.chartApi.panes();
      if (!panes || !panes[paneId]) {
        logger.error('Pane not found in chart.panes()', 'PaneCollapseManager', { paneId });
        return;
      }

      // 1. Get current sizes of ALL panes
      const currentSizes = new Map<number, number>();
      let paneIndex = 0;
      while (paneIndex < 10) {
        try {
          const size = this.chartApi.paneSize(paneIndex);
          if (!size) break;
          currentSizes.set(paneIndex, size.height);
          paneIndex++;
        } catch {
          break;
        }
      }

      // 2. Save original height for this pane (if first collapse)
      if (state.originalHeight === 0) {
        state.originalHeight = currentSizes.get(paneId) || 0;
      }

      // 3. Find all EXPANDED panes (not collapsed, not the one we're collapsing)
      const expandedPanes: number[] = [];
      for (const [id, paneState] of this.states.entries()) {
        if (id !== paneId && !paneState.isCollapsed) {
          expandedPanes.push(id);
        }
      }

      // If no expanded panes found, check all panes (for safety)
      if (expandedPanes.length === 0) {
        for (let i = 0; i < currentSizes.size; i++) {
          if (i !== paneId) {
            expandedPanes.push(i);
          }
        }
      }

      // 4. Calculate freed space
      const freedSpace = state.originalHeight - state.collapsedHeight;

      // 5. Distribute freed space EQUALLY among expanded panes
      const spacePerExpandedPane = freedSpace / expandedPanes.length;

      // 6. Set heights for ALL panes (to prevent chart's auto-redistribution)
      // CRITICAL: Set in order - collapsed panes first, then expanded panes

      // First: Set the collapsing pane
      panes[paneId].setHeight(state.collapsedHeight);

      // Then: Set expanded panes to their new heights
      for (const expandedPaneId of expandedPanes) {
        const currentHeight = currentSizes.get(expandedPaneId) || 0;
        const newHeight = currentHeight + spacePerExpandedPane;
        if (panes[expandedPaneId]) {
          panes[expandedPaneId].setHeight(newHeight);
        }
      }

      // Finally: Re-set any other collapsed panes to ensure they stay at 30px
      for (const [id, paneState] of this.states.entries()) {
        if (id !== paneId && paneState.isCollapsed && panes[id]) {
          panes[id].setHeight(paneState.collapsedHeight);
        }
      }

      state.isCollapsed = true;

      // Trigger per-pane callback
      if (state.onPaneCollapse) {
        state.onPaneCollapse(paneId, true);
      }
    } catch (error) {
      handleError(error, 'PaneCollapseManager.collapse', ErrorSeverity.ERROR);
    }
  }

  /**
   * Expand a pane using manual redistribution from non-collapsed panes
   *
   * MANUAL REDISTRIBUTION STRATEGY:
   * 1. Calculate space to reclaim: originalHeight - collapsedHeight
   * 2. Find all EXPANDED (non-collapsed) panes
   * 3. Take space EQUALLY from expanded panes only
   * 4. Set ALL pane heights (collapsed + expanded) to prevent chart's auto-redistribution
   *
   * This ensures collapsed panes stay collapsed when expanding other panes!
   */
  public expand(paneId: number): void {
    const state = this.states.get(paneId);
    if (!state || !state.isCollapsed) return;

    try {
      const panes = this.chartApi.panes();
      if (!panes || !panes[paneId]) {
        logger.error('Pane not found in chart.panes()', 'PaneCollapseManager', { paneId });
        return;
      }

      // 1. Get current sizes of ALL panes
      const currentSizes = new Map<number, number>();
      let paneIndex = 0;
      while (paneIndex < 10) {
        try {
          const size = this.chartApi.paneSize(paneIndex);
          if (!size) break;
          currentSizes.set(paneIndex, size.height);
          paneIndex++;
        } catch {
          break;
        }
      }

      // 2. Find all EXPANDED panes (not the one we're expanding, not collapsed)
      const expandedPanes: number[] = [];
      for (const [id, paneState] of this.states.entries()) {
        if (id !== paneId && !paneState.isCollapsed) {
          expandedPanes.push(id);
        }
      }

      // If no expanded panes found, check all panes (for safety)
      if (expandedPanes.length === 0) {
        for (let i = 0; i < currentSizes.size; i++) {
          if (i !== paneId && currentSizes.has(i)) {
            expandedPanes.push(i);
          }
        }
      }

      // 3. Calculate space to reclaim
      const spaceToReclaim = state.originalHeight - state.collapsedHeight;

      // 4. Take space EQUALLY from all expanded panes
      const spacePerExpandedPane = spaceToReclaim / expandedPanes.length;

      // 5. Set heights for ALL panes in order
      // CRITICAL: Set expanded panes first (to shrink them), then expanding pane

      // First: Shrink expanded panes
      for (const expandedPaneId of expandedPanes) {
        const currentHeight = currentSizes.get(expandedPaneId) || 0;
        const newHeight = currentHeight - spacePerExpandedPane;
        if (panes[expandedPaneId] && newHeight > 30) {
          panes[expandedPaneId].setHeight(newHeight);
        }
      }

      // Then: Expand the target pane
      if (state.originalHeight > 0) {
        panes[paneId].setHeight(state.originalHeight);
      }

      // Finally: Re-set any other collapsed panes to ensure they stay at 30px
      for (const [id, paneState] of this.states.entries()) {
        if (id !== paneId && paneState.isCollapsed && panes[id]) {
          panes[id].setHeight(paneState.collapsedHeight);
        }
      }

      state.isCollapsed = false;

      // Reset saved values so next collapse captures current state
      state.originalHeight = 0;

      // Trigger per-pane callback
      if (state.onPaneExpand) {
        state.onPaneExpand(paneId, false);
      }
    } catch (error) {
      handleError(error, 'PaneCollapseManager.expand', ErrorSeverity.ERROR);
    }
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    this.states.clear();

    // Clear all references to allow garbage collection
    (this as any).chartApi = null;
    (this as any).config = null;
  }
}
