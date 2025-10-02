/**
 * @fileoverview Comprehensive tests for RibbonSeries plugin
 *
 * Tests cover the key issues we discovered and fixed:
 * - Python-Frontend default value consistency
 * - Boolean logic patterns
 * - Canvas rendering
 * - Series settings integration
 * - Data handling and updates
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  RibbonSeries,
  createRibbonSeries,
  RibbonData,
  RibbonSeriesOptions
} from '../../plugins/series/ribbonSeriesPlugin';

// Mock lightweight-charts
const mockChart = {
  addSeries: vi.fn(),
  timeScale: vi.fn(() => ({
    timeToCoordinate: vi.fn((time) => 100 + Math.random() * 300),
  })),
  priceScale: vi.fn(() => ({
    priceToCoordinate: vi.fn((price) => 100 + Math.random() * 300),
  })),
  removeSeries: vi.fn(),
};

const mockSeries = {
  setData: vi.fn(),
  update: vi.fn(),
  applyOptions: vi.fn(),
  attachPrimitive: vi.fn(),
  priceToCoordinate: vi.fn((price) => 100 + Math.random() * 300),
  options: vi.fn(() => ({
    crosshairMarkerVisible: false,
    lineWidth: 3,
    lineVisible: true,
  })),
};

vi.mock('lightweight-charts', () => ({
  LineSeries: {},
}));

vi.mock('../../utils/lightweightChartsUtils', () => ({
  asLineWidth: vi.fn((width) => width),
  asLineStyle: vi.fn((style) => style),
  asPriceLineSource: vi.fn((source) => source),
}));

describe('RibbonSeries Plugin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockChart.addSeries.mockReturnValue(mockSeries);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Default Values Consistency', () => {
    it('should match Python defaults for all boolean options', () => {
      const ribbon = new RibbonSeries(mockChart as any);
      const options = ribbon.getOptions();

      // Test critical defaults that were causing issues
      expect(options.upperLine?.crosshairMarkerVisible).toBe(false);
      expect(options.lowerLine?.crosshairMarkerVisible).toBe(false);
      expect(options.upperLine?.lineWidth).toBe(3); // Python default
      expect(options.lowerLine?.lineWidth).toBe(3); // Python default
      expect(options.upperLine?.lineVisible).toBe(true);
      expect(options.lowerLine?.lineVisible).toBe(true);
      expect(options.upperLine?.crosshairMarkerRadius).toBe(4);
      expect(options.lowerLine?.crosshairMarkerRadius).toBe(4);
      expect(options.upperLine?.crosshairMarkerBorderWidth).toBe(2);
      expect(options.lowerLine?.crosshairMarkerBorderWidth).toBe(2);
    });

    it('should use correct default colors', () => {
      const ribbon = new RibbonSeries(mockChart as any);
      const options = ribbon.getOptions();

      expect(options.upperLine?.color).toBe('#4CAF50'); // Green
      expect(options.lowerLine?.color).toBe('#F44336'); // Red
      expect(options.fill).toBe('rgba(76, 175, 80, 0.1)'); // Semi-transparent green
    });

    it('should have correct base options defaults', () => {
      const ribbon = new RibbonSeries(mockChart as any);
      const options = ribbon.getOptions();

      expect(options.visible).toBe(true);
      expect(options.priceScaleId).toBe('right');
      expect(options.lastValueVisible).toBe(false);
      expect(options.priceLineVisible).toBe(true);
      expect(options.priceLineSource).toBe('lastBar');
      expect(options.fillVisible).toBe(true);
    });
  });

  describe('Boolean Logic Patterns', () => {
    it('should handle undefined crosshairMarkerVisible correctly', () => {
      new RibbonSeries(mockChart as any, {
        upperLine: {
          // crosshairMarkerVisible is undefined
          color: '#FF0000',
        },
        lowerLine: {
          // crosshairMarkerVisible is undefined
          color: '#0000FF',
        }
      });

      // Verify that series were created with correct options
      expect(mockChart.addSeries).toHaveBeenCalledTimes(2);

      // Check first series (upper) call
      const upperSeriesCall = mockChart.addSeries.mock.calls[0];
      expect(upperSeriesCall[1].crosshairMarkerVisible).toBe(false);

      // Check second series (lower) call
      const lowerSeriesCall = mockChart.addSeries.mock.calls[1];
      expect(lowerSeriesCall[1].crosshairMarkerVisible).toBe(false);
    });

    it('should respect explicit boolean values', () => {
      new RibbonSeries(mockChart as any, {
        upperLine: {
          crosshairMarkerVisible: true,
          lineWidth: 5,
        },
        lowerLine: {
          crosshairMarkerVisible: false,
          lineWidth: 1,
        }
      });

      // Check that explicit values are used
      const upperSeriesCall = mockChart.addSeries.mock.calls[0];
      expect(upperSeriesCall[1].crosshairMarkerVisible).toBe(true);
      expect(upperSeriesCall[1].lineWidth).toBe(5);

      const lowerSeriesCall = mockChart.addSeries.mock.calls[1];
      expect(lowerSeriesCall[1].crosshairMarkerVisible).toBe(false);
      expect(lowerSeriesCall[1].lineWidth).toBe(1);
    });

    it('should handle lineVisible logic correctly', () => {
      new RibbonSeries(mockChart as any, {
        upperLine: {
          lineVisible: false,
        },
        lowerLine: {
          // lineVisible is undefined, should default to true
        }
      });

      const upperSeriesCall = mockChart.addSeries.mock.calls[0];
      expect(upperSeriesCall[1].visible).toBe(false); // false !== false = false

      const lowerSeriesCall = mockChart.addSeries.mock.calls[1];
      expect(lowerSeriesCall[1].visible).toBe(true); // undefined !== false = true
    });
  });

  describe('Series Creation and Management', () => {
    it('should create upper and lower series with correct titles', () => {
      new RibbonSeries(mockChart as any, {
        title: 'Test Ribbon'
      });

      expect(mockChart.addSeries).toHaveBeenCalledTimes(2);

      const upperSeriesCall = mockChart.addSeries.mock.calls[0];
      expect(upperSeriesCall[1].title).toBe('Test Ribbon (Upper)');

      const lowerSeriesCall = mockChart.addSeries.mock.calls[1];
      expect(lowerSeriesCall[1].title).toBe('Test Ribbon (Lower)');
    });

    it('should use default title when none provided', () => {
      new RibbonSeries(mockChart as any);

      const upperSeriesCall = mockChart.addSeries.mock.calls[0];
      expect(upperSeriesCall[1].title).toBe('Ribbon (Upper)');

      const lowerSeriesCall = mockChart.addSeries.mock.calls[1];
      expect(lowerSeriesCall[1].title).toBe('Ribbon (Lower)');
    });

    it('should attach primitive to upper series', () => {
      const ribbon = new RibbonSeries(mockChart as any);

      expect(mockSeries.attachPrimitive).toHaveBeenCalledWith(ribbon);
    });

    it('should provide access to chart and series', () => {
      const ribbon = new RibbonSeries(mockChart as any);

      expect(ribbon.getChart()).toBe(mockChart);
      expect(ribbon.getUpperSeries()).toBe(mockSeries);
      expect(ribbon.getLowerSeries()).toBe(mockSeries);
    });
  });

  describe('Data Management', () => {
    it('should set data correctly on both series', () => {
      const ribbon = new RibbonSeries(mockChart as any);
      const testData: RibbonData[] = [
        { time: '2023-01-01', value: 100, upper: 105, lower: 95 },
        { time: '2023-01-02', value: 100, upper: 110, lower: 90 },
        { time: '2023-01-03', value: 100, upper: 108, lower: 92 },
      ];

      ribbon.setData(testData);

      // Check that setData was called on both series
      expect(mockSeries.setData).toHaveBeenCalledTimes(2);

      // Check upper series data
      const upperData = mockSeries.setData.mock.calls[0][0];
      expect(upperData).toEqual([
        { time: '2023-01-01', value: 105 },
        { time: '2023-01-02', value: 110 },
        { time: '2023-01-03', value: 108 },
      ]);

      // Check lower series data
      const lowerData = mockSeries.setData.mock.calls[1][0];
      expect(lowerData).toEqual([
        { time: '2023-01-01', value: 95 },
        { time: '2023-01-02', value: 90 },
        { time: '2023-01-03', value: 92 },
      ]);
    });

    it('should update single data point correctly', () => {
      const ribbon = new RibbonSeries(mockChart as any);
      const updateData: RibbonData = { time: '2023-01-04', value: 100, upper: 112, lower: 88 };

      ribbon.update(updateData);

      // Check that update was called on both series
      expect(mockSeries.update).toHaveBeenCalledTimes(2);
      expect(mockSeries.update).toHaveBeenCalledWith({ time: '2023-01-04', value: 112 });
      expect(mockSeries.update).toHaveBeenCalledWith({ time: '2023-01-04', value: 88 });
    });

    it('should store and retrieve data correctly', () => {
      const ribbon = new RibbonSeries(mockChart as any);
      const testData: RibbonData[] = [
        { time: '2023-01-01', value: 100, upper: 105, lower: 95 },
      ];

      ribbon.setData(testData);
      expect(ribbon.getData()).toEqual(testData);
    });
  });

  describe('Options Management', () => {
    it('should update visibility correctly', () => {
      const ribbon = new RibbonSeries(mockChart as any);

      ribbon.setVisible(false);

      expect(mockSeries.applyOptions).toHaveBeenCalledTimes(2);
      expect(mockSeries.applyOptions).toHaveBeenCalledWith({ visible: false });
    });

    it('should update line options correctly', () => {
      const ribbon = new RibbonSeries(mockChart as any);

      ribbon.setOptions({
        upperLine: {
          color: '#FF0000',
          lineWidth: 5,
          crosshairMarkerVisible: true,
        },
        lowerLine: {
          color: '#0000FF',
          lineWidth: 1,
          crosshairMarkerVisible: false,
        }
      });

      // Should call applyOptions for both series
      expect(mockSeries.applyOptions).toHaveBeenCalledTimes(2);

      // Check upper series options
      const upperOptions = mockSeries.applyOptions.mock.calls[0][0];
      expect(upperOptions.color).toBe('#FF0000');
      expect(upperOptions.lineWidth).toBe(5);
      expect(upperOptions.crosshairMarkerVisible).toBe(true);
      expect(upperOptions.priceLineColor).toBe('#FF0000'); // Should sync

      // Check lower series options
      const lowerOptions = mockSeries.applyOptions.mock.calls[1][0];
      expect(lowerOptions.color).toBe('#0000FF');
      expect(lowerOptions.lineWidth).toBe(1);
      expect(lowerOptions.crosshairMarkerVisible).toBe(false);
      expect(lowerOptions.priceLineColor).toBe('#0000FF'); // Should sync
    });

    it('should handle fallback values in setOptions', () => {
      const ribbon = new RibbonSeries(mockChart as any);

      ribbon.setOptions({
        upperLine: {
          // lineWidth is undefined, should use fallback of 3
        }
      });

      const upperOptions = mockSeries.applyOptions.mock.calls[0][0];
      expect(upperOptions.lineWidth).toBe(3); // Should use Python default fallback
    });

    it('should maintain visibility constraints', () => {
      const ribbon = new RibbonSeries(mockChart as any, { visible: false });

      ribbon.setOptions({
        upperLine: {
          lineVisible: true, // Should be overridden by overall visibility
        }
      });

      const upperOptions = mockSeries.applyOptions.mock.calls[0][0];
      expect(upperOptions.visible).toBe(false); // false && true = false
    });
  });

  describe('Cleanup', () => {
    it('should remove both series on cleanup', () => {
      const ribbon = new RibbonSeries(mockChart as any);

      ribbon.remove();

      expect(mockChart.removeSeries).toHaveBeenCalledTimes(2);
      expect(mockChart.removeSeries).toHaveBeenCalledWith(mockSeries);
    });
  });

  describe('Factory Functions', () => {
    it('should create ribbon series via factory function', () => {
      const options: Partial<RibbonSeriesOptions> = {
        title: 'Factory Test',
        upperLine: { color: '#FF0000' },
      };

      const ribbon = createRibbonSeries(mockChart as any, options);

      expect(ribbon).toBeInstanceOf(RibbonSeries);
      expect(ribbon.getOptions().title).toBe('Factory Test');
    });

    it('should work with no options', () => {
      const ribbon = createRibbonSeries(mockChart as any);

      expect(ribbon).toBeInstanceOf(RibbonSeries);
      expect(ribbon.getOptions().upperLine?.color).toBe('#4CAF50');
    });
  });

  describe('Canvas Rendering Integration', () => {
    it('should have proper pane views', () => {
      const ribbon = new RibbonSeries(mockChart as any);
      const paneViews = ribbon.paneViews();

      expect(paneViews).toHaveLength(1);
      expect(paneViews[0]).toBeDefined();
    });

    it('should update all views when data changes', () => {
      const ribbon = new RibbonSeries(mockChart as any);
      const spy = vi.spyOn(ribbon, 'updateAllViews');

      ribbon.setData([{ time: '2023-01-01', value: 95, upper: 100, lower: 90 }]);

      expect(spy).toHaveBeenCalled();
    });

    it('should handle z-index properly', () => {
      const ribbon = new RibbonSeries(mockChart as any, { zIndex: 150 });
      const options = ribbon.getOptions();

      expect(options.zIndex).toBe(150);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid data gracefully', () => {
      const ribbon = new RibbonSeries(mockChart as any);

      expect(() => {
        ribbon.setData([]);
      }).not.toThrow();

      expect(() => {
        ribbon.update({ time: '2023-01-01', value: 90, upper: NaN, lower: 90 });
      }).not.toThrow();
    });

    it('should handle missing chart methods gracefully', () => {
      const limitedChart = {
        addSeries: vi.fn().mockReturnValue(mockSeries),
        timeScale: vi.fn(() => ({ timeToCoordinate: vi.fn() })),
        removeSeries: vi.fn(),
      };

      expect(() => {
        new RibbonSeries(limitedChart as any);
      }).not.toThrow();
    });
  });

  describe('Performance', () => {
    it('should handle large datasets efficiently', () => {
      const ribbon = new RibbonSeries(mockChart as any);
      const largeData: RibbonData[] = Array.from({ length: 10000 }, (_, i) => {
        const upper = 100 + Math.random() * 20;
        const lower = 80 + Math.random() * 20;
        return {
          time: `2023-01-${(i % 30) + 1}`,
          value: (upper + lower) / 2,
          upper: upper,
          lower: lower,
        };
      });

      const start = performance.now();
      ribbon.setData(largeData);
      const duration = performance.now() - start;

      // Should complete within reasonable time (1 second for 10k points)
      expect(duration).toBeLessThan(1000);
      expect(mockSeries.setData).toHaveBeenCalledTimes(2);
    });

    it('should batch updates efficiently', () => {
      const ribbon = new RibbonSeries(mockChart as any);

      // Multiple rapid updates
      for (let i = 0; i < 100; i++) {
        ribbon.update({ time: `2023-01-${i}`, value: 95 + i, upper: 100 + i, lower: 90 + i });
      }

      // Each update should call mockSeries.update twice (upper and lower)
      expect(mockSeries.update).toHaveBeenCalledTimes(200);
    });
  });

  describe('Integration with Settings Dialog', () => {
    it('should maintain settings-friendly structure', () => {
      const ribbon = new RibbonSeries(mockChart as any, {
        title: 'Settings Test Ribbon'
      });

      // These are the properties that the settings dialog expects
      expect(ribbon.getOptions().title).toBe('Settings Test Ribbon');
      expect(ribbon.getOptions().upperLine).toBeDefined();
      expect(ribbon.getOptions().lowerLine).toBeDefined();
      expect(ribbon.getOptions().fill).toBeDefined();
      expect(ribbon.getOptions().fillVisible).toBeDefined();
    });

    it('should support all standard series options', () => {
      const ribbon = new RibbonSeries(mockChart as any);
      const options = ribbon.getOptions();

      // Standard series options that settings dialog expects
      expect(options.visible).toBeDefined();
      expect(options.priceScaleId).toBeDefined();
      expect(options.lastValueVisible).toBeDefined();
      expect(options.priceLineVisible).toBeDefined();
      expect(options.priceLineSource).toBeDefined();
      expect(options.priceLineWidth).toBeDefined();
      expect(options.priceLineColor).toBeDefined();
      expect(options.priceLineStyle).toBeDefined();
    });
  });
});
