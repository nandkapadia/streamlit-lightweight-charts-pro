/**
 * @fileoverview Series Dialog Manager
 *
 * Manages series configuration dialog for Lightweight Charts.
 *
 * ℹ️ REACT PORTAL PATTERN:
 * This manager creates dialog containers and uses React's createRoot API to
 * render React components into them. This is the correct approach for:
 * 1. Rendering React components outside the main component tree (portals)
 * 2. Managing dialog lifecycle independently from chart rendering
 * 3. Ensuring dialogs appear on top of all other content
 *
 * The container is created via DOM manipulation, but React controls all
 * rendering within it. This is a standard pattern for modal/dialog systems.
 *
 * Responsibilities:
 * - Open/close series configuration dialog
 * - Create portal containers for React rendering
 * - Manage dialog state per pane
 * - Apply configuration changes via Streamlit service
 * - Coordinate with backend for persistence
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { IChartApi, ISeriesApi } from 'lightweight-charts';
import { logger } from '../utils/logger';
import { StreamlitSeriesConfigService } from './StreamlitSeriesConfigService';
import { SeriesType, SeriesConfiguration } from '../types/SeriesTypes';
import { apiOptionsToDialogConfig } from '../series/UnifiedPropertyMapper';
import {
  SeriesSettingsDialog,
  SeriesInfo as DialogSeriesInfo,
  SeriesConfig,
} from '../forms/SeriesSettingsDialog';
import { KeyedSingletonManager } from '../utils/KeyedSingletonManager';
import { handleError, ErrorSeverity } from '../utils/errorHandler';
import { CSS_CLASSES } from '../config/positioningConfig';

/**
 * Local SeriesInfo interface with config property
 */
export interface SeriesInfo {
  id: string;
  displayName?: string;
  type: SeriesType;
  config?: SeriesConfiguration;
  title?: string;
}

/**
 * Dialog state for a pane
 */
export interface DialogState {
  dialogElement?: HTMLElement;
  dialogRoot?: ReturnType<typeof createRoot>;
  seriesConfigs: Map<string, SeriesConfiguration>;
}

/**
 * Configuration for series dialog manager
 */
export interface SeriesDialogConfig {
  chartId?: string;
  onSeriesConfigChange?: (
    paneId: number,
    seriesId: string,
    config: Record<string, unknown>
  ) => void;
}

/**
 * Manager for series configuration dialog
 *
 * Manages the lifecycle of series settings dialogs using React Portals.
 * This class bridges the gap between imperative chart management and
 * declarative React rendering.
 *
 * Architecture:
 * - Keyed singleton pattern (one instance per chart)
 * - React portal for dialog rendering
 * - Streamlit integration for configuration persistence
 * - Per-pane dialog state management
 *
 * Responsibilities:
 * - Create and manage dialog portal containers
 * - Open/close dialogs with current series settings
 * - Apply configuration changes to chart APIs
 * - Coordinate with backend for persistence
 * - Clean up React roots and DOM elements
 *
 * @export
 * @class SeriesDialogManager
 * @extends {KeyedSingletonManager<SeriesDialogManager>}
 *
 * @example
 * ```typescript
 * const manager = SeriesDialogManager.getInstance(
 *   chartApi,
 *   streamlitService,
 *   'chart-1'
 * );
 *
 * // Initialize pane
 * manager.initializePane(0);
 *
 * // Open dialog with current series settings
 * manager.open(0);
 *
 * // Close dialog
 * manager.close(0);
 *
 * // Cleanup on unmount
 * SeriesDialogManager.destroyInstance('chart-1');
 * ```
 */
export class SeriesDialogManager extends KeyedSingletonManager<SeriesDialogManager> {
  /** Chart API reference for accessing panes and series */
  private chartApi: IChartApi;
  /** Streamlit service for configuration persistence */
  private streamlitService: StreamlitSeriesConfigService;
  /** Dialog state per pane (containers, roots, configs) */
  private dialogStates = new Map<number, DialogState>();
  /** Manager configuration (chartId, callbacks) */
  private config: SeriesDialogConfig;

  /**
   * Private constructor (Singleton pattern)
   *
   * Creates a new SeriesDialogManager instance. Use getInstance() instead
   * of calling this directly.
   *
   * @private
   * @param {IChartApi} chartApi - Lightweight Charts API instance
   * @param {StreamlitSeriesConfigService} streamlitService - Streamlit config service
   * @param {SeriesDialogConfig} [config={}] - Optional manager configuration
   */
  private constructor(
    chartApi: IChartApi,
    streamlitService: StreamlitSeriesConfigService,
    config: SeriesDialogConfig = {}
  ) {
    super();
    this.chartApi = chartApi;
    this.streamlitService = streamlitService;
    this.config = config;
  }

