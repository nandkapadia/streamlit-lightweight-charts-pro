/**
 * @fileoverview Comprehensive tests for rendering utilities
 *
 * Tests cover:
 * - Coordinate conversion and validation
 * - Canvas rendering helpers
 * - Line style and drawing utilities
 * - Fill area and gradient creation
 * - Canvas state management
 * - Shape drawing utilities
 */

import { describe, it, expect, vi } from 'vitest';
import {
  convertToRendererCoordinates,
  convertTwoLineCoordinates,
  convertThreeLineCoordinates,
  batchConvertCoordinates,
  isValidCoordinate,
  isValidRenderPoint,
  filterValidRenderPoints,
  filterValidCoordinates,
  calculateVisibleRange,
  setupCanvasContext,
  renderWithScaledCanvas,
  createFillPath,
  createGradientFillPath,
  LineStyle,
  applyLineDashPattern,
  applyLineStyle,
  drawContinuousLine,
  drawSegmentedLine,
  fillBetweenLines,
  fillTrapezoidalSegments,
  createHorizontalGradient,
  createVerticalGradient,
  withSavedState,
  applyCanvasState,
  drawRectangle,
  fillVerticalBand,
  isValidCoordinateWithBounds,
  filterPointsByBounds,
  calculateExtendedRange,
  type RendererDataPoint,
  type RenderPoint,
  type ColoredRenderPoint,
  type CoordinateConversionConfig,
  type LineStyleConfig,
  type FillAreaConfig,
  type CanvasState,
  type RectangleConfig,
  type EdgeExtensionConfig,
} from '../../utils/renderingUtils';

// Mock canvas context
const createMockContext = (): any =>
  ({
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    setLineDash: vi.fn(),
    createLinearGradient: vi.fn(() => ({
      addColorStop: vi.fn(),
    })) as any,
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    scale: vi.fn(),
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    globalAlpha: 1,
    globalCompositeOperation: 'source-over' as GlobalCompositeOperation,
    lineCap: 'butt' as CanvasLineCap,
    lineJoin: 'miter' as CanvasLineJoin,
  }) as any;

// Mock time scale
const createMockTimeScale = () => ({
  timeToCoordinate: vi.fn(time => {
    if (typeof time === 'number') return time * 10;
    return 100;
  }),
  getVisibleRange: vi.fn(() => ({ from: 0, to: 100 })),
});

// Mock series API
const createMockSeries = () => ({
  priceToCoordinate: vi.fn(price => {
    if (typeof price === 'number') return 100 - price;
    return null;
  }),
  options: vi.fn(() => ({ lastValueVisible: true })),
});

