/**
 * Validation utilities for coordinate calculations
 * Ensures coordinate data integrity and provides helpful debugging
 */

import {
  ChartCoordinates,
  PaneCoordinates,
  ValidationResult,
  BoundingBox,
  ScaleDimensions
  // ContainerDimensions is used in type imports
} from '../types/coordinates'
import {DIMENSIONS, FALLBACKS} from '../config/positioningConfig'

/**
 * Validates complete chart coordinates
 */
export function validateChartCoordinates(coordinates: ChartCoordinates): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Validate container dimensions
  if (!coordinates.container) {
    errors.push('Missing container dimensions')
  } else {
    if (coordinates.container.width <= 0) {
      errors.push(`Invalid container width: ${coordinates.container.width}`)
    }
    if (coordinates.container.height <= 0) {
      errors.push(`Invalid container height: ${coordinates.container.height}`)
    }
    if (coordinates.container.width < DIMENSIONS.chart.minWidth) {
      warnings.push(
        `Container width (${coordinates.container.width}) is below recommended minimum (${DIMENSIONS.chart.minWidth})`
      )
    }
    if (coordinates.container.height < DIMENSIONS.chart.minHeight) {
      warnings.push(
        `Container height (${coordinates.container.height}) is below recommended minimum (${DIMENSIONS.chart.minHeight})`
      )
    }
  }

  // Validate time scale
  if (!coordinates.timeScale) {
    errors.push('Missing time scale dimensions')
  } else {
    const timeScaleErrors = validateScaleDimensions(coordinates.timeScale, 'timeScale')
    errors.push(...timeScaleErrors.errors)
    warnings.push(...timeScaleErrors.warnings)

    if (coordinates.timeScale.height < DIMENSIONS.timeAxis.minHeight) {
      warnings.push(
        `Time scale height (${coordinates.timeScale.height}) is below minimum (${DIMENSIONS.timeAxis.minHeight})`
      )
    }
    if (coordinates.timeScale.height > DIMENSIONS.timeAxis.maxHeight) {
      warnings.push(
        `Time scale height (${coordinates.timeScale.height}) exceeds maximum (${DIMENSIONS.timeAxis.maxHeight})`
      )
    }
  }

  // Validate price scales
  if (!coordinates.priceScaleLeft) {
    warnings.push('Missing left price scale dimensions')
  } else {
    const priceScaleErrors = validateScaleDimensions(coordinates.priceScaleLeft, 'priceScaleLeft')
    errors.push(...priceScaleErrors.errors)
    warnings.push(...priceScaleErrors.warnings)
  }

  if (coordinates.priceScaleRight) {
    const priceScaleErrors = validateScaleDimensions(coordinates.priceScaleRight, 'priceScaleRight')
    errors.push(...priceScaleErrors.errors)
    warnings.push(...priceScaleErrors.warnings)
  }

  // Validate panes
  if (!coordinates.panes || coordinates.panes.length === 0) {
    errors.push('No panes defined')
  } else {
    coordinates.panes.forEach((pane, index) => {
      const paneErrors = validatePaneCoordinates(pane)
      errors.push(...paneErrors.errors.map(e => `Pane ${index}: ${e}`))
      warnings.push(...paneErrors.warnings.map(w => `Pane ${index}: ${w}`))
    })
  }

  // Validate content area
  if (!coordinates.contentArea) {
    errors.push('Missing content area dimensions')
  } else {
    const contentErrors = validateBoundingBox(coordinates.contentArea, 'contentArea')
    errors.push(...contentErrors.errors)
    warnings.push(...contentErrors.warnings)
  }

  // Check timestamp
  if (!coordinates.timestamp || coordinates.timestamp <= 0) {
    warnings.push('Invalid or missing timestamp')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Validates scale dimensions
 */
export function validateScaleDimensions(scale: ScaleDimensions, name: string): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (scale.width < 0 || scale.height < 0) {
    errors.push(`${name} has negative dimensions`)
  }

  if (scale.x < 0 || scale.y < 0) {
    warnings.push(`${name} has negative position`)
  }

  return {isValid: errors.length === 0, errors, warnings}
}

/**
 * Validates pane coordinates
 */
export function validatePaneCoordinates(pane: PaneCoordinates): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (pane.id < 0) {
    errors.push('Invalid pane ID')
  }

  if (!pane.bounds) {
    errors.push('Missing pane bounds')
  } else {
    const boundsErrors = validateBoundingBox(pane.bounds, 'bounds')
    errors.push(...boundsErrors.errors)
    warnings.push(...boundsErrors.warnings)
  }

  if (!pane.contentArea) {
    errors.push('Missing pane content area')
  } else {
    const contentErrors = validateBoundingBox(pane.contentArea, 'contentArea')
    errors.push(...contentErrors.errors)
    warnings.push(...contentErrors.warnings)
  }

  if (pane.bounds && pane.contentArea) {
    if (pane.contentArea.width > pane.bounds.width) {
      errors.push('Content area width exceeds pane bounds')
    }
    if (pane.contentArea.height > pane.bounds.height) {
      errors.push('Content area height exceeds pane bounds')
    }
  }

  return {isValid: errors.length === 0, errors, warnings}
}

