/**
 * @fileoverview Unified Series Factory
 *
 * Descriptor-driven series factory that replaces the 669-line seriesFactory.ts.
 * All series configuration is now in descriptors - this factory just orchestrates.
 *
 * Features:
 * - Basic series creation via descriptors
 * - Data management (setData, updateData)
 * - Markers support
 * - Price lines support
 * - Price scale configuration
 * - Metadata management (paneId, seriesId, legendConfig)
 */

import {
  ISeriesApi,
  IChartApi,
  SeriesOptionsCommon,
  SeriesMarker,
  createSeriesMarkers,
  Time,
  SeriesOptionsMap,
} from 'lightweight-charts';

import { UnifiedSeriesDescriptor, extractDefaultOptions } from './core/UnifiedSeriesDescriptor';
import { BUILTIN_SERIES_DESCRIPTORS } from './descriptors/builtinSeriesDescriptors';
import { CUSTOM_SERIES_DESCRIPTORS } from './descriptors/customSeriesDescriptors';
import { cleanLineStyleOptions } from '../utils/lineStyle';
import { logger } from '../utils/logger';
import { createTradeVisualElements } from '../services/tradeVisualization';
import { normalizeSeriesType } from './utils/seriesTypeNormalizer';
import type { TradeConfig, TradeVisualizationOptions } from '../types';
import type { ExtendedChartApi } from '../types/ChartInterfaces';
import type { SeriesDataPoint } from '../types/seriesFactory';
import type { LegendManager } from '../types/global';

/**
 * Custom error class for series creation failures
 */
export class SeriesCreationError extends Error {
  constructor(
    public seriesType: string,
    public reason: string,
    public originalError?: Error
  ) {
    super(`Failed to create ${seriesType} series: ${reason}`);
    this.name = 'SeriesCreationError';
  }
}

/**
 * Series descriptor registry - all series in one place
 */
const SERIES_REGISTRY = new Map<string, UnifiedSeriesDescriptor>([
  // Built-in series
  ['Line', BUILTIN_SERIES_DESCRIPTORS.Line],
  ['Area', BUILTIN_SERIES_DESCRIPTORS.Area],
  ['Histogram', BUILTIN_SERIES_DESCRIPTORS.Histogram],
  ['Bar', BUILTIN_SERIES_DESCRIPTORS.Bar],
  ['Candlestick', BUILTIN_SERIES_DESCRIPTORS.Candlestick],
  ['Baseline', BUILTIN_SERIES_DESCRIPTORS.Baseline],
  // Custom series
  ['Band', CUSTOM_SERIES_DESCRIPTORS.Band],
  ['Ribbon', CUSTOM_SERIES_DESCRIPTORS.Ribbon],
  ['GradientRibbon', CUSTOM_SERIES_DESCRIPTORS.GradientRibbon],
  ['Signal', CUSTOM_SERIES_DESCRIPTORS.Signal],
  ['TrendFill', CUSTOM_SERIES_DESCRIPTORS.TrendFill],
]);

/**
 * Get series descriptor by type
 */
export function getSeriesDescriptor(seriesType: string): UnifiedSeriesDescriptor | undefined {
  return SERIES_REGISTRY.get(seriesType);
}

/**
 * Get all available series types
 */
export function getAvailableSeriesTypes(): string[] {
  return Array.from(SERIES_REGISTRY.keys());
}

/**
 * Check if a series type is custom
 */
export function isCustomSeries(seriesType: string): boolean {
  const descriptor = SERIES_REGISTRY.get(seriesType);
  return descriptor?.isCustom ?? false;
}

/**
 * Flatten nested line options from Python to flat API format
 *
 * Python sends: { uptrendLine: { color: '...', lineWidth: 2 } }
 * TypeScript needs: { uptrendLineColor: '...', uptrendLineWidth: 2 }
 *
 * @param options - Options potentially containing nested line objects
 * @param descriptor - Series descriptor with property definitions
 * @returns Flattened options
 */