describe('Coordinate Conversion Functions', () => {
  describe('convertToRendererCoordinates', () => {
    it('should convert data to renderer coordinates', () => {
      const data = [
        { time: 1, value: 10 },
        { time: 2, value: 20 },
      ];
      const timeScale = createMockTimeScale();
      const series = createMockSeries();
      const config: CoordinateConversionConfig = {
        timeField: 'time',
        coordinateFields: ['value'],
      };

      const result = convertToRendererCoordinates(
        data,
        timeScale,
        { value: series as any },
        config
      );

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('x');
      expect(result[0]).toHaveProperty('valueY');
    });

    it('should handle missing series gracefully', () => {
      const data = [{ time: 1, value: 10 }];
      const timeScale = createMockTimeScale();
      const config: CoordinateConversionConfig = {
        timeField: 'time',
        coordinateFields: ['value'],
      };

      const result = convertToRendererCoordinates(data, timeScale, {}, config);

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('x');
      expect(result[0]).not.toHaveProperty('valueY');
    });

    it('should use -100 fallback for null coordinates', () => {
      const data = [{ time: null, value: 10 }];
      const timeScale = {
        timeToCoordinate: vi.fn(() => null),
      };
      const series = createMockSeries();
      const config: CoordinateConversionConfig = {
        timeField: 'time',
        coordinateFields: ['value'],
      };

      const result = convertToRendererCoordinates(
        data,
        timeScale,
        { value: series as any },
        config
      );

      expect(result[0].x).toBe(-100);
    });
  });

  describe('convertTwoLineCoordinates', () => {
    it('should convert two-line data correctly', () => {
      const data = [
        { time: '2023-01-01' as any, upper: 10, lower: 5 },
        { time: '2023-01-02' as any, upper: 15, lower: 8 },
      ];
      const timeScale = createMockTimeScale();
      const upperSeries = createMockSeries();
      const lowerSeries = createMockSeries();

      const result = convertTwoLineCoordinates(
        data,
        timeScale,
        upperSeries as any,
        lowerSeries as any
      );

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('x');
      expect(result[0]).toHaveProperty('upperY');
      expect(result[0]).toHaveProperty('lowerY');
    });

    it('should return empty array if series are missing', () => {
      const data = [{ time: '2023-01-01' as any, upper: 10, lower: 5 }];
      const timeScale = createMockTimeScale();

      const result = convertTwoLineCoordinates(data, timeScale, null as any, null as any);

      expect(result).toEqual([]);
    });

    it('should preserve original data properties', () => {
      const data = [{ time: '2023-01-01' as any, upper: 10, lower: 5, fillColor: '#FF0000' }];
      const timeScale = createMockTimeScale();
      const upperSeries = createMockSeries();
      const lowerSeries = createMockSeries();

      const result = convertTwoLineCoordinates(
        data,
        timeScale,
        upperSeries as any,
        lowerSeries as any
      );

      expect(result[0]).toHaveProperty('fillColor', '#FF0000');
    });
  });

  describe('convertThreeLineCoordinates', () => {
    it('should convert three-line data correctly', () => {
      const data = [{ time: '2023-01-01' as any, upper: 15, middle: 10, lower: 5 }];
      const timeScale = createMockTimeScale();
      const upperSeries = createMockSeries();
      const middleSeries = createMockSeries();
      const lowerSeries = createMockSeries();

      const result = convertThreeLineCoordinates(
        data,
        timeScale,
        upperSeries as any,
        middleSeries as any,
        lowerSeries as any
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('x');
      expect(result[0]).toHaveProperty('upperY');
      expect(result[0]).toHaveProperty('middleY');
      expect(result[0]).toHaveProperty('lowerY');
    });

    it('should return empty array if series are missing', () => {
      const data = [{ time: '2023-01-01' as any, upper: 15, middle: 10, lower: 5 }];

      const result = convertThreeLineCoordinates(data, null, null as any, null as any, null as any);

      expect(result).toEqual([]);
    });
  });

  describe('batchConvertCoordinates', () => {
    it('should convert multiple items with error handling', () => {
      const items = [
        { time: 1, value: 10 },
        { time: 2, value: 20 },
      ];
      const timeScale = createMockTimeScale();
      const series = createMockSeries();

      const result = batchConvertCoordinates(items, timeScale, { value: series as any }, ['value']);

      expect(result).toHaveLength(2);
      expect(result[0]).toBeTruthy();
      expect(result[0]).toHaveProperty('x');
    });

    it('should return null for invalid coordinates', () => {
      const items = [{ time: 1, value: 10 }];
      const timeScale = {
        timeToCoordinate: vi.fn(() => -200), // Invalid coordinate
      };
      const series = createMockSeries();

      const result = batchConvertCoordinates(items, timeScale, { value: series as any }, ['value']);

      expect(result[0]).toBeNull();
    });

    it('should handle conversion errors gracefully', () => {
      const items = [{ time: 1, value: 10 }];
      const timeScale = {
        timeToCoordinate: vi.fn(() => {
          throw new Error('Conversion error');
        }),
      };

      const result = batchConvertCoordinates(items, timeScale, {}, ['value']);

      expect(result[0]).toBeNull();
    });
  });
});

describe('Coordinate Validation Functions', () => {
  describe('isValidCoordinate', () => {
    it('should return true for valid coordinates', () => {
      expect(isValidCoordinate(100)).toBe(true);
      expect(isValidCoordinate(0)).toBe(true);
      expect(isValidCoordinate(1000.5)).toBe(true);
    });

    it('should return false for invalid coordinates', () => {
      expect(isValidCoordinate(null)).toBe(false);
      expect(isValidCoordinate(undefined)).toBe(false);
      expect(isValidCoordinate(-100)).toBe(false);
      expect(isValidCoordinate(-101)).toBe(false);
    });

    it('should handle edge case of -99', () => {
      expect(isValidCoordinate(-99)).toBe(true);
    });
  });

  describe('isValidRenderPoint', () => {
    it('should return true for valid render points', () => {
      expect(isValidRenderPoint({ x: 10, y: 20 })).toBe(true);
      expect(isValidRenderPoint({ x: 0, y: 0 })).toBe(true);
    });

    it('should return false for null values', () => {
      expect(isValidRenderPoint({ x: null, y: 20 })).toBe(false);
      expect(isValidRenderPoint({ x: 10, y: null })).toBe(false);
      expect(isValidRenderPoint(null as any)).toBe(false);
    });

    it('should return false for non-numeric values', () => {
      expect(isValidRenderPoint({ x: '10' as any, y: 20 })).toBe(false);
      expect(isValidRenderPoint({ x: 10, y: '20' as any })).toBe(false);
    });

    it('should return false for NaN values', () => {
      expect(isValidRenderPoint({ x: NaN, y: 20 })).toBe(false);
      expect(isValidRenderPoint({ x: 10, y: NaN })).toBe(false);
    });
  });

  describe('filterValidRenderPoints', () => {
    it('should filter out invalid points', () => {
      const points: RenderPoint[] = [
        { x: 10, y: 20 },
        { x: null, y: 30 },
        { x: 40, y: null },
        { x: 50, y: 60 },
      ];

      const result = filterValidRenderPoints(points);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ x: 10, y: 20 });
      expect(result[1]).toEqual({ x: 50, y: 60 });
    });

    it('should handle empty array', () => {
      expect(filterValidRenderPoints([])).toEqual([]);
    });

    it('should filter NaN values', () => {
      const points: RenderPoint[] = [
        { x: NaN, y: 20 },
        { x: 10, y: NaN },
        { x: 30, y: 40 },
      ];

      const result = filterValidRenderPoints(points);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ x: 30, y: 40 });
    });
  });

  describe('filterValidCoordinates', () => {
    it('should filter points with valid coordinates', () => {
      const points: RendererDataPoint[] = [
        { x: 10, upperY: 20 },
        { x: -200, upperY: 30 }, // Invalid x
        { x: 40, upperY: -200 }, // Invalid y
        { x: 50, upperY: 60 },
      ];

      const result = filterValidCoordinates(points);

      expect(result).toHaveLength(2);
    });

    it('should require at least one valid y coordinate', () => {
      const points: RendererDataPoint[] = [
        { x: 10 }, // No y coordinates
        { x: 20, upperY: 30 },
      ];

      const result = filterValidCoordinates(points);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ x: 20, upperY: 30 });
    });
  });
});