  /**
   * Get or create singleton instance for a chart
   */
  public static getInstance(
    chartApi: IChartApi,
    streamlitService: StreamlitSeriesConfigService,
    chartId?: string,
    config: SeriesDialogConfig = {}
  ): SeriesDialogManager {
    const key = chartId || 'default';
    return KeyedSingletonManager.getOrCreateInstance(
      'SeriesDialogManager',
      key,
      () => new SeriesDialogManager(chartApi, streamlitService, config)
    );
  }

  /**
   * Destroy singleton instance for a chart
   */
  public static destroyInstance(chartId?: string): void {
    const key = chartId || 'default';
    KeyedSingletonManager.destroyInstanceByKey('SeriesDialogManager', key);
  }

  /**
   * Initialize dialog state for a pane
   */
  public initializePane(paneId: number): void {
    if (!this.dialogStates.has(paneId)) {
      this.dialogStates.set(paneId, {
        seriesConfigs: new Map(),
      });
    }
  }

  /**
   * Get dialog state for a pane
   */
  public getState(paneId: number): DialogState | undefined {
    return this.dialogStates.get(paneId);
  }

  /**
   * Create dialog portal container
   *
   * Creates a fixed-position container for React portal rendering.
   * This is a one-time DOM operation; all subsequent updates are handled by React.
   *
   * @param paneId - Pane identifier for unique container class
   * @returns Dialog container element
   */
  private createDialogContainer(paneId: number): HTMLElement {
    const dialogContainer = document.createElement('div');
    dialogContainer.className = CSS_CLASSES.seriesDialogContainer(paneId);

    // Use data attribute for robust selection
    dialogContainer.setAttribute('data-dialog-pane-id', String(paneId));
    dialogContainer.setAttribute('role', 'dialog');
    dialogContainer.setAttribute('aria-modal', 'true');

    // Apply portal container styles
    // Note: These are structural styles, not presentation styles
    // Presentation is handled by React components
    dialogContainer.style.position = 'fixed';
    dialogContainer.style.top = '0';
    dialogContainer.style.left = '0';
    dialogContainer.style.width = '100vw';
    dialogContainer.style.height = '100vh';
    dialogContainer.style.zIndex = '10000';
    dialogContainer.style.pointerEvents = 'auto';

    // Append to body (outside React root - this is the portal pattern)
    document.body.appendChild(dialogContainer);

    return dialogContainer;
  }

  /**
   * Open series configuration dialog
   *
   * Creates a React portal container if needed and renders the dialog.
   * The container is created via DOM manipulation, but React controls
   * all rendering within it (standard portal pattern).
   */
  public open(paneId: number): void {
    const state = this.dialogStates.get(paneId);
    if (!state) {
      logger.error('Dialog state not initialized', 'SeriesDialogManager', { paneId });
      return;
    }

    try {
      // Get ALL series for this pane
      const allSeries = this.getAllSeriesForPane(paneId);

      // Create dialog portal container if it doesn't exist
      if (!state.dialogElement) {
        state.dialogElement = this.createDialogContainer(paneId);
        state.dialogRoot = createRoot(state.dialogElement);
      }

      // Re-enable pointer events when opening dialog
      if (state.dialogElement) {
        state.dialogElement.style.pointerEvents = 'auto';
      }

      // Create series configurations from allSeries
      // Read ACTUAL options from chart series instead of using defaults
      const seriesConfigs: Record<string, SeriesConfiguration> = {};

      // Get actual series from the pane directly
      try {
        const panes = this.chartApi.panes();
        if (paneId >= 0 && paneId < panes.length) {
          const pane = panes[paneId];
          const paneSeries = pane.getSeries();

          allSeries.forEach((series, index) => {
            // Get the actual series API object from the pane
            const actualSeries = paneSeries[index];
            if (actualSeries && typeof actualSeries.options === 'function') {
              // Convert API options to dialog config using property mapper
              const apiOptions = actualSeries.options();
              seriesConfigs[series.id] = apiOptionsToDialogConfig(series.type, apiOptions);
            } else {
              // Fallback to stored config or empty object
              seriesConfigs[series.id] = series.config || {};
            }
          });
        }
      } catch (error) {
        logger.error('Failed to load series options', 'SeriesDialogManager', error);
        // Use empty configs as fallback
        allSeries.forEach(series => {
          seriesConfigs[series.id] = series.config || {};
        });
      }

      // Render the dialog with all series
      if (state.dialogRoot) {
        state.dialogRoot.render(
          React.createElement(SeriesSettingsDialog, {
            isOpen: true,
            onClose: () => this.close(paneId),
            paneId: paneId.toString(),
            seriesList: allSeries.map(
              series =>
                ({
                  id: series.id,
                  displayName: series.displayName || series.title || series.id,
                  type: series.type,
                }) as DialogSeriesInfo
            ),
            seriesConfigs: seriesConfigs as Record<string, SeriesConfig>,
            onConfigChange: (seriesId: string, newConfig: SeriesConfig) => {
              // Find the series type from allSeries
              const series = allSeries.find(s => s.id === seriesId);
              const seriesType = series?.type || 'line';

              // Include series type in the config for proper property mapping
              const configWithType = {
                ...newConfig,
                _seriesType: seriesType,
              } as SeriesConfiguration;
              this.applySeriesConfig(paneId, seriesId, configWithType);
            },
          })
        );
      } else {
        logger.error('Failed to create dialog root for series config', 'SeriesDialogManager');
      }
    } catch (error) {
      // Dialog open failures should be visible to caller
      handleError(error, 'SeriesDialogManager.open', ErrorSeverity.ERROR);
    }
  }

