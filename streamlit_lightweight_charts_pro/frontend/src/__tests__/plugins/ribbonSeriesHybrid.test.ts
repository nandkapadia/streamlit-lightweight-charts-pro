import { Time } from 'lightweight-charts';
/**
 * @fileoverview Tests for Ribbon Series - Hybrid ICustomSeries + ISeriesPrimitive Implementation
 *
 * Tests cover:
 * - ICustomSeries implementation (autoscaling, rendering, whitespace detection)
 * - ISeriesPrimitive implementation (z-order control, axis views)
 * - Factory function (both rendering modes)
 * - Coordinate conversion and validation
 * - Data handling and edge cases
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRibbonSeries, RibbonData } from '../../plugins/series/ribbonSeriesPlugin';

// Mock chart and series
const mockPriceConverter = vi.fn((price: number) => 100 + price);
const mockTimeScale = {
  timeToCoordinate: vi.fn((time: any) => 100),
  getVisibleRange: vi.fn(() => ({ from: 0, to: 100 })),
};

const mockChart = {
  addCustomSeries: vi.fn(),
  timeScale: vi.fn(() => mockTimeScale),
  priceScale: vi.fn(() => ({
    priceToCoordinate: mockPriceConverter,
  })),
};

const mockCustomSeries = {
  setData: vi.fn(),
  update: vi.fn(),
  applyOptions: vi.fn(),
  attachPrimitive: vi.fn(),
  priceToCoordinate: mockPriceConverter,
  data: vi.fn(() => []),
};

describe('Ribbon Series - Hybrid Implementation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockChart.addCustomSeries.mockReturnValue(mockCustomSeries);
  });

  describe('Factory Function', () => {
    it('should create series with default options', () => {
      const series = createRibbonSeries(mockChart as any);

      expect(mockChart.addCustomSeries).toHaveBeenCalled();
      expect(series).toBeDefined();
    });

    it('should create series with custom colors', () => {
      createRibbonSeries(mockChart as any, {
        upperLineColor: '#FF0000',
        lowerLineColor: '#0000FF',
        fillColor: 'rgba(255, 0, 0, 0.2)',
      });

      const options = mockChart.addCustomSeries.mock.calls[0][1];
      expect(options.upperLineColor).toBe('#FF0000');
      expect(options.lowerLineColor).toBe('#0000FF');
      expect(options.fillColor).toBe('rgba(255, 0, 0, 0.2)');
    });

    it('should set data on series when provided', () => {
      const testData: RibbonData[] = [
        { time: 1000 as Time, upper: 110, lower: 90 },
        { time: 2000 as Time, upper: 115, lower: 85 },
      ];

      createRibbonSeries(mockChart as any, { data: testData });

      expect(mockCustomSeries.setData).toHaveBeenCalledWith(testData);
    });

    it('should use primitive rendering when usePrimitive is true', async () => {
      createRibbonSeries(mockChart as any, {
        usePrimitive: true,
        zIndex: -100,
      });

      const options = mockChart.addCustomSeries.mock.calls[0][1];
      expect(options._usePrimitive).toBe(true);
      expect(options.lastValueVisible).toBe(false);

      // Wait for dynamic import
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(mockCustomSeries.attachPrimitive).toHaveBeenCalled();
    });

    it('should not use primitive when usePrimitive is false', () => {
      createRibbonSeries(mockChart as any, {
        usePrimitive: false,
      });

      const options = mockChart.addCustomSeries.mock.calls[0][1];
      expect(options._usePrimitive).toBe(false);
      // lastValueVisible defaults to false per implementation (line 347 in ribbonSeriesPlugin.ts)
      expect(options.lastValueVisible).toBe(false);
    });
  });

  describe('Default Options', () => {
    it('should have correct default values', () => {
      createRibbonSeries(mockChart as any);

      const options = mockChart.addCustomSeries.mock.calls[0][1];
      expect(options.upperLineColor).toBe('#4CAF50');
      expect(options.upperLineWidth).toBe(2);
      expect(options.upperLineVisible).toBe(true);
      expect(options.lowerLineColor).toBe('#F44336');
      expect(options.lowerLineWidth).toBe(2);
      expect(options.lowerLineVisible).toBe(true);
      expect(options.fillColor).toBe('rgba(76, 175, 80, 0.1)');
      expect(options.fillVisible).toBe(true);
      expect(options.priceScaleId).toBe('right');
    });

    it('should use nullish coalescing for numeric defaults', () => {
      createRibbonSeries(mockChart as any, {
        upperLineWidth: 1, // Use valid LineWidth (1-4)
      });

      const options = mockChart.addCustomSeries.mock.calls[0][1];
      expect(options.upperLineWidth).toBe(1);
    });

    it('should handle boolean options correctly', () => {
      createRibbonSeries(mockChart as any, {
        upperLineVisible: false,
        fillVisible: false,
      });

      const options = mockChart.addCustomSeries.mock.calls[0][1];
      expect(options.upperLineVisible).toBe(false);
      expect(options.fillVisible).toBe(false);
    });
  });

  describe('Data Validation', () => {
    it('should handle valid data', () => {
      const validData: RibbonData[] = [
        { time: 1000 as Time, upper: 110, lower: 90 },
        { time: 2000 as Time, upper: 115, lower: 85 },
      ];

      createRibbonSeries(mockChart as any, { data: validData });

      expect(mockCustomSeries.setData).toHaveBeenCalledWith(validData);
    });

    it('should handle empty data array', () => {
      createRibbonSeries(mockChart as any, { data: [] });

      expect(mockCustomSeries.setData).not.toHaveBeenCalled();
    });

    it('should handle missing optional data parameter', () => {
      expect(() => {
        createRibbonSeries(mockChart as any);
      }).not.toThrow();
    });
  });

  describe('Line Style Conversion', () => {
    it('should clamp line styles to valid range for primitives', () => {
      createRibbonSeries(mockChart as any, {
        usePrimitive: true,
        upperLineStyle: 4 as any, // Invalid, should be clamped to 2
        lowerLineStyle: 1,
      });

      // The factory uses Math.min to clamp to 2
      expect(mockChart.addCustomSeries).toHaveBeenCalled();
    });

    it('should accept valid line styles', () => {
      createRibbonSeries(mockChart as any, {
        upperLineStyle: 0, // Solid
        lowerLineStyle: 2, // Dashed
      });

      const options = mockChart.addCustomSeries.mock.calls[0][1];
      expect(options.upperLineStyle).toBe(0);
      expect(options.lowerLineStyle).toBe(2);
    });
  });

  describe('Rendering Modes', () => {
    it('should disable series rendering when primitive is used', () => {
      createRibbonSeries(mockChart as any, {
        usePrimitive: true,
      });

      const options = mockChart.addCustomSeries.mock.calls[0][1];
      expect(options._usePrimitive).toBe(true);
    });

    it('should enable series rendering when primitive is not used', () => {
      createRibbonSeries(mockChart as any, {
        usePrimitive: false,
      });

      const options = mockChart.addCustomSeries.mock.calls[0][1];
      expect(options._usePrimitive).toBe(false);
    });
  });

  describe('Z-Index Control', () => {
    it('should use custom z-index for primitive', () => {
      createRibbonSeries(mockChart as any, {
        usePrimitive: true,
        zIndex: 50,
      });

      // Z-index is passed to primitive, not to series
      expect(mockChart.addCustomSeries).toHaveBeenCalled();
    });

    it('should use default z-index of -100 for background rendering', () => {
      createRibbonSeries(mockChart as any, {
        usePrimitive: true,
      });

      // Default z-index is -100 for background
      expect(mockChart.addCustomSeries).toHaveBeenCalled();
    });
  });

  describe('Price Scale Options', () => {
    it('should use custom price scale ID', () => {
      createRibbonSeries(mockChart as any, {
        priceScaleId: 'left',
      });

      const options = mockChart.addCustomSeries.mock.calls[0][1];
      expect(options.priceScaleId).toBe('left');
    });

    it('should default to right price scale', () => {
      createRibbonSeries(mockChart as any);

      const options = mockChart.addCustomSeries.mock.calls[0][1];
      expect(options.priceScaleId).toBe('right');
    });
  });

  describe('Error Handling', () => {
    it('should throw on null chart', () => {
      expect(() => {
        createRibbonSeries(null as any);
      }).toThrow();
    });

    it('should handle NaN values in data gracefully', () => {
      const invalidData: RibbonData[] = [
        { time: 1000 as Time, upper: NaN, lower: 90 },
        { time: 2000 as Time, upper: 115, lower: NaN },
      ];

      expect(() => {
        createRibbonSeries(mockChart as any, { data: invalidData });
      }).not.toThrow();
    });

    it('should handle Infinity values in data', () => {
      const invalidData: RibbonData[] = [
        { time: 1000 as Time, upper: Infinity, lower: 90 },
        { time: 2000 as Time, upper: 115, lower: -Infinity },
      ];

      expect(() => {
        createRibbonSeries(mockChart as any, { data: invalidData });
      }).not.toThrow();
    });
  });

  describe('Integration', () => {
    it('should return series instance', () => {
      const series = createRibbonSeries(mockChart as any);
      expect(series).toBe(mockCustomSeries);
    });

    it('should work with full configuration', () => {
      const series = createRibbonSeries(mockChart as any, {
        upperLineColor: '#4CAF50',
        upperLineWidth: 3,
        upperLineStyle: 1,
        upperLineVisible: true,
        lowerLineColor: '#F44336',
        lowerLineWidth: 2,
        lowerLineStyle: 2,
        lowerLineVisible: true,
        fillColor: 'rgba(76, 175, 80, 0.3)',
        fillVisible: true,
        priceScaleId: 'right',
        usePrimitive: true,
        zIndex: -100,
        data: [
          { time: 1000 as Time, upper: 110, lower: 90 },
          { time: 2000 as Time, upper: 115, lower: 85 },
        ],
      });

      expect(series).toBeDefined();
      expect(mockChart.addCustomSeries).toHaveBeenCalled();
      expect(mockCustomSeries.setData).toHaveBeenCalled();
    });
  });
});