describe('Visible Range Calculation', () => {
  describe('calculateVisibleRange', () => {
    it('should calculate visible range from valid points', () => {
      const points = [{ x: null }, { x: 10 }, { x: 20 }, { x: 30 }, { x: null }];

      const result = calculateVisibleRange(points);

      expect(result).toEqual({ from: 1, to: 4 });
    });

    it('should return null for empty array', () => {
      expect(calculateVisibleRange([])).toBeNull();
    });

    it('should handle all invalid points', () => {
      const points = [{ x: null }, { x: -200 }, { x: null }];

      const result = calculateVisibleRange(points);

      // Should find no valid range
      expect(result).toEqual({ from: 0, to: 3 });
    });

    it('should handle single valid point', () => {
      const points = [{ x: null }, { x: 100 }, { x: null }];

      const result = calculateVisibleRange(points);

      expect(result).toEqual({ from: 1, to: 2 });
    });
  });
});

describe('Canvas Setup and Context Management', () => {
  describe('setupCanvasContext', () => {
    it('should create a setup function', () => {
      const mockTarget = {
        useBitmapCoordinateSpace: vi.fn(),
      };

      const setupFn = setupCanvasContext(mockTarget);

      expect(typeof setupFn).toBe('function');
    });

    it('should execute callback with scaled context', () => {
      const mockCtx = createMockContext();
      const mockTarget = {
        useBitmapCoordinateSpace: vi.fn(callback => {
          callback({
            context: mockCtx,
            horizontalPixelRatio: 2,
            verticalPixelRatio: 2,
          });
        }),
      };

      const setupFn = setupCanvasContext(mockTarget);
      const callback = vi.fn();

      setupFn(callback);

      expect(mockCtx.scale).toHaveBeenCalledWith(2, 2);
      expect(callback).toHaveBeenCalledWith(mockCtx);
    });
  });

  describe('renderWithScaledCanvas', () => {
    it('should execute callback with scaled context', () => {
      const mockCtx = createMockContext();
      const mockTarget = {
        useBitmapCoordinateSpace: vi.fn(callback => {
          callback({
            context: mockCtx,
            horizontalPixelRatio: 2,
            verticalPixelRatio: 2,
          });
        }),
      };

      const callback = vi.fn();

      renderWithScaledCanvas(mockTarget, callback);

      expect(mockCtx.scale).toHaveBeenCalledWith(2, 2);
      expect(callback).toHaveBeenCalledWith(mockCtx, expect.anything());
    });

    it('should handle missing context gracefully', () => {
      const mockTarget = {
        useBitmapCoordinateSpace: vi.fn(callback => {
          callback({
            context: null,
            horizontalPixelRatio: 2,
            verticalPixelRatio: 2,
          });
        }),
      };

      const callback = vi.fn();

      expect(() => renderWithScaledCanvas(mockTarget, callback)).not.toThrow();
      expect(callback).not.toHaveBeenCalled();
    });
  });
});

describe('Canvas Path Drawing Functions', () => {
  describe('createFillPath', () => {
    it('should create fill path between upper and lower points', () => {
      const ctx = createMockContext();
      const upperPoints: RenderPoint[] = [
        { x: 0, y: 10 },
        { x: 100, y: 20 },
      ];
      const lowerPoints: RenderPoint[] = [
        { x: 0, y: 30 },
        { x: 100, y: 40 },
      ];

      createFillPath(ctx, upperPoints, lowerPoints, '#FF0000');

      expect(ctx.beginPath).toHaveBeenCalled();
      expect(ctx.moveTo).toHaveBeenCalledWith(0, 10);
      expect(ctx.closePath).toHaveBeenCalled();
      expect(ctx.fillStyle).toBe('#FF0000');
      expect(ctx.fill).toHaveBeenCalled();
    });

    it('should handle empty points', () => {
      const ctx = createMockContext();

      createFillPath(ctx, [], [], '#FF0000');

      expect(ctx.beginPath).not.toHaveBeenCalled();
    });

    it('should filter invalid points', () => {
      const ctx = createMockContext();
      const upperPoints: RenderPoint[] = [
        { x: 0, y: 10 },
        { x: null, y: null },
        { x: 100, y: 20 },
      ];
      const lowerPoints: RenderPoint[] = [
        { x: 0, y: 30 },
        { x: 100, y: 40 },
      ];

      createFillPath(ctx, upperPoints, lowerPoints, '#FF0000');

      expect(ctx.moveTo).toHaveBeenCalledWith(0, 10);
    });
  });

  describe('createGradientFillPath', () => {
    it('should create gradient fill with color stops', () => {
      const ctx = createMockContext();
      const gradient = { addColorStop: vi.fn() };
      ctx.createLinearGradient = vi.fn(() => gradient as any);

      const upperPoints: RenderPoint[] = [
        { x: 0, y: 10 },
        { x: 100, y: 20 },
      ];
      const lowerPoints: RenderPoint[] = [
        { x: 0, y: 30 },
        { x: 100, y: 40 },
      ];
      const coloredPoints: ColoredRenderPoint[] = [
        { x: 0, y: 20, color: '#FF0000' },
        { x: 100, y: 30, color: '#00FF00' },
      ];

      createGradientFillPath(ctx, upperPoints, lowerPoints, coloredPoints);

      expect(ctx.createLinearGradient).toHaveBeenCalled();
      expect(gradient.addColorStop).toHaveBeenCalledWith(0, '#FF0000');
      expect(gradient.addColorStop).toHaveBeenCalledWith(1, '#00FF00');
    });

    it('should handle empty colored points', () => {
      const ctx = createMockContext();
      const upperPoints: RenderPoint[] = [{ x: 0, y: 10 }];
      const lowerPoints: RenderPoint[] = [{ x: 0, y: 30 }];

      createGradientFillPath(ctx, upperPoints, lowerPoints, []);

      expect(ctx.fill).not.toHaveBeenCalled();
    });
  });
});

describe('Line Style and Drawing Utilities', () => {
  describe('applyLineDashPattern', () => {
    it('should apply solid line (no dash)', () => {
      const ctx = createMockContext();

      applyLineDashPattern(ctx, LineStyle.Solid);

      expect(ctx.setLineDash).toHaveBeenCalledWith([]);
    });

    it('should apply dotted line', () => {
      const ctx = createMockContext();

      applyLineDashPattern(ctx, LineStyle.Dotted);

      expect(ctx.setLineDash).toHaveBeenCalledWith([5, 5]);
    });

    it('should apply dashed line', () => {
      const ctx = createMockContext();

      applyLineDashPattern(ctx, LineStyle.Dashed);

      expect(ctx.setLineDash).toHaveBeenCalledWith([10, 5]);
    });

    it('should apply large dashed line', () => {
      const ctx = createMockContext();

      applyLineDashPattern(ctx, LineStyle.LargeDashed);

      expect(ctx.setLineDash).toHaveBeenCalledWith([15, 10]);
    });

    it('should apply sparse dotted line', () => {
      const ctx = createMockContext();

      applyLineDashPattern(ctx, LineStyle.SparseDotted);

      expect(ctx.setLineDash).toHaveBeenCalledWith([2, 8]);
    });
  });

  describe('applyLineStyle', () => {
    it('should apply complete line style', () => {
      const ctx = createMockContext();
      const config: LineStyleConfig = {
        color: '#FF0000',
        lineWidth: 3,
        lineStyle: LineStyle.Dashed,
        lineCap: 'round',
        lineJoin: 'round',
      };

      applyLineStyle(ctx, config);

      expect(ctx.strokeStyle).toBe('#FF0000');
      expect(ctx.lineWidth).toBe(3);
      expect(ctx.setLineDash).toHaveBeenCalledWith([10, 5]);
      expect(ctx.lineCap).toBe('round');
      expect(ctx.lineJoin).toBe('round');
    });

    it('should apply minimal line style', () => {
      const ctx = createMockContext();
      const config: LineStyleConfig = {
        color: '#00FF00',
        lineWidth: 2,
      };

      applyLineStyle(ctx, config);

      expect(ctx.strokeStyle).toBe('#00FF00');
      expect(ctx.lineWidth).toBe(2);
    });
  });

  describe('drawContinuousLine', () => {
    it('should draw line through points', () => {
      const ctx = createMockContext();
      const points: RenderPoint[] = [
        { x: 0, y: 10 },
        { x: 50, y: 20 },
        { x: 100, y: 30 },
      ];
      const config: LineStyleConfig = {
        color: '#FF0000',
        lineWidth: 2,
      };

      drawContinuousLine(ctx, points, config);

      expect(ctx.save).toHaveBeenCalled();
      expect(ctx.moveTo).toHaveBeenCalled();
      expect(ctx.stroke).toHaveBeenCalled();
      expect(ctx.restore).toHaveBeenCalled();
    });

    it('should skip invalid points when requested', () => {
      const ctx = createMockContext();
      const points: RenderPoint[] = [
        { x: 0, y: 10 },
        { x: null, y: null },
        { x: 100, y: 30 },
      ];
      const config: LineStyleConfig = {
        color: '#FF0000',
        lineWidth: 2,
      };

      drawContinuousLine(ctx, points, config, { skipInvalid: true });

      expect(ctx.stroke).toHaveBeenCalled();
    });

    it('should extend line at start', () => {
      const ctx = createMockContext();
      const points: RenderPoint[] = [
        { x: 100, y: 10 },
        { x: 200, y: 20 },
      ];
      const config: LineStyleConfig = {
        color: '#FF0000',
        lineWidth: 2,
      };

      drawContinuousLine(ctx, points, config, { extendStart: 50 });

      expect(ctx.moveTo).toHaveBeenCalledWith(50, 10); // 100 - 50
    });

    it('should extend line at end', () => {
      const ctx = createMockContext();
      const points: RenderPoint[] = [
        { x: 100, y: 10 },
        { x: 200, y: 20 },
      ];
      const config: LineStyleConfig = {
        color: '#FF0000',
        lineWidth: 2,
      };

      drawContinuousLine(ctx, points, config, { extendEnd: 50 });

      expect(ctx.lineTo).toHaveBeenCalledWith(250, 20); // 200 + 50
    });
  });

  describe('drawSegmentedLine', () => {
    it('should draw multiple segments', () => {
      const ctx = createMockContext();
      const segments = [
        {
          points: [
            { x: 0, y: 10 },
            { x: 50, y: 20 },
          ],
          style: { color: '#FF0000', lineWidth: 2 },
        },
        {
          points: [
            { x: 50, y: 20 },
            { x: 100, y: 30 },
          ],
          style: { color: '#00FF00', lineWidth: 2 },
        },
      ];

      drawSegmentedLine(ctx, segments);

      expect(ctx.stroke).toHaveBeenCalledTimes(2);
    });

    it('should handle empty segments', () => {
      const ctx = createMockContext();

      expect(() => drawSegmentedLine(ctx, [])).not.toThrow();
    });
  });
});

