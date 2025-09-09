/**
 * Configuration constants for chart positioning system
 * Centralizes all positioning-related magic numbers and defaults
 */

/**
 * Standard margins used throughout the application
 */
export const MARGINS = {
  legend: {
    top: 20,
    right: 20,
    bottom: 20,
    left: 20
  },
  pane: {
    top: 10,
    right: 10,
    bottom: 10,
    left: 10
  },
  content: {
    top: 5,
    right: 5,
    bottom: 5,
    left: 5
  },
  tooltip: {
    top: 10,
    right: 10,
    bottom: 10,
    left: 10
  }
} as const

/**
 * Default dimensions for chart components
 */
export const DIMENSIONS = {
  timeAxis: {
    defaultHeight: 35,
    minHeight: 25,
    maxHeight: 50
  },
  priceScale: {
    defaultWidth: 70,
    minWidth: 50,
    maxWidth: 100,
    rightScaleDefaultWidth: 0
  },
  legend: {
    defaultHeight: 80,
    minHeight: 60,
    maxHeight: 120,
    defaultWidth: 200,
    minWidth: 150
  },
  pane: {
    defaultHeight: 200,
    minHeight: 100,
    maxHeight: 1000
  },
  chart: {
    defaultWidth: 800,
    defaultHeight: 600,
    minWidth: 300,
    minHeight: 200
  }
} as const

/**
 * Fallback values for error cases
 */
export const FALLBACKS = {
  paneHeight: 200,
  paneWidth: 800,
  chartWidth: 800,
  chartHeight: 600,
  timeScaleHeight: 35,
  priceScaleWidth: 70,
  containerWidth: 800,
  containerHeight: 600
} as const

/**
 * Z-index values for layering
 */
export const Z_INDEX = {
  background: 0,
  chart: 1,
  pane: 10,
  series: 20,
  overlay: 30,
  legend: 40,
  tooltip: 50,
  modal: 100
} as const

/**
 * Animation and timing configurations
 */
export const TIMING = {
  cacheExpiration: 5000, // 5 seconds
  debounceDelay: 100, // 100ms
  throttleDelay: 50, // 50ms
  animationDuration: 200 // 200ms
} as const

/**
 * Positioning calculation modes
 */
export enum PositioningMode {
  ABSOLUTE = 'absolute',
  RELATIVE = 'relative',
  FIXED = 'fixed',
  STICKY = 'sticky'
}

/**
 * Coordinate system origins
 */
export enum CoordinateOrigin {
  TOP_LEFT = 'top-left',
  TOP_RIGHT = 'top-right',
  BOTTOM_LEFT = 'bottom-left',
  BOTTOM_RIGHT = 'bottom-right',
  CENTER = 'center'
}

/**
 * Get margin configuration by feature type
 */
export function getMargins(feature: keyof typeof MARGINS): (typeof MARGINS)[keyof typeof MARGINS] {
  return MARGINS[feature] || MARGINS.content
}

/**
 * Get dimension configuration by component type
 */
export function getDimensions(
  component: keyof typeof DIMENSIONS
): (typeof DIMENSIONS)[keyof typeof DIMENSIONS] {
  return DIMENSIONS[component] || DIMENSIONS.chart
}

/**
 * Get fallback value by type
 */
export function getFallback(type: keyof typeof FALLBACKS): number {
  return FALLBACKS[type] || 0
}

/**
 * Configuration validation
 */
export function validateConfiguration(): boolean {
  // Ensure all dimensions are positive
  for (const [key, value] of Object.entries(DIMENSIONS)) {
    for (const [prop, val] of Object.entries(value)) {
      if (typeof val === 'number' && val < 0) {
        console.error(`Invalid dimension: ${key}.${prop} = ${val}`)
        return false
      }
    }
  }

  // Ensure min values are less than max values
  if (DIMENSIONS.timeAxis.minHeight > DIMENSIONS.timeAxis.maxHeight) {
    console.error('Invalid time axis height range')
    return false
  }

  if (DIMENSIONS.priceScale.minWidth > DIMENSIONS.priceScale.maxWidth) {
    console.error('Invalid price scale width range')
    return false
  }

  return true
}

// Validate configuration on load
if (process.env.NODE_ENV === 'development') {
  validateConfiguration()
}