function flattenLineOptions(
  options: Record<string, unknown>,
  descriptor: UnifiedSeriesDescriptor<unknown>
): Record<string, unknown> {
  const flattened: Record<string, unknown> = { ...options };

  // Process each property in the descriptor
  for (const [propName, propDesc] of Object.entries(descriptor.properties)) {
    // Check if this is a line property with apiMapping and the option exists
    if (propDesc.type === 'line' && propDesc.apiMapping && options[propName]) {
      const lineObj = options[propName];

      // Only flatten if it's an object (nested format from Python)
      if (typeof lineObj === 'object' && lineObj !== null && !Array.isArray(lineObj)) {
        // Remove the nested object
        delete flattened[propName];

        // Flatten to individual properties
        const lineObjTyped = lineObj as Record<string, unknown>;
        if (lineObjTyped.color !== undefined && propDesc.apiMapping.colorKey) {
          flattened[propDesc.apiMapping.colorKey] = lineObjTyped.color;
        }
        if (lineObjTyped.lineWidth !== undefined && propDesc.apiMapping.widthKey) {
          flattened[propDesc.apiMapping.widthKey] = lineObjTyped.lineWidth;
        }
        if (lineObjTyped.lineStyle !== undefined && propDesc.apiMapping.styleKey) {
          flattened[propDesc.apiMapping.styleKey] = lineObjTyped.lineStyle;
        }
      }
    }
  }

  return flattened;
}

/**
 * Create a series using the unified descriptor system
 *
 * @param chart - LightweightCharts chart instance
 * @param seriesType - Type of series to create (e.g., 'Line', 'Band')
 * @param data - Series data
 * @param userOptions - User-provided options (merged with defaults)
 * @returns Created series instance
 * @throws {SeriesCreationError} If series creation fails
 */
export function createSeries(
  chart: any,
  seriesType: string,
  data: any[],
  userOptions: Partial<SeriesOptionsCommon> = {},
  paneId: number = 0
): ISeriesApi<any> {
  try {
    // Validate inputs
    if (!chart) {
      throw new SeriesCreationError(seriesType, 'Chart instance is required');
    }

    if (!seriesType || typeof seriesType !== 'string') {
      throw new SeriesCreationError(
        seriesType || 'unknown',
        'Series type must be a non-empty string'
      );
    }

    // Normalize type using centralized utility
    const mappedType = normalizeSeriesType(seriesType);

    // Get descriptor
    const descriptor = SERIES_REGISTRY.get(mappedType);
    if (!descriptor) {
      const availableTypes = Array.from(SERIES_REGISTRY.keys()).join(', ');
      throw new SeriesCreationError(
        seriesType,
        `Unknown series type '${seriesType}' (normalized to '${mappedType}'). Available types: ${availableTypes}`
      );
    }

    // Extract default options from descriptor
    const defaultOptions = extractDefaultOptions(descriptor);

    // Flatten nested line objects from Python (if any)
    const flattenedUserOptions = flattenLineOptions(userOptions, descriptor);

    // Merge user options with defaults and add _seriesType metadata
    const options = {
      ...defaultOptions,
      ...flattenedUserOptions,
      // Add _seriesType property so we can identify series type later via series.options()
      _seriesType: mappedType,
    };

    // Create series using descriptor's creator function
    return descriptor.create(chart, data, options, paneId);
  } catch (error) {
    // Re-throw SeriesCreationError as-is
    if (error instanceof SeriesCreationError) {
      throw error;
    }

    // Wrap other errors in SeriesCreationError with detailed message
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(
      `Series creation failed for ${seriesType}: ${errorMessage}`,
      'UnifiedSeriesFactory',
      error
    );
    throw new SeriesCreationError(
      seriesType,
      `Series creation failed: ${errorMessage}`,
      error as Error
    );
  }
}

