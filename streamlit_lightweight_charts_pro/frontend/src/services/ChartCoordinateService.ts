/**
 * @fileoverview Chart Coordinate Service
 *
 * Centralized singleton service for all chart coordinate calculations and
 * positioning logic. Provides consistent coordinate conversion, dimension
 * management, and layout calculations across all chart features.
 *
 * This service is the single source of truth for:
 * - Chart-to-screen coordinate conversion
 * - Screen-to-chart coordinate conversion
 * - Pane dimension calculations
 * - Legend positioning
 * - Tooltip positioning
 * - Overlay element positioning
 * - Dimension validation and caching
 *
 * Architecture:
 * - Singleton pattern (one instance per chart)
 * - Keyed instances (multiple charts supported)
 * - Coordinate caching with staleness detection
 * - Robust validation and error handling
 * - Integration with TradingView Lightweight Charts API
 *
 * Key Features:
 * - Smart caching to prevent excessive calculations
 * - Automatic viewport boundary detection
 * - Consistent margins and spacing
 * - Support for multi-pane charts
 * - Tooltip smart positioning (avoids viewport edges)
 * - Overlay bounding box calculations
 *
 * @example
 * ```typescript
 * const service = ChartCoordinateService.getInstance();
 * service.registerChart('chart-1', chartApi);
 *
 * // Convert time/price to screen coordinates
 * const screenCoords = service.convertDataToScreen(
 *   'chart-1',
 *   timestamp,
 *   price,
 *   seriesApi
 * );
 *
 * // Calculate tooltip position
 * const position = service.calculateTooltipPosition(
 *   mouseX, mouseY, tooltipWidth, tooltipHeight, container, 'top'
 * );
 * ```
 */

import { IChartApi, ISeriesApi, Time, PriceToCoordinateConverter } from 'lightweight-charts';
import {
  ChartCoordinates,
  PaneCoordinates,
  LegendCoordinates,
  ElementPosition,
  CoordinateOptions,
  CoordinateCacheEntry,
  BoundingBox,
  ScaleDimensions,
  ContainerDimensions,
  Margins,
} from '../types/coordinates';
import {
  PaneSize,
  PaneBounds,
  ChartLayoutDimensions,
  WidgetPosition,
  LayoutWidget,
} from '../types';
import {
  validateChartCoordinates,
  sanitizeCoordinates,
  createBoundingBox,
  areCoordinatesStale,
  logValidationResult,
} from '../utils/coordinateValidation';
import { DIMENSIONS, TIMING, Z_INDEX, getFallback, getMargins } from '../config/positioningConfig';
import { UniversalSpacing } from '../primitives/PrimitiveDefaults';
import { logger } from '../utils/logger';

/**
 * Configuration for chart dimensions validation
 */
export interface ChartDimensionsOptions {
  minWidth?: number;
  minHeight?: number;
  maxAttempts?: number;
  baseDelay?: number;
}

/**
 * Configuration for pane dimensions options
 */
export interface PaneDimensionsOptions {
  includeMargins?: boolean;
  includeScales?: boolean;
  validateDimensions?: boolean;
}

/**
 * Configuration for positioning calculations (from PositioningEngine)
 */
export interface PositioningConfig {
  margins?: Partial<Margins>;
  dimensions?: { width?: number; height?: number };
  zIndex?: number;
  alignment?: 'start' | 'center' | 'end';
  offset?: { x?: number; y?: number };
}

/**
 * Tooltip positioning configuration (from PositioningEngine)
 */
export interface TooltipPosition {
  x: number;
  y: number;
  anchor: 'top' | 'bottom' | 'left' | 'right';
  offset: { x: number; y: number };
}

/**
 * Configuration for series data coordinate conversion
 */
export interface SeriesDataConversionConfig {
  /** Keys to extract from data for conversion */
  valueKeys: string[];
  /** Whether to validate numeric values */
  validateNumbers?: boolean;
  /** Whether to check for finite values */
  checkFinite?: boolean;
  /** Custom validation function */
  customValidator?: (data: any) => boolean;
}

/**
 * Result of series data coordinate conversion
 */
export interface SeriesDataConversionResult {
  x: number | null;
  [key: string]: number | null;
}

/**
 * ChartCoordinateService - Centralized coordinate and positioning system
 *
 * Manages all coordinate conversions, dimension calculations, and positioning
 * logic for chart features. Uses caching and validation to ensure accuracy
 * and performance across pan, zoom, and resize operations.
 *
 * Architecture:
 * - Singleton pattern with global instance
 * - Per-chart registration and tracking
 * - Multi-layer caching (coordinates, dimensions)
 * - Automatic cache invalidation and cleanup
 * - Integration with chart lifecycle
 *
 * Core Responsibilities:
 * - Time/price to screen coordinate conversion
 * - Screen to time/price coordinate conversion
 * - Pane dimension calculations
 * - Legend positioning (corners, relative)
 * - Tooltip smart positioning
 * - Overlay bounding box calculations
 * - Margin and spacing management
 *
 * Caching Strategy:
 * - Coordinates cached with staleness detection
 * - Dimensions cached with expiration
 * - Automatic cleanup every 60 seconds
 * - Manual invalidation on chart changes
 *
 * @export
 * @class ChartCoordinateService
 *
 * @example
 * ```typescript
 * const service = ChartCoordinateService.getInstance();
 *
 * // Register chart
 * service.registerChart('my-chart', chartApi);
 *
 * // Get coordinates
 * const coords = await service.getCoordinates(chartApi, container);
 *
 * // Convert data to screen
 * const screenX = service.convertDataToScreen(
 *   'my-chart', timestamp, price, seriesApi
 * );
 *
 * // Calculate tooltip position
 * const pos = service.calculateTooltipPosition(
 *   mouseX, mouseY, 200, 100, container, 'top'
 * );
 * ```
 */
export class ChartCoordinateService {
  /** Singleton instance */
  private static instance: ChartCoordinateService;

  /** Cache for coordinate calculations (per chart/container) */
  private coordinateCache = new Map<string, CoordinateCacheEntry>();

  /** Cache for pane dimensions (per chart) */
  private paneDimensionsCache = new Map<
    string,
    {
      dimensions: { [paneId: number]: { width: number; height: number } };
      expiresAt: number;
    }
  >();

  /** Registry of chart instances by ID */
  private chartRegistry = new Map<string, IChartApi>();

  /** Update callbacks for chart changes */
  private updateCallbacks = new Map<string, Set<() => void>>();

  /**
   * Get singleton instance (lazy initialization)
   *
   * @static
   * @returns {ChartCoordinateService} The singleton instance
   */
  static getInstance(): ChartCoordinateService {
    if (!this.instance) {
      this.instance = new ChartCoordinateService();
    }
    return this.instance;
  }

  /**
   * Private constructor (Singleton pattern)
   *
   * Initializes the service and starts cache cleanup timer.
   *
   * @private
   */
  private constructor() {
    // Start automatic cache cleanup every 60 seconds
    this.startCacheCleanup();
  }

  /**
   * Register a chart for coordinate tracking
   */
  registerChart(chartId: string, chart: IChartApi): void {
    this.chartRegistry.set(chartId, chart);
    this.invalidateCache(chartId);
  }

  /**
   * Unregister a chart
   */
  unregisterChart(chartId: string): void {
    this.chartRegistry.delete(chartId);
    this.coordinateCache.delete(chartId);
    this.updateCallbacks.delete(chartId);
  }

  /**
   * Get coordinates for a chart with caching and validation
   */
  async getCoordinates(
    chart: IChartApi,
    container: HTMLElement,
    options: CoordinateOptions = {}
  ): Promise<ChartCoordinates> {
    const {
      includeMargins = true,
      useCache = true,
      validateResult = true,
      fallbackOnError = true,
    } = options;

    // Generate cache key
    const cacheKey = this.generateCacheKey(chart, container);

    // Check cache if enabled
    if (useCache) {
      const cached = this.coordinateCache.get(cacheKey);
      if (cached && !areCoordinatesStale(cached, TIMING.cacheExpiration)) {
        return cached;
      }
    }

    try {
      // Calculate coordinates
      const coordinates = await this.calculateCoordinates(chart, container, includeMargins);

      // Validate if requested
      if (validateResult) {
        const validation = validateChartCoordinates(coordinates);
        logValidationResult(validation, 'ChartCoordinateService');

        if (!validation.isValid && fallbackOnError) {
          return sanitizeCoordinates(coordinates);
        }
      }

      // Cache the result
      const cacheEntry: CoordinateCacheEntry = {
        ...coordinates,
        cacheKey,
        expiresAt: Date.now() + TIMING.cacheExpiration,
      };
      this.coordinateCache.set(cacheKey, cacheEntry);

      // Notify listeners
      this.notifyUpdateCallbacks(cacheKey);

      return coordinates;
    } catch (error) {
      if (fallbackOnError) {
        return sanitizeCoordinates({});
      }

      throw error;
    }
  }