  /**
   * Close series configuration dialog
   */
  public close(paneId: number): void {
    const state = this.dialogStates.get(paneId);
    if (!state || !state.dialogRoot) return;

    try {
      // CRITICAL FIX: Sync all pending changes to backend before closing
      // This ensures changes are persisted without causing rerenders during live updates
      try {
        // Force sync any pending changes to backend
        this.streamlitService.forceSyncToBackend();
      } catch (syncError) {
        // Log but don't prevent dialog close
        handleError(syncError, 'SeriesDialogManager.close.syncToBackend', ErrorSeverity.WARNING);
      }

      // Render empty dialog (closed state)
      state.dialogRoot.render(
        React.createElement(SeriesSettingsDialog, {
          isOpen: false,
          onClose: () => {},
          paneId: paneId.toString(),
          seriesList: [],
          seriesConfigs: {},
          onConfigChange: () => {},
        })
      );

      // CRITICAL FIX: Disable pointer events on container to allow chart interaction
      // The container element stays in DOM for performance (reuse on next open),
      // but must not block mouse events when dialog is closed
      if (state.dialogElement) {
        state.dialogElement.style.pointerEvents = 'none';
      }
    } catch (error) {
      // Close failures are less critical - log as warning
      handleError(error, 'SeriesDialogManager.close', ErrorSeverity.WARNING);
    }
  }

  /**
   * Get all series for a specific pane
   */
  private getAllSeriesForPane(paneId: number): SeriesInfo[] {
    const seriesList: SeriesInfo[] = [];
    const state = this.dialogStates.get(paneId);

    if (!state) {
      return seriesList;
    }

    try {
      // Get all panes from the chart
      const panes = this.chartApi.panes();

      if (paneId >= 0 && paneId < panes.length) {
        // Detect actual series from the chart pane
        const detectedSeries = this.detectSeriesInPane(paneId);

        detectedSeries.forEach((seriesInfo, index) => {
          const seriesId = `pane-${paneId}-series-${index}`;

          // Get existing config or create default
          let seriesConfig = state.seriesConfigs.get(seriesId);
          if (!seriesConfig) {
            seriesConfig = this.getDefaultSeriesConfig(seriesInfo.type);
            state.seriesConfigs.set(seriesId, seriesConfig);
          }

          seriesList.push({
            id: seriesId,
            // Use displayName if available, otherwise fall back to title
            // displayName is for UI (dialog tabs), title is for chart axis/legend
            displayName: seriesInfo.displayName || seriesInfo.title,
            type: seriesInfo.type,
            config: seriesConfig,
            title: seriesInfo.title,
          });
        });
      }
    } catch (error) {
      // Series retrieval failures should propagate
      handleError(error, 'SeriesDialogManager.getAllSeriesForPane', ErrorSeverity.ERROR);
    }

    return seriesList;
  }

