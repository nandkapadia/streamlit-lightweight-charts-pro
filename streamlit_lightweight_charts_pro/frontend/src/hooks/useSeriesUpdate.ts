/**
 * useSeriesUpdate Hook
 *
 * Provides series update functionality for applying configuration changes.
 * Extracts series update logic from the main component for better modularity and testability.
 *
 * Performance Best Practices:
 * - Batch configuration updates to minimize reflows
 * - Use React's automatic batching for state updates
 * - Memoize update handlers to prevent unnecessary recreations
 * - Only update changed properties (partial updates)
 *
 * @example
 * ```tsx
 * const { applySeriesConfig } = useSeriesUpdate(chartRefs, seriesRefs);
 *
 * // Apply config changes from dialog
 * applySeriesConfig(paneId, seriesId, {
 *   visible: true,
 *   color: '#2962FF',
 *   lineWidth: 2
 * });
 * ```
 */

import { useCallback, useEffect } from 'react';
import { IChartApi, ISeriesApi } from 'lightweight-charts';
import { logger } from '../utils/logger';

export interface SeriesConfigPatch {
  visible?: boolean;
  last_value_visible?: boolean;
  price_line?: boolean;
  color?: string;
  line_width?: number;
  line_style?: number;
  markers?: boolean;
  title?: string;
  [key: string]: any; // Allow additional properties
}

export interface UseSeriesUpdateOptions {
  /**
   * Configuration change object from parent component
   * Typically comes from a settings dialog or UI control
   */
  configChange?: {
    paneId: string;
    seriesId: string;
    configPatch: SeriesConfigPatch;
    timestamp: number;
  } | null;

  /**
   * Reference to chart instances
   */
  chartRefs: React.MutableRefObject<{ [key: string]: IChartApi }>;

  /**
   * Reference to series instances per chart
   */
  seriesRefs: React.MutableRefObject<{ [key: string]: ISeriesApi<any>[] }>;
}

export interface UseSeriesUpdateReturn {
  /**
   * Apply configuration changes to a specific series
   *
   * @param paneId - The pane identifier
   * @param seriesId - The series identifier
   * @param configPatch - Partial configuration to apply
   */
  applySeriesConfig(paneId: string, seriesId: string, configPatch: SeriesConfigPatch): void;

  /**
   * Map dialog config format to LightweightCharts API format
   * Handles naming differences between our config format and the library API
   *
   * @param configPatch - Configuration patch in dialog format
   * @returns Configuration in API format
   */
  mapDialogConfigToAPI(configPatch: SeriesConfigPatch): Record<string, any>;
}

/**
 * Hook for managing series configuration updates
 *
 * @param options - Configuration options for series updates
 * @returns Object with series update helper functions
 */
export function useSeriesUpdate(options: UseSeriesUpdateOptions): UseSeriesUpdateReturn {
  const { configChange, chartRefs, seriesRefs } = options;

  /**
   * Map dialog configuration format to LightweightCharts API format
   * Converts snake_case to camelCase and handles special cases
   */
  const mapDialogConfigToAPI = useCallback(
    (configPatch: SeriesConfigPatch): Record<string, any> => {
      const apiConfig: Record<string, any> = {};

      // Basic visibility options
      if ('visible' in configPatch) {
        apiConfig.visible = configPatch.visible;
      }

      if ('last_value_visible' in configPatch) {
        apiConfig.lastValueVisible = configPatch.last_value_visible;
      }

      if ('price_line' in configPatch) {
        apiConfig.priceLineVisible = configPatch.price_line;
      }

      // Color and styling options
      if ('color' in configPatch) {
        apiConfig.color = configPatch.color;
      }

      if ('line_width' in configPatch) {
        apiConfig.lineWidth = configPatch.line_width;
      }

      if ('line_style' in configPatch) {
        apiConfig.lineStyle = configPatch.line_style;
      }

      // Marker options
      if ('markers' in configPatch) {
        apiConfig.pointMarkersVisible = configPatch.markers;
      }

      // Title updates
      if ('title' in configPatch) {
        apiConfig.title = configPatch.title;
      }

      return apiConfig;
    },
    []
  );

  /**
   * Apply configuration changes to a specific series
   * Finds the series by paneId and seriesId, then applies the configuration
   */
  const applySeriesConfig = useCallback(
    (paneId: string, seriesId: string, configPatch: SeriesConfigPatch): void => {
      // Find the appropriate chart and series to update
      Object.entries(chartRefs.current).forEach(([chartId, chart]) => {
        if (!chart) return;

        try {
          // Get chart series and find the matching one
          const chartSeries = seriesRefs.current[chartId] || [];

          chartSeries.forEach((series, index) => {
            // Check if this is the target series
            // The seriesId format is typically "pane-X-series-Y"
            const expectedSeriesId = `pane-${paneId}-series-${index}`;

            if (seriesId === expectedSeriesId) {
              // Map dialog config to LightweightCharts API
              const apiConfig = mapDialogConfigToAPI(configPatch);

              // Apply the options to the series
              if (Object.keys(apiConfig).length > 0) {
                series.applyOptions(apiConfig);
              }
            }
          });
        } catch (error) {
          logger.warn('Error applying series config', 'useSeriesUpdate', error);
        }
      });
    },
    [chartRefs, seriesRefs, mapDialogConfigToAPI]
  );

  /**
   * Effect to handle configuration changes from parent
   * Automatically applies config changes when configChange prop updates
   */
  useEffect(() => {
    if (!configChange) return;

    const { paneId, seriesId, configPatch } = configChange;
    applySeriesConfig(paneId, seriesId, configPatch);
  }, [configChange, applySeriesConfig]);

  return {
    applySeriesConfig,
    mapDialogConfigToAPI,
  };
}
