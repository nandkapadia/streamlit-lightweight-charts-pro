/**
 * Validation utilities for coordinate calculations
 * Ensures coordinate data integrity and provides helpful debugging
 */

import {
  ChartCoordinates,
  PaneCoordinates,
  ValidationResult,
  BoundingBox,
  ScaleDimensions,
  // ContainerDimensions is used in type imports
} from '../types/coordinates';
import { DIMENSIONS, FALLBACKS } from '../config/positioningConfig';
import { logger } from './logger';

/**
 * Validates complete chart coordinates
 */
export function validateChartCoordinates(coordinates: ChartCoordinates): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate container dimensions
  if (!coordinates.container) {
    errors.push('Missing container dimensions');
  } else {
    if (coordinates.container.width <= 0) {
      errors.push(`Invalid container width: ${coordinates.container.width}`);
    }
    if (coordinates.container.height <= 0) {
      errors.push(`Invalid container height: ${coordinates.container.height}`);
    }
    if (coordinates.container.width < DIMENSIONS.chart.minWidth) {
      warnings.push(
        `Container width (${coordinates.container.width}) is below recommended minimum (${DIMENSIONS.chart.minWidth})`
      );
    }
    if (coordinates.container.height < DIMENSIONS.chart.minHeight) {
      warnings.push(
        `Container height (${coordinates.container.height}) is below recommended minimum (${DIMENSIONS.chart.minHeight})`
      );
    }
  }

  // Validate time scale
  if (!coordinates.timeScale) {
    errors.push('Missing time scale dimensions');
  } else {
    const timeScaleErrors = validateScaleDimensions(coordinates.timeScale, 'timeScale');
    errors.push(...timeScaleErrors.errors);
    warnings.push(...timeScaleErrors.warnings);

    if (coordinates.timeScale.height < DIMENSIONS.timeAxis.minHeight) {
      warnings.push(
        `Time scale height (${coordinates.timeScale.height}) is below minimum (${DIMENSIONS.timeAxis.minHeight})`
      );
    }
    if (coordinates.timeScale.height > DIMENSIONS.timeAxis.maxHeight) {
      warnings.push(
        `Time scale height (${coordinates.timeScale.height}) exceeds maximum (${DIMENSIONS.timeAxis.maxHeight})`
      );
    }
  }

  // Validate price scales (handle both direct properties and nested object structure)
  const priceScales = (coordinates as any).priceScales;

  if (priceScales) {
    // Handle test structure with nested priceScales object
    if (priceScales.right) {
      const rightScaleErrors = validateScaleDimensions(priceScales.right, 'priceScaleRight');
      errors.push(...rightScaleErrors.errors);
      warnings.push(...rightScaleErrors.warnings);
    }
    if (priceScales.left) {
      const leftScaleErrors = validateScaleDimensions(priceScales.left, 'priceScaleLeft');
      errors.push(...leftScaleErrors.errors);
      warnings.push(...leftScaleErrors.warnings);
    }
  } else {
    // Handle standard structure with direct properties
    if (!coordinates.priceScaleLeft) {
      warnings.push('Missing left price scale dimensions');
    } else {
      const priceScaleErrors = validateScaleDimensions(
        coordinates.priceScaleLeft,
        'priceScaleLeft'
      );
      errors.push(...priceScaleErrors.errors);
      warnings.push(...priceScaleErrors.warnings);
    }

    if (coordinates.priceScaleRight) {
      const priceScaleErrors = validateScaleDimensions(
        coordinates.priceScaleRight,
        'priceScaleRight'
      );
      errors.push(...priceScaleErrors.errors);
      warnings.push(...priceScaleErrors.warnings);
    }
  }

  // Validate panes (handle both array and object structure)
  if (!coordinates.panes) {
    errors.push('No panes defined');
  } else {
    if (Array.isArray(coordinates.panes)) {
      if (coordinates.panes.length === 0) {
        errors.push('No panes defined');
      } else {
        coordinates.panes.forEach((pane, index) => {
          const paneErrors = validatePaneCoordinates(pane, index);
          errors.push(...paneErrors.errors);
          warnings.push(...paneErrors.warnings);
        });
      }
    } else {
      // Handle object structure (like in tests)
      const paneKeys = Object.keys(coordinates.panes as any);
      if (paneKeys.length === 0) {
        errors.push('No panes defined');
      } else {
        paneKeys.forEach(key => {
          const pane = (coordinates.panes as any)[key];
          const paneErrors = validatePaneCoordinates(pane, parseInt(key));
          errors.push(...paneErrors.errors);
          warnings.push(...paneErrors.warnings);
        });
      }
    }
  }

  // Validate content area
  if (!coordinates.contentArea) {
    errors.push('Missing content area dimensions');
  } else {
    const contentErrors = validateBoundingBox(coordinates.contentArea, 'contentArea');
    errors.push(...contentErrors.errors);
    warnings.push(...contentErrors.warnings);
  }

  // Check timestamp
  if (!coordinates.timestamp || coordinates.timestamp <= 0) {
    warnings.push('Invalid or missing timestamp');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates scale dimensions
 */
export function validateScaleDimensions(
  scale: ScaleDimensions | null,
  name: string
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!scale) {
    errors.push(`${name}: Missing scale dimensions`);
    return { isValid: false, errors, warnings };
  }

  if (scale.width <= 0) {
    errors.push(`${name}: Invalid width (${scale.width})`);
  }

  if (scale.height <= 0) {
    errors.push(`${name}: Invalid height (${scale.height})`);
  }

  if (typeof scale.x === 'number' && scale.x < 0) {
    warnings.push(`${name}: Negative x position (${scale.x})`);
  }

  if (typeof scale.y === 'number' && scale.y < 0) {
    warnings.push(`${name}: Negative y position (${scale.y})`);
  }

  return { isValid: errors.length === 0, errors, warnings };
}

