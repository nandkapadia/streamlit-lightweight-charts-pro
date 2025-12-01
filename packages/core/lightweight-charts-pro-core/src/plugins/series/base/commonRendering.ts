/**
 * @fileoverview Common rendering utilities for custom series
 *
 * Re-exports shared utilities from the rendering module.
 * This provides a single source of truth for rendering utilities
 * across all custom series implementations and primitives.
 *
 * @see ../../shared/rendering for core rendering utilities
 */

// Re-export all shared rendering utilities from the shared rendering module
export {
  // Types
  type CoordinatePoint,
  type MultiCoordinatePoint,
  type RendererDataPoint,
  type RenderPoint,
  type ColoredRenderPoint,
  type VisibleRange,

  // Coordinate functions
  timeToCoordinate,
  priceToCoordinate,
  isValidCoordinate,
  isValidRenderPoint,
  filterValidRenderPoints,
  convertToCoordinates,
  getBarSpacing,

  // Line drawing
  drawLine,
  drawMultiLine,

  // Fill area
  drawFillArea,
  createFillPath,

  // Gradients
  createHorizontalGradient,

  // Line style
  LineStyle,
  type LineStyleConfig,
  applyLineDashPattern,
  applyLineStyle,

  // Canvas state
  withSavedState,

  // Rectangle drawing
  type RectangleConfig,
  drawRectangle,
  fillVerticalBand,

  // Whitespace detection
  isWhitespaceDataMultiField,
} from '../../shared/rendering';
