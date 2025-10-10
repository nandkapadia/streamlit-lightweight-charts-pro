/**
 * @fileoverview Pane Collapse Manager
 *
 * Manages pane collapse/expand functionality for Lightweight Charts using the official API.
 *
 * ✅ API-BASED APPROACH:
 * This manager uses the Lightweight Charts official Pane API to collapse/expand panes:
 * - chart.panes()[paneId].setHeight(height) - Set pane height
 * - chart.paneSize(paneId) - Get current pane dimensions
 *
 * Minimum collapsed height is 30px per the lightweight-charts API specification.
 *
 * Responsibilities:
 * - Collapse/expand panes via official Pane API
 * - Track collapse state per pane
 * - Store/restore original heights
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
  public static getInstance(chartApi: IChartApi, chartId?: string, config: PaneCollapseConfig = {}): PaneCollapseManager {
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
        onPaneCollapse: callbacks?.onPaneCollapse,
        onPaneExpand: callbacks?.onPaneExpand,
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
   * Collapse a pane
   *
   * Strategy:
   * 1. Store original pane height from chart API
   * 2. Use chart.panes()[paneId].setHeight(30) to collapse pane (using official API)
   */
  public collapse(paneId: number): void {
    const state = this.states.get(paneId);
    if (!state || state.isCollapsed) return;

    try {
      // Store original height before collapsing
      const paneSize = this.chartApi.paneSize(paneId);
      if (paneSize) {
        state.originalHeight = paneSize.height;
      }

      // Use official chart API to set pane height
      const panes = this.chartApi.panes();
      if (panes && panes[paneId]) {
        panes[paneId].setHeight(state.collapsedHeight);
      } else {
        logger.error('Pane not found in chart.panes()', 'PaneCollapseManager', { paneId });
        return;
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
   * Expand a pane
   *
   * Strategy:
   * 1. Use chart.panes()[paneId].setHeight(originalHeight) to restore pane height (using official API)
   */
  public expand(paneId: number): void {
    const state = this.states.get(paneId);
    if (!state || !state.isCollapsed) return;

    try {
      // Use official chart API to restore pane height
      const panes = this.chartApi.panes();
      if (panes && panes[paneId] && state.originalHeight > 0) {
        panes[paneId].setHeight(state.originalHeight);
      } else {
        logger.error('Pane not found in chart.panes() or no original height stored', 'PaneCollapseManager', { paneId });
        return;
      }

      state.isCollapsed = false;

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
