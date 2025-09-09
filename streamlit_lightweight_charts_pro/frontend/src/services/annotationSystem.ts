import {Annotation, AnnotationLayer} from '../types'
import {UTCTimestamp, SeriesMarker, Time} from 'lightweight-charts'

export interface AnnotationVisualElements {
  markers: any[]
  shapes: any[]
  texts: any[]
}

export const createAnnotationVisualElements = (
  annotations: Annotation[]
): AnnotationVisualElements => {
  const markers: SeriesMarker<Time>[] = []
  const shapes: any[] = []
  const texts: any[] = []

  // Immediate return if annotations is null, undefined, or not an object
  if (!annotations || typeof annotations !== 'object') {
    console.warn(
      'createAnnotationVisualElements: annotations is null, undefined, or not an object:',
      annotations
    )
    return {markers, shapes, texts}
  }

  // Wrap the entire function in a try-catch to prevent any errors
  try {
    // Validate that annotations is an array
    if (!Array.isArray(annotations)) {
      console.warn('createAnnotationVisualElements: annotations is not an array:', annotations)
      return {markers, shapes, texts}
    }

    // Additional safety check - ensure annotations is actually an array
    try {
      if (typeof annotations.forEach !== 'function') {
        console.warn(
          'createAnnotationVisualElements: annotations.forEach is not a function:',
          annotations
        )
        return {markers, shapes, texts}
      }
    } catch (error) {
      console.warn('createAnnotationVisualElements: Error checking annotations.forEach:', error)
      return {markers, shapes, texts}
    }

    // Convert to array if it's not already (defensive programming)
    let annotationsArray: Annotation[]
    try {
      annotationsArray = Array.from(annotations)
    } catch (error) {
      console.warn('createAnnotationVisualElements: Error converting to array:', error)
      return {markers, shapes, texts}
    }

    // Final safety check
    if (!Array.isArray(annotationsArray) || typeof annotationsArray.forEach !== 'function') {
      console.error(
        'createAnnotationVisualElements: annotationsArray is still not a proper array:',
        annotationsArray
      )
      return {markers, shapes, texts}
    }

    // Use try-catch around the entire forEach operation
    try {
      annotationsArray.forEach((annotation, index) => {
        try {
          // Validate annotation object
          if (!annotation || typeof annotation !== 'object') {
            console.warn(`Invalid annotation at index ${index}:`, annotation)
            return
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
              size: annotation.fontSize || 1
            }
            markers.push(marker)
          }

          // Create shape if specified
          if (annotation.type === 'rectangle' || annotation.type === 'line') {
            const shape = {
              time: parseTime(annotation.time),
              price: annotation.price,
              type: annotation.type,
              color: annotation.color || '#2196F3',
              borderColor: annotation.borderColor || '#2196F3',
              borderWidth: annotation.borderWidth || 1,
              borderStyle: annotation.lineStyle || 'solid',
              size: annotation.fontSize || 1,
              text: annotation.text || ''
            }
            shapes.push(shape)
          }

          // Create text annotation if specified
          if (annotation.type === 'text') {
            const text = {
              time: parseTime(annotation.time),
              price: annotation.price,
              text: annotation.text,
              color: annotation.textColor || '#131722',
              backgroundColor: annotation.backgroundColor || 'rgba(255, 255, 255, 0.9)',
              fontSize: annotation.fontSize || 12,
              fontFamily: 'Arial',
              position: annotation.position === 'above' ? 'aboveBar' : 'belowBar'
            }
            texts.push(text)
          }
        } catch (error) {
          console.warn(`Error processing annotation at index ${index}:`, error, annotation)
        }
      })
    } catch (forEachError) {
      console.error('Error in annotations.forEach:', forEachError, 'annotations:', annotations)
    }
  } catch (outerError) {
    console.error(
      'Critical error in createAnnotationVisualElements:',
      outerError,
      'annotations:',
      annotations
    )
  }

  return {markers, shapes, texts}
}

function parseTime(timeStr: string): UTCTimestamp {
  // Convert string time to UTC timestamp
  const date = new Date(timeStr)
  return Math.floor(date.getTime() / 1000) as UTCTimestamp
}

// Utility functions for annotation management
export function filterAnnotationsByTimeRange(
  annotations: Annotation[],
  startTime: string,
  endTime: string
): Annotation[] {
  const start = parseTime(startTime)
  const end = parseTime(endTime)

  return annotations.filter(annotation => {
    const time = parseTime(annotation.time)
    return time >= start && time <= end
  })
}

export function filterAnnotationsByPriceRange(
  annotations: Annotation[],
  minPrice: number,
  maxPrice: number
): Annotation[] {
  return annotations.filter(annotation => {
    return annotation.price >= minPrice && annotation.price <= maxPrice
  })
}

export function createAnnotationLayer(
  name: string,
  annotations: Annotation[] = []
): AnnotationLayer {
  return {
    name,
    annotations,
    visible: true,
    opacity: 1.0
  }
}
