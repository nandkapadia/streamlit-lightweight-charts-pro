/**
 * @fileoverview Optimistic State Manager with Debouncing
 *
 * Manages optimistic UI updates with debounced actual state commits.
 * This replaces React 19's useTransition hook for optimistic updates.
 *
 * Features:
 * - Immediate optimistic updates for responsive UI
 * - Debounced commits to actual state
 * - Rollback capability on errors
 * - Per-key debouncing for independent updates
 *
 * @example
 * ```typescript
 * const manager = new OptimisticStateManager(
 *   initialState,
 *   (state) => updateUI(state),
 *   (state) => saveToBackend(state)
 * );
 *
 * // Optimistic update (immediate UI feedback)
 * manager.updateOptimistic({ color: '#ff0000' }, 'color');
 *
 * // On error, rollback
 * manager.rollback();
 * ```
 */

/**
 * State subscriber callback type
 */
export type OptimisticSubscriber<T> = (state: T, isOptimistic: boolean) => void;

/**
 * Commit callback type
 */
export type CommitCallback<T> = (state: T) => void | Promise<void>;

/**
 * Pending update entry
 */
interface PendingUpdate {
  timeout: ReturnType<typeof setTimeout>;
  updates: Record<string, unknown>;
}

/**
 * Optimistic State Manager
 *
 * Provides immediate optimistic updates for responsive UI while
 * debouncing the actual state commits.
 *
 * @template T The state object type
 */
export class OptimisticStateManager<T extends object> {
  /** The actual committed state */
  private _actualState: T;

  /** The optimistic state (what UI shows) */
  private _optimisticState: T;

  /** Pending updates keyed by update key */
  private _pendingUpdates: Map<string, PendingUpdate> = new Map();

  /** State subscribers */
  private _subscribers: Set<OptimisticSubscriber<T>> = new Set();

  /** Debounce delay in milliseconds */
  private _debounceMs: number;

  /** Commit callback */
  private _onCommit?: CommitCallback<T>;

  /** Whether there are uncommitted changes */
  private _isDirty: boolean = false;

  /**
   * Create a new OptimisticStateManager
   *
   * @param initialState - The initial state
   * @param debounceMs - Debounce delay in milliseconds (default: 300)
   * @param onCommit - Callback when state is committed
   */
  constructor(
    initialState: T,
    debounceMs: number = 300,
    onCommit?: CommitCallback<T>
  ) {
    this._actualState = { ...initialState };
    this._optimisticState = { ...initialState };
    this._debounceMs = debounceMs;
    this._onCommit = onCommit;
  }

  /**
   * Get the current optimistic state (what UI should show)
   */
  public get state(): T {
    return { ...this._optimisticState };
  }

  /**
   * Get the actual committed state
   */
  public get actualState(): T {
    return { ...this._actualState };
  }

  /**
   * Check if there are uncommitted changes
   */
  public get isDirty(): boolean {
    return this._isDirty;
  }

  /**
   * Apply an optimistic update
   *
   * The update is applied immediately to the optimistic state,
   * but the actual state commit is debounced.
   *
   * @param updates - Partial state updates
   * @param key - Unique key for this update (for debouncing)
   */
  public updateOptimistic(updates: Partial<T>, key: string = 'default'): void {
    // Apply optimistic update immediately
    this._optimisticState = { ...this._optimisticState, ...updates };
    this._isDirty = true;

    // Notify subscribers with optimistic state
    this._notifySubscribers(true);

    // Handle debounced commit
    this._scheduleCommit(updates, key);
  }

  /**
   * Apply an immediate update (no debouncing)
   *
   * Updates both optimistic and actual state immediately.
   *
   * @param updates - Partial state updates
   */
  public updateImmediate(updates: Partial<T>): void {
    this._optimisticState = { ...this._optimisticState, ...updates };
    this._actualState = { ...this._actualState, ...updates };

    // Clear any pending updates for affected keys
    this._clearPendingForUpdates(updates);

    this._notifySubscribers(false);
    this._commitIfNeeded();
  }

  /**
   * Rollback optimistic changes to actual state
   *
   * Use this when an operation fails and you need to revert UI.
   */
  public rollback(): void {
    // Cancel all pending updates
    this._clearAllPending();

    // Restore optimistic state to actual state
    this._optimisticState = { ...this._actualState };
    this._isDirty = false;

    this._notifySubscribers(false);
  }