describe('Fill Area Utilities', () => {
  describe('fillBetweenLines', () => {
    it('should fill area with opacity', () => {
      const ctx = createMockContext();
      const upperPoints: RenderPoint[] = [
        { x: 0, y: 10 },
        { x: 100, y: 20 },
      ];
      const lowerPoints: RenderPoint[] = [
        { x: 0, y: 30 },
        { x: 100, y: 40 },
      ];
      const config: FillAreaConfig = {
        fillStyle: '#FF0000',
        opacity: 0.5,
      };

      fillBetweenLines(ctx, upperPoints, lowerPoints, config);

      expect(ctx.globalAlpha).toBe(0.5);
      expect(ctx.fillStyle).toBe('#FF0000');
      expect(ctx.fill).toHaveBeenCalled();
      expect(ctx.restore).toHaveBeenCalled();
    });

    it('should extend edges', () => {
      const ctx = createMockContext();
      const upperPoints: RenderPoint[] = [
        { x: 100, y: 10 },
        { x: 200, y: 20 },
      ];
      const lowerPoints: RenderPoint[] = [
        { x: 100, y: 30 },
        { x: 200, y: 40 },
      ];
      const config: FillAreaConfig = {
        fillStyle: '#FF0000',
        edgeExtension: {
          start: 50,
          end: 50,
        },
      };

      fillBetweenLines(ctx, upperPoints, lowerPoints, config);

      expect(ctx.moveTo).toHaveBeenCalledWith(50, 10); // 100 - 50
    });
  });

  describe('fillTrapezoidalSegments', () => {
    it('should fill trapezoidal segments', () => {
      const ctx = createMockContext();
      const segments = [
        {
          x1: 0,
          y1Upper: 10,
          y1Lower: 30,
          x2: 50,
          y2Upper: 20,
          y2Lower: 40,
          fillStyle: '#FF0000',
        },
        {
          x1: 50,
          y1Upper: 20,
          y1Lower: 40,
          x2: 100,
          y2Upper: 25,
          y2Lower: 45,
          fillStyle: '#00FF00',
        },
      ];

      fillTrapezoidalSegments(ctx, segments);

      expect(ctx.fill).toHaveBeenCalledTimes(2);
      expect(ctx.fillStyle).toBe('#00FF00'); // Last segment color
    });

    it('should handle empty segments', () => {
      const ctx = createMockContext();

      expect(() => fillTrapezoidalSegments(ctx, [])).not.toThrow();
    });
  });
});

describe('Gradient Creation Utilities', () => {
  describe('createHorizontalGradient', () => {
    it('should create gradient with color stops', () => {
      const ctx = createMockContext();
      const gradient = { addColorStop: vi.fn() };
      ctx.createLinearGradient = vi.fn(() => gradient as any);

      const coloredPoints: ColoredRenderPoint[] = [
        { x: 0, y: 10, color: '#FF0000' },
        { x: 100, y: 20, color: '#00FF00' },
      ];

      createHorizontalGradient(ctx, 0, 100, coloredPoints);

      expect(ctx.createLinearGradient).toHaveBeenCalledWith(0, 0, 100, 0);
      expect(gradient.addColorStop).toHaveBeenCalledWith(0, '#FF0000');
      expect(gradient.addColorStop).toHaveBeenCalledWith(1, '#00FF00');
    });

    it('should handle empty points with fallback', () => {
      const ctx = createMockContext();
      const gradient = { addColorStop: vi.fn() };
      ctx.createLinearGradient = vi.fn(() => gradient as any);

      createHorizontalGradient(ctx, 0, 100, []);

      expect(gradient.addColorStop).toHaveBeenCalledWith(0, 'rgba(0,0,0,0)');
      expect(gradient.addColorStop).toHaveBeenCalledWith(1, 'rgba(0,0,0,0)');
    });

    it('should clamp positions to 0-1 range', () => {
      const ctx = createMockContext();
      const gradient = { addColorStop: vi.fn() };
      ctx.createLinearGradient = vi.fn(() => gradient as any);

      const coloredPoints: ColoredRenderPoint[] = [
        { x: -50, y: 10, color: '#FF0000' }, // Should clamp to 0
        { x: 150, y: 20, color: '#00FF00' }, // Should clamp to 1
      ];

      createHorizontalGradient(ctx, 0, 100, coloredPoints);

      expect(gradient.addColorStop).toHaveBeenCalledWith(0, expect.any(String));
    });
  });

  describe('createVerticalGradient', () => {
    it('should create vertical gradient with stops', () => {
      const ctx = createMockContext();
      const gradient = { addColorStop: vi.fn() };
      ctx.createLinearGradient = vi.fn(() => gradient as any);

      const stops = [
        { position: 0, color: '#FF0000' },
        { position: 0.5, color: '#FFFF00' },
        { position: 1, color: '#00FF00' },
      ];

      createVerticalGradient(ctx, 0, 100, stops);

      expect(ctx.createLinearGradient).toHaveBeenCalledWith(0, 0, 0, 100);
      expect(gradient.addColorStop).toHaveBeenCalledTimes(3);
    });
  });
});

describe('Canvas State Management', () => {
  describe('withSavedState', () => {
    it('should save and restore canvas state', () => {
      const ctx = createMockContext();
      const callback = vi.fn();

      withSavedState(ctx, callback);

      expect(ctx.save).toHaveBeenCalled();
      expect(callback).toHaveBeenCalledWith(ctx);
      expect(ctx.restore).toHaveBeenCalled();
    });

    it('should restore state even if callback throws', () => {
      const ctx = createMockContext();
      const callback = vi.fn(() => {
        throw new Error('Test error');
      });

      expect(() => withSavedState(ctx, callback)).toThrow('Test error');
      expect(ctx.restore).toHaveBeenCalled();
    });
  });

  describe('applyCanvasState', () => {
    it('should apply all state properties', () => {
      const ctx = createMockContext();
      const state: CanvasState = {
        fillStyle: '#FF0000',
        strokeStyle: '#00FF00',
        lineWidth: 3,
        globalAlpha: 0.5,
        lineCap: 'round',
        lineJoin: 'round',
        lineDash: [5, 5],
      };

      applyCanvasState(ctx, state);

      expect(ctx.fillStyle).toBe('#FF0000');
      expect(ctx.strokeStyle).toBe('#00FF00');
      expect(ctx.lineWidth).toBe(3);
      expect(ctx.globalAlpha).toBe(0.5);
      expect(ctx.lineCap).toBe('round');
      expect(ctx.lineJoin).toBe('round');
      expect(ctx.setLineDash).toHaveBeenCalledWith([5, 5]);
    });

    it('should handle partial state', () => {
      const ctx = createMockContext();
      const state: CanvasState = {
        fillStyle: '#FF0000',
      };

      expect(() => applyCanvasState(ctx, state)).not.toThrow();
      expect(ctx.fillStyle).toBe('#FF0000');
    });
  });
});

