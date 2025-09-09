/**
 * Utility for dynamic imports to enable code splitting
 * This allows heavy functions to be loaded only when needed
 */

// Dynamic import for trade visualization functions
export const loadTradeVisualization = async () => {
  const module = await import('../services/tradeVisualization')
  return {
    createTradeVisualElements: module.createTradeVisualElements
  }
}

// Dynamic import for annotation system
export const loadAnnotationSystem = async () => {
  const module = await import('../services/annotationSystem')
  return {
    createAnnotationVisualElements: module.createAnnotationVisualElements
  }
}

// Dynamic import for signal series
export const loadSignalSeries = async () => {
  const module = await import('../plugins/series/signalSeriesPlugin')
  return {
    SignalSeries: module.SignalSeries
  }
}

// Generic dynamic import utility
export const dynamicImport = <T>(importFn: () => Promise<T>): (() => Promise<T>) => {
  let cached: T | null = null

  return async () => {
    if (cached) return cached
    cached = await importFn()
    return cached
  }
}