  /**
   * Commit all pending changes immediately
   *
   * Forces immediate commit of all pending updates.
   */
  public flush(): void {
    // Clear all pending timeouts
    this._pendingUpdates.forEach(pending => {
      clearTimeout(pending.timeout);
    });

    // Apply all pending updates to actual state
    const allUpdates: Record<string, unknown> = {};
    this._pendingUpdates.forEach(pending => {
      Object.assign(allUpdates, pending.updates);
    });

    if (Object.keys(allUpdates).length > 0) {
      this._actualState = { ...this._actualState, ...allUpdates as Partial<T> };
    }

    this._pendingUpdates.clear();
    this._isDirty = false;

    this._commitIfNeeded();
  }

  /**
   * Reset state to a new initial value
   *
   * @param newState - The new state
   */
  public reset(newState: T): void {
    this._clearAllPending();
    this._actualState = { ...newState };
    this._optimisticState = { ...newState };
    this._isDirty = false;

    this._notifySubscribers(false);
  }

  /**
   * Subscribe to state changes
   *
   * @param callback - Function called when state changes
   * @returns Unsubscribe function
   */
  public subscribe(callback: OptimisticSubscriber<T>): () => void {
    this._subscribers.add(callback);

    return () => {
      this._subscribers.delete(callback);
    };
  }

  /**
   * Set the commit callback
   *
   * @param callback - Function called when state is committed
   */
  public setOnCommit(callback: CommitCallback<T>): void {
    this._onCommit = callback;
  }

  /**
   * Get pending update keys
   */
  public get pendingKeys(): string[] {
    return Array.from(this._pendingUpdates.keys());
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    this._clearAllPending();
    this._subscribers.clear();
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Schedule a debounced commit
   */
  private _scheduleCommit(updates: Partial<T>, key: string): void {
    // Clear existing pending update for this key
    const existing = this._pendingUpdates.get(key);
    if (existing) {
      clearTimeout(existing.timeout);
    }

    // Schedule new commit
    const timeout = setTimeout(() => {
      this._commitPending(key);
    }, this._debounceMs);

    this._pendingUpdates.set(key, {
      timeout,
      updates: updates as Record<string, unknown>,
    });
  }

  /**
   * Commit a pending update
   */
  private _commitPending(key: string): void {
    const pending = this._pendingUpdates.get(key);
    if (!pending) return;

    // Apply to actual state
    this._actualState = { ...this._actualState, ...pending.updates as Partial<T> };
    this._pendingUpdates.delete(key);

    // Check if still dirty
    this._isDirty = this._pendingUpdates.size > 0;

    // Notify subscribers
    this._notifySubscribers(false);

    // Call commit callback
    this._commitIfNeeded();
  }

  /**
   * Call commit callback if configured
   */
  private _commitIfNeeded(): void {
    if (this._onCommit && !this._isDirty) {
      try {
        this._onCommit(this._actualState);
      } catch (error) {
        console.error('OptimisticStateManager: Commit callback error:', error);
      }
    }
  }

  /**
   * Clear all pending updates
   */
  private _clearAllPending(): void {
    this._pendingUpdates.forEach(pending => {
      clearTimeout(pending.timeout);
    });
    this._pendingUpdates.clear();
  }

  /**
   * Clear pending updates for specific keys in updates object
   */
  private _clearPendingForUpdates(updates: Partial<T>): void {
    const updateKeys = Object.keys(updates);

    this._pendingUpdates.forEach((pending, key) => {
      const pendingKeys = Object.keys(pending.updates);
      if (pendingKeys.some(pk => updateKeys.includes(pk))) {
        clearTimeout(pending.timeout);
        this._pendingUpdates.delete(key);
      }
    });
  }

  /**
   * Notify all subscribers
   */
  private _notifySubscribers(isOptimistic: boolean): void {
    const state = this.state;
    this._subscribers.forEach(callback => {
      try {
        callback(state, isOptimistic);
      } catch (error) {
        console.error('OptimisticStateManager: Subscriber error:', error);
      }
    });
  }
}

/**
 * Create an optimistic state manager
 *
 * Factory function for creating OptimisticStateManager instances.
 *
 * @param initialState - Initial state
 * @param debounceMs - Debounce delay
 * @param onCommit - Commit callback
 * @returns A new OptimisticStateManager instance
 */
export function createOptimisticStateManager<T extends object>(
  initialState: T,
  debounceMs?: number,
  onCommit?: CommitCallback<T>
): OptimisticStateManager<T> {
  return new OptimisticStateManager(initialState, debounceMs, onCommit);
}
