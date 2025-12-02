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
import { cleanLineStyleOptions } from '@lightweight-charts-pro/core';
import { logger } from '@lightweight-charts-pro/core';
import { createTradeVisualElements } from '@lightweight-charts-pro/core';
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
 * Python sends nested line options like:
 *   { upperLine: { color: "#xxx", lineWidth: 2, lineVisible: false } }
 *
 * Frontend expects flattened options like:
 *   { upperLineColor: "#xxx", upperLineWidth: 2, upperLineVisible: false }
 *
 * This function uses the descriptor's apiMapping to determine the correct
 * property names for flattening. It handles all LineOptions properties including
 * color, width, style, visibility, markers, and crosshair settings.
 *
 * @param options - Options potentially containing nested line objects
 * @param descriptor - Series descriptor with property definitions
 * @returns Flattened options with nested LineOptions expanded to top level
 */
function flattenLineOptions(
  options: Record<string, unknown>,
  descriptor: UnifiedSeriesDescriptor<unknown>
): Record<string, unknown> {
  const flattened: Record<string, unknown> = { ...options };

  // SPECIAL CASE: Handle generic 'lineOptions' from Python for builtin series
  // Python sends: {lineOptions: {color, lineWidth, ...}}
  // We need to flatten it using the descriptor's line property (usually 'mainLine')
  if (options.lineOptions) {
    // Find the first line property in the descriptor (mainLine for builtin series)
    const linePropertyEntry = Object.entries(descriptor.properties).find(
      ([, propDesc]) => propDesc.type === 'line' && propDesc.apiMapping
    );

    if (linePropertyEntry) {
      const [, linePropDesc] = linePropertyEntry;
      const lineObj = options.lineOptions;

      // Remove lineOptions from flattened output
      delete flattened.lineOptions;

      // Flatten using the descriptor's apiMapping
      if (typeof lineObj === 'object' && lineObj !== null && !Array.isArray(lineObj)) {
        const lineObjTyped = lineObj as Record<string, unknown>;

        // Map color using descriptor's colorKey (e.g., 'color' for Line, 'lineColor' for Area)
        if (lineObjTyped.color !== undefined && linePropDesc.apiMapping?.colorKey) {
          flattened[linePropDesc.apiMapping.colorKey] = lineObjTyped.color;
        }

        // Map line width
        if (lineObjTyped.lineWidth !== undefined && linePropDesc.apiMapping?.widthKey) {
          flattened[linePropDesc.apiMapping.widthKey] = lineObjTyped.lineWidth;
        }

        // Map line style
        if (lineObjTyped.lineStyle !== undefined && linePropDesc.apiMapping?.styleKey) {
          flattened[linePropDesc.apiMapping.styleKey] = lineObjTyped.lineStyle;
        }

        // Map all other LineOptions properties directly (no prefix for builtin series)
        if (lineObjTyped.lineVisible !== undefined) {
          flattened.lineVisible = lineObjTyped.lineVisible;
        }
        if (lineObjTyped.lineType !== undefined) {
          flattened.lineType = lineObjTyped.lineType;
        }
        if (lineObjTyped.pointMarkersVisible !== undefined) {
          flattened.pointMarkersVisible = lineObjTyped.pointMarkersVisible;
        }
        if (lineObjTyped.pointMarkersRadius !== undefined) {
          flattened.pointMarkersRadius = lineObjTyped.pointMarkersRadius;
        }
        if (lineObjTyped.crosshairMarkerVisible !== undefined) {
          flattened.crosshairMarkerVisible = lineObjTyped.crosshairMarkerVisible;
        }
        if (lineObjTyped.crosshairMarkerRadius !== undefined) {
          flattened.crosshairMarkerRadius = lineObjTyped.crosshairMarkerRadius;
        }
        if (lineObjTyped.crosshairMarkerBorderColor !== undefined) {
          flattened.crosshairMarkerBorderColor = lineObjTyped.crosshairMarkerBorderColor;
        }
        if (lineObjTyped.crosshairMarkerBackgroundColor !== undefined) {
          flattened.crosshairMarkerBackgroundColor = lineObjTyped.crosshairMarkerBackgroundColor;
        }
        if (lineObjTyped.crosshairMarkerBorderWidth !== undefined) {
          flattened.crosshairMarkerBorderWidth = lineObjTyped.crosshairMarkerBorderWidth;
        }
        if (lineObjTyped.lastPriceAnimation !== undefined) {
          flattened.lastPriceAnimation = lineObjTyped.lastPriceAnimation;
        }
      }
    }
  }

  // Process each property in the descriptor (for custom series with named line properties)
  for (const [propName, propDesc] of Object.entries(descriptor.properties)) {
    // Check if this is a line property with apiMapping and the option exists
    if (propDesc.type === 'line' && propDesc.apiMapping && options[propName]) {
      const lineObj = options[propName];

      // Only flatten if it's an object (nested format from Python)
      if (typeof lineObj === 'object' && lineObj !== null && !Array.isArray(lineObj)) {
        // Remove the nested object
        delete flattened[propName];

        // Flatten to individual properties using descriptor's apiMapping
        const lineObjTyped = lineObj as Record<string, unknown>;

        // Map color
        if (lineObjTyped.color !== undefined && propDesc.apiMapping.colorKey) {
          flattened[propDesc.apiMapping.colorKey] = lineObjTyped.color;
        }

        // Map line width
        if (lineObjTyped.lineWidth !== undefined && propDesc.apiMapping.widthKey) {
          flattened[propDesc.apiMapping.widthKey] = lineObjTyped.lineWidth;
        }

        // Map line style
        if (lineObjTyped.lineStyle !== undefined && propDesc.apiMapping.styleKey) {
          flattened[propDesc.apiMapping.styleKey] = lineObjTyped.lineStyle;
        }

        // Map line visibility (CRITICAL: was missing before!)
        // e.g., 'upperLine' → 'upperLineVisible', 'middleLine' → 'middleLineVisible'
        if (lineObjTyped.lineVisible !== undefined) {
          const visibilityKey = propName + 'Visible';
          flattened[visibilityKey] = lineObjTyped.lineVisible;
        }

        // Map additional LineOptions properties (if present in nested object)
        // These are typically not used by custom series but included for completeness
        if (lineObjTyped.lineType !== undefined) {
          flattened[propName + 'Type'] = lineObjTyped.lineType;
        }
        if (lineObjTyped.pointMarkersVisible !== undefined) {
          flattened[propName + 'PointMarkersVisible'] = lineObjTyped.pointMarkersVisible;
        }
        if (lineObjTyped.pointMarkersRadius !== undefined) {
          flattened[propName + 'PointMarkersRadius'] = lineObjTyped.pointMarkersRadius;
        }
        if (lineObjTyped.crosshairMarkerVisible !== undefined) {
          flattened[propName + 'CrosshairMarkerVisible'] = lineObjTyped.crosshairMarkerVisible;
        }
        if (lineObjTyped.crosshairMarkerRadius !== undefined) {
          flattened[propName + 'CrosshairMarkerRadius'] = lineObjTyped.crosshairMarkerRadius;
        }
        if (lineObjTyped.crosshairMarkerBorderColor !== undefined) {
          flattened[propName + 'CrosshairMarkerBorderColor'] =
            lineObjTyped.crosshairMarkerBorderColor;
        }
        if (lineObjTyped.crosshairMarkerBackgroundColor !== undefined) {
          flattened[propName + 'CrosshairMarkerBackgroundColor'] =
            lineObjTyped.crosshairMarkerBackgroundColor;
        }
        if (lineObjTyped.crosshairMarkerBorderWidth !== undefined) {
          flattened[propName + 'CrosshairMarkerBorderWidth'] =
            lineObjTyped.crosshairMarkerBorderWidth;
        }
        if (lineObjTyped.lastPriceAnimation !== undefined) {
          flattened[propName + 'LastPriceAnimation'] = lineObjTyped.lastPriceAnimation;
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

    // Extract custom properties that are NOT part of the official Lightweight Charts API
    // These properties are used for UI/metadata purposes only
    const { displayName, ...apiOptions } = flattenedUserOptions as any;

    // Merge user options with defaults and add _seriesType metadata
    const options = {
      ...defaultOptions,
      ...apiOptions, // Use apiOptions (with custom properties filtered out)
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
  /** Price scale ID for series attachment */
  priceScaleId?: string;
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
  /** Series visibility */
  visible?: boolean;
  /** Z-index for rendering order */
  zIndex?: number;
  /** Show last value on price scale */
  lastValueVisible?: boolean;
  /** Show price line */
  priceLineVisible?: boolean;
  /** Price line source (0 = lastBar, 1 = lastVisible, or string 'lastBar'/'lastVisible') */
  priceLineSource?: number | 'lastBar' | 'lastVisible';
  /** Price line width */
  priceLineWidth?: number;
  /** Price line color */
  priceLineColor?: string;
  /** Price line style */
  priceLineStyle?: number;
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
      priceLines,
      markers,
      legend,
      seriesId,
      chartId,
    } = config;

    // Backend now sends all series configuration properties in the options object.
    // Framework metadata (type, data, paneId) and post-creation objects (priceScale,
    // priceLines, markers, legend) remain at top-level for proper handling.

    // Step 1: Create the series using basic createSeries
    // Note: createSeries already handles data sorting and setting via descriptors
    const series = createSeries(chart, type, data, options, paneId) as ExtendedSeriesApi;

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

    // Store custom properties for UI/metadata purposes
    // NOTE: These properties serve different purposes:
    //   - displayName: Custom UI property (NOT part of Lightweight Charts API)
    //                  Used in dialog tabs, tooltips, and other UI elements
    //                  Filtered out before passing to API (see createSeries function)
    //   - title: Official Lightweight Charts API property
    //            Already passed in options to addSeries(), stored here for quick access
    const optionsAny = options as any;
    if (optionsAny.displayName) {
      series.displayName = optionsAny.displayName;
    }
    if (optionsAny.title) {
      series.title = optionsAny.title;
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
