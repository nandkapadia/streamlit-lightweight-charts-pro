/**
 * @fileoverview Centralized Logging Utility
 *
 * Structured logging system for the frontend with configurable log levels
 * and context-based organization. Replaces direct console statements with
 * consistent, filterable logging.
 *
 * This module provides:
 * - Structured logging with log levels (DEBUG, INFO, WARN, ERROR)
 * - Context-based logging (Chart, Primitive, Performance, etc.)
 * - Timestamp formatting with ISO format
 * - Specialized logging methods for common use cases
 * - Singleton logger instance
 *
 * Architecture:
 * - Singleton pattern for global logger
 * - Log level filtering (configurable threshold)
 * - Structured log entries with metadata
 * - Convenience exports for common contexts
 *
 * Features:
 * - Automatic timestamp formatting
 * - Context tagging for easy filtering
 * - Data payload support for debugging
 * - Specialized methods (chartError, primitiveError, etc.)
 * - Production-friendly (default: WARN level)
 *
 * @example
 * ```typescript
 * import { logger, chartLog } from './logger';
 *
 * // General logging
 * logger.info('Chart initialized', 'MyComponent');
 * logger.error('Rendering failed', 'MyComponent', error);
 *
 * // Context-specific logging
 * chartLog.info('Series added');
 * primitiveLog.error('Update failed', 'legend-1', error);
 * ```
 */

export enum LogLevel {
  DEBUG = 0,

  INFO = 1,

  WARN = 2,

  ERROR = 3,
}

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: string;
  data?: any;
  timestamp: Date;
}

class Logger {
  private logLevel: LogLevel;

  constructor() {
    this.logLevel = LogLevel.WARN; // Production: only show warnings and errors
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel;
  }

  private formatMessage(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const levelName = LogLevel[entry.level];
    const context = entry.context ? `[${entry.context}] ` : '';
    return `${timestamp} ${levelName} ${context}${entry.message}`;
  }

  private log(level: LogLevel, message: string, context?: string, data?: any): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      level,
      message,
      context,
      data,
      timestamp: new Date(),
    };

    const formattedMessage = this.formatMessage(entry);

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formattedMessage);
        break;
      case LogLevel.INFO:
        console.info(formattedMessage);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage, data);
        break;
      case LogLevel.ERROR:
        console.error(formattedMessage, data);
        break;
    }
  }

  debug(message: string, context?: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, context, data);
  }

  info(message: string, context?: string, data?: any): void {
    this.log(LogLevel.INFO, message, context, data);
  }

  warn(message: string, context?: string, data?: any): void {
    this.log(LogLevel.WARN, message, context, data);
  }

  error(message: string, context?: string, data?: any): void {
    this.log(LogLevel.ERROR, message, context, data);
  }

  // Specialized methods for common contexts
  chartError(message: string, error?: Error): void {
    this.error(message, 'Chart', error);
  }

  primitiveError(message: string, primitiveId: string, error?: Error): void {
    this.error(message, `Primitive:${primitiveId}`, error);
  }

  performanceWarn(message: string, data?: any): void {
    this.warn(message, 'Performance', data);
  }

  renderDebug(message: string, componentName: string, data?: any): void {
    this.debug(message, `Render:${componentName}`, data);
  }
}

// Export singleton instance
export const logger = new Logger();

// Export convenience methods for common patterns
export const chartLog = {
  debug: (message: string, data?: any) => logger.debug(message, 'Chart', data),
  info: (message: string, data?: any) => logger.info(message, 'Chart', data),
  warn: (message: string, data?: any) => logger.warn(message, 'Chart', data),
  error: (message: string, error?: Error) => logger.chartError(message, error),
};

export const primitiveLog = {
  debug: (message: string, primitiveId: string, data?: any) =>
    logger.debug(message, `Primitive:${primitiveId}`, data),
  error: (message: string, primitiveId: string, error?: Error) =>
    logger.primitiveError(message, primitiveId, error),
};

export const perfLog = {
  warn: (message: string, data?: any) => logger.performanceWarn(message, data),
  debug: (message: string, data?: any) => logger.debug(message, 'Performance', data),
};

export default logger;