/**
 * Get default options for a series type
 *
 * @param seriesType - Type of series
 * @returns Default options object
 * @throws {SeriesCreationError} If series type is unknown
 */
export function getDefaultOptions(seriesType: string): Partial<SeriesOptionsCommon> {
  const descriptor = SERIES_REGISTRY.get(seriesType);
  if (!descriptor) {
    const availableTypes = Array.from(SERIES_REGISTRY.keys()).join(', ');
    throw new SeriesCreationError(
      seriesType,
      `Unknown series type. Available types: ${availableTypes}`
    );
  }
  return extractDefaultOptions(descriptor);
}

/**
 * Register a custom series descriptor (for extensibility)
 *
 * @param descriptor - Custom series descriptor
 */
export function registerSeriesDescriptor(descriptor: UnifiedSeriesDescriptor): void {
  SERIES_REGISTRY.set(descriptor.type, descriptor);
}

/**
 * Unregister a series descriptor
 *
 * @param seriesType - Type of series to unregister
 */
export function unregisterSeriesDescriptor(seriesType: string): boolean {
  return SERIES_REGISTRY.delete(seriesType);
}

/**
 * Get series descriptors by category
 *
 * @param category - Category name (e.g., 'Basic', 'Custom')
 * @returns Array of descriptors in that category
 */
export function getSeriesDescriptorsByCategory(category: string): UnifiedSeriesDescriptor[] {
  return Array.from(SERIES_REGISTRY.values()).filter(desc => desc.category === category);
}

/**
 * Extended series configuration for full-featured series creation
 * This interface matches the old SeriesConfig for backward compatibility
 * Uses any for maximum flexibility with existing code
 */
export interface ExtendedSeriesConfig {
  /** Series type (e.g., 'Line', 'Area', 'Band') */
  type: string;
  /** Series data (flexible type for all series data formats) */
  data?: unknown[];
  /** Series options (flexible to accept any options structure) */
  options?: Record<string, unknown> | SeriesOptionsCommon;
  /** Pane ID for multi-pane charts */
  paneId?: number;
  /** Price scale configuration */
  priceScale?: Record<string, unknown>;
  /** Price lines to add */
  priceLines?: Array<Record<string, unknown>>;
  /** Markers to add */
  markers?: SeriesMarker<Time>[];
  /** Legend configuration */
  legend?: Record<string, unknown> | null;
  /** Series ID for identification */
  seriesId?: string;
  /** Chart ID for global identification */
  chartId?: string;
  /** Series title (technical name for chart axis/legend) */
  title?: string;
  /** Display name (user-friendly name for UI elements like dialog tabs) */
  displayName?: string;
  /** Trade configurations for visualization */
  trades?: TradeConfig[];
  /** Trade visualization options */
  tradeVisualizationOptions?: TradeVisualizationOptions;
  /** Allow additional properties from SeriesConfig */
  [key: string]: unknown;
}

/**
 * Extended series API with metadata
 */
export interface ExtendedSeriesApi extends ISeriesApi<keyof SeriesOptionsMap> {
  paneId?: number;
  seriesId?: string;
  legendConfig?: Record<string, unknown>;
  /** Display name (user-friendly name for UI elements like dialog tabs) */
  displayName?: string;
  /** Series title (technical name for chart axis/legend) */
  title?: string;
}

/**
 * Create series with full configuration (data, markers, price lines, etc.)
 * This is the enhanced API that handles all auxiliary functionality
 *
 * @param chart - LightweightCharts chart instance
 * @param config - Extended series configuration
 * @returns Created series instance with metadata
 * @throws {SeriesCreationError} If series creation fails
 */
