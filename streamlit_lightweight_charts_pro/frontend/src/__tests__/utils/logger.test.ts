import { vi, describe, it, expect, beforeEach } from 'vitest';

// Import mocked versions
import { logger, LogLevel, chartLog, primitiveLog, perfLog } from '../../utils/logger';

describe('Logger', () => {
  beforeEach(() => {
    // Clear all mock calls before each test
    vi.clearAllMocks();
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

      expect(logger.debug).toHaveBeenCalledTimes(1);
      expect(logger.debug).toHaveBeenCalledWith('Debug message', 'TestContext', { data: 'test' });
    });

    it('should log info messages', () => {
      logger.info('Info message', 'TestContext', { data: 'test' });

      expect(logger.info).toHaveBeenCalledTimes(1);
      expect(logger.info).toHaveBeenCalledWith('Info message', 'TestContext', { data: 'test' });
    });

    it('should log warn messages', () => {
      logger.warn('Warning message', 'TestContext', { data: 'test' });

      expect(logger.warn).toHaveBeenCalledTimes(1);
      expect(logger.warn).toHaveBeenCalledWith('Warning message', 'TestContext', { data: 'test' });
    });

    it('should log error messages', () => {
      logger.error('Error message', 'TestContext', { error: 'test' });

      expect(logger.error).toHaveBeenCalledTimes(1);
      expect(logger.error).toHaveBeenCalledWith('Error message', 'TestContext', { error: 'test' });
    });
  });

  describe('Specialized logging methods', () => {
    it('should log chart errors', () => {
      const error = new Error('Chart failed');
      logger.chartError('Chart failed', error);

      expect(logger.chartError).toHaveBeenCalledTimes(1);
      expect(logger.chartError).toHaveBeenCalledWith('Chart failed', error);
    });

    it('should log primitive errors', () => {
      const error = new Error('Primitive failed');
      logger.primitiveError('Primitive failed', 'test-primitive', error);

      expect(logger.primitiveError).toHaveBeenCalledTimes(1);
      expect(logger.primitiveError).toHaveBeenCalledWith(
        'Primitive failed',
        'test-primitive',
        error
      );
    });

    it('should log performance warnings', () => {
      logger.performanceWarn('Performance issue detected', { duration: 1000 });

      expect(logger.performanceWarn).toHaveBeenCalledTimes(1);
      expect(logger.performanceWarn).toHaveBeenCalledWith('Performance issue detected', {
        duration: 1000,
      });
    });

    it('should log render debug messages', () => {
      logger.renderDebug('Render debug', 'Chart');

      expect(logger.renderDebug).toHaveBeenCalledTimes(1);
      expect(logger.renderDebug).toHaveBeenCalledWith('Render debug', 'Chart');
    });
  });

  describe('Convenience log objects', () => {
    describe('chartLog', () => {
      it('should log chart debug messages', () => {
        chartLog.debug('Chart debug message');

        expect(chartLog.debug).toHaveBeenCalledTimes(1);
        expect(chartLog.debug).toHaveBeenCalledWith('Chart debug message');
      });

      it('should log chart info messages', () => {
        chartLog.info('Chart info message');

        expect(chartLog.info).toHaveBeenCalledTimes(1);
        expect(chartLog.info).toHaveBeenCalledWith('Chart info message');
      });

      it('should log chart warnings', () => {
        chartLog.warn('Chart warning message');

        expect(chartLog.warn).toHaveBeenCalledTimes(1);
        expect(chartLog.warn).toHaveBeenCalledWith('Chart warning message');
      });

      it('should log chart errors', () => {
        chartLog.error('Chart error message');

        expect(chartLog.error).toHaveBeenCalledTimes(1);
        expect(chartLog.error).toHaveBeenCalledWith('Chart error message');
      });
    });

    describe('primitiveLog', () => {
      it('should log primitive debug messages', () => {
        primitiveLog.debug('Primitive debug message', 'test-primitive');

        expect(primitiveLog.debug).toHaveBeenCalledTimes(1);
        expect(primitiveLog.debug).toHaveBeenCalledWith(
          'Primitive debug message',
          'test-primitive'
        );
      });

      it('should log primitive errors', () => {
        primitiveLog.error('Primitive error message', 'test-primitive');

        expect(primitiveLog.error).toHaveBeenCalledTimes(1);
        expect(primitiveLog.error).toHaveBeenCalledWith(
          'Primitive error message',
          'test-primitive'
        );
      });
    });

    describe('perfLog', () => {
      it('should log performance warnings', () => {
        perfLog.warn('Performance warning message');

        expect(perfLog.warn).toHaveBeenCalledTimes(1);
        expect(perfLog.warn).toHaveBeenCalledWith('Performance warning message');
      });

      it('should log performance debug messages', () => {
        perfLog.debug('Performance debug message');

        expect(perfLog.debug).toHaveBeenCalledTimes(1);
        expect(perfLog.debug).toHaveBeenCalledWith('Performance debug message');
      });
    });
  });

  describe('Mock function behavior', () => {
    it('should handle undefined data gracefully', () => {
      logger.warn('Warning without data');

      expect(logger.warn).toHaveBeenCalledTimes(1);
      expect(logger.warn).toHaveBeenCalledWith('Warning without data');
    });

    it('should handle complex data objects', () => {
      const complexData = {
        nested: { value: 'test' },
        array: [1, 2, 3],
        func: () => 'test',
      };

      logger.error('Error with complex data', 'TestContext', complexData);

      expect(logger.error).toHaveBeenCalledTimes(1);
      expect(logger.error).toHaveBeenCalledWith(
        'Error with complex data',
        'TestContext',
        complexData
      );
    });
  });
});
