/**
 * @fileoverview Comprehensive tests for GradientRibbonSeries plugin
 *
 * Tests gradient ribbon series with dual-line functionality and gradient fills,
 * covering default values, boolean logic patterns, and gradient color interpolation.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  GradientRibbonSeries,
  createGradientRibbonSeries,
  GradientRibbonData,
} from '../../plugins/series/gradientRibbonSeriesPlugin';

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
  chartElement: vi.fn(() => ({
    clientWidth: 800,
    clientHeight: 400,
  })),
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

describe('GradientRibbonSeries Plugin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockChart.addSeries.mockReturnValue(mockSeries);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Default Values Consistency', () => {
    it('should match Python defaults for both lines', () => {
      const gradientRibbon = new GradientRibbonSeries(mockChart as any);
      const options = gradientRibbon.getOptions();

      // Test both lines have consistent defaults
      expect(options.upperLine?.lineWidth).toBe(3); // Python default
      expect(options.lowerLine?.lineWidth).toBe(3); // Python default

      expect(options.upperLine?.visible).toBe(true);
      expect(options.lowerLine?.visible).toBe(true);

      expect(options.upperLine?.lineStyle).toBe(0); // SOLID
      expect(options.lowerLine?.lineStyle).toBe(0); // SOLID
    });

    it('should use correct default colors for gradient ribbon', () => {
      const gradientRibbon = new GradientRibbonSeries(mockChart as any);
      const options = gradientRibbon.getOptions();

      expect(options.upperLine?.color).toBe('#4CAF50'); // Green
      expect(options.lowerLine?.color).toBe('#F44336'); // Red
      expect(options.fill).toBe('rgba(76, 175, 80, 0.1)'); // Green with transparency
    });

    it('should have correct gradient defaults', () => {
      const gradientRibbon = new GradientRibbonSeries(mockChart as any);
      const options = gradientRibbon.getOptions();

      expect(options.gradientStartColor).toBe('#4CAF50');
      expect(options.gradientEndColor).toBe('#F44336');
      expect(options.normalizeGradients).toBe(true);
      expect(options.fillVisible).toBe(true);
    });

    it('should have correct z-index and visibility defaults', () => {
      const gradientRibbon = new GradientRibbonSeries(mockChart as any);
      const options = gradientRibbon.getOptions();

      expect(options.zIndex).toBe(100);
      expect(options.visible).toBe(true);
      expect(options.priceScaleId).toBe('right');
    });
  });

  describe('Series Creation and Management', () => {
    it('should create two line series for gradient ribbon', () => {
      new GradientRibbonSeries(mockChart as any);

      expect(mockChart.addSeries).toHaveBeenCalledTimes(2);
    });

    it('should attach primitive to upper series', () => {
      const gradientRibbon = new GradientRibbonSeries(mockChart as any);

      expect(mockSeries.attachPrimitive).toHaveBeenCalledWith(gradientRibbon);
    });

    it('should provide access to both series', () => {
      const gradientRibbon = new GradientRibbonSeries(mockChart as any);

      expect(gradientRibbon.getChart()).toBe(mockChart);
      expect(gradientRibbon.getUpperSeries()).toBe(mockSeries);
      expect(gradientRibbon.getLowerSeries()).toBe(mockSeries);
    });
  });

  describe('Data Management', () => {
    it('should set data correctly on both series', () => {
      const gradientRibbon = new GradientRibbonSeries(mockChart as any);
      const testData: GradientRibbonData[] = [
        { time: '2023-01-01', value: 100, upper: 110, lower: 90 },
        { time: '2023-01-02', value: 105, upper: 115, lower: 95 },
        { time: '2023-01-03', value: 101, upper: 112, lower: 92 },
      ];

      gradientRibbon.setData(testData);

      // Check that setData was called on both series
      expect(mockSeries.setData).toHaveBeenCalledTimes(2);

      // Check upper series data
      const upperData = mockSeries.setData.mock.calls[0][0];
      expect(upperData).toEqual([
        { time: '2023-01-01', value: 110 },
        { time: '2023-01-02', value: 115 },
        { time: '2023-01-03', value: 112 },
      ]);

      // Check lower series data
      const lowerData = mockSeries.setData.mock.calls[1][0];
      expect(lowerData).toEqual([
        { time: '2023-01-01', value: 90 },
        { time: '2023-01-02', value: 95 },
        { time: '2023-01-03', value: 92 },
      ]);
    });

    it('should update single data point correctly on both series', () => {
      const gradientRibbon = new GradientRibbonSeries(mockChart as any);
      const updateData: GradientRibbonData = { time: '2023-01-04', value: 108, upper: 118, lower: 98 };

      gradientRibbon.update(updateData);

      // Check that update was called on both series
      expect(mockSeries.update).toHaveBeenCalledTimes(2);
      expect(mockSeries.update).toHaveBeenCalledWith({ time: '2023-01-04', value: 118 });
      expect(mockSeries.update).toHaveBeenCalledWith({ time: '2023-01-04', value: 98 });
    });

    it('should handle custom fillColor in data', () => {
      const gradientRibbon = new GradientRibbonSeries(mockChart as any);
      const testData: GradientRibbonData[] = [
        { time: '2023-01-01', value: 100, upper: 110, lower: 90, fillColor: '#FF0000' },
      ];

      gradientRibbon.setData(testData);

      // Should process the custom fill color
      const processedData = gradientRibbon.getProcessedData();
      expect(processedData[0].fillColor).toBe('#FF0000');
    });
  });

  describe('Options Management', () => {
    it('should update visibility correctly for both series', () => {
      const gradientRibbon = new GradientRibbonSeries(mockChart as any);

      gradientRibbon.setVisible(false);

      expect(mockSeries.applyOptions).toHaveBeenCalledTimes(2);
      expect(mockSeries.applyOptions).toHaveBeenCalledWith({ visible: false });
    });

    it('should update individual line options correctly', () => {
      const gradientRibbon = new GradientRibbonSeries(mockChart as any);

      gradientRibbon.setOptions({
        upperLine: {
          color: '#FF0000',
          lineWidth: 5,
          lineStyle: 1,
          visible: true,
        },
        lowerLine: {
          color: '#0000FF',
          lineWidth: 1,
          lineStyle: 2,
          visible: false,
        }
      });

      // Should call applyOptions for both series
      expect(mockSeries.applyOptions).toHaveBeenCalledTimes(2);

      // Check options applied to each series
      const calls = mockSeries.applyOptions.mock.calls;

      // Upper series
      expect(calls[0][0].color).toBe('#FF0000');
      expect(calls[0][0].lineWidth).toBe(5);
      expect(calls[0][0].lineStyle).toBe(1);

      // Lower series
      expect(calls[1][0].color).toBe('#0000FF');
      expect(calls[1][0].lineWidth).toBe(1);
      expect(calls[1][0].lineStyle).toBe(2);
    });

    it('should handle gradient options correctly', () => {
      const gradientRibbon = new GradientRibbonSeries(mockChart as any);

      gradientRibbon.setOptions({
        gradientStartColor: '#00FF00',
        gradientEndColor: '#FF00FF',
        normalizeGradients: false,
        fillVisible: false,
      });

      const options = gradientRibbon.getOptions();
      expect(options.gradientStartColor).toBe('#00FF00');
      expect(options.gradientEndColor).toBe('#FF00FF');
      expect(options.normalizeGradients).toBe(false);
      expect(options.fillVisible).toBe(false);
    });

    it('should handle fallback values correctly', () => {
      const gradientRibbon = new GradientRibbonSeries(mockChart as any);

      gradientRibbon.setOptions({
        upperLine: {
          // lineWidth is undefined, should use fallback of 3
          color: '#FF0000',
          lineStyle: 0,
          visible: true,
        }
      });

      const upperOptions = mockSeries.applyOptions.mock.calls[0][0];
      expect(upperOptions.lineWidth).toBe(3); // Should use Python default fallback
    });
  });

  describe('Gradient Color Interpolation', () => {
    it('should interpolate colors correctly', () => {
      // This would test the internal interpolateColor function
      // We can test this through data processing
      const gradientRibbon = new GradientRibbonSeries(mockChart as any, {
        gradientStartColor: '#FF0000', // Red
        gradientEndColor: '#0000FF', // Blue
        normalizeGradients: true,
        upperLine: { color: '#4CAF50', lineWidth: 3, lineStyle: 0, visible: true },
        lowerLine: { color: '#F44336', lineWidth: 3, lineStyle: 0, visible: true },
        fill: 'rgba(76, 175, 80, 0.1)',
        fillVisible: true,
        priceScaleId: 'right',
        visible: true,
        zIndex: 100,
      });

      const testData: GradientRibbonData[] = [
        { time: '2023-01-01', value: 95, upper: 100, lower: 90 },
        { time: '2023-01-02', value: 95, upper: 110, lower: 80 },
      ];

      gradientRibbon.setData(testData);
      const processedData = gradientRibbon.getProcessedData();

      // Should have gradient colors based on interpolation
      expect(processedData.length).toBe(2);
      expect(processedData[0].fillColor).toBeDefined();
      expect(processedData[1].fillColor).toBeDefined();
    });

    it('should handle gradient normalization', () => {
      const gradientRibbon = new GradientRibbonSeries(mockChart as any, {
        normalizeGradients: true,
        gradientStartColor: '#FF0000',
        gradientEndColor: '#0000FF',
        upperLine: { color: '#4CAF50', lineWidth: 3, lineStyle: 0, visible: true },
        lowerLine: { color: '#F44336', lineWidth: 3, lineStyle: 0, visible: true },
        fill: 'rgba(76, 175, 80, 0.1)',
        fillVisible: true,
        priceScaleId: 'right',
        visible: true,
        zIndex: 100,
      });

      const testData: GradientRibbonData[] = [
        { time: '2023-01-01', value: 95, upper: 100, lower: 90 }, // spread: 10
        { time: '2023-01-02', value: 100, upper: 120, lower: 80 }, // spread: 40
      ];

      gradientRibbon.setData(testData);
      const processedData = gradientRibbon.getProcessedData();

      // Colors should be different due to normalization
      expect(processedData[0].fillColor).not.toBe(processedData[1].fillColor);
    });
  });

  describe('Z-Index Support', () => {
    it('should handle z-index properly', () => {
      const gradientRibbon = new GradientRibbonSeries(mockChart as any, {
        zIndex: 200,
        upperLine: { color: '#4CAF50', lineWidth: 3, lineStyle: 0, visible: true },
        lowerLine: { color: '#F44336', lineWidth: 3, lineStyle: 0, visible: true },
        fill: 'rgba(76, 175, 80, 0.1)',
        fillVisible: true,
        gradientStartColor: '#4CAF50',
        gradientEndColor: '#F44336',
        normalizeGradients: true,
        priceScaleId: 'right',
        visible: true,
      });
      const paneViews = gradientRibbon.paneViews();

      expect(paneViews[0]).toBeDefined();
    });

    it('should use default z-index when not specified', () => {
      const gradientRibbon = new GradientRibbonSeries(mockChart as any);
      const paneViews = gradientRibbon.paneViews();

      expect(paneViews[0]).toBeDefined(); // Default for gradient ribbon series
    });

    it('should validate z-index values', () => {
      const gradientRibbon = new GradientRibbonSeries(mockChart as any, {
        zIndex: -5,
        upperLine: { color: '#4CAF50', lineWidth: 3, lineStyle: 0, visible: true },
        lowerLine: { color: '#F44336', lineWidth: 3, lineStyle: 0, visible: true },
        fill: 'rgba(76, 175, 80, 0.1)',
        fillVisible: true,
        gradientStartColor: '#4CAF50',
        gradientEndColor: '#F44336',
        normalizeGradients: true,
        priceScaleId: 'right',
        visible: true,
      });
      const paneViews = gradientRibbon.paneViews();

      expect(paneViews[0]).toBeDefined(); // Should fall back to default for negative values
    });
  });

  describe('Cleanup', () => {
    it('should remove both series on cleanup', () => {
      const gradientRibbon = new GradientRibbonSeries(mockChart as any);

      gradientRibbon.remove();

      expect(mockChart.removeSeries).toHaveBeenCalledTimes(2);
    });
  });

  describe('Factory Functions', () => {
    it('should create gradient ribbon series via factory function', () => {
      const options: any = {
        upperLine: { color: '#FF0000', lineWidth: 3, lineStyle: 0, visible: true },
        lowerLine: { color: '#0000FF', lineWidth: 3, lineStyle: 0, visible: true },
        gradientStartColor: '#FF0000',
        gradientEndColor: '#0000FF',
      };

      const gradientRibbon = createGradientRibbonSeries(mockChart as any, options);

      expect(gradientRibbon).toBeInstanceOf(GradientRibbonSeries);
      expect(gradientRibbon.getOptions().upperLine?.color).toBe('#FF0000');
      expect(gradientRibbon.getOptions().gradientStartColor).toBe('#FF0000');
    });
  });

  describe('Canvas Rendering Integration', () => {
    it('should have proper pane views for gradient fill rendering', () => {
      const gradientRibbon = new GradientRibbonSeries(mockChart as any);
      const paneViews = gradientRibbon.paneViews();

      expect(paneViews).toHaveLength(1);
      expect(paneViews[0]).toBeDefined();
    });

    it('should update all views when data changes', () => {
      const gradientRibbon = new GradientRibbonSeries(mockChart as any);
      const spy = vi.spyOn(gradientRibbon, 'updateAllViews');

      gradientRibbon.setData([{ time: '2023-01-01', value: 100, upper: 110, lower: 90 }]);

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('Performance with Gradient Processing', () => {
    it('should handle large datasets efficiently with gradient calculation', () => {
      const gradientRibbon = new GradientRibbonSeries(mockChart as any);
      const largeData: GradientRibbonData[] = Array.from({ length: 5000 }, (_, i) => {
        const upper = 110 + Math.random() * 20;
        const lower = 90 + Math.random() * 20;
        return {
          time: `2023-01-${(i % 30) + 1}`,
          value: (upper + lower) / 2,
          upper: upper,
          lower: lower,
        };
      });

      const start = performance.now();
      gradientRibbon.setData(largeData);
      const duration = performance.now() - start;

      // Should complete within reasonable time (1 second for 5k points with gradient calculation)
      expect(duration).toBeLessThan(1000);
      expect(mockSeries.setData).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid gradient ribbon data gracefully', () => {
      const gradientRibbon = new GradientRibbonSeries(mockChart as any);

      expect(() => {
        gradientRibbon.setData([]);
      }).not.toThrow();

      expect(() => {
        gradientRibbon.update({ time: '2023-01-01', value: 90, upper: NaN, lower: 90 });
      }).not.toThrow();
    });

    it('should handle malformed gradient ribbon data', () => {
      const gradientRibbon = new GradientRibbonSeries(mockChart as any);

      expect(() => {
        gradientRibbon.update({ time: '2023-01-01', value: 100, upper: 90, lower: 110 }); // Inverted order
      }).not.toThrow();
    });

    it('should handle invalid gradient colors gracefully', () => {
      expect(() => {
        new GradientRibbonSeries(mockChart as any, {
          gradientStartColor: 'invalid-color',
          gradientEndColor: '#FF0000',
          upperLine: { color: '#4CAF50', lineWidth: 3, lineStyle: 0, visible: true },
          lowerLine: { color: '#F44336', lineWidth: 3, lineStyle: 0, visible: true },
          fill: 'rgba(76, 175, 80, 0.1)',
          fillVisible: true,
          normalizeGradients: true,
          priceScaleId: 'right',
          visible: true,
          zIndex: 100,
        });
      }).not.toThrow();
    });
  });
});
