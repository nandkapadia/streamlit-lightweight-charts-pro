/**
 * @fileoverview Logger Test Suite
 *
 * Tests for the logger utility with console output verification.
 */

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Import logger
import { logger, LogLevel, chartLog, primitiveLog, perfLog } from '../../utils/logger';

describe('Logger', () => {
  let consoleDebugSpy: any;
  let consoleInfoSpy: any;
  let consoleWarnSpy: any;
  let consoleErrorSpy: any;

  beforeEach(() => {
    // Set logger to DEBUG level to allow all log messages
    (logger as any).logLevel = LogLevel.DEBUG;

    // Ensure console.debug and console.info exist (Node.js doesn't have them by default)
    if (!console.debug) console.debug = console.log;
    if (!console.info) console.info = console.log;

    // Spy on console methods (logger uses debug/info/warn/error)
    consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore console methods
    consoleDebugSpy.mockRestore();
    consoleInfoSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('LogLevel enum', () => {
    it('should have correct numeric values', () => {
      expect(LogLevel.DEBUG).toBe(0);
      expect(LogLevel.INFO).toBe(1);
      expect(LogLevel.WARN).toBe(2);
      expect(LogLevel.ERROR).toBe(3);
    });
  });

  describe('Basic logging methods', () => {
    it('should log debug messages', () => {
      logger.debug('Debug message', 'TestContext', { data: 'test' });

      expect(consoleDebugSpy).toHaveBeenCalled();
      expect(consoleDebugSpy.mock.calls[0][0]).toContain('DEBUG');
      expect(consoleDebugSpy.mock.calls[0][0]).toContain('Debug message');
    });

    it('should log info messages', () => {
      logger.info('Info message', 'TestContext', { data: 'test' });

      expect(consoleInfoSpy).toHaveBeenCalled();
      expect(consoleInfoSpy.mock.calls[0][0]).toContain('INFO');
      expect(consoleInfoSpy.mock.calls[0][0]).toContain('Info message');
    });

    it('should log warn messages', () => {
      logger.warn('Warning message', 'TestContext', { data: 'test' });

      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(consoleWarnSpy.mock.calls[0][0]).toContain('WARN');
      expect(consoleWarnSpy.mock.calls[0][0]).toContain('Warning message');
    });

    it('should log error messages', () => {
      logger.error('Error message', 'TestContext', { error: 'test' });

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(consoleErrorSpy.mock.calls[0][0]).toContain('ERROR');
      expect(consoleErrorSpy.mock.calls[0][0]).toContain('Error message');
    });
  });

  describe('Specialized logging methods', () => {
    it('should log chart errors', () => {
      const error = new Error('Chart failed');
      logger.chartError('Chart failed', error);

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(consoleErrorSpy.mock.calls[0][0]).toContain('ERROR');
      expect(consoleErrorSpy.mock.calls[0][0]).toContain('Chart failed');
    });

    it('should log primitive errors', () => {
      const error = new Error('Primitive failed');
      logger.primitiveError('Primitive failed', 'test-primitive', error);

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(consoleErrorSpy.mock.calls[0][0]).toContain('ERROR');
      expect(consoleErrorSpy.mock.calls[0][0]).toContain('Primitive failed');
      expect(consoleErrorSpy.mock.calls[0][0]).toContain('test-primitive');
    });

    it('should log performance warnings', () => {
      logger.performanceWarn('Performance issue detected', { duration: 1000 });

      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(consoleWarnSpy.mock.calls[0][0]).toContain('WARN');
      expect(consoleWarnSpy.mock.calls[0][0]).toContain('Performance issue detected');
    });

    it('should log render debug messages', () => {
      logger.renderDebug('Render debug', 'Chart');

      expect(consoleDebugSpy).toHaveBeenCalled();
      expect(consoleDebugSpy.mock.calls[0][0]).toContain('DEBUG');
      expect(consoleDebugSpy.mock.calls[0][0]).toContain('Render debug');
    });
  });

  describe('Convenience log objects', () => {
    describe('chartLog', () => {
      it('should log chart debug messages', () => {
        chartLog.debug('Chart debug message');

        expect(consoleDebugSpy).toHaveBeenCalled();
        expect(consoleDebugSpy.mock.calls[0][0]).toContain('Chart debug message');
      });

      it('should log chart info messages', () => {
        chartLog.info('Chart info message');

        expect(consoleInfoSpy).toHaveBeenCalled();
        expect(consoleInfoSpy.mock.calls[0][0]).toContain('Chart info message');
      });

      it('should log chart warnings', () => {
        chartLog.warn('Chart warning message');

        expect(consoleWarnSpy).toHaveBeenCalled();
        expect(consoleWarnSpy.mock.calls[0][0]).toContain('Chart warning message');
      });

      it('should log chart errors', () => {
        chartLog.error('Chart error message');

        expect(consoleErrorSpy).toHaveBeenCalled();
        expect(consoleErrorSpy.mock.calls[0][0]).toContain('Chart error message');
      });
    });

    describe('primitiveLog', () => {
      it('should log primitive debug messages', () => {
        primitiveLog.debug('Primitive debug message', 'test-primitive');

        expect(consoleDebugSpy).toHaveBeenCalled();
        expect(consoleDebugSpy.mock.calls[0][0]).toContain('Primitive debug message');
        expect(consoleDebugSpy.mock.calls[0][0]).toContain('test-primitive');
      });

      it('should log primitive errors', () => {
        primitiveLog.error('Primitive error message', 'test-primitive');

        expect(consoleErrorSpy).toHaveBeenCalled();
        expect(consoleErrorSpy.mock.calls[0][0]).toContain('Primitive error message');
        expect(consoleErrorSpy.mock.calls[0][0]).toContain('test-primitive');
      });
    });

    describe('perfLog', () => {
      it('should log performance warnings', () => {
        perfLog.warn('Performance warning message');

        expect(consoleWarnSpy).toHaveBeenCalled();
        expect(consoleWarnSpy.mock.calls[0][0]).toContain('Performance warning message');
      });

      it('should log performance debug messages', () => {
        perfLog.debug('Performance debug message');

        expect(consoleDebugSpy).toHaveBeenCalled();
        expect(consoleDebugSpy.mock.calls[0][0]).toContain('Performance debug message');
      });
    });
  });

  describe('Mock function behavior', () => {
    it('should handle undefined data gracefully', () => {
      logger.warn('Warning without data');

      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(consoleWarnSpy.mock.calls[0][0]).toContain('Warning without data');
    });

    it('should handle complex data objects', () => {
      const complexData = {
        nested: { value: 'test' },
        array: [1, 2, 3],
        func: () => 'test',
      };

      logger.error('Error with complex data', 'TestContext', complexData);

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(consoleErrorSpy.mock.calls[0][0]).toContain('Error with complex data');
    });
  });
});
