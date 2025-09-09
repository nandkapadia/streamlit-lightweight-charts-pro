/**
 * Unified positioning engine for all chart features
 * Provides consistent positioning calculations across the application
 */

import {IChartApi, ISeriesApi, Time} from 'lightweight-charts'
import {LegendCoordinates, ElementPosition, BoundingBox, Margins} from '../types/coordinates'
import {ChartCoordinateService} from './ChartCoordinateService'
import {DIMENSIONS, Z_INDEX, getMargins} from '../config/positioningConfig'
import {createBoundingBox} from '../utils/coordinateValidation'

/**
 * Configuration for positioning calculations
 */
export interface PositioningConfig {
  margins?: Partial<Margins>
  dimensions?: {width?: number; height?: number}
  zIndex?: number
  alignment?: 'start' | 'center' | 'end'
  offset?: {x?: number; y?: number}
}

/**
 * Tooltip positioning configuration
 */
export interface TooltipPosition {
  x: number
  y: number
  anchor: 'top' | 'bottom' | 'left' | 'right'
  offset: {x: number; y: number}
}

/**
 * Unified positioning engine
 */
export class PositioningEngine {
  private static coordinateService = ChartCoordinateService.getInstance()

  /**
   * Calculate legend position with consistent logic
   */
  static calculateLegendPosition(
    chart: IChartApi,
    paneId: number,
    position: ElementPosition,
    config?: PositioningConfig
  ): LegendCoordinates | null {
    // Delegate to ChartCoordinateService for pane coordinates
    const paneCoords = this.coordinateService.getPaneCoordinates(chart, paneId)
    if (!paneCoords) return null

    // Merge configuration with defaults
    const margins = {...getMargins('legend'), ...(config?.margins || {})}

    // For initial positioning, use default dimensions
    // The actual dimensions will be calculated when the element is rendered
    const dimensions = {
      width: config?.dimensions?.width || DIMENSIONS.legend.defaultWidth,
      height: config?.dimensions?.height || DIMENSIONS.legend.defaultHeight
    }

    const zIndex = config?.zIndex || Z_INDEX.legend
    const offset = config?.offset || {x: 0, y: 0}

    // Calculate position based on alignment
    // Use full pane bounds for legends to avoid time axis clipping
    const coords = this.calculateElementPosition(
      paneCoords.bounds,
      dimensions,
      position,
      margins,
      offset
    )

    return {
      ...coords,
      width: dimensions.width,
      height: dimensions.height,
      zIndex
    }
  }

  /**
   * Recalculate legend position with actual element dimensions
   */
  static recalculateLegendPosition(
    chart: IChartApi,
    paneId: number,
    position: ElementPosition,
    legendElement: HTMLElement,
    config?: PositioningConfig
  ): LegendCoordinates | null {
    // Delegate to ChartCoordinateService for pane coordinates
    const paneCoords = this.coordinateService.getPaneCoordinates(chart, paneId)
    if (!paneCoords) return null

    // Get actual element dimensions with fallbacks
    let actualDimensions = {
      width: legendElement.offsetWidth || legendElement.scrollWidth || 0,
      height: legendElement.offsetHeight || legendElement.scrollHeight || 0
    }

    // If dimensions are still 0, try to get them from computed styles
    if (actualDimensions.width === 0 || actualDimensions.height === 0) {
      const computedStyle = window.getComputedStyle(legendElement)
      actualDimensions = {
        width:
          parseInt(computedStyle.width) ||
          legendElement.clientWidth ||
          DIMENSIONS.legend.defaultWidth,
        height:
          parseInt(computedStyle.height) ||
          legendElement.clientHeight ||
          DIMENSIONS.legend.defaultHeight
      }
    }

    // Ensure minimum dimensions
    actualDimensions.width = Math.max(actualDimensions.width, DIMENSIONS.legend.minWidth)
    actualDimensions.height = Math.max(actualDimensions.height, DIMENSIONS.legend.minHeight)

    // Merge configuration with defaults
    const margins = {...getMargins('legend'), ...(config?.margins || {})}
    const zIndex = config?.zIndex || Z_INDEX.legend
    const offset = config?.offset || {x: 0, y: 0}

    // Calculate position based on actual dimensions
    // Use full pane bounds for legends to avoid time axis clipping
    const coords = this.calculateElementPosition(
      paneCoords.bounds,
      actualDimensions,
      position,
      margins,
      offset
    )

    return {
      ...coords,
      width: actualDimensions.width,
      height: actualDimensions.height,
      zIndex
    }
  }

