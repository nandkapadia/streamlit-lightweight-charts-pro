/**
 * @fileoverview Streamlit backend integration for series configuration persistence.
 *
 * This service manages communication between the frontend series configuration
 * system and the Streamlit backend, ensuring that user preferences persist
 * across component redraws and browser sessions.
 */

import { Streamlit } from 'streamlit-component-lib';
import { SeriesConfiguration, SeriesType } from '../types/SeriesTypes';
import { logger } from '../utils/logger';
import { Singleton } from '../utils/SingletonBase';
import { isStreamlitComponentReady } from '../hooks/useStreamlit';
import { handleError, ErrorSeverity } from '../utils/errorHandler';
import { TIMING } from '../config/positioningConfig';

/**
 * Event data for series configuration changes.
 */
export interface SeriesConfigChangeEvent {
  paneId: number;
  seriesId: string;
  seriesType: SeriesType;
  config: SeriesConfiguration;
  timestamp: number;
  chartId?: string;
}

export interface SeriesConfigState {
  [chartId: string]: {
    [paneId: number]: {
      [seriesId: string]: {
        config: SeriesConfiguration;
        seriesType: SeriesType;
        lastModified: number;
      };
    };
  };
}

/**
 * Service for managing series configuration persistence with Streamlit backend
 */
// @ts-expect-error - Decorator doesn't support private constructors
@Singleton()
export class StreamlitSeriesConfigService {
  static getInstance: () => StreamlitSeriesConfigService;

  private configState: SeriesConfigState = {};
  private pendingChanges: SeriesConfigChangeEvent[] = [];
  private debounceTimer: NodeJS.Timeout | null = null;
  private readonly debounceDelay = TIMING.backendSyncDebounce;

  private constructor() {
    // Private constructor for singleton
  }

  /**
   * Initialize the service with backend data (called from main component)
   */
  public static initializeFromBackend(backendData?: any): void {
    const service = StreamlitSeriesConfigService.getInstance();
    if (backendData) {
      service.restoreFromBackend(backendData);
    }
  }

  /**
   * Initialize the service with current configuration state from backend
   */
  public initialize(initialState?: SeriesConfigState): void {
    if (initialState) {
      this.configState = { ...initialState };
    }
  }

  /**
   * Record a series configuration change and queue it for backend sync
   */
  public recordConfigChange(
    paneId: number,
    seriesId: string,
    seriesType: SeriesType,
    config: SeriesConfiguration,
    chartId?: string
  ): void {
    const event: SeriesConfigChangeEvent = {
      paneId,
      seriesId,
      seriesType,
      config: { ...config }, // Deep copy to avoid mutations
      timestamp: Date.now(),
      chartId: chartId || 'default',
    };

    // Update local state immediately
    this.updateLocalState(event);

    // Add to pending changes
    this.pendingChanges.push(event);

    // Debounce backend sync to avoid excessive updates
    this.debouncedSync();
  }

  /**
   * Get current configuration for a specific series
   */
  public getSeriesConfig(
    paneId: number,
    seriesId: string,
    chartId?: string
  ): SeriesConfiguration | null {
    const cId = chartId || 'default';
    return this.configState[cId]?.[paneId]?.[seriesId]?.config || null;
  }

  /**
   * Get all configurations for a specific chart
   */
  public getChartConfig(chartId?: string): SeriesConfigState[string] | null {
    const cId = chartId || 'default';
    return this.configState[cId] || null;
  }

  /**
   * Get the complete configuration state
   */
  public getCompleteState(): SeriesConfigState {
    return { ...this.configState };
  }

  /**
   * Clear all pending changes (useful for cleanup)
   */
  public clearPendingChanges(): void {
    this.pendingChanges = [];
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }

  /**
   * Force immediate sync with backend (bypasses debounce)
   */
  public forceSyncToBackend(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    this.syncToBackend();
  }

  /**
   * Update local state with a configuration change
   */
  private updateLocalState(event: SeriesConfigChangeEvent): void {
    const { paneId, seriesId, seriesType, config, timestamp, chartId } = event;
    const cId = chartId || 'default';

    // Ensure nested structure exists
    if (!this.configState[cId]) {
      this.configState[cId] = {};
    }
    if (!this.configState[cId][paneId]) {
      this.configState[cId][paneId] = {};
    }

    // Update configuration
    this.configState[cId][paneId][seriesId] = {
      config: { ...config },
      seriesType,
      lastModified: timestamp,
    };
  }

