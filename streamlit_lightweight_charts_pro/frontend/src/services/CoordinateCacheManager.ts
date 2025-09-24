/**
 * Cache manager for coordinate calculations
 * Extracted from ChartCoordinateService for better separation of concerns
 */

import { IChartApi } from 'lightweight-charts';
import { CoordinateCacheEntry } from '../types/coordinates';
import { areCoordinatesStale } from '../utils/coordinateValidation';
import { TIMING } from '../config/positioningConfig';

/**
 * Manages coordinate caching with automatic cleanup
 */
export class CoordinateCacheManager {
  private static instance: CoordinateCacheManager;
  private coordinateCache = new Map<string, CoordinateCacheEntry>();
  private updateCallbacks = new Map<string, Set<() => void>>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  static getInstance(): CoordinateCacheManager {
    if (!this.instance) {
      this.instance = new CoordinateCacheManager();
      this.instance.startCacheCleanup();
    }
    return this.instance;
  }

  /**
   * Generate a cache key for chart and container combination
   */
  generateCacheKey(chart: IChartApi, container: HTMLElement): string {
    const chartElement = chart.chartElement();
    const chartId = chartElement?.id || 'unnamed-chart';
    const containerId = container.id || 'unnamed-container';
    const timestamp = Math.floor(Date.now() / 1000); // Round to seconds for cache stability

    return `${chartId}-${containerId}-${timestamp}`;
  }

  /**
   * Get cached coordinates if valid
   */
  getCachedCoordinates(cacheKey: string): CoordinateCacheEntry | null {
    const cached = this.coordinateCache.get(cacheKey);
    if (cached && !areCoordinatesStale(cached, TIMING.cacheExpiration)) {
      return cached;
    }

    // Remove stale cache entry
    if (cached) {
      this.coordinateCache.delete(cacheKey);
    }

    return null;
  }

  /**
   * Cache coordinates with timestamp
   */
  setCachedCoordinates(cacheKey: string, coordinates: unknown): void {
    const cacheEntry: CoordinateCacheEntry = {
      // Required ChartCoordinates properties with defaults
      container: { width: 0, height: 0, offsetTop: 0, offsetLeft: 0 },
      timeScale: { x: 0, y: 0, width: 0, height: 0 },
      priceScaleLeft: { x: 0, y: 0, width: 0, height: 0 },
      priceScaleRight: { x: 0, y: 0, width: 0, height: 0 },
      panes: [],
      contentArea: { x: 0, y: 0, width: 0, height: 0 },
      timestamp: Date.now(),
      isValid: true,

      // CoordinateCacheEntry properties
      cacheKey,
      expiresAt: Date.now() + TIMING.cacheExpiration,
      coordinates,
      chartId: this.extractChartIdFromKey(cacheKey),
      containerId: this.extractContainerIdFromKey(cacheKey),
    };

    this.coordinateCache.set(cacheKey, cacheEntry);
  }

  /**
   * Check if coordinates exist in cache and are valid
   */
  hasCachedCoordinates(cacheKey: string): boolean {
    return this.getCachedCoordinates(cacheKey) !== null;
  }

  /**
   * Invalidate cache for specific key
   */
  invalidateCache(cacheKey: string): void {
    this.coordinateCache.delete(cacheKey);
    this.notifyUpdateCallbacks(cacheKey);
  }

  /**
   * Invalidate all cache entries for a chart
   */
  invalidateChartCache(chartId: string): void {
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.coordinateCache.entries()) {
      if (entry.chartId === chartId) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => {
      this.coordinateCache.delete(key);
      this.notifyUpdateCallbacks(key);
    });
  }

  /**
   * Register callback for cache updates
   */
  onCacheUpdate(cacheKey: string, callback: () => void): () => void {
    if (!this.updateCallbacks.has(cacheKey)) {
      this.updateCallbacks.set(cacheKey, new Set());
    }

    const callbacks = this.updateCallbacks.get(cacheKey);
    if (callbacks) {
      callbacks.add(callback);
    }

    // Return unsubscribe function
    return () => {
      const callbacks = this.updateCallbacks.get(cacheKey);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.updateCallbacks.delete(cacheKey);
        }
      }
    };
  }

  /**
   * Notify all registered callbacks for cache key
   */
  private notifyUpdateCallbacks(cacheKey: string): void {
    const callbacks = this.updateCallbacks.get(cacheKey);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback();
        } catch {
          // Ignore callback errors to prevent cache system failure
        }
      });
    }
  }

  /**
   * Start automatic cache cleanup
   */
  private startCacheCleanup(): void {
    if (this.cleanupInterval) {
      return;
    }

    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredEntries();
    }, TIMING.cacheCleanupInterval);
  }

  /**
   * Stop automatic cache cleanup
   */
  stopCacheCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupExpiredEntries(): void {
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.coordinateCache.entries()) {
      if (areCoordinatesStale(entry, TIMING.cacheExpiration)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => {
      this.coordinateCache.delete(key);
    });

    // Clean up empty callback sets
    for (const [key, callbacks] of this.updateCallbacks.entries()) {
      if (callbacks.size === 0) {
        this.updateCallbacks.delete(key);
      }
    }
  }

  /**
   * Extract chart ID from cache key
   */
  private extractChartIdFromKey(cacheKey: string): string {
    return cacheKey.split('-')[0] || 'unknown';
  }

  /**
   * Extract container ID from cache key
   */
  private extractContainerIdFromKey(cacheKey: string): string {
    const parts = cacheKey.split('-');
    return parts[1] || 'unknown';
  }

  /**
   * Get cache statistics for debugging
   */
  getCacheStats(): {
    totalEntries: number;
    staleEntries: number;
    activeCallbacks: number;
    memoryUsage: number;
  } {
    let staleCount = 0;
    let totalCallbacks = 0;

    for (const entry of this.coordinateCache.values()) {
      if (areCoordinatesStale(entry, TIMING.cacheExpiration)) {
        staleCount++;
      }
    }

    for (const callbacks of this.updateCallbacks.values()) {
      totalCallbacks += callbacks.size;
    }

    return {
      totalEntries: this.coordinateCache.size,
      staleEntries: staleCount,
      activeCallbacks: totalCallbacks,
      memoryUsage: this.estimateMemoryUsage(),
    };
  }

  /**
   * Estimate memory usage of cache (rough calculation)
   */
  private estimateMemoryUsage(): number {
    let totalSize = 0;

    for (const [key, entry] of this.coordinateCache.entries()) {
      // Rough estimation: key size + JSON serialized entry size
      totalSize += key.length * 2; // UTF-16 chars
      totalSize += JSON.stringify(entry).length * 2;
    }

    return totalSize;
  }

  /**
   * Clear all cache data (for testing or memory management)
   */
  clearAll(): void {
    this.coordinateCache.clear();
    this.updateCallbacks.clear();
  }

  /**
   * Cleanup on service destruction
   */
  destroy(): void {
    this.stopCacheCleanup();
    this.clearAll();
  }
}
