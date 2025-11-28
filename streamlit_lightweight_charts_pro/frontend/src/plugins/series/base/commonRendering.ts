/**
 * @fileoverview Common rendering utilities for custom series
 *
 * Re-exports shared utilities from lightweight-charts-pro-core.
 * This provides a single source of truth for rendering utilities
 * across all custom series implementations and primitives.
 *
 * @see lightweight-charts-pro-core for core rendering utilities
 */

// Re-export all shared rendering utilities from core package
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
} from 'lightweight-charts-pro-core';
