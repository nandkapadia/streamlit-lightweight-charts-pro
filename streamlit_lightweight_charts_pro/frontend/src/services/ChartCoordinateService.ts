/**
 * Centralized service for managing chart coordinate calculations
 * Provides consistent positioning across all chart features
 */

import {IChartApi} from 'lightweight-charts'
import {
  ChartCoordinates,
  PaneCoordinates,
  LegendCoordinates,
  ElementPosition,
  CoordinateOptions,
  CoordinateCacheEntry,
  BoundingBox,
  ScaleDimensions,
  ContainerDimensions
} from '../types/coordinates'
import {
  validateChartCoordinates,
  sanitizeCoordinates,
  createBoundingBox,
  areCoordinatesStale,
  logValidationResult
} from '../utils/coordinateValidation'
import {
  DIMENSIONS,
  // Removed unused imports
  TIMING,
  Z_INDEX,
  getFallback,
  getMargins
} from '../config/positioningConfig'

/**
 * Configuration for chart dimensions validation
 */
export interface ChartDimensionsOptions {
  minWidth?: number
  minHeight?: number
  maxAttempts?: number
  baseDelay?: number
}

/**
 * Configuration for pane dimensions options
 */
export interface PaneDimensionsOptions {
  includeMargins?: boolean
  includeScales?: boolean
  validateDimensions?: boolean
}

/**
 * Singleton service for chart coordinate management
 */
export class ChartCoordinateService {
  private static instance: ChartCoordinateService
  private coordinateCache = new Map<string, CoordinateCacheEntry>()
  private paneDimensionsCache = new Map<
    string,
    {
      dimensions: {[paneId: number]: {width: number; height: number}}
      expiresAt: number
    }
  >()
  private chartRegistry = new Map<string, IChartApi>()
  private updateCallbacks = new Map<string, Set<() => void>>()

  /**
   * Get singleton instance
   */
  static getInstance(): ChartCoordinateService {
    if (!this.instance) {
      this.instance = new ChartCoordinateService()
    }
    return this.instance
  }

  private constructor() {
    // Private constructor for singleton
    this.startCacheCleanup()
  }

  /**
   * Register a chart for coordinate tracking
   */
  registerChart(chartId: string, chart: IChartApi): void {
    this.chartRegistry.set(chartId, chart)
    this.invalidateCache(chartId)
  }

  /**
   * Unregister a chart
   */
  unregisterChart(chartId: string): void {
    this.chartRegistry.delete(chartId)
    this.coordinateCache.delete(chartId)
    this.updateCallbacks.delete(chartId)
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
      fallbackOnError = true
    } = options

    // Generate cache key
    const cacheKey = this.generateCacheKey(chart, container)

    // Check cache if enabled
    if (useCache) {
      const cached = this.coordinateCache.get(cacheKey)
      if (cached && !areCoordinatesStale(cached, TIMING.cacheExpiration)) {
        return cached
      }
    }

