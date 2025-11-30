/**
 * @fileoverview Utils module - Utility functions and helpers
 *
 * Exports all utility functions for color manipulation, coordinate validation,
 * rendering, logging, and chart-related utilities.
 */

// Singleton patterns
export { KeyedSingletonManager } from './KeyedSingletonManager';
export { SingletonBase } from './SingletonBase';

// Chart utilities
export { chartReadyDetection } from './chartReadyDetection';
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
export { logger, setLogLevel, LogLevel } from './logger';

// Performance utilities
export * from './performance';

// Resize observer
export { ResizeObserverManager } from './resizeObserverManager';
