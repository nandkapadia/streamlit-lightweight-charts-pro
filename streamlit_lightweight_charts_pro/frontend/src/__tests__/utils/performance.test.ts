/**
 * @fileoverview Performance Utilities Test Suite
 *
 * Tests for performance optimization utilities.
 *
 * @vitest-environment jsdom
 */

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  perfLogFn,
  getCachedDOMElementForTesting as getCachedDOMElement,
  createOptimizedStyles,
} from '../../utils/performance';

// Mock performance API
Object.defineProperty(window, 'performance', {
  value: {
    now: vi.fn(() => Date.now()),
    mark: vi.fn(),
    measure: vi.fn(),
    getEntriesByType: vi.fn(() => []),
  },
  writable: true,
});

beforeEach(() => {});

afterEach(() => {});

describe('performance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('perfLogFn', () => {
    it('should execute function and return result', () => {
      const testFn = vi.fn(() => 'result');

      const result = perfLogFn('test-operation', testFn);

      expect(result).toBe('result');
      expect(testFn).toHaveBeenCalled();
    });

    it('should handle errors gracefully', () => {
      const errorFn = () => {
        throw new Error('Test error');
      };

      expect(() => {
        perfLogFn('error-operation', errorFn);
      }).toThrow('Test error');
    });

    it('should work with async functions', async () => {
      const asyncFn = async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'async result';
      };

      const result = await perfLogFn('async-operation', asyncFn);

      expect(result).toBe('async result');
    });

    it('should return function result regardless of performance API availability', () => {
      Object.defineProperty(window, 'performance', {
        value: undefined,
        writable: true,
      });

      const result = perfLogFn('no-performance', () => 'result');

      expect(result).toBe('result');
    });
  });

  describe('getCachedDOMElement', () => {
    it('should return cached element when available', () => {
      const mockElement = document.createElement('div');
      const cache = new Map();
      cache.set('test-id', mockElement);

      const result = getCachedDOMElement('test-id', cache, () => document.createElement('span'));

      expect(result).toBe(mockElement);
    });

    it('should create and cache new element when not available', () => {
      const cache = new Map();
      const createFn = vi.fn(() => document.createElement('div'));

      const result = getCachedDOMElement('new-id', cache, createFn);

      expect(result).toBeInstanceOf(HTMLDivElement);
      expect(createFn).toHaveBeenCalledWith('new-id');
      expect(cache.get('new-id')).toBe(result);
    });

    it('should handle null create function', () => {
      const cache = new Map();

      const result = getCachedDOMElement('test-id', cache, null);

      expect(result).toBeNull();
    });

    it('should handle create function returning null', () => {
      const cache = new Map();
      const createFn = vi.fn(() => null);

      const result = getCachedDOMElement('test-id', cache, createFn);

      expect(result).toBeNull();
      expect(createFn).toHaveBeenCalledWith('test-id');
    });

    it('should handle multiple calls with same ID', () => {
      const cache = new Map();
      const createFn = vi.fn(() => document.createElement('div'));

      const result1 = getCachedDOMElement('same-id', cache, createFn);
      const result2 = getCachedDOMElement('same-id', cache, createFn);

      expect(result1).toBe(result2);
      expect(createFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('createOptimizedStyles', () => {
    it('should create optimized styles object', () => {
      const styles = createOptimizedStyles({
        width: '100%',
        height: '400px',
        backgroundColor: '#ffffff',
      });

      expect(styles).toEqual({
        width: '100%',
        height: '400px',
        backgroundColor: '#ffffff',
      });
    });

    it('should handle empty styles object', () => {
      const styles = createOptimizedStyles({});

      expect(styles).toEqual({});
    });

    it('should handle null styles', () => {
      const styles = createOptimizedStyles(null);

      expect(styles).toEqual({});
    });

    it('should handle undefined styles', () => {
      const styles = createOptimizedStyles(undefined);

      expect(styles).toEqual({});
    });

    it('should handle complex style objects', () => {
      const styles = createOptimizedStyles({
        width: '100%',
        height: '400px',
        backgroundColor: '#ffffff',
        border: '1px solid #ccc',
        borderRadius: '4px',
        padding: '10px',
        margin: '0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      });

      expect(styles).toEqual({
        width: '100%',
        height: '400px',
        backgroundColor: '#ffffff',
        border: '1px solid #ccc',
        borderRadius: '4px',
        padding: '10px',
        margin: '0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      });
    });

    it('should handle numeric values', () => {
      const styles = createOptimizedStyles({
        width: 800,
        height: 600,
        opacity: 0.8,
        zIndex: 1000,
      });

      expect(styles).toEqual({
        width: 800,
        height: 600,
        opacity: 0.8,
        zIndex: 1000,
      });
    });

    it('should handle mixed value types', () => {
      const styles = createOptimizedStyles({
        width: '100%',
        height: 400,
        opacity: 0.8,
        color: '#000000',
        fontSize: '14px',
        fontWeight: 500,
      });

      expect(styles).toEqual({
        width: '100%',
        height: 400,
        opacity: 0.8,
        color: '#000000',
        fontSize: '14px',
        fontWeight: 500,
      });
    });
  });
});
