/**
 * @fileoverview Tests for Corner Layout Manager
 *
 * Tests cover:
 * - Singleton pattern per chart-pane combination
 * - Widget registration and unregistration
 * - Corner positioning calculations
 * - Widget stacking and priority ordering
 * - Overflow detection
 * - Chart dimension updates
 * - Visibility management
 * - Event emissions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Unmock since it's globally mocked
vi.unmock('../../services/CornerLayoutManager');

import { CornerLayoutManager } from '../../services/CornerLayoutManager';
import { IPositionableWidget, Corner } from '../../types/layout';
import { IChartApi } from 'lightweight-charts';

// Mock ChartCoordinateService
vi.mock('../../services/ChartCoordinateService', () => ({
  ChartCoordinateService: {
    getInstance: vi.fn(() => ({
      getPaneCoordinates: vi.fn((chartApi: any, paneId: number) => ({
        x: 0,
        y: 0,
        width: 800,
        height: 400,
      })),
    })),
  },
}));

// Mock chart API
const mockChartElement = {
  getBoundingClientRect: () => ({ width: 800, height: 400 }),
  offsetWidth: 800,
  offsetHeight: 400,
};

const mockChart = {
  chartElement: vi.fn(() => mockChartElement),
} as any as IChartApi;

// Helper to create mock widgets
function createMockWidget(
  id: string,
  corner: Corner = 'top-left',
  priority: number = 0,
  dimensions: { width: number; height: number } = { width: 100, height: 20 },
  visible: boolean = true
): IPositionableWidget {
  const widget: IPositionableWidget = {
    id,
    corner,
    priority,
    visible,
    getDimensions: vi.fn(() => dimensions),
    updatePosition: vi.fn(),
  };
  return widget;
}

describe('CornerLayoutManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear all instances using the proper method to ensure clean state between tests
    // This prevents configuration from one test bleeding into another
    (CornerLayoutManager as any).clearAllInstances('CornerLayoutManager');
  });

  describe('Singleton Pattern', () => {
    it('should return same instance for same chart-pane combination', () => {
      const instance1 = CornerLayoutManager.getInstance('chart-1', 0);
      const instance2 = CornerLayoutManager.getInstance('chart-1', 0);

      expect(instance1).toBe(instance2);
    });

    it('should return different instances for different charts', () => {
      const instance1 = CornerLayoutManager.getInstance('chart-1', 0);
      const instance2 = CornerLayoutManager.getInstance('chart-2', 0);

      expect(instance1).not.toBe(instance2);
    });

    it('should return different instances for different panes', () => {
      const instance1 = CornerLayoutManager.getInstance('chart-1', 0);
      const instance2 = CornerLayoutManager.getInstance('chart-1', 1);

      expect(instance1).not.toBe(instance2);
    });

    it('should use default values when chartId and paneId not provided', () => {
      const instance1 = CornerLayoutManager.getInstance();
      const instance2 = CornerLayoutManager.getInstance(); // Same signature

      expect(instance1).toBe(instance2);
      expect(instance1.getChartId()).toBe('default'); // Verify default chartId
    });

    it('should get chart ID', () => {
      const instance = CornerLayoutManager.getInstance('my-chart', 0);

      expect(instance.getChartId()).toBe('my-chart');
    });
  });

  describe('Cleanup', () => {
    it('should cleanup specific pane', () => {
      const instance1 = CornerLayoutManager.getInstance('chart-1', 0);
      const instance2 = CornerLayoutManager.getInstance('chart-1', 1);

      CornerLayoutManager.cleanup('chart-1', 0);

      const newInstance1 = CornerLayoutManager.getInstance('chart-1', 0);
      const newInstance2 = CornerLayoutManager.getInstance('chart-1', 1);

      expect(newInstance1).not.toBe(instance1);
      expect(newInstance2).toBe(instance2); // Not cleaned up
    });

    it('should cleanup all panes for a chart', () => {
      const instance1 = CornerLayoutManager.getInstance('chart-1', 0);
      const instance2 = CornerLayoutManager.getInstance('chart-1', 1);

      CornerLayoutManager.cleanup('chart-1');

      const newInstance1 = CornerLayoutManager.getInstance('chart-1', 0);
      const newInstance2 = CornerLayoutManager.getInstance('chart-1', 1);

      expect(newInstance1).not.toBe(instance1);
      expect(newInstance2).not.toBe(instance2);
    });
  });

  describe('Configuration', () => {
    it('should configure layout settings', () => {
      const manager = CornerLayoutManager.getInstance('chart-1', 0);
      const widget = createMockWidget('widget-1');

      manager.configure({
        edgePadding: 10,
        widgetGap: 5,
        baseZIndex: 2000,
      });

      manager.setChartApi(mockChart);
      manager.registerWidget(widget);

      const position = manager.getWidgetPosition('widget-1');

      expect(position).toBeDefined();
      expect(position?.zIndex).toBe(2000); // baseZIndex
    });

    it('should use default configuration values', () => {
      const manager = CornerLayoutManager.getInstance('chart-1', 0);
      const widget = createMockWidget('widget-1');

      manager.setChartApi(mockChart);
      manager.registerWidget(widget);

      const position = manager.getWidgetPosition('widget-1');

      expect(position).toBeDefined();
      expect(position?.zIndex).toBe(1000); // Default baseZIndex from LayoutSpacing
    });
  });

  describe('Chart API and Dimensions', () => {
    it('should set chart API', () => {
      const manager = CornerLayoutManager.getInstance('chart-1', 0);

      manager.setChartApi(mockChart);

      // Chart API should be used for coordinate calculations
      const widget = createMockWidget('widget-1');
      manager.registerWidget(widget);

      expect(widget.updatePosition).toHaveBeenCalled();
    });

    it('should update chart dimensions', () => {
      const manager = CornerLayoutManager.getInstance('chart-1', 0);
      const widget = createMockWidget('widget-1');

      manager.registerWidget(widget);
      manager.updateChartDimensions({ width: 1200, height: 600 });

      expect(widget.updatePosition).toHaveBeenCalled();
    });

    it('should update chart dimensions from element', () => {
      const manager = CornerLayoutManager.getInstance('chart-1', 0);
      const widget = createMockWidget('widget-1');

      manager.setChartApi(mockChart);
      manager.registerWidget(widget);

      vi.clearAllMocks();
      manager.updateChartDimensionsFromElement();

      expect(mockChart.chartElement).toHaveBeenCalled();
      expect(widget.updatePosition).toHaveBeenCalled();
    });

    it('should handle chart element access failure gracefully', () => {
      const manager = CornerLayoutManager.getInstance('chart-1', 0);
      const badChart = {
        chartElement: vi.fn(() => {
          throw new Error('Chart element access failed');
        }),
      } as any as IChartApi;

      manager.setChartApi(badChart);

      expect(() => manager.updateChartDimensionsFromElement()).not.toThrow();
    });

    it('should update chart layout with axis dimensions', () => {
      const manager = CornerLayoutManager.getInstance('chart-1', 0);
      const widget = createMockWidget('widget-1');

      manager.registerWidget(widget);
      manager.updateChartLayout({
        container: { width: 1000, height: 500 },
        axis: {
          priceScale: {
            left: { width: 60, height: 400 },
            right: { width: 60, height: 400 },
          },
          timeScale: { width: 880, height: 30 },
        },
      });

      expect(widget.updatePosition).toHaveBeenCalled();
    });
  });

  describe('Widget Registration', () => {
    it('should register widget', () => {
      const manager = CornerLayoutManager.getInstance('chart-1', 0);
      const widget = createMockWidget('widget-1');

      manager.setChartApi(mockChart);
      manager.registerWidget(widget);

      const position = manager.getWidgetPosition('widget-1');
      expect(position).toBeDefined();
    });

    it('should replace existing widget with same ID', () => {
      const manager = CornerLayoutManager.getInstance('chart-1', 0);
      const widget1 = createMockWidget('widget-1', 'top-left', 0);
      const widget2 = createMockWidget('widget-1', 'top-right', 5);

      manager.setChartApi(mockChart);
      manager.registerWidget(widget1);
      manager.registerWidget(widget2);

      // Widget should now be in top-right corner
      const position = manager.getWidgetPosition('widget-1');
      expect(position).toBeDefined();
    });

    it('should sort widgets by priority', () => {
      const manager = CornerLayoutManager.getInstance('chart-1', 0);
      const widget1 = createMockWidget('widget-1', 'top-left', 10);
      const widget2 = createMockWidget('widget-2', 'top-left', 5);
      const widget3 = createMockWidget('widget-3', 'top-left', 1);

      manager.setChartApi(mockChart);
      manager.registerWidget(widget1);
      manager.registerWidget(widget2);
      manager.registerWidget(widget3);

      // Lower priority (1) should have lower z-index
      const pos1 = manager.getWidgetPosition('widget-1');
      const pos2 = manager.getWidgetPosition('widget-2');
      const pos3 = manager.getWidgetPosition('widget-3');

      expect(pos3?.zIndex).toBeLessThan(pos2!.zIndex);
      expect(pos2?.zIndex).toBeLessThan(pos1!.zIndex);
    });

    it('should unregister widget', () => {
      const manager = CornerLayoutManager.getInstance('chart-1', 0);
      const widget = createMockWidget('widget-1');

      manager.setChartApi(mockChart);
      manager.registerWidget(widget);
      manager.unregisterWidget('widget-1');

      const position = manager.getWidgetPosition('widget-1');
      expect(position).toBeNull();
    });

    it('should handle unregistering non-existent widget', () => {
      const manager = CornerLayoutManager.getInstance('chart-1', 0);

      expect(() => manager.unregisterWidget('non-existent')).not.toThrow();
    });
  });

  describe('Widget Positioning', () => {
    it('should position widget in top-left corner', () => {
      const manager = CornerLayoutManager.getInstance('chart-1', 0);
      const widget = createMockWidget('widget-1', 'top-left', 0, { width: 100, height: 20 });

      manager.setChartApi(mockChart);
      manager.registerWidget(widget);

      const position = manager.getWidgetPosition('widget-1');

      expect(position?.top).toBe(6); // edgePadding
      expect(position?.left).toBe(6);
    });

    it('should position widget in top-right corner', () => {
      const manager = CornerLayoutManager.getInstance('chart-1', 0);
      const widget = createMockWidget('widget-1', 'top-right', 0, { width: 100, height: 20 });

      manager.setChartApi(mockChart);
      manager.registerWidget(widget);

      const position = manager.getWidgetPosition('widget-1');

      expect(position?.top).toBe(6);
      expect(position?.left).toBe(694); // 800 - 100 - 6
    });

    it('should position widget in bottom-left corner', () => {
      const manager = CornerLayoutManager.getInstance('chart-1', 0);
      const widget = createMockWidget('widget-1', 'bottom-left', 0, { width: 100, height: 20 });

      manager.setChartApi(mockChart);
      manager.registerWidget(widget);

      const position = manager.getWidgetPosition('widget-1');

      expect(position?.left).toBe(6);
      // Bottom positioning: 400 (height) - 6 (edge) - 32 (total height) = 362
      expect(position?.top).toBeGreaterThan(350);
    });

    it('should position widget in bottom-right corner', () => {
      const manager = CornerLayoutManager.getInstance('chart-1', 0);
      const widget = createMockWidget('widget-1', 'bottom-right', 0, { width: 100, height: 20 });

      manager.setChartApi(mockChart);
      manager.registerWidget(widget);

      const position = manager.getWidgetPosition('widget-1');

      expect(position?.left).toBe(694); // 800 - 100 - 6
      expect(position?.top).toBeGreaterThan(350);
    });

    it('should stack widgets vertically with gaps', () => {
      const manager = CornerLayoutManager.getInstance('chart-1', 0);
      const widget1 = createMockWidget('widget-1', 'top-left', 1, { width: 100, height: 20 });
      const widget2 = createMockWidget('widget-2', 'top-left', 2, { width: 100, height: 20 });

      manager.setChartApi(mockChart);
      manager.registerWidget(widget1);
      manager.registerWidget(widget2);

      const pos1 = manager.getWidgetPosition('widget-1');
      const pos2 = manager.getWidgetPosition('widget-2');

      // Widget 2 should be below widget 1 with gap
      expect(pos2?.top).toBe((pos1?.top ?? 0) + 20 + 6); // 20 (height) + 6 (gap)
    });

    it('should handle widgets without chart API (fallback mode)', () => {
      const manager = CornerLayoutManager.getInstance('chart-1', 0);
      const widget = createMockWidget('widget-1', 'top-left');

      manager.updateChartDimensions({ width: 1000, height: 500 });
      manager.registerWidget(widget);

      const position = manager.getWidgetPosition('widget-1');

      expect(position).toBeDefined();
      expect(position?.left).toBe(6);
    });
  });

  describe('Widget Visibility', () => {
    it('should update widget visibility', () => {
      const manager = CornerLayoutManager.getInstance('chart-1', 0);
      const widget = createMockWidget('widget-1', 'top-left', 0, { width: 100, height: 20 }, true);

      manager.setChartApi(mockChart);
      manager.registerWidget(widget);

      vi.clearAllMocks();
      manager.updateWidgetVisibility('widget-1', false);

      // Should recalculate layout when visibility changes
      expect(widget.updatePosition).not.toHaveBeenCalled(); // Hidden widgets don't get position updates
    });

    it('should not return position for invisible widget', () => {
      const manager = CornerLayoutManager.getInstance('chart-1', 0);
      const widget = createMockWidget('widget-1', 'top-left', 0, { width: 100, height: 20 }, false);

      manager.setChartApi(mockChart);
      manager.registerWidget(widget);

      const position = manager.getWidgetPosition('widget-1');

      expect(position).toBeNull();
    });

    it('should not update visibility if already same', () => {
      const manager = CornerLayoutManager.getInstance('chart-1', 0);
      const widget = createMockWidget('widget-1', 'top-left', 0, { width: 100, height: 20 }, true);

      manager.setChartApi(mockChart);
      manager.registerWidget(widget);

      vi.clearAllMocks();
      manager.updateWidgetVisibility('widget-1', true); // Already visible

      // Should not trigger recalculation for same visibility
      expect(widget.updatePosition).not.toHaveBeenCalled();
    });
  });

  describe('Event Handling', () => {
    it('should emit onLayoutChanged event', () => {
      const manager = CornerLayoutManager.getInstance('chart-1', 0);
      const onLayoutChanged = vi.fn();

      manager.on({ onLayoutChanged });

      const widget = createMockWidget('widget-1', 'top-left');
      manager.setChartApi(mockChart);
      manager.registerWidget(widget);

      expect(onLayoutChanged).toHaveBeenCalledWith('top-left', expect.any(Array));
    });

    it('should emit onOverflow event when widgets overflow', () => {
      const manager = CornerLayoutManager.getInstance('chart-1', 0);
      const onOverflow = vi.fn();

      manager.on({ onOverflow });
      manager.setChartApi(mockChart);
      manager.updateChartDimensions({ width: 100, height: 100 }); // Small dimensions

      // Register widget that will overflow
      const widget = createMockWidget('widget-1', 'top-left', 0, { width: 200, height: 20 });
      manager.registerWidget(widget);

      expect(onOverflow).toHaveBeenCalledWith('top-left', expect.arrayContaining([widget]));
    });

    it('should not emit events when handlers not set', () => {
      const manager = CornerLayoutManager.getInstance('chart-1', 0);
      const widget = createMockWidget('widget-1', 'top-left');

      manager.setChartApi(mockChart);

      expect(() => manager.registerWidget(widget)).not.toThrow();
    });
  });

  describe('Overflow Detection', () => {
    it('should detect widget overflowing right edge', () => {
      const manager = CornerLayoutManager.getInstance('chart-1', 0);
      const onOverflow = vi.fn();

      manager.on({ onOverflow });
      manager.setChartApi(mockChart);
      manager.updateChartDimensions({ width: 100, height: 400 });

      const widget = createMockWidget('widget-1', 'top-left', 0, { width: 200, height: 20 });
      manager.registerWidget(widget);

      expect(onOverflow).toHaveBeenCalled();
    });

    it('should detect widget overflowing bottom edge', () => {
      const manager = CornerLayoutManager.getInstance('chart-1', 0);
      const onOverflow = vi.fn();

      manager.on({ onOverflow });
      manager.setChartApi(mockChart);
      manager.updateChartDimensions({ width: 800, height: 30 });

      const widget = createMockWidget('widget-1', 'top-left', 0, { width: 100, height: 50 });
      manager.registerWidget(widget);

      expect(onOverflow).toHaveBeenCalled();
    });

    it('should not detect overflow for properly sized widgets', () => {
      const manager = CornerLayoutManager.getInstance('chart-1', 0);
      const onOverflow = vi.fn();

      manager.on({ onOverflow });
      manager.setChartApi(mockChart);
      manager.updateChartDimensions({ width: 800, height: 400 });

      const widget = createMockWidget('widget-1', 'top-left', 0, { width: 100, height: 20 });
      manager.registerWidget(widget);

      expect(onOverflow).not.toHaveBeenCalled();
    });
  });

  describe('Layout Recalculation', () => {
    it('should recalculate all layouts', () => {
      const manager = CornerLayoutManager.getInstance('chart-1', 0);
      const widget1 = createMockWidget('widget-1', 'top-left');
      const widget2 = createMockWidget('widget-2', 'top-right');

      manager.setChartApi(mockChart);
      manager.registerWidget(widget1);
      manager.registerWidget(widget2);

      vi.clearAllMocks();
      manager.recalculateAllLayouts();

      expect(widget1.updatePosition).toHaveBeenCalled();
      expect(widget2.updatePosition).toHaveBeenCalled();
    });

    it('should recalculate layout when configuration changes', () => {
      const manager = CornerLayoutManager.getInstance('chart-1', 0);
      const widget = createMockWidget('widget-1', 'top-left');

      manager.setChartApi(mockChart);
      manager.registerWidget(widget);

      vi.clearAllMocks();
      manager.configure({ edgePadding: 20 });

      expect(widget.updatePosition).toHaveBeenCalled();
    });

    it('should recalculate layout when chart API is set', () => {
      const manager = CornerLayoutManager.getInstance('chart-1', 0);
      const widget = createMockWidget('widget-1', 'top-left');

      manager.registerWidget(widget);

      vi.clearAllMocks();
      manager.setChartApi(mockChart);

      expect(widget.updatePosition).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero-dimension widgets', () => {
      const manager = CornerLayoutManager.getInstance('chart-1', 0);
      const widget = createMockWidget('widget-1', 'top-left', 0, { width: 0, height: 0 });

      manager.setChartApi(mockChart);
      manager.registerWidget(widget);

      const position = manager.getWidgetPosition('widget-1');
      expect(position).toBeDefined();
    });

    it('should handle very large widget dimensions', () => {
      const manager = CornerLayoutManager.getInstance('chart-1', 0);
      const widget = createMockWidget('widget-1', 'top-left', 0, { width: 10000, height: 10000 });

      manager.setChartApi(mockChart);

      expect(() => manager.registerWidget(widget)).not.toThrow();
    });

    it('should handle many widgets in same corner', () => {
      const manager = CornerLayoutManager.getInstance('chart-1', 0);

      manager.setChartApi(mockChart);

      for (let i = 0; i < 100; i++) {
        const widget = createMockWidget(`widget-${i}`, 'top-left', i);
        manager.registerWidget(widget);
      }

      const position = manager.getWidgetPosition('widget-99');
      expect(position).toBeDefined();
    });

    it('should return null for non-existent widget position', () => {
      const manager = CornerLayoutManager.getInstance('chart-1', 0);

      const position = manager.getWidgetPosition('non-existent');

      expect(position).toBeNull();
    });

    it('should handle negative chart dimensions gracefully', () => {
      const manager = CornerLayoutManager.getInstance('chart-1', 0);
      const widget = createMockWidget('widget-1', 'top-left');

      manager.updateChartDimensions({ width: -100, height: -100 });
      manager.registerWidget(widget);

      // Should use fallback dimensions
      expect(() => manager.getWidgetPosition('widget-1')).not.toThrow();
    });
  });
});
