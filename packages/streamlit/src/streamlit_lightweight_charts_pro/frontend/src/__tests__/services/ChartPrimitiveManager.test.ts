/**
 * @vitest-environment jsdom
 * @fileoverview Tests for ChartPrimitiveManager
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ChartPrimitiveManager } from '../../services/ChartPrimitiveManager';
import { IChartApi, IPaneApi, UTCTimestamp, SeriesOptionsMap, Time } from 'lightweight-charts';
import { LegendConfig, RangeSwitcherConfig, PaneCollapseConfig } from '../../types';
import {
  ExtendedSeriesApi,
  CrosshairEventData,
  SeriesDataPoint,
} from '../../types/ChartInterfaces';
import { createTestEnvironment, createMockPane } from '../mocks/GlobalMockFactory';

// Mock LegendPrimitive
const mockLegendPrimitive = {
  attachTo: vi.fn(),
  detach: vi.fn(),
  updateText: vi.fn(),
  hide: vi.fn(),
  show: vi.fn(),
};
vi.mock('../../primitives/LegendPrimitive', () => ({
  LegendPrimitive: vi.fn().mockImplementation(() => mockLegendPrimitive),
}));

// Mock RangeSwitcherPrimitive
const mockRangeSwitcherPrimitive = {
  attachTo: vi.fn(),
  detach: vi.fn(),
  destroy: vi.fn(),
};
vi.mock('../../primitives/RangeSwitcherPrimitive', () => ({
  RangeSwitcherPrimitive: vi.fn().mockImplementation(() => mockRangeSwitcherPrimitive),
  DefaultRangeConfigs: {},
}));

// Mock ButtonPanelPrimitive
const mockButtonPanelPrimitive = {
  plugin: {},
  destroy: vi.fn(),
  attachTo: vi.fn(),
  detach: vi.fn(),
};
vi.mock('../../primitives/ButtonPanelPrimitive', () => ({
  ButtonPanelPrimitive: vi.fn().mockImplementation(() => mockButtonPanelPrimitive),
  createButtonPanelPrimitive: vi.fn(() => mockButtonPanelPrimitive),
}));

// Mock PrimitiveEventManager
const mockPrimitiveEventManager = {
  initialize: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
  destroy: vi.fn(),
};

vi.mock('../../services/PrimitiveEventManager', () => ({
  PrimitiveEventManager: {
    getInstance: vi.fn(() => mockPrimitiveEventManager),
    cleanup: vi.fn(),
  },
}));

// Mock CornerLayoutManager
vi.mock('../../services/CornerLayoutManager', () => ({
  CornerLayoutManager: {
    cleanup: vi.fn(),
  },
}));

// Import the mocked modules
import { LegendPrimitive } from '../../primitives/LegendPrimitive';

describe('ChartPrimitiveManager', () => {
  let mockChart: IChartApi;
  let mockPane: IPaneApi<any>;
  let mockSeries: ExtendedSeriesApi;
  let manager: ChartPrimitiveManager;
  const chartId = 'test-chart';

  beforeEach(() => {
    // Clear all instances before each test
    (ChartPrimitiveManager as any).instances.clear();

    // Create test environment with centralized mocks
    const testEnv = createTestEnvironment();
    mockChart = testEnv.chart;

    // Get the same pane that chart.panes() will return
    const panes = mockChart.panes();
    mockPane = panes[0]; // Use the first pane from chart.panes()

    // Create mock series
    mockSeries = {
      attachPrimitive: vi.fn(),
      detachPrimitive: vi.fn(),
    } as any;

    // Get manager instance
    manager = ChartPrimitiveManager.getInstance(mockChart, chartId);

    // Clear mocks AFTER manager creation to preserve the pane setup
    vi.clearAllMocks();
  });

  afterEach(() => {
    ChartPrimitiveManager.cleanup(chartId);
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance for the same chart ID', () => {
      const manager1 = ChartPrimitiveManager.getInstance(mockChart, chartId);
      const manager2 = ChartPrimitiveManager.getInstance(mockChart, chartId);

      expect(manager1).toBe(manager2);
    });

    it('should return different instances for different chart IDs', () => {
      const manager1 = ChartPrimitiveManager.getInstance(mockChart, 'chart1');
      const manager2 = ChartPrimitiveManager.getInstance(mockChart, 'chart2');

      expect(manager1).not.toBe(manager2);
    });

    it('should create new instance if none exists', () => {
      const newChartId = 'new-chart';
      const newManager = ChartPrimitiveManager.getInstance(mockChart, newChartId);

      expect(newManager).toBeInstanceOf(ChartPrimitiveManager);
      expect(newManager.getChartId()).toBe(newChartId);
    });
  });

  describe('Cleanup', () => {
    it('should cleanup manager instance', () => {
      const destroySpy = vi.spyOn(manager, 'destroy');

      ChartPrimitiveManager.cleanup(chartId);

      expect(destroySpy).toHaveBeenCalled();
    });

    it('should handle cleanup of non-existent chart', () => {
      expect(() => {
        ChartPrimitiveManager.cleanup('non-existent-chart');
      }).not.toThrow();
    });
  });

  describe('Range Switcher Management', () => {
    it('should add range switcher with default config', () => {
      const config: RangeSwitcherConfig = {
        ranges: [],
        position: 'top-left',
        visible: true,
      };
      const result = manager.addRangeSwitcher(config);

      expect(result).toBeDefined();
      expect(typeof result.destroy).toBe('function');
      expect(mockPane.attachPrimitive).toHaveBeenCalled();
    });

    it('should add range switcher with custom config', () => {
      const config: RangeSwitcherConfig = {
        position: 'bottom-left',
        visible: true,
        ranges: [
          { text: '1H', range: 1 },
          { text: '4H', range: 4 },
        ],
      };

      const result = manager.addRangeSwitcher(config);

      expect(result).toBeDefined();
      expect(typeof result.destroy).toBe('function');
    });

    it('should handle errors when creating range switcher', () => {
      // Mock chart.panes to throw error
      mockChart.panes = vi.fn(() => {
        throw new Error('Panes error');
      });

      const config: RangeSwitcherConfig = {
        ranges: [],
        position: 'top-left',
        visible: true,
      };
      const result = manager.addRangeSwitcher(config);

      expect(result).toBeDefined();
      expect(typeof result.destroy).toBe('function');
    });

    it('should destroy range switcher', () => {
      const config: RangeSwitcherConfig = {
        ranges: [],
        position: 'top-left',
        visible: true,
      };
      const { destroy } = manager.addRangeSwitcher(config);

      expect(() => destroy()).not.toThrow();
      expect(mockPane.detachPrimitive).toHaveBeenCalled();
    });
  });

  describe('Legend Management', () => {
    it('should add legend with default config', () => {
      const config: LegendConfig = {
        text: 'Test Legend',
      };

      const result = manager.addLegend(config);

      expect(result).toBeDefined();
      expect(typeof result.destroy).toBe('function');
    });

    it('should add legend with custom config', () => {
      const config: LegendConfig = {
        text: 'Custom Legend',
        position: 'bottom-right',
        backgroundColor: 'rgba(255, 0, 0, 0.8)',
        textColor: 'yellow',
        valueFormat: '.3f',
      };

      const result = manager.addLegend(config);

      expect(result).toBeDefined();
      expect(typeof result.destroy).toBe('function');
    });

    it('should add legend as pane primitive', () => {
      const config: LegendConfig = {
        text: 'Pane Legend',
      };

      const result = manager.addLegend(config, true, 0);

      expect(result).toBeDefined();
      expect(mockPane.attachPrimitive).toHaveBeenCalled();
    });

    it('should attach legend to series when series reference provided', () => {
      const config: LegendConfig = {
        text: 'Series Legend',
      };

      const result = manager.addLegend(config, false, 0, mockSeries);

      expect(result).toBeDefined();
      expect(mockSeries.attachPrimitive).toHaveBeenCalled();
    });

    it('should fallback to pane attachment when series attachment fails', () => {
      mockSeries.attachPrimitive = vi.fn(() => {
        throw new Error('Series attachment failed');
      });

      const config: LegendConfig = {
        text: 'Fallback Legend',
      };

      const result = manager.addLegend(config, false, 0, mockSeries);

      expect(result).toBeDefined();
      expect(mockSeries.attachPrimitive).toHaveBeenCalled();
      expect(mockPane.attachPrimitive).toHaveBeenCalled();
    });

    it('should handle errors when creating legend', () => {
      // Mock to cause error during legend creation
      const originalPanes = mockChart.panes;
      mockChart.panes = vi.fn(() => {
        throw new Error('Chart error');
      });

      const config: LegendConfig = {
        text: 'Error Legend',
      };

      const result = manager.addLegend(config);

      expect(result).toBeDefined();
      expect(typeof result.destroy).toBe('function');

      // Restore
      mockChart.panes = originalPanes;
    });

    it('should destroy legend', () => {
      const config: LegendConfig = {
        text: 'Destroy Legend',
      };

      const { destroy } = manager.addLegend(config);

      expect(() => destroy()).not.toThrow();
      expect(mockPane.detachPrimitive).toHaveBeenCalled();
    });

    it('should create unique IDs for multiple legends', () => {
      const config1: LegendConfig = { text: 'Legend 1' };
      const config2: LegendConfig = { text: 'Legend 2' };

      manager.addLegend(config1);
      manager.addLegend(config2);

      const primitives = manager.getAllPrimitives();
      const legendIds = Array.from(primitives.keys()).filter(id => id.startsWith('legend-'));

      expect(legendIds).toHaveLength(2);
      expect(legendIds[0]).not.toBe(legendIds[1]);
    });
  });

  describe('Button Panel Management', () => {
    it('should add button panel with default config', () => {
      const result = manager.addButtonPanel(0);

      expect(result).toBeDefined();
      expect(typeof result.destroy).toBe('function');
      expect(result.plugin).toBeDefined();
      expect(mockPane.attachPrimitive).toHaveBeenCalled();
    });

    it('should add button panel with custom config', () => {
      const config: PaneCollapseConfig = {
        showSeriesSettingsButton: true,
        showCollapseButton: false,
        buttonSize: 20,
        buttonColor: '#FF0000',
      };

      const result = manager.addButtonPanel(0, config);

      expect(result).toBeDefined();
      expect(typeof result.destroy).toBe('function');
      expect(result.plugin).toBeDefined();
    });

    it('should fallback to first pane when target pane does not exist', () => {
      // Mock chart with fewer panes
      mockChart.panes = vi.fn(() => [mockPane]); // Only one pane

      const result = manager.addButtonPanel(5); // Try to attach to pane 5

      expect(result).toBeDefined();
      expect(mockPane.attachPrimitive).toHaveBeenCalled();
    });

    it('should handle errors when creating button panel', () => {
      // Mock to cause error during button panel creation
      mockChart.panes = vi.fn(() => {
        throw new Error('Panes error');
      });

      const result = manager.addButtonPanel(0);

      expect(result).toBeDefined();
      expect(typeof result.destroy).toBe('function');
      expect(result.plugin).toBeDefined();
    });

    it('should destroy button panel', () => {
      const { destroy } = manager.addButtonPanel(0);

      expect(() => destroy()).not.toThrow();
      expect(mockPane.detachPrimitive).toHaveBeenCalled();
    });
  });

  describe('Legend Value Updates', () => {
    it('should handle legend value updates', () => {
      const crosshairData: CrosshairEventData = {
        time: 1234567890 as UTCTimestamp,
        point: { x: 200, y: 300 },
        seriesData: new Map() as Map<
          ExtendedSeriesApi<keyof SeriesOptionsMap>,
          SeriesDataPoint | null
        >,
      };

      // This method is kept for backward compatibility but doesn't do anything
      expect(() => {
        manager.updateLegendValues(crosshairData);
      }).not.toThrow();
    });
  });

  describe('Primitive Access', () => {
    it('should get primitive by ID', () => {
      const config: LegendConfig = { text: 'Test Legend' };
      manager.addLegend(config);

      const primitives = manager.getAllPrimitives();
      const legendId = Array.from(primitives.keys()).find(id => id.startsWith('legend-'));

      if (legendId) {
        const primitive = manager.getPrimitive(legendId);
        expect(primitive).toBeDefined();
      }
    });

    it('should return undefined for non-existent primitive', () => {
      const primitive = manager.getPrimitive('non-existent-id');
      expect(primitive).toBeUndefined();
    });

    it('should get all primitives', () => {
      const legendConfig: LegendConfig = { text: 'Test Legend' };
      const rangeSwitcherConfig: RangeSwitcherConfig = {
        ranges: [],
        position: 'top-left',
        visible: true,
      };

      manager.addLegend(legendConfig);
      manager.addRangeSwitcher(rangeSwitcherConfig);
      manager.addButtonPanel(0);

      const primitives = manager.getAllPrimitives();

      expect(primitives.size).toBe(3);
      expect(Array.from(primitives.keys())).toEqual(
        expect.arrayContaining([
          expect.stringMatching(/legend-/),
          expect.stringMatching(/range-switcher-/),
          expect.stringMatching(/button-panel-/),
        ])
      );
    });

    it('should return copy of primitives map', () => {
      const primitives1 = manager.getAllPrimitives();
      const primitives2 = manager.getAllPrimitives();

      expect(primitives1).not.toBe(primitives2);
      expect(primitives1).toEqual(primitives2);
    });
  });

  describe('Manager Lifecycle', () => {
    it('should get event manager instance', () => {
      const eventManager = manager.getEventManager();

      expect(eventManager).toBeDefined();
    });

    it('should get chart ID', () => {
      const chartIdResult = manager.getChartId();

      expect(chartIdResult).toBe(chartId);
    });

    it('should destroy all primitives', () => {
      // Add some primitives
      manager.addLegend({ text: 'Legend' });
      manager.addRangeSwitcher({ ranges: [], position: 'bottom-right', visible: true });
      manager.addButtonPanel(0);

      const primitivesBefore = manager.getAllPrimitives();
      expect(primitivesBefore.size).toBe(3);

      manager.destroy();

      const primitivesAfter = manager.getAllPrimitives();
      expect(primitivesAfter.size).toBe(0);
      expect(mockPane.detachPrimitive).toHaveBeenCalledTimes(3);
    });

    it('should handle errors during destroy', () => {
      // Add a primitive
      manager.addLegend({ text: 'Legend' });

      // Mock detachPrimitive to throw error
      mockPane.detachPrimitive = vi.fn(() => {
        throw new Error('Detach error');
      });

      expect(() => {
        manager.destroy();
      }).not.toThrow();
    });
  });

  describe('Pane Attachment Logic', () => {
    it('should attach to correct pane for pane primitive', () => {
      const secondPane = {
        attachPrimitive: vi.fn(),
        detachPrimitive: vi.fn(),
      } as any;

      mockChart.panes = vi.fn(() => [mockPane, secondPane]);

      const config: LegendConfig = { text: 'Pane 1 Legend' };
      manager.addLegend(config, true, 1); // Attach to pane 1

      expect(secondPane.attachPrimitive).toHaveBeenCalled();
      expect(mockPane.attachPrimitive).not.toHaveBeenCalled();
    });

    it('should fallback to first pane when target pane does not exist', () => {
      const config: LegendConfig = { text: 'Fallback Legend' };
      manager.addLegend(config, true, 5); // Pane 5 doesn't exist

      expect(mockPane.attachPrimitive).toHaveBeenCalled();
    });

    it('should attach to first pane for chart-level primitives', () => {
      const config: LegendConfig = { text: 'Chart Legend' };
      manager.addLegend(config, false, 0); // Chart-level primitive

      expect(mockPane.attachPrimitive).toHaveBeenCalled();
    });

    it('should handle case when no panes exist', () => {
      mockChart.panes = vi.fn(() => []);

      const config: LegendConfig = { text: 'No Panes Legend' };

      expect(() => {
        manager.addLegend(config);
      }).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle primitive destruction errors gracefully', () => {
      const config: LegendConfig = { text: 'Error Legend' };
      const { destroy } = manager.addLegend(config);

      // Mock detachPrimitive to throw error
      mockPane.detachPrimitive = vi.fn(() => {
        throw new Error('Detach error');
      });

      expect(() => destroy()).not.toThrow();
    });

    it('should handle chart.panes() errors', () => {
      mockChart.panes = vi.fn(() => {
        throw new Error('Panes access error');
      });

      const config: LegendConfig = { text: 'Panes Error Legend' };

      expect(() => {
        manager.addLegend(config);
      }).not.toThrow();
    });

    it('should handle primitive constructor errors', () => {
      // Mock LegendPrimitive constructor to throw
      vi.mocked(LegendPrimitive).mockImplementationOnce(() => {
        throw new Error('Constructor error');
      });

      const config: LegendConfig = { text: 'Constructor Error Legend' };
      const result = manager.addLegend(config);

      expect(result).toBeDefined();
      expect(typeof result.destroy).toBe('function');
    });
  });

  describe('Multiple Chart Support', () => {
    it('should maintain separate instances for different charts', () => {
      const chart1Id = 'chart1';
      const chart2Id = 'chart2';

      const manager1 = ChartPrimitiveManager.getInstance(mockChart, chart1Id);
      const manager2 = ChartPrimitiveManager.getInstance(mockChart, chart2Id);

      expect(manager1).not.toBe(manager2);
      expect(manager1.getChartId()).toBe(chart1Id);
      expect(manager2.getChartId()).toBe(chart2Id);
    });

    it('should cleanup specific chart without affecting others', () => {
      const chart1Id = 'chart1';
      const chart2Id = 'chart2';

      const manager1 = ChartPrimitiveManager.getInstance(mockChart, chart1Id);
      const manager2 = ChartPrimitiveManager.getInstance(mockChart, chart2Id);

      const destroy1Spy = vi.spyOn(manager1, 'destroy');
      const destroy2Spy = vi.spyOn(manager2, 'destroy');

      ChartPrimitiveManager.cleanup(chart1Id);

      expect(destroy1Spy).toHaveBeenCalled();
      expect(destroy2Spy).not.toHaveBeenCalled();
    });
  });

  describe('Integration with Chart APIs', () => {
    it('should work with multiple panes', () => {
      const pane0 = createMockPane();
      const pane1 = createMockPane();
      const pane2 = createMockPane();

      mockChart.panes = vi.fn(() => [pane0, pane1, pane2] as IPaneApi<Time>[]);

      // Add button panels to different panes
      manager.addButtonPanel(0);
      manager.addButtonPanel(1);
      manager.addButtonPanel(2);

      expect(pane0.attachPrimitive).toHaveBeenCalledTimes(1);
      expect(pane1.attachPrimitive).toHaveBeenCalledTimes(1);
      expect(pane2.attachPrimitive).toHaveBeenCalledTimes(1);
    });

    it('should handle dynamic pane changes', () => {
      let paneCount = 1;
      mockChart.panes = vi.fn(() => {
        const panes = [];
        for (let i = 0; i < paneCount; i++) {
          panes.push({
            attachPrimitive: vi.fn(),
            detachPrimitive: vi.fn(),
            getHeight: vi.fn(() => 300),
            setHeight: vi.fn(),
            moveTo: vi.fn(),
            paneIndex: i,
            applyOptions: vi.fn(),
            options: vi.fn(),
            height: vi.fn(() => 300),
            destroy: vi.fn(),
            getElement: vi.fn(() => document.createElement('div')),
            isTouchDevice: vi.fn(() => false),
            subscribeClick: vi.fn(),
            unsubscribeClick: vi.fn(),
            subscribeDoubleClick: vi.fn(),
            unsubscribeDoubleClick: vi.fn(),
          } as any);
        }
        return panes;
      });

      // Initially one pane
      manager.addButtonPanel(0);

      // Add more panes
      paneCount = 3;
      manager.addButtonPanel(2); // Should work with new pane

      expect(mockChart.panes).toHaveBeenCalledTimes(2);
    });
  });
});