export function createSeriesWithConfig(
  chart: IChartApi,
  config: ExtendedSeriesConfig
): ExtendedSeriesApi | null {
  try {
    const {
      type,
      data = [],
      options = {},
      paneId = 0,
      priceScale,
      priceScaleId, // CRITICAL FIX: Extract priceScaleId from top-level config
      priceLines,
      markers,
      legend,
      seriesId,
      chartId,
      title, // Extract title from top-level config
      displayName, // Extract displayName from top-level config
    } = config;

    // CRITICAL FIX: Merge top-level properties into options
    // Python sends these at top level, but lightweight-charts expects them in options
    let mergedOptions = options;
    if (title || displayName || priceScaleId) {
      mergedOptions = { ...options } as any;
      if (title) (mergedOptions as any).title = title;
      if (displayName) (mergedOptions as any).displayName = displayName;
      // CRITICAL FIX: Include priceScaleId in options passed to descriptor
      // Without this, the series won't attach to the correct price scale!
      if (priceScaleId) (mergedOptions as any).priceScaleId = priceScaleId;
    }

    // Step 1: Create the series using basic createSeries
    // Note: createSeries already handles data sorting and setting via descriptors
    const series = createSeries(chart, type, data, mergedOptions, paneId) as ExtendedSeriesApi;

    // Step 2: Data is already set by descriptor's create method (with sorting/deduplication)
    // No need to set data again here - descriptor handles it properly

    // Step 3: Configure price scale if provided
    if (priceScale) {
      try {
        const cleanedPriceScale = cleanLineStyleOptions(priceScale);
        series.priceScale().applyOptions(cleanedPriceScale);
      } catch (error) {
        logger.warn('Failed to configure price scale', 'UnifiedSeriesFactory', error);
      }
    }

    // Step 4: Add price lines if provided
    if (priceLines && Array.isArray(priceLines)) {
      priceLines.forEach((priceLine: Record<string, unknown>) => {
        try {
          series.createPriceLine(priceLine as any); // Type assertion needed for dynamic price line creation
        } catch (error) {
          logger.warn('Failed to create price line', 'UnifiedSeriesFactory', error);
        }
      });
    }

    // Step 5: Add markers if provided
    if (markers && Array.isArray(markers) && markers.length > 0) {
      try {
        const snappedMarkers = applyTimestampSnapping(markers, data as SeriesDataPoint[]);
        createSeriesMarkers(series, snappedMarkers);
      } catch (error) {
        logger.warn('Failed to set markers', 'UnifiedSeriesFactory', error);
      }
    }

    // Step 6: Store metadata on series
    series.paneId = paneId;
    if (seriesId) {
      series.seriesId = seriesId;
    }
    if (legend) {
      series.legendConfig = legend;
    }
    // Store displayName and title for UI (lightweight-charts doesn't preserve these in options)
    if (displayName) {
      series.displayName = displayName;
    }
    if (title) {
      series.title = title;
    }

    // Step 7: Handle legend registration
    if (legend && legend.visible && chartId) {
      try {
        const legendManager = window.paneLegendManagers?.[chartId]?.[paneId] as
          | LegendManager
          | undefined;
        if (legendManager && typeof legendManager.addSeriesLegend === 'function') {
          legendManager.addSeriesLegend(seriesId || `series-${Date.now()}`, config);
        }
      } catch (error) {
        logger.warn('Failed to register series legend', 'UnifiedSeriesFactory', error);
      }
    }

    // Step 8: Handle trade visualization
    const { trades, tradeVisualizationOptions } = config;
    if (trades && tradeVisualizationOptions && trades.length > 0) {
      try {
        // Create trade visual elements (markers, rectangles, annotations)
        const visualElements = createTradeVisualElements(trades, tradeVisualizationOptions, data);

        // Add trade markers to the series
        if (visualElements.markers && visualElements.markers.length > 0) {
          createSeriesMarkers(series, visualElements.markers);
        }

        // Store rectangle data for later processing by the chart component
        if (visualElements.rectangles && visualElements.rectangles.length > 0 && chartId) {
          const extendedChart = chart as ExtendedChartApi;
          if (!extendedChart._pendingTradeRectangles) {
            extendedChart._pendingTradeRectangles = [];
          }
          extendedChart._pendingTradeRectangles.push({
            rectangles: visualElements.rectangles,
            series: series,
            chartId: chartId,
          });
        }
      } catch (error) {
        logger.warn('Failed to create trade visualization', 'UnifiedSeriesFactory', error);
      }
    }

    return series;
  } catch (error) {
    logger.error('Series creation with config failed', 'UnifiedSeriesFactory', error);
    return null;
  }
}

