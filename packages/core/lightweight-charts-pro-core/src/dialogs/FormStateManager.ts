/**
 * @fileoverview Form State Manager (Pure TypeScript)
 *
 * Manages form state for multiple series configurations with:
 * - Per-series configuration tracking
 * - Optimistic updates with debouncing
 * - Dirty state tracking
 * - Rollback capability
 *
 * @example
 * ```typescript
 * const formState = new FormStateManager({
 *   initialConfigs: {
 *     'series-1': { color: '#ff0000', visible: true },
 *     'series-2': { color: '#00ff00', visible: true },
 *   },
 *   onConfigChange: (seriesId, config) => applyChanges(seriesId, config),
 * });
 *
 * // Update a series configuration
 * formState.updateConfig('series-1', { color: '#0000ff' });
 * ```
 */

import { OptimisticStateManager } from './base/OptimisticStateManager';

/**
 * Generic series configuration
 */
export type SeriesFormConfig = Record<string, unknown>;

/**
 * Map of series ID to configuration
 */
export type SeriesConfigMap = Record<string, SeriesFormConfig>;

/**
 * Form state manager configuration
 */
export interface FormStateManagerConfig {
  /** Initial series configurations */
  initialConfigs: SeriesConfigMap;
  /** Callback when a config changes (after debounce) */
  onConfigChange?: (seriesId: string, config: SeriesFormConfig) => void;
  /** Debounce delay in milliseconds */
  debounceMs?: number;
}

/**
 * Form state change event
 */
export interface FormStateChangeEvent {
  seriesId: string;
  config: SeriesFormConfig;
  isOptimistic: boolean;
}

/**
 * Form state subscriber callback
 */
export type FormStateSubscriber = (event: FormStateChangeEvent) => void;

/**
 * Form State Manager - Pure TypeScript Implementation
 *
 * Manages multiple series configurations with optimistic updates.
 */
export class FormStateManager {
  private _configs: Map<string, OptimisticStateManager<SeriesFormConfig>> = new Map();
  private _subscribers: Set<FormStateSubscriber> = new Set();
  private _onConfigChange?: (seriesId: string, config: SeriesFormConfig) => void;
  private _debounceMs: number;

  /**
   * Create a new FormStateManager
   *
   * @param config - Form state manager configuration
   */
  constructor(config: FormStateManagerConfig) {
    this._onConfigChange = config.onConfigChange;
    this._debounceMs = config.debounceMs ?? 300;

    // Initialize configs
    this._initializeConfigs(config.initialConfigs);
  }

  // ============================================================================
  // Public API
  // ============================================================================

  /**
   * Get configuration for a specific series
   *
   * @param seriesId - Series ID
   * @returns The series configuration or empty object
   */
  public getConfig(seriesId: string): SeriesFormConfig {
    const manager = this._configs.get(seriesId);
    return manager ? manager.state : {};
  }

  /**
   * Get all series configurations
   */
  public getAllConfigs(): SeriesConfigMap {
    const result: SeriesConfigMap = {};
    this._configs.forEach((manager, seriesId) => {
      result[seriesId] = manager.state;
    });
    return result;
  }

  /**
   * Update configuration for a series (with debouncing)
   *
   * Changes are applied optimistically and debounced before committing.
   *
   * @param seriesId - Series ID
   * @param updates - Configuration updates
   */
  public updateConfig(seriesId: string, updates: Partial<SeriesFormConfig>): void {
    const manager = this._configs.get(seriesId);
    if (!manager) {
      console.warn(`FormStateManager: Unknown series ID: ${seriesId}`);
      return;
    }

    manager.updateOptimistic(updates, Object.keys(updates).join('-'));

    // Notify subscribers immediately (optimistic)
    this._notifySubscribers({
      seriesId,
      config: manager.state,
      isOptimistic: true,
    });
  }

  /**
   * Update configuration immediately (no debouncing)
   *
   * @param seriesId - Series ID
   * @param updates - Configuration updates
   */
  public updateConfigImmediate(seriesId: string, updates: Partial<SeriesFormConfig>): void {
    const manager = this._configs.get(seriesId);
    if (!manager) {
      console.warn(`FormStateManager: Unknown series ID: ${seriesId}`);
      return;
    }

    manager.updateImmediate(updates);

    this._notifySubscribers({
      seriesId,
      config: manager.state,
      isOptimistic: false,
    });
  }

