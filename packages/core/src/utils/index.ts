/**
 * @fileoverview Utils module - Utility functions and helpers
 *
 * Exports all utility functions for color manipulation, coordinate validation,
 * rendering, logging, and chart-related utilities.
 */

// Disposable utilities
export type { Disposable } from './Disposable';
export { cleanupInstance } from './Disposable';

// Singleton patterns
export { KeyedSingletonManager } from './KeyedSingletonManager';
export { SingletonBase } from './SingletonBase';

// Chart utilities
export { ChartReadyDetector } from './chartReadyDetection';
export * from './lightweightChartsUtils';

// Color utilities
export * from './colorUtils';
export * from './signalColorUtils';

// Validation utilities
export * from './coordinateValidation';
export * from './dataValidation';

// Rendering utilities
export * from './renderingUtils';
export * from './lineStyle';

// Error handling
export * from './errorHandler';

// Logging
export { logger, LogLevel, chartLog, primitiveLog, perfLog } from './logger';

// Security/Sanitization utilities
export * from './sanitization';

// Performance utilities - exclude debounce (already in colorUtils)
export {
  perfLogFn,
  deepCompare,
  getCachedDOMElement,
  getCachedDOMElementForTesting,
  throttle,
  memoize,
  batchDOMUpdates,
  getCachedDimensions,
} from './performance';

// Resize observer
export { ResizeObserverManager } from './resizeObserverManager';
