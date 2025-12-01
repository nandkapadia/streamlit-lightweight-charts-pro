/**
 * @fileoverview Series Dialog Manager (Framework-Agnostic)
 *
 * Manages series configuration dialogs for Lightweight Charts.
 * This is a pure TypeScript implementation that works with any framework.
 *
 * Responsibilities:
 * - Open/close series configuration dialog
 * - Manage dialog state per pane
 * - Apply configuration changes via BackendSyncAdapter
 * - Coordinate with backend for persistence
 * - Restore configurations from storage
 *
 * Architecture:
 * - Keyed singleton pattern (one instance per chart)
 * - Pure DOM dialog (no React dependencies)
 * - Framework-agnostic backend sync via adapter pattern
 * - Per-pane dialog state management
 *
 * @example
 * ```typescript
 * const adapter = new InMemoryBackendSyncAdapter();
 * const manager = SeriesDialogManager.getInstance(
 *   chartApi,
 *   adapter,
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

import { IChartApi, ISeriesApi } from 'lightweight-charts';
import { logger } from '../utils/logger';
import { BackendSyncAdapter } from './BackendSyncAdapter';
import { SeriesType, SeriesConfiguration } from '../types/SeriesTypes';
import { apiOptionsToDialogConfig } from '../series/UnifiedPropertyMapper';
import {
  SeriesSettingsDialog,
  SeriesInfo as DialogSeriesInfo,
} from '../dialogs/SeriesSettingsDialog';
import { SeriesFormConfig } from '../dialogs/FormStateManager';
import { KeyedSingletonManager } from '../utils/KeyedSingletonManager';
import { SeriesSettings } from '../dialogs/SeriesSettingsRenderer';
import { cleanupInstance, Disposable } from '../utils/Disposable';

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
  dialogInstance?: SeriesSettingsDialog;
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
 * Manages the lifecycle of series settings dialogs using pure DOM.
 * This class bridges the gap between imperative chart management and
 * declarative dialog rendering, without any framework dependencies.
 *
 * Architecture:
 * - Keyed singleton pattern (one instance per chart)
 * - Pure DOM dialogs (framework-agnostic)
 * - Backend sync via adapter pattern
 * - Per-pane dialog state management
 *
 * Responsibilities:
 * - Create and manage dialog instances
 * - Open/close dialogs with current series settings
 * - Apply configuration changes to chart APIs
 * - Coordinate with backend for persistence via adapter
 * - Clean up dialog instances and DOM elements
 *
 * @export
 * @class SeriesDialogManager
 * @extends {KeyedSingletonManager<SeriesDialogManager>}
 *
 * @example
 * ```typescript
 * const adapter = new StreamlitBackendSyncAdapter(streamlitService);
 * const manager = SeriesDialogManager.getInstance(
 *   chartApi,
 *   adapter,
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
  /** Backend sync adapter for configuration persistence */
  private backendAdapter: BackendSyncAdapter;
  /** Dialog state per pane (instances, configs) */
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
   * @param {BackendSyncAdapter} backendAdapter - Backend sync adapter
   * @param {SeriesDialogConfig} [config={}] - Optional manager configuration
   */
  private constructor(
    chartApi: IChartApi,
    backendAdapter: BackendSyncAdapter,
    config: SeriesDialogConfig = {}
  ) {
    super();
    this.chartApi = chartApi;
    this.backendAdapter = backendAdapter;
    this.config = config;
  }

  /**
   * Get or create singleton instance for a chart
   */
  public static getInstance(
    chartApi: IChartApi,
    backendAdapter: BackendSyncAdapter,
    chartId?: string,
    config: SeriesDialogConfig = {}
  ): SeriesDialogManager {
    const key = chartId || 'default';
    const instance = KeyedSingletonManager.getOrCreateInstance('SeriesDialogManager', key, () => {
      return new SeriesDialogManager(chartApi, backendAdapter, config);
    });
    return instance;
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

      // Restore saved customizations from backend immediately after initialization
      // This ensures customizations persist across reinitialization
      this.restoreSeriesConfigsFromBackend(paneId);
    }
  }

  /**
   * Restore series configurations from backend for a pane
   * Called during pane initialization to restore customizations after reinit
   */
  private restoreSeriesConfigsFromBackend(paneId: number): void {
    try {
      // Get all series in this pane
      const panes = this.chartApi.panes();
      if (paneId < 0 || paneId >= panes.length) {
        return;
      }

      const pane = panes[paneId];
      const paneSeries = pane.getSeries();

      // Try to restore config for each series
      paneSeries.forEach((_series: ISeriesApi<any>, index: number) => {
        const seriesId = `pane-${paneId}-series-${index}`;
        const savedConfig = this.backendAdapter.getSeriesConfig(
          paneId,
          seriesId,
          this.config.chartId
        );

        if (savedConfig) {
          // Store in memory
          const state = this.dialogStates.get(paneId);
          if (state) {
            state.seriesConfigs.set(seriesId, savedConfig);
          }

          // Apply to chart immediately
          try {
            this.applyConfigToChartSeries(paneId, seriesId, savedConfig);
          } catch (error) {
            logger.warn(
              'Failed to apply restored config',
              'SeriesDialogManager.restoreSeriesConfigsFromBackend',
              { seriesId, error }
            );
          }
        }
      });
    } catch (error) {
      logger.warn(
        'Error restoring configs from backend',
        'SeriesDialogManager.restoreSeriesConfigsFromBackend',
        error
      );
    }
  }

  /**
   * Get dialog state for a pane
   */
  public getState(paneId: number): DialogState | undefined {
    return this.dialogStates.get(paneId);
  }

  /**
   * Open series configuration dialog
   *
   * Creates a dialog instance if needed and shows it.
   * Uses pure DOM dialogs (no React dependencies).
   */
  public open(paneId: number): void {
    logger.info(`SeriesDialogManager.open() called - paneId: ${paneId}`, 'SeriesDialogManager');

    const state = this.dialogStates.get(paneId);
    if (!state) {
      logger.error('Dialog state not initialized', 'SeriesDialogManager', { paneId });
      return;
    }

    logger.info('Dialog state found, processing series...', 'SeriesDialogManager');

    try {
      // Get ALL series for this pane
      const allSeries = this.getAllSeriesForPane(paneId);
      logger.info(`Found ${allSeries.length} series for pane ${paneId}`, 'SeriesDialogManager');

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

      // Build seriesSettings map: seriesType -> field definitions
      const seriesSettings: Record<string, SeriesSettings> = {};
      allSeries.forEach(series => {
        if (!seriesSettings[series.type]) {
          seriesSettings[series.type] = this.getSeriesSpecificSettings(series.type);
        }
      });

      // Create or update dialog instance
      if (!state.dialogInstance) {
        state.dialogInstance = new SeriesSettingsDialog({
          seriesList: allSeries.map(
            series =>
              ({
                id: series.id,
                displayName: series.displayName || series.title || series.id,
                type: series.type,
              }) as DialogSeriesInfo
          ),
          seriesConfigs: seriesConfigs as Record<string, SeriesFormConfig>,
          seriesSettings: seriesSettings,
          onConfigChange: (seriesId: string, newConfig: SeriesFormConfig) => {
            // Find the series type from allSeries
            const seriesInfo = allSeries.find(s => s.id === seriesId);
            const seriesType = seriesInfo?.type || 'line';

            // Include series type in the config for proper property mapping
            const configWithType = {
              ...newConfig,
              _seriesType: seriesType,
            } as SeriesConfiguration;
            this.applySeriesConfig(paneId, seriesId, configWithType);
          },
          onClose: () => this.close(paneId),
        });
      } else {
        // Update existing dialog with new data
        state.dialogInstance.updateSeries(
          allSeries.map(
            series =>
              ({
                id: series.id,
                displayName: series.displayName || series.title || series.id,
                type: series.type,
              }) as DialogSeriesInfo
          ),
          seriesConfigs as Record<string, SeriesFormConfig>
        );
      }

      // Open the dialog
      try {
        state.dialogInstance.open();
      } catch (openError) {
        logger.error('Failed to open dialog instance', 'SeriesDialogManager', openError);
        throw openError;
      }
    } catch (error) {
      logger.error('Failed to open series dialog', 'SeriesDialogManager', error);
    }
  }

  /**
   * Close series configuration dialog
   */
  public close(paneId: number): void {
    const state = this.dialogStates.get(paneId);
    if (!state || !state.dialogInstance) return;

    try {
      // Sync all configuration changes to backend when dialog closes
      state.seriesConfigs.forEach((config, seriesId) => {
        const seriesType = (config as any)._seriesType || 'line';
        this.backendAdapter.recordConfigChange(
          paneId,
          seriesId,
          seriesType,
          config,
          this.config.chartId
        );
      });

      // Force immediate sync to backend (bypasses debounce)
      this.backendAdapter.forceSyncToBackend();

      // Close the dialog
      state.dialogInstance.close();
    } catch (error) {
      logger.warn('Failed to close series dialog', 'SeriesDialogManager', error);
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
          let wasLoadedFromBackend = false;

          if (!seriesConfig) {
            // Try to load from backend first (restores customizations after reinit)
            seriesConfig =
              this.backendAdapter.getSeriesConfig(paneId, seriesId, this.config.chartId) ||
              undefined;

            if (seriesConfig) {
              wasLoadedFromBackend = true;
            } else {
              // Fall back to defaults if not in backend
              seriesConfig = this.getDefaultSeriesConfig(seriesInfo.type);
            }

            state.seriesConfigs.set(seriesId, seriesConfig);

            // Apply loaded config to chart series immediately
            // This restores customizations (colors, line width, etc.) after reinitialization
            if (wasLoadedFromBackend) {
              try {
                this.applyConfigToChartSeries(paneId, seriesId, seriesConfig);
              } catch (error) {
                logger.warn(
                  'Failed to apply loaded config',
                  'SeriesDialogManager.getAllSeriesForPane',
                  { seriesId, error }
                );
              }
            }
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
      logger.error(
        'Failed to get series for pane',
        'SeriesDialogManager.getAllSeriesForPane',
        error
      );
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
        paneSeries.forEach((series: ISeriesApi<any>, _index: number) => {
          try {
            const options = series.options() as any;

            // Get series type from _seriesType metadata (added by UnifiedSeriesFactory)
            const seriesType = (options._seriesType as SeriesType) || 'line';

            // displayName and title are stored as direct properties on the series object,
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
      logger.warn('Failed to detect series in pane', 'SeriesDialogManager', error);
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
    try {
      this.applyConfigToChartSeries(paneId, seriesId, config);
    } catch (error) {
      logger.warn(
        'Failed to apply config to chart series',
        'SeriesDialogManager.applySeriesConfig',
        error
      );
    }

    // DO NOT sync to backend here - only sync when dialog closes
    // This prevents the infinite re-render loop caused by Streamlit.setComponentValue()
    // Changes are stored in state.seriesConfigs and will be synced when close() is called

    // DO NOT notify external listeners - they may trigger backend syncs
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
              logger.error(
                'Failed to parse series index from seriesId',
                'SeriesDialogManager.applyConfigToChartSeries',
                { seriesId }
              );
            }

            // Apply options to the specific series or all series if index not found
            paneseries.forEach((series: ISeriesApi<any>, idx: number) => {
              // Only apply to the target series index, or all if we couldn't parse the index
              if (targetSeriesIndex === -1 || idx === targetSeriesIndex) {
                if (series && typeof series.applyOptions === 'function') {
                  try {
                    series.applyOptions(seriesOptions);
                    seriesApplied = true;

                    // Force chart to acknowledge the update
                    // This ensures the chart's internal state is synced after series.applyOptions()
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
                        logger.debug(
                          'Chart update nudge failed (non-critical)',
                          'SeriesDialogManager.applyConfigToChartSeries'
                        );
                      }
                    });
                  } catch (applyError) {
                    logger.warn(
                      'Failed to apply options to series',
                      'SeriesDialogManager.applyConfigToChartSeries',
                      applyError
                    );
                  }
                } else {
                  logger.error(
                    'Series does not have applyOptions method',
                    'SeriesDialogManager.applyConfigToChartSeries'
                  );
                }
              }
            });
          } else {
            logger.error(
              'No series found in target pane',
              'SeriesDialogManager.applyConfigToChartSeries'
            );
          }

          if (!seriesApplied) {
            logger.error(
              'Failed to apply series options to any series',
              'SeriesDialogManager.applyConfigToChartSeries'
            );
          }
        } catch (findError) {
          logger.warn(
            'Failed to find series in pane',
            'SeriesDialogManager.applyConfigToChartSeries',
            findError
          );
        }
      } else if (Object.keys(seriesOptions).length === 0) {
        logger.warn(
          'No series options to apply',
          'SeriesDialogManager.applyConfigToChartSeries'
        );
      }
    } catch (error) {
      logger.error(
        'Failed to apply config to chart series',
        'SeriesDialogManager.applyConfigToChartSeries',
        error
      );
    }
  }

  /**
   * Get series-specific settings definitions for the dialog
   */
  private getSeriesSpecificSettings(seriesType: SeriesType): SeriesSettings {
    switch (seriesType) {
      case 'line':
      case 'area':
        return {
          color: 'color',
          lineWidth: 'number',
          lineStyle: 'lineStyle',
        };

      case 'candlestick':
        return {
          upColor: 'color',
          downColor: 'color',
          borderUpColor: 'color',
          borderDownColor: 'color',
          wickUpColor: 'color',
          wickDownColor: 'color',
        };

      case 'bar':
        return {
          upColor: 'color',
          downColor: 'color',
          thinBars: 'boolean',
        };

      case 'histogram':
        return {
          color: 'color',
        };

      case 'baseline':
        return {
          topLineColor: 'color',
          topFillColor1: 'color',
          topFillColor2: 'color',
          bottomLineColor: 'color',
          bottomFillColor1: 'color',
          bottomFillColor2: 'color',
          baseValue: 'number',
        };

      case 'supertrend':
        return {
          period: 'number',
          multiplier: 'number',
          upTrendColor: 'color',
          downTrendColor: 'color',
          lineWidth: 'number',
        };

      case 'bollinger_bands':
        return {
          length: 'number',
          stdDev: 'number',
          upperLineColor: 'color',
          lowerLineColor: 'color',
          fillColor: 'color',
          fillVisible: 'boolean',
        };

      case 'sma':
      case 'ema':
        return {
          length: 'number',
          source: 'lineStyle', // Reusing lineStyle for dropdown
          offset: 'number',
          color: 'color',
          lineWidth: 'number',
          lineStyle: 'lineStyle',
        };

      case 'ribbon':
      case 'gradient_ribbon':
        return {
          color: 'color',
          lineWidth: 'number',
        };

      case 'band':
        return {
          upperColor: 'color',
          lowerColor: 'color',
          fillColor: 'color',
        };

      case 'signal':
        return {
          buyColor: 'color',
          sellColor: 'color',
        };

      case 'trend_fill':
        return {
          upColor: 'color',
          downColor: 'color',
        };

      default:
        // Default settings for unknown types
        return {
          color: 'color',
          lineWidth: 'number',
        };
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
    // Cleanup all dialog instances
    this.dialogStates.forEach(state => {
      if (state.dialogInstance) {
        state.dialogInstance.destroy();
      }
    });

    this.dialogStates.clear();

    // Clear all references to allow garbage collection
    cleanupInstance(this, ['chartApi', 'backendAdapter', 'config']);
  }
}
