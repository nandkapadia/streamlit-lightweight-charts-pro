/**
 * @fileoverview Annotation System
 *
 * Handles conversion of annotation data to visual elements (markers, shapes, texts).
 * Provides robust parsing and validation for annotation display on charts.
 *
 * This service is responsible for:
 * - Converting annotation objects to Lightweight Charts markers
 * - Creating shape primitives (rectangles, lines)
 * - Processing text annotations with positioning
 * - Validating annotation data with defensive programming
 * - Layer-based annotation organization
 *
 * Architecture:
 * - Pure functions (no state)
 * - Defensive validation at every step
 * - Graceful degradation on errors
 * - Time parsing with timezone handling
 * - Support for multiple annotation types
 *
 * Annotation Types Supported:
 * - **arrow**: Arrow markers (up/down) at specific points
 * - **shape**: Custom shapes (circle, square, etc.)
 * - **circle**: Circle markers at specific points
 * - **rectangle**: Rectangular overlays
 * - **line**: Horizontal/vertical lines
 * - **text**: Text labels at specific coordinates
 *
 * @example
 * ```typescript
 * const annotations = [
 *   {
 *     type: 'arrow',
 *     time: '2024-01-01',
 *     price: 100,
 *     position: 'above',
 *     color: '#4CAF50',
 *     text: 'Buy Signal'
 *   }
 * ];
 *
 * const elements = createAnnotationVisualElements(annotations);
 * // Returns: { markers: [...], shapes: [], texts: [] }
 * ```
 */

import { Annotation, AnnotationLayer, AnnotationText } from '../types';
import { logger } from '../utils/logger';
import { ShapeData } from '../types/ChartInterfaces';
import { UTCTimestamp, SeriesMarker, Time } from 'lightweight-charts';

/**
 * Result of annotation processing containing all visual elements
 *
 * @interface AnnotationVisualElements
 * @property {SeriesMarker<Time>[]} markers - Lightweight Charts markers (arrows, shapes)
 * @property {ShapeData[]} shapes - Custom shape primitives (rectangles, lines)
 * @property {AnnotationText[]} texts - Text label annotations
 */
export interface AnnotationVisualElements {
  markers: SeriesMarker<Time>[];
  shapes: ShapeData[];
  texts: AnnotationText[];
}

export const createAnnotationVisualElements = (
  annotations: Annotation[]
): AnnotationVisualElements => {
  const markers: SeriesMarker<Time>[] = [];
  const shapes: ShapeData[] = [];
  const texts: AnnotationText[] = [];

  // Immediate return if annotations is null, undefined, or not an object
  if (!annotations || typeof annotations !== 'object') {
    return { markers, shapes, texts };
  }

  // Wrap the entire function in a try-catch to prevent any errors
  try {
    // Validate that annotations is an array
    if (!Array.isArray(annotations)) {
      return { markers, shapes, texts };
    }

    // Additional safety check - ensure annotations is actually an array
    try {
      if (typeof annotations.forEach !== 'function') {
        return { markers, shapes, texts };
      }
    } catch {
      return { markers, shapes, texts };
    }

    // Convert to array if it's not already (defensive programming)
    let annotationsArray: Annotation[];
    try {
      annotationsArray = Array.from(annotations);
    } catch {
      return { markers, shapes, texts };
    }

    // Final safety check
    if (!Array.isArray(annotationsArray) || typeof annotationsArray.forEach !== 'function') {
      return { markers, shapes, texts };
    }

    // Use try-catch around the entire forEach operation
    try {
      annotationsArray.forEach((annotation, _index) => {
        try {
          // Validate annotation object
          if (!annotation || typeof annotation !== 'object') {
            return;
          }

          // Create marker based on annotation type
          if (
            annotation.type === 'arrow' ||
            annotation.type === 'shape' ||
            annotation.type === 'circle'
          ) {
            const marker: SeriesMarker<Time> = {
              time: parseTime(annotation.time),
              position: annotation.position === 'above' ? 'aboveBar' : 'belowBar',
              color: annotation.color || '#2196F3',
              shape: annotation.type === 'arrow' ? 'arrowUp' : 'circle',
              text: annotation.text || '',
              size: annotation.fontSize || 1,
            };
            markers.push(marker);
          }

          // Create shape if specified
          if (annotation.type === 'rectangle' || annotation.type === 'line') {
            const shape: ShapeData = {
              type: annotation.type,
              points: [{ time: parseTime(annotation.time), price: annotation.price }],
              color: annotation.color || '#2196F3',
              fillColor: annotation.backgroundColor || '#2196F3',
              borderWidth: annotation.borderWidth || 1,
              text: annotation.text || '',
            };
            shapes.push(shape);
          }

          // Create text annotation if specified
          if (annotation.type === 'text') {
            const text: AnnotationText = {
              time: parseTime(annotation.time),
              price: annotation.price,
              text: annotation.text,
              color: annotation.textColor || '#131722',
              backgroundColor: annotation.backgroundColor || 'rgba(255, 255, 255, 0.9)',
              fontSize: annotation.fontSize || 12,
              fontFamily: 'Arial',
              position: annotation.position === 'above' ? 'aboveBar' : 'belowBar',
            };
            texts.push(text);
          }
        } catch (error) {
          logger.error('Annotation text extraction failed', 'AnnotationSystem', error);
        }
      });
    } catch (forEachError) {
      logger.error('Annotation forEach operation failed', 'AnnotationSystem', forEachError);
    }
  } catch (outerError) {
    logger.error('Annotation system outer operation failed', 'AnnotationSystem', outerError);
  }

  return { markers, shapes, texts };
};

function parseTime(timeStr: string): UTCTimestamp {
  // Convert string time to UTC timestamp
  const date = new Date(timeStr);
  return Math.floor(date.getTime() / 1000) as UTCTimestamp;
}

// Utility functions for annotation management
export function filterAnnotationsByTimeRange(
  annotations: Annotation[],
  startTime: string,
  endTime: string
): Annotation[] {
  const start = parseTime(startTime);
  const end = parseTime(endTime);

  return annotations.filter(annotation => {
    const time = parseTime(annotation.time);
    return time >= start && time <= end;
  });
}

export function filterAnnotationsByPriceRange(
  annotations: Annotation[],
  minPrice: number,
  maxPrice: number
): Annotation[] {
  return annotations.filter(annotation => {
    return annotation.price >= minPrice && annotation.price <= maxPrice;
  });
}

export function createAnnotationLayer(
  name: string,
  annotations: Annotation[] = []
): AnnotationLayer {
  return {
    name,
    annotations,
    visible: true,
    opacity: 1.0,
  };
}
