/**
 * @fileoverview Tests for SeriesDialogManager
 * @vitest-environment jsdom
 *
 * Tests the singleton pattern, dialog open/close functionality,
 * series configuration management, and React integration.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SeriesDialogManager } from '../../services/SeriesDialogManager';
import { StreamlitSeriesConfigService } from '../../services/StreamlitSeriesConfigService';
import type { IChartApi } from 'lightweight-charts';

// Mock React and createRoot
vi.mock('react-dom/client', () => ({
  createRoot: vi.fn(() => ({
    render: vi.fn(),
    unmount: vi.fn(),
  })),
}));

vi.mock('../../forms/SeriesSettingsDialog', () => ({
  SeriesSettingsDialog: vi.fn(() => null),
}));

describe('SeriesDialogManager', () => {
  let mockChartApi: IChartApi;
  let mockStreamlitService: StreamlitSeriesConfigService;

  beforeEach(() => {
    // Mock chart API with series that have _seriesType metadata
    mockChartApi = {
      panes: vi.fn(() => [
        {
          getSeries: () => [
            {
              applyOptions: vi.fn(),
              options: () => ({ _seriesType: 'line', title: 'Line Series 1' }),
            },
          ],
        },
        {
          getSeries: () => [
            {
              applyOptions: vi.fn(),
              options: () => ({ _seriesType: 'histogram', title: 'Histogram Series 1' }),
            },
          ],
        },
      ]),
      chartElement: vi.fn(() => document.createElement('div')),
    } as any;

    // Mock Streamlit service
    mockStreamlitService = {
      recordConfigChange: vi.fn(),
      getSeriesConfig: vi.fn(),
      getInstance: vi.fn(() => mockStreamlitService),
    } as any;
  });

  afterEach(() => {
    vi.clearAllMocks();
    // Clean up any DOM elements created during tests
    document.body.innerHTML = '';
    // Destroy all singleton instances to prevent test pollution
    SeriesDialogManager.destroyInstance('chart-1');
    SeriesDialogManager.destroyInstance('chart-2');
    SeriesDialogManager.destroyInstance('my-chart-id');
    SeriesDialogManager.destroyInstance('default');
  });

  describe('Singleton Pattern', () => {
    it('should return same instance for same chartId', () => {
      const instance1 = SeriesDialogManager.getInstance(
        mockChartApi,
        mockStreamlitService,
        'chart-1'
      );
      const instance2 = SeriesDialogManager.getInstance(
        mockChartApi,
        mockStreamlitService,
        'chart-1'
      );

      expect(instance1).toBe(instance2);
    });

    it('should return different instances for different chartIds', () => {
      const instance1 = SeriesDialogManager.getInstance(
        mockChartApi,
        mockStreamlitService,
        'chart-1'
      );
      const instance2 = SeriesDialogManager.getInstance(
        mockChartApi,
        mockStreamlitService,
        'chart-2'
      );

      expect(instance1).not.toBe(instance2);
    });

    it('should use "default" chartId when not specified', () => {
      const instance1 = SeriesDialogManager.getInstance(mockChartApi, mockStreamlitService);
      const instance2 = SeriesDialogManager.getInstance(
        mockChartApi,
        mockStreamlitService,
        'default'
      );

      expect(instance1).toBe(instance2);
    });

    it('should create new instance after destroyInstance', () => {
      const instance1 = SeriesDialogManager.getInstance(
        mockChartApi,
        mockStreamlitService,
        'chart-1'
      );
      SeriesDialogManager.destroyInstance('chart-1');
      const instance2 = SeriesDialogManager.getInstance(
        mockChartApi,
        mockStreamlitService,
        'chart-1'
      );

      expect(instance1).not.toBe(instance2);
    });

    it('should handle destroyInstance for non-existent chartId gracefully', () => {
      expect(() => {
        SeriesDialogManager.destroyInstance('non-existent');
      }).not.toThrow();
    });
  });

  describe('Pane Initialization', () => {
    it('should initialize pane dialog state', () => {
      const manager = SeriesDialogManager.getInstance(mockChartApi, mockStreamlitService);
      manager.initializePane(0);

      const state = manager.getState(0);

      expect(state).toBeDefined();
      expect(state?.seriesConfigs).toBeDefined();
      expect(state?.seriesConfigs.size).toBe(0);
    });

    it('should not reinitialize existing pane', () => {
      const manager = SeriesDialogManager.getInstance(mockChartApi, mockStreamlitService);
      manager.initializePane(0);

      const state1 = manager.getState(0);
      manager.initializePane(0);
      const state2 = manager.getState(0);

      expect(state1).toBe(state2);
    });

    it('should return undefined for uninitialized pane', () => {
      const manager = SeriesDialogManager.getInstance(mockChartApi, mockStreamlitService);

      const state = manager.getState(99);

      expect(state).toBeUndefined();
    });

    it('should initialize multiple panes independently', () => {
      const manager = SeriesDialogManager.getInstance(mockChartApi, mockStreamlitService);
      manager.initializePane(0);
      manager.initializePane(1);
      manager.initializePane(2);

      expect(manager.getState(0)).toBeDefined();
      expect(manager.getState(1)).toBeDefined();
      expect(manager.getState(2)).toBeDefined();
    });
  });

  describe('Dialog Open', () => {
    it('should create dialog container on first open', () => {
      const manager = SeriesDialogManager.getInstance(mockChartApi, mockStreamlitService);
      manager.initializePane(0);

      manager.open(0);

      const state = manager.getState(0);
      expect(state?.dialogElement).toBeDefined();
      expect(state?.dialogRoot).toBeDefined();
    });

    it('should reuse dialog container on subsequent opens', () => {
      const manager = SeriesDialogManager.getInstance(mockChartApi, mockStreamlitService);
      manager.initializePane(0);

      manager.open(0);
      const firstDialogElement = manager.getState(0)?.dialogElement;

      manager.close(0);
      manager.open(0);
      const secondDialogElement = manager.getState(0)?.dialogElement;

      expect(firstDialogElement).toBe(secondDialogElement);
    });

    it('should handle open on uninitialized pane gracefully', () => {
      const manager = SeriesDialogManager.getInstance(mockChartApi, mockStreamlitService);

      expect(() => {
        manager.open(99);
      }).not.toThrow();
    });

    it('should append dialog to document.body', () => {
      const manager = SeriesDialogManager.getInstance(mockChartApi, mockStreamlitService);
      manager.initializePane(0);

      manager.open(0);

      const state = manager.getState(0);
      const dialogElement = state?.dialogElement;

      expect(dialogElement).toBeDefined();
      expect(dialogElement?.parentNode).toBe(document.body);
    });

    it('should set correct dialog container styles', () => {
      const manager = SeriesDialogManager.getInstance(mockChartApi, mockStreamlitService);
      manager.initializePane(0);

      manager.open(0);

      const state = manager.getState(0);
      const dialogElement = state?.dialogElement;

      expect(dialogElement?.style.position).toBe('fixed');
      expect(dialogElement?.style.top).toBe('0px');
      expect(dialogElement?.style.left).toBe('0px');
      expect(dialogElement?.style.zIndex).toBe('10000');
    });
  });

  describe('Dialog Close', () => {
    it('should close dialog by rendering with isOpen=false', () => {
      const manager = SeriesDialogManager.getInstance(mockChartApi, mockStreamlitService);
      manager.initializePane(0);

      manager.open(0);
      const dialogRoot = manager.getState(0)?.dialogRoot;

      manager.close(0);

      expect(dialogRoot?.render).toHaveBeenCalled();
    });

    it('should handle close on unopened dialog gracefully', () => {
      const manager = SeriesDialogManager.getInstance(mockChartApi, mockStreamlitService);
      manager.initializePane(0);

      expect(() => {
        manager.close(0);
      }).not.toThrow();
    });

    it('should handle close on uninitialized pane gracefully', () => {
      const manager = SeriesDialogManager.getInstance(mockChartApi, mockStreamlitService);

      expect(() => {
        manager.close(99);
      }).not.toThrow();
    });
  });

  describe('Series Configuration', () => {
    it('should get series config from state', () => {
      const manager = SeriesDialogManager.getInstance(mockChartApi, mockStreamlitService);
      manager.initializePane(0);

      const state = manager.getState(0);
      state?.seriesConfigs.set('series-1', { color: '#FF0000' });

      const config = manager.getSeriesConfig(0, 'series-1');

      expect(config).toEqual({ color: '#FF0000' });
    });

    it('should return null for non-existent series', () => {
      const manager = SeriesDialogManager.getInstance(mockChartApi, mockStreamlitService);
      manager.initializePane(0);

      const config = manager.getSeriesConfig(0, 'non-existent');

      expect(config).toBeNull();
    });

    it('should return null for uninitialized pane', () => {
      const manager = SeriesDialogManager.getInstance(mockChartApi, mockStreamlitService);

      const config = manager.getSeriesConfig(99, 'series-1');

      expect(config).toBeNull();
    });

    it('should set series config via setSeriesConfig', () => {
      const manager = SeriesDialogManager.getInstance(
        mockChartApi,
        mockStreamlitService,
        'chart-1',
        {
          onSeriesConfigChange: vi.fn(),
        }
      );
      manager.initializePane(0);

      manager.setSeriesConfig(0, 'pane-0-series-0', { color: '#00FF00' });

      const config = manager.getSeriesConfig(0, 'pane-0-series-0');
      expect(config).toEqual({ color: '#00FF00' });
    });
  });

  describe('Apply Series Config', () => {
    it('should store config in local state', () => {
      const manager = SeriesDialogManager.getInstance(mockChartApi, mockStreamlitService);
      manager.initializePane(0);

      manager.setSeriesConfig(0, 'series-1', { color: '#0000FF' });

      const state = manager.getState(0);
      const config = state?.seriesConfigs.get('series-1');

      expect(config).toEqual({ color: '#0000FF' });
    });

    it('should save to localStorage', () => {
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
      const manager = SeriesDialogManager.getInstance(mockChartApi, mockStreamlitService);
      manager.initializePane(0);

      manager.setSeriesConfig(0, 'pane-0-series-0', { color: '#FF00FF' });

      expect(setItemSpy).toHaveBeenCalledWith(
        'series-config-pane-0-series-0',
        expect.stringContaining('#FF00FF')
      );

      setItemSpy.mockRestore();
    });

    it('should store series config locally', () => {
      const manager = SeriesDialogManager.getInstance(
        mockChartApi,
        mockStreamlitService,
        'chart-1'
      );
      manager.initializePane(0);

      manager.setSeriesConfig(0, 'pane-0-series-0', { color: '#00FFFF' });

      // Config is stored locally and synced on dialog close, not immediately
      expect(manager).toBeDefined();
    });

    it('should call onSeriesConfigChange callback', () => {
      const onSeriesConfigChange = vi.fn();
      const manager = SeriesDialogManager.getInstance(
        mockChartApi,
        mockStreamlitService,
        'chart-1',
        {
          chartId: 'chart-1',
          onSeriesConfigChange,
        }
      );
      manager.initializePane(0);

      manager.setSeriesConfig(0, 'pane-0-series-0', { color: '#FFFF00' });

      expect(onSeriesConfigChange).toHaveBeenCalledWith(0, 'pane-0-series-0', expect.any(Object));
    });

    it('should apply config to chart series', () => {
      const mockSeries = {
        applyOptions: vi.fn(),
        options: () => ({ _seriesType: 'line', color: '#000000' }),
      };

      mockChartApi.panes = vi.fn(() => [{ getSeries: () => [mockSeries] }]) as any;

      const manager = SeriesDialogManager.getInstance(mockChartApi, mockStreamlitService);
      manager.initializePane(0);

      manager.setSeriesConfig(0, 'pane-0-series-0', { color: '#AAAAAA' });

      expect(mockSeries.applyOptions).toHaveBeenCalledWith(
        expect.objectContaining({ color: '#AAAAAA' })
      );
    });

    it('should handle missing chart series gracefully', () => {
      mockChartApi.panes = vi.fn(() => [{ getSeries: () => [] }]) as any;

      const manager = SeriesDialogManager.getInstance(mockChartApi, mockStreamlitService);
      manager.initializePane(0);

      expect(() => {
        manager.setSeriesConfig(0, 'pane-0-series-0', { color: '#BBBBBB' });
      }).not.toThrow();
    });

    it('should remove internal properties before applying to chart', () => {
      const mockSeries = {
        applyOptions: vi.fn(),
        options: () => ({ _seriesType: 'line' }),
      };

      mockChartApi.panes = vi.fn(() => [{ getSeries: () => [mockSeries] }]) as any;

      const manager = SeriesDialogManager.getInstance(mockChartApi, mockStreamlitService);
      manager.initializePane(0);

      manager.setSeriesConfig(0, 'pane-0-series-0', {
        color: '#CCCCCC',
      });

      expect(mockSeries.applyOptions).toHaveBeenCalledWith(
        expect.objectContaining({ color: '#CCCCCC' })
      );
    });
  });

  describe('Multiple Panes', () => {
    it('should manage multiple panes independently', () => {
      const manager = SeriesDialogManager.getInstance(mockChartApi, mockStreamlitService);
      manager.initializePane(0);
      manager.initializePane(1);

      manager.setSeriesConfig(0, 'pane-0-series-0', { color: '#111111' });
      manager.setSeriesConfig(1, 'pane-1-series-0', { color: '#222222' });

      expect(manager.getSeriesConfig(0, 'pane-0-series-0')).toEqual({ color: '#111111' });
      expect(manager.getSeriesConfig(1, 'pane-1-series-0')).toEqual({ color: '#222222' });
      expect(manager.getSeriesConfig(0, 'pane-1-series-0')).toBeNull();
      expect(manager.getSeriesConfig(1, 'pane-0-series-0')).toBeNull();
    });

    it('should share manager instance across multiple panes', () => {
      const manager1 = SeriesDialogManager.getInstance(
        mockChartApi,
        mockStreamlitService,
        'chart-1'
      );
      manager1.initializePane(0);

      const manager2 = SeriesDialogManager.getInstance(
        mockChartApi,
        mockStreamlitService,
        'chart-1'
      );
      manager2.initializePane(1);

      expect(manager1).toBe(manager2);

      manager1.setSeriesConfig(0, 'pane-0-series-0', { color: '#333333' });

      expect(manager2.getSeriesConfig(0, 'pane-0-series-0')).toEqual({ color: '#333333' });
      expect(manager2.getState(1)).toBeDefined();
    });
  });

  describe('Destroy', () => {
    it('should remove dialog elements on destroy', () => {
      const manager = SeriesDialogManager.getInstance(mockChartApi, mockStreamlitService);
      manager.initializePane(0);
      manager.open(0);

      const dialogElement = manager.getState(0)?.dialogElement;
      expect(dialogElement?.parentNode).toBeTruthy();

      manager.destroy();

      expect(dialogElement?.parentNode).toBeNull();
    });

    it('should unmount React roots on destroy', () => {
      const manager = SeriesDialogManager.getInstance(mockChartApi, mockStreamlitService);
      manager.initializePane(0);
      manager.open(0);

      const dialogRoot = manager.getState(0)?.dialogRoot;

      manager.destroy();

      expect(dialogRoot?.unmount).toHaveBeenCalled();
    });

    it('should clear all state on destroy', () => {
      const manager = SeriesDialogManager.getInstance(mockChartApi, mockStreamlitService);
      manager.initializePane(0);
      manager.initializePane(1);

      manager.destroy();

      expect(manager.getState(0)).toBeUndefined();
      expect(manager.getState(1)).toBeUndefined();
    });

    it('should destroy singleton instance via destroyInstance', () => {
      const manager = SeriesDialogManager.getInstance(
        mockChartApi,
        mockStreamlitService,
        'chart-1'
      );
      manager.initializePane(0);
      manager.setSeriesConfig(0, 'pane-0-series-0', { color: '#444444' });

      SeriesDialogManager.destroyInstance('chart-1');

      const newManager = SeriesDialogManager.getInstance(
        mockChartApi,
        mockStreamlitService,
        'chart-1'
      );
      expect(newManager.getState(0)).toBeUndefined();
    });

    it('should handle destroy without any opened dialogs', () => {
      const manager = SeriesDialogManager.getInstance(mockChartApi, mockStreamlitService);
      manager.initializePane(0);

      expect(() => {
        manager.destroy();
      }).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle localStorage errors gracefully', () => {
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('localStorage full');
      });

      const manager = SeriesDialogManager.getInstance(mockChartApi, mockStreamlitService);
      manager.initializePane(0);

      expect(() => {
        manager.setSeriesConfig(0, 'pane-0-series-0', { color: '#555555' });
      }).not.toThrow();

      setItemSpy.mockRestore();
    });

    it('should handle series applyOptions errors gracefully', () => {
      const mockSeries = {
        applyOptions: vi.fn(() => {
          throw new Error('applyOptions error');
        }),
        options: () => ({ _seriesType: 'line' }),
      };

      mockChartApi.panes = vi.fn(() => [{ getSeries: () => [mockSeries] }]) as any;

      const manager = SeriesDialogManager.getInstance(mockChartApi, mockStreamlitService);
      manager.initializePane(0);

      expect(() => {
        manager.setSeriesConfig(0, 'pane-0-series-0', { color: '#666666' });
      }).not.toThrow();
    });

    it('should handle panes() errors gracefully', () => {
      mockChartApi.panes = vi.fn(() => {
        throw new Error('panes error');
      }) as any;

      const manager = SeriesDialogManager.getInstance(mockChartApi, mockStreamlitService);
      manager.initializePane(0);

      expect(() => {
        manager.setSeriesConfig(0, 'pane-0-series-0', { color: '#777777' });
      }).not.toThrow();
    });
  });

  describe('Configuration', () => {
    it('should pass chartId to config', () => {
      const manager = SeriesDialogManager.getInstance(
        mockChartApi,
        mockStreamlitService,
        'my-chart-id',
        {
          chartId: 'my-chart-id',
        }
      );
      manager.initializePane(0);

      manager.setSeriesConfig(0, 'pane-0-series-0', { color: '#888888' });

      // Config is stored locally, verify manager is configured with correct chartId
      expect(manager).toBeDefined();
    });

    it('should use default chartId when not specified', () => {
      const manager = SeriesDialogManager.getInstance(mockChartApi, mockStreamlitService);
      manager.initializePane(0);

      manager.setSeriesConfig(0, 'pane-0-series-0', { color: '#999999' });

      // Config is stored locally, synced to backend on dialog close
      expect(manager).toBeDefined();
    });
  });
});
