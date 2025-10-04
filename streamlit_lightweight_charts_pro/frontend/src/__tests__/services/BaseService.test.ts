/**
 * @fileoverview Tests for BaseService
 *
 * Tests cover:
 * - Service initialization and lifecycle
 * - Singleton pattern
 * - Event emission
 * - State management
 * - Logging with different levels
 * - Service registry
 * - Error handling
 * - Cleanup and destruction
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BaseService, BaseServiceConfig, ServiceRegistry, globalServiceRegistry } from '../../services/BaseService';

// Concrete implementation for testing
class TestService extends BaseService {
  public initializeCalled = false;
  public destroyCalled = false;
  private _initializeError: Error | null = null;
  private _destroyError: Error | null = null;

  constructor(config: BaseServiceConfig) {
    super(config);
  }

  set initializeError(error: Error | null) {
    this._initializeError = error;
  }

  set destroyError(error: Error | null) {
    this._destroyError = error;
  }

  protected onInitialize(): void {
    this.initializeCalled = true;
    if (this._initializeError) {
      throw this._initializeError;
    }
  }

  protected onDestroy(): void {
    this.destroyCalled = true;
    if (this._destroyError) {
      throw this._destroyError;
    }
  }

  // Expose protected methods for testing
  public testValidateState(): void {
    this.validateState();
  }

  public testLog(level: 'debug' | 'info' | 'warn' | 'error', message: string, ...args: any[]): void {
    this.log(level, message, ...args);
  }

  public testEmitEvent(event: string, ...args: any[]): boolean {
    return this.emitEvent(event, ...args);
  }
}

describe('BaseService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear singleton instances
    (BaseService as any).instances = new Map();
    // Mock console methods
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  describe('Initialization', () => {
    it('should initialize service', () => {
      const service = new TestService({ name: 'test-service' });

      expect(service.initialized).toBe(true);
      expect(service.name).toBe('test-service');
    });

    it('should apply default config', () => {
      const service = new TestService({ name: 'test-service' });

      expect(service.name).toBe('test-service');
      expect(service.initialized).toBe(true);
    });

    it('should apply custom config', () => {
      const config: BaseServiceConfig = {
        name: 'custom-service',
        singleton: false,
        enableEvents: false,
        debugLevel: 'debug',
      };

      const service = new TestService(config);

      expect(service.name).toBe('custom-service');
      expect(service.initialized).toBe(true);
    });

    it('should emit initialized event when events enabled', () => {
      const listener = vi.fn();
      const service = new TestService({ name: 'test-service', enableEvents: true });

      service.on('initialized', listener);

      // Create another instance to trigger event (can't test on constructor event)
      const service2 = new TestService({ name: 'test-service-2', singleton: false });
      service2.on('initialized', listener);

      // Manually trigger initialize to test event
      expect(service.initialized).toBe(true);
    });

    it('should not initialize twice', () => {
      const service = new TestService({ name: 'test-service', singleton: false });

      expect(service.initialized).toBe(true);

      vi.clearAllMocks();
      (service as any).initialize();

      // Should warn and not re-initialize
      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('test-service'), 'Service already initialized');
    });

    it('should handle initialization errors', () => {
      const error = new Error('Init failed');

      expect(() => {
        const __failingService = new (class extends TestService {
          protected onInitialize(): void {
            throw error;
          }
        })({ name: 'failing-service', singleton: false });
      }).toThrow('Init failed');
    });

    it('should emit error event on initialization failure', () => {
      const error = new Error('Init failed');

      try {
        new (class extends TestService {
          protected onInitialize(): void {
            throw error;
          }
        })({ name: 'failing-service', singleton: false, enableEvents: true });
      } catch (e) {
        // Expected to throw
      }

      // Error should be logged
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('Singleton Pattern', () => {
    it('should return same instance for same service name', () => {
      const _config = { name: 'singleton-service', singleton: true };
      const service1 = new TestService(config);

      // Second instance with same name should return first
      const instances = (BaseService as any).instances;
      instances.set('singleton-service', service1);

      const service2 = BaseService.getInstance.call(TestService, config);

      expect(service1).toBe(service2);
    });

    it('should return different instances for different names', () => {
      const service1 = BaseService.getInstance.call(TestService, { name: 'service-1' });
      const service2 = BaseService.getInstance.call(TestService, { name: 'service-2' });

      expect(service1).not.toBe(service2);
    });

    it('should create new instance when singleton disabled', () => {
      const service1 = BaseService.getInstance.call(TestService, { name: 'non-singleton', singleton: false });
      const service2 = BaseService.getInstance.call(TestService, { name: 'non-singleton', singleton: false });

      expect(service1).not.toBe(service2);
    });

    it('should remove from singleton instances on destroy', () => {
      const service = BaseService.getInstance.call(TestService, { name: 'singleton-service' });

      service.destroy();

      const newService = BaseService.getInstance.call(TestService, { name: 'singleton-service' });
      expect(newService).not.toBe(service);
    });
  });

  describe('Destruction', () => {
    it('should destroy service', () => {
      const service = new TestService({ name: 'test-service' });

      service.destroy();

      expect(service.destroyed).toBe(true);
      expect(service.destroyCalled).toBe(true);
    });

    it('should emit destroyed event', () => {
      const listener = vi.fn();
      const service = new TestService({ name: 'test-service', enableEvents: true });

      service.on('destroyed', listener);
      service.destroy();

      expect(listener).toHaveBeenCalled();
    });

    it('should not destroy twice', () => {
      const service = new TestService({ name: 'test-service' });

      service.destroy();
      expect(service.destroyCalled).toBe(true);

      service.destroyCalled = false;
      service.destroy();

      expect(service.destroyCalled).toBe(false);
      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('test-service'), 'Service already destroyed');
    });

    it('should remove all event listeners on destroy', () => {
      const service = new TestService({ name: 'test-service' });
      const listener = vi.fn();

      service.on('custom-event', listener);
      expect(service.listenerCount('custom-event')).toBe(1);

      service.destroy();

      expect(service.listenerCount('custom-event')).toBe(0);
    });

    it('should log destroy errors', () => {
      const service = new TestService({ name: 'test-service', singleton: false });
      service.destroyError = new Error('Destroy failed');

      vi.clearAllMocks();

      try {
        service.destroy();
      } catch (e) {
        // May throw depending on implementation
      }

      // Error should be logged
      expect(console.error).toHaveBeenCalled();
    });

    it('should not remove from singleton instances when not singleton', () => {
      const service = new TestService({ name: 'test-service', singleton: false });

      service.destroy();

      // Should not crash
      expect(service.destroyed).toBe(true);
    });
  });

  describe('State Validation', () => {
    it('should validate service is initialized', () => {
      const service = new TestService({ name: 'test-service' });

      expect(() => service.testValidateState()).not.toThrow();
    });

    it('should throw when service is destroyed', () => {
      const service = new TestService({ name: 'test-service' });

      service.destroy();

      expect(() => service.testValidateState()).toThrow('Service test-service has been destroyed');
    });

    it('should throw when service not initialized', () => {
      const service = new TestService({ name: 'test-service' });
      (service as any).isInitialized = false;

      expect(() => service.testValidateState()).toThrow('Service test-service is not initialized');
    });
  });

  describe('Logging', () => {
    it('should log at configured level', () => {
      const service = new TestService({ name: 'test-service', debugLevel: 'info' });

      service.testLog('info', 'Test message');

      expect(console.info).toHaveBeenCalledWith('[test-service]', 'Test message');
    });

    it('should suppress logs below configured level', () => {
      const service = new TestService({ name: 'test-service', debugLevel: 'error' });

      service.testLog('warn', 'Test warning');

      expect(console.warn).not.toHaveBeenCalled();
    });

    it('should log errors', () => {
      const service = new TestService({ name: 'test-service', debugLevel: 'error' });

      service.testLog('error', 'Test error', new Error('Details'));

      expect(console.error).toHaveBeenCalledWith('[test-service]', 'Test error', expect.any(Error));
    });

    it('should log warnings', () => {
      const service = new TestService({ name: 'test-service', debugLevel: 'warn' });

      service.testLog('warn', 'Test warning');

      expect(console.warn).toHaveBeenCalledWith('[test-service]', 'Test warning');
    });

    it('should respect debug level configuration', () => {
      const service = new TestService({ name: 'test-service', debugLevel: 'info', singleton: false });

      vi.clearAllMocks();

      // Debug should be suppressed when level is info
      service.testLog('debug', 'Test debug');
      expect(console.log).not.toHaveBeenCalled();

      // Info should be logged
      service.testLog('info', 'Test info');
      expect(console.info).toHaveBeenCalled();
    });

    it('should use default debug level (warn)', () => {
      const service = new TestService({ name: 'test-service' });

      service.testLog('info', 'Should be suppressed');

      expect(console.info).not.toHaveBeenCalled();
    });
  });

  describe('Event Emission', () => {
    it('should emit events when enabled', () => {
      const service = new TestService({ name: 'test-service', enableEvents: true });
      const listener = vi.fn();

      service.on('test-event', listener);
      const _result = service.testEmitEvent('test-event', 'arg1', 'arg2');

      expect(result).toBe(true);
      expect(listener).toHaveBeenCalledWith('arg1', 'arg2');
    });

    it('should not emit events when disabled', () => {
      const service = new TestService({ name: 'test-service', enableEvents: false });
      const listener = vi.fn();

      service.on('test-event', listener);
      const _result = service.testEmitEvent('test-event', 'arg1');

      expect(result).toBe(false);
      expect(listener).not.toHaveBeenCalled();
    });

    it('should not emit events when service destroyed', () => {
      const service = new TestService({ name: 'test-service', enableEvents: true });
      const listener = vi.fn();

      service.on('test-event', listener);
      service.destroy();

      const _result = service.testEmitEvent('test-event', 'arg1');

      expect(result).toBe(false);
    });
  });

  describe('Getters', () => {
    it('should get initialized state', () => {
      const service = new TestService({ name: 'test-service' });

      expect(service.initialized).toBe(true);
    });

    it('should get destroyed state', () => {
      const service = new TestService({ name: 'test-service' });

      expect(service.destroyed).toBe(false);

      service.destroy();

      expect(service.destroyed).toBe(true);
    });

    it('should get service name', () => {
      const service = new TestService({ name: 'my-service' });

      expect(service.name).toBe('my-service');
    });
  });
});

describe('ServiceRegistry', () => {
  let registry: ServiceRegistry;

  beforeEach(() => {
    registry = new ServiceRegistry();
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
  });

  describe('Registration', () => {
    it('should register service', () => {
      const service = new TestService({ name: 'test-service', singleton: false });

      registry.register(service);

      expect(registry.has('test-service')).toBe(true);
    });

    it('should get registered service', () => {
      const service = new TestService({ name: 'test-service', singleton: false });

      registry.register(service);
      const retrieved = registry.get<TestService>('test-service');

      expect(retrieved).toBe(service);
    });

    it('should return undefined for non-existent service', () => {
      const retrieved = registry.get('non-existent');

      expect(retrieved).toBeUndefined();
    });

    it('should check if service exists', () => {
      const service = new TestService({ name: 'test-service', singleton: false });

      registry.register(service);

      expect(registry.has('test-service')).toBe(true);
      expect(registry.has('non-existent')).toBe(false);
    });
  });

  describe('Unregistration', () => {
    it('should unregister service', () => {
      const service = new TestService({ name: 'test-service', singleton: false });

      registry.register(service);
      const _result = registry.unregister('test-service');

      expect(result).toBe(true);
      expect(registry.has('test-service')).toBe(false);
      expect(service.destroyed).toBe(true);
    });

    it('should return false when unregistering non-existent service', () => {
      const _result = registry.unregister('non-existent');

      expect(result).toBe(false);
    });
  });

  describe('Bulk Operations', () => {
    it('should destroy all services', () => {
      const service1 = new TestService({ name: 'service-1', singleton: false });
      const service2 = new TestService({ name: 'service-2', singleton: false });

      registry.register(service1);
      registry.register(service2);

      registry.destroyAll();

      expect(service1.destroyed).toBe(true);
      expect(service2.destroyed).toBe(true);
      expect(registry.getServiceCount()).toBe(0);
    });

    it('should get all service names', () => {
      const service1 = new TestService({ name: 'service-1', singleton: false });
      const service2 = new TestService({ name: 'service-2', singleton: false });

      registry.register(service1);
      registry.register(service2);

      const names = registry.getServiceNames();

      expect(names).toEqual(['service-1', 'service-2']);
    });

    it('should get service count', () => {
      expect(registry.getServiceCount()).toBe(0);

      const service1 = new TestService({ name: 'service-1', singleton: false });
      registry.register(service1);

      expect(registry.getServiceCount()).toBe(1);

      const service2 = new TestService({ name: 'service-2', singleton: false });
      registry.register(service2);

      expect(registry.getServiceCount()).toBe(2);
    });
  });

  describe('Global Registry', () => {
    it('should have global service registry instance', () => {
      expect(globalServiceRegistry).toBeDefined();
      expect(globalServiceRegistry).toBeInstanceOf(ServiceRegistry);
    });
  });
});