/**
 * Validates pane coordinates
 */
export function validatePaneCoordinates(pane: PaneCoordinates, index?: number): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const prefix = index !== undefined ? `Pane ${index}: ` : '';

  if (!pane) {
    errors.push(`${prefix}Missing pane data`);
    return { isValid: false, errors, warnings };
  }

  // Handle simplified test structure (just width, height, top, left)
  if (typeof pane.width === 'number' && typeof pane.height === 'number') {
    if (pane.width <= 0) {
      errors.push(`${prefix}Invalid width (${pane.width})`);
    }
    if (pane.height <= 0) {
      errors.push(`${prefix}Invalid height (${pane.height})`);
    }
    // Check for negative contentArea positioning
    if (typeof pane.contentArea?.top === 'number' && pane.contentArea.top < 0) {
      errors.push(`${prefix}Invalid top position (${pane.contentArea.top})`);
    }
    if (typeof pane.contentArea?.left === 'number' && pane.contentArea.left < 0) {
      errors.push(`${prefix}Invalid left position (${pane.contentArea.left})`);
    }
    return { isValid: errors.length === 0, errors, warnings };
  }

  // Full validation for complete PaneCoordinates structure
  if (typeof pane.paneId === 'number' && pane.paneId < 0) {
    errors.push(`${prefix}Invalid pane ID`);
  }

  if (pane.width <= 0) {
    errors.push(`${prefix}Invalid width (${pane.width})`);
  }
  if (pane.height <= 0) {
    errors.push(`${prefix}Invalid height (${pane.height})`);
  }

  if (!pane.contentArea) {
    errors.push(`${prefix}Missing pane content area`);
  } else if (pane.contentArea.width <= 0 || pane.contentArea.height <= 0) {
    errors.push(`${prefix}Invalid content area dimensions`);
  } else {
    const contentErrors = validateBoundingBox(pane.contentArea, 'contentArea');
    errors.push(...contentErrors.errors.map(e => `${prefix}${e}`));
    warnings.push(...contentErrors.warnings.map(w => `${prefix}${w}`));
  }

  if (pane.contentArea) {
    if (pane.contentArea.width > pane.width) {
      errors.push(`${prefix}Content area width exceeds pane width`);
    }
    if (pane.contentArea.height > pane.height) {
      errors.push(`${prefix}Content area height exceeds pane height`);
    }
  }

  return { isValid: errors.length === 0, errors, warnings };
}