  /**
   * Reset configuration for a series
   *
   * @param seriesId - Series ID
   * @param config - New configuration
   */
  public resetConfig(seriesId: string, config: SeriesFormConfig): void {
    const manager = this._configs.get(seriesId);
    if (manager) {
      manager.reset(config);
      this._notifySubscribers({
        seriesId,
        config: manager.state,
        isOptimistic: false,
      });
    }
  }

  /**
   * Rollback all pending changes for a series
   *
   * @param seriesId - Series ID
   */
  public rollback(seriesId: string): void {
    const manager = this._configs.get(seriesId);
    if (manager) {
      manager.rollback();
      this._notifySubscribers({
        seriesId,
        config: manager.state,
        isOptimistic: false,
      });
    }
  }

  /**
   * Rollback all series configurations
   */
  public rollbackAll(): void {
    this._configs.forEach((manager, seriesId) => {
      manager.rollback();
      this._notifySubscribers({
        seriesId,
        config: manager.state,
        isOptimistic: false,
      });
    });
  }

  /**
   * Flush all pending updates immediately
   */
  public flush(): void {
    this._configs.forEach((manager) => {
      manager.flush();
    });
  }

  /**
   * Check if a series has unsaved changes
   *
   * @param seriesId - Series ID
   */
  public isDirty(seriesId: string): boolean {
    const manager = this._configs.get(seriesId);
    return manager ? manager.isDirty : false;
  }

  /**
   * Check if any series has unsaved changes
   */
  public hasUnsavedChanges(): boolean {
    let dirty = false;
    this._configs.forEach((manager) => {
      if (manager.isDirty) {
        dirty = true;
      }
    });
    return dirty;
  }

  /**
   * Check if a series has pending debounced updates
   *
   * @param seriesId - Series ID
   */
  public isPending(seriesId: string): boolean {
    const manager = this._configs.get(seriesId);
    return manager ? manager.pendingKeys.length > 0 : false;
  }

  /**
   * Check if any series has pending debounced updates
   */
  public isAnyPending(): boolean {
    let pending = false;
    this._configs.forEach((manager) => {
      if (manager.pendingKeys.length > 0) {
        pending = true;
      }
    });
    return pending;
  }

  /**
   * Add a new series configuration
   *
   * @param seriesId - Series ID
   * @param config - Initial configuration
   */
  public addSeries(seriesId: string, config: SeriesFormConfig): void {
    if (this._configs.has(seriesId)) {
      this.resetConfig(seriesId, config);
      return;
    }

    const manager = new OptimisticStateManager(
      { ...config },
      this._debounceMs,
      (state) => this._handleCommit(seriesId, state)
    );

    this._configs.set(seriesId, manager);
  }

  /**
   * Remove a series configuration
   *
   * @param seriesId - Series ID
   */
  public removeSeries(seriesId: string): void {
    const manager = this._configs.get(seriesId);
    if (manager) {
      manager.destroy();
      this._configs.delete(seriesId);
    }
  }

  /**
   * Get all series IDs
   */
  public getSeriesIds(): string[] {
    return Array.from(this._configs.keys());
  }

  /**
   * Subscribe to configuration changes
   *
   * @param callback - Subscriber callback
   * @returns Unsubscribe function
   */
  public subscribe(callback: FormStateSubscriber): () => void {
    this._subscribers.add(callback);
    return () => {
      this._subscribers.delete(callback);
    };
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    this._configs.forEach((manager) => {
      manager.destroy();
    });
    this._configs.clear();
    this._subscribers.clear();
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Initialize configs from initial values
   */
  private _initializeConfigs(configs: SeriesConfigMap): void {
    Object.entries(configs).forEach(([seriesId, config]) => {
      const manager = new OptimisticStateManager(
        { ...config },
        this._debounceMs,
        (state) => this._handleCommit(seriesId, state)
      );

      this._configs.set(seriesId, manager);
    });
  }

  /**
   * Handle commit callback from OptimisticStateManager
   */
  private _handleCommit(seriesId: string, config: SeriesFormConfig): void {
    if (this._onConfigChange) {
      this._onConfigChange(seriesId, config);
    }

    this._notifySubscribers({
      seriesId,
      config,
      isOptimistic: false,
    });
  }

  /**
   * Notify all subscribers of a change
   */
  private _notifySubscribers(event: FormStateChangeEvent): void {
    this._subscribers.forEach((callback) => {
      try {
        callback(event);
      } catch (error) {
        console.error('FormStateManager: Subscriber error:', error);
      }
    });
  }
}
