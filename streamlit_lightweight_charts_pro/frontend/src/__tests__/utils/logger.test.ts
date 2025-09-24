import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { MockedFunction } from 'vitest';
import { logger, LogLevel, chartLog, primitiveLog, perfLog } from '../../utils/logger';

describe('Logger', () => {
  let consoleDebugSpy: MockedFunction;
  let consoleInfoSpy: MockedFunction;
  let consoleWarnSpy: MockedFunction;
  let consoleErrorSpy: MockedFunction;

  beforeEach(() => {
    // Mock console methods
    consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
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

      expect(consoleDebugSpy).toHaveBeenCalledTimes(0); // Debug disabled by default
    });

    it('should log info messages', () => {
      logger.info('Info message', 'TestContext', { data: 'test' });

      expect(consoleInfoSpy).toHaveBeenCalledTimes(0); // Info disabled by default
    });

    it('should log warn messages', () => {
      logger.warn('Warning message', 'TestContext', { data: 'test' });

      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      const [message, data] = consoleWarnSpy.mock.calls[0];
      expect(message).toContain('WARN');
      expect(message).toContain('[TestContext]');
      expect(message).toContain('Warning message');
      expect(data).toEqual({ data: 'test' });
    });

    it('should log error messages', () => {
      logger.error('Error message', 'TestContext', { error: 'test' });

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      const [message, data] = consoleErrorSpy.mock.calls[0];
      expect(message).toContain('ERROR');
      expect(message).toContain('[TestContext]');
      expect(message).toContain('Error message');
      expect(data).toEqual({ error: 'test' });
    });
  });

  describe('Message formatting', () => {
    it('should format message without context', () => {
      logger.warn('Test message');

      const [message] = consoleWarnSpy.mock.calls[0];
      expect(message).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z WARN Test message/);
    });

    it('should format message with context', () => {
      logger.error('Test message', 'TestContext');

      const [message] = consoleErrorSpy.mock.calls[0];
      expect(message).toContain('[TestContext]');
      expect(message).toContain('Test message');
    });

    it('should include timestamp in formatted message', () => {
      logger.warn('Test message');

      const [message] = consoleWarnSpy.mock.calls[0];
      expect(message).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/);
    });
  });

  describe('Specialized logging methods', () => {
    it('should log chart errors', () => {
      const error = new Error('Chart error');
      logger.chartError('Chart failed', error);

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      const [message, data] = consoleErrorSpy.mock.calls[0];
      expect(message).toContain('[Chart]');
      expect(message).toContain('Chart failed');
      expect(data).toBe(error);
    });

    it('should log primitive errors', () => {
      const error = new Error('Primitive error');
      logger.primitiveError('Primitive failed', 'test-primitive', error);

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      const [message, data] = consoleErrorSpy.mock.calls[0];
      expect(message).toContain('[Primitive:test-primitive]');
      expect(message).toContain('Primitive failed');
      expect(data).toBe(error);
    });

    it('should log performance warnings', () => {
      logger.performanceWarn('Slow operation', { duration: 1000 });

      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      const [message, data] = consoleWarnSpy.mock.calls[0];
      expect(message).toContain('[Performance]');
      expect(message).toContain('Slow operation');
      expect(data).toEqual({ duration: 1000 });
    });

    it('should log render debug messages', () => {
      logger.renderDebug('Component rendered', 'TestComponent', { props: 'test' });

      expect(consoleDebugSpy).toHaveBeenCalledTimes(0); // Debug disabled by default
    });
  });

  describe('Convenience log objects', () => {
    describe('chartLog', () => {
      it('should log chart debug messages', () => {
        chartLog.debug('Chart debug', { data: 'test' });

        expect(consoleDebugSpy).toHaveBeenCalledTimes(0); // Debug disabled
      });

      it('should log chart info messages', () => {
        chartLog.info('Chart info', { data: 'test' });

        expect(consoleInfoSpy).toHaveBeenCalledTimes(0); // Info disabled
      });

      it('should log chart warnings', () => {
        chartLog.warn('Chart warning', { data: 'test' });

        expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
        const [message, data] = consoleWarnSpy.mock.calls[0];
        expect(message).toContain('[Chart]');
        expect(message).toContain('Chart warning');
        expect(data).toEqual({ data: 'test' });
      });

      it('should log chart errors', () => {
        const error = new Error('Chart error');
        chartLog.error('Chart failed', error);

        expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
        const [message, data] = consoleErrorSpy.mock.calls[0];
        expect(message).toContain('[Chart]');
        expect(message).toContain('Chart failed');
        expect(data).toBe(error);
      });
    });

    describe('primitiveLog', () => {
      it('should log primitive debug messages', () => {
        primitiveLog.debug('Primitive debug', 'test-primitive', { data: 'test' });

        expect(consoleDebugSpy).toHaveBeenCalledTimes(0); // Debug disabled
      });

      it('should log primitive errors', () => {
        const error = new Error('Primitive error');
        primitiveLog.error('Primitive failed', 'test-primitive', error);

        expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
        const [message, data] = consoleErrorSpy.mock.calls[0];
        expect(message).toContain('[Primitive:test-primitive]');
        expect(message).toContain('Primitive failed');
        expect(data).toBe(error);
      });
    });

    describe('perfLog', () => {
      it('should log performance warnings', () => {
        perfLog.warn('Performance warning', { duration: 500 });

        expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
        const [message, data] = consoleWarnSpy.mock.calls[0];
        expect(message).toContain('[Performance]');
        expect(message).toContain('Performance warning');
        expect(data).toEqual({ duration: 500 });
      });

      it('should log performance debug messages', () => {
        perfLog.debug('Performance debug', { operation: 'test' });

        expect(consoleDebugSpy).toHaveBeenCalledTimes(0); // Debug disabled
      });
    });
  });

  describe('Log level filtering', () => {
    it('should respect log level thresholds', () => {
      // Default log level is WARN, so DEBUG and INFO should be filtered
      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warning message');
      logger.error('Error message');

      expect(consoleDebugSpy).toHaveBeenCalledTimes(0);
      expect(consoleInfoSpy).toHaveBeenCalledTimes(0);
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Data handling', () => {
    it('should handle undefined data gracefully', () => {
      logger.warn('Warning without data');

      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      const [message, data] = consoleWarnSpy.mock.calls[0];
      expect(message).toContain('Warning without data');
      expect(data).toBeUndefined();
    });

    it('should handle complex data objects', () => {
      const complexData = {
        nested: { value: 123 },
        array: [1, 2, 3],
        func: () => 'test',
      };

      logger.error('Error with complex data', 'TestContext', complexData);

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      const [, data] = consoleErrorSpy.mock.calls[0];
      expect(data).toBe(complexData);
    });
  });
});
