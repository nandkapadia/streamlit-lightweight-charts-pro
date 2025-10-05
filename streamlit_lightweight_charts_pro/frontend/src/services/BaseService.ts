/**
 * @fileoverview Base service class for common service patterns
 *
 * Provides DRY-compliant base functionality for services including
 * singleton patterns, event management, and lifecycle methods.
 */

import { EventEmitter } from 'events';

/**
 * Base service configuration
 */
export interface BaseServiceConfig {
  /** Service name for logging and debugging */
  name: string;
  /** Whether to enable singleton pattern */
  singleton?: boolean;
  /** Whether to enable event emission */
  enableEvents?: boolean;
  /** Debug logging level */
  debugLevel?: 'silent' | 'error' | 'warn' | 'info' | 'debug';
}

/**
 * Service lifecycle events
 */
export interface ServiceLifecycleEvents {
  initialized: () => void;
  destroyed: () => void;
  error: (error: Error) => void;
}

/**
 * Base service class with common patterns
 */
export abstract class BaseService extends EventEmitter {
  protected config: BaseServiceConfig;
  protected isInitialized: boolean = false;
  protected isDestroyed: boolean = false;
  private static instances: Map<string, BaseService> = new Map();

  constructor(config: BaseServiceConfig) {
    super();
    this.config = {
      singleton: true,
      enableEvents: true,
      debugLevel: 'warn',
      ...config,
    };

    this.initialize();
  }

  /**
   * Get singleton instance (if singleton is enabled)
   */
  public static getInstance<T extends BaseService>(
    this: new (config: BaseServiceConfig) => T,
    config: BaseServiceConfig
  ): T {
    if (!config.singleton) {
      return new this(config);
    }

    const key = config.name;
    if (!BaseService.instances.has(key)) {
      BaseService.instances.set(key, new this(config));
    }

    return BaseService.instances.get(key) as T;
  }

  /**
   * Initialize the service
   */
  protected initialize(): void {
    if (this.isInitialized) {
      this.log('warn', 'Service already initialized');
      return;
    }

    try {
      this.onInitialize();
      this.isInitialized = true;

      if (this.config.enableEvents) {
        this.emit('initialized');
      }

      this.log('info', 'Service initialized successfully');
    } catch (error) {
      this.log('error', 'Failed to initialize service', error);
      if (this.config.enableEvents) {
        this.emit('error', error);
      }
      throw error;
    }
  }

  /**
   * Destroy the service
   */
  public destroy(): void {
    if (this.isDestroyed) {
      this.log('warn', 'Service already destroyed');
      return;
    }

    try {
      this.onDestroy();
      this.isDestroyed = true;

      if (this.config.enableEvents) {
        this.emit('destroyed');
      }

      // Remove from singleton instances
      if (this.config.singleton) {
        BaseService.instances.delete(this.config.name);
      }

      // Remove all event listeners
      this.removeAllListeners();

      this.log('info', 'Service destroyed successfully');
    } catch (error) {
      this.log('error', 'Failed to destroy service', error);
      if (this.config.enableEvents) {
        this.emit('error', error);
      }
    }
  }

  /**
   * Check if service is initialized
   */
  public get initialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Check if service is destroyed
   */
  public get destroyed(): boolean {
    return this.isDestroyed;
  }

  /**
   * Get service name
   */
  public get name(): string {
    return this.config.name;
  }

  /**
   * Log message with configured level
   */
  protected log(level: 'debug' | 'info' | 'warn' | 'error', message: string, ...args: any[]): void {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    const configLevel = levels[this.config.debugLevel as keyof typeof levels] || 2;
    const messageLevel = levels[level];

    if (messageLevel >= configLevel) {
      const prefix = `[${this.config.name}]`;
      console[level](prefix, message, ...args);
    }
  }

  /**
   * Emit event if events are enabled
   */
  protected emitEvent(event: string, ...args: any[]): boolean {
    if (this.config.enableEvents && !this.isDestroyed) {
      return this.emit(event, ...args);
    }
    return false;
  }

  /**
   * Abstract method for service-specific initialization
   */
  protected abstract onInitialize(): void;

  /**
   * Abstract method for service-specific cleanup
   */
  protected abstract onDestroy(): void;

  /**
   * Validate service state
   */
  protected validateState(): void {
    if (this.isDestroyed) {
      throw new Error(`Service ${this.config.name} has been destroyed`);
    }

    if (!this.isInitialized) {
      throw new Error(`Service ${this.config.name} is not initialized`);
    }
  }
}

/**
 * Service registry for managing multiple services
 */
export class ServiceRegistry {
  private services: Map<string, BaseService> = new Map();

  /**
   * Register a service
   */
  register(service: BaseService): void {
    this.services.set(service.name, service);
  }

  /**
   * Get a service by name
   */
  get<T extends BaseService>(name: string): T | undefined {
    return this.services.get(name) as T;
  }

  /**
   * Check if service exists
   */
  has(name: string): boolean {
    return this.services.has(name);
  }

  /**
   * Unregister a service
   */
  unregister(name: string): boolean {
    const service = this.services.get(name);
    if (service) {
      service.destroy();
      return this.services.delete(name);
    }
    return false;
  }

  /**
   * Destroy all services
   */
  destroyAll(): void {
    for (const [_, service] of this.services) {
      service.destroy();
    }
    this.services.clear();
  }

  /**
   * Get all service names
   */
  getServiceNames(): string[] {
    return Array.from(this.services.keys());
  }

  /**
   * Get service count
   */
  getServiceCount(): number {
    return this.services.size;
  }
}

/**
 * Global service registry instance
 */
export const globalServiceRegistry = new ServiceRegistry();