  /**
   * Get full pane bounds including price scale areas (for collapse buttons)
   */
  getFullPaneBounds(chart: IChartApi, paneId: number): PaneBounds | null {
    try {
      // Validate inputs
      if (!chart || typeof paneId !== 'number' || paneId < 0) {
        return null;
      }

      // Get pane size from chart with error handling
      let paneSize: PaneSize | null = null;
      try {
        paneSize = chart.paneSize(paneId);
      } catch {
        return null;
      }

      if (!paneSize || typeof paneSize.height !== 'number' || typeof paneSize.width !== 'number') {
        return null;
      }

      // Calculate cumulative offset for this pane
      let offsetY = 0;
      for (let i = 0; i < paneId; i++) {
        try {
          const size = chart.paneSize(i);
          if (size && typeof size.height === 'number') {
            offsetY += size.height;
          }
        } catch {
          // Continue with other panes even if one fails
        }
      }

      // Return full pane bounds including all price scale areas
      const paneWidth = paneSize.width || getFallback('paneWidth');
      return createBoundingBox(
        0, // Full pane starts at 0
        offsetY,
        paneWidth, // Full pane width including price scales
        paneSize.height
      );
    } catch {
      return null;
    }
  }

  /**
   * Get coordinates for a specific pane
   */
  getPaneCoordinates(chart: IChartApi, paneId: number): PaneCoordinates | null {
    try {
      // Validate inputs
      if (!chart || typeof paneId !== 'number' || paneId < 0) {
        return null;
      }

      // Get pane size from chart with error handling
      let paneSize: PaneSize | null = null;
      try {
        paneSize = chart.paneSize(paneId);
      } catch {
        return null;
      }

      if (!paneSize || typeof paneSize.height !== 'number' || typeof paneSize.width !== 'number') {
        return null;
      }

      // Calculate cumulative offset for this pane
      let offsetY = 0;
      for (let i = 0; i < paneId; i++) {
        try {
          const size = chart.paneSize(i);
          if (size && typeof size.height === 'number') {
            offsetY += size.height;
          }
        } catch {
          // Continue with other panes even if one fails
        }
      }

      // Get chart element for price scale width
      // Get chart element (used for price scale width calculation)
      const timeScaleHeight = this.getTimeScaleHeight(chart);

      // Get both left and right price scale widths for proper legend positioning
      const axisDimensions = this.getAxisDimensions(chart);

      // For legend positioning, we need coordinates relative to the chart element itself
      // The legend is appended to the chart element, so coordinates should be relative to it
      const legendOffsetX = 0; // Legend is positioned relative to chart element
      const legendOffsetY = offsetY; // Y offset for multi-pane charts

      // Calculate bounds relative to chart element (for pane primitive positioning)
      // Pane primitives should get the full pane area without price scale adjustments
      const paneWidth = paneSize.width || getFallback('paneWidth');

      const bounds = createBoundingBox(
        legendOffsetX,
        legendOffsetY,
        paneWidth, // Use full pane width - no price scale adjustment
        paneSize.height
      );

      // Calculate content area (excluding scales) relative to chart element
      // This is where the actual chart content starts (after price scale)
      // The left Y-axis (price scale) takes up priceScaleWidth pixels from the left
      const contentArea = createBoundingBox(
        axisDimensions.leftPriceScaleWidth, // Start after the left Y-axis (price scale)
        legendOffsetY,
        paneWidth - axisDimensions.leftPriceScaleWidth - axisDimensions.rightPriceScaleWidth, // Width excluding both price scales
        paneSize.height - (paneId === 0 ? 0 : timeScaleHeight)
      );

      // Get margins
      const margins = getMargins('pane');

      // Debug logging for legend positioning
      if (paneId === 0) {
        // Main pane - coordinates calculated
      }

      return {
        paneId,
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
        absoluteX: bounds.x,
        absoluteY: bounds.y,
        contentArea: {
          top: contentArea.y,
          left: contentArea.x,
          width: contentArea.width,
          height: contentArea.height,
        },
        margins,
        isMainPane: paneId === 0,
        isLastPane: false, // Will need to be calculated if needed
      };
    } catch {
      return null;
    }
  }

  /**
   * Get pane coordinates with enhanced fallback methods
   */
  async getPaneCoordinatesWithFallback(
    chart: IChartApi,
    paneId: number,
    container: HTMLElement,
    options: PaneDimensionsOptions & ChartDimensionsOptions = {}
  ): Promise<PaneCoordinates | null> {
    const { ...paneOptions } = options;

    // Method 1: Try chart API first
    let paneCoords = this.getPaneCoordinates(chart, paneId);
    if (paneCoords) {
      return paneCoords;
    }

    // Method 2: Single immediate retry without delay for resize performance
    paneCoords = this.getPaneCoordinates(chart, paneId);
    if (paneCoords) {
      return paneCoords;
    }

    // Method 3: DOM fallback
    return this.getPaneCoordinatesFromDOM(chart, container, paneId, paneOptions);
  }

  /**
   * Get pane coordinates using DOM measurements (fallback method)
   */
  private getPaneCoordinatesFromDOM(
    chart: IChartApi,
    container: HTMLElement,
    paneId: number,
    options: PaneDimensionsOptions = {}
  ): PaneCoordinates | null {
    try {
      // Find pane elements in DOM
      const chartElement = chart.chartElement();
      if (!chartElement) {
        return null;
      }

      const paneElements = chartElement.querySelectorAll('.tv-lightweight-charts-pane');
      if (paneElements.length <= paneId) {
        return null;
      }

      const paneElement = paneElements[paneId] as HTMLElement;
      const paneRect = paneElement.getBoundingClientRect();
      const chartRect = chartElement.getBoundingClientRect();

      // Calculate relative position within the chart container
      const offsetY = paneRect.top - chartRect.top;
      const width = paneRect.width;
      const height = paneRect.height;

      // Validate dimensions if requested
      if (options.validateDimensions && (width < 10 || height < 10)) {
        return null;
      }

      // For legend positioning, coordinates should be relative to the chart element
      // The legend is appended to the chart element, so we use 0 for x offset
      const legendOffsetX = 0;
      const legendOffsetY = offsetY;

      // Calculate bounds relative to chart element (for legend positioning)
      const bounds = createBoundingBox(legendOffsetX, legendOffsetY, width, height);

      // Calculate content area (excluding scales) relative to chart element
      const priceScaleWidth = this.getPriceScaleWidth(chart);
      const timeScaleHeight = this.getTimeScaleHeight(chart);
      // The left Y-axis (price scale) takes up priceScaleWidth pixels from the left
      const contentArea = createBoundingBox(
        priceScaleWidth, // Start after the left Y-axis (price scale)
        legendOffsetY,
        width - priceScaleWidth, // Width is the remaining area after price scale
        height - (paneId === 0 ? 0 : timeScaleHeight)
      );

      // Get margins
      const margins = getMargins('pane');

      return {
        paneId,
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
        absoluteX: bounds.x,
        absoluteY: bounds.y,
        contentArea: {
          top: contentArea.y,
          left: contentArea.x,
          width: contentArea.width,
          height: contentArea.height,
        },
        margins,
        isMainPane: paneId === 0,
        isLastPane: false, // Will need to be calculated if needed
      };
    } catch {
      return null;
    }
  }

  /**
   * Check if a point is within a pane
   */
  isPointInPane(point: { x: number; y: number }, paneCoords: PaneCoordinates): boolean {
    return (
      point.x >= paneCoords.x &&
      point.x <= paneCoords.x + paneCoords.width &&
      point.y >= paneCoords.y &&
      point.y <= paneCoords.y + paneCoords.height
    );
  }

  /**
   * Check if chart dimensions are valid
   */
  areChartDimensionsValid(
    dimensions: ChartCoordinates,
    minWidth: number = 200,
    minHeight: number = 200
  ): boolean {
    try {
      const { container } = dimensions;
      return container.width >= minWidth && container.height >= minHeight;
    } catch {
      return false;
    }
  }

  /**
   * Check if chart dimensions object is valid
   */
  areChartDimensionsObjectValid(
    dimensions: { container: { width: number; height: number } },
    minWidth: number = 200,
    minHeight: number = 200
  ): boolean {
    try {
      const { container } = dimensions;
      return container.width >= minWidth && container.height >= minHeight;
    } catch {
      return false;
    }
  }

  /**
   * Get validated chart coordinates
   */
  async getValidatedCoordinates(
    chart: IChartApi,
    container: HTMLElement,
    options: ChartDimensionsOptions = {}
  ): Promise<ChartCoordinates | null> {
    try {
      const coordinates = await this.getCoordinates(chart, container, {
        validateResult: true,
      });

      if (this.areChartDimensionsValid(coordinates, options.minWidth, options.minHeight)) {
        return coordinates;
      } else {
        return null;
      }
    } catch {
      return null;
    }
  }

  /**
   * Get chart dimensions with multiple fallback methods
   */
  async getChartDimensionsWithFallback(
    chart: IChartApi,
    container: HTMLElement,
    options: ChartDimensionsOptions = {}
  ): Promise<{
    container: { width: number; height: number };
    timeScale: { x: number; y: number; width: number; height: number };
    priceScale: { x: number; y: number; width: number; height: number };
  }> {
    const { minWidth = 200, minHeight = 200 } = options;

    // Method 1: Try chart API first
    try {
      const chartElement = chart.chartElement();
      if (chartElement) {
        const chartRect = chartElement.getBoundingClientRect();
        if (chartRect.width >= minWidth && chartRect.height >= minHeight) {
          return this.getChartDimensionsFromAPI(chart, {
            width: chartRect.width,
            height: chartRect.height,
          });
        }
      }
    } catch {
      // Chart API method failed, trying DOM fallback
    }

    // Method 2: DOM fallback
    try {
      const result = this.getChartDimensionsFromDOM(chart, container);
      if (result.container.width >= minWidth && result.container.height >= minHeight) {
        return result;
      }
    } catch {
      // DOM method failed, using defaults
    }

    // Method 3: Default values
    return this.getDefaultChartDimensions();
  }

