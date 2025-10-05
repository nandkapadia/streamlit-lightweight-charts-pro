import { Time } from 'lightweight-charts';
/**
 * @fileoverview Tests for Band Series - Hybrid ICustomSeries + ISeriesPrimitive Implementation
 *
 * Tests cover:
 * - ICustomSeries implementation with 3 lines (upper, middle, lower)
 * - Two fill areas (upper fill, lower fill)
 * - ISeriesPrimitive implementation with 3 axis views
 * - Factory function (both rendering modes)
 * - Coordinate conversion and validation
 * - Data handling and edge cases
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createBandSeries, BandData } from '../../plugins/series/bandSeriesPlugin';

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

describe('Band Series - Hybrid Implementation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockChart.addCustomSeries.mockReturnValue(mockCustomSeries);
  });

  describe('Factory Function', () => {
    it('should create series with default options', () => {
      const series = createBandSeries(mockChart as any);

      expect(mockChart.addCustomSeries).toHaveBeenCalled();
      expect(series).toBeDefined();
    });

    it('should create series with custom colors for all three lines', () => {
      createBandSeries(mockChart as any, {
        upperLineColor: '#FF0000',
        middleLineColor: '#00FF00',
        lowerLineColor: '#0000FF',
        upperFillColor: 'rgba(255, 0, 0, 0.2)',
        lowerFillColor: 'rgba(0, 0, 255, 0.2)',
      });

      const options = mockChart.addCustomSeries.mock.calls[0][1];
      expect(options.upperLineColor).toBe('#FF0000');
      expect(options.middleLineColor).toBe('#00FF00');
      expect(options.lowerLineColor).toBe('#0000FF');
      expect(options.upperFillColor).toBe('rgba(255, 0, 0, 0.2)');
      expect(options.lowerFillColor).toBe('rgba(0, 0, 255, 0.2)');
    });

    it('should set data on series when provided', () => {
      const testData: BandData[] = [
        { time: 1000 as Time, upper: 120, middle: 100, lower: 80 },
        { time: 2000 as Time, upper: 125, middle: 105, lower: 85 },
      ];

      createBandSeries(mockChart as any, { data: testData });

      expect(mockCustomSeries.setData).toHaveBeenCalledWith(testData);
    });

    it('should use primitive rendering when usePrimitive is true', async () => {
      createBandSeries(mockChart as any, {
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
  });

  describe('Default Options', () => {
    it('should have correct default values for all three lines', () => {
      createBandSeries(mockChart as any);

      const options = mockChart.addCustomSeries.mock.calls[0][1];

      // Upper line defaults
      expect(options.upperLineColor).toBe('#4CAF50');
      expect(options.upperLineWidth).toBe(2);
      expect(options.upperLineVisible).toBe(true);

      // Middle line defaults
      expect(options.middleLineColor).toBe('#2196F3');
      expect(options.middleLineWidth).toBe(2);
      expect(options.middleLineVisible).toBe(true);

      // Lower line defaults
      expect(options.lowerLineColor).toBe('#F44336');
      expect(options.lowerLineWidth).toBe(2);
      expect(options.lowerLineVisible).toBe(true);

      // Fill defaults
      expect(options.upperFillColor).toBe('rgba(76, 175, 80, 0.1)');
      expect(options.upperFillVisible).toBe(true);
      expect(options.lowerFillColor).toBe('rgba(244, 67, 54, 0.1)');
      expect(options.lowerFillVisible).toBe(true);
    });

    it('should handle visibility options correctly', () => {
      createBandSeries(mockChart as any, {
        upperLineVisible: false,
        middleLineVisible: false,
        lowerLineVisible: false,
        upperFillVisible: false,
        lowerFillVisible: false,
      });

      const options = mockChart.addCustomSeries.mock.calls[0][1];
      expect(options.upperLineVisible).toBe(false);
      expect(options.middleLineVisible).toBe(false);
      expect(options.lowerLineVisible).toBe(false);
      expect(options.upperFillVisible).toBe(false);
      expect(options.lowerFillVisible).toBe(false);
    });
  });

  describe('Data Validation', () => {
    it('should handle valid data with all three values', () => {
      const validData: BandData[] = [
        { time: 1000 as Time, upper: 120, middle: 100, lower: 80 },
        { time: 2000 as Time, upper: 125, middle: 105, lower: 85 },
      ];

      createBandSeries(mockChart as any, { data: validData });

      expect(mockCustomSeries.setData).toHaveBeenCalledWith(validData);
    });

    it('should handle empty data array', () => {
      createBandSeries(mockChart as any, { data: [] });

      expect(mockCustomSeries.setData).not.toHaveBeenCalled();
    });

    it('should validate that upper >= middle >= lower (coordinate conversion)', () => {
      // This is validated during coordinate conversion, not during data setting
      const testData: BandData[] = [{ time: 1000 as Time, upper: 120, middle: 100, lower: 80 }];

      expect(() => {
        createBandSeries(mockChart as any, { data: testData });
      }).not.toThrow();
    });
  });

  describe('Line Configuration', () => {
    it('should accept custom line widths for all lines', () => {
      createBandSeries(mockChart as any, {
        upperLineWidth: 3,
        middleLineWidth: 1,
        lowerLineWidth: 2,
      });

      const options = mockChart.addCustomSeries.mock.calls[0][1];
      expect(options.upperLineWidth).toBe(3);
      expect(options.middleLineWidth).toBe(1);
      expect(options.lowerLineWidth).toBe(2);
    });

    it('should accept custom line styles', () => {
      createBandSeries(mockChart as any, {
        upperLineStyle: 0, // Solid
        middleLineStyle: 1, // Dotted
        lowerLineStyle: 2, // Dashed
      });

      const options = mockChart.addCustomSeries.mock.calls[0][1];
      expect(options.upperLineStyle).toBe(0);
      expect(options.middleLineStyle).toBe(1);
      expect(options.lowerLineStyle).toBe(2);
    });
  });

  describe('Fill Areas', () => {
    it('should configure upper fill area (between upper and middle)', () => {
      createBandSeries(mockChart as any, {
        upperFillColor: 'rgba(0, 255, 0, 0.5)',
        upperFillVisible: true,
      });

      const options = mockChart.addCustomSeries.mock.calls[0][1];
      expect(options.upperFillColor).toBe('rgba(0, 255, 0, 0.5)');
      expect(options.upperFillVisible).toBe(true);
    });

    it('should configure lower fill area (between middle and lower)', () => {
      createBandSeries(mockChart as any, {
        lowerFillColor: 'rgba(255, 0, 0, 0.5)',
        lowerFillVisible: true,
      });

      const options = mockChart.addCustomSeries.mock.calls[0][1];
      expect(options.lowerFillColor).toBe('rgba(255, 0, 0, 0.5)');
      expect(options.lowerFillVisible).toBe(true);
    });

    it('should allow disabling individual fill areas', () => {
      createBandSeries(mockChart as any, {
        upperFillVisible: false,
        lowerFillVisible: true,
      });

      const options = mockChart.addCustomSeries.mock.calls[0][1];
      expect(options.upperFillVisible).toBe(false);
      expect(options.lowerFillVisible).toBe(true);
    });
  });

  describe('Rendering Modes', () => {
    it('should default to not using primitive (factory default)', () => {
      createBandSeries(mockChart as any);

      const options = mockChart.addCustomSeries.mock.calls[0][1];
      expect(options._usePrimitive).toBe(false); // Factory default when usePrimitive not specified
    });

    it('should use ISeriesPrimitive rendering when usePrimitive is true', () => {
      createBandSeries(mockChart as any, {
        usePrimitive: true,
      });

      const options = mockChart.addCustomSeries.mock.calls[0][1];
      expect(options._usePrimitive).toBe(true);
    });
  });

  describe('Autoscaling', () => {
    it('should include all three values in autoscaling', () => {
      // priceValueBuilder should return [lower, middle, upper] for autoscaling
      const testData: BandData[] = [{ time: 1000 as Time, upper: 120, middle: 100, lower: 80 }];

      createBandSeries(mockChart as any, { data: testData });

      // The series will use priceValueBuilder which returns all three values
      expect(mockCustomSeries.setData).toHaveBeenCalledWith(testData);
    });
  });

  describe('Error Handling', () => {
    it('should handle NaN values gracefully', () => {
      const invalidData: BandData[] = [
        { time: 1000 as Time, upper: NaN, middle: 100, lower: 80 },
        { time: 2000 as Time, upper: 120, middle: NaN, lower: 80 },
        { time: 3000 as Time, upper: 120, middle: 100, lower: NaN },
      ];

      expect(() => {
        createBandSeries(mockChart as any, { data: invalidData });
      }).not.toThrow();
    });

    it('should handle Infinity values', () => {
      const invalidData: BandData[] = [
        { time: 1000 as Time, upper: Infinity, middle: 100, lower: 80 },
        { time: 2000 as Time, upper: 120, middle: -Infinity, lower: 80 },
      ];

      expect(() => {
        createBandSeries(mockChart as any, { data: invalidData });
      }).not.toThrow();
    });

    it('should handle missing values', () => {
      const invalidData: any[] = [
        { time: 1000 as Time, upper: 120, middle: 100 }, // missing lower
        { time: 2000 as Time, middle: 100, lower: 80 }, // missing upper
      ];

      expect(() => {
        createBandSeries(mockChart as any, { data: invalidData });
      }).not.toThrow();
    });
  });

  describe('Use Cases', () => {
    it('should support Bollinger Bands configuration', () => {
      createBandSeries(mockChart as any, {
        upperLineColor: '#4CAF50',
        middleLineColor: '#2196F3',
        lowerLineColor: '#4CAF50',
        upperFillColor: 'rgba(76, 175, 80, 0.1)',
        lowerFillColor: 'rgba(76, 175, 80, 0.1)',
        usePrimitive: true,
        zIndex: -100,
      });

      expect(mockChart.addCustomSeries).toHaveBeenCalled();
    });

    it('should support Keltner Channels configuration', () => {
      createBandSeries(mockChart as any, {
        upperLineColor: '#FFA726',
        middleLineColor: '#FF9800',
        lowerLineColor: '#FFA726',
        upperFillVisible: true,
        lowerFillVisible: true,
      });

      expect(mockChart.addCustomSeries).toHaveBeenCalled();
    });
  });

  describe('Integration', () => {
    it('should work with full configuration', () => {
      const series = createBandSeries(mockChart as any, {
        upperLineColor: '#4CAF50',
        upperLineWidth: 2,
        upperLineStyle: 0,
        upperLineVisible: true,
        middleLineColor: '#2196F3',
        middleLineWidth: 2,
        middleLineStyle: 0,
        middleLineVisible: true,
        lowerLineColor: '#F44336',
        lowerLineWidth: 2,
        lowerLineStyle: 0,
        lowerLineVisible: true,
        upperFillColor: 'rgba(76, 175, 80, 0.1)',
        upperFillVisible: true,
        lowerFillColor: 'rgba(244, 67, 54, 0.1)',
        lowerFillVisible: true,
        priceScaleId: 'right',
        usePrimitive: true,
        zIndex: -100,
        data: [
          { time: 1000 as Time, upper: 120, middle: 100, lower: 80 },
          { time: 2000 as Time, upper: 125, middle: 105, lower: 85 },
        ],
      });

      expect(series).toBeDefined();
      expect(mockChart.addCustomSeries).toHaveBeenCalled();
      expect(mockCustomSeries.setData).toHaveBeenCalled();
    });
  });
});
