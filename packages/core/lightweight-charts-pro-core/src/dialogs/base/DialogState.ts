/**
 * @fileoverview Reactive state management for dialogs
 *
 * Provides a simple reactive state container that notifies subscribers
 * when state changes. This replaces React's useState hook in pure TypeScript.
 *
 * @example
 * ```typescript
 * const state = new DialogState({ count: 0, name: '' });
 *
 * // Subscribe to changes
 * const unsubscribe = state.subscribe((newState) => {
 *   console.log('State changed:', newState);
 * });
 *
 * // Update state
 * state.set({ count: 1 }); // Triggers subscribers
 *
 * // Clean up
 * unsubscribe();
 * ```
 */

/**
 * Subscription callback type
 */
export type StateSubscriber<T> = (state: T) => void;

/**
 * Unsubscribe function type
 */
export type Unsubscribe = () => void;

/**
 * Reactive state container for dialog components
 *
 * Replaces React's useState with a subscriber-based pattern.
 * Changes to state automatically notify all subscribers.
 *
 * @template T The state object type
 */
export class DialogState<T extends object> {
  private _state: T;
  private _subscribers: Set<StateSubscriber<T>> = new Set();

  /**
   * Create a new DialogState instance
   *
   * @param initialState - The initial state object
   */
  constructor(initialState: T) {
    this._state = { ...initialState };
  }

  /**
   * Get the current state
   *
   * @returns A copy of the current state
   */
  public get(): T {
    return { ...this._state };
  }

  /**
   * Get a specific property from state
   *
   * @param key - The property key to retrieve
   * @returns The value of the property
   */
  public getProperty<K extends keyof T>(key: K): T[K] {
    return this._state[key];
  }

  /**
   * Set state with partial updates
   *
   * Merges the updates with existing state and notifies all subscribers.
   *
   * @param updates - Partial state updates to merge
   */
  public set(updates: Partial<T>): void {
    const prevState = this._state;
    this._state = { ...this._state, ...updates };

    // Only notify if state actually changed
    if (this._hasChanged(prevState, this._state, updates)) {
      this._notify();
    }
  }

  /**
   * Replace the entire state
   *
   * @param newState - The new complete state
   */
  public replace(newState: T): void {
    this._state = { ...newState };
    this._notify();
  }

  /**
   * Reset state to initial values
   *
   * @param initialState - The state to reset to
   */
  public reset(initialState: T): void {
    this._state = { ...initialState };
    this._notify();
  }

  /**
   * Subscribe to state changes
   *
   * @param callback - Function to call when state changes
   * @returns Unsubscribe function
   */
  public subscribe(callback: StateSubscriber<T>): Unsubscribe {
    this._subscribers.add(callback);

    return () => {
      this._subscribers.delete(callback);
    };
  }

  /**
   * Get the number of active subscribers
   */
  public get subscriberCount(): number {
    return this._subscribers.size;
  }

  /**
   * Remove all subscribers
   */
  public clearSubscribers(): void {
    this._subscribers.clear();
  }

  /**
   * Check if state has actually changed
   */
  private _hasChanged(prevState: T, newState: T, updates: Partial<T>): boolean {
    for (const key of Object.keys(updates) as Array<keyof T>) {
      if (prevState[key] !== newState[key]) {
        return true;
      }
    }
    return false;
  }

  /**
   * Notify all subscribers of state change
   */
  private _notify(): void {
    const currentState = this.get();
    this._subscribers.forEach(callback => {
      try {
        callback(currentState);
      } catch (error) {
        console.error('Error in DialogState subscriber:', error);
      }
    });
  }
}

/**
 * Create a dialog state with initial values
 *
 * Factory function for creating DialogState instances.
 *
 * @param initialState - Initial state values
 * @returns A new DialogState instance
 */
export function createDialogState<T extends object>(initialState: T): DialogState<T> {
  return new DialogState(initialState);
}