  /**
   * Get chart dimensions using chart API (most accurate)
   */
  private getChartDimensionsFromAPI(
    chart: IChartApi,
    chartSize: { width: number; height: number }
  ): {
    container: { width: number; height: number };
    timeScale: { x: number; y: number; width: number; height: number };
    priceScale: { x: number; y: number; width: number; height: number };
  } {
    // Get time scale dimensions
    let timeScaleHeight = 35;
    let timeScaleWidth = chartSize.width;

    try {
      const timeScale = chart.timeScale();
      timeScaleHeight = timeScale.height() || 35;
      timeScaleWidth = timeScale.width() || chartSize.width;
    } catch {
      // Time scale API failed, using defaults
    }

    // Get price scale width
    let priceScaleWidth = 70;

    try {
      const priceScale = chart.priceScale('left');
      priceScaleWidth = priceScale.width() || 70;
    } catch {
      // Price scale API failed, using defaults
    }

    return {
      timeScale: {
        x: 0,
        y: chartSize.height - timeScaleHeight,
        height: timeScaleHeight,
        width: timeScaleWidth,
      },
      priceScale: {
        x: 0,
        y: 0,
        height: chartSize.height - timeScaleHeight,
        width: priceScaleWidth,
      },
      container: chartSize,
    };
  }

  /**
   * Get chart dimensions using DOM measurements (fallback method)
   */
  private getChartDimensionsFromDOM(
    chart: IChartApi,
    container: HTMLElement
  ): {
    container: { width: number; height: number };
    timeScale: { x: number; y: number; width: number; height: number };
    priceScale: { x: number; y: number; width: number; height: number };
  } {
    // Get container dimensions with multiple fallback methods
    let width = 0;
    let height = 0;

    // Method 1: getBoundingClientRect
    try {
      const rect = container.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
    } catch (error) {
      logger.error('Chart coordinate operation failed', 'ChartCoordinateService', error);
    }

    // Method 2: offset dimensions
    if (!width || !height) {
      width = container.offsetWidth;
      height = container.offsetHeight;
    }

    // Method 3: client dimensions
    if (!width || !height) {
      width = container.clientWidth;
      height = container.clientHeight;
    }

    // Method 4: scroll dimensions
    if (!width || !height) {
      width = container.scrollWidth;
      height = container.scrollHeight;
    }

    // Ensure minimum dimensions
    width = Math.max(width || 800, 200);
    height = Math.max(height || 600, 200);

    // Get time scale dimensions
    let timeScaleHeight = 35;
    let timeScaleWidth = width;

    try {
      const timeScale = chart.timeScale();
      timeScaleHeight = timeScale.height() || 35;
      timeScaleWidth = timeScale.width() || width;
    } catch (error) {
      logger.error('Chart coordinate operation failed', 'ChartCoordinateService', error);
    }

    // Get price scale width
    let priceScaleWidth = 70;

    try {
      const priceScale = chart.priceScale('left');
      priceScaleWidth = priceScale.width() || 70;
    } catch (error) {
      logger.error('Chart coordinate operation failed', 'ChartCoordinateService', error);
    }

    return {
      timeScale: {
        x: 0,
        y: height - timeScaleHeight,
        height: timeScaleHeight,
        width: timeScaleWidth,
      },
      priceScale: {
        x: 0,
        y: 0,
        height: height - timeScaleHeight,
        width: priceScaleWidth,
      },
      container: { width, height },
    };
  }

  /**
   * Get default chart dimensions (last resort)
   */
  private getDefaultChartDimensions(): {
    container: { width: number; height: number };
    timeScale: { x: number; y: number; width: number; height: number };
    priceScale: { x: number; y: number; width: number; height: number };
  } {
    return {
      timeScale: {
        x: 0,
        y: 565, // 600 - 35
        height: 35,
        width: 800,
      },
      priceScale: {
        x: 0,
        y: 0,
        height: 565, // 600 - 35
        width: 70,
      },
      container: {
        width: 800,
        height: 600,
      },
    };
  }

  /**
   * Get validated chart dimensions
   */
  async getValidatedChartDimensions(
    chart: IChartApi,
    container: HTMLElement,
    options: ChartDimensionsOptions = {}
  ): Promise<{
    container: { width: number; height: number };
    timeScale: { x: number; y: number; width: number; height: number };
    priceScale: { x: number; y: number; width: number; height: number };
  } | null> {
    try {
      const dimensions = await this.getChartDimensionsWithFallback(chart, container, options);

      if (this.areChartDimensionsObjectValid(dimensions, options.minWidth, options.minHeight)) {
        return dimensions;
      } else {
        return null;
      }
    } catch {
      return null;
    }
  }

  /**
   * Calculate range switcher position for the entire chart
   */
  getRangeSwitcherPosition(
    chart: IChartApi,
    position: ElementPosition,
    containerDimensions?: { width: number; height: number }
  ): LegendCoordinates | null {
    try {
      // Get main pane coordinates (pane 0) for reference
      const paneCoords = this.getPaneCoordinates(chart, 0);
      if (!paneCoords) return null;

      // Get container dimensions
      const chartElement = chart.chartElement();
      const container = containerDimensions || {
        width: chartElement.clientWidth || chartElement.offsetWidth || 800,
        height: chartElement.clientHeight || chartElement.offsetHeight || 600,
      };

      // Get chart layout to account for price scale and time scale dimensions
      try {
        chart.chartElement().querySelector('.tv-lightweight-charts')?.getBoundingClientRect();
      } catch {
        // Layout check failed
      }

      // Get actual chart dimensions using lightweight-charts API
      let actualTimeScaleHeight = 35; // Fallback
      let actualPriceScaleWidth = 70; // Fallback

      try {
        // Get actual time scale height from chart API
        actualTimeScaleHeight = chart.timeScale().height();

        // Get actual price scale width - try right scale first, then left scale
        const rightPriceScale = chart.priceScale('right');
        if (rightPriceScale) {
          actualPriceScaleWidth = rightPriceScale.width();
        } else {
          const leftPriceScale = chart.priceScale('left');
          if (leftPriceScale) {
            actualPriceScaleWidth = leftPriceScale.width();
          }
        }
      } catch {
        // Use fallback values if API calls fail
      }

      const priceScaleLabelHeight = 20; // Estimated height for price scale labels (e.g., "161.75")

      // Helper function to count total number of panes
      const getTotalPaneCount = (): number => {
        let paneCount = 0;
        try {
          // Keep trying to get pane sizes until we find a non-existent pane
          while (true) {
            const paneSize = chart.paneSize(paneCount);
            if (!paneSize || typeof paneSize.height !== 'number') {
              break;
            }
            paneCount++;
          }
        } catch {
          // When paneSize() throws an error, we've reached the end
        }
        return paneCount;
      };

      const totalPanes = getTotalPaneCount();

      // Calculate position-specific margins
      const getMarginForPosition = (pos: string) => {
        const baseMargin = UniversalSpacing.EDGE_PADDING;
        const margins = {
          top: baseMargin + priceScaleLabelHeight, // Add space for price scale labels at top
          right: baseMargin + actualPriceScaleWidth, // Add space for price scale width
          bottom: baseMargin, // Base margin for bottom
          left: baseMargin,
        };

        // Only add time scale height margin for bottom positions when:
        // 1. It's a bottom position AND
        // 2. There's only one pane (single-pane chart where X-axis is at bottom of pane 0)
        // In multi-pane charts, the X-axis is only at the very bottom of the last pane, not pane 0
        if (pos.includes('bottom') && totalPanes === 1) {
          margins.bottom += actualTimeScaleHeight; // X-axis height only for single-pane charts
        }

        return margins;
      };

      const margins = getMarginForPosition(position);
      const rangeSwitcherDimensions = { width: 200, height: 40 }; // Estimated dimensions

      let top = 0;
      let left: number | undefined = 0;
      let right: number | undefined;
      let bottom: number | undefined;

      // Calculate position based on alignment
      // Range switcher only supports corner positions
      // For bottom positions, position relative to pane 0 (main price chart)
      // For top positions, position relative to entire chart container
      switch (position) {
        case 'top-left':
          top = margins.top;
          left = margins.left;
          right = undefined;
          break;

        case 'top-right':
          top = margins.top;
          left = undefined;
          right = margins.right;
          break;

        case 'bottom-left':
          // Position at bottom of pane 0, not entire chart
          // This ensures range switcher is positioned at the bottom of the main price chart pane
          top = paneCoords.y + paneCoords.height - margins.bottom - rangeSwitcherDimensions.height;
          left = margins.left;
          right = undefined;
          bottom = undefined;
          break;

        case 'bottom-right':
          // Position at bottom of pane 0, not entire chart
          // This ensures range switcher is positioned at the bottom of the main price chart pane
          top = paneCoords.y + paneCoords.height - margins.bottom - rangeSwitcherDimensions.height;
          left = undefined;
          right = margins.right;
          bottom = undefined;
          break;

        default:
          // Default to bottom-right for range switcher
          top = paneCoords.y + paneCoords.height - margins.bottom - rangeSwitcherDimensions.height;
          left = undefined;
          right = margins.right;
          break;
      }

      // Convert bottom to top if needed
      if (bottom !== undefined && top === 0) {
        top = container.height - bottom - rangeSwitcherDimensions.height;
        bottom = undefined;
      }

      return {
        top,
        left: left ?? 0,
        right,
        bottom,
        width: rangeSwitcherDimensions.width,
        height: rangeSwitcherDimensions.height,
        zIndex: 1000,
      };
    } catch {
      return null;
    }
  }

