/**
 * @fileoverview Backend Synchronization Adapter Interface
 *
 * Provides a framework-agnostic interface for syncing series configuration
 * to backend storage. Each framework (Streamlit, Vue, React, etc.) implements
 * this interface to persist configuration data.
 *
 * This design pattern allows core services (SeriesDialogManager, ButtonPanelPrimitive)
 * to remain framework-agnostic while still supporting backend persistence.
 *
 * Implementation examples:
 * - Streamlit: Sync via Streamlit.setComponentValue()
 * - Vue: Sync via Vuex/Pinia store with API calls
 * - React: Sync via Redux/Context with API calls
 * - Vanilla: Sync via localStorage or custom backend
 */

import { SeriesConfiguration, SeriesType } from '../types/SeriesTypes';

/**
 * Configuration change event data
 */
export interface ConfigChangeEvent {
  paneId: number;
  seriesId: string;
  seriesType: SeriesType;
  config: SeriesConfiguration;
  timestamp: number;
  chartId?: string;
}

/**
 * Backend synchronization adapter interface
 *
 * Frameworks implement this interface to provide backend persistence
 * for series configuration changes.
 *
 * @interface BackendSyncAdapter
 */
export interface BackendSyncAdapter {
  /**
   * Record a configuration change
   *
   * @param paneId - Pane identifier
   * @param seriesId - Series identifier
   * @param seriesType - Type of series
   * @param config - Series configuration
   * @param chartId - Optional chart identifier for multi-chart scenarios
   */
  recordConfigChange(
    paneId: number,
    seriesId: string,
    seriesType: SeriesType,
    config: SeriesConfiguration,
    chartId?: string
  ): void;

  /**
   * Get current configuration for a series
   *
   * @param paneId - Pane identifier
   * @param seriesId - Series identifier
   * @param chartId - Optional chart identifier
   * @returns Series configuration or null if not found
   */
  getSeriesConfig(
    paneId: number,
    seriesId: string,
    chartId?: string
  ): SeriesConfiguration | null;

  /**
   * Force immediate synchronization to backend (bypasses any debouncing)
   */
  forceSyncToBackend(): void;

  /**
   * Clear all pending changes (useful for cleanup)
   */
  clearPendingChanges(): void;

  /**
   * Initialize with backend data (called on component mount/reload)
   *
   * @param backendData - Data from backend storage
   */
  restoreFromBackend?(backendData: any): void;
}

/**
 * No-op implementation for scenarios without backend persistence
 *
 * Useful for:
 * - Testing
 * - Standalone usage without backend
 * - Local-only configuration
 */
export class NoOpBackendSyncAdapter implements BackendSyncAdapter {
  recordConfigChange(
    _paneId: number,
    _seriesId: string,
    _seriesType: SeriesType,
    _config: SeriesConfiguration,
    _chartId?: string
  ): void {
    // No-op: changes are not persisted
  }

  getSeriesConfig(
    _paneId: number,
    _seriesId: string,
    _chartId?: string
  ): SeriesConfiguration | null {
    return null;
  }

  forceSyncToBackend(): void {
    // No-op
  }

  clearPendingChanges(): void {
    // No-op
  }

  restoreFromBackend(_backendData: any): void {
    // No-op
  }
}

/**
 * In-memory implementation for client-side-only persistence
 *
 * Stores configuration in memory (lost on page reload).
 * Useful for scenarios where backend persistence is not needed.
 */
export class InMemoryBackendSyncAdapter implements BackendSyncAdapter {
  private configState: Map<string, Map<number, Map<string, SeriesConfiguration>>> = new Map();

  recordConfigChange(
    paneId: number,
    seriesId: string,
    _seriesType: SeriesType,
    config: SeriesConfiguration,
    chartId?: string
  ): void {
    const cId = chartId || 'default';

    if (!this.configState.has(cId)) {
      this.configState.set(cId, new Map());
    }

    const chartConfig = this.configState.get(cId)!;
    if (!chartConfig.has(paneId)) {
      chartConfig.set(paneId, new Map());
    }

    const paneConfig = chartConfig.get(paneId)!;
    paneConfig.set(seriesId, { ...config });
  }

  getSeriesConfig(
    paneId: number,
    seriesId: string,
    chartId?: string
  ): SeriesConfiguration | null {
    const cId = chartId || 'default';
    return this.configState.get(cId)?.get(paneId)?.get(seriesId) || null;
  }

  forceSyncToBackend(): void {
    // No backend to sync to
  }

  clearPendingChanges(): void {
    // No pending changes in memory-only mode
  }

  restoreFromBackend(backendData: any): void {
    if (backendData && typeof backendData === 'object') {
      // Restore state structure from backend data
      for (const [chartId, chartData] of Object.entries(backendData)) {
        const chartConfig = new Map<number, Map<string, SeriesConfiguration>>();

        if (chartData && typeof chartData === 'object') {
          for (const [paneIdStr, paneData] of Object.entries(chartData)) {
            const paneId = parseInt(paneIdStr, 10);
            const paneConfig = new Map<string, SeriesConfiguration>();

            if (paneData && typeof paneData === 'object') {
              for (const [seriesId, seriesData] of Object.entries(paneData)) {
                if (
                  seriesData &&
                  typeof seriesData === 'object' &&
                  'config' in seriesData
                ) {
                  paneConfig.set(seriesId, (seriesData as any).config);
                }
              }
            }

            chartConfig.set(paneId, paneConfig);
          }
        }

        this.configState.set(chartId, chartConfig);
      }
    }
  }

  /**
   * Clear all stored configuration (useful for testing)
   */
  clear(): void {
    this.configState.clear();
  }
}
