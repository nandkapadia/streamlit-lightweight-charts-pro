/**
 * @fileoverview Global type declarations
 *
 * Defines global type extensions for window object and other global augmentations.
 * Fixes type safety issues by properly typing window extensions used throughout the app.
 */

import { ISeriesApi, IChartApi } from 'lightweight-charts';

/**
 * Chart series reference map structure
 * Maps chart IDs to arrays of series API instances
 */
export interface SeriesRefsMap {
  [chartId: string]: ISeriesApi<any>[];
}

/**
 * Legend manager interface
 */
export interface LegendManager {
  addSeriesLegend: (seriesId: string, config: unknown) => void;
  [key: string]: unknown;
}

/**
 * Legend manager map structure
 * Maps chart IDs to pane-specific legend managers
 */
export interface PaneLegendManagersMap {
  [chartId: string]: {
    [paneId: number]: LegendManager;
  };
}

/**
 * Chart API extended with internal ID
 */
export interface ChartApiWithId extends IChartApi {
  _id?: string;
}

/**
 * Window object extensions
 *
 * Declares global properties added to window object by the application
 */
declare global {
  interface Window {
    /**
     * Map of chart IDs to series API references
     * Used for accessing series across the application
     */
    seriesRefsMap?: SeriesRefsMap;

    /**
     * Map of chart IDs to pane legend managers
     * Used for legend management per pane
     */
    paneLegendManagers?: PaneLegendManagersMap;

    /**
     * Development mode flag
     */
    __DEV__?: boolean;
  }
}

/**
 * Series configuration with type information
 */
export interface TypedSeriesConfiguration {
  _seriesType?: string;
  [key: string]: unknown;
}

/**
 * Series info with configuration
 */
export interface SeriesInfoWithConfig {
  id: string;
  displayName?: string;
  type: string;
  config?: TypedSeriesConfiguration;
  title?: string;
}

// Export empty object to make this a module
export {};