  /**
   * Calculate legend position within a pane
   */
  getLegendPosition(
    chart: IChartApi,
    paneId: number,
    position: ElementPosition
  ): LegendCoordinates | null {
    const paneCoords = this.getPaneCoordinates(chart, paneId);
    if (!paneCoords) return null;

    const margins = getMargins('legend');
    const legendDimensions = DIMENSIONS.legend;

    let top = 0;
    let left = 0;
    let right: number | undefined;
    let bottom: number | undefined;

    // Calculate position based on alignment
    switch (position) {
      case 'top-left':
        top = paneCoords.contentArea.top + margins.top;
        left = paneCoords.contentArea.left + margins.left;
        break;

      case 'top-right':
        top = paneCoords.contentArea.top + margins.top;
        right = margins.right;
        break;

      case 'top-center':
        top = paneCoords.contentArea.top + margins.top;
        left =
          paneCoords.contentArea.left +
          (paneCoords.contentArea.width - legendDimensions.defaultWidth) / 2;
        break;

      case 'bottom-left':
        bottom = margins.bottom;
        left = paneCoords.contentArea.left + margins.left;
        break;

      case 'bottom-right':
        bottom = margins.bottom;
        right = margins.right;
        break;

      case 'bottom-center':
        bottom = margins.bottom;
        left =
          paneCoords.contentArea.left +
          (paneCoords.contentArea.width - legendDimensions.defaultWidth) / 2;
        break;

      case 'center':
        top =
          paneCoords.contentArea.top +
          (paneCoords.contentArea.height - legendDimensions.defaultHeight) / 2;
        left =
          paneCoords.contentArea.left +
          (paneCoords.contentArea.width - legendDimensions.defaultWidth) / 2;
        break;
    }

    // Convert bottom to top if needed
    if (bottom !== undefined && top === 0) {
      top = bottom;
      bottom = undefined;
    }

    return {
      top,
      left,
      right,
      bottom,
      width: legendDimensions.defaultWidth,
      height: legendDimensions.defaultHeight,
      zIndex: Z_INDEX.legend,
    };
  }

  /**
   * Subscribe to coordinate updates
   */
  onCoordinateUpdate(chartId: string, callback: () => void): () => void {
    if (!this.updateCallbacks.has(chartId)) {
      this.updateCallbacks.set(chartId, new Set());
    }

    const callbacks = this.updateCallbacks.get(chartId);
    if (callbacks) {
      callbacks.add(callback);
    }

    // Return unsubscribe function
    return () => {
      const callbacks = this.updateCallbacks.get(chartId);
      if (callbacks) {
        callbacks.delete(callback);
      }
    };
  }

  /**
   * Invalidate cache for a specific chart
   */
  invalidateCache(chartId?: string): void {
    if (chartId) {
      // Remove specific chart entries
      const keysToDelete: string[] = [];
      this.coordinateCache.forEach((entry, key) => {
        if (key.includes(chartId)) {
          keysToDelete.push(key);
        }
      });
      keysToDelete.forEach(key => this.coordinateCache.delete(key));
    } else {
      // Clear all cache
      this.coordinateCache.clear();
    }
  }

  /**
   * Calculate coordinates for a chart
   */
  private async calculateCoordinates(
    chart: IChartApi,
    container: HTMLElement,
    includeMargins: boolean
  ): Promise<ChartCoordinates> {
    return new Promise(resolve => {
      // Use requestAnimationFrame for better performance
      requestAnimationFrame(() => {
        try {
          // Get container dimensions
          const containerDimensions = this.getContainerDimensions(container);

          // Get scale dimensions
          const timeScale = this.getTimeScaleDimensions(chart, containerDimensions);
          const priceScaleLeft = this.getPriceScaleDimensions(chart, 'left', containerDimensions);
          const priceScaleRight = this.getPriceScaleDimensions(chart, 'right', containerDimensions);

          // Get all panes
          const panes = this.getAllPaneCoordinates(chart);

          // Calculate content area
          const contentArea = this.calculateContentArea(
            containerDimensions,
            timeScale,
            priceScaleLeft,
            includeMargins
          );

          const coordinates: ChartCoordinates = {
            container: containerDimensions,
            timeScale,
            priceScaleLeft,
            priceScaleRight,
            panes,
            contentArea,
            timestamp: Date.now(),
            isValid: true,
          };

          resolve(coordinates);
        } catch {
          resolve(sanitizeCoordinates({}));
        }
      });
    });
  }

  /**
   * Get container dimensions
   */
  private getContainerDimensions(container: HTMLElement): ContainerDimensions {
    const rect = container.getBoundingClientRect();
    return {
      width: rect.width || container.offsetWidth || getFallback('containerWidth'),
      height: rect.height || container.offsetHeight || getFallback('containerHeight'),
      offsetTop: container.offsetTop || 0,
      offsetLeft: container.offsetLeft || 0,
    };
  }

  /**
   * Get time scale dimensions
   */
  private getTimeScaleDimensions(
    chart: IChartApi,
    container: ContainerDimensions
  ): ScaleDimensions {
    try {
      const timeScale = chart.timeScale();
      const height = timeScale.height() || getFallback('timeScaleHeight');
      const width = timeScale.width() || container.width;

      return {
        x: 0,
        y: container.height - height,
        width,
        height,
      };
    } catch {
      return {
        x: 0,
        y: container.height - getFallback('timeScaleHeight'),
        width: container.width,
        height: getFallback('timeScaleHeight'),
      };
    }
  }

  /**
   * Get price scale dimensions
   */
  private getPriceScaleDimensions(
    chart: IChartApi,
    side: 'left' | 'right',
    container: ContainerDimensions
  ): ScaleDimensions {
    try {
      const priceScale = chart.priceScale(side);
      const width = priceScale.width() || (side === 'left' ? getFallback('priceScaleWidth') : 0);

      return {
        x: side === 'left' ? 0 : container.width - width,
        y: 0,
        width,
        height: container.height - getFallback('timeScaleHeight'),
      };
    } catch {
      const defaultWidth = side === 'left' ? getFallback('priceScaleWidth') : 0;
      return {
        x: side === 'left' ? 0 : container.width - defaultWidth,
        y: 0,
        width: defaultWidth,
        height: container.height - getFallback('timeScaleHeight'),
      };
    }
  }

  /**
   * Get all pane coordinates
   */
  private getAllPaneCoordinates(chart: IChartApi): PaneCoordinates[] {
    const panes: PaneCoordinates[] = [];
    let paneIndex = 0;
    // Track total height for future use (currently disabled)

    // Try to get panes until we hit an invalid one
    while (paneIndex < 10) {
      // Safety limit
      try {
        const paneSize = chart.paneSize(paneIndex);
        if (!paneSize) break;

        const paneCoords = this.getPaneCoordinates(chart, paneIndex);
        if (paneCoords) {
          panes.push(paneCoords);
        }

        // Track total height for future use
        paneIndex++;
      } catch {
        break;
      }
    }

    // Ensure we have at least one pane
    if (panes.length === 0) {
      const fallbackWidth = getFallback('paneWidth');
      const fallbackHeight = getFallback('paneHeight');
      const priceScaleWidth = getFallback('priceScaleWidth');
      const timeScaleHeight = getFallback('timeScaleHeight');

      panes.push({
        paneId: 0,
        x: 0,
        y: 0,
        width: fallbackWidth,
        height: fallbackHeight,
        absoluteX: 0,
        absoluteY: 0,
        contentArea: {
          top: 0,
          left: priceScaleWidth,
          width: fallbackWidth - priceScaleWidth,
          height: fallbackHeight - timeScaleHeight,
        },
        margins: getMargins('pane'),
        isMainPane: true,
        isLastPane: true,
      });
    }

    return panes;
  }

  /**
   * Calculate content area
   */
  private calculateContentArea(
    container: ContainerDimensions,
    timeScale: ScaleDimensions,
    priceScaleLeft: ScaleDimensions,
    includeMargins: boolean
  ): BoundingBox {
    const margins = includeMargins
      ? getMargins('content')
      : { top: 0, right: 0, bottom: 0, left: 0 };

    const x = priceScaleLeft.width + margins.left;
    const y = margins.top;
    const width = container.width - priceScaleLeft.width - margins.left - margins.right;
    const height = container.height - timeScale.height - margins.top - margins.bottom;

    return createBoundingBox(x, y, width, height);
  }

  /**
   * Get price scale width helper
   */
  private getPriceScaleWidth(chart: IChartApi, side: 'left' | 'right' = 'left'): number {
    try {
      const priceScale = chart.priceScale(side);
      const width = priceScale.width();

      // If width is 0 or undefined, the price scale is not visible
      if (!width || width === 0) {
        return 0;
      }

      return width;
    } catch {
      // If we can't access the price scale, assume it's not visible
      return 0;
    }
  }