  /**
   * Detect series in a pane by inspecting the chart API
   *
   * This method queries the actual chart to discover what series exist in the specified pane.
   * It extracts type, title, and displayName from each series' options.
   *
   * @param paneId - The pane index to inspect
   * @returns Array of detected series information
   */
  private detectSeriesInPane(
    paneId: number
  ): Array<{ type: SeriesType; title?: string; displayName?: string }> {
    const seriesData: Array<{ type: SeriesType; title?: string; displayName?: string }> = [];

    try {
      // Get all panes from the chart
      const panes = this.chartApi.panes();

      if (paneId >= 0 && paneId < panes.length) {
        // Get actual series from the pane
        const pane = panes[paneId];
        const paneSeries = pane.getSeries();

        // Detect type, title, and displayName from each series
        paneSeries.forEach((series: ISeriesApi<any>) => {
          try {
            const options = series.options() as any;

            // Get series type from _seriesType metadata (added by UnifiedSeriesFactory)
            const seriesType = (options._seriesType as SeriesType) || 'line';

            // CRITICAL: displayName and title are stored as direct properties on the series object,
            // not in options() - lightweight-charts doesn't preserve custom properties in options
            const extendedSeries = series as any;
            const displayName = extendedSeries.displayName;
            const title = extendedSeries.title || options.title;

            seriesData.push({
              type: seriesType,
              title: title || `${seriesType} series`,
              displayName: displayName, // May be undefined - that's OK
            });
          } catch (error) {
            // If we can't get series info, log and skip
            logger.error('Failed to detect series type', 'SeriesDialogManager', error);
          }
        });
      }
    } catch (error) {
      // Pane access errors - log as warning
      handleError(error, 'SeriesDialogManager.detectSeriesInPane', ErrorSeverity.WARNING);
    }

    return seriesData;
  }

  /**
   * Apply series configuration changes
   */
  private applySeriesConfig(paneId: number, seriesId: string, config: SeriesConfiguration): void {
    const state = this.dialogStates.get(paneId);
    if (!state) return;

    // Store the configuration locally
    state.seriesConfigs.set(seriesId, config);

    // Apply configuration changes to actual chart series objects
    // Errors are handled internally, don't let them prevent other operations
    try {
      this.applyConfigToChartSeries(paneId, seriesId, config);
    } catch (error) {
      // Log but continue - chart update errors shouldn't prevent config storage
      handleError(error, 'SeriesDialogManager.applyConfigToChartSeries', ErrorSeverity.WARNING);
    }

    // Save to localStorage for immediate persistence
    try {
      this.saveSeriesConfig(seriesId, config);
    } catch (error) {
      // Already handled in saveSeriesConfig, but catch just in case
      handleError(error, 'SeriesDialogManager.saveSeriesConfig', ErrorSeverity.WARNING);
    }

    // Notify external listeners if available
    try {
      if (this.config.onSeriesConfigChange) {
        this.config.onSeriesConfigChange(paneId, seriesId, config as Record<string, unknown>);
      }
    } catch (error) {
      // Log callback errors but don't propagate
      handleError(error, 'SeriesDialogManager.onSeriesConfigChange', ErrorSeverity.WARNING);
    }
  }

