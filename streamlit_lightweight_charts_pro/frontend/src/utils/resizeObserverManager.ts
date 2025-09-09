/**
 * Utility class for managing ResizeObservers with automatic cleanup
 */
export class ResizeObserverManager {
  private observers = new Map<string, ResizeObserver>()
  private callbacks = new Map<
    string,
    (entry: ResizeObserverEntry | ResizeObserverEntry[]) => void
  >()

  /**
   * Add a resize observer for a specific target
   */
  addObserver(
    id: string,
    target: Element,
    callback: (entry: ResizeObserverEntry | ResizeObserverEntry[]) => void,
    options: {
      throttleMs?: number
      debounceMs?: number
    } = {}
  ): void {
    // Remove existing observer if it exists
    this.removeObserver(id)

    const {throttleMs = 100, debounceMs = 0} = options

    // Create throttled/debounced callback
    let timeoutId: NodeJS.Timeout | null = null
    let lastCallTime = 0

    const wrappedCallback = (entry: ResizeObserverEntry) => {
      const now = Date.now()

      // Throttling
      if (now - lastCallTime < throttleMs) {
        return
      }

      // Debouncing
      if (debounceMs > 0) {
        if (timeoutId) {
          clearTimeout(timeoutId)
        }
        timeoutId = setTimeout(() => {
          callback(entry)
          timeoutId = null
        }, debounceMs)
      } else {
        callback(entry)
        lastCallTime = now
      }
    }

    try {
      const observer = new ResizeObserver(entries => {
        // Handle both single entry and array of entries
        if (entries.length === 1) {
          wrappedCallback(entries[0])
        } else {
          entries.forEach(wrappedCallback)
        }
      })

      observer.observe(target)
      this.observers.set(id, observer)
      this.callbacks.set(id, callback)
    } catch (error) {
      console.error(`❌ Failed to create ResizeObserver for ${id}:`, error)
    }
  }

  /**
   * Remove a specific observer
   */
  removeObserver(id: string): void {
    const observer = this.observers.get(id)
    if (observer) {
      try {
        observer.disconnect()
        this.observers.delete(id)
        this.callbacks.delete(id)
      } catch (error) {
        console.warn(`⚠️ Error removing ResizeObserver for ${id}:`, error)
      }
    }
  }

  /**
   * Check if an observer exists
   */
  hasObserver(id: string): boolean {
    return this.observers.has(id)
  }

  /**
   * Get the number of active observers
   */
  getObserverCount(): number {
    return this.observers.size
  }

  /**
   * Cleanup all observers
   */
  cleanup(): void {
    this.observers.forEach((observer, id) => {
      try {
        observer.disconnect()
      } catch (error) {
        console.warn(`⚠️ Error cleaning up ResizeObserver ${id}:`, error)
      }
    })

    this.observers.clear()
    this.callbacks.clear()
  }

  /**
   * Get all observer IDs
   */
  getObserverIds(): string[] {
    return Array.from(this.observers.keys())
  }

  /**
   * Pause all observers temporarily
   */
  pauseAll(): void {
    this.observers.forEach((observer, id) => {
      try {
        observer.disconnect()
      } catch (error) {
        console.warn(`⚠️ Error pausing ResizeObserver ${id}:`, error)
      }
    })
  }

  /**
   * Resume all observers
   */
  resumeAll(): void {
    this.observers.forEach((observer, id) => {})
  }
}