  /**
   * Calculate tooltip position relative to cursor
   */
  static calculateTooltipPosition(
    cursorX: number,
    cursorY: number,
    tooltipWidth: number,
    tooltipHeight: number,
    containerBounds: BoundingBox,
    preferredAnchor: 'top' | 'bottom' | 'left' | 'right' = 'top'
  ): TooltipPosition {
    const margins = getMargins('tooltip')
    const offset = {x: 10, y: 10}

    let x = cursorX
    let y = cursorY
    let anchor = preferredAnchor

    // Calculate position based on preferred anchor
    switch (preferredAnchor) {
      case 'top':
        x = cursorX - tooltipWidth / 2
        y = cursorY - tooltipHeight - offset.y
        break
      case 'bottom':
        x = cursorX - tooltipWidth / 2
        y = cursorY + offset.y
        break
      case 'left':
        x = cursorX - tooltipWidth - offset.x
        y = cursorY - tooltipHeight / 2
        break
      case 'right':
        x = cursorX + offset.x
        y = cursorY - tooltipHeight / 2
        break
    }

    // Adjust if tooltip goes outside container bounds
    if (x < containerBounds.left + margins.left) {
      x = containerBounds.left + margins.left
      if (anchor === 'left') anchor = 'right'
    }
    if (x + tooltipWidth > containerBounds.right - margins.right) {
      x = containerBounds.right - tooltipWidth - margins.right
      if (anchor === 'right') anchor = 'left'
    }
    if (y < containerBounds.top + margins.top) {
      y = containerBounds.top + margins.top
      if (anchor === 'top') anchor = 'bottom'
    }
    if (y + tooltipHeight > containerBounds.bottom - margins.bottom) {
      y = containerBounds.bottom - tooltipHeight - margins.bottom
      if (anchor === 'bottom') anchor = 'top'
    }

    return {x, y, anchor, offset}
  }

  /**
   * Calculate overlay position (for rectangles, annotations, etc.)
   * Note: This requires a series to convert prices to coordinates
   */
  static calculateOverlayPosition(
    startTime: Time,
    endTime: Time,
    startPrice: number,
    endPrice: number,
    chart: IChartApi,
    series?: ISeriesApi<any>,
    paneId: number = 0
  ): BoundingBox | null {
    try {
      const timeScale = chart.timeScale()

      // Convert time to x coordinates
      const x1 = timeScale.timeToCoordinate(startTime)
      const x2 = timeScale.timeToCoordinate(endTime)

      // Convert price to y coordinates (requires series)
      let y1: number | null = null
      let y2: number | null = null

      if (series) {
        y1 = series.priceToCoordinate(startPrice)
        y2 = series.priceToCoordinate(endPrice)
      } else {
        // Fallback: estimate based on chart height
        const chartElement = chart.chartElement()
        if (chartElement) {
          const height = chartElement.clientHeight
          // Simple linear mapping (this is a rough approximation)
          y1 = height * 0.3 // Default positions
          y2 = height * 0.7
        }
      }

      if (x1 === null || x2 === null || y1 === null || y2 === null) {
        return null
      }

      // Calculate bounding box
      const x = Math.min(x1, x2)
      const y = Math.min(y1, y2)
      const width = Math.abs(x2 - x1)
      const height = Math.abs(y2 - y1)

      return createBoundingBox(x, y, width, height)
    } catch (error) {
      console.error('Error calculating overlay position:', error)
      return null
    }
  }

  /**
   * Calculate multi-pane layout positions
   */
  static calculateMultiPaneLayout(
    totalHeight: number,
    paneHeights: number[] | 'equal' | {[key: number]: number}
  ): {[paneId: number]: BoundingBox} {
    const layout: {[paneId: number]: BoundingBox} = {}

    if (paneHeights === 'equal') {
      // Equal height distribution
      const paneCount = Object.keys(layout).length || 1
      const heightPerPane = totalHeight / paneCount

      for (let i = 0; i < paneCount; i++) {
        layout[i] = createBoundingBox(
          0,
          i * heightPerPane,
          0, // Width will be set by chart
          heightPerPane
        )
      }
    } else if (Array.isArray(paneHeights)) {
      // Specific heights for each pane
      let currentY = 0
      paneHeights.forEach((height, index) => {
        layout[index] = createBoundingBox(
          0,
          currentY,
          0, // Width will be set by chart
          height
        )
        currentY += height
      })
    } else {
      // Object with pane ID to height mapping
      let currentY = 0
      for (const [paneId, height] of Object.entries(paneHeights)) {
        layout[Number(paneId)] = createBoundingBox(
          0,
          currentY,
          0, // Width will be set by chart
          height
        )
        currentY += height
      }
    }

    return layout
  }