  /**
   * Apply configuration changes to actual chart series objects
   */
  private applyConfigToChartSeries(
    paneId: number,
    seriesId: string,
    config: SeriesConfiguration
  ): void {
    try {
      // Pass all config properties to series.applyOptions()
      // The dialog has already converted from nested dialog config to flat API options
      // via dialogConfigToApiOptions(), so we can pass the config directly
      const seriesOptions: Record<string, unknown> = { ...config };

      // Remove internal/non-API properties
      delete seriesOptions._seriesType;
      delete seriesOptions.markers; // Markers are set via setMarkers(), not applyOptions()

      // Try to find and update the series
      const panes = this.chartApi.panes();
      if (paneId >= 0 && paneId < panes.length && Object.keys(seriesOptions).length > 0) {
        let seriesApplied = false;

        try {
          const targetPane = panes[paneId];
          const paneseries = targetPane.getSeries();

          if (paneseries.length > 0) {
            // Parse the series index from the seriesId (e.g., "pane-0-series-0" -> index 0)
            const seriesIndexMatch = seriesId.match(/series-(\d+)$/);
            let targetSeriesIndex = -1;

            if (seriesIndexMatch) {
              targetSeriesIndex = parseInt(seriesIndexMatch[1], 10);
            } else {
              logger.error('Failed to parse series index from seriesId', 'SeriesDialogManager');
            }

            // Apply options to the specific series or all series if index not found
            paneseries.forEach((series: ISeriesApi<any>, idx: number) => {
              // Only apply to the target series index, or all if we couldn't parse the index
              if (targetSeriesIndex === -1 || idx === targetSeriesIndex) {
                if (series && typeof series.applyOptions === 'function') {
                  try {
                    series.applyOptions(seriesOptions);
                    seriesApplied = true;

                    // CRITICAL FIX: Force chart to acknowledge the update
                    // This ensures the chart's internal state is synced after series.applyOptions()
                    // Without this, the chart may not properly rerender the updated series
                    requestAnimationFrame(() => {
                      try {
                        // Trigger a chart update by accessing the time scale
                        // This forces the chart to recalculate and rerender
                        const timeScale = this.chartApi.timeScale();
                        if (timeScale) {
                          // Get current range to trigger update without changing anything
                          timeScale.getVisibleRange();
                        }
                      } catch {
                        // Silently handle - this is just a nudge for the chart
                        logger.warn(
                          'Chart update nudge failed (non-critical)',
                          'SeriesDialogManager'
                        );
                      }
                    });
                  } catch (applyError) {
                    // Options application errors - log as warning, continue with other series
                    handleError(
                      applyError,
                      'SeriesDialogManager.applyConfigToChartSeries.applyOptions',
                      ErrorSeverity.WARNING
                    );
                  }
                } else {
                  logger.error('Series does not have applyOptions method', 'SeriesDialogManager');
                }
              }
            });
          } else {
            logger.error('No series found in target pane', 'SeriesDialogManager');
          }

          if (!seriesApplied) {
            logger.error('Failed to apply series options to any series', 'SeriesDialogManager');
          }
        } catch (findError) {
          // Series lookup errors - log as warning, continue with other series
          handleError(
            findError,
            'SeriesDialogManager.applyConfigToChartSeries.findSeries',
            ErrorSeverity.WARNING
          );
        }
      } else if (Object.keys(seriesOptions).length === 0) {
        logger.error('No series options to apply', 'SeriesDialogManager');
      }
    } catch (error) {
      // Chart series config errors should propagate
      handleError(error, 'SeriesDialogManager.applyConfigToChartSeries', ErrorSeverity.ERROR);
    }
  }

  /**
   * Save series configuration to localStorage
   */
  private saveSeriesConfig(seriesId: string, config: SeriesConfiguration): void {
    try {
      const storageKey = `series-config-${seriesId}`;
      localStorage.setItem(storageKey, JSON.stringify(config));
    } catch (error) {
      // localStorage save failures are non-critical - log as warning
      handleError(
        error,
        'SeriesDialogManager.saveSeriesConfigToLocalStorage',
        ErrorSeverity.WARNING
      );
    }
  }

  /**
   * Get default series configuration
   */
  private getDefaultSeriesConfig(seriesType: SeriesType): SeriesConfiguration {
    const baseConfig: SeriesConfiguration = {
      color: '#2196F3',
      opacity: 1,
      lineWidth: 2,
      lineStyle: 0, // solid
      lastPriceVisible: true,
      priceLineVisible: true,
      labelsOnPriceScale: true,
      valuesInStatusLine: true,
      precision: false,
      precisionValue: 'auto',
    };

    switch (seriesType) {
      case 'supertrend':
        return {
          ...baseConfig,
          period: 10,
          multiplier: 3.0,
          upTrend: { color: '#00C851', opacity: 1 },
          downTrend: { color: '#FF4444', opacity: 1 },
        };
      case 'bollinger_bands':
        return {
          ...baseConfig,
          length: 20,
          stdDev: 2,
          upperLine: { color: '#2196F3', opacity: 1 },
          lowerLine: { color: '#2196F3', opacity: 1 },
          fill: { color: '#2196F3', opacity: 0.1 },
        };
      case 'sma':
      case 'ema':
        return {
          ...baseConfig,
          length: 20,
          source: 'close',
          offset: 0,
        };
      default:
        return baseConfig;
    }
  }

  /**
   * Get series configuration
   */
  public getSeriesConfig(paneId: number, seriesId: string): SeriesConfiguration | null {
    const state = this.dialogStates.get(paneId);
    if (!state) return null;

    return state.seriesConfigs.get(seriesId) || null;
  }

  /**
   * Set series configuration
   */
  public setSeriesConfig(paneId: number, seriesId: string, config: SeriesConfiguration): void {
    this.applySeriesConfig(paneId, seriesId, config);
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    // Cleanup all dialog elements
    this.dialogStates.forEach(state => {
      if (state.dialogElement && state.dialogElement.parentNode) {
        state.dialogElement.parentNode.removeChild(state.dialogElement);
      }
      if (state.dialogRoot) {
        state.dialogRoot.unmount();
      }
    });

    this.dialogStates.clear();

    // Clear all references to allow garbage collection
    (this as any).chartApi = null;
    (this as any).streamlitService = null;
    (this as any).config = null;
  }
}