/**
 * Validates a bounding box
 */
export function validateBoundingBox(
  box: Partial<BoundingBox> | null,
  name: string = 'BoundingBox'
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!box) {
    errors.push(`${name}: Missing bounding box data`);
    return { isValid: false, errors, warnings };
  }

  if (box.width !== undefined && box.width <= 0) {
    errors.push(`${name}: Invalid width (${box.width})`);
  }

  if (box.height !== undefined && box.height <= 0) {
    errors.push(`${name}: Invalid height (${box.height})`);
  }

  if (box.x !== undefined && box.x < 0) {
    warnings.push(`${name}: Negative x position (${box.x})`);
  }

  if (box.y !== undefined && box.y < 0) {
    warnings.push(`${name}: Negative y position (${box.y})`);
  }

  // Check consistency between position and bounds
  if (box.x !== undefined && box.width !== undefined) {
    if (box.right !== undefined && Math.abs(box.x + box.width - box.right) > 1) {
      warnings.push(`${name}: Inconsistent right bound`);
    }
  }

  if (box.y !== undefined && box.height !== undefined) {
    if (box.bottom !== undefined && Math.abs(box.y + box.height - box.bottom) > 1) {
      warnings.push(`${name}: Inconsistent bottom bound`);
    }
  }

  return { isValid: errors.length === 0, errors, warnings };
}

/**
 * Sanitizes coordinates by applying fallbacks for invalid values
 */
