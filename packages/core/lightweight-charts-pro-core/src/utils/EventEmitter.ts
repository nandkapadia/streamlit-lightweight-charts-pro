/**
 * @fileoverview Browser-compatible EventEmitter implementation
 *
 * Simple event emitter for browser environments that replaces Node.js 'events' module.
 * Provides basic event handling functionality needed by TooltipManager.
 */

type EventListener = (...args: any[]) => void;

/**
 * Simple EventEmitter implementation for browser environments
 */
export class EventEmitter {
  private events: Map<string | symbol, EventListener[]> = new Map();

  /**
   * Add an event listener
   */
  on(event: string | symbol, listener: EventListener): this {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(listener);
    return this;
  }

  /**
   * Add a one-time event listener
   */
  once(event: string | symbol, listener: EventListener): this {
    const onceWrapper = (...args: any[]) => {
      this.off(event, onceWrapper);
      listener(...args);
    };
    return this.on(event, onceWrapper);
  }

  /**
   * Remove an event listener
   */
  off(event: string | symbol, listener: EventListener): this {
    const listeners = this.events.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
      if (listeners.length === 0) {
        this.events.delete(event);
      }
    }
    return this;
  }

  /**
   * Emit an event
   */
  emit(event: string | symbol, ...args: any[]): boolean {
    const listeners = this.events.get(event);
    if (listeners && listeners.length > 0) {
      listeners.forEach(listener => listener(...args));
      return true;
    }
    return false;
  }

  /**
   * Remove all listeners for an event, or all events if no event specified
   */
  removeAllListeners(event?: string | symbol): this {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
    return this;
  }

  /**
   * Get the number of listeners for an event
   */
  listenerCount(event: string | symbol): number {
    const listeners = this.events.get(event);
    return listeners ? listeners.length : 0;
  }

  /**
   * Set max listeners (no-op for browser compatibility)
   * This method exists for Node.js EventEmitter API compatibility
   */
  setMaxListeners(_n: number): this {
    // No-op: browser version doesn't enforce max listeners
    return this;
  }
}
