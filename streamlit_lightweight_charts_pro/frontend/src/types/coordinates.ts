/**
 * Coordinate system types for robust chart positioning
 * Provides standardized interfaces for all positioning calculations
 */

/**
 * Represents a bounding box with position and dimensions
 */
export interface BoundingBox {
  x: number
  y: number
  width: number
  height: number
  top: number
  left: number
  right: number
  bottom: number
}

/**
 * Represents margins for spacing calculations
 */
export interface Margins {
  top: number
  right: number
  bottom: number
  left: number
}

/**
 * Container dimensions for the chart
 */
export interface ContainerDimensions {
  width: number
  height: number
  offsetTop: number
  offsetLeft: number
}

/**
 * Scale dimensions (for time scale or price scale)
 */
export interface ScaleDimensions {
  x: number
  y: number
  width: number
  height: number
}

/**
 * Content area dimensions (excluding scales and margins)
 */
export interface ContentAreaDimensions {
  x: number
  y: number
  width: number
  height: number
}

/**
 * Pane-specific coordinates
 */
export interface PaneCoordinates {
  id: number
  bounds: BoundingBox
  contentArea: BoundingBox
  margins: Margins
  index: number
  isMainPane: boolean
}

/**
 * Legend positioning coordinates
 */
export interface LegendCoordinates {
  top: number
  left: number
  right?: number
  bottom?: number
  width?: number
  height?: number
  zIndex: number
}

/**
 * Complete chart coordinate information
 */
export interface ChartCoordinates {
  container: ContainerDimensions
  timeScale: ScaleDimensions
  priceScaleLeft: ScaleDimensions
  priceScaleRight: ScaleDimensions
  panes: PaneCoordinates[]
  contentArea: ContentAreaDimensions
  timestamp: number
  isValid: boolean
}

/**
 * Validation result for coordinate calculations
 */
export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Position types for elements
 */
export type ElementPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center'

/**
 * Coordinate calculation options
 */
export interface CoordinateOptions {
  includeMargins?: boolean
  useCache?: boolean
  validateResult?: boolean
  fallbackOnError?: boolean
}

/**
 * Cache entry for coordinate data
 */
export interface CoordinateCacheEntry extends ChartCoordinates {
  cacheKey: string
  expiresAt: number
}