export function sanitizeCoordinates(coordinates: Partial<ChartCoordinates>): ChartCoordinates {
  const now = Date.now();

  // Sanitize container dimensions
  const container = coordinates.container
    ? {
        width:
          coordinates.container.width <= 0 ? FALLBACKS.containerWidth : coordinates.container.width,
        height:
          coordinates.container.height <= 0
            ? FALLBACKS.containerHeight
            : coordinates.container.height,
        offsetTop: coordinates.container.offsetTop || 0,
        offsetLeft: coordinates.container.offsetLeft || 0,
      }
    : {
        width: FALLBACKS.containerWidth,
        height: FALLBACKS.containerHeight,
        offsetTop: 0,
        offsetLeft: 0,
      };

  // Sanitize time scale
  const timeScale = coordinates.timeScale
    ? {
        x: coordinates.timeScale.x ?? 0,
        y: coordinates.timeScale.y ?? container.height - FALLBACKS.timeScaleHeight,
        width: coordinates.timeScale.width <= 0 ? container.width : coordinates.timeScale.width,
        height:
          coordinates.timeScale.height <= 0
            ? FALLBACKS.timeScaleHeight
            : coordinates.timeScale.height,
      }
    : {
        x: 0,
        y: container.height - FALLBACKS.timeScaleHeight,
        width: container.width,
        height: FALLBACKS.timeScaleHeight,
      };

  // Determine if any fallbacks were applied
  const needsValidation = validateChartCoordinates(coordinates as ChartCoordinates);
  const appliedFallbacks = !needsValidation.isValid;

  return {
    container,
    timeScale,
    priceScaleLeft: coordinates.priceScaleLeft || {
      x: 0,
      y: 0,
      width: FALLBACKS.priceScaleWidth,
      height: container.height - timeScale.height,
    },
    priceScaleRight: coordinates.priceScaleRight || {
      x: container.width - DIMENSIONS.priceScale.rightScaleDefaultWidth,
      y: 0,
      width: DIMENSIONS.priceScale.rightScaleDefaultWidth,
      height: container.height - timeScale.height,
    },
    panes:
      Array.isArray(coordinates.panes) && coordinates.panes.length > 0
        ? coordinates.panes.map(pane => ({
            ...pane,
            x: pane.x < 0 ? 0 : pane.x,
            y: pane.y < 0 ? 0 : pane.y,
            width: pane.width <= 0 ? FALLBACKS.paneWidth : pane.width,
            height: pane.height <= 0 ? FALLBACKS.paneHeight : pane.height,
            contentArea: pane.contentArea
              ? {
                  ...pane.contentArea,
                  top: pane.contentArea.top < 0 ? 0 : pane.contentArea.top,
                  left:
                    pane.contentArea.left < 0 ? FALLBACKS.priceScaleWidth : pane.contentArea.left,
                  width:
                    pane.contentArea.width <= 0
                      ? FALLBACKS.paneWidth - FALLBACKS.priceScaleWidth
                      : pane.contentArea.width,
                  height:
                    pane.contentArea.height <= 0
                      ? FALLBACKS.paneHeight - FALLBACKS.timeScaleHeight
                      : pane.contentArea.height,
                }
              : {
                  top: 0,
                  left: FALLBACKS.priceScaleWidth,
                  width: FALLBACKS.paneWidth - FALLBACKS.priceScaleWidth,
                  height: FALLBACKS.paneHeight - FALLBACKS.timeScaleHeight,
                },
          }))
        : [
            {
              paneId: 0,
              x: 0,
              y: 0,
              width: FALLBACKS.paneWidth,
              height: FALLBACKS.paneHeight,
              absoluteX: 0,
              absoluteY: 0,
              isMainPane: true,
              isLastPane: true,
              contentArea: {
                top: 0,
                left: FALLBACKS.priceScaleWidth,
                width: FALLBACKS.paneWidth - FALLBACKS.priceScaleWidth,
                height: FALLBACKS.paneHeight - FALLBACKS.timeScaleHeight,
              },
              margins: { top: 10, right: 10, bottom: 10, left: 10 },
            },
          ],
    contentArea: coordinates.contentArea || {
      x: FALLBACKS.priceScaleWidth,
      y: 0,
      width: container.width - FALLBACKS.priceScaleWidth,
      height: container.height - timeScale.height,
    },
    timestamp: coordinates.timestamp || now,
    isValid: !appliedFallbacks, // Valid if no fallbacks were needed
  };
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
    bottom: y + height,
  };
}

/**
 * Checks if coordinates are stale based on timestamp
 */
export function areCoordinatesStale(coordinates: ChartCoordinates, maxAge: number = 5000): boolean {
  const now = Date.now();
  return now - coordinates.timestamp > maxAge;
}

/**
 * Debug helper to log coordinate validation results
 */
export function logValidationResult(result: ValidationResult, _context: string = ''): void {
  if (process.env.NODE_ENV !== 'development') return;

  if (!result.isValid) {
    logger.error('Coordinate validation failed', 'CoordinateValidation', result.errors);
  }

  if (result.warnings.length > 0) {
    logger.warn('Coordinate validation warnings', 'CoordinateValidation', result.warnings);
  }
}

/**
 * Gets comprehensive debug information about coordinates
 */
export function getCoordinateDebugInfo(coordinates: ChartCoordinates) {
  const validation = validateChartCoordinates(coordinates);

  return {
    container: coordinates.container,
    timeScale: coordinates.timeScale,
    panes: coordinates.panes,
    priceScales: {
      left: coordinates.priceScaleLeft,
      right: coordinates.priceScaleRight,
    },
    validation: validation,
    summary: [
      `Container: ${coordinates.container?.width || 0}x${coordinates.container?.height || 0}`,
      `TimeScale: ${coordinates.timeScale?.width || 0}x${coordinates.timeScale?.height || 0}`,
      `Panes: ${Array.isArray(coordinates.panes) ? coordinates.panes.length : Object.keys(coordinates.panes || {}).length}`,
      `PriceScales: ${(coordinates.priceScaleLeft ? 1 : 0) + (coordinates.priceScaleRight ? 1 : 0)}`,
    ].join(', '),
  };
}