/**
 * Apply timestamp snapping to markers to ensure they align with chart data
 *
 * @param markers - Array of markers to snap
 * @param chartData - Chart data for timestamp reference
 * @returns Array of markers with snapped timestamps
 */
function applyTimestampSnapping(
  markers: SeriesMarker<Time>[],
  chartData?: SeriesDataPoint[]
): SeriesMarker<Time>[] {
  if (!chartData || chartData.length === 0) {
    return markers;
  }

  // Extract available timestamps from chart data
  const availableTimes = chartData
    .map(item => {
      if (typeof item.time === 'number') {
        return item.time;
      } else if (typeof item.time === 'string') {
        return Math.floor(new Date(item.time).getTime() / 1000);
      }
      return null;
    })
    .filter((time): time is number => time !== null);

  if (availableTimes.length === 0) {
    return markers;
  }

  // Apply timestamp snapping to each marker
  return markers.map(marker => {
    if (marker.time && typeof marker.time === 'number') {
      // Find nearest available timestamp
      const nearestTime = availableTimes.reduce((nearest, current) => {
        const currentDiff = Math.abs(current - (marker.time as number));
        const nearestDiff = Math.abs(nearest - (marker.time as number));
        return currentDiff < nearestDiff ? current : nearest;
      });

      return {
        ...marker,
        time: nearestTime as Time,
      };
    }
    return marker;
  }) as SeriesMarker<Time>[];
}

/**
 * Update series data
 *
 * @param series - Series instance
 * @param data - New data to set
 */
export function updateSeriesData(
  series: ISeriesApi<keyof SeriesOptionsMap>,
  data: SeriesDataPoint[]
): void {
  try {
    series.setData(data as never[]);
  } catch (error) {
    logger.error('Failed to update series data', 'UnifiedSeriesFactory', error);
    throw error;
  }
}

/**
 * Update series markers
 *
 * @param series - Series instance
 * @param markers - New markers to set
 * @param data - Optional data for timestamp snapping
 */
export function updateSeriesMarkers(
  series: ISeriesApi<any>,
  markers: SeriesMarker<any>[],
  data?: SeriesDataPoint[]
): void {
  try {
    const snappedMarkers = data ? applyTimestampSnapping(markers, data) : markers;
    createSeriesMarkers(series, snappedMarkers);
  } catch (error) {
    logger.error('Failed to update series markers', 'UnifiedSeriesFactory', error);
    throw error;
  }
}

/**
 * Update series options
 *
 * @param series - Series instance
 * @param options - New options to apply
 */
export function updateSeriesOptions(
  series: ISeriesApi<any>,
  options: Partial<SeriesOptionsCommon>
): void {
  try {
    const cleanedOptions = cleanLineStyleOptions(options);
    series.applyOptions(cleanedOptions);
  } catch (error) {
    logger.error('Failed to update series options', 'UnifiedSeriesFactory', error);
    throw error;
  }
}

/**
 * Legacy compatibility layer for existing code
 * This allows gradual migration from old factory to new factory
 */
export const SeriesFactory = {
  createSeries,
  createSeriesWithConfig,
  getSeriesDescriptor,
  getDefaultOptions,
  isCustomSeries,
  getAvailableSeriesTypes,
  updateSeriesData,
  updateSeriesMarkers,
  updateSeriesOptions,
};

export default SeriesFactory;
