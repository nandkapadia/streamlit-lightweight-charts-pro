/**
 * @vitest-environment jsdom
 * @fileoverview Tests for Primitive Event Manager
 *
 * Tests cover:
 * - Singleton pattern per chart ID
 * - Event subscription and unsubscription
 * - Event emission and listener invocation
 * - Chart event integration (crosshair, click, time scale, resize)
 * - Event throttling for performance
 * - Memory leak prevention
 * - Error handling in listeners
 * - Cleanup and destruction
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Unmock the module since it's globally mocked in globalMockSetup.ts
vi.unmock('../../services/PrimitiveEventManager');

import {
  PrimitiveEventManager,
  EventSubscription,
  createEventManagerIntegration,
} from '../../services/PrimitiveEventManager';
import { IChartApi, ISeriesApi } from 'lightweight-charts';

// Mock time scale
const mockTimeScale = {
  subscribeVisibleTimeRangeChange: vi.fn(),
  unsubscribeVisibleTimeRangeChange: vi.fn(),
  getVisibleRange: vi.fn(() => ({ from: 1000, to: 2000 })),
};

// Mock lightweight-charts
const mockChart = {
  subscribeCrosshairMove: vi.fn(),
  unsubscribeCrosshairMove: vi.fn(),
  subscribeClick: vi.fn(),
  unsubscribeClick: vi.fn(),
  timeScale: vi.fn(() => mockTimeScale),
  chartElement: vi.fn(() => document.createElement('div')),
} as any as IChartApi;

// Mock ResizeObserver
const mockObserve = vi.fn();
const mockDisconnect = vi.fn();
const mockUnobserve = vi.fn();

class MockResizeObserver {
  observe = mockObserve;
  disconnect = mockDisconnect;
  unobserve = mockUnobserve;
}

describe('PrimitiveEventManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear mock function calls
    mockObserve.mockClear();
    mockDisconnect.mockClear();
    mockUnobserve.mockClear();
    mockTimeScale.subscribeVisibleTimeRangeChange.mockClear();
    mockTimeScale.unsubscribeVisibleTimeRangeChange.mockClear();

    global.ResizeObserver = MockResizeObserver as any;
    // Clean up all instances
    (PrimitiveEventManager as any).instances = new Map();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Singleton Pattern', () => {
    it('should return same instance for same chart ID', () => {
      const instance1 = PrimitiveEventManager.getInstance('chart-1');
      const instance2 = PrimitiveEventManager.getInstance('chart-1');

      expect(instance1).toBe(instance2);
    });

    it('should return different instances for different chart IDs', () => {
      const instance1 = PrimitiveEventManager.getInstance('chart-1');
      const instance2 = PrimitiveEventManager.getInstance('chart-2');

      expect(instance1).not.toBe(instance2);
    });

    it('should maintain separate state for different chart IDs', () => {
      const instance1 = PrimitiveEventManager.getInstance('chart-1');
      const instance2 = PrimitiveEventManager.getInstance('chart-2');

      const listener1 = vi.fn();
      const listener2 = vi.fn();

      instance1.subscribe('click', listener1);
      instance2.subscribe('click', listener2);

      instance1.emit('click', { time: 100, point: { x: 10, y: 20 }, seriesData: new Map() });

      expect(listener1).toHaveBeenCalled();
      expect(listener2).not.toHaveBeenCalled();
    });

    it('should get chart ID', () => {
      const instance = PrimitiveEventManager.getInstance('my-chart');

      expect(instance.getChartId()).toBe('my-chart');
    });
  });

  describe('Initialization', () => {
    it('should initialize with chart API', () => {
      const manager = PrimitiveEventManager.getInstance('chart-1');

      manager.initialize(mockChart);

      expect(manager.getChart()).toBe(mockChart);
    });

    it('should setup chart event listeners on initialization', () => {
      const manager = PrimitiveEventManager.getInstance('chart-1');

      manager.initialize(mockChart);

      expect(mockChart.subscribeCrosshairMove).toHaveBeenCalled();
      expect(mockChart.subscribeClick).toHaveBeenCalled();
      expect(mockTimeScale.subscribeVisibleTimeRangeChange).toHaveBeenCalled();
    });

    it('should setup resize observer on initialization', () => {
      const manager = PrimitiveEventManager.getInstance('chart-1');

      manager.initialize(mockChart);

      expect(mockObserve).toHaveBeenCalled();
    });

    it('should throw error when initializing destroyed manager', () => {
      const manager = PrimitiveEventManager.getInstance('chart-1');
      manager.destroy();

      expect(() => {
        manager.initialize(mockChart);
      }).toThrow('Cannot initialize destroyed PrimitiveEventManager');
    });
  });

  describe('Event Subscription', () => {
    it('should subscribe to event', () => {
      const manager = PrimitiveEventManager.getInstance('chart-1');
      const listener = vi.fn();

      const subscription = manager.subscribe('click', listener);

      expect(subscription).toBeDefined();
      expect(subscription.unsubscribe).toBeInstanceOf(Function);
    });

    it('should call listener when event is emitted', () => {
      const manager = PrimitiveEventManager.getInstance('chart-1');
      const listener = vi.fn();

      manager.subscribe('click', listener);
      manager.emit('click', { time: 100, point: { x: 10, y: 20 }, seriesData: new Map() });

      expect(listener).toHaveBeenCalledWith({
        time: 100,
        point: { x: 10, y: 20 },
        seriesData: expect.any(Map),
      });
    });

    it('should support multiple listeners for same event', () => {
      const manager = PrimitiveEventManager.getInstance('chart-1');
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      const listener3 = vi.fn();

      manager.subscribe('click', listener1);
      manager.subscribe('click', listener2);
      manager.subscribe('click', listener3);

      manager.emit('click', { time: 100, point: { x: 10, y: 20 }, seriesData: new Map() });

      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
      expect(listener3).toHaveBeenCalled();
    });

    it('should support subscriptions to different event types', () => {
      const manager = PrimitiveEventManager.getInstance('chart-1');
      const clickListener = vi.fn();
      const hoverListener = vi.fn();
      const resizeListener = vi.fn();

      manager.subscribe('click', clickListener);
      manager.subscribe('hover', hoverListener);
      manager.subscribe('resize', resizeListener);

      manager.emit('click', { time: 100, point: { x: 10, y: 20 }, seriesData: new Map() });

      expect(clickListener).toHaveBeenCalled();
      expect(hoverListener).not.toHaveBeenCalled();
      expect(resizeListener).not.toHaveBeenCalled();
    });

    it('should throw error when subscribing to destroyed manager', () => {
      const manager = PrimitiveEventManager.getInstance('chart-1');
      manager.destroy();

      expect(() => {
        manager.subscribe('click', vi.fn());
      }).toThrow('Cannot subscribe to destroyed PrimitiveEventManager');
    });
  });

  describe('Event Unsubscription', () => {
    it('should unsubscribe from event', () => {
      const manager = PrimitiveEventManager.getInstance('chart-1');
      const listener = vi.fn();

      const subscription = manager.subscribe('click', listener);
      subscription.unsubscribe();

      manager.emit('click', { time: 100, point: { x: 10, y: 20 }, seriesData: new Map() });

      expect(listener).not.toHaveBeenCalled();
    });

    it('should only remove specific listener', () => {
      const manager = PrimitiveEventManager.getInstance('chart-1');
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      manager.subscribe('click', listener1);
      const subscription2 = manager.subscribe('click', listener2);
      subscription2.unsubscribe();

      manager.emit('click', { time: 100, point: { x: 10, y: 20 }, seriesData: new Map() });

      expect(listener1).toHaveBeenCalled();
      expect(listener2).not.toHaveBeenCalled();
    });

    it('should allow multiple unsubscribe calls safely', () => {
      const manager = PrimitiveEventManager.getInstance('chart-1');
      const listener = vi.fn();

      const subscription = manager.subscribe('click', listener);

      expect(() => {
        subscription.unsubscribe();
        subscription.unsubscribe();
        subscription.unsubscribe();
      }).not.toThrow();
    });

    it('should clean up event type when last listener is removed', () => {
      const manager = PrimitiveEventManager.getInstance('chart-1');
      const listener = vi.fn();

      const subscription = manager.subscribe('click', listener);
      subscription.unsubscribe();

      const counts = manager.getEventListenerCount();
      expect(counts.click).toBeUndefined();
    });
  });

  describe('Event Emission', () => {
    it('should emit crosshairMove event', () => {
      const manager = PrimitiveEventManager.getInstance('chart-1');
      const listener = vi.fn();

      manager.subscribe('crosshairMove', listener);
      manager.emit('crosshairMove', {
        time: 100,
        point: { x: 10, y: 20 },
        seriesData: new Map(),
      });

      expect(listener).toHaveBeenCalledWith({
        time: 100,
        point: { x: 10, y: 20 },
        seriesData: expect.any(Map),
      });
    });

    it('should emit dataUpdate event', () => {
      const manager = PrimitiveEventManager.getInstance('chart-1');
      const listener = vi.fn();
      const mockSeries = {} as ISeriesApi<any>;

      manager.subscribe('dataUpdate', listener);
      manager.emit('dataUpdate', {
        series: mockSeries,
        data: [{ time: 1, value: 100 }],
      });

      expect(listener).toHaveBeenCalledWith({
        series: mockSeries,
        data: [{ time: 1, value: 100 }],
      });
    });

    it('should emit resize event', () => {
      const manager = PrimitiveEventManager.getInstance('chart-1');
      const listener = vi.fn();

      manager.subscribe('resize', listener);
      manager.emit('resize', { width: 800, height: 600 });

      expect(listener).toHaveBeenCalledWith({ width: 800, height: 600 });
    });

    it('should not emit to destroyed manager', () => {
      const manager = PrimitiveEventManager.getInstance('chart-1');
      const listener = vi.fn();

      manager.subscribe('click', listener);
      manager.destroy();

      manager.emit('click', { time: 100, point: { x: 10, y: 20 }, seriesData: new Map() });

      expect(listener).not.toHaveBeenCalled();
    });

    it('should handle listener errors gracefully', () => {
      const manager = PrimitiveEventManager.getInstance('chart-1');
      const errorListener = vi.fn(() => {
        throw new Error('Listener error');
      });
      const normalListener = vi.fn();

      manager.subscribe('click', errorListener);
      manager.subscribe('click', normalListener);

      expect(() => {
        manager.emit('click', { time: 100, point: { x: 10, y: 20 }, seriesData: new Map() });
      }).not.toThrow();

      expect(normalListener).toHaveBeenCalled();
    });
  });

  describe('Specialized Event Emitters', () => {
    it('should emit visibility change event', () => {
      const manager = PrimitiveEventManager.getInstance('chart-1');
      const listener = vi.fn();

      manager.subscribe('visibilityChange', listener);
      manager.emitVisibilityChange('primitive-1', true);

      expect(listener).toHaveBeenCalledWith({
        primitiveId: 'primitive-1',
        visible: true,
      });
    });

    it('should emit config change event', () => {
      const manager = PrimitiveEventManager.getInstance('chart-1');
      const listener = vi.fn();
      const config = { color: '#FF0000', lineWidth: 2 };

      manager.subscribe('configChange', listener);
      manager.emitConfigChange('primitive-1', config);

      expect(listener).toHaveBeenCalledWith({
        primitiveId: 'primitive-1',
        config,
      });
    });

    it('should emit custom event', () => {
      const manager = PrimitiveEventManager.getInstance('chart-1');
      const listener = vi.fn();

      manager.subscribe('custom', listener);
      manager.emitCustomEvent('myCustomEvent', { foo: 'bar' });

      expect(listener).toHaveBeenCalledWith({
        eventType: 'myCustomEvent',
        data: { foo: 'bar' },
      });
    });
  });

  describe('Chart Event Integration', () => {
    it('should emit crosshairMove when chart crosshair moves', () => {
      const manager = PrimitiveEventManager.getInstance('chart-1');
      const listener = vi.fn();

      manager.subscribe('crosshairMove', listener);
      manager.initialize(mockChart);

      // Simulate chart crosshair move
      const crosshairHandler = (mockChart.subscribeCrosshairMove as any).mock.calls[0][0];
      crosshairHandler({
        time: 100,
        point: { x: 10, y: 20 },
        seriesData: new Map(),
      });

      expect(listener).toHaveBeenCalled();
    });

    it('should emit hover when chart crosshair moves with valid point', () => {
      const manager = PrimitiveEventManager.getInstance('chart-1');
      const hoverListener = vi.fn();

      manager.subscribe('hover', hoverListener);
      manager.initialize(mockChart);

      const crosshairHandler = (mockChart.subscribeCrosshairMove as any).mock.calls[0][0];
      crosshairHandler({
        time: 100,
        point: { x: 10, y: 20 },
        seriesData: new Map(),
      });

      expect(hoverListener).toHaveBeenCalledWith({
        time: 100,
        point: { x: 10, y: 20 },
        seriesData: expect.any(Map),
      });
    });

    it('should not emit hover when crosshair point is null', () => {
      const manager = PrimitiveEventManager.getInstance('chart-1');
      const hoverListener = vi.fn();

      manager.subscribe('hover', hoverListener);
      manager.initialize(mockChart);

      const crosshairHandler = (mockChart.subscribeCrosshairMove as any).mock.calls[0][0];
      crosshairHandler({
        time: 100,
        point: null,
        seriesData: new Map(),
      });

      expect(hoverListener).not.toHaveBeenCalled();
    });

    it('should emit click when chart is clicked', () => {
      const manager = PrimitiveEventManager.getInstance('chart-1');
      const listener = vi.fn();

      manager.subscribe('click', listener);
      manager.initialize(mockChart);

      const clickHandler = (mockChart.subscribeClick as any).mock.calls[0][0];
      clickHandler({
        time: 100,
        point: { x: 10, y: 20 },
        seriesData: new Map(),
      });

      expect(listener).toHaveBeenCalledWith({
        time: 100,
        point: { x: 10, y: 20 },
        seriesData: expect.any(Map),
      });
    });

    it('should not emit click without valid time and point', () => {
      const manager = PrimitiveEventManager.getInstance('chart-1');
      const listener = vi.fn();

      manager.subscribe('click', listener);
      manager.initialize(mockChart);

      const clickHandler = (mockChart.subscribeClick as any).mock.calls[0][0];
      clickHandler({ time: null, point: null });

      expect(listener).not.toHaveBeenCalled();
    });

    it('should emit timeScaleChange when time scale changes', () => {
      const manager = PrimitiveEventManager.getInstance('chart-1');
      const listener = vi.fn();

      manager.subscribe('timeScaleChange', listener);
      manager.initialize(mockChart);

      const timeScaleHandler = mockTimeScale.subscribeVisibleTimeRangeChange.mock.calls[0][0];
      timeScaleHandler();

      expect(listener).toHaveBeenCalledWith({
        from: 1000,
        to: 2000,
      });
    });

    it('should emit resize when container resizes', () => {
      const manager = PrimitiveEventManager.getInstance('chart-1');
      const listener = vi.fn();

      manager.subscribe('resize', listener);
      manager.initialize(mockChart);

      // Verify ResizeObserver was set up
      expect(mockObserve).toHaveBeenCalled();
      expect(mockObserve).toHaveBeenCalledWith(mockChart.chartElement());
    });
  });

  describe('Crosshair Position Tracking', () => {
    it('should track last crosshair position', () => {
      const manager = PrimitiveEventManager.getInstance('chart-1');
      manager.initialize(mockChart);

      const crosshairHandler = (mockChart.subscribeCrosshairMove as any).mock.calls[0][0];
      crosshairHandler({
        time: 100,
        point: { x: 10, y: 20 },
        seriesData: new Map(),
      });

      const position = manager.getCurrentCrosshairPosition();
      expect(position).toEqual({
        time: 100,
        point: { x: 10, y: 20 },
      });
    });

    it('should return null before any crosshair movement', () => {
      const manager = PrimitiveEventManager.getInstance('chart-1');

      const position = manager.getCurrentCrosshairPosition();
      expect(position).toBeNull();
    });
  });

  describe('Event Listener Count', () => {
    it('should track listener counts', () => {
      const manager = PrimitiveEventManager.getInstance('chart-1');

      manager.subscribe('click', vi.fn());
      manager.subscribe('click', vi.fn());
      manager.subscribe('hover', vi.fn());

      const counts = manager.getEventListenerCount();

      expect(counts.click).toBe(2);
      expect(counts.hover).toBe(1);
    });

    it('should return empty object when no listeners', () => {
      const manager = PrimitiveEventManager.getInstance('chart-1');

      const counts = manager.getEventListenerCount();

      expect(counts).toEqual({});
    });
  });

  describe('Destruction and Cleanup', () => {
    it('should destroy event manager', () => {
      const manager = PrimitiveEventManager.getInstance('chart-1');
      manager.initialize(mockChart);

      manager.destroy();

      expect(manager.isDestroyed()).toBe(true);
    });

    it('should unsubscribe from chart events on destroy', () => {
      const manager = PrimitiveEventManager.getInstance('chart-1');
      manager.initialize(mockChart);

      manager.destroy();

      expect(mockChart.unsubscribeCrosshairMove).toHaveBeenCalled();
      expect(mockChart.unsubscribeClick).toHaveBeenCalled();
      expect(mockTimeScale.unsubscribeVisibleTimeRangeChange).toHaveBeenCalled();
    });

    it('should disconnect resize observer on destroy', () => {
      const manager = PrimitiveEventManager.getInstance('chart-1');
      manager.initialize(mockChart);

      manager.destroy();

      expect(mockDisconnect).toHaveBeenCalled();
    });

    it('should clear all event listeners on destroy', () => {
      const manager = PrimitiveEventManager.getInstance('chart-1');
      manager.subscribe('click', vi.fn());
      manager.subscribe('hover', vi.fn());

      manager.destroy();

      const counts = manager.getEventListenerCount();
      expect(counts).toEqual({});
    });

    it('should clear chart reference on destroy', () => {
      const manager = PrimitiveEventManager.getInstance('chart-1');
      manager.initialize(mockChart);

      manager.destroy();

      expect(manager.getChart()).toBeNull();
    });

    it('should allow multiple destroy calls safely', () => {
      const manager = PrimitiveEventManager.getInstance('chart-1');

      expect(() => {
        manager.destroy();
        manager.destroy();
        manager.destroy();
      }).not.toThrow();
    });

    it('should cleanup instance from registry', () => {
      PrimitiveEventManager.getInstance('chart-1');

      PrimitiveEventManager.cleanup('chart-1');

      // Getting instance again should create new one
      const newInstance = PrimitiveEventManager.getInstance('chart-1');
      expect(newInstance.isDestroyed()).toBe(false);
    });

    it('should handle cleanup errors gracefully', () => {
      const manager = PrimitiveEventManager.getInstance('chart-1');
      manager.initialize(mockChart);

      // Make cleanup throw error
      (mockChart.unsubscribeCrosshairMove as any).mockImplementationOnce(() => {
        throw new Error('Cleanup error');
      });

      expect(() => {
        manager.destroy();
      }).not.toThrow();

      expect(manager.isDestroyed()).toBe(true);
    });
  });

  describe('Event Manager Integration Helper', () => {
    it('should create event manager integration', () => {
      const integration = createEventManagerIntegration('chart-1');

      expect(integration).toBeDefined();
      expect(integration.getEventManager).toBeInstanceOf(Function);
      expect(integration.subscribeToEvents).toBeInstanceOf(Function);
      expect(integration.unsubscribeFromEvents).toBeInstanceOf(Function);
    });

    it('should get event manager from integration', () => {
      const integration = createEventManagerIntegration('chart-1');

      const manager = integration.getEventManager();

      expect(manager).toBeInstanceOf(PrimitiveEventManager);
      expect(manager?.getChartId()).toBe('chart-1');
    });

    it('should initialize event manager with chart if provided', () => {
      const integration = createEventManagerIntegration('chart-1', mockChart);

      const manager = integration.getEventManager();

      expect(manager?.getChart()).toBe(mockChart);
    });

    it('should return same event manager on multiple calls', () => {
      const integration = createEventManagerIntegration('chart-1');

      const manager1 = integration.getEventManager();
      const manager2 = integration.getEventManager();

      expect(manager1).toBe(manager2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long chart IDs', () => {
      const longId = 'chart-' + 'x'.repeat(1000);

      const manager = PrimitiveEventManager.getInstance(longId);

      expect(manager.getChartId()).toBe(longId);
    });

    it('should handle special characters in chart ID', () => {
      const specialId = 'chart-!@#$%^&*()';

      const manager = PrimitiveEventManager.getInstance(specialId);

      expect(manager.getChartId()).toBe(specialId);
    });

    it('should handle rapid event emissions', () => {
      const manager = PrimitiveEventManager.getInstance('chart-1');
      const listener = vi.fn();

      manager.subscribe('click', listener);

      for (let i = 0; i < 1000; i++) {
        manager.emit('click', { time: i, point: { x: i, y: i }, seriesData: new Map() });
      }

      expect(listener).toHaveBeenCalledTimes(1000);
    });

    it('should handle many subscribers', () => {
      const manager = PrimitiveEventManager.getInstance('chart-1');
      const listeners: any[] = [];

      for (let i = 0; i < 100; i++) {
        const listener = vi.fn();
        listeners.push(listener);
        manager.subscribe('click', listener);
      }

      manager.emit('click', { time: 100, point: { x: 10, y: 20 }, seriesData: new Map() });

      listeners.forEach(listener => {
        expect(listener).toHaveBeenCalledOnce();
      });
    });

    it('should handle subscribing during event emission', () => {
      const manager = PrimitiveEventManager.getInstance('chart-1');
      const listener1 = vi.fn(() => {
        // Subscribe new listener during emission
        manager.subscribe('click', vi.fn());
      });

      manager.subscribe('click', listener1);

      expect(() => {
        manager.emit('click', { time: 100, point: { x: 10, y: 20 }, seriesData: new Map() });
      }).not.toThrow();
    });

    it('should handle unsubscribing during event emission', () => {
      const manager = PrimitiveEventManager.getInstance('chart-1');
      const subscriptionRef: { current?: EventSubscription } = {};

      const listener = vi.fn(() => {
        subscriptionRef.current?.unsubscribe();
      });

      const subscription = manager.subscribe('click', listener);
      subscriptionRef.current = subscription;

      expect(() => {
        manager.emit('click', { time: 100, point: { x: 10, y: 20 }, seriesData: new Map() });
      }).not.toThrow();
    });
  });

  describe('Performance Considerations', () => {
    it('should handle missing ResizeObserver gracefully', () => {
      const originalResizeObserver = global.ResizeObserver;
      (global as any).ResizeObserver = undefined;

      const manager = PrimitiveEventManager.getInstance('chart-1');

      expect(() => {
        manager.initialize(mockChart);
      }).not.toThrow();

      global.ResizeObserver = originalResizeObserver;
    });

    it('should handle chart without element gracefully', () => {
      const chartWithoutElement = {
        ...mockChart,
        chartElement: vi.fn(() => null),
      } as any as IChartApi;

      const manager = PrimitiveEventManager.getInstance('chart-1');

      expect(() => {
        manager.initialize(chartWithoutElement);
      }).not.toThrow();
    });
  });
});
