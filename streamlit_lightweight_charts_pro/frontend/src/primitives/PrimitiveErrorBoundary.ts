/**
 * Error Boundary System for Primitives
 *
 * Provides centralized error handling, recovery mechanisms,
 * and error reporting for the primitive system.
 */

export enum ErrorSeverity {
  // eslint-disable-next-line no-unused-vars
  LOW = 'low',
  // eslint-disable-next-line no-unused-vars
  MEDIUM = 'medium',
  // eslint-disable-next-line no-unused-vars
  HIGH = 'high',
  // eslint-disable-next-line no-unused-vars
  CRITICAL = 'critical',
}

export enum ErrorCategory {
  // eslint-disable-next-line no-unused-vars
  INITIALIZATION = 'initialization',
  // eslint-disable-next-line no-unused-vars
  RENDERING = 'rendering',
  // eslint-disable-next-line no-unused-vars
  EVENT_HANDLING = 'event_handling',
  // eslint-disable-next-line no-unused-vars
  SERVICE_COMMUNICATION = 'service_communication',
  // eslint-disable-next-line no-unused-vars
  CONFIGURATION = 'configuration',
  // eslint-disable-next-line no-unused-vars
  LIFECYCLE = 'lifecycle',
}

export interface PrimitiveError {
  id: string;
  primitiveId: string;
  primitiveType: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  message: string;
  stack?: string;
  context?: Record<string, any>;
  timestamp: number;
  recoverable: boolean;
}

export interface ErrorRecoveryStrategy {
  canRecover(_error: PrimitiveError): boolean;
  recover(_error: PrimitiveError, _primitive: any): Promise<boolean>;
}

/**
 * Centralized error boundary for primitive operations
 */
export class PrimitiveErrorBoundary {
  private static instance: PrimitiveErrorBoundary;
  private errors: Map<string, PrimitiveError> = new Map();
  private recoveryStrategies: ErrorRecoveryStrategy[] = [];
  private errorListeners: ((_error: PrimitiveError) => void)[] = [];

  static getInstance(): PrimitiveErrorBoundary {
    if (!this.instance) {
      this.instance = new PrimitiveErrorBoundary();
      this.instance.registerDefaultRecoveryStrategies();
    }
    return this.instance;
  }

  /**
   * Register an error recovery strategy
   */
  registerRecoveryStrategy(strategy: ErrorRecoveryStrategy): void {
    this.recoveryStrategies.push(strategy);
  }

  /**
   * Listen for errors
   */
  onError(listener: (_error: PrimitiveError) => void): () => void {
    this.errorListeners.push(listener);
    return () => {
      const index = this.errorListeners.indexOf(listener);
      if (index > -1) {
        this.errorListeners.splice(index, 1);
      }
    };
  }

  /**
   * Safely execute an operation with error boundary
   */
  async safeExecute<T>(
    primitiveId: string,
    primitiveType: string,
    operation: () => T | Promise<T>,
    category: ErrorCategory,
    context?: Record<string, any>
  ): Promise<T | null> {
    try {
      const result = await operation();
      return result;
    } catch (error) {
      const primitiveError = this.createError(primitiveId, primitiveType, category, error, context);

      return this.handleError(primitiveError, operation);
    }
  }

  /**
   * Handle an error with recovery attempts
   */
  private async handleError(error: PrimitiveError, operation?: any): Promise<any> {
    // Store error
    this.errors.set(error.id, error);

    // Notify listeners
    this.errorListeners.forEach(listener => listener(error));

    // Log error based on severity
    this.logError(error);

    // Attempt recovery if possible
    if (error.recoverable) {
      for (const strategy of this.recoveryStrategies) {
        if (strategy.canRecover(error)) {
          const recovered = await strategy.recover(error, operation);
          if (recovered) {
            // Mark error as recovered
            error.context = { ...error.context, recovered: true };
            return null; // Recovery successful, return null to indicate handled
          }
        }
      }
    }

    // If critical and not recoverable, re-throw
    if (error.severity === ErrorSeverity.CRITICAL && !error.recoverable) {
      throw new Error(`Critical primitive error: ${error.message}`);
    }

    return null;
  }

