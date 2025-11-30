/**
 * @fileoverview Series module - Unified series factory and descriptors
 *
 * Exports the unified series factory system for creating both built-in
 * and custom series types with consistent configuration.
 */

// Main factory
export { UnifiedSeriesFactory } from './UnifiedSeriesFactory';
export { UnifiedPropertyMapper } from './UnifiedPropertyMapper';

// Core types and descriptors
export * from './core';
export * from './descriptors';
export * from './utils';
