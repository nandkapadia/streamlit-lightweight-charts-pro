/**
 * Service Registry for Primitive System
 *
 * Manages service dependencies, initialization order, and lifecycle
 * for all primitive-related services.
 */

export interface ServiceDescriptor<T = any> {
  name: string
  factory: () => T
  dependencies: string[]
  singleton: boolean
  priority: number
}

export interface ServiceLifecycle {
  initialize?(): Promise<void> | void
  destroy?(): Promise<void> | void
}

/**
 * Centralized registry for managing primitive services
 */
export class PrimitiveServiceRegistry {
  private static instance: PrimitiveServiceRegistry
  private services = new Map<string, any>()
  private descriptors = new Map<string, ServiceDescriptor>()
  private initializationOrder: string[] = []

  static getInstance(): PrimitiveServiceRegistry {
    if (!this.instance) {
      this.instance = new PrimitiveServiceRegistry()
    }
    return this.instance
  }

  /**
   * Register a service with its dependencies
   */
  register<T>(descriptor: ServiceDescriptor<T>): void {
    this.descriptors.set(descriptor.name, descriptor)
    this.computeInitializationOrder()
  }

  /**
   * Get a service instance, initializing if needed
   */
  async getService<T>(name: string): Promise<T> {
    if (this.services.has(name)) {
      return this.services.get(name)
    }

    const descriptor = this.descriptors.get(name)
    if (!descriptor) {
      throw new Error(`Service not found: ${name}`)
    }

    // Initialize dependencies first
    for (const dep of descriptor.dependencies) {
      await this.getService(dep)
    }

    // Create service instance
    const instance = descriptor.factory()

    if (descriptor.singleton) {
      this.services.set(name, instance)
    }

    // Initialize if it has lifecycle
    if (this.hasLifecycle(instance)) {
      await instance.initialize?.()
    }

    return instance
  }

  /**
   * Initialize all services in dependency order
   */
  async initializeAll(): Promise<void> {
    for (const serviceName of this.initializationOrder) {
      await this.getService(serviceName)
    }
  }

  /**
   * Destroy all services
   */
  async destroyAll(): Promise<void> {
    const reverseOrder = [...this.initializationOrder].reverse()

    for (const serviceName of reverseOrder) {
      const instance = this.services.get(serviceName)
      if (instance && this.hasLifecycle(instance)) {
        await instance.destroy?.()
      }
    }

    this.services.clear()
  }

  private hasLifecycle(obj: any): obj is ServiceLifecycle {
    return obj && (typeof obj.initialize === 'function' || typeof obj.destroy === 'function')
  }

  /**
   * Compute topological sort for initialization order
   */
  private computeInitializationOrder(): void {
    const visited = new Set<string>()
    const visiting = new Set<string>()
    const order: string[] = []

    const visit = (name: string) => {
      if (visiting.has(name)) {
        throw new Error(`Circular dependency detected: ${name}`)
      }
      if (visited.has(name)) return

      visiting.add(name)
      const descriptor = this.descriptors.get(name)

      if (descriptor) {
        for (const dep of descriptor.dependencies) {
          visit(dep)
        }
      }

      visiting.delete(name)
      visited.add(name)
      order.push(name)
    }

    // Sort by priority first
    const sortedNames = Array.from(this.descriptors.keys())
      .sort((a, b) => {
        const priorityA = this.descriptors.get(a)?.priority ?? 0
        const priorityB = this.descriptors.get(b)?.priority ?? 0
        return priorityB - priorityA
      })

    for (const name of sortedNames) {
      visit(name)
    }

    this.initializationOrder = order
  }
}

/**
 * Service registration helpers
 */
export const ServiceRegistrar = {
  layoutManager: () => PrimitiveServiceRegistry.getInstance().register({
    name: 'CornerLayoutManager',
    factory: () => require('../layout/CornerLayoutManager').CornerLayoutManager,
    dependencies: [],
    singleton: true,
    priority: 100
  }),

  coordinateService: () => PrimitiveServiceRegistry.getInstance().register({
    name: 'ChartCoordinateService',
    factory: () => require('../services/ChartCoordinateService').ChartCoordinateService,
    dependencies: [],
    singleton: true,
    priority: 90
  }),

  templateEngine: () => PrimitiveServiceRegistry.getInstance().register({
    name: 'TemplateEngine',
    factory: () => require('../template/TemplateEngine').TemplateEngine,
    dependencies: [],
    singleton: true,
    priority: 80
  }),

  eventManager: () => PrimitiveServiceRegistry.getInstance().register({
    name: 'PrimitiveEventManager',
    factory: () => require('../events/PrimitiveEventManager').PrimitiveEventManager,
    dependencies: ['CornerLayoutManager'],
    singleton: true,
    priority: 70
  })
}