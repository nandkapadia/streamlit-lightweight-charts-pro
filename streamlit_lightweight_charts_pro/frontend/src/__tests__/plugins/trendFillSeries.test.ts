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

// Mock chart
const mockChart = {
  addCustomSeries: vi.fn(),
  timeScale: vi.fn(() => ({
    getVisibleRange: vi.fn(() => ({ from: 0, to: 100 })),
    timeToCoordinate: vi.fn((time) => 100 + Math.random() * 300),
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
  priceToCoordinate: vi.fn((price) => 100 + Math.random() * 300),
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
          trendLineColor: '#2196F3',
          trendLineWidth: 2,
          trendLineStyle: LineStyle.Solid,
          trendLineVisible: true,
          baseLineColor: '#666666',
          baseLineWidth: 1,
          baseLineStyle: LineStyle.Dotted,
          baseLineVisible: false,
          priceScaleId: 'right',
          disableSeriesRendering: false,
          lastValueVisible: true,
        })
      );
      expect(series).toBeDefined();
    });

    it('should create series with custom options', () => {
      const customOptions: Partial<TrendFillSeriesOptions> = {
        uptrendFillColor: 'rgba(0, 255, 0, 0.5)',
        downtrendFillColor: 'rgba(255, 0, 0, 0.5)',
        trendLineColor: '#FF0000',
        trendLineWidth: 3,
        trendLineStyle: LineStyle.Dashed,
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
    it('should attach primitive when disableSeriesRendering is true', () => {
      const testData: TrendFillData[] = [
        { time: '2023-01-01', baseLine: 100, trendLine: 105, trendDirection: 1 },
      ];

      createTrendFillSeries(mockChart as any, {
        disableSeriesRendering: true,
        data: testData,
      });

      expect(mockChart.addCustomSeries).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          disableSeriesRendering: true,
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
        disableSeriesRendering: true,
        uptrendFillColor: 'rgba(0, 255, 0, 0.3)',
        downtrendFillColor: 'rgba(255, 0, 0, 0.3)',
        trendLineColor: '#00FF00',
        trendLineWidth: 3,
        trendLineStyle: LineStyle.Dashed,
        baseLineVisible: true,
        zIndex: -50,
        data: testData,
      });

      expect(mockSeries.attachPrimitive).toHaveBeenCalledWith(
        expect.objectContaining({
          options: expect.objectContaining({
            uptrendFillColor: 'rgba(0, 255, 0, 0.3)',
            downtrendFillColor: 'rgba(255, 0, 0, 0.3)',
            trendLine: expect.objectContaining({
              color: '#00FF00',
              lineWidth: 3,
              visible: true,
            }),
            baseLine: expect.objectContaining({
              visible: true,
            }),
            zIndex: -50,
          }),
        })
      );
    });

    it('should not attach primitive when direct rendering', () => {
      createTrendFillSeries(mockChart as any, {
        disableSeriesRendering: false,
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
        { time: 1672531200, baseLine: 100, trendLine: 105, trendDirection: 1 },
        { time: 1672617600, baseLine: 100, trendLine: 95, trendDirection: -1 },
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
          disableSeriesRendering: false,
        })
      );
    });

    it('should disable series rendering when using primitive', () => {
      createTrendFillSeries(mockChart as any, {
        disableSeriesRendering: true,
      });

      expect(mockChart.addCustomSeries).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          disableSeriesRendering: true,
        })
      );
    });

    it('should set lastValueVisible correctly based on rendering mode', () => {
      // Direct rendering - show series label
      createTrendFillSeries(mockChart as any, {
        disableSeriesRendering: false,
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
        disableSeriesRendering: true,
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
    it('should support all line styles for trend line', () => {
      // Note: Only Solid, Dotted, and Dashed are supported (0, 1, 2)
      // LargeDashed and SparseDotted are clamped to Dashed when passed to primitive
      const lineStyles = [
        LineStyle.Solid,
        LineStyle.Dotted,
        LineStyle.Dashed,
      ];

      lineStyles.forEach((lineStyle) => {
        vi.clearAllMocks();
        createTrendFillSeries(mockChart as any, {
          trendLineStyle: lineStyle,
        });

        expect(mockChart.addCustomSeries).toHaveBeenCalledWith(
          expect.any(Object),
          expect.objectContaining({
            trendLineStyle: lineStyle,
          })
        );
      });
    });

    it('should support all line styles for base line', () => {
      // Note: Only Solid, Dotted, and Dashed are supported (0, 1, 2)
      // LargeDashed and SparseDotted are clamped to Dashed when passed to primitive
      const lineStyles = [
        LineStyle.Solid,
        LineStyle.Dotted,
        LineStyle.Dashed,
      ];

      lineStyles.forEach((lineStyle) => {
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
        disableSeriesRendering: true,
        data: [],
      });

      expect(mockSeries.attachPrimitive).toHaveBeenCalledWith(
        expect.objectContaining({
          options: expect.objectContaining({
            zIndex: -100,
          }),
        })
      );
    });

    it('should use custom z-index when specified', () => {
      createTrendFillSeries(mockChart as any, {
        disableSeriesRendering: true,
        zIndex: -50,
        data: [],
      });

      expect(mockSeries.attachPrimitive).toHaveBeenCalledWith(
        expect.objectContaining({
          options: expect.objectContaining({
            zIndex: -50,
          }),
        })
      );
    });
  });
});