  /**
   * Get time scale height helper
   */
  private getTimeScaleHeight(chart: IChartApi): number {
    try {
      const timeScale = chart.timeScale();
      return timeScale.height() || getFallback('timeScaleHeight');
    } catch {
      return getFallback('timeScaleHeight');
    }
  }

  /**
   * Generate cache key
   */
  private generateCacheKey(chart: IChartApi, container: HTMLElement): string {
    const chartId = chart?.chartElement?.()?.id || 'unknown';
    const containerId = container?.id || 'unknown';
    return `${chartId}-${containerId}`;
  }

  /**
   * Notify update callbacks
   */
  private notifyUpdateCallbacks(cacheKey: string): void {
    const chartId = cacheKey.split('-')[0];
    const callbacks = this.updateCallbacks.get(chartId);

    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback();
        } catch (error) {
          logger.error('Callback execution failed', 'ChartCoordinateService', error);
        }
      });
    }
  }

  /**
   * Start cache cleanup timer
   */
  private startCacheCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      const keysToDelete: string[] = [];
      this.coordinateCache.forEach((entry, key) => {
        if (entry.expiresAt < now) {
          keysToDelete.push(key);
        }
      });
      keysToDelete.forEach(key => this.coordinateCache.delete(key));
    }, TIMING.cacheExpiration);
  }

  /**
   * Get current pane dimensions for comparison
   */
  getCurrentPaneDimensions(chart: IChartApi): {
    [paneId: number]: { width: number; height: number };
  } {
    const dimensions: { [paneId: number]: { width: number; height: number } } = {};
    let paneIndex = 0;

    while (paneIndex < 10) {
      // Safety limit
      try {
        const paneSize = chart.paneSize(paneIndex);
        if (!paneSize) break;

        dimensions[paneIndex] = {
          width: paneSize.width || 0,
          height: paneSize.height || 0,
        };

        paneIndex++;
      } catch {
        break;
      }
    }

    return dimensions;
  }

  /**
   * Check if pane dimensions have changed and notify listeners
   */
  checkPaneSizeChanges(chart: IChartApi, chartId: string): boolean {
    const currentDimensions = this.getCurrentPaneDimensions(chart);
    const cacheKey = this.generateCacheKey(chart, chart.chartElement());

    // Check if we have cached pane dimensions
    const cachedPaneDimensions = this.paneDimensionsCache.get(cacheKey);

    if (!cachedPaneDimensions) {
      // First time checking, store current dimensions
      this.paneDimensionsCache.set(cacheKey, {
        dimensions: currentDimensions,
        expiresAt: Date.now() + TIMING.cacheExpiration,
      });
      return false;
    }

    // Compare with cached dimensions
    const hasChanges = this.hasPaneSizeChanges(cachedPaneDimensions.dimensions, currentDimensions);

    if (hasChanges) {
      // Update cached dimensions
      cachedPaneDimensions.dimensions = currentDimensions;
      cachedPaneDimensions.expiresAt = Date.now() + TIMING.cacheExpiration;
      // Invalidate the coordinate cache to force recalculation
      this.invalidateCache(chartId);
      // Notify listeners about the change
      this.notifyUpdateCallbacks(cacheKey);
      return true;
    }

    return false;
  }

  /**
   * Enhanced pane size change detection with better performance
   */
  checkPaneSizeChangesOptimized(chart: IChartApi, chartId: string): boolean {
    const currentDimensions = this.getCurrentPaneDimensions(chart);
    const cacheKey = this.generateCacheKey(chart, chart.chartElement());

    // Check if we have cached pane dimensions
    const cachedPaneDimensions = this.paneDimensionsCache.get(cacheKey);

    if (!cachedPaneDimensions) {
      // First time checking, store current dimensions
      this.paneDimensionsCache.set(cacheKey, {
        dimensions: currentDimensions,
        expiresAt: Date.now() + TIMING.cacheExpiration,
      });
      return false;
    }

    // Check if dimensions have changed
    const hasChanges = this.hasPaneSizeChanges(cachedPaneDimensions.dimensions, currentDimensions);

    if (hasChanges) {
      // Update cached pane dimensions
      cachedPaneDimensions.dimensions = currentDimensions;
      cachedPaneDimensions.expiresAt = Date.now() + TIMING.cacheExpiration;

      // Invalidate coordinate cache for this chart
      this.invalidateCache(chartId);

      // Notify listeners
      this.notifyUpdateCallbacks(cacheKey);

      return true;
    }

    return false;
  }

  /**
   * Force refresh of coordinates for a specific chart
   * Useful when external changes affect chart layout
   */
  forceRefreshCoordinates(chartId: string): void {
    // Clear all cache entries for this chart
    const keysToDelete: string[] = [];
    this.coordinateCache.forEach((entry, key) => {
      if (key.includes(chartId)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => this.coordinateCache.delete(key));

    // Also clear pane dimensions cache
    const paneKeysToDelete: string[] = [];
    this.paneDimensionsCache.forEach((entry, key) => {
      if (key.includes(chartId)) {
        paneKeysToDelete.push(key);
      }
    });
    paneKeysToDelete.forEach(key => this.paneDimensionsCache.delete(key));

    // Notify all listeners for this chart
    this.updateCallbacks.forEach((callbacks, key) => {
      if (key.includes(chartId)) {
        callbacks.forEach(callback => {
          try {
            callback();
          } catch (error) {
            logger.error('Cache cleanup callback failed', 'ChartCoordinateService', error);
          }
        });
      }
    });
  }

  /**
   * Check if pane dimensions have changed
   */
  private hasPaneSizeChanges(
    oldDimensions: { [paneId: number]: { width: number; height: number } },
    newDimensions: { [paneId: number]: { width: number; height: number } }
  ): boolean {
    const oldKeys = Object.keys(oldDimensions);
    const newKeys = Object.keys(newDimensions);

    if (oldKeys.length !== newKeys.length) {
      return true;
    }

    for (const paneId of oldKeys) {
      const oldDim = oldDimensions[parseInt(paneId)];
      const newDim = newDimensions[parseInt(paneId)];

      if (!oldDim || !newDim) {
        return true;
      }

      if (oldDim.width !== newDim.width || oldDim.height !== newDim.height) {
        return true;
      }
    }

    return false;
  }

  /**
   * Integration with CornerLayoutManager
   * Get chart dimensions for layout manager
   */
  getChartDimensionsForLayout(chart: IChartApi): { width: number; height: number } | null {
    try {
      const chartElement = chart.chartElement();
      if (!chartElement) return null;

      const rect = chartElement.getBoundingClientRect();
      return {
        width: rect.width || chartElement.offsetWidth || 800,
        height: rect.height || chartElement.offsetHeight || 600,
      };
    } catch {
      return null;
    }
  }

  /**
   * Get chart layout dimensions including axis information for layout manager
   */
  getChartLayoutDimensionsForManager(chart: IChartApi): ChartLayoutDimensions | null {
    try {
      const chartElement = chart.chartElement();
      if (!chartElement) return null;

      const rect = chartElement.getBoundingClientRect();
      const container = {
        width: rect.width || chartElement.offsetWidth || 800,
        height: rect.height || chartElement.offsetHeight || 600,
      };

      // Get axis dimensions
      let leftPriceScaleWidth = 0;
      let rightPriceScaleWidth = 0;
      let timeScaleHeight = 0;

      try {
        // Get time scale height
        const timeScale = chart.timeScale();
        timeScaleHeight = timeScale.height() || 35;

        // Get left price scale width
        const leftPriceScale = chart.priceScale('left');
        if (leftPriceScale) {
          leftPriceScaleWidth = leftPriceScale.width() || 0;
        }

        // Get right price scale width
        const rightPriceScale = chart.priceScale('right');
        if (rightPriceScale) {
          rightPriceScaleWidth = rightPriceScale.width() || 0;
        }

        // If no price scales are visible, default to right scale
        if (leftPriceScaleWidth === 0 && rightPriceScaleWidth === 0) {
          rightPriceScaleWidth = 70; // Default right price scale width
        }
      } catch {
        // Fallback values
        rightPriceScaleWidth = 70;
        timeScaleHeight = 35;
      }

      return {
        container,
        axis: {
          priceScale: {
            left: {
              width: leftPriceScaleWidth,
              height: container.height - timeScaleHeight,
            },
            right: {
              width: rightPriceScaleWidth,
              height: container.height - timeScaleHeight,
            },
          },
          timeScale: {
            width: container.width,
            height: timeScaleHeight,
          },
        },
      };
    } catch {
      // Error getting chart layout dimensions - use fallback values
      return {
        container: { width: 800, height: 600 },
        axis: {
          priceScale: {
            left: { width: 0, height: 565 },
            right: { width: 70, height: 565 },
          },
          timeScale: { width: 800, height: 35 },
        },
      };
    }
  }

  /**
   * Convert ElementPosition to Corner for layout manager
   */
  positionToCorner(position: ElementPosition): string {
    // Map supported positions to corners, with fallbacks for unsupported positions
    switch (position) {
      case 'top-left':
        return 'top-left';
      case 'top-right':
        return 'top-right';
      case 'bottom-left':
        return 'bottom-left';
      case 'bottom-right':
        return 'bottom-right';
      case 'top-center':
        return 'top-right'; // Fallback to top-right
      case 'bottom-center':
        return 'bottom-right'; // Fallback to bottom-right
      case 'center':
        return 'top-right'; // Fallback to top-right
      default:
        return 'top-right';
    }
  }

  /**
   * ================================
   * POSITIONING ENGINE FUNCTIONALITY
   * Absorbed from PositioningEngine to ensure single source of truth
   * ================================
   */

  /**
   * Calculate legend position with consistent logic
   */
  calculateLegendPosition(
    chart: IChartApi,
    paneId: number,
    position: ElementPosition,
    config?: PositioningConfig
  ): LegendCoordinates | null {
    // Use existing getPaneCoordinates method
    const paneCoords = this.getPaneCoordinates(chart, paneId);
    if (!paneCoords) return null;

    // Merge configuration with defaults
    const margins = { ...getMargins('legend'), ...(config?.margins || {}) };

    // For initial positioning, use default dimensions
    // The actual dimensions will be calculated when the element is rendered
    const dimensions = {
      width: config?.dimensions?.width || DIMENSIONS.legend.defaultWidth,
      height: config?.dimensions?.height || DIMENSIONS.legend.defaultHeight,
    };

    const zIndex = config?.zIndex || Z_INDEX.legend;
    const offset = config?.offset || { x: 0, y: 0 };

    // Calculate position based on alignment
    // Use full pane bounds for legends to avoid time axis clipping
    const coords = this.calculateElementPosition(
      {
        x: paneCoords.x,
        y: paneCoords.y,
        width: paneCoords.width,
        height: paneCoords.height,
        top: paneCoords.y,
        left: paneCoords.x,
        right: paneCoords.x + paneCoords.width,
        bottom: paneCoords.y + paneCoords.height,
      },
      dimensions,
      position,
      margins,
      offset
    );

    return {
      ...coords,
      width: dimensions.width,
      height: dimensions.height,
      zIndex,
    };
  }

  /**
   * Recalculate legend position with actual element dimensions
   */
  recalculateLegendPosition(
    chart: IChartApi,
    paneId: number,
    position: ElementPosition,
    legendElement: HTMLElement,
    config?: PositioningConfig
  ): LegendCoordinates | null {
    // Use existing getPaneCoordinates method
    const paneCoords = this.getPaneCoordinates(chart, paneId);
    if (!paneCoords) return null;

    // Get actual element dimensions with fallbacks
    let actualDimensions = {
      width: legendElement.offsetWidth || legendElement.scrollWidth || 0,
      height: legendElement.offsetHeight || legendElement.scrollHeight || 0,
    };

    // If dimensions are still 0, try to get them from computed styles
    if (actualDimensions.width === 0 || actualDimensions.height === 0) {
      const computedStyle = window.getComputedStyle(legendElement);
      actualDimensions = {
        width:
          parseInt(computedStyle.width) ||
          legendElement.clientWidth ||
          DIMENSIONS.legend.defaultWidth,
        height:
          parseInt(computedStyle.height) ||
          legendElement.clientHeight ||
          DIMENSIONS.legend.defaultHeight,
      };
    }

    // Ensure minimum dimensions
    actualDimensions.width = Math.max(actualDimensions.width, DIMENSIONS.legend.minWidth);
    actualDimensions.height = Math.max(actualDimensions.height, DIMENSIONS.legend.minHeight);

    // Merge configuration with defaults
    const margins = { ...getMargins('legend'), ...(config?.margins || {}) };
    const zIndex = config?.zIndex || Z_INDEX.legend;
    const offset = config?.offset || { x: 0, y: 0 };

    // Calculate position based on actual dimensions
    // Use full pane bounds for legends to avoid time axis clipping
    const coords = this.calculateElementPosition(
      {
        x: paneCoords.x,
        y: paneCoords.y,
        width: paneCoords.width,
        height: paneCoords.height,
        top: paneCoords.y,
        left: paneCoords.x,
        right: paneCoords.x + paneCoords.width,
        bottom: paneCoords.y + paneCoords.height,
      },
      actualDimensions,
      position,
      margins,
      offset
    );

    return {
      ...coords,
      width: actualDimensions.width,
      height: actualDimensions.height,
      zIndex,
    };
  }

  /**
   * Calculate tooltip position relative to cursor
   */
  calculateTooltipPosition(
    cursorX: number,
    cursorY: number,
    tooltipWidth: number,
    tooltipHeight: number,
    containerBounds: BoundingBox,
    preferredAnchor: 'top' | 'bottom' | 'left' | 'right' = 'top'
  ): TooltipPosition {
    const margins = getMargins('tooltip');
    const offset = { x: 10, y: 10 };

    let x = cursorX;
    let y = cursorY;
    let anchor = preferredAnchor;

    // Calculate position based on preferred anchor
    switch (preferredAnchor) {
      case 'top':
        x = cursorX - tooltipWidth / 2;
        y = cursorY - tooltipHeight - offset.y;
        break;
      case 'bottom':
        x = cursorX - tooltipWidth / 2;
        y = cursorY + offset.y;
        break;
      case 'left':
        x = cursorX - tooltipWidth - offset.x;
        y = cursorY - tooltipHeight / 2;
        break;
      case 'right':
        x = cursorX + offset.x;
        y = cursorY - tooltipHeight / 2;
        break;
    }

    // Adjust if tooltip goes outside container bounds
    if (x < containerBounds.left + margins.left) {
      x = containerBounds.left + margins.left;
      if (anchor === 'left') anchor = 'right';
    }
    if (x + tooltipWidth > containerBounds.right - margins.right) {
      x = containerBounds.right - tooltipWidth - margins.right;
      if (anchor === 'right') anchor = 'left';
    }
    if (y < containerBounds.top + margins.top) {
      y = containerBounds.top + margins.top;
      if (anchor === 'top') anchor = 'bottom';
    }
    if (y + tooltipHeight > containerBounds.bottom - margins.bottom) {
      y = containerBounds.bottom - tooltipHeight - margins.bottom;
      if (anchor === 'bottom') anchor = 'top';
    }

    return { x, y, anchor, offset };
  }

  /**
   * Calculate overlay position (for rectangles, annotations, etc.)
   * Note: This requires a series to convert prices to coordinates
   */
  calculateOverlayPosition(
    startTime: Time,
    endTime: Time,
    startPrice: number,
    endPrice: number,
    chart: IChartApi,
    series?: ISeriesApi<any>,
    _paneId: number = 0
  ): BoundingBox | null {
    try {
      const timeScale = chart.timeScale();

      // Convert time to x coordinates
      const x1 = timeScale.timeToCoordinate(startTime);
      const x2 = timeScale.timeToCoordinate(endTime);

      // Convert price to y coordinates (requires series)
      let y1: number | null = null;
      let y2: number | null = null;

      if (series) {
        y1 = series.priceToCoordinate(startPrice);
        y2 = series.priceToCoordinate(endPrice);
      } else {
        // Fallback: estimate based on chart height
        const chartElement = chart.chartElement();
        if (chartElement) {
          const height = chartElement.clientHeight;
          // Simple linear mapping (this is a rough approximation)
          y1 = height * 0.3; // Default positions
          y2 = height * 0.7;
        }
      }

      if (x1 === null || x2 === null || y1 === null || y2 === null) {
        return null;
      }

      // Calculate bounding box
      const x = Math.min(x1, x2);
      const y = Math.min(y1, y2);
      const width = Math.abs(x2 - x1);
      const height = Math.abs(y2 - y1);

      return createBoundingBox(x, y, width, height);
    } catch {
      return null;
    }
  }

  /**
   * Calculate multi-pane layout positions
   */
  calculateMultiPaneLayout(
    totalHeight: number,
    paneHeights: number[] | 'equal' | { [key: number]: number }
  ): { [paneId: number]: BoundingBox } {
    const layout: { [paneId: number]: BoundingBox } = {};

    if (paneHeights === 'equal') {
      // Equal height distribution
      const paneCount = Object.keys(layout).length || 1;
      const heightPerPane = totalHeight / paneCount;

      for (let i = 0; i < paneCount; i++) {
        layout[i] = createBoundingBox(
          0,
          i * heightPerPane,
          0, // Width will be set by chart
          heightPerPane
        );
      }
    } else if (Array.isArray(paneHeights)) {
      // Specific heights for each pane
      let currentY = 0;
      paneHeights.forEach((height, index) => {
        layout[index] = createBoundingBox(
          0,
          currentY,
          0, // Width will be set by chart
          height
        );
        currentY += height;
      });
    } else {
      // Object with pane ID to height mapping
      let currentY = 0;
      for (const [paneId, height] of Object.entries(paneHeights)) {
        layout[Number(paneId)] = createBoundingBox(
          0,
          currentY,
          0, // Width will be set by chart
          height
        );
        currentY += height;
      }
    }

    return layout;
  }

  /**
   * Calculate crosshair label position
   */
  calculateCrosshairLabelPosition(
    crosshairX: number,
    crosshairY: number,
    labelWidth: number,
    labelHeight: number,
    containerBounds: BoundingBox,
    axis: 'x' | 'y'
  ): { x: number; y: number } {
    const margins = getMargins('content');

    if (axis === 'x') {
      // Time axis label
      return {
        x: Math.max(
          containerBounds.left + margins.left,
          Math.min(crosshairX - labelWidth / 2, containerBounds.right - labelWidth - margins.right)
        ),
        y: containerBounds.bottom - labelHeight - margins.bottom,
      };
    } else {
      // Price axis label
      return {
        x: containerBounds.right - labelWidth - margins.right,
        y: Math.max(
          containerBounds.top + margins.top,
          Math.min(
            crosshairY - labelHeight / 2,
            containerBounds.bottom - labelHeight - margins.bottom
          )
        ),
      };
    }
  }

  /**
   * Calculate element position within bounds
   */
  private calculateElementPosition(
    bounds: BoundingBox,
    dimensions: { width: number; height: number },
    position: ElementPosition,
    margins: Margins,
    offset: { x?: number; y?: number }
  ): { top: number; left: number; right?: number; bottom?: number } {
    const offsetX = offset.x || 0;
    const offsetY = offset.y || 0;

    switch (position) {
      case 'top-left':
        return {
          top: bounds.top + margins.top + offsetY,
          left: bounds.left + margins.left + offsetX,
        };

      case 'top-right':
        return {
          top: bounds.top + margins.top + offsetY,
          left: bounds.right - dimensions.width - margins.right - offsetX,
          right: margins.right + offsetX,
        };

      case 'bottom-left':
        return {
          top: bounds.bottom - dimensions.height - margins.bottom - offsetY,
          left: bounds.left + margins.left + offsetX,
          bottom: margins.bottom + offsetY,
        };

      case 'bottom-right':
        return {
          top: bounds.bottom - dimensions.height - margins.bottom - offsetY,
          left: bounds.right - dimensions.width - margins.right - offsetX,
          right: margins.right + offsetX,
          bottom: margins.bottom + offsetY,
        };

      case 'center':
        return {
          top: bounds.top + (bounds.height - dimensions.height) / 2 + offsetY,
          left: bounds.left + (bounds.width - dimensions.width) / 2 + offsetX,
        };

      default:
        return {
          top: bounds.top + margins.top + offsetY,
          left: bounds.left + margins.left + offsetX,
        };
    }
  }

  /**
   * Validate positioning constraints
   */
  validatePositioning(
    element: BoundingBox,
    container: BoundingBox
  ): { isValid: boolean; adjustments: { x?: number; y?: number } } {
    const adjustments: { x?: number; y?: number } = {};
    let isValid = true;

    // Check if element fits within container
    if (element.left < container.left) {
      adjustments.x = container.left - element.left;
      isValid = false;
    } else if (element.right > container.right) {
      adjustments.x = container.right - element.right;
      isValid = false;
    }

    if (element.top < container.top) {
      adjustments.y = container.top - element.top;
      isValid = false;
    } else if (element.bottom > container.bottom) {
      adjustments.y = container.bottom - element.bottom;
      isValid = false;
    }

    return { isValid, adjustments };
  }

  /**
   * Apply positioning to DOM element
   */
  applyPositionToElement(
    element: HTMLElement,
    coordinates: LegendCoordinates | { top: number; left: number; right?: number; bottom?: number }
  ): void {
    // Reset all position properties
    element.style.top = 'auto';
    element.style.left = 'auto';
    element.style.right = 'auto';
    element.style.bottom = 'auto';

    // Apply new position
    if (coordinates.top !== undefined) {
      element.style.top = `${coordinates.top}px`;
    }
    if (coordinates.left !== undefined) {
      element.style.left = `${coordinates.left}px`;
    }
    if (coordinates.right !== undefined) {
      element.style.right = `${coordinates.right}px`;
    }
    if (coordinates.bottom !== undefined) {
      element.style.bottom = `${coordinates.bottom}px`;
    }

    // Apply z-index if available
    if ('zIndex' in coordinates && coordinates.zIndex !== undefined) {
      element.style.zIndex = String(coordinates.zIndex);
    }

    // Ensure position is absolute
    if (!element.style.position || element.style.position === 'static') {
      element.style.position = 'absolute';
    }
  }

  /**
   * Calculate responsive scaling factor
   */
  calculateScalingFactor(
    currentWidth: number,
    currentHeight: number,
    baseWidth: number = DIMENSIONS.chart.defaultWidth,
    baseHeight: number = DIMENSIONS.chart.defaultHeight
  ): { x: number; y: number; uniform: number } {
    const scaleX = currentWidth / baseWidth;
    const scaleY = currentHeight / baseHeight;
    const uniform = Math.min(scaleX, scaleY);

    return { x: scaleX, y: scaleY, uniform };
  }

  /**
   * Calculate widget stack position for layout manager support
   */
  calculateWidgetStackPosition(
    chart: IChartApi,
    paneId: number,
    corner: string,
    widgets: LayoutWidget[],
    index: number
  ): WidgetPosition | null {
    // Get pane coordinates
    const paneCoords = this.getPaneCoordinates(chart, paneId);
    if (!paneCoords) return null;

    const isTopCorner = corner.startsWith('top');
    const isRightCorner = corner.endsWith('right');

    // Get actual axis dimensions from lightweight-charts APIs
    const axisDimensions = this.getAxisDimensions(chart);

    // Calculate cumulative offset from previous widgets
    let cumulativeHeight = 0;
    for (let i = 0; i < index; i++) {
      const prevWidget = widgets[i];
      if (prevWidget && prevWidget.visible && prevWidget.getDimensions) {
        const dims = prevWidget.getDimensions();

        // If dimensions are 0, use a reasonable fallback for legends/buttons
        let height = dims.height;
        if (height === 0) {
          // Estimate height based on widget type
          if (
            prevWidget.getContainerClassName &&
            prevWidget.getContainerClassName().includes('legend')
          ) {
            height = 24; // Default legend height
          } else if (
            prevWidget.getContainerClassName &&
            prevWidget.getContainerClassName().includes('button')
          ) {
            height = 16; // Default button height
          } else {
            height = 20; // Generic fallback
          }
        }

        cumulativeHeight += height + UniversalSpacing.WIDGET_GAP; // Widget gap between stacked legends
      }
    }

    const position: any = {
      zIndex: 1000 + index,
    };

    const edgePadding = UniversalSpacing.EDGE_PADDING;

    // Set horizontal position using actual Y-axis widths from price scale APIs
    if (isRightCorner) {
      // For right corners, account for right price scale width
      position.right = edgePadding + axisDimensions.rightPriceScaleWidth;
    } else {
      // For left corners, account for left price scale width
      position.left = edgePadding + axisDimensions.leftPriceScaleWidth;
    }

    // Set vertical position using actual X-axis height from time scale API
    if (isTopCorner) {
      position.top = paneCoords.y + edgePadding + cumulativeHeight;
    } else {
      // For bottom positioning, account for X-axis height on the last pane
      let bottomOffset = edgePadding + cumulativeHeight;

      const isLastPane = this.isLastPane(chart, paneId);
      if (isLastPane) {
        // Add actual X-axis height from time scale API
        bottomOffset += axisDimensions.timeScaleHeight;
      }

      position.bottom = bottomOffset;
    }

    return position;
  }

  /**
   * Get actual axis dimensions from lightweight-charts APIs
   */
  private getAxisDimensions(chart: IChartApi): {
    timeScaleHeight: number;
    leftPriceScaleWidth: number;
    rightPriceScaleWidth: number;
  } {
    let timeScaleHeight = 35; // Default fallback
    let leftPriceScaleWidth = 0; // Default: no left scale
    let rightPriceScaleWidth = 70; // Default fallback for right scale

    try {
      // Get X-axis (time scale) height using ITimeScaleApi
      timeScaleHeight = chart.timeScale().height();
    } catch {
      // Use fallback value
    }

    try {
      // Get left Y-axis (price scale) width using IPriceScaleApi
      const leftPriceScale = chart.priceScale('left');
      if (leftPriceScale) {
        leftPriceScaleWidth = leftPriceScale.width();
      }
    } catch {
      // Left scale doesn't exist or failed - keep default 0
    }

    try {
      // Get right Y-axis (price scale) width using IPriceScaleApi
      const rightPriceScale = chart.priceScale('right');
      if (rightPriceScale) {
        rightPriceScaleWidth = rightPriceScale.width();
      }
    } catch {
      // Use fallback value
    }

    return {
      timeScaleHeight,
      leftPriceScaleWidth,
      rightPriceScaleWidth,
    };
  }

  /**
   * Check if the given pane is the last pane in the chart
   */
  private isLastPane(chart: IChartApi, paneId: number): boolean {
    try {
      // Try to get the next pane - if it fails, this is the last pane
      chart.paneSize(paneId + 1);
      return false; // If we get here, there's a next pane
    } catch {
      return true; // Error means no next pane exists
    }
  }

  /**
   * Calculate cumulative offset for widget stacking
   */
  calculateCumulativeOffset(widgets: LayoutWidget[], index: number, gap: number = 8): number {
    let cumulativeHeight = 0;
    for (let i = 0; i < index; i++) {
      const prevWidget = widgets[i];
      if (prevWidget && prevWidget.visible && prevWidget.getDimensions) {
        const dims = prevWidget.getDimensions();
        cumulativeHeight += dims.height + gap;
      }
    }
    return cumulativeHeight;
  }

  /**
   * Validate stacking bounds for overflow detection
   */
  validateStackingBounds(
    corner: string,
    widgets: LayoutWidget[],
    containerBounds: BoundingBox
  ): { isValid: boolean; overflowingWidgets: LayoutWidget[] } {
    const overflowing: LayoutWidget[] = [];
    const isTopCorner = corner.startsWith('top');
    let cumulativeHeight = UniversalSpacing.EDGE_PADDING; // Edge padding

    for (const widget of widgets) {
      if (!widget.visible || !widget.getDimensions) continue;

      const dims = widget.getDimensions();
      const totalHeightRequired = cumulativeHeight + dims.height + UniversalSpacing.EDGE_PADDING; // Edge padding

      if (isTopCorner) {
        if (totalHeightRequired > containerBounds.height) {
          overflowing.push(widget);
        }
      } else {
        if (totalHeightRequired > containerBounds.height) {
          overflowing.push(widget);
        }
      }

      cumulativeHeight += dims.height + UniversalSpacing.WIDGET_GAP; // Widget gap
    }

    return {
      isValid: overflowing.length === 0,
      overflowingWidgets: overflowing,
    };
  }

  /**
   * Setup automatic layout manager updates when chart dimensions change
   */
  setupLayoutManagerIntegration(chart: IChartApi, layoutManager: any): void {
    const updateLayoutManager = () => {
      const layoutDimensions = this.getChartLayoutDimensionsForManager(chart);
      if (layoutDimensions) {
        layoutManager.updateChartLayout(layoutDimensions);
      }
    };

    // Fast synchronous update for resize events
    const fastUpdateLayoutManager = () => {
      // Use immediate dimension update for fast resize response
      if (layoutManager.updateChartDimensionsFromElement) {
        layoutManager.updateChartDimensionsFromElement();
      } else {
        // Fallback to async method
        updateLayoutManager();
      }
    };

    // Immediate setup for fast resize performance
    updateLayoutManager();

    // Single follow-up using requestAnimationFrame for smooth updates
    requestAnimationFrame(() => {
      updateLayoutManager();
    });

    // Watch for chart element resize and pane changes
    try {
      const chartElement = chart.chartElement();
      if (chartElement && typeof ResizeObserver !== 'undefined') {
        let lastLayoutUpdate = 0;
        const layoutThrottleDelay = 16; // ~60fps max to prevent X-axis lag
        const resizeObserver = new ResizeObserver(() => {
          // Throttle layout updates to prevent performance issues during pan/zoom
          const now = Date.now();
          if (now - lastLayoutUpdate >= layoutThrottleDelay) {
            lastLayoutUpdate = now;
            fastUpdateLayoutManager();
          }
        });
        resizeObserver.observe(chartElement);
      }

      // Watch for pane size changes using periodic checks
      // This is necessary because LightweightCharts doesn't provide pane resize events
      let lastPaneSizes: Array<{ width: number; height: number }> = [];

      const checkPaneChanges = () => {
        try {
          const currentPaneSizes: Array<{ width: number; height: number }> = [];

          // Get current pane sizes
          for (let i = 0; i < 10; i++) {
            // Check up to 10 panes
            try {
              const paneSize = chart.paneSize(i);
              if (paneSize) {
                currentPaneSizes[i] = { width: paneSize.width, height: paneSize.height };
              }
            } catch {
              break; // No more panes
            }
          }

          // Compare with last known sizes
          let changed = currentPaneSizes.length !== lastPaneSizes.length;
          if (!changed) {
            for (let i = 0; i < currentPaneSizes.length; i++) {
              const current = currentPaneSizes[i];
              const last = lastPaneSizes[i];
              if (!last || current.width !== last.width || current.height !== last.height) {
                changed = true;
                break;
              }
            }
          }

          if (changed) {
            lastPaneSizes = currentPaneSizes;
            updateLayoutManager();
          }
        } catch {
          // Ignore errors in pane change detection
        }
      };

      // Check for pane changes every 250ms for responsive UI (reduced frequency to prevent X-axis lag)
      const paneCheckInterval = setInterval(checkPaneChanges, 250);

      // Clean up interval after a reasonable time
      setTimeout(() => {
        clearInterval(paneCheckInterval);
      }, 300000); // 5 minutes
    } catch {
      // Fallback to periodic checks if ResizeObserver not available
      const intervalId = setInterval(updateLayoutManager, 1000);

      // Clean up interval on chart destruction
      setTimeout(() => {
        clearInterval(intervalId);
      }, 60000); // Clean up after 1 minute as fallback
    }
  }

  // ============================================================================
  // Series Data Coordinate Conversion Methods
  // ============================================================================

  /**
   * Convert series data items to screen coordinates with unified validation
   *
   * This method provides DRY-compliant coordinate conversion for series plugins,
   * eliminating the need for duplicated conversion logic across different series.
   *
   * @param data - Data items to convert (from series pane view data)
   * @param scope - Bitmap coordinates rendering scope
   * @param priceConverter - Price to coordinate converter
   * @param config - Conversion configuration
   * @returns Array of converted coordinates
   */
  convertSeriesDataToScreenCoordinates(
    data: Array<{ x: number; originalData: Record<string, any> }>,
    scope: { horizontalPixelRatio: number; verticalPixelRatio: number },
    priceConverter: PriceToCoordinateConverter,
    config: SeriesDataConversionConfig
  ): SeriesDataConversionResult[] {
    if (!data) return [];

    const coordinates: SeriesDataConversionResult[] = [];
    const { valueKeys, validateNumbers = true, checkFinite = true, customValidator } = config;

    for (const item of data) {
      const originalData = item.originalData;

      // Apply custom validation if provided
      if (customValidator && !customValidator(originalData)) {
        continue;
      }

      // Validate numeric values if enabled
      if (validateNumbers) {
        const hasInvalidValues = valueKeys.some(key => {
          const value = originalData[key];
          return typeof value !== 'number' || isNaN(value) || (checkFinite && !isFinite(value));
        });

        if (hasInvalidValues) {
          continue;
        }
      }

      // Convert values to coordinates
      const convertedValues: Record<string, number | null> = {};
      let hasAnyInvalidConversion = false;

      for (const key of valueKeys) {
        const value = originalData[key];
        const y = priceConverter(value);

        // Check if conversion is valid
        if (y == null || isNaN(y) || (checkFinite && !isFinite(y))) {
          // Mark as having invalid conversion
          hasAnyInvalidConversion = true;
          convertedValues[key] = null;
        } else {
          convertedValues[key] = y * scope.verticalPixelRatio;
        }
      }

      // Add point to coordinates array
      // Include points with null values to maintain array indices
      // The rendering functions will handle gaps by detecting null values
      coordinates.push({
        x: hasAnyInvalidConversion ? null : item.x * scope.horizontalPixelRatio,
        ...convertedValues,
      });
    }

    return coordinates;
  }

  /**
   * Validate numeric data values for series
   *
   * @param data - Data object to validate
   * @param keys - Keys to validate
   * @param options - Validation options
   * @returns True if all values are valid
   */
  validateSeriesNumericData(
    data: Record<string, any>,
    keys: string[],
    options: {
      allowNull?: boolean;
      allowUndefined?: boolean;
      checkFinite?: boolean;
    } = {}
  ): boolean {
    const { allowNull = false, allowUndefined = false, checkFinite = true } = options;

    return keys.every(key => {
      const value = data[key];

      if (value === null && allowNull) return true;
      if (value === undefined && allowUndefined) return true;

      if (typeof value !== 'number') return false;
      if (isNaN(value)) return false;
      if (checkFinite && !isFinite(value)) return false;

      return true;
    });
  }

  /**
   * Convert price values to coordinates with error handling
   *
   * @param values - Price values to convert
   * @param priceConverter - Price to coordinate converter
   * @param pixelRatio - Vertical pixel ratio for scaling
   * @returns Converted coordinates or null if conversion fails
   */
  convertPricesToCoordinates(
    values: Record<string, number>,
    priceConverter: PriceToCoordinateConverter,
    pixelRatio: number
  ): Record<string, number> | null {
    const result: Record<string, number> = {};

    for (const [key, value] of Object.entries(values)) {
      const y = priceConverter(value);

      if (y == null || isNaN(y) || !isFinite(y)) {
        return null; // Return null if any conversion fails
      }

      result[key] = y * pixelRatio;
    }

    return result;
  }

  /**
   * Predefined configurations for common series types
   */
  static readonly SeriesDataConfigs = {
    /** Configuration for ribbon series (upper, lower) */
    ribbon: {
      valueKeys: ['upper', 'lower'],
      validateNumbers: true,
      checkFinite: true,
    } as SeriesDataConversionConfig,

    /** Configuration for band series (upper, middle, lower) */
    band: {
      valueKeys: ['upper', 'middle', 'lower'],
      validateNumbers: true,
      checkFinite: true,
    } as SeriesDataConversionConfig,

    /** Configuration for gradient ribbon series (upper, lower with fillColor) */
    gradientRibbon: {
      valueKeys: ['upper', 'lower'],
      validateNumbers: true,
      checkFinite: true,
      customValidator: (data: any) => {
        // Additional validation for gradient ribbon
        return data.fillColor !== undefined || data.upper !== undefined;
      },
    } as SeriesDataConversionConfig,

    /** Configuration for single value series */
    singleValue: {
      valueKeys: ['value'],
      validateNumbers: true,
      checkFinite: true,
    } as SeriesDataConversionConfig,
  };
}
