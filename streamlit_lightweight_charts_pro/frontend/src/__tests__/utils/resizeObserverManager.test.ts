// @ts-nocheck
import { ResizeObserverManager } from '../../utils/resizeObserverManager';

describe('ResizeObserverManager', () => {
  let manager: ResizeObserverManager;
  let mockElement: HTMLElement;
  let mockObserver: jest.Mocked<ResizeObserver>;
  let mockCallback: jest.Mock;

  beforeEach(() => {
    manager = new ResizeObserverManager();
    mockElement = document.createElement('div');
    mockCallback = jest.fn();

    // Mock ResizeObserver
    mockObserver = {
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    } as jest.Mocked<ResizeObserver>;

    // Mock ResizeObserver constructor
    global.ResizeObserver = jest.fn().mockImplementation(() => mockObserver);

    // Mock Date.now for throttling tests
    jest.spyOn(Date, 'now').mockReturnValue(1000);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllTimers();
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
      jest.clearAllMocks();
      global.ResizeObserver = jest.fn().mockImplementation(() => mockObserver);

      // Add second observer with same ID
      manager.addObserver('test-id', mockElement, mockCallback);

      expect(firstObserver.disconnect).toHaveBeenCalled();
      expect(global.ResizeObserver).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should apply throttling when specified', () => {
      jest.useFakeTimers();
      const throttleMs = 100;

      manager.addObserver('test-id', mockElement, mockCallback, { throttleMs });

      // Get the callback that was passed to ResizeObserver
      const observerCallback = (global.ResizeObserver as jest.Mock).mock.calls[0][0];
      const mockEntry = { target: mockElement } as ResizeObserverEntry;

      // First call should work
      observerCallback([mockEntry]);
      expect(mockCallback).toHaveBeenCalledTimes(1);

      // Reset callback mock
      mockCallback.mockClear();

      // Advance time by less than throttle
      (Date.now as jest.Mock).mockReturnValue(1050);
      observerCallback([mockEntry]);
      expect(mockCallback).not.toHaveBeenCalled();

      // Advance time by more than throttle
      (Date.now as jest.Mock).mockReturnValue(1150);
      observerCallback([mockEntry]);
      expect(mockCallback).toHaveBeenCalledTimes(1);

      jest.useRealTimers();
    });

    it('should apply debouncing when specified', () => {
      jest.useFakeTimers();
      const debounceMs = 200;

      manager.addObserver('test-id', mockElement, mockCallback, { debounceMs });

      // Get the callback that was passed to ResizeObserver
      const observerCallback = (global.ResizeObserver as jest.Mock).mock.calls[0][0];
      const mockEntry = { target: mockElement } as ResizeObserverEntry;

      // Call multiple times rapidly
      observerCallback([mockEntry]);
      observerCallback([mockEntry]);
      observerCallback([mockEntry]);

      // Callback should not have been called yet
      expect(mockCallback).not.toHaveBeenCalled();

      // Fast-forward time
      jest.advanceTimersByTime(debounceMs);

      // Callback should have been called only once
      expect(mockCallback).toHaveBeenCalledTimes(1);
      expect(mockCallback).toHaveBeenCalledWith(mockEntry);

      jest.useRealTimers();
    });

    it('should handle both throttling and debouncing', () => {
      jest.useFakeTimers();
      const throttleMs = 50;
      const debounceMs = 100;

      manager.addObserver('test-id', mockElement, mockCallback, { throttleMs, debounceMs });

      const observerCallback = (global.ResizeObserver as jest.Mock).mock.calls[0][0];
      const mockEntry = { target: mockElement } as ResizeObserverEntry;

      // Multiple rapid calls
      observerCallback([mockEntry]);
      (Date.now as jest.Mock).mockReturnValue(1025); // Within throttle window
      observerCallback([mockEntry]);

      expect(mockCallback).not.toHaveBeenCalled();

      // Advance past throttle and debounce
      jest.advanceTimersByTime(debounceMs);
      expect(mockCallback).toHaveBeenCalledTimes(1);

      jest.useRealTimers();
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
      jest.useFakeTimers();
      const debounceMs = 200;

      manager.addObserver('test-id', mockElement, mockCallback, { debounceMs });

      const observerCallback = (global.ResizeObserver as jest.Mock).mock.calls[0][0];
      const mockEntry = { target: mockElement } as ResizeObserverEntry;

      // Trigger debounced callback
      observerCallback([mockEntry]);

      // Remove observer before timeout expires
      manager.removeObserver('test-id');

      // Advance time past debounce period
      jest.advanceTimersByTime(debounceMs);

      // Callback should not have been called
      expect(mockCallback).not.toHaveBeenCalled();

      jest.useRealTimers();
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
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: jest.fn(),
      } as jest.Mocked<ResizeObserver>;

      // Mock to return different observers
      (global.ResizeObserver as jest.Mock)
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
      jest.useFakeTimers();
      const debounceMs = 200;

      manager.addObserver('test-id', mockElement, mockCallback, { debounceMs });

      const observerCallback = (global.ResizeObserver as jest.Mock).mock.calls[0][0];
      const mockEntry = { target: mockElement } as ResizeObserverEntry;

      // Trigger debounced callback
      observerCallback([mockEntry]);

      // Cleanup before timeout expires
      manager.cleanup();

      // Advance time past debounce period
      jest.advanceTimersByTime(debounceMs);

      // Callback should not have been called
      expect(mockCallback).not.toHaveBeenCalled();

      jest.useRealTimers();
    });
  });

  describe('error handling', () => {
    it('should handle ResizeObserver not available', () => {
      // Mock ResizeObserver as undefined
      (global as any).ResizeObserver = undefined;

      expect(() => {
        manager.addObserver('test-id', mockElement, mockCallback);
      }).toThrow();
    });

    it('should handle invalid element', () => {
      expect(() => {
        manager.addObserver('test-id', null as any, mockCallback);
      }).not.toThrow();
    });

    it('should handle callback errors gracefully', () => {
      const errorCallback = jest.fn().mockImplementation(() => {
        throw new Error('Callback error');
      });

      manager.addObserver('test-id', mockElement, errorCallback);

      const observerCallback = (global.ResizeObserver as jest.Mock).mock.calls[0][0];
      const mockEntry = { target: mockElement } as ResizeObserverEntry;

      expect(() => {
        observerCallback([mockEntry]);
      }).not.toThrow();

      expect(errorCallback).toHaveBeenCalled();
    });
  });
});
