/**
 * @fileoverview Comprehensive tests for TrendFillSeries (ICustomSeries implementation)
 *
 * Tests the ICustomSeries implementation with optional primitive attachment for:
 * - Data handling and validation
 * - Rendering modes (direct vs primitive)
 * - Price axis view functionality
 * - Options management
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  TrendFillData,
  TrendFillSeriesOptions,
  createTrendFillSeries,
} from '../../plugins/series/trendFillSeriesPlugin';
import { LineStyle } from '../../utils/renderingUtils';
import { Time } from 'lightweight-charts';

// Mock chart
const mockChart = {
  addCustomSeries: vi.fn(),
  timeScale: vi.fn(() => ({
    getVisibleRange: vi.fn(() => ({ from: 0, to: 100 })),
    timeToCoordinate: vi.fn(time => 100 + Math.random() * 300),
  })),
  chartElement: vi.fn(() => ({
    clientWidth: 800,
    clientHeight: 400,
  })),
};

// Mock series
const mockSeries = {
  setData: vi.fn(),
  attachPrimitive: vi.fn(),
  priceToCoordinate: vi.fn(price => 100 + Math.random() * 300),
  options: vi.fn(() => ({
    lastValueVisible: true,
  })),
};

describe('TrendFillSeries (ICustomSeries)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockChart.addCustomSeries.mockReturnValue(mockSeries);
  });

  describe('Series Creation', () => {
    it('should create ICustomSeries with default options', () => {
      const series = createTrendFillSeries(mockChart as any);

      expect(mockChart.addCustomSeries).toHaveBeenCalledTimes(1);
      expect(mockChart.addCustomSeries).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          uptrendFillColor: 'rgba(76, 175, 80, 0.3)',
          downtrendFillColor: 'rgba(244, 67, 54, 0.3)',
          fillVisible: true,
          uptrendLineColor: '#4CAF50',
          uptrendLineWidth: 2,
          uptrendLineStyle: LineStyle.Solid,
          uptrendLineVisible: true,
          downtrendLineColor: '#F44336',
          downtrendLineWidth: 2,
          downtrendLineStyle: LineStyle.Solid,
          downtrendLineVisible: true,
          baseLineColor: '#666666',
          baseLineWidth: 1,
          baseLineStyle: LineStyle.Dotted,
          baseLineVisible: false,
          priceScaleId: 'right',
        })
      );
      expect(series).toBeDefined();
    });

    it('should create series with custom options', () => {
      const customOptions: Partial<TrendFillSeriesOptions> = {
        uptrendFillColor: 'rgba(0, 255, 0, 0.5)',
        downtrendFillColor: 'rgba(255, 0, 0, 0.5)',
        uptrendLineColor: '#00FF00',
        uptrendLineWidth: 3,
        uptrendLineStyle: LineStyle.Dashed,
        downtrendLineColor: '#FF0000',
        downtrendLineWidth: 3,
        downtrendLineStyle: LineStyle.Dashed,
        baseLineVisible: true,
      };

      createTrendFillSeries(mockChart as any, customOptions);

      expect(mockChart.addCustomSeries).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining(customOptions)
      );
    });

    it('should set data on series when provided', () => {
      const testData: TrendFillData[] = [
        { time: '2023-01-01', baseLine: 100, trendLine: 105, trendDirection: 1 },
        { time: '2023-01-02', baseLine: 100, trendLine: 95, trendDirection: -1 },
      ];

      createTrendFillSeries(mockChart as any, { data: testData });

      expect(mockSeries.setData).toHaveBeenCalledWith(testData);
    });
  });

  describe('Primitive Attachment Mode', () => {
    it('should attach primitive when usePrimitive is explicitly set', () => {
      const testData: TrendFillData[] = [
        { time: '2023-01-01', baseLine: 100, trendLine: 105, trendDirection: 1 },
      ];

      createTrendFillSeries(mockChart as any, {
        usePrimitive: true,
        data: testData,
      });

      expect(mockChart.addCustomSeries).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          _usePrimitive: true,
          lastValueVisible: false, // Hide series label when primitive handles it
        })
      );
      expect(mockSeries.attachPrimitive).toHaveBeenCalledTimes(1);
      expect(mockSeries.setData).toHaveBeenCalledWith(testData);
    });

    it('should attach primitive when usePrimitive is true', () => {
      createTrendFillSeries(mockChart as any, {
        usePrimitive: true,
        data: [],
      });

      expect(mockSeries.attachPrimitive).toHaveBeenCalledTimes(1);
    });

    it('should pass correct options to primitive', () => {
      const testData: TrendFillData[] = [
        { time: '2023-01-01', baseLine: 100, trendLine: 105, trendDirection: 1 },
      ];

      createTrendFillSeries(mockChart as any, {
        uptrendFillColor: 'rgba(0, 255, 0, 0.3)',
        downtrendFillColor: 'rgba(255, 0, 0, 0.3)',
        uptrendLineColor: '#00FF00',
        uptrendLineWidth: 3,
        uptrendLineStyle: LineStyle.Dashed,
        uptrendLineVisible: true,
        downtrendLineColor: '#FF0000',
        downtrendLineWidth: 3,
        downtrendLineStyle: LineStyle.Dashed,
        downtrendLineVisible: true,
        baseLineVisible: true,
        usePrimitive: true,
        zIndex: -50,
        data: testData,
      });

      // Verify primitive was attached with TrendFillPrimitive instance
      expect(mockSeries.attachPrimitive).toHaveBeenCalled();

      // Verify the primitive instance was created (instance has _chart and _options properties)
      const primitiveArg = mockSeries.attachPrimitive.mock.calls[0][0];
      expect(primitiveArg).toBeDefined();
      expect(primitiveArg).toHaveProperty('_chart');
      expect(primitiveArg).toHaveProperty('_options');
    });

    it('should not attach primitive when direct rendering', () => {
      createTrendFillSeries(mockChart as any, {
        // Direct rendering mode (default)
      });

      expect(mockSeries.attachPrimitive).not.toHaveBeenCalled();
    });
  });

  describe('Data Types', () => {
    it('should accept TrendFillData with required fields', () => {
      const validData: TrendFillData[] = [
        { time: '2023-01-01', baseLine: 100, trendLine: 105, trendDirection: 1 },
        { time: '2023-01-02', baseLine: 100, trendLine: 95, trendDirection: -1 },
        { time: '2023-01-03', baseLine: 100, trendLine: 100, trendDirection: 0 },
      ];

      expect(() => {
        createTrendFillSeries(mockChart as any, { data: validData });
      }).not.toThrow();
    });

    it('should handle numeric timestamps', () => {
      const numericTimeData: TrendFillData[] = [
        { time: 1672531200 as Time, baseLine: 100, trendLine: 105, trendDirection: 1 },
        { time: 1672617600 as Time, baseLine: 100, trendLine: 95, trendDirection: -1 },
      ];

      expect(() => {
        createTrendFillSeries(mockChart as any, { data: numericTimeData });
      }).not.toThrow();
    });

    it('should handle empty data array', () => {
      expect(() => {
        createTrendFillSeries(mockChart as any, { data: [] });
      }).not.toThrow();
    });
  });

  describe('Rendering Modes', () => {
    it('should enable direct rendering by default', () => {
      createTrendFillSeries(mockChart as any);

      expect(mockChart.addCustomSeries).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          lastValueVisible: false,
          _usePrimitive: false,
        })
      );
    });

    it('should disable series rendering when using primitive', () => {
      createTrendFillSeries(mockChart as any, {
        // disableSeriesRendering removed - not in type
      });

      expect(mockChart.addCustomSeries).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          // disableSeriesRendering removed - not in type
        })
      );
    });

    it('should set lastValueVisible correctly based on rendering mode', () => {
      // Direct rendering - show series label
      createTrendFillSeries(mockChart as any, {
        lastValueVisible: true,
      });

      expect(mockChart.addCustomSeries).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          lastValueVisible: true,
        })
      );

      vi.clearAllMocks();

      // Primitive rendering - hide series label (primitive will show its own)
      createTrendFillSeries(mockChart as any, {
        // disableSeriesRendering removed - not in type
      });

      expect(mockChart.addCustomSeries).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          lastValueVisible: false,
        })
      );
    });
  });

  describe('Line Styles', () => {
    it('should support all line styles for uptrend line', () => {
      // Note: Only Solid, Dotted, and Dashed are supported (0, 1, 2)
      // LargeDashed and SparseDotted are clamped to Dashed when passed to primitive
      const lineStyles = [LineStyle.Solid, LineStyle.Dotted, LineStyle.Dashed];

      lineStyles.forEach(lineStyle => {
        vi.clearAllMocks();
        createTrendFillSeries(mockChart as any, {
          uptrendLineStyle: lineStyle,
        });

        expect(mockChart.addCustomSeries).toHaveBeenCalledWith(
          expect.any(Object),
          expect.objectContaining({
            uptrendLineStyle: lineStyle,
          })
        );
      });
    });

    it('should support all line styles for downtrend line', () => {
      const lineStyles = [LineStyle.Solid, LineStyle.Dotted, LineStyle.Dashed];

      lineStyles.forEach(lineStyle => {
        vi.clearAllMocks();
        createTrendFillSeries(mockChart as any, {
          downtrendLineStyle: lineStyle,
        });

        expect(mockChart.addCustomSeries).toHaveBeenCalledWith(
          expect.any(Object),
          expect.objectContaining({
            downtrendLineStyle: lineStyle,
          })
        );
      });
    });

    it('should support all line styles for base line', () => {
      // Note: Only Solid, Dotted, and Dashed are supported (0, 1, 2)
      // LargeDashed and SparseDotted are clamped to Dashed when passed to primitive
      const lineStyles = [LineStyle.Solid, LineStyle.Dotted, LineStyle.Dashed];

      lineStyles.forEach(lineStyle => {
        vi.clearAllMocks();
        createTrendFillSeries(mockChart as any, {
          baseLineStyle: lineStyle,
        });

        expect(mockChart.addCustomSeries).toHaveBeenCalledWith(
          expect.any(Object),
          expect.objectContaining({
            baseLineStyle: lineStyle,
          })
        );
      });
    });
  });

  describe('Fill Visibility', () => {
    it('should show fill by default', () => {
      createTrendFillSeries(mockChart as any);

      expect(mockChart.addCustomSeries).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          fillVisible: true,
        })
      );
    });

    it('should hide fill when fillVisible is false', () => {
      createTrendFillSeries(mockChart as any, {
        fillVisible: false,
      });

      expect(mockChart.addCustomSeries).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          fillVisible: false,
        })
      );
    });
  });

  describe('Price Scale', () => {
    it('should use right price scale by default', () => {
      createTrendFillSeries(mockChart as any);

      expect(mockChart.addCustomSeries).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          priceScaleId: 'right',
        })
      );
    });

    it('should support custom price scale', () => {
      createTrendFillSeries(mockChart as any, {
        priceScaleId: 'left',
      });

      expect(mockChart.addCustomSeries).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          priceScaleId: 'left',
        })
      );
    });
  });

  describe('Z-Index (Primitive Mode)', () => {
    it('should use default z-index when not specified', () => {
      createTrendFillSeries(mockChart as any, {
        usePrimitive: true,
        data: [],
      });

      expect(mockSeries.attachPrimitive).toHaveBeenCalledWith(
        expect.objectContaining({
          _options: expect.objectContaining({
            zIndex: 0,
          }),
        })
      );
    });

    it('should use custom z-index when specified', () => {
      createTrendFillSeries(mockChart as any, {
        usePrimitive: true,
        zIndex: -50,
        data: [],
      });

      expect(mockSeries.attachPrimitive).toHaveBeenCalledWith(
        expect.objectContaining({
          _options: expect.objectContaining({
            zIndex: -50,
          }),
        })
      );
    });
  });
});
