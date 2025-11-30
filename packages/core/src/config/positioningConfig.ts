/**
 * @fileoverview Positioning Configuration Constants
 *
 * Centralized configuration for all chart positioning and layout calculations.
 * Eliminates magic numbers and provides single source of truth for dimensions.
 *
 * This module provides:
 * - Standard margins for all components
 * - Default dimensions for chart elements
 * - Fallback values for error cases
 * - Z-index layering constants
 * - Timing and animation configurations
 *
 * Features:
 * - Unified spacing constants from PrimitiveDefaults
 * - Type-safe constant exports
 * - Configuration validation
 * - CSS class name generators
 *
 * @example
 * ```typescript
 * import { MARGINS, DIMENSIONS, Z_INDEX } from './positioningConfig';
 *
 * const legendMargin = MARGINS.legend.top;
 * const paneHeight = DIMENSIONS.pane.defaultHeight;
 * const zIndex = Z_INDEX.tooltip;
 * ```
 */

import { UniversalSpacing } from '../primitives/PrimitiveDefaults';

/**
 * Standard margins used throughout the application
 * All margins now use the centralized 6px constants for consistency
 */
export const MARGINS = {
  legend: {
    top: UniversalSpacing.EDGE_PADDING,
    right: UniversalSpacing.EDGE_PADDING,
    bottom: UniversalSpacing.WIDGET_GAP,
    left: UniversalSpacing.EDGE_PADDING,
  },
  pane: {
    top: UniversalSpacing.EDGE_PADDING,
    right: UniversalSpacing.EDGE_PADDING,
    bottom: UniversalSpacing.EDGE_PADDING,
    left: UniversalSpacing.EDGE_PADDING,
  },
  content: {
    top: UniversalSpacing.EDGE_PADDING,
    right: UniversalSpacing.EDGE_PADDING,
    bottom: UniversalSpacing.EDGE_PADDING,
    left: UniversalSpacing.EDGE_PADDING,
  },
  tooltip: {
    top: UniversalSpacing.EDGE_PADDING,
    right: UniversalSpacing.EDGE_PADDING,
    bottom: UniversalSpacing.EDGE_PADDING,
    left: UniversalSpacing.EDGE_PADDING,
  },
} as const;

/**
 * Default dimensions for chart components
 */
export const DIMENSIONS = {
  timeAxis: {
    defaultHeight: 35,
    minHeight: 25,
    maxHeight: 50,
  },
  priceScale: {
    defaultWidth: 70,
    minWidth: 50,
    maxWidth: 100,
    rightScaleDefaultWidth: 0,
  },
  legend: {
    defaultHeight: 80,
    minHeight: 60,
    maxHeight: 120,
    defaultWidth: 200,
    minWidth: 150,
  },
  pane: {
    defaultHeight: 200,
    minHeight: 100,
    maxHeight: 1000,
    minWidth: 200,
    maxWidth: 2000,
    collapsedHeight: 30, // Height when pane is collapsed (30px is minimum per lightweight-charts API)
  },
  chart: {
    defaultWidth: 800,
    defaultHeight: 600,
    minWidth: 300,
    minHeight: 200,
  },
} as const;

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
  containerHeight: 600,
} as const;

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
  modal: 100,
} as const;

/**
 * Animation and timing configurations
 */
export const TIMING = {
  cacheExpiration: 5000, // 5 seconds
  cacheCleanupInterval: 10000, // 10 seconds
  debounceDelay: 100, // 100ms
  throttleDelay: 50, // 50ms
  animationDuration: 200, // 200ms
  chartReadyDelay: 300, // 300ms - Delay for chart initialization
  backendSyncDebounce: 300, // 300ms - Debounce for backend sync operations
} as const;

/**
 * Get margin configuration by feature type
 */
export function getMargins(feature: keyof typeof MARGINS): (typeof MARGINS)[keyof typeof MARGINS] {
  return MARGINS[feature] || MARGINS.content;
}

/**
 * Get dimension configuration by component type
 */
export function getDimensions(
  component: keyof typeof DIMENSIONS
): (typeof DIMENSIONS)[keyof typeof DIMENSIONS] {
  return DIMENSIONS[component] || DIMENSIONS.chart;
}

/**
 * Get fallback value by type
 */
export function getFallback(type: keyof typeof FALLBACKS): number {
  return FALLBACKS[type] || 0;
}

/**
 * Configuration validation
 */
export function validateConfiguration(): boolean {
  // Ensure all dimensions are positive
  for (const [, value] of Object.entries(DIMENSIONS)) {
    for (const [, val] of Object.entries(value)) {
      if (typeof val === 'number' && val < 0) {
        return false;
      }
    }
  }

  // Ensure min values are less than max values
  if (DIMENSIONS.timeAxis.minHeight > DIMENSIONS.timeAxis.maxHeight) {
    return false;
  }

  if (DIMENSIONS.priceScale.minWidth > DIMENSIONS.priceScale.maxWidth) {
    return false;
  }

  return true;
}

/**
 * CSS class name generators
 * Centralizes all dynamic class name generation
 */
export const CSS_CLASSES = {
  /**
   * Generate series configuration dialog container class name
   */
  seriesDialogContainer: (paneId: number): string => `series-config-dialog-container-${paneId}`,

  /**
   * Generate pane button panel container class name
   */
  paneButtonPanelContainer: (paneId: number): string => `pane-button-panel-container-${paneId}`,
} as const;

// Validate configuration on load
if (process.env.NODE_ENV === 'development') {
  validateConfiguration();
}