  /**
   * Debounced sync to backend
   */
  private debouncedSync(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.syncToBackend();
    }, this.debounceDelay);
  }

  /**
   * Sync pending changes to Streamlit backend
   */
  private syncToBackend(): void {
    if (this.pendingChanges.length === 0) {
      return;
    }

    try {
      // Prepare payload for backend sync
      const payload = {
        type: 'series_config_changes',
        changes: [...this.pendingChanges],
        completeState: this.getCompleteState(),
        timestamp: Date.now(),
      };

      // Send to Streamlit backend only if component is ready
      if (!isStreamlitComponentReady()) {
        logger.warn('Streamlit component not ready, skipping sync', 'StreamlitSeriesConfigService');
        return;
      }

      // Clear pending changes before sending to prevent duplicates
      this.pendingChanges = [];

      // Send configuration to backend for persistence
      if (typeof Streamlit !== 'undefined' && Streamlit.setComponentValue) {
        Streamlit.setComponentValue(payload);
        logger.debug('Sent series config to backend', 'StreamlitSeriesConfigService', payload);
      } else {
        logger.warn(
          'Streamlit not available or setComponentValue not found',
          'StreamlitSeriesConfigService'
        );
      }
    } catch (error) {
      logger.error('Error syncing to backend', 'StreamlitSeriesConfigService', error);
      // Backend sync errors are non-critical - log as warning
      // Don't clear pending changes on error - they can be retried
      handleError(error, 'StreamlitSeriesConfigService.syncToBackend', ErrorSeverity.WARNING);
    }
  }

  /**
   * Handle configuration restoration from backend (on component reload)
   */
  public restoreFromBackend(backendState: any): void {
    try {
      if (backendState && typeof backendState === 'object') {
        // Validate and restore state structure
        if (backendState.completeState) {
          this.configState = backendState.completeState;
        }

        // Apply any missed changes
        if (backendState.changes && Array.isArray(backendState.changes)) {
          backendState.changes.forEach((change: SeriesConfigChangeEvent) => {
            // Validate change object has required properties before processing
            if (
              change &&
              typeof change === 'object' &&
              typeof change.paneId === 'number' &&
              typeof change.seriesId === 'string' &&
              change.config
            ) {
              this.updateLocalState(change);
            }
          });
        }
      }
    } catch (error) {
      // Config send failures should propagate
      handleError(
        error,
        'StreamlitSeriesConfigService.sendSeriesConfiguration',
        ErrorSeverity.ERROR
      );
    }
  }

  /**
   * Create a callback function for use with ButtonPanelPlugin
   */
  public createConfigChangeCallback(chartId?: string) {
    return (paneId: number, seriesId: string, config: SeriesConfiguration) => {
      // Infer series type from config or use default
      const seriesType = this.inferSeriesType(config, seriesId);

      this.recordConfigChange(paneId, seriesId, seriesType, config, chartId);
    };
  }

  /**
   * Infer series type from configuration or series ID
   */
  private inferSeriesType(config: SeriesConfiguration, seriesId: string): SeriesType {
    // Check if config contains series-specific properties
    if (config.period !== undefined && config.multiplier !== undefined) {
      return 'supertrend';
    }
    if (config.length !== undefined && config.stdDev !== undefined) {
      return 'bollinger_bands';
    }
    if (config.length !== undefined && config.source !== undefined) {
      if (seriesId.includes('sma') || seriesId.includes('simple')) {
        return 'sma';
      }
      if (seriesId.includes('ema') || seriesId.includes('exponential')) {
        return 'ema';
      }
    }

    // Infer from series ID patterns
    if (seriesId.includes('candlestick') || seriesId.includes('candle')) {
      return 'candlestick';
    }
    if (seriesId.includes('histogram') || seriesId.includes('volume')) {
      return 'histogram';
    }
    if (seriesId.includes('area')) {
      return 'area';
    }
    if (seriesId.includes('bar')) {
      return 'bar';
    }

    // Default to line series
    return 'line';
  }

  /**
   * Get statistics about the service state (for debugging)
   */
  public getStats(): {
    totalConfigs: number;
    pendingChanges: number;
    charts: number;
    lastSyncTime: number | null;
  } {
    const totalConfigs = Object.values(this.configState).reduce(
      (total, chartConfig) =>
        total +
        Object.values(chartConfig).reduce(
          (chartTotal, paneConfig) => chartTotal + Object.keys(paneConfig).length,
          0
        ),
      0
    );

    return {
      totalConfigs,
      pendingChanges: this.pendingChanges.length,
      charts: Object.keys(this.configState).length,
      lastSyncTime: this.pendingChanges.length > 0 ? null : Date.now(),
    };
  }

  /**
   * Reset the service (useful for cleanup or testing)
   */
  public reset(): void {
    this.configState = {};
    this.pendingChanges = [];
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }
}
