/**
 * @fileoverview Event listener management with automatic cleanup
 *
 * Provides a centralized system for managing DOM event listeners with
 * automatic tracking and cleanup. This replaces React's automatic
 * event listener cleanup in pure TypeScript.
 *
 * @example
 * ```typescript
 * const eventManager = new EventManager();
 *
 * // Add listeners (automatically tracked)
 * eventManager.addEventListener(button, 'click', handleClick);
 * eventManager.addEventListener(document, 'keydown', handleKeydown);
 *
 * // Clean up all listeners at once
 * eventManager.destroy();
 * ```
 */

/**
 * Event listener entry for tracking
 */
interface ListenerEntry {
  element: EventTarget;
  event: string;
  handler: EventListener;
  options?: boolean | AddEventListenerOptions;
}

/**
 * Event listener manager with automatic cleanup tracking
 *
 * Tracks all added event listeners and provides methods to remove
 * them individually or all at once. Essential for preventing memory
 * leaks in dynamically created DOM elements.
 */
export class EventManager {
  private _listeners: ListenerEntry[] = [];
  private _isDestroyed: boolean = false;

  /**
   * Add an event listener with automatic tracking
   *
   * @param element - The element to attach the listener to
   * @param event - The event type (e.g., 'click', 'keydown')
   * @param handler - The event handler function
   * @param options - Optional event listener options
   */
  public addEventListener(
    element: EventTarget,
    event: string,
    handler: EventListener,
    options?: boolean | AddEventListenerOptions
  ): void {
    if (this._isDestroyed) {
      console.warn('EventManager: Cannot add listener to destroyed instance');
      return;
    }

    element.addEventListener(event, handler, options);
    this._listeners.push({ element, event, handler, options });
  }

  /**
   * Remove a specific event listener
   *
   * @param element - The element to remove the listener from
   * @param event - The event type
   * @param handler - The event handler function to remove
   */
  public removeEventListener(
    element: EventTarget,
    event: string,
    handler: EventListener
  ): void {
    const index = this._listeners.findIndex(
      entry =>
        entry.element === element &&
        entry.event === event &&
        entry.handler === handler
    );

    if (index !== -1) {
      const entry = this._listeners[index];
      element.removeEventListener(event, handler, entry.options);
      this._listeners.splice(index, 1);
    }
  }

  /**
   * Remove all listeners for a specific element
   *
   * @param element - The element to remove all listeners from
   */
  public removeAllForElement(element: EventTarget): void {
    const toRemove = this._listeners.filter(entry => entry.element === element);

    toRemove.forEach(entry => {
      entry.element.removeEventListener(entry.event, entry.handler, entry.options);
    });

    this._listeners = this._listeners.filter(entry => entry.element !== element);
  }

  /**
   * Remove all listeners for a specific event type
   *
   * @param event - The event type to remove listeners for
   */
  public removeAllForEvent(event: string): void {
    const toRemove = this._listeners.filter(entry => entry.event === event);

    toRemove.forEach(entry => {
      entry.element.removeEventListener(entry.event, entry.handler, entry.options);
    });

    this._listeners = this._listeners.filter(entry => entry.event !== event);
  }

  /**
   * Get the count of tracked listeners
   */
  public get listenerCount(): number {
    return this._listeners.length;
  }

  /**
   * Check if the manager has been destroyed
   */
  public get isDestroyed(): boolean {
    return this._isDestroyed;
  }

  /**
   * Remove all tracked event listeners and mark as destroyed
   *
   * Call this when the component/dialog is being unmounted or destroyed.
   */
  public destroy(): void {
    if (this._isDestroyed) {
      return;
    }

    this._listeners.forEach(({ element, event, handler, options }) => {
      try {
        element.removeEventListener(event, handler, options);
      } catch (error) {
        console.error('EventManager: Error removing listener:', error);
      }
    });

    this._listeners = [];
    this._isDestroyed = true;
  }

  /**
   * Clear all listeners without marking as destroyed
   *
   * Useful for resetting the manager while keeping it usable.
   */
  public clear(): void {
    this._listeners.forEach(({ element, event, handler, options }) => {
      try {
        element.removeEventListener(event, handler, options);
      } catch (error) {
        console.error('EventManager: Error removing listener:', error);
      }
    });

    this._listeners = [];
  }
}

/**
 * Create a new EventManager instance
 *
 * Factory function for creating EventManager instances.
 *
 * @returns A new EventManager instance
 */
export function createEventManager(): EventManager {
  return new EventManager();
}

/**
 * Utility to add a one-time event listener
 *
 * @param element - The element to attach the listener to
 * @param event - The event type
 * @param handler - The event handler function
 */
export function addOneTimeListener(
  element: EventTarget,
  event: string,
  handler: EventListener
): void {
  const wrappedHandler = (e: Event) => {
    element.removeEventListener(event, wrappedHandler);
    handler(e);
  };
  element.addEventListener(event, wrappedHandler);
}
