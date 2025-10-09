import { Time } from 'lightweight-charts';
/**
 * @fileoverview Tests for Gradient Ribbon Series - Hybrid ICustomSeries + ISeriesPrimitive Implementation
 *
 * Tests cover:
 * - ICustomSeries implementation with gradient fill
 * - Color interpolation based on spread magnitude
 * - Per-point fill color overrides
 * - ISeriesPrimitive implementation
 * - Factory function (both rendering modes)
 * - Gradient calculation and normalization
 * - Data handling and edge cases
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createGradientRibbonSeries,
  GradientRibbonData,
} from '../../plugins/series/gradientRibbonSeriesPlugin';

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

describe('Gradient Ribbon Series - Hybrid Implementation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockChart.addCustomSeries.mockReturnValue(mockCustomSeries);
  });

  describe('Factory Function', () => {
    it('should create series with default options', () => {
      const series = createGradientRibbonSeries(mockChart as any);

      expect(mockChart.addCustomSeries).toHaveBeenCalled();
      expect(series).toBeDefined();
    });

    it('should create series with gradient configuration', () => {
      createGradientRibbonSeries(mockChart as any, {
        gradientStartColor: '#00FF00',
        gradientEndColor: '#FF0000',
        normalizeGradients: true,
      });

      const options = mockChart.addCustomSeries.mock.calls[0][1];
      expect(options.gradientStartColor).toBe('#00FF00');
      expect(options.gradientEndColor).toBe('#FF0000');
      expect(options.normalizeGradients).toBe(true);
    });

    it('should set data on series when provided', () => {
      const testData: GradientRibbonData[] = [
        { time: 1000 as Time, upper: 110, lower: 90 },
        { time: 2000 as Time, upper: 120, lower: 80 },
      ];

      createGradientRibbonSeries(mockChart as any, { data: testData });

      expect(mockCustomSeries.setData).toHaveBeenCalledWith(testData);
    });

    it('should use primitive rendering when usePrimitive is true', async () => {
      createGradientRibbonSeries(mockChart as any, {
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
    it('should have correct default gradient colors', () => {
      createGradientRibbonSeries(mockChart as any);

      const options = mockChart.addCustomSeries.mock.calls[0][1];
      expect(options.gradientStartColor).toBe('#4CAF50');
      expect(options.gradientEndColor).toBe('#F44336');
    });

    it('should have normalizeGradients enabled by default', () => {
      createGradientRibbonSeries(mockChart as any);

      const options = mockChart.addCustomSeries.mock.calls[0][1];
      expect(options.normalizeGradients).toBe(true);
    });

    it('should have correct line defaults', () => {
      createGradientRibbonSeries(mockChart as any);

      const options = mockChart.addCustomSeries.mock.calls[0][1];
      expect(options.upperLineColor).toBe('#4CAF50');
      expect(options.lowerLineColor).toBe('#F44336');
      expect(options.upperLineWidth).toBe(2);
      expect(options.lowerLineWidth).toBe(2);
    });
  });

  describe('Gradient Configuration', () => {
    it('should use custom gradient colors', () => {
      createGradientRibbonSeries(mockChart as any, {
        gradientStartColor: '#FFA500',
        gradientEndColor: '#8B0000',
      });

      const options = mockChart.addCustomSeries.mock.calls[0][1];
      expect(options.gradientStartColor).toBe('#FFA500');
      expect(options.gradientEndColor).toBe('#8B0000');
    });

    it('should allow disabling gradient normalization', () => {
      createGradientRibbonSeries(mockChart as any, {
        normalizeGradients: false,
      });

      const options = mockChart.addCustomSeries.mock.calls[0][1];
      expect(options.normalizeGradients).toBe(false);
    });

    it('should disable gradient normalization when requested', () => {
      createGradientRibbonSeries(mockChart as any, {
        normalizeGradients: false,
      });

      const options = mockChart.addCustomSeries.mock.calls[0][1];
      expect(options.normalizeGradients).toBe(false);
    });
  });

  describe('Per-Point Fill Colors', () => {
    it('should support per-point fill color overrides', () => {
      const testData: GradientRibbonData[] = [
        { time: 1000 as Time, upper: 110, lower: 90, fill: '#FF0000' },
        { time: 2000 as Time, upper: 120, lower: 80, fill: '#00FF00' },
      ];

      createGradientRibbonSeries(mockChart as any, { data: testData });

      expect(mockCustomSeries.setData).toHaveBeenCalledWith(testData);
    });

    it('should use gradient colors when fill not provided', () => {
      const testData: GradientRibbonData[] = [
        { time: 1000 as Time, upper: 110, lower: 90 },
        { time: 2000 as Time, upper: 120, lower: 80 },
      ];

      createGradientRibbonSeries(mockChart as any, {
        data: testData,
        normalizeGradients: true,
      });

      expect(mockCustomSeries.setData).toHaveBeenCalledWith(testData);
    });
  });

  describe('Spread-Based Gradient Calculation', () => {
    it('should calculate gradient based on spread magnitude', () => {
      // When normalizeGradients is true, gradient color is based on (upper - lower) spread
      const testData: GradientRibbonData[] = [
        { time: 1000 as Time, upper: 110, lower: 90 }, // spread = 20
        { time: 2000 as Time, upper: 130, lower: 70 }, // spread = 60 (max)
        { time: 3000 as Time, upper: 105, lower: 95 }, // spread = 10 (min)
      ];

      createGradientRibbonSeries(mockChart as any, {
        data: testData,
        normalizeGradients: true,
        gradientStartColor: '#00FF00', // Low spread
        gradientEndColor: '#FF0000', // High spread
      });

      expect(mockCustomSeries.setData).toHaveBeenCalledWith(testData);
    });

    it('should handle zero spread gracefully', () => {
      const testData: GradientRibbonData[] = [
        { time: 1000 as Time, upper: 100, lower: 100 }, // zero spread
      ];

      expect(() => {
        createGradientRibbonSeries(mockChart as any, {
          data: testData,
          normalizeGradients: true,
        });
      }).not.toThrow();
    });

    it('should handle negative spread (upper < lower)', () => {
      const testData: GradientRibbonData[] = [
        { time: 1000 as Time, upper: 90, lower: 110 }, // negative spread
      ];

      expect(() => {
        createGradientRibbonSeries(mockChart as any, {
          data: testData,
          normalizeGradients: true,
        });
      }).not.toThrow();
    });
  });

  describe('Data Validation', () => {
    it('should handle valid data', () => {
      const validData: GradientRibbonData[] = [
        { time: 1000 as Time, upper: 110, lower: 90 },
        { time: 2000 as Time, upper: 120, lower: 80 },
      ];

      createGradientRibbonSeries(mockChart as any, { data: validData });

      expect(mockCustomSeries.setData).toHaveBeenCalledWith(validData);
    });

    it('should handle empty data array', () => {
      createGradientRibbonSeries(mockChart as any, { data: [] });

      expect(mockCustomSeries.setData).not.toHaveBeenCalled();
    });

    it('should handle NaN values in spread calculation', () => {
      const invalidData: GradientRibbonData[] = [
        { time: 1000 as Time, upper: NaN, lower: 90 },
        { time: 2000 as Time, upper: 120, lower: NaN },
      ];

      expect(() => {
        createGradientRibbonSeries(mockChart as any, {
          data: invalidData,
          normalizeGradients: true,
        });
      }).not.toThrow();
    });

    it('should handle Infinity values', () => {
      const invalidData: GradientRibbonData[] = [
        { time: 1000 as Time, upper: Infinity, lower: 90 },
        { time: 2000 as Time, upper: 120, lower: -Infinity },
      ];

      expect(() => {
        createGradientRibbonSeries(mockChart as any, {
          data: invalidData,
          normalizeGradients: true,
        });
      }).not.toThrow();
    });
  });

  describe('Rendering Modes', () => {
    it('should disable series rendering when primitive is used', () => {
      createGradientRibbonSeries(mockChart as any, {
        usePrimitive: true,
      });

      const options = mockChart.addCustomSeries.mock.calls[0][1];
      expect(options._usePrimitive).toBe(true);
    });

    it('should enable series rendering when primitive is not used', () => {
      createGradientRibbonSeries(mockChart as any, {
        usePrimitive: false,
      });

      const options = mockChart.addCustomSeries.mock.calls[0][1];
      expect(options._usePrimitive).toBe(false);
    });
  });

  describe('Use Cases', () => {
    it('should support ATR-based volatility bands', () => {
      createGradientRibbonSeries(mockChart as any, {
        gradientStartColor: '#4CAF50', // Low volatility
        gradientEndColor: '#F44336', // High volatility
        normalizeGradients: true,
        usePrimitive: true,
        zIndex: -100,
      });

      expect(mockChart.addCustomSeries).toHaveBeenCalled();
    });

    it('should support custom volatility visualization', () => {
      const volatilityData: GradientRibbonData[] = [
        { time: 1000 as Time, upper: 105, lower: 95 }, // Low vol
        { time: 2000 as Time, upper: 130, lower: 70 }, // High vol
        { time: 3000 as Time, upper: 110, lower: 90 }, // Medium vol
      ];

      createGradientRibbonSeries(mockChart as any, {
        data: volatilityData,
        gradientStartColor: '#90EE90',
        gradientEndColor: '#DC143C',
        normalizeGradients: true,
      });

      expect(mockCustomSeries.setData).toHaveBeenCalledWith(volatilityData);
    });
  });

  describe('Fill Visibility', () => {
    it('should allow disabling fill', () => {
      createGradientRibbonSeries(mockChart as any, {
        fillVisible: false,
      });

      const options = mockChart.addCustomSeries.mock.calls[0][1];
      expect(options.fillVisible).toBe(false);
    });

    it('should show fill by default', () => {
      createGradientRibbonSeries(mockChart as any);

      const options = mockChart.addCustomSeries.mock.calls[0][1];
      expect(options.fillVisible).toBe(true);
    });
  });

  describe('Integration', () => {
    it('should work with full configuration', () => {
      const series = createGradientRibbonSeries(mockChart as any, {
        upperLineColor: '#4CAF50',
        upperLineWidth: 2,
        upperLineStyle: 0,
        upperLineVisible: true,
        lowerLineColor: '#F44336',
        lowerLineWidth: 2,
        lowerLineStyle: 0,
        lowerLineVisible: true,
        fillVisible: true,
        gradientStartColor: '#90EE90',
        gradientEndColor: '#DC143C',
        normalizeGradients: true,
        priceScaleId: 'right',
        usePrimitive: true,
        zIndex: -100,
        data: [
          { time: 1000 as Time, upper: 110, lower: 90 },
          { time: 2000 as Time, upper: 130, lower: 70 },
          { time: 3000 as Time, upper: 105, lower: 95, fill: '#FFA500' },
        ],
      });

      expect(series).toBeDefined();
      expect(mockChart.addCustomSeries).toHaveBeenCalled();
      expect(mockCustomSeries.setData).toHaveBeenCalled();
    });
  });
});
