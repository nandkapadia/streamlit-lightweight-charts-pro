/**
 * @fileoverview Base singleton class to eliminate DRY violations
 *
 * Provides a reusable singleton pattern implementation to eliminate
 * code duplication across services and utilities.
 */

/**
 * Base singleton class with common singleton functionality
 *
 * @template T - The class type that extends this base
 */
export abstract class SingletonBase<T extends SingletonBase<T>> {
  private static instances: Map<string, SingletonBase<any>> = new Map();

  /**
   * Get singleton instance for a specific class
   *
   * @param constructor - The class constructor
   * @param key - Optional key for multiple instances of same class
   * @returns Singleton instance
   */
  public static getInstance<T extends SingletonBase<T>>(
    constructor: new () => T,
    key: string = constructor.name
  ): T {
    if (!SingletonBase.instances.has(key)) {
      SingletonBase.instances.set(key, new constructor());
    }
    return SingletonBase.instances.get(key) as T;
  }

  /**
   * Clear singleton instance (useful for testing)
   *
   * @param key - The key to clear, or clear all if not provided
   */
  public static clearInstance(key?: string): void {
    if (key) {
      SingletonBase.instances.delete(key);
    } else {
      SingletonBase.instances.clear();
    }
  }

  /**
   * Check if instance exists
   *
   * @param key - The key to check
   * @returns True if instance exists
   */
  public static hasInstance(key: string): boolean {
    return SingletonBase.instances.has(key);
  }

  /**
   * Get all instance keys (useful for debugging)
   *
   * @returns Array of instance keys
   */
  protected static getInstanceKeys(): string[] {
    return Array.from(SingletonBase.instances.keys());
  }

  /**
   * Get instance count (useful for monitoring)
   *
   * @returns Number of active instances
   */
  protected static getInstanceCount(): number {
    return SingletonBase.instances.size;
  }
}

/**
 * Decorator for automatic singleton implementation
 *
 * @param key - Optional key for the singleton instance
 */
export function Singleton(key?: string) {
  return function <T extends new (...args: any[]) => any>(constructor: T) {
    const instanceKey = key || constructor.name;

    // Add static getInstance method to the class
    (constructor as any).getInstance = function () {
      return SingletonBase.getInstance(constructor, instanceKey);
    };

    // Add static clearInstance method to the class
    (constructor as any).clearInstance = function () {
      return SingletonBase.clearInstance(instanceKey);
    };

    // Add static hasInstance method to the class
    (constructor as any).hasInstance = function () {
      return SingletonBase.hasInstance(instanceKey);
    };

    return constructor;
  };
}

/**
 * Factory function for creating singleton classes
 *
 * @param constructor - The class constructor
 * @param key - Optional key for the singleton
 * @returns Singleton instance
 */
export function createSingleton<T>(constructor: any, key?: string): T {
  const instanceKey = key || constructor.name;
  return SingletonBase.getInstance(constructor as any, instanceKey) as any;
}