    try {
      // Calculate coordinates
      const coordinates = await this.calculateCoordinates(chart, container, includeMargins)

      // Validate if requested
      if (validateResult) {
        const validation = validateChartCoordinates(coordinates)
        logValidationResult(validation, 'ChartCoordinateService')

        if (!validation.isValid && fallbackOnError) {
          return sanitizeCoordinates(coordinates)
        }
      }

      // Cache the result
      const cacheEntry: CoordinateCacheEntry = {
        ...coordinates,
        cacheKey,
        expiresAt: Date.now() + TIMING.cacheExpiration
      }
      this.coordinateCache.set(cacheKey, cacheEntry)

      // Notify listeners
      this.notifyUpdateCallbacks(cacheKey)

      return coordinates
    } catch (error) {
      console.error('Error calculating coordinates:', error)

      if (fallbackOnError) {
        return sanitizeCoordinates({})
      }

      throw error
    }
  }

  /**
   * Get coordinates for a specific pane
   */
  getPaneCoordinates(chart: IChartApi, paneId: number): PaneCoordinates | null {
    try {
      // Validate inputs
      if (!chart || typeof paneId !== 'number' || paneId < 0) {
        console.warn(`[ChartCoordinateService] Invalid inputs: chart=${!!chart}, paneId=${paneId}`)
        return null
      }

      // Get pane size from chart with error handling
      let paneSize: any = null
      try {
        paneSize = chart.paneSize(paneId)
      } catch (error) {
        console.warn(`[ChartCoordinateService] Error getting pane size for pane ${paneId}:`, error)
        return null
      }

      if (!paneSize || typeof paneSize.height !== 'number' || typeof paneSize.width !== 'number') {
        console.warn(`[ChartCoordinateService] Invalid pane size for pane ${paneId}:`, paneSize)
        return null
      }

      // Calculate cumulative offset for this pane
      let offsetY = 0
      for (let i = 0; i < paneId; i++) {
        try {
          const size = chart.paneSize(i)
          if (size && typeof size.height === 'number') {
            offsetY += size.height
            console.log(
              `[ChartCoordinateService] Pane ${i} height: ${size.height}, cumulative offset: ${offsetY}`
            )
          }
        } catch (error) {
          console.warn(
            `[ChartCoordinateService] Error getting pane size for pane ${i} during offset calculation:`,
            error
          )
          // Continue with other panes even if one fails
        }
      }

      console.log(`[ChartCoordinateService] Final offsetY for pane ${paneId}: ${offsetY}`)

      // Get chart element for price scale width
      // Get chart element (used for price scale width calculation)
      const priceScaleWidth = this.getPriceScaleWidth(chart)
      const timeScaleHeight = this.getTimeScaleHeight(chart)

      // For legend positioning, we need coordinates relative to the chart element itself
      // The legend is appended to the chart element, so coordinates should be relative to it
      const legendOffsetX = 0 // Legend is positioned relative to chart element
      const legendOffsetY = offsetY // Y offset for multi-pane charts

      // Calculate bounds relative to chart element (for legend positioning)
      const bounds = createBoundingBox(
        legendOffsetX,
        legendOffsetY,
        paneSize.width || getFallback('paneWidth'),
        paneSize.height
      )

      console.log(`[ChartCoordinateService] Pane ${paneId} bounds:`, {
        top: bounds.top,
        left: bounds.left,
        width: bounds.width,
        height: bounds.height,
        offsetY,
        paneSize: paneSize
      })

      // Calculate content area (excluding scales) relative to chart element
      // This is where the actual chart content starts (after price scale)
      // The left Y-axis (price scale) takes up priceScaleWidth pixels from the left
      const contentArea = createBoundingBox(
        priceScaleWidth, // Start after the left Y-axis (price scale)
        legendOffsetY,
        bounds.width - priceScaleWidth, // Width is the remaining area after price scale
        paneSize.height - (paneId === 0 ? 0 : timeScaleHeight)
      )

      // Get margins
      const margins = getMargins('pane')

      // Debug logging for legend positioning
      if (paneId === 0) {
        // Main pane - coordinates calculated
      }

      return {
        id: paneId,
        index: paneId,
        isMainPane: paneId === 0,
        bounds,
        contentArea,
        margins
      }
    } catch (error) {
      console.error(`Error getting pane coordinates for pane ${paneId}:`, error)
      return null
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
    const {maxAttempts = 10, baseDelay = 100, ...paneOptions} = options

    // Method 1: Try chart API first
    let paneCoords = this.getPaneCoordinates(chart, paneId)
    if (paneCoords) {
      return paneCoords
    }

    // Method 2: Wait and retry with exponential backoff
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise(resolve => setTimeout(resolve, baseDelay * Math.pow(2, attempt)))

      paneCoords = this.getPaneCoordinates(chart, paneId)
      if (paneCoords) {
        return paneCoords
      }
    }

    // Method 3: DOM fallback
    return this.getPaneCoordinatesFromDOM(chart, container, paneId, paneOptions)
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
      const chartElement = chart.chartElement()
      if (!chartElement) {
        return null
      }

      const paneElements = chartElement.querySelectorAll('.tv-lightweight-charts-pane')
      if (paneElements.length <= paneId) {
        return null
      }

      const paneElement = paneElements[paneId] as HTMLElement
      const paneRect = paneElement.getBoundingClientRect()
      const chartRect = chartElement.getBoundingClientRect()

      // Calculate relative position within the chart container
      const offsetY = paneRect.top - chartRect.top
      const width = paneRect.width
      const height = paneRect.height

      // Validate dimensions if requested
      if (options.validateDimensions && (width < 10 || height < 10)) {
        return null
      }

      // For legend positioning, coordinates should be relative to the chart element
      // The legend is appended to the chart element, so we use 0 for x offset
      const legendOffsetX = 0
      const legendOffsetY = offsetY

      // Calculate bounds relative to chart element (for legend positioning)
      const bounds = createBoundingBox(legendOffsetX, legendOffsetY, width, height)

      // Calculate content area (excluding scales) relative to chart element
      const priceScaleWidth = this.getPriceScaleWidth(chart)
      const timeScaleHeight = this.getTimeScaleHeight(chart)
      // The left Y-axis (price scale) takes up priceScaleWidth pixels from the left
      const contentArea = createBoundingBox(
        priceScaleWidth, // Start after the left Y-axis (price scale)
        legendOffsetY,
        width - priceScaleWidth, // Width is the remaining area after price scale
        height - (paneId === 0 ? 0 : timeScaleHeight)
      )

      // Get margins
      const margins = getMargins('pane')

      return {
        id: paneId,
        index: paneId,
        isMainPane: paneId === 0,
        bounds,
        contentArea,
        margins
      }
    } catch (error) {
      console.error(`❌ Error getting pane ${paneId} coordinates from DOM:`, error)
      return null
    }
  }

  /**
   * Check if a point is within a pane
   */
  isPointInPane(point: {x: number; y: number}, paneCoords: PaneCoordinates): boolean {
    const {bounds} = paneCoords
    return (
      point.x >= bounds.left &&
      point.x <= bounds.right &&
      point.y >= bounds.top &&
      point.y <= bounds.bottom
    )
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
      const {container} = dimensions
      return container.width >= minWidth && container.height >= minHeight
    } catch (error) {
      return false
    }
  }

  /**
   * Check if chart dimensions object is valid
   */
  areChartDimensionsObjectValid(
    dimensions: {container: {width: number; height: number}},
    minWidth: number = 200,
    minHeight: number = 200
  ): boolean {
    try {
      const {container} = dimensions
      return container.width >= minWidth && container.height >= minHeight
    } catch (error) {
      return false
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
        validateResult: true
      })

      if (this.areChartDimensionsValid(coordinates, options.minWidth, options.minHeight)) {
        return coordinates
      } else {
        console.warn('⚠️ Chart dimensions below minimum threshold')
        return null
      }
    } catch (error) {
      console.error('❌ Failed to get validated chart coordinates:', error)
      return null
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
    container: {width: number; height: number}
    timeScale: {x: number; y: number; width: number; height: number}
    priceScale: {x: number; y: number; width: number; height: number}
  }> {
    const {minWidth = 200, minHeight = 200} = options

    // Method 1: Try chart API first
    try {
      const chartElement = chart.chartElement()
      if (chartElement) {
        const chartRect = chartElement.getBoundingClientRect()
        if (chartRect.width >= minWidth && chartRect.height >= minHeight) {
          return this.getChartDimensionsFromAPI(chart, {
            width: chartRect.width,
            height: chartRect.height
          })
        }
      }
    } catch (error) {
      // Chart API method failed, trying DOM fallback
    }

    // Method 2: DOM fallback
    try {
      const result = this.getChartDimensionsFromDOM(chart, container)
      if (result.container.width >= minWidth && result.container.height >= minHeight) {
        return result
      }
    } catch (error) {
      // DOM method failed, using defaults
    }

    // Method 3: Default values
    return this.getDefaultChartDimensions()
  }

  /**
   * Get chart dimensions using chart API (most accurate)
   */
  private getChartDimensionsFromAPI(
    chart: IChartApi,
    chartSize: {width: number; height: number}
  ): {
    container: {width: number; height: number}
    timeScale: {x: number; y: number; width: number; height: number}
    priceScale: {x: number; y: number; width: number; height: number}
  } {
    try {
      // Get time scale dimensions
      let timeScaleHeight = 35
      let timeScaleWidth = chartSize.width

      try {
        const timeScale = chart.timeScale()
        timeScaleHeight = timeScale.height() || 35
        timeScaleWidth = timeScale.width() || chartSize.width
      } catch (error) {
        // Time scale API failed, using defaults
      }

      // Get price scale width
      let priceScaleWidth = 70

      try {
        const priceScale = chart.priceScale('left')
        priceScaleWidth = priceScale.width() || 70
      } catch (error) {
        // Price scale API failed, using defaults
      }

      return {
        timeScale: {
          x: 0,
          y: chartSize.height - timeScaleHeight,
          height: timeScaleHeight,
          width: timeScaleWidth
        },
        priceScale: {
          x: 0,
          y: 0,
          height: chartSize.height - timeScaleHeight,
          width: priceScaleWidth
        },
        container: chartSize
      }
    } catch (error) {
      console.error('❌ Error getting chart dimensions from API:', error)
      throw error
    }
  }

  /**
   * Get chart dimensions using DOM measurements (fallback method)
   */
  private getChartDimensionsFromDOM(
    chart: IChartApi,
    container: HTMLElement
  ): {
    container: {width: number; height: number}
    timeScale: {x: number; y: number; width: number; height: number}
    priceScale: {x: number; y: number; width: number; height: number}
  } {
    try {
      // Get container dimensions with multiple fallback methods
      let width = 0
      let height = 0

      // Method 1: getBoundingClientRect
      try {
        const rect = container.getBoundingClientRect()
        width = rect.width
        height = rect.height
      } catch (error) {
        console.error('⚠️ getBoundingClientRect failed, trying offset dimensions')
      }

      // Method 2: offset dimensions
      if (!width || !height) {
        width = container.offsetWidth
        height = container.offsetHeight
      }

      // Method 3: client dimensions
      if (!width || !height) {
        width = container.clientWidth
        height = container.clientHeight
      }

      // Method 4: scroll dimensions
      if (!width || !height) {
        width = container.scrollWidth
        height = container.scrollHeight
      }

      // Ensure minimum dimensions
      width = Math.max(width || 800, 200)
      height = Math.max(height || 600, 200)

      // Get time scale dimensions
      let timeScaleHeight = 35
      let timeScaleWidth = width

      try {
        const timeScale = chart.timeScale()
        timeScaleHeight = timeScale.height() || 35
        timeScaleWidth = timeScale.width() || width
      } catch (error) {
        console.error('⚠️ Time scale height failed, using defaults')
      }

      // Get price scale width
      let priceScaleWidth = 70

      try {
        const priceScale = chart.priceScale('left')
        priceScaleWidth = priceScale.width() || 70
      } catch (error) {
        console.error('⚠️ Price scale width failed, using defaults')
      }

      return {
        timeScale: {
          x: 0,
          y: height - timeScaleHeight,
          height: timeScaleHeight,
          width: timeScaleWidth
        },
        priceScale: {
          x: 0,
          y: 0,
          height: height - timeScaleHeight,
          width: priceScaleWidth
        },
        container: {width, height}
      }
    } catch (error) {
      console.error('❌ Error getting chart dimensions from DOM:', error)
      throw error
    }
  }

  /**
   * Get default chart dimensions (last resort)
   */
  private getDefaultChartDimensions(): {
    container: {width: number; height: number}
    timeScale: {x: number; y: number; width: number; height: number}
    priceScale: {x: number; y: number; width: number; height: number}
  } {
    return {
      timeScale: {
        x: 0,
        y: 565, // 600 - 35
        height: 35,
        width: 800
      },
      priceScale: {
        x: 0,
        y: 0,
        height: 565, // 600 - 35
        width: 70
      },
      container: {
        width: 800,
        height: 600
      }
    }
  }

  /**
   * Get validated chart dimensions
   */
  async getValidatedChartDimensions(
    chart: IChartApi,
    container: HTMLElement,
    options: ChartDimensionsOptions = {}
  ): Promise<{
    container: {width: number; height: number}
    timeScale: {x: number; y: number; width: number; height: number}
    priceScale: {x: number; y: number; width: number; height: number}
  } | null> {
    try {
      const dimensions = await this.getChartDimensionsWithFallback(chart, container, options)

      if (this.areChartDimensionsObjectValid(dimensions, options.minWidth, options.minHeight)) {
        return dimensions
      } else {
        console.warn('⚠️ Chart dimensions below minimum threshold')
        return null
      }
    } catch (error) {
      console.error('❌ Failed to get validated chart dimensions:', error)
      return null
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
    const paneCoords = this.getPaneCoordinates(chart, paneId)
    if (!paneCoords) return null

    const margins = getMargins('legend')
    const legendDimensions = DIMENSIONS.legend

    let top = 0
    let left = 0
    let right: number | undefined
    let bottom: number | undefined

    // Calculate position based on alignment
    switch (position) {
      case 'top-left':
        top = paneCoords.contentArea.top + margins.top
        left = paneCoords.contentArea.left + margins.left
        break

      case 'top-right':
        top = paneCoords.contentArea.top + margins.top
        right = margins.right
        break

      case 'bottom-left':
        bottom = margins.bottom
        left = paneCoords.contentArea.left + margins.left
        break

      case 'bottom-right':
        bottom = margins.bottom
        right = margins.right
        break

      case 'center':
        top =
          paneCoords.contentArea.top +
          (paneCoords.contentArea.height - legendDimensions.defaultHeight) / 2
        left =
          paneCoords.contentArea.left +
          (paneCoords.contentArea.width - legendDimensions.defaultWidth) / 2
        break
    }

    // Convert bottom to top if needed
    if (bottom !== undefined && top === 0) {
      top = bottom
      bottom = undefined
    }

    return {
      top,
      left,
      right,
      bottom,
      width: legendDimensions.defaultWidth,
      height: legendDimensions.defaultHeight,
      zIndex: Z_INDEX.legend
    }
  }

  /**
   * Subscribe to coordinate updates
   */
  onCoordinateUpdate(chartId: string, callback: () => void): () => void {
    if (!this.updateCallbacks.has(chartId)) {
      this.updateCallbacks.set(chartId, new Set())
    }

    this.updateCallbacks.get(chartId)!.add(callback)

    // Return unsubscribe function
    return () => {
      const callbacks = this.updateCallbacks.get(chartId)
      if (callbacks) {
        callbacks.delete(callback)
      }
    }
  }

  /**
   * Invalidate cache for a specific chart
   */
  invalidateCache(chartId?: string): void {
    if (chartId) {
      // Remove specific chart entries
      const keysToDelete: string[] = []
      this.coordinateCache.forEach((entry, key) => {
        if (key.includes(chartId)) {
          keysToDelete.push(key)
        }
      })
      keysToDelete.forEach(key => this.coordinateCache.delete(key))
    } else {
      // Clear all cache
      this.coordinateCache.clear()
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
          const containerDimensions = this.getContainerDimensions(container)

          // Get scale dimensions
          const timeScale = this.getTimeScaleDimensions(chart, containerDimensions)
          const priceScaleLeft = this.getPriceScaleDimensions(chart, 'left', containerDimensions)
          const priceScaleRight = this.getPriceScaleDimensions(chart, 'right', containerDimensions)

          // Get all panes
          const panes = this.getAllPaneCoordinates(chart)

          // Calculate content area
          const contentArea = this.calculateContentArea(
            containerDimensions,
            timeScale,
            priceScaleLeft,
            includeMargins
          )

          const coordinates: ChartCoordinates = {
            container: containerDimensions,
            timeScale,
            priceScaleLeft,
            priceScaleRight,
            panes,
            contentArea,
            timestamp: Date.now(),
            isValid: true
          }

          resolve(coordinates)
        } catch (error) {
          console.error('Error in calculateCoordinates:', error)
          resolve(sanitizeCoordinates({}))
        }
      })
    })
  }

  /**
   * Get container dimensions
   */
  private getContainerDimensions(container: HTMLElement): ContainerDimensions {
    const rect = container.getBoundingClientRect()
    return {
      width: rect.width || container.offsetWidth || getFallback('containerWidth'),
      height: rect.height || container.offsetHeight || getFallback('containerHeight'),
      offsetTop: container.offsetTop || 0,
      offsetLeft: container.offsetLeft || 0
    }
  }

  /**
   * Get time scale dimensions
   */
  private getTimeScaleDimensions(
    chart: IChartApi,
    container: ContainerDimensions
  ): ScaleDimensions {
    try {
      const timeScale = chart.timeScale()
      const height = timeScale.height() || getFallback('timeScaleHeight')
      const width = timeScale.width() || container.width

      return {
        x: 0,
        y: container.height - height,
        width,
        height
      }
    } catch {
      return {
        x: 0,
        y: container.height - getFallback('timeScaleHeight'),
        width: container.width,
        height: getFallback('timeScaleHeight')
      }
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
      const priceScale = chart.priceScale(side)
      const width = priceScale.width() || (side === 'left' ? getFallback('priceScaleWidth') : 0)

      return {
        x: side === 'left' ? 0 : container.width - width,
        y: 0,
        width,
        height: container.height - getFallback('timeScaleHeight')
      }
    } catch {
      const defaultWidth = side === 'left' ? getFallback('priceScaleWidth') : 0
      return {
        x: side === 'left' ? 0 : container.width - defaultWidth,
        y: 0,
        width: defaultWidth,
        height: container.height - getFallback('timeScaleHeight')
      }
    }
  }

  /**
   * Get all pane coordinates
   */
  private getAllPaneCoordinates(chart: IChartApi): PaneCoordinates[] {
    const panes: PaneCoordinates[] = []
    let paneIndex = 0
    // Track total height for future use (currently disabled)

    // Try to get panes until we hit an invalid one
    while (paneIndex < 10) {
      // Safety limit
      try {
        const paneSize = chart.paneSize(paneIndex)
        if (!paneSize) break

        const paneCoords = this.getPaneCoordinates(chart, paneIndex)
        if (paneCoords) {
          panes.push(paneCoords)
        }

        // Track total height for future use
        paneIndex++
      } catch {
        break
      }
    }

    // Ensure we have at least one pane
    if (panes.length === 0) {
      panes.push({
        id: 0,
        index: 0,
        isMainPane: true,
        bounds: createBoundingBox(0, 0, getFallback('paneWidth'), getFallback('paneHeight')),
        contentArea: createBoundingBox(
          getFallback('priceScaleWidth'),
          0,
          getFallback('paneWidth') - getFallback('priceScaleWidth'),
          getFallback('paneHeight') - getFallback('timeScaleHeight')
        ),
        margins: getMargins('pane')
      })
    }

    return panes
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
    const margins = includeMargins ? getMargins('content') : {top: 0, right: 0, bottom: 0, left: 0}

    const x = priceScaleLeft.width + margins.left
    const y = margins.top
    const width = container.width - priceScaleLeft.width - margins.left - margins.right
    const height = container.height - timeScale.height - margins.top - margins.bottom

    return createBoundingBox(x, y, width, height)
  }

  /**
   * Get price scale width helper
   */
  private getPriceScaleWidth(chart: IChartApi, side: 'left' | 'right' = 'left'): number {
    try {
      const priceScale = chart.priceScale(side)
      const width = priceScale.width()

      // If width is 0 or undefined, the price scale is not visible
      if (!width || width === 0) {
        return 0
      }

      return width
    } catch {
      // If we can't access the price scale, assume it's not visible
      return 0
    }
  }

  /**
   * Get time scale height helper
   */
  private getTimeScaleHeight(chart: IChartApi): number {
    try {
      const timeScale = chart.timeScale()
      return timeScale.height() || getFallback('timeScaleHeight')
    } catch {
      return getFallback('timeScaleHeight')
    }
  }

  /**
   * Generate cache key
   */
  private generateCacheKey(chart: IChartApi, container: HTMLElement): string {
    const chartId = chart?.chartElement?.()?.id || 'unknown'
    const containerId = container?.id || 'unknown'
    return `${chartId}-${containerId}`
  }

  /**
   * Notify update callbacks
   */
  private notifyUpdateCallbacks(cacheKey: string): void {
    const chartId = cacheKey.split('-')[0]
    const callbacks = this.updateCallbacks.get(chartId)

    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback()
        } catch (error) {
          console.error('Error in coordinate update callback:', error)
        }
      })
    }
  }

  /**
   * Start cache cleanup timer
   */
  private startCacheCleanup(): void {
    setInterval(() => {
      const now = Date.now()
      const keysToDelete: string[] = []
      this.coordinateCache.forEach((entry, key) => {
        if (entry.expiresAt < now) {
          keysToDelete.push(key)
        }
      })
      keysToDelete.forEach(key => this.coordinateCache.delete(key))
    }, TIMING.cacheExpiration)
  }

  /**
   * Get current pane dimensions for comparison
   */
  getCurrentPaneDimensions(chart: IChartApi): {
    [paneId: number]: {width: number; height: number}
  } {
    const dimensions: {[paneId: number]: {width: number; height: number}} = {}
    let paneIndex = 0

    while (paneIndex < 10) {
      // Safety limit
      try {
        const paneSize = chart.paneSize(paneIndex)
        if (!paneSize) break

        dimensions[paneIndex] = {
          width: paneSize.width || 0,
          height: paneSize.height || 0
        }

        paneIndex++
      } catch {
        break
      }
    }

    return dimensions
  }

  /**
   * Check if pane dimensions have changed and notify listeners
   */
  checkPaneSizeChanges(chart: IChartApi, chartId: string): boolean {
    const currentDimensions = this.getCurrentPaneDimensions(chart)
    const cacheKey = this.generateCacheKey(chart, chart.chartElement())

    // Check if we have cached pane dimensions
    const cachedPaneDimensions = this.paneDimensionsCache.get(cacheKey)

    if (!cachedPaneDimensions) {
      // First time checking, store current dimensions
      this.paneDimensionsCache.set(cacheKey, {
        dimensions: currentDimensions,
        expiresAt: Date.now() + TIMING.cacheExpiration
      })
      return false
    }

    // Compare with cached dimensions
    const hasChanges = this.hasPaneSizeChanges(cachedPaneDimensions.dimensions, currentDimensions)

    if (hasChanges) {
      // Update cached dimensions
      cachedPaneDimensions.dimensions = currentDimensions
      cachedPaneDimensions.expiresAt = Date.now() + TIMING.cacheExpiration
      // Invalidate the coordinate cache to force recalculation
      this.invalidateCache(chartId)
      // Notify listeners about the change
      this.notifyUpdateCallbacks(cacheKey)
      return true
    }

    return false
  }

  /**
   * Enhanced pane size change detection with better performance
   */
  checkPaneSizeChangesOptimized(chart: IChartApi, chartId: string): boolean {
    const currentDimensions = this.getCurrentPaneDimensions(chart)
    const cacheKey = this.generateCacheKey(chart, chart.chartElement())

    // Check if we have cached pane dimensions
    const cachedPaneDimensions = this.paneDimensionsCache.get(cacheKey)

    if (!cachedPaneDimensions) {
      // First time checking, store current dimensions
      this.paneDimensionsCache.set(cacheKey, {
        dimensions: currentDimensions,
        expiresAt: Date.now() + TIMING.cacheExpiration
      })
      return false
    }

    // Check if dimensions have changed
    const hasChanges = this.hasPaneSizeChanges(cachedPaneDimensions.dimensions, currentDimensions)

    if (hasChanges) {
      // Update cached pane dimensions
      cachedPaneDimensions.dimensions = currentDimensions
      cachedPaneDimensions.expiresAt = Date.now() + TIMING.cacheExpiration

      // Invalidate coordinate cache for this chart
      this.invalidateCache(chartId)

      // Notify listeners
      this.notifyUpdateCallbacks(cacheKey)

      return true
    }

    return false
  }

  /**
   * Force refresh of coordinates for a specific chart
   * Useful when external changes affect chart layout
   */
  forceRefreshCoordinates(chartId: string): void {
    // Clear all cache entries for this chart
    const keysToDelete: string[] = []
    this.coordinateCache.forEach((entry, key) => {
      if (key.includes(chartId)) {
        keysToDelete.push(key)
      }
    })
    keysToDelete.forEach(key => this.coordinateCache.delete(key))

    // Also clear pane dimensions cache
    const paneKeysToDelete: string[] = []
    this.paneDimensionsCache.forEach((entry, key) => {
      if (key.includes(chartId)) {
        paneKeysToDelete.push(key)
      }
    })
    paneKeysToDelete.forEach(key => this.paneDimensionsCache.delete(key))

    // Notify all listeners for this chart
    this.updateCallbacks.forEach((callbacks, key) => {
      if (key.includes(chartId)) {
        callbacks.forEach(callback => {
          try {
            callback()
          } catch (error) {
            console.error('Error in coordinate refresh callback:', error)
          }
        })
      }
    })
  }

  /**
   * Check if pane dimensions have changed
   */
  private hasPaneSizeChanges(
    oldDimensions: {[paneId: number]: {width: number; height: number}},
    newDimensions: {[paneId: number]: {width: number; height: number}}
  ): boolean {
    const oldKeys = Object.keys(oldDimensions)
    const newKeys = Object.keys(newDimensions)

    if (oldKeys.length !== newKeys.length) {
      return true
    }

    for (const paneId of oldKeys) {
      const oldDim = oldDimensions[parseInt(paneId)]
      const newDim = newDimensions[parseInt(paneId)]

      if (!oldDim || !newDim) {
        return true
      }

      if (oldDim.width !== newDim.width || oldDim.height !== newDim.height) {
        return true
      }
    }

    return false
  }
}