describe('Shape Drawing Utilities', () => {
  describe('drawRectangle', () => {
    it('should draw filled rectangle', () => {
      const ctx = createMockContext();
      const config: RectangleConfig = {
        x: 10,
        y: 20,
        width: 100,
        height: 50,
        fillColor: '#FF0000',
      };

      drawRectangle(ctx, config);

      expect(ctx.fillRect).toHaveBeenCalledWith(10, 20, 100, 50);
      expect(ctx.fillStyle).toBe('#FF0000');
    });

    it('should draw stroked rectangle', () => {
      const ctx = createMockContext();
      const config: RectangleConfig = {
        x: 10,
        y: 20,
        width: 100,
        height: 50,
        strokeColor: '#00FF00',
        strokeWidth: 2,
      };

      drawRectangle(ctx, config);

      expect(ctx.strokeRect).toHaveBeenCalledWith(10, 20, 100, 50);
      expect(ctx.strokeStyle).toBe('#00FF00');
      expect(ctx.lineWidth).toBe(2);
    });

    it('should apply opacity', () => {
      const ctx = createMockContext();
      const config: RectangleConfig = {
        x: 10,
        y: 20,
        width: 100,
        height: 50,
        fillColor: '#FF0000',
        fillOpacity: 0.5,
      };

      drawRectangle(ctx, config);

      expect(ctx.globalAlpha).toBe(1.0); // Reset after drawing
    });
  });

  describe('fillVerticalBand', () => {
    it('should fill vertical band', () => {
      const ctx = createMockContext();

      fillVerticalBand(ctx, 10, 50, 20, 100, '#FF0000');

      expect(ctx.fillRect).toHaveBeenCalledWith(10, 20, 40, 80);
      expect(ctx.fillStyle).toBe('#FF0000');
    });

    it('should ensure minimum width of 1', () => {
      const ctx = createMockContext();

      fillVerticalBand(ctx, 10, 10, 20, 100, '#FF0000');

      expect(ctx.fillRect).toHaveBeenCalledWith(10, 20, 1, 80);
    });
  });
});

describe('Enhanced Coordinate Validation', () => {
  describe('isValidCoordinateWithBounds', () => {
    it('should validate coordinate within bounds', () => {
      expect(isValidCoordinateWithBounds(50, { minX: 0, maxX: 100 })).toBe(true);
    });

    it('should reject coordinate below minX', () => {
      expect(isValidCoordinateWithBounds(-10, { minX: 0, maxX: 100 })).toBe(false);
    });

    it('should reject coordinate above maxX', () => {
      expect(isValidCoordinateWithBounds(150, { minX: 0, maxX: 100 })).toBe(false);
    });

    it('should apply tolerance', () => {
      expect(isValidCoordinateWithBounds(105, { minX: 0, maxX: 100, tolerance: 10 })).toBe(true);
      expect(isValidCoordinateWithBounds(115, { minX: 0, maxX: 100, tolerance: 10 })).toBe(false);
    });

    it('should validate without bounds', () => {
      expect(isValidCoordinateWithBounds(50)).toBe(true);
      expect(isValidCoordinateWithBounds(-200)).toBe(false);
    });
  });

  describe('filterPointsByBounds', () => {
    it('should filter points by bounds', () => {
      const points: RenderPoint[] = [
        { x: 10, y: 20 },
        { x: 150, y: 30 }, // Out of bounds
        { x: 50, y: 60 },
      ];

      const result = filterPointsByBounds(points, { minX: 0, maxX: 100, minY: 0, maxY: 100 });

      expect(result).toHaveLength(2);
    });

    it('should handle empty array', () => {
      expect(filterPointsByBounds([], { minX: 0, maxX: 100 })).toEqual([]);
    });
  });
});

describe('Edge Extension Utilities', () => {
  describe('calculateExtendedRange', () => {
    it('should calculate extended range', () => {
      const firstPoint: RenderPoint = { x: 100, y: 10 };
      const lastPoint: RenderPoint = { x: 200, y: 20 };
      const config: EdgeExtensionConfig = {
        barWidth: 10,
        extensionPixels: 50,
      };

      const result = calculateExtendedRange(firstPoint, lastPoint, config);

      expect(result.startX).toBe(45); // 100 - 5 - 50
      expect(result.endX).toBe(255); // 200 + 5 + 50
    });

    it('should use default extension', () => {
      const firstPoint: RenderPoint = { x: 100, y: 10 };
      const lastPoint: RenderPoint = { x: 200, y: 20 };
      const config: EdgeExtensionConfig = {
        barWidth: 10,
      };

      const result = calculateExtendedRange(firstPoint, lastPoint, config);

      expect(result.startX).toBe(45); // 100 - 5 - 50 (default extension)
      expect(result.endX).toBe(255); // 200 + 5 + 50 (default extension)
    });
  });
});
