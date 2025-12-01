/**
 * @fileoverview Keyed Singleton Manager
 *
 * Provides a reusable keyed singleton pattern for classes that need multiple
 * instances identified by keys (e.g., chartId, paneId combinations).
 *
 * Eliminates code duplication across manager classes that implement
 * manual keyed singleton patterns.
 *
 * Features:
 * - Support for constructor arguments
 * - Key-based instance management
 * - Automatic cleanup with destroy() pattern
 * - Type-safe API
 *
 * Usage:
 * ```typescript
 * class MyManager extends KeyedSingletonManager<MyManager> {
 *   constructor(arg1: string, arg2: number) {
 *     super();
 *     // ... initialization
 *   }
 *
 *   public destroy(): void {
 *     // ... cleanup
 *   }
 * }
 *
 * // Get or create instance
 * const instance = MyManager.getInstance('key', () => new MyManager('foo', 42));
 *
 * // Destroy instance
 * MyManager.destroyInstance('key');
 * ```
 */

/**
 * Interface for classes that can be destroyed
 */
export interface Destroyable {
  destroy(): void;
}

/**
 * Base class for keyed singleton pattern with constructor arguments
 *
 * Provides reusable getInstance/destroyInstance pattern that eliminates
 * code duplication across manager classes.
 *
 * @template _T - The class type (should be the subclass itself)
 */
export abstract class KeyedSingletonManager<_T extends Destroyable> implements Destroyable {
  private static instanceMaps = new Map<string, Map<string, any>>();

  /**
   * Get or create a singleton instance for a given key
   *
   * @param className - Class name for instance mapping
   * @param key - Unique identifier for the instance
   * @param factory - Factory function to create new instance if needed
   * @returns The singleton instance
   */
  protected static getOrCreateInstance<T>(className: string, key: string, factory: () => T): T {
    // Get or create the instance map for this class
    if (!KeyedSingletonManager.instanceMaps.has(className)) {
      KeyedSingletonManager.instanceMaps.set(className, new Map<string, T>());
    }

    const instanceMap = KeyedSingletonManager.instanceMaps.get(className);
    if (!instanceMap) {
      throw new Error(`Failed to get instance map for class ${className}`);
    }

    // Get or create the instance
    if (!instanceMap.has(key)) {
      instanceMap.set(key, factory());
    }

    return instanceMap.get(key) as T;
  }

  /**
   * Destroy a singleton instance for a given key
   *
   * @param className - Class name for instance mapping
   * @param key - Unique identifier for the instance
   */
  protected static destroyInstanceByKey(className: string, key: string): void {
    const instanceMap = KeyedSingletonManager.instanceMaps.get(className);

    if (instanceMap && instanceMap.has(key)) {
      const instance = instanceMap.get(key) as Destroyable;
      if (instance && typeof instance.destroy === 'function') {
        instance.destroy();
      }
      instanceMap.delete(key);
    }
  }

  /**
   * Check if an instance exists for a given key
   *
   * @param className - Class name for instance mapping
   * @param key - Unique identifier to check
   * @returns True if instance exists
   */
  protected static hasInstanceWithKey(className: string, key: string): boolean {
    const instanceMap = KeyedSingletonManager.instanceMaps.get(className);
    return instanceMap ? instanceMap.has(key) : false;
  }

  /**
   * Get all instance keys for this class
   *
   * @param className - Class name for instance mapping
   * @returns Array of instance keys
   */
  protected static getInstanceKeys(className: string): string[] {
    const instanceMap = KeyedSingletonManager.instanceMaps.get(className);
    return instanceMap ? Array.from(instanceMap.keys()) : [];
  }

  /**
   * Clear all instances for this class
   *
   * @param className - Class name for instance mapping
   */
  protected static clearAllInstances(className: string): void {
    const instanceMap = KeyedSingletonManager.instanceMaps.get(className);

    if (instanceMap) {
      instanceMap.forEach(instance => {
        if (instance && typeof instance.destroy === 'function') {
          instance.destroy();
        }
      });
      instanceMap.clear();
    }
  }

  /**
   * Abstract destroy method - subclasses must implement
   */
  public abstract destroy(): void;
}

/**
 * Helper function to create instance keys from multiple parameters
 *
 * @param parts - Parts to join into a key
 * @returns Composite key string
 */
export function createInstanceKey(...parts: (string | number | undefined)[]): string {
  return parts.map(part => (part === undefined ? 'default' : String(part))).join('-');
}