  /**
   * Calculate crosshair label position
   */
  static calculateCrosshairLabelPosition(
    crosshairX: number,
    crosshairY: number,
    labelWidth: number,
    labelHeight: number,
    containerBounds: BoundingBox,
    axis: 'x' | 'y'
  ): {x: number; y: number} {
    const margins = getMargins('content')

    if (axis === 'x') {
      // Time axis label
      return {
        x: Math.max(
          containerBounds.left + margins.left,
          Math.min(crosshairX - labelWidth / 2, containerBounds.right - labelWidth - margins.right)
        ),
        y: containerBounds.bottom - labelHeight - margins.bottom
      }
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
        )
      }
    }
  }

  /**
   * Calculate element position within bounds
   */
  private static calculateElementPosition(
    bounds: BoundingBox,
    dimensions: {width: number; height: number},
    position: ElementPosition,
    margins: Margins,
    offset: {x?: number; y?: number}
  ): {top: number; left: number; right?: number; bottom?: number} {
    const offsetX = offset.x || 0
    const offsetY = offset.y || 0

    switch (position) {
      case 'top-left':
        return {
          top: bounds.top + margins.top + offsetY,
          left: bounds.left + margins.left + offsetX
        }

      case 'top-right':
        return {
          top: bounds.top + margins.top + offsetY,
          left: bounds.right - dimensions.width - margins.right - offsetX,
          right: margins.right + offsetX
        }

      case 'bottom-left':
        return {
          top: bounds.bottom - dimensions.height - margins.bottom - offsetY,
          left: bounds.left + margins.left + offsetX,
          bottom: margins.bottom + offsetY
        }

      case 'bottom-right':
        return {
          top: bounds.bottom - dimensions.height - margins.bottom - offsetY,
          left: bounds.right - dimensions.width - margins.right - offsetX,
          right: margins.right + offsetX,
          bottom: margins.bottom + offsetY
        }

      case 'center':
        return {
          top: bounds.top + (bounds.height - dimensions.height) / 2 + offsetY,
          left: bounds.left + (bounds.width - dimensions.width) / 2 + offsetX
        }

      default:
        return {
          top: bounds.top + margins.top + offsetY,
          left: bounds.left + margins.left + offsetX
        }
    }
  }

  /**
   * Validate positioning constraints
   */
  static validatePositioning(
    element: BoundingBox,
    container: BoundingBox
  ): {isValid: boolean; adjustments: {x?: number; y?: number}} {
    const adjustments: {x?: number; y?: number} = {}
    let isValid = true

    // Check if element fits within container
    if (element.left < container.left) {
      adjustments.x = container.left - element.left
      isValid = false
    } else if (element.right > container.right) {
      adjustments.x = container.right - element.right
      isValid = false
    }

    if (element.top < container.top) {
      adjustments.y = container.top - element.top
      isValid = false
    } else if (element.bottom > container.bottom) {
      adjustments.y = container.bottom - element.bottom
      isValid = false
    }

    return {isValid, adjustments}
  }

  /**
   * Apply positioning to DOM element
   */
  static applyPositionToElement(
    element: HTMLElement,
    coordinates: LegendCoordinates | {top: number; left: number; right?: number; bottom?: number}
  ): void {
    // Reset all position properties
    element.style.top = 'auto'
    element.style.left = 'auto'
    element.style.right = 'auto'
    element.style.bottom = 'auto'

    // Apply new position
    if (coordinates.top !== undefined) {
      element.style.top = `${coordinates.top}px`
    }
    if (coordinates.left !== undefined) {
      element.style.left = `${coordinates.left}px`
    }
    if (coordinates.right !== undefined) {
      element.style.right = `${coordinates.right}px`
    }
    if (coordinates.bottom !== undefined) {
      element.style.bottom = `${coordinates.bottom}px`
    }

    // Apply z-index if available
    if ('zIndex' in coordinates && coordinates.zIndex !== undefined) {
      element.style.zIndex = String(coordinates.zIndex)
    }

    // Ensure position is absolute
    if (!element.style.position || element.style.position === 'static') {
      element.style.position = 'absolute'
    }
  }

  /**
   * Calculate responsive scaling factor
   */
  static calculateScalingFactor(
    currentWidth: number,
    currentHeight: number,
    baseWidth: number = DIMENSIONS.chart.defaultWidth,
    baseHeight: number = DIMENSIONS.chart.defaultHeight
  ): {x: number; y: number; uniform: number} {
    const scaleX = currentWidth / baseWidth
    const scaleY = currentHeight / baseHeight
    const uniform = Math.min(scaleX, scaleY)

    return {x: scaleX, y: scaleY, uniform}
  }
}
