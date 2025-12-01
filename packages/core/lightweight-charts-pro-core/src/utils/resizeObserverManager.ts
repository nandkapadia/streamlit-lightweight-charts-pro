/**
 * @fileoverview Resize Observer Manager
 *
 * Utility class for managing ResizeObservers with automatic cleanup, throttling, and debouncing.
 * Provides centralized management of resize observations with memory leak prevention.
 *
 * This module provides:
 * - ResizeObserver lifecycle management
 * - Throttling and debouncing support
 * - Automatic cleanup on component unmount
 * - Multi-target observation
 *
 * Features:
 * - Centralized observer management
 * - Throttle (100ms default) to limit callback frequency
 * - Debounce support for delayed callbacks
 * - Memory leak prevention with automatic cleanup
 * - Error handling with logging
 *
 * @example
 * ```typescript
 * import { ResizeObserverManager } from './resizeObserverManager';
 *
 * const manager = new ResizeObserverManager();
 *
 * // Add observer with throttling
 * manager.addObserver(
 *   'chart-1',
 *   containerElement,
 *   (entry) => {
 *     chart.resize(entry.contentRect.width, entry.contentRect.height);
 *   },
 *   { throttleMs: 100, debounceMs: 50 }
 * );
 *
 * // Cleanup on unmount
 * manager.cleanup();
 * ```
 */

import { logger } from './logger';
export class ResizeObserverManager {
  private observers = new Map<string, ResizeObserver>();
  private callbacks = new Map<
    string,
    (_entry: ResizeObserverEntry | ResizeObserverEntry[]) => void
  >();
  private timeouts = new Map<string, NodeJS.Timeout>();
  private targets = new Map<string, Element>();

  /**
   * Add a resize observer for a specific target
   */
  addObserver(
    id: string,
    target: Element,
    callback: (_entry: ResizeObserverEntry | ResizeObserverEntry[]) => void,
    options: {
      throttleMs?: number;
      debounceMs?: number;
    } = {}
  ): void {
    // Remove existing observer if it exists
    this.removeObserver(id);

    const { throttleMs = 100, debounceMs = 0 } = options;

    // Create throttled/debounced callback
    let lastCallTime = 0;

    const wrappedCallback = (entry: ResizeObserverEntry) => {
      const now = Date.now();

      // Throttling
      if (throttleMs > 0 && now - lastCallTime < throttleMs) {
        return;
      }

      // Update throttle timestamp regardless of debouncing
      lastCallTime = now;

      // Debouncing
      if (debounceMs > 0) {
        const existingTimeout = this.timeouts.get(id);
        if (existingTimeout) {
          clearTimeout(existingTimeout);
        }
        const timeoutId = setTimeout(() => {
          callback(entry);
          this.timeouts.delete(id);
        }, debounceMs);
        this.timeouts.set(id, timeoutId);
      } else {
        callback(entry);
      }
    };

    try {
      const observer = new ResizeObserver(entries => {
        // Handle both single entry and array of entries
        if (entries.length === 1) {
          wrappedCallback(entries[0]);
        } else {
          entries.forEach(wrappedCallback);
        }
      });

      observer.observe(target);
      this.observers.set(id, observer);
      this.callbacks.set(id, callback);
      this.targets.set(id, target);
    } catch (error) {
      logger.error('ResizeObserver operation failed', 'ResizeObserverManager', error);
    }
  }

  /**
   * Remove a specific observer
   */
  removeObserver(id: string): void {
    const observer = this.observers.get(id);
    if (observer) {
      try {
        observer.disconnect();
        this.observers.delete(id);
        this.callbacks.delete(id);
        this.targets.delete(id);

        // Clean up any pending timeouts
        const timeout = this.timeouts.get(id);
        if (timeout) {
          clearTimeout(timeout);
          this.timeouts.delete(id);
        }
      } catch (error) {
        logger.error('ResizeObserver operation failed', 'ResizeObserverManager', error);
      }
    }
  }

  /**
   * Check if an observer exists
   */
  hasObserver(id: string): boolean {
    return this.observers.has(id);
  }

  /**
   * Get the number of active observers
   */
  getObserverCount(): number {
    return this.observers.size;
  }

  /**
   * Cleanup all observers
   */
  cleanup(): void {
    this.observers.forEach((observer, _id) => {
      try {
        observer.disconnect();
      } catch {
        // Observer already disconnected
      }
    });

    // Clean up all timeouts
    this.timeouts.forEach((timeout, _id) => {
      try {
        clearTimeout(timeout);
      } catch {
        // Observer already disconnected
      }
    });

    this.observers.clear();
    this.callbacks.clear();
    this.timeouts.clear();
    this.targets.clear();
  }

  /**
   * Get all observer IDs
   */
  getObserverIds(): string[] {
    return Array.from(this.observers.keys());
  }

  /**
   * Pause all observers temporarily
   */
  pauseAll(): void {
    this.observers.forEach((observer, _id) => {
      try {
        observer.disconnect();
      } catch {
        // Observer already disconnected
      }
    });
  }

  /**
   * Resume all observers
   */
  resumeAll(): void {
    this.observers.forEach((observer, id) => {
      const target = this.targets.get(id);
      if (target) {
        try {
          observer.observe(target);
        } catch {
          // Observer already initialized
        }
      }
    });
  }
}
