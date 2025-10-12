/**
 * @fileoverview Coordinate System Types
 *
 * Type definitions for robust chart positioning and coordinate calculations.
 * Provides standardized interfaces for all positioning operations.
 *
 * This module provides:
 * - Bounding box and dimension interfaces
 * - Pane-specific coordinate types
 * - Legend positioning interfaces
 * - Validation and caching types
 *
 * Features:
 * - Comprehensive coordinate system
 * - Multi-pane support
 * - Scale-aware positioning
 * - Cache-friendly types
 *
 * @example
 * ```typescript
 * import { ChartCoordinates, PaneCoordinates } from './coordinates';
 *
 * const coords: ChartCoordinates = {
 *   container: { width: 800, height: 400, offsetTop: 0, offsetLeft: 0 },
 *   panes: [...],
 *   isValid: true
 * };
 * ```
 */

/**
 * Represents a bounding box with position and dimensions
 */
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  top: number;
  left: number;
  right: number;
  bottom: number;
}

/**
 * Represents margins for spacing calculations
 */
export interface Margins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/**
 * Container dimensions for the chart
 */
export interface ContainerDimensions {
  width: number;
  height: number;
  offsetTop: number;
  offsetLeft: number;
}

/**
 * Scale dimensions (for time scale or price scale)
 */
export interface ScaleDimensions {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Content area dimensions (excluding scales and margins)
 */
export interface ContentAreaDimensions {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Pane-specific coordinates
 */
export interface PaneCoordinates {
  paneId: number;
  x: number;
  y: number;
  width: number;
  height: number;
  absoluteX: number;
  absoluteY: number;
  contentArea: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
  margins: Margins;
  isMainPane: boolean;
  isLastPane: boolean;
}

/**
 * Legend positioning coordinates
 */
export interface LegendCoordinates {
  top: number;
  left: number;
  right?: number;
  bottom?: number;
  width?: number;
  height?: number;
  zIndex: number;
}

/**
 * Complete chart coordinate information
 */
export interface ChartCoordinates {
  container: ContainerDimensions;
  timeScale: ScaleDimensions;
  priceScaleLeft: ScaleDimensions;
  priceScaleRight: ScaleDimensions;
  panes: PaneCoordinates[];
  contentArea: ContentAreaDimensions;
  timestamp: number;
  isValid: boolean;
}

/**
 * Validation result for coordinate calculations
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Position types for elements
 */
export type ElementPosition =
  | 'top-left'
  | 'top-right'
  | 'top-center'
  | 'bottom-left'
  | 'bottom-right'
  | 'bottom-center'
  | 'center';

/**
 * Element position coordinates
 */
export interface ElementPositionCoordinates {
  x: number;
  y: number;
  width: number;
  height: number;
  corner: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  offset: { x: number; y: number };
}

/**
 * Coordinate calculation options
 */
export interface CoordinateOptions {
  includeMargins?: boolean;
  useCache?: boolean;
  validateResult?: boolean;
  fallbackOnError?: boolean;
}

/**
 * Cache entry for coordinate data
 */
export interface CoordinateCacheEntry extends ChartCoordinates {
  cacheKey: string;
  expiresAt: number;
  coordinates?: unknown; // Raw coordinate data for flexible caching
  chartId?: string;
  containerId?: string;
}
