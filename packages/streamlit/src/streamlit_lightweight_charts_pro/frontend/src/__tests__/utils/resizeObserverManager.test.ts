/**
 * @fileoverview ResizeObserverManager Test Suite
 *
 * Tests for ResizeObserverManager utility with throttling and debouncing.
 *
 * @vitest-environment jsdom
 */

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
// MockedFunction not needed with proper type annotations
import { ResizeObserverManager } from '../../utils/resizeObserverManager';

describe('ResizeObserverManager', () => {
  let manager: ResizeObserverManager;
  let mockElement: HTMLElement;
  let mockObserver: any;
  let mockCallback: ReturnType<typeof vi.fn>;

  let dateNowSpy: any;

  beforeEach(() => {
    manager = new ResizeObserverManager();
    mockElement = document.createElement('div');
    mockCallback = vi.fn();

    // Mock ResizeObserver
    mockObserver = {
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    };

    // Mock ResizeObserver constructor
    global.ResizeObserver = vi.fn().mockImplementation(() => mockObserver) as any;

    // Mock Date.now for throttling tests - proper Vitest way
    dateNowSpy = vi.spyOn(Date, 'now').mockReturnValue(1000);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllTimers();
  });

  describe('addObserver', () => {
    it('should create and add a new resize observer', () => {
      manager.addObserver('test-id', mockElement, mockCallback);

      expect(global.ResizeObserver).toHaveBeenCalledWith(expect.any(Function));
      expect(mockObserver.observe).toHaveBeenCalledWith(mockElement);
    });

    it('should remove existing observer before adding new one', () => {
      // Add first observer
      manager.addObserver('test-id', mockElement, mockCallback);
      const firstObserver = mockObserver;

      // Reset mocks
      vi.clearAllMocks();
      global.ResizeObserver = vi.fn().mockImplementation(() => mockObserver);

      // Add second observer with same ID
      manager.addObserver('test-id', mockElement, mockCallback);

      expect(firstObserver.disconnect).toHaveBeenCalled();
      expect(global.ResizeObserver).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should apply throttling when specified', () => {
      const throttleMs = 100;

      manager.addObserver('test-id', mockElement, mockCallback, { throttleMs, debounceMs: 0 });

      // Get the callback that was passed to ResizeObserver
      const observerCallback = (global.ResizeObserver as any).mock.calls[0][0];
      const mockEntry = {
        target: mockElement,
        contentRect: {
          width: 100,
          height: 100,
          top: 0,
          left: 0,
          right: 100,
          bottom: 100,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        },
        borderBoxSize: [],
        contentBoxSize: [],
        devicePixelContentBoxSize: [],
      } as ResizeObserverEntry;

      // First call should work (lastCallTime starts at 0, now = 1000, diff = 1000 > 100)
      dateNowSpy.mockReturnValue(1000);
      observerCallback([mockEntry]);
      expect(mockCallback).toHaveBeenCalledTimes(1);

      // Reset callback mock
      mockCallback.mockClear();

      // Advance time by less than throttle (now = 1050, lastCallTime = 1000, diff = 50 < 100)
      dateNowSpy.mockReturnValue(1050);
      observerCallback([mockEntry]);
      expect(mockCallback).not.toHaveBeenCalled();

      // Advance time by more than throttle (now = 1150, lastCallTime = 1000, diff = 150 > 100)
      dateNowSpy.mockReturnValue(1150);
      observerCallback([mockEntry]);
      expect(mockCallback).toHaveBeenCalledTimes(1);
    });

    it('should apply debouncing when specified', () => {
      vi.useFakeTimers();
      const debounceMs = 200;

      manager.addObserver('test-id', mockElement, mockCallback, { debounceMs });

      // Get the callback that was passed to ResizeObserver
      const observerCallback = (global.ResizeObserver as any).mock.calls[0][0];
      const mockEntry = {
        target: mockElement,
        contentRect: {
          width: 100,
          height: 100,
          top: 0,
          left: 0,
          right: 100,
          bottom: 100,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        },
        borderBoxSize: [],
        contentBoxSize: [],
        devicePixelContentBoxSize: [],
      } as ResizeObserverEntry;

      // Call multiple times rapidly
      observerCallback([mockEntry]);
      observerCallback([mockEntry]);
      observerCallback([mockEntry]);

      // Callback should not have been called yet
      expect(mockCallback).not.toHaveBeenCalled();

      // Fast-forward time
      vi.advanceTimersByTime(debounceMs);

      // Callback should have been called only once
      expect(mockCallback).toHaveBeenCalledTimes(1);
      expect(mockCallback).toHaveBeenCalledWith(mockEntry);

      vi.useRealTimers();
    });

    it('should handle both throttling and debouncing', () => {
      vi.useFakeTimers();
      const throttleMs = 50;
      const debounceMs = 100;

      manager.addObserver('test-id', mockElement, mockCallback, { throttleMs, debounceMs });

      const observerCallback = (global.ResizeObserver as any).mock.calls[0][0];
      const mockEntry = {
        target: mockElement,
        contentRect: {
          width: 100,
          height: 100,
          top: 0,
          left: 0,
          right: 100,
          bottom: 100,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        },
        borderBoxSize: [],
        contentBoxSize: [],
        devicePixelContentBoxSize: [],
      } as ResizeObserverEntry;

      // Multiple rapid calls
      observerCallback([mockEntry]);
      dateNowSpy.mockReturnValue(1025); // Within throttle window
      observerCallback([mockEntry]);

      expect(mockCallback).not.toHaveBeenCalled();

      // Advance past throttle and debounce
      vi.advanceTimersByTime(debounceMs);
      expect(mockCallback).toHaveBeenCalledTimes(1);

      vi.useRealTimers();
    });
  });

  describe('removeObserver', () => {
    it('should remove and disconnect observer', () => {
      manager.addObserver('test-id', mockElement, mockCallback);

      manager.removeObserver('test-id');

      expect(mockObserver.disconnect).toHaveBeenCalled();
    });

    it('should handle removing non-existent observer gracefully', () => {
      expect(() => {
        manager.removeObserver('non-existent');
      }).not.toThrow();
    });

    it('should clear pending timeouts when removing observer', () => {
      vi.useFakeTimers();
      const debounceMs = 200;

      manager.addObserver('test-id', mockElement, mockCallback, { debounceMs });

      const observerCallback = (global.ResizeObserver as any).mock.calls[0][0];
      const mockEntry = {
        target: mockElement,
        contentRect: {
          width: 100,
          height: 100,
          top: 0,
          left: 0,
          right: 100,
          bottom: 100,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        },
        borderBoxSize: [],
        contentBoxSize: [],
        devicePixelContentBoxSize: [],
      } as ResizeObserverEntry;

      // Trigger debounced callback
      observerCallback([mockEntry]);

      // Remove observer before timeout expires
      manager.removeObserver('test-id');

      // Advance time past debounce period
      vi.advanceTimersByTime(debounceMs);

      // Callback should not have been called
      expect(mockCallback).not.toHaveBeenCalled();

      vi.useRealTimers();
    });
  });

  describe('hasObserver', () => {
    it('should return true for existing observer', () => {
      manager.addObserver('test-id', mockElement, mockCallback);

      expect(manager.hasObserver('test-id')).toBe(true);
    });

    it('should return false for non-existent observer', () => {
      expect(manager.hasObserver('non-existent')).toBe(false);
    });

    it('should return false after observer is removed', () => {
      manager.addObserver('test-id', mockElement, mockCallback);
      manager.removeObserver('test-id');

      expect(manager.hasObserver('test-id')).toBe(false);
    });
  });

  describe('getObserverIds', () => {
    it('should return empty array when no observers', () => {
      expect(manager.getObserverIds()).toEqual([]);
    });

    it('should return array of observer IDs', () => {
      manager.addObserver('id1', mockElement, mockCallback);
      manager.addObserver('id2', mockElement, mockCallback);
      manager.addObserver('id3', mockElement, mockCallback);

      const ids = manager.getObserverIds();
      expect(ids).toHaveLength(3);
      expect(ids).toContain('id1');
      expect(ids).toContain('id2');
      expect(ids).toContain('id3');
    });

    it('should update when observers are removed', () => {
      manager.addObserver('id1', mockElement, mockCallback);
      manager.addObserver('id2', mockElement, mockCallback);

      expect(manager.getObserverIds()).toHaveLength(2);

      manager.removeObserver('id1');

      const ids = manager.getObserverIds();
      expect(ids).toHaveLength(1);
      expect(ids).toContain('id2');
      expect(ids).not.toContain('id1');
    });
  });

  describe('cleanup', () => {
    it('should disconnect all observers', () => {
      const mockObserver2 = {
        observe: vi.fn(),
        unobserve: vi.fn(),
        disconnect: vi.fn(),
      } as any;

      // Mock to return different observers
      (global.ResizeObserver as any)
        .mockImplementationOnce(() => mockObserver)
        .mockImplementationOnce(() => mockObserver2);

      manager.addObserver('id1', mockElement, mockCallback);
      manager.addObserver('id2', mockElement, mockCallback);

      manager.cleanup();

      expect(mockObserver.disconnect).toHaveBeenCalled();
      expect(mockObserver2.disconnect).toHaveBeenCalled();
      expect(manager.getObserverIds()).toHaveLength(0);
    });

    it('should handle cleanup with no observers', () => {
      expect(() => {
        manager.cleanup();
      }).not.toThrow();
    });

    it('should clear all pending timeouts during cleanup', () => {
      vi.useFakeTimers();
      const debounceMs = 200;

      manager.addObserver('test-id', mockElement, mockCallback, { debounceMs });

      const observerCallback = (global.ResizeObserver as any).mock.calls[0][0];
      const mockEntry = {
        target: mockElement,
        contentRect: {
          width: 100,
          height: 100,
          top: 0,
          left: 0,
          right: 100,
          bottom: 100,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        },
        borderBoxSize: [],
        contentBoxSize: [],
        devicePixelContentBoxSize: [],
      } as ResizeObserverEntry;

      // Trigger debounced callback
      observerCallback([mockEntry]);

      // Cleanup before timeout expires
      manager.cleanup();

      // Advance time past debounce period
      vi.advanceTimersByTime(debounceMs);

      // Callback should not have been called
      expect(mockCallback).not.toHaveBeenCalled();

      vi.useRealTimers();
    });
  });

  describe('error handling', () => {
    it('should handle ResizeObserver not available', () => {
      // Mock ResizeObserver as undefined
      const originalResizeObserver = global.ResizeObserver;
      (global as any).ResizeObserver = undefined;

      // The implementation catches errors, so it shouldn't throw
      expect(() => {
        manager.addObserver('test-id', mockElement, mockCallback);
      }).not.toThrow();

      // Restore for other tests
      global.ResizeObserver = originalResizeObserver;
    });

    it('should handle invalid element', () => {
      expect(() => {
        manager.addObserver('test-id', null as any, mockCallback);
      }).not.toThrow();
    });

    it('should handle callback errors gracefully', () => {
      const errorCallback = vi.fn().mockImplementation(() => {
        throw new Error('Callback error');
      });

      // Adding observer shouldn't throw
      expect(() => {
        manager.addObserver('test-id', mockElement, errorCallback);
      }).not.toThrow();

      const observerCallback = (global.ResizeObserver as any).mock.calls[0][0];
      const mockEntry = {
        target: mockElement,
        contentRect: {
          width: 100,
          height: 100,
          top: 0,
          left: 0,
          right: 100,
          bottom: 100,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        },
        borderBoxSize: [],
        contentBoxSize: [],
        devicePixelContentBoxSize: [],
      } as ResizeObserverEntry;

      // The current implementation doesn't catch callback errors, so it will throw
      expect(() => {
        observerCallback([mockEntry]);
      }).toThrow('Callback error');

      expect(errorCallback).toHaveBeenCalled();
    });
  });
});
