/**
 * @vitest-environment jsdom
 * @fileoverview Tests for Streamlit backend integration for series configuration
 *
 * Tests cover:
 * - Singleton pattern
 * - Configuration state management
 * - Debounced backend synchronization
 * - State restoration from backend
 * - Series type inference
 * - Callback creation
 * - Statistics and debugging
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  StreamlitSeriesConfigService,
  SeriesConfigState,
} from '../../services/StreamlitSeriesConfigService';
import { SeriesConfiguration } from '../../types/SeriesTypes';

// Mock Streamlit
vi.mock('streamlit-component-lib', () => ({
  Streamlit: {
    setComponentValue: vi.fn(),
  },
}));

// Mock isStreamlitComponentReady to return true for tests
vi.mock('../../hooks/useStreamlit', () => ({
  isStreamlitComponentReady: vi.fn(() => true),
}));

// Mock logger
vi.mock('../../utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    log: vi.fn(),
  },
}));

describe('StreamlitSeriesConfigService', () => {
  let service: StreamlitSeriesConfigService;
  let mockSetComponentValue: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    // Setup fake timers for debounce tests
    vi.useFakeTimers();

    // Get the mock function
    const { Streamlit } = await import('streamlit-component-lib');
    mockSetComponentValue = Streamlit.setComponentValue as ReturnType<typeof vi.fn>;

    // Reset singleton by getting fresh instance and resetting it
    service = StreamlitSeriesConfigService.getInstance();
    service.reset();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance on multiple calls', () => {
      const instance1 = StreamlitSeriesConfigService.getInstance();
      const instance2 = StreamlitSeriesConfigService.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('should maintain state across getInstance calls', () => {
      const instance1 = StreamlitSeriesConfigService.getInstance();
      instance1.recordConfigChange(0, 'series-1', 'line', { color: '#FF0000' });

      const instance2 = StreamlitSeriesConfigService.getInstance();
      const config = instance2.getSeriesConfig(0, 'series-1');

      expect(config).toEqual({ color: '#FF0000' });
    });
  });

  describe('Initialization', () => {
    it('should start with empty state by default', () => {
      const state = service.getCompleteState();

      expect(state).toEqual({});
    });

    it('should initialize with provided state', () => {
      const initialState: SeriesConfigState = {
        'chart-1': {
          0: {
            'series-1': {
              config: { color: '#FF0000' },
              seriesType: 'line',
              lastModified: Date.now(),
            },
          },
        },
      };

      service.initialize(initialState);

      const state = service.getCompleteState();
      expect(state).toEqual(initialState);
    });

    it('should handle initialization with undefined', () => {
      service.initialize(undefined);

      const state = service.getCompleteState();
      expect(state).toEqual({});
    });
  });

  describe('Recording Configuration Changes', () => {
    it('should record a series configuration change', () => {
      const config: SeriesConfiguration = { color: '#FF0000', lineWidth: 2 };

      service.recordConfigChange(0, 'series-1', 'line', config);

      const retrieved = service.getSeriesConfig(0, 'series-1');
      expect(retrieved).toEqual(config);
    });

    it('should use default chart ID when not provided', () => {
      const config: SeriesConfiguration = { color: '#00FF00' };

      service.recordConfigChange(0, 'series-1', 'line', config);

      const retrieved = service.getSeriesConfig(0, 'series-1', 'default');
      expect(retrieved).toEqual(config);
    });

    it('should use provided chart ID', () => {
      const config: SeriesConfiguration = { color: '#0000FF' };

      service.recordConfigChange(0, 'series-1', 'line', config, 'chart-custom');

      const retrieved = service.getSeriesConfig(0, 'series-1', 'chart-custom');
      expect(retrieved).toEqual(config);
    });

    it('should create a deep copy of configuration', () => {
      const config: SeriesConfiguration = { color: '#FF0000' };

      service.recordConfigChange(0, 'series-1', 'line', config);

      // Mutate original
      config.color = '#00FF00';

      const retrieved = service.getSeriesConfig(0, 'series-1');
      expect(retrieved?.color).toBe('#FF0000');
    });

    it('should handle multiple series in same pane', () => {
      service.recordConfigChange(0, 'series-1', 'line', { color: '#FF0000' });
      service.recordConfigChange(0, 'series-2', 'area', { color: '#00FF00' });

      const config1 = service.getSeriesConfig(0, 'series-1');
      const config2 = service.getSeriesConfig(0, 'series-2');

      expect(config1?.color).toBe('#FF0000');
      expect(config2?.color).toBe('#00FF00');
    });

    it('should handle multiple panes', () => {
      service.recordConfigChange(0, 'series-1', 'line', { color: '#FF0000' });
      service.recordConfigChange(1, 'series-2', 'area', { color: '#00FF00' });

      const config1 = service.getSeriesConfig(0, 'series-1');
      const config2 = service.getSeriesConfig(1, 'series-2');

      expect(config1?.color).toBe('#FF0000');
      expect(config2?.color).toBe('#00FF00');
    });

    it('should handle multiple charts', () => {
      service.recordConfigChange(0, 'series-1', 'line', { color: '#FF0000' }, 'chart-1');
      service.recordConfigChange(0, 'series-1', 'line', { color: '#00FF00' }, 'chart-2');

      const config1 = service.getSeriesConfig(0, 'series-1', 'chart-1');
      const config2 = service.getSeriesConfig(0, 'series-1', 'chart-2');

      expect(config1?.color).toBe('#FF0000');
      expect(config2?.color).toBe('#00FF00');
    });

    it('should update existing configuration', () => {
      service.recordConfigChange(0, 'series-1', 'line', { color: '#FF0000' });
      service.recordConfigChange(0, 'series-1', 'line', { color: '#00FF00' });

      const config = service.getSeriesConfig(0, 'series-1');
      expect(config?.color).toBe('#00FF00');
    });
  });

  describe('Getting Configurations', () => {
    beforeEach(() => {
      service.recordConfigChange(0, 'series-1', 'line', { color: '#FF0000' });
      service.recordConfigChange(1, 'series-2', 'area', { color: '#00FF00' });
      service.recordConfigChange(0, 'series-3', 'line', { color: '#0000FF' }, 'chart-2');
    });

    it('should get series configuration', () => {
      const config = service.getSeriesConfig(0, 'series-1');

      expect(config).toEqual({ color: '#FF0000' });
    });

    it('should return null for non-existent series', () => {
      const config = service.getSeriesConfig(0, 'non-existent');

      expect(config).toBeNull();
    });

    it('should return null for non-existent pane', () => {
      const config = service.getSeriesConfig(99, 'series-1');

      expect(config).toBeNull();
    });

    it('should return null for non-existent chart', () => {
      const config = service.getSeriesConfig(0, 'series-1', 'non-existent-chart');

      expect(config).toBeNull();
    });

    it('should get chart configuration', () => {
      const chartConfig = service.getChartConfig('default');

      expect(chartConfig).toBeDefined();
      expect(chartConfig?.[0]?.['series-1']).toBeDefined();
      expect(chartConfig?.[1]?.['series-2']).toBeDefined();
    });

    it('should return null for non-existent chart in getChartConfig', () => {
      const chartConfig = service.getChartConfig('non-existent');

      expect(chartConfig).toBeNull();
    });

    it('should get complete state', () => {
      const state = service.getCompleteState();

      expect(Object.keys(state)).toContain('default');
      expect(Object.keys(state)).toContain('chart-2');
    });

    it('should return a shallow copy of complete state', () => {
      const state = service.getCompleteState();

      // State is a shallow copy - top level is different object
      expect(state).not.toBe((service as any).configState);

      // But deep properties are shared (shallow copy)
      // Mutating top-level keys won't affect original
      state['new-chart'] = {};

      // Original should not have new-chart
      const originalState = service.getCompleteState();
      expect(originalState).not.toHaveProperty('new-chart');
    });
  });

  describe('Backend Synchronization', () => {
    // Note: Fake timers are already set up in outer beforeEach
    // No need for nested timer setup

    it('should debounce backend sync', async () => {
      service.recordConfigChange(0, 'series-1', 'line', { color: '#FF0000' });

      expect(mockSetComponentValue).not.toHaveBeenCalled();

      await vi.runAllTimersAsync();

      expect(mockSetComponentValue).toHaveBeenCalledTimes(1);
    });

    it('should batch multiple changes in debounce window', async () => {
      service.recordConfigChange(0, 'series-1', 'line', { color: '#FF0000' });
      service.recordConfigChange(0, 'series-2', 'area', { color: '#00FF00' });
      service.recordConfigChange(0, 'series-3', 'line', { color: '#0000FF' });

      await vi.runAllTimersAsync();

      expect(mockSetComponentValue).toHaveBeenCalledTimes(1);
      expect(mockSetComponentValue).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'series_config_changes',
          changes: expect.arrayContaining([
            expect.objectContaining({ seriesId: 'series-1' }),
            expect.objectContaining({ seriesId: 'series-2' }),
            expect.objectContaining({ seriesId: 'series-3' }),
          ]),
        })
      );
    });

    it('should reset debounce timer on new change', async () => {
      service.recordConfigChange(0, 'series-1', 'line', { color: '#FF0000' });

      await vi.advanceTimersByTimeAsync(200);

      service.recordConfigChange(0, 'series-2', 'area', { color: '#00FF00' });

      await vi.advanceTimersByTimeAsync(200);
      expect(mockSetComponentValue).not.toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(100);
      expect(mockSetComponentValue).toHaveBeenCalledTimes(1);
    });

    it('should force immediate sync bypassing debounce', () => {
      service.recordConfigChange(0, 'series-1', 'line', { color: '#FF0000' });

      service.forceSyncToBackend();

      expect(mockSetComponentValue).toHaveBeenCalledTimes(1);
    });

    it('should not sync if no pending changes', () => {
      service.forceSyncToBackend();

      expect(mockSetComponentValue).not.toHaveBeenCalled();
    });

    it('should include complete state in sync payload', async () => {
      service.recordConfigChange(0, 'series-1', 'line', { color: '#FF0000' });

      service.forceSyncToBackend();

      expect(mockSetComponentValue).toHaveBeenCalledWith(
        expect.objectContaining({
          completeState: expect.any(Object),
        })
      );
    });

    it('should clear pending changes after successful sync', async () => {
      service.recordConfigChange(0, 'series-1', 'line', { color: '#FF0000' });

      await vi.runAllTimersAsync();

      const stats = service.getStats();
      expect(stats.pendingChanges).toBe(0);
    });

    it('should handle Streamlit not available', async () => {
      mockSetComponentValue.mockImplementationOnce(() => {
        throw new Error('Streamlit not available');
      });

      service.recordConfigChange(0, 'series-1', 'line', { color: '#FF0000' });

      // Should not throw even if Streamlit throws
      await vi.runAllTimersAsync();

      // Error should be logged, not thrown
      expect(true).toBe(true); // Test completed without throwing
    });
  });

  describe('Pending Changes Management', () => {
    it('should clear pending changes', () => {
      service.recordConfigChange(0, 'series-1', 'line', { color: '#FF0000' });
      service.recordConfigChange(0, 'series-2', 'area', { color: '#00FF00' });

      service.clearPendingChanges();

      const stats = service.getStats();
      expect(stats.pendingChanges).toBe(0);
    });

    it('should clear debounce timer when clearing pending changes', () => {
      vi.useFakeTimers();

      service.recordConfigChange(0, 'series-1', 'line', { color: '#FF0000' });

      service.clearPendingChanges();

      vi.advanceTimersByTime(300);

      expect(mockSetComponentValue).not.toHaveBeenCalled();

      vi.useRealTimers();
    });
  });

  describe('Backend Restoration', () => {
    it('should restore state from backend', () => {
      const backendState = {
        completeState: {
          'chart-1': {
            0: {
              'series-1': {
                config: { color: '#FF0000' },
                seriesType: 'line' as const,
                lastModified: Date.now(),
              },
            },
          },
        },
      };

      service.restoreFromBackend(backendState);

      const config = service.getSeriesConfig(0, 'series-1', 'chart-1');
      expect(config).toEqual({ color: '#FF0000' });
    });

    it('should apply changes from backend', () => {
      const backendState = {
        changes: [
          {
            paneId: 0,
            seriesId: 'series-1',
            seriesType: 'line' as const,
            config: { color: '#FF0000' },
            timestamp: Date.now(),
            chartId: 'default',
          },
        ],
      };

      service.restoreFromBackend(backendState);

      const config = service.getSeriesConfig(0, 'series-1');
      expect(config).toEqual({ color: '#FF0000' });
    });

    it('should handle invalid backend state gracefully', () => {
      expect(() => {
        service.restoreFromBackend(null);
      }).not.toThrow();

      expect(() => {
        service.restoreFromBackend('invalid');
      }).not.toThrow();

      expect(() => {
        service.restoreFromBackend({});
      }).not.toThrow();
    });

    it('should handle malformed changes array', () => {
      const backendState = {
        changes: [null, undefined, {}, 'invalid'],
      };

      expect(() => {
        service.restoreFromBackend(backendState);
      }).not.toThrow();
    });
  });

  describe('Callback Creation', () => {
    it('should create a config change callback', () => {
      const callback = service.createConfigChangeCallback();

      expect(typeof callback).toBe('function');
    });

    it('should callback record configuration changes', () => {
      const callback = service.createConfigChangeCallback('chart-1');

      callback(0, 'series-1', { color: '#FF0000' });

      const config = service.getSeriesConfig(0, 'series-1', 'chart-1');
      expect(config).toEqual({ color: '#FF0000' });
    });

    it('should use default chart ID when not provided', () => {
      const callback = service.createConfigChangeCallback();

      callback(0, 'series-1', { color: '#FF0000' });

      const config = service.getSeriesConfig(0, 'series-1', 'default');
      expect(config).toEqual({ color: '#FF0000' });
    });
  });

  describe('Series Type Inference', () => {
    it('should infer supertrend from config', () => {
      const callback = service.createConfigChangeCallback();

      callback(0, 'series-1', { period: 10, multiplier: 3 });

      const state = service.getCompleteState();
      expect(state['default'][0]['series-1'].seriesType).toBe('supertrend');
    });

    it('should infer bollinger_bands from config', () => {
      const callback = service.createConfigChangeCallback();

      callback(0, 'series-1', { length: 20, stdDev: 2 });

      const state = service.getCompleteState();
      expect(state['default'][0]['series-1'].seriesType).toBe('bollinger_bands');
    });

    it('should infer SMA from series ID', () => {
      const callback = service.createConfigChangeCallback();

      callback(0, 'sma-20', { length: 20, source: 'close' });

      const state = service.getCompleteState();
      expect(state['default'][0]['sma-20'].seriesType).toBe('sma');
    });

    it('should infer EMA from series ID', () => {
      const callback = service.createConfigChangeCallback();

      callback(0, 'ema-50', { length: 50, source: 'close' });

      const state = service.getCompleteState();
      expect(state['default'][0]['ema-50'].seriesType).toBe('ema');
    });

    it('should infer candlestick from series ID', () => {
      const callback = service.createConfigChangeCallback();

      callback(0, 'main-candlestick', { color: '#FF0000' });

      const state = service.getCompleteState();
      expect(state['default'][0]['main-candlestick'].seriesType).toBe('candlestick');
    });

    it('should infer histogram from series ID', () => {
      const callback = service.createConfigChangeCallback();

      callback(0, 'volume-histogram', { color: '#00FF00' });

      const state = service.getCompleteState();
      expect(state['default'][0]['volume-histogram'].seriesType).toBe('histogram');
    });

    it('should infer area from series ID', () => {
      const callback = service.createConfigChangeCallback();

      callback(0, 'area-series', { color: '#0000FF' });

      const state = service.getCompleteState();
      expect(state['default'][0]['area-series'].seriesType).toBe('area');
    });

    it('should infer bar from series ID', () => {
      const callback = service.createConfigChangeCallback();

      callback(0, 'bar-chart', { color: '#FFFF00' });

      const state = service.getCompleteState();
      expect(state['default'][0]['bar-chart'].seriesType).toBe('bar');
    });

    it('should default to line for unknown series', () => {
      const callback = service.createConfigChangeCallback();

      callback(0, 'unknown-series', { color: '#FF00FF' });

      const state = service.getCompleteState();
      expect(state['default'][0]['unknown-series'].seriesType).toBe('line');
    });
  });

  describe('Statistics', () => {
    it('should return correct stats for empty service', () => {
      const stats = service.getStats();

      expect(stats).toEqual({
        totalConfigs: 0,
        pendingChanges: 0,
        charts: 0,
        lastSyncTime: expect.any(Number),
      });
    });

    it('should count total configurations correctly', () => {
      service.recordConfigChange(0, 'series-1', 'line', { color: '#FF0000' });
      service.recordConfigChange(0, 'series-2', 'area', { color: '#00FF00' });
      service.recordConfigChange(1, 'series-3', 'line', { color: '#0000FF' });

      const stats = service.getStats();

      expect(stats.totalConfigs).toBe(3);
    });

    it('should count charts correctly', () => {
      service.recordConfigChange(0, 'series-1', 'line', { color: '#FF0000' }, 'chart-1');
      service.recordConfigChange(0, 'series-2', 'area', { color: '#00FF00' }, 'chart-2');

      const stats = service.getStats();

      expect(stats.charts).toBe(2);
    });

    it('should track pending changes', () => {
      service.recordConfigChange(0, 'series-1', 'line', { color: '#FF0000' });
      service.recordConfigChange(0, 'series-2', 'area', { color: '#00FF00' });

      const stats = service.getStats();

      expect(stats.pendingChanges).toBe(2);
    });

    it('should show null lastSyncTime when pending changes exist', () => {
      service.recordConfigChange(0, 'series-1', 'line', { color: '#FF0000' });

      const stats = service.getStats();

      expect(stats.lastSyncTime).toBeNull();
    });
  });

  describe('Reset', () => {
    it('should clear all state on reset', () => {
      service.recordConfigChange(0, 'series-1', 'line', { color: '#FF0000' });
      service.recordConfigChange(0, 'series-2', 'area', { color: '#00FF00' });

      service.reset();

      const state = service.getCompleteState();
      expect(state).toEqual({});
    });

    it('should clear pending changes on reset', () => {
      service.recordConfigChange(0, 'series-1', 'line', { color: '#FF0000' });

      service.reset();

      const stats = service.getStats();
      expect(stats.pendingChanges).toBe(0);
    });

    it('should clear debounce timer on reset', () => {
      vi.useFakeTimers();

      service.recordConfigChange(0, 'series-1', 'line', { color: '#FF0000' });

      service.reset();

      vi.advanceTimersByTime(300);

      expect(mockSetComponentValue).not.toHaveBeenCalled();

      vi.useRealTimers();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very deep nesting', () => {
      for (let pane = 0; pane < 10; pane++) {
        for (let series = 0; series < 5; series++) {
          service.recordConfigChange(pane, `series-${series}`, 'line', { color: '#FF0000' });
        }
      }

      const stats = service.getStats();
      expect(stats.totalConfigs).toBe(50);
    });

    it('should handle rapid successive changes', () => {
      for (let i = 0; i < 100; i++) {
        service.recordConfigChange(0, 'series-1', 'line', {
          color: `#${i.toString(16).padStart(6, '0')}`,
        });
      }

      const config = service.getSeriesConfig(0, 'series-1');
      expect(config).toBeDefined();
    });

    it('should handle special characters in series ID', () => {
      service.recordConfigChange(0, 'series-!@#$%^&*()', 'line', { color: '#FF0000' });

      const config = service.getSeriesConfig(0, 'series-!@#$%^&*()');
      expect(config).toEqual({ color: '#FF0000' });
    });

    it('should handle very long series IDs', () => {
      const longId = 'series-' + 'x'.repeat(1000);

      service.recordConfigChange(0, longId, 'line', { color: '#FF0000' });

      const config = service.getSeriesConfig(0, longId);
      expect(config).toEqual({ color: '#FF0000' });
    });

    it('should handle empty configuration objects', () => {
      service.recordConfigChange(0, 'series-1', 'line', {});

      const config = service.getSeriesConfig(0, 'series-1');
      expect(config).toEqual({});
    });

    it('should handle negative pane IDs', () => {
      service.recordConfigChange(-1, 'series-1', 'line', { color: '#FF0000' });

      const config = service.getSeriesConfig(-1, 'series-1');
      expect(config).toEqual({ color: '#FF0000' });
    });
  });
});
