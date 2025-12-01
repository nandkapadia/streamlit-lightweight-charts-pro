/**
 * @fileoverview Unified Error Handling System
 *
 * Provides consistent error handling with severity levels across the application.
 * Uses the existing logger utility for all logging operations.
 *
 * Features:
 * - Severity-based error handling (SILENT, WARNING, ERROR, CRITICAL)
 * - Consistent error propagation strategy
 * - Structured error logging with context
 * - Type-safe error handling helpers
 *
 * Usage:
 * ```typescript
 * import { handleError, ErrorSeverity } from './utils/errorHandler';
 *
 * // Silent - log only, don't propagate
 * handleError(error, 'MyComponent', ErrorSeverity.SILENT);
 *
 * // Warning - log warning, continue execution
 * handleError(error, 'MyComponent', ErrorSeverity.WARNING);
 *
 * // Error - log error, throw to propagate
 * handleError(error, 'MyComponent', ErrorSeverity.ERROR);
 *
 * // Critical - log error with extra context, throw to propagate
 * handleError(error, 'MyComponent', ErrorSeverity.CRITICAL);
 * ```
 */

import { logger } from './logger';

/**
 * Error severity levels
 *
 * Determines how errors are logged and whether they propagate
 */
export enum ErrorSeverity {
  /**
   * SILENT: No logging, no propagation
   * Use for expected errors that should be completely ignored
   */
  SILENT = 0,

  /**
   * WARNING: Log as warning, continue execution
   * Use for recoverable errors that don't affect functionality
   */
  WARNING = 1,

  /**
   * ERROR: Log as error, propagate by throwing
   * Use for errors that should be handled by caller (default)
   */
  ERROR = 2,

  /**
   * CRITICAL: Log as error with extra context, propagate by throwing
   * Use for critical errors that may require user notification
   */
  CRITICAL = 3,
}

/**
 * Error handling options
 */
export interface ErrorHandlingOptions {
  /** Error severity level */
  severity?: ErrorSeverity;

  /** Additional context data to log */
  data?: any;

  /** Custom error message (overrides error.message) */
  message?: string;

  /** Whether to include stack trace in logs */
  includeStack?: boolean;
}

/**
 * Handle error with consistent logging and propagation
 *
 * @param error - Error object or unknown value
 * @param context - Context string (e.g., component/service name)
 * @param severity - Error severity level (default: ERROR)
 */
export function handleError(
  error: Error | unknown,
  context: string,
  severity: ErrorSeverity = ErrorSeverity.ERROR
): void {
  const message = error instanceof Error ? error.message : String(error);
  const errorData = error instanceof Error ? error : { value: error };

  switch (severity) {
    case ErrorSeverity.SILENT:
      // No logging, no propagation
      break;

    case ErrorSeverity.WARNING:
      logger.warn(message, context, errorData);
      // Continue execution (don't throw)
      break;

    case ErrorSeverity.ERROR:
      logger.error(message, context, errorData);
      throw error;

    case ErrorSeverity.CRITICAL:
      logger.error(`CRITICAL: ${message}`, context, errorData);
      // Could trigger user notification here in the future
      throw error;
  }
}

/**
 * Handle error with additional options
 *
 * @param error - Error object or unknown value
 * @param context - Context string
 * @param options - Error handling options
 */
export function handleErrorWithOptions(
  error: Error | unknown,
  context: string,
  options: ErrorHandlingOptions = {}
): void {
  const {
    severity = ErrorSeverity.ERROR,
    data,
    message: customMessage,
    includeStack = false,
  } = options;

  const errorMessage = customMessage || (error instanceof Error ? error.message : String(error));
  const errorData = {
    ...(data || {}),
    originalError: error instanceof Error ? error : { value: error },
    ...(includeStack && error instanceof Error ? { stack: error.stack } : {}),
  };

  switch (severity) {
    case ErrorSeverity.SILENT:
      // No logging, no propagation
      break;

    case ErrorSeverity.WARNING:
      logger.warn(errorMessage, context, errorData);
      break;

    case ErrorSeverity.ERROR:
      logger.error(errorMessage, context, errorData);
      throw error;

    case ErrorSeverity.CRITICAL:
      logger.error(`CRITICAL: ${errorMessage}`, context, errorData);
      throw error;
  }
}

/**
 * Safe execution wrapper with error handling
 *
 * Executes a function and handles any errors according to severity
 *
 * @param fn - Function to execute
 * @param context - Context string
 * @param severity - Error severity level
 * @returns Function result or undefined if error occurred
 */
export function safeExecute<T>(
  fn: () => T,
  context: string,
  severity: ErrorSeverity = ErrorSeverity.WARNING
): T | undefined {
  try {
    return fn();
  } catch (error) {
    handleError(error, context, severity);
    return undefined;
  }
}

/**
 * Async safe execution wrapper with error handling
 *
 * @param fn - Async function to execute
 * @param context - Context string
 * @param severity - Error severity level
 * @returns Promise with function result or undefined if error occurred
 */
export async function safeExecuteAsync<T>(
  fn: () => Promise<T>,
  context: string,
  severity: ErrorSeverity = ErrorSeverity.WARNING
): Promise<T | undefined> {
  try {
    return await fn();
  } catch (error) {
    handleError(error, context, severity);
    return undefined;
  }
}

/**
 * Create a context-specific error handler
 *
 * Returns a handleError function bound to a specific context
 *
 * @param context - Context string to use for all errors
 * @returns Context-bound error handler
 */
export function createErrorHandler(context: string) {
  return (error: Error | unknown, severity: ErrorSeverity = ErrorSeverity.ERROR) => {
    handleError(error, context, severity);
  };
}

/**
 * Validation error helper
 *
 * Creates and throws a validation error
 *
 * @param message - Error message
 * @param context - Context string
 * @param data - Validation data
 */
export function throwValidationError(message: string, context: string, data?: any): never {
  const error = new Error(message);
  error.name = 'ValidationError';
  handleErrorWithOptions(error, context, {
    severity: ErrorSeverity.ERROR,
    data,
  });
  throw error; // TypeScript requires this for 'never' return type
}

/**
 * Assertion helper with error handling
 *
 * @param condition - Condition to assert
 * @param message - Error message if assertion fails
 * @param context - Context string
 */
export function assert(condition: boolean, message: string, context: string): asserts condition {
  if (!condition) {
    throwValidationError(message, context);
  }
}