  /**
   * Create a primitive error object
   */
  private createError(
    primitiveId: string,
    primitiveType: string,
    category: ErrorCategory,
    originalError: any,
    context?: Record<string, any>
  ): PrimitiveError {
    const severity = this.determineSeverity(category, originalError);
    const recoverable = this.isRecoverable(category, severity);

    return {
      id: `${primitiveId}_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      primitiveId,
      primitiveType,
      category,
      severity,
      message: originalError?.message || String(originalError),
      stack: originalError?.stack,
      context: context || {},
      timestamp: Date.now(),
      recoverable,
    };
  }

  /**
   * Determine error severity based on category and error type
   */
  private determineSeverity(category: ErrorCategory, _error: any): ErrorSeverity {
    // Critical errors that break functionality
    if (category === ErrorCategory.INITIALIZATION) {
      return ErrorSeverity.CRITICAL;
    }

    // High priority errors
    if (category === ErrorCategory.RENDERING || category === ErrorCategory.LIFECYCLE) {
      return ErrorSeverity.HIGH;
    }

    // Medium priority errors
    if (category === ErrorCategory.SERVICE_COMMUNICATION) {
      return ErrorSeverity.MEDIUM;
    }

    // Low priority errors (can be ignored)
    return ErrorSeverity.LOW;
  }

  /**
   * Determine if an error is recoverable
   */
  private isRecoverable(category: ErrorCategory, severity: ErrorSeverity): boolean {
    // Initialization errors are typically not recoverable
    if (category === ErrorCategory.INITIALIZATION) {
      return false;
    }

    // Critical errors are typically not recoverable
    if (severity === ErrorSeverity.CRITICAL) {
      return false;
    }

    // Most other errors can be recovered from
    return true;
  }

  /**
   * Log error with appropriate level
   */
  private logError(error: PrimitiveError): void {
    // Store error for potential debugging but don't log to console in production
    // Could implement proper error reporting service here if needed
    // const logMessage = `[${error.severity.toUpperCase()}] ${error.primitiveType}(${error.primitiveId}): ${error.message}`;
    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        // Critical error - fail silently
        break;
      case ErrorSeverity.HIGH:
        // High severity error - fail silently
        break;
      case ErrorSeverity.MEDIUM:
        // Medium severity warning - fail silently
        break;
      case ErrorSeverity.LOW:
        // Low severity info - fail silently
        break;
    }
  }

  /**
   * Register default recovery strategies
   */
  private registerDefaultRecoveryStrategies(): void {
    // DOM recreation strategy
    this.registerRecoveryStrategy({
      canRecover: error => error.category === ErrorCategory.RENDERING,
      recover: async (error, primitive) => {
        try {
          // Attempt to recreate container element
          if (primitive && typeof primitive.recreateContainer === 'function') {
            await primitive.recreateContainer();
            return true;
          }
        } catch {
          return false;
        }
        return false;
      },
    });

    // Event handler reset strategy
    this.registerRecoveryStrategy({
      canRecover: error => error.category === ErrorCategory.EVENT_HANDLING,
      recover: async (error, primitive) => {
        try {
          // Reset event handlers
          if (primitive && typeof primitive.resetEventHandlers === 'function') {
            await primitive.resetEventHandlers();
            return true;
          }
        } catch {
          return false;
        }
        return false;
      },
    });

    // Service reconnection strategy
    this.registerRecoveryStrategy({
      canRecover: error => error.category === ErrorCategory.SERVICE_COMMUNICATION,
      recover: async (error, primitive) => {
        try {
          // Attempt service reconnection
          if (primitive && typeof primitive.reconnectServices === 'function') {
            await primitive.reconnectServices();
            return true;
          }
        } catch {
          return false;
        }
        return false;
      },
    });
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    total: number;
    bySeverity: Record<ErrorSeverity, number>;
    byCategory: Record<ErrorCategory, number>;
    recovered: number;
  } {
    const errors = Array.from(this.errors.values());

    return {
      total: errors.length,
      bySeverity: Object.values(ErrorSeverity).reduce(
        (acc, severity) => {
          acc[severity] = errors.filter(e => e.severity === severity).length;
          return acc;
        },
        {} as Record<ErrorSeverity, number>
      ),
      byCategory: Object.values(ErrorCategory).reduce(
        (acc, category) => {
          acc[category] = errors.filter(e => e.category === category).length;
          return acc;
        },
        {} as Record<ErrorCategory, number>
      ),
      recovered: errors.filter(e => e.context?.recovered).length,
    };
  }
}

/**
 * Decorator for automatic error boundary wrapping
 */
export function withErrorBoundary(category: ErrorCategory, context?: Record<string, any>) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const boundary = PrimitiveErrorBoundary.getInstance();
      const primitiveId = (this as any).id || 'unknown';
      const primitiveType = this.constructor.name;

      return boundary.safeExecute(
        primitiveId,
        primitiveType,
        () => originalMethod.apply(this, args),
        category,
        context
      );
    };

    return descriptor;
  };
}