/**
 * Validates a bounding box
 */
export function validateBoundingBox(box: Partial<BoundingBox>, name: string): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (box.width !== undefined && box.width <= 0) {
    errors.push(`${name} has invalid width: ${box.width}`)
  }

  if (box.height !== undefined && box.height <= 0) {
    errors.push(`${name} has invalid height: ${box.height}`)
  }

  if (box.x !== undefined && box.x < 0) {
    warnings.push(`${name} has negative x position: ${box.x}`)
  }

  if (box.y !== undefined && box.y < 0) {
    warnings.push(`${name} has negative y position: ${box.y}`)
  }

  // Check consistency between position and bounds
  if (box.x !== undefined && box.width !== undefined) {
    if (box.right !== undefined && Math.abs(box.x + box.width - box.right) > 1) {
      warnings.push(`${name} has inconsistent right bound`)
    }
  }

  if (box.y !== undefined && box.height !== undefined) {
    if (box.bottom !== undefined && Math.abs(box.y + box.height - box.bottom) > 1) {
      warnings.push(`${name} has inconsistent bottom bound`)
    }
  }

  return {isValid: errors.length === 0, errors, warnings}
}

/**
 * Sanitizes coordinates by applying fallbacks for invalid values
 */
export function sanitizeCoordinates(coordinates: Partial<ChartCoordinates>): ChartCoordinates {
  const now = Date.now()

  return {
    container: coordinates.container || {
      width: FALLBACKS.containerWidth,
      height: FALLBACKS.containerHeight,
      offsetTop: 0,
      offsetLeft: 0
    },
    timeScale: coordinates.timeScale || {
      x: 0,
      y: FALLBACKS.containerHeight - FALLBACKS.timeScaleHeight,
      width: FALLBACKS.containerWidth,
      height: FALLBACKS.timeScaleHeight
    },
    priceScaleLeft: coordinates.priceScaleLeft || {
      x: 0,
      y: 0,
      width: FALLBACKS.priceScaleWidth,
      height: FALLBACKS.containerHeight - FALLBACKS.timeScaleHeight
    },
    priceScaleRight: coordinates.priceScaleRight || {
      x: FALLBACKS.containerWidth - DIMENSIONS.priceScale.rightScaleDefaultWidth,
      y: 0,
      width: DIMENSIONS.priceScale.rightScaleDefaultWidth,
      height: FALLBACKS.containerHeight - FALLBACKS.timeScaleHeight
    },
    panes: coordinates.panes || [
      {
        id: 0,
        index: 0,
        isMainPane: true,
        bounds: createBoundingBox(0, 0, FALLBACKS.paneWidth, FALLBACKS.paneHeight),
        contentArea: createBoundingBox(
          FALLBACKS.priceScaleWidth,
          0,
          FALLBACKS.paneWidth - FALLBACKS.priceScaleWidth,
          FALLBACKS.paneHeight - FALLBACKS.timeScaleHeight
        ),
        margins: {top: 10, right: 10, bottom: 10, left: 10}
      }
    ],
    contentArea: coordinates.contentArea || {
      x: FALLBACKS.priceScaleWidth,
      y: 0,
      width: FALLBACKS.containerWidth - FALLBACKS.priceScaleWidth,
      height: FALLBACKS.containerHeight - FALLBACKS.timeScaleHeight
    },
    timestamp: coordinates.timestamp || now,
    isValid: false // Mark as invalid since we had to apply fallbacks
  }
}

/**
 * Creates a properly formed bounding box
 */
export function createBoundingBox(
  x: number,
  y: number,
  width: number,
  height: number
): BoundingBox {
  return {
    x,
    y,
    width,
    height,
    top: y,
    left: x,
    right: x + width,
    bottom: y + height
  }
}

/**
 * Checks if coordinates are stale based on timestamp
 */
export function areCoordinatesStale(coordinates: ChartCoordinates, maxAge: number = 5000): boolean {
  const now = Date.now()
  return now - coordinates.timestamp > maxAge
}

/**
 * Debug helper to log coordinate validation results
 */
export function logValidationResult(result: ValidationResult, context: string = ''): void {
  if (process.env.NODE_ENV !== 'development') return

  const prefix = context ? `[${context}] ` : ''

  if (!result.isValid) {
    console.error(`${prefix}Coordinate validation failed:`)
    result.errors.forEach(error => console.error(`  ❌ ${error}`))
  }

  if (result.warnings.length > 0) {
    console.warn(`${prefix}Coordinate validation warnings:`)
    result.warnings.forEach(warning => console.warn(`  ⚠️ ${warning}`))
  }
}
