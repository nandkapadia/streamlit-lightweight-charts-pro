/**
 * Tests for TrendFillRenderer
 *
 * Coverage:
 * - Static methods (drawFills, drawTrendLine, drawBaseLine, applyLineStyle)
 * - Fill drawing with bar grouping by trend direction
 * - Line style application (solid, dotted, dashed, large dashed, sparse dotted)
 * - Pixel ratio handling (hRatio, vRatio)
 * - Half bar width calculations
 * - Edge cases (empty data, null ranges, invalid bars)
 * - Canvas 2D context method calls
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TrendFillRenderer, TrendFillBarData, TrendFillRenderOptions } from '../../renderers/TrendFillRenderer';
import { LineStyle } from '../../utils/renderingUtils';

// Mock Path2D globally
const createMockPath2D = () => ({
  moveTo: vi.fn(),
  lineTo: vi.fn(),
});

global.Path2D = vi.fn(() => createMockPath2D()) as any;

// Mock canvas context
const createMockContext = () => ({
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 0,
  lineCap: 'butt' as CanvasLineCap,
  lineJoin: 'miter' as CanvasLineJoin,
  beginPath: vi.fn(),
  closePath: vi.fn(),
  fill: vi.fn(),
  stroke: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  setLineDash: vi.fn(),
});

describe('TrendFillRenderer', () => {
  describe('applyLineStyle', () => {
    let ctx: ReturnType<typeof createMockContext>;

    beforeEach(() => {
      ctx = createMockContext();
    });

    it('should apply solid line style', () => {
      TrendFillRenderer.applyLineStyle(ctx as any, LineStyle.Solid);
      expect(ctx.setLineDash).toHaveBeenCalledWith([]);
    });

    it('should apply dotted line style', () => {
      TrendFillRenderer.applyLineStyle(ctx as any, LineStyle.Dotted);
      expect(ctx.setLineDash).toHaveBeenCalledWith([1, 1]);
    });

    it('should apply dashed line style', () => {
      TrendFillRenderer.applyLineStyle(ctx as any, LineStyle.Dashed);
      expect(ctx.setLineDash).toHaveBeenCalledWith([4, 2]);
    });

    it('should apply large dashed line style', () => {
      TrendFillRenderer.applyLineStyle(ctx as any, LineStyle.LargeDashed);
      expect(ctx.setLineDash).toHaveBeenCalledWith([8, 4]);
    });

    it('should apply sparse dotted line style', () => {
      TrendFillRenderer.applyLineStyle(ctx as any, LineStyle.SparseDotted);
      expect(ctx.setLineDash).toHaveBeenCalledWith([1, 4]);
    });

    it('should default to solid for unknown line style', () => {
      TrendFillRenderer.applyLineStyle(ctx as any, 999 as LineStyle);
      expect(ctx.setLineDash).toHaveBeenCalledWith([]);
    });
  });

  describe('drawFills', () => {
    let ctx: ReturnType<typeof createMockContext>;
    let bars: TrendFillBarData[];
    let options: TrendFillRenderOptions;

    beforeEach(() => {
      ctx = createMockContext();
      bars = [
        { x: 10, trendLineY: 100, baseLineY: 150, trendDirection: 1, fillColor: 'green', lineColor: 'green' },
        { x: 20, trendLineY: 110, baseLineY: 150, trendDirection: 1, fillColor: 'green', lineColor: 'green' },
        { x: 30, trendLineY: 120, baseLineY: 150, trendDirection: 1, fillColor: 'green', lineColor: 'green' },
      ];
      options = {
        fillVisible: true,
        uptrendFillColor: 'green',
        downtrendFillColor: 'red',
        trendLineVisible: true,
        trendLineColor: 'blue',
        trendLineWidth: 2,
        trendLineStyle: LineStyle.Solid,
        baseLineVisible: true,
        baseLineColor: 'gray',
        baseLineWidth: 1,
        baseLineStyle: LineStyle.Solid,
      };
    });

    it('should return early if bars are empty', () => {
      TrendFillRenderer.drawFills(ctx as any, [], { from: 0, to: 0 }, options);
      expect(ctx.beginPath).not.toHaveBeenCalled();
    });

    it('should return early if visible range is null', () => {
      TrendFillRenderer.drawFills(ctx as any, bars, null as any, options);
      expect(ctx.beginPath).not.toHaveBeenCalled();
    });

    it('should draw fill for uptrend bars', () => {
      TrendFillRenderer.drawFills(ctx as any, bars, { from: 0, to: 3 }, options);

      expect(ctx.fillStyle).toBe('green');
      expect(ctx.beginPath).toHaveBeenCalled();
      expect(ctx.closePath).toHaveBeenCalled();
      expect(ctx.fill).toHaveBeenCalled();
    });

    it('should draw fill with pixel ratios', () => {
      const hRatio = 2;
      const vRatio = 1.5;
      TrendFillRenderer.drawFills(ctx as any, bars, { from: 0, to: 3 }, options, hRatio, vRatio);

      expect(ctx.moveTo).toHaveBeenCalledWith(10 * hRatio, 100 * vRatio);
      expect(ctx.fill).toHaveBeenCalled();
    });

    it('should apply half bar width offset when enabled', () => {
      const optionsWithHalfBar = { ...options, useHalfBarWidth: true, barSpacing: 10 };
      TrendFillRenderer.drawFills(ctx as any, bars, { from: 0, to: 3 }, optionsWithHalfBar);

      const halfBarWidth = 10 / 2;
      expect(ctx.moveTo).toHaveBeenCalledWith(10 - halfBarWidth, 100);
    });

    it('should skip neutral bars (trendDirection = 0)', () => {
      const barsWithNeutral = [
        { x: 10, trendLineY: 100, baseLineY: 150, trendDirection: 1, fillColor: 'green', lineColor: 'green' },
        { x: 20, trendLineY: 110, baseLineY: 150, trendDirection: 0, fillColor: 'gray', lineColor: 'gray' },
        { x: 30, trendLineY: 120, baseLineY: 150, trendDirection: 1, fillColor: 'green', lineColor: 'green' },
      ];

      TrendFillRenderer.drawFills(ctx as any, barsWithNeutral, { from: 0, to: 3 }, options);

      // Should create two separate groups
      expect(ctx.fill).toHaveBeenCalledTimes(2);
    });

    it('should group consecutive bars with same trend direction', () => {
      TrendFillRenderer.drawFills(ctx as any, bars, { from: 0, to: 3 }, options);

      // All bars have same direction, should be one group
      expect(ctx.fill).toHaveBeenCalledTimes(1);
    });

    it('should create separate groups when trend direction changes', () => {
      const barsWithChange = [
        { x: 10, trendLineY: 100, baseLineY: 150, trendDirection: 1, fillColor: 'green', lineColor: 'green' },
        { x: 20, trendLineY: 110, baseLineY: 150, trendDirection: 1, fillColor: 'green', lineColor: 'green' },
        { x: 30, trendLineY: 120, baseLineY: 150, trendDirection: -1, fillColor: 'red', lineColor: 'red' },
      ];

      TrendFillRenderer.drawFills(ctx as any, barsWithChange, { from: 0, to: 3 }, options);

      // Two groups: uptrend then downtrend
      expect(ctx.fill).toHaveBeenCalledTimes(2);
    });

    it('should skip undefined bars in visible range', () => {
      const spareBars = [
        bars[0],
        undefined as any,
        bars[2],
      ];

      TrendFillRenderer.drawFills(ctx as any, spareBars, { from: 0, to: 3 }, options);

      // Should still draw valid bars
      expect(ctx.fill).toHaveBeenCalled();
    });

    it('should handle visible range subset', () => {
      const manyBars = [
        { x: 10, trendLineY: 100, baseLineY: 150, trendDirection: 1, fillColor: 'green', lineColor: 'green' },
        { x: 20, trendLineY: 110, baseLineY: 150, trendDirection: 1, fillColor: 'green', lineColor: 'green' },
        { x: 30, trendLineY: 120, baseLineY: 150, trendDirection: 1, fillColor: 'green', lineColor: 'green' },
        { x: 40, trendLineY: 130, baseLineY: 150, trendDirection: 1, fillColor: 'green', lineColor: 'green' },
        { x: 50, trendLineY: 140, baseLineY: 150, trendDirection: 1, fillColor: 'green', lineColor: 'green' },
      ];

      TrendFillRenderer.drawFills(ctx as any, manyBars, { from: 1, to: 4 }, options);

      // Should only process bars 1, 2, 3 (indices from 1 to 4 exclusive)
      expect(ctx.moveTo).toHaveBeenCalledWith(20, 110);
    });

    it('should draw continuous fill path with correct coordinates', () => {
      TrendFillRenderer.drawFills(ctx as any, bars, { from: 0, to: 3 }, options);

      // Check path construction: move to first, line to each, then reverse base line
      expect(ctx.moveTo).toHaveBeenCalledWith(10, 100); // First trend point
      expect(ctx.lineTo).toHaveBeenCalledWith(10, 100); // First trend point
      expect(ctx.lineTo).toHaveBeenCalledWith(20, 110); // Second trend point
      expect(ctx.lineTo).toHaveBeenCalledWith(30, 120); // Third trend point
      expect(ctx.lineTo).toHaveBeenCalledWith(30, 150); // End base point
      expect(ctx.lineTo).toHaveBeenCalledWith(20, 150); // Reverse base
      expect(ctx.lineTo).toHaveBeenCalledWith(10, 150); // Start base point
    });
  });

  describe('drawTrendLine', () => {
    let ctx: ReturnType<typeof createMockContext>;
    let bars: TrendFillBarData[];
    let options: TrendFillRenderOptions;

    beforeEach(() => {
      ctx = createMockContext();
      bars = [
        { x: 10, trendLineY: 100, baseLineY: 150, trendDirection: 1, fillColor: 'green', lineColor: 'green' },
        { x: 20, trendLineY: 110, baseLineY: 150, trendDirection: 1, fillColor: 'green', lineColor: 'green' },
        { x: 30, trendLineY: 120, baseLineY: 150, trendDirection: 1, fillColor: 'green', lineColor: 'green' },
      ];
      options = {
        fillVisible: true,
        uptrendFillColor: 'green',
        downtrendFillColor: 'red',
        trendLineVisible: true,
        trendLineColor: 'blue',
        trendLineWidth: 2,
        trendLineStyle: LineStyle.Solid,
        baseLineVisible: true,
        baseLineColor: 'gray',
        baseLineWidth: 1,
        baseLineStyle: LineStyle.Solid,
      };
    });

    it('should return early if bars are empty', () => {
      TrendFillRenderer.drawTrendLine(ctx as any, [], { from: 0, to: 0 }, options);
      expect(ctx.stroke).not.toHaveBeenCalled();
    });

    it('should return early if visible range is null', () => {
      TrendFillRenderer.drawTrendLine(ctx as any, bars, null as any, options);
      expect(ctx.stroke).not.toHaveBeenCalled();
    });

    it('should set line width and style', () => {
      TrendFillRenderer.drawTrendLine(ctx as any, bars, { from: 0, to: 3 }, options);

      expect(ctx.lineWidth).toBe(2);
      expect(ctx.setLineDash).toHaveBeenCalledWith([]); // Solid style
      expect(ctx.lineCap).toBe('round');
      expect(ctx.lineJoin).toBe('round');
    });

    it('should apply pixel ratios to line width', () => {
      const vRatio = 1.5;
      TrendFillRenderer.drawTrendLine(ctx as any, bars, { from: 0, to: 3 }, options, 1, vRatio);

      expect(ctx.lineWidth).toBe(2 * vRatio);
    });

    it('should draw trend line with same color', () => {
      TrendFillRenderer.drawTrendLine(ctx as any, bars, { from: 0, to: 3 }, options);

      expect(ctx.strokeStyle).toBe('green');
      expect(ctx.stroke).toHaveBeenCalledTimes(1);
    });

    it('should create new path when line color changes', () => {
      const barsWithColorChange = [
        { x: 10, trendLineY: 100, baseLineY: 150, trendDirection: 1, fillColor: 'green', lineColor: 'green' },
        { x: 20, trendLineY: 110, baseLineY: 150, trendDirection: 1, fillColor: 'green', lineColor: 'green' },
        { x: 30, trendLineY: 120, baseLineY: 150, trendDirection: -1, fillColor: 'red', lineColor: 'red' },
      ];

      TrendFillRenderer.drawTrendLine(ctx as any, barsWithColorChange, { from: 0, to: 3 }, options);

      // Should stroke two separate paths (green then red)
      expect(ctx.stroke).toHaveBeenCalledTimes(2);
    });

    it('should skip undefined bars', () => {
      const spareBars = [
        bars[0],
        undefined as any,
        bars[2],
      ];

      TrendFillRenderer.drawTrendLine(ctx as any, spareBars, { from: 0, to: 3 }, options);

      expect(ctx.stroke).toHaveBeenCalled();
    });

    it('should apply pixel ratios to coordinates', () => {
      const hRatio = 2;
      const vRatio = 1.5;

      TrendFillRenderer.drawTrendLine(ctx as any, bars, { from: 0, to: 1 }, options, hRatio, vRatio);

      // Verify Path2D was created and used
      expect(global.Path2D).toHaveBeenCalled();
    });

    it('should handle dashed line style', () => {
      const dashedOptions = { ...options, trendLineStyle: LineStyle.Dashed };
      TrendFillRenderer.drawTrendLine(ctx as any, bars, { from: 0, to: 3 }, dashedOptions);

      expect(ctx.setLineDash).toHaveBeenCalledWith([4, 2]);
    });

    it('should handle visible range subset', () => {
      const manyBars = [
        { x: 10, trendLineY: 100, baseLineY: 150, trendDirection: 1, fillColor: 'green', lineColor: 'green' },
        { x: 20, trendLineY: 110, baseLineY: 150, trendDirection: 1, fillColor: 'green', lineColor: 'green' },
        { x: 30, trendLineY: 120, baseLineY: 150, trendDirection: 1, fillColor: 'green', lineColor: 'green' },
        { x: 40, trendLineY: 130, baseLineY: 150, trendDirection: 1, fillColor: 'green', lineColor: 'green' },
      ];

      TrendFillRenderer.drawTrendLine(ctx as any, manyBars, { from: 1, to: 3 }, options);

      // Should draw from index 1 to 2 (exclusive 3)
      expect(ctx.stroke).toHaveBeenCalled();
    });
  });

  describe('drawBaseLine', () => {
    let ctx: ReturnType<typeof createMockContext>;
    let bars: TrendFillBarData[];
    let options: TrendFillRenderOptions;

    beforeEach(() => {
      ctx = createMockContext();
      bars = [
        { x: 10, trendLineY: 100, baseLineY: 150, trendDirection: 1, fillColor: 'green', lineColor: 'green' },
        { x: 20, trendLineY: 110, baseLineY: 150, trendDirection: 1, fillColor: 'green', lineColor: 'green' },
        { x: 30, trendLineY: 120, baseLineY: 150, trendDirection: 1, fillColor: 'green', lineColor: 'green' },
      ];
      options = {
        fillVisible: true,
        uptrendFillColor: 'green',
        downtrendFillColor: 'red',
        trendLineVisible: true,
        trendLineColor: 'blue',
        trendLineWidth: 2,
        trendLineStyle: LineStyle.Solid,
        baseLineVisible: true,
        baseLineColor: 'gray',
        baseLineWidth: 1,
        baseLineStyle: LineStyle.Solid,
      };
    });

    it('should return early if bars are empty', () => {
      TrendFillRenderer.drawBaseLine(ctx as any, [], { from: 0, to: 0 }, options);
      expect(ctx.stroke).not.toHaveBeenCalled();
    });

    it('should return early if visible range is null', () => {
      TrendFillRenderer.drawBaseLine(ctx as any, bars, null as any, options);
      expect(ctx.stroke).not.toHaveBeenCalled();
    });

    it('should set base line color and width', () => {
      TrendFillRenderer.drawBaseLine(ctx as any, bars, { from: 0, to: 3 }, options);

      expect(ctx.strokeStyle).toBe('gray');
      expect(ctx.lineWidth).toBe(1);
      expect(ctx.lineJoin).toBe('round');
    });

    it('should apply pixel ratios to line width', () => {
      const vRatio = 2;
      TrendFillRenderer.drawBaseLine(ctx as any, bars, { from: 0, to: 3 }, options, 1, vRatio);

      expect(ctx.lineWidth).toBe(1 * vRatio);
    });

    it('should apply base line style', () => {
      TrendFillRenderer.drawBaseLine(ctx as any, bars, { from: 0, to: 3 }, options);

      expect(ctx.setLineDash).toHaveBeenCalledWith([]); // Solid style
    });

    it('should handle dashed base line style', () => {
      const dashedOptions = { ...options, baseLineStyle: LineStyle.Dashed };
      TrendFillRenderer.drawBaseLine(ctx as any, bars, { from: 0, to: 3 }, dashedOptions);

      expect(ctx.setLineDash).toHaveBeenCalledWith([4, 2]);
    });

    it('should draw base line through all visible bars', () => {
      TrendFillRenderer.drawBaseLine(ctx as any, bars, { from: 0, to: 3 }, options);

      // Should create a Path2D and stroke it
      expect(global.Path2D).toHaveBeenCalled();
      expect(ctx.stroke).toHaveBeenCalled();
    });

    it('should apply pixel ratios to coordinates', () => {
      const hRatio = 2;
      const vRatio = 1.5;

      TrendFillRenderer.drawBaseLine(ctx as any, bars, { from: 0, to: 1 }, options, hRatio, vRatio);

      // Verify Path2D was created
      expect(global.Path2D).toHaveBeenCalled();
    });

    it('should handle visible range subset', () => {
      const manyBars = [
        { x: 10, trendLineY: 100, baseLineY: 150, trendDirection: 1, fillColor: 'green', lineColor: 'green' },
        { x: 20, trendLineY: 110, baseLineY: 150, trendDirection: 1, fillColor: 'green', lineColor: 'green' },
        { x: 30, trendLineY: 120, baseLineY: 150, trendDirection: 1, fillColor: 'green', lineColor: 'green' },
        { x: 40, trendLineY: 130, baseLineY: 150, trendDirection: 1, fillColor: 'green', lineColor: 'green' },
      ];

      TrendFillRenderer.drawBaseLine(ctx as any, manyBars, { from: 1, to: 3 }, options);

      // Should create a Path2D and stroke it
      expect(global.Path2D).toHaveBeenCalled();
      expect(ctx.stroke).toHaveBeenCalled();
    });

    it('should handle dotted base line style', () => {
      const dottedOptions = { ...options, baseLineStyle: LineStyle.Dotted };
      TrendFillRenderer.drawBaseLine(ctx as any, bars, { from: 0, to: 3 }, dottedOptions);

      expect(ctx.setLineDash).toHaveBeenCalledWith([1, 1]);
    });
  });

  describe('Integration - Multiple render calls', () => {
    let ctx: ReturnType<typeof createMockContext>;
    let bars: TrendFillBarData[];
    let options: TrendFillRenderOptions;

    beforeEach(() => {
      ctx = createMockContext();
      bars = [
        { x: 10, trendLineY: 100, baseLineY: 150, trendDirection: 1, fillColor: 'green', lineColor: 'green' },
        { x: 20, trendLineY: 110, baseLineY: 150, trendDirection: 1, fillColor: 'green', lineColor: 'green' },
        { x: 30, trendLineY: 120, baseLineY: 150, trendDirection: -1, fillColor: 'red', lineColor: 'red' },
      ];
      options = {
        fillVisible: true,
        uptrendFillColor: 'green',
        downtrendFillColor: 'red',
        trendLineVisible: true,
        trendLineColor: 'blue',
        trendLineWidth: 2,
        trendLineStyle: LineStyle.Solid,
        baseLineVisible: true,
        baseLineColor: 'gray',
        baseLineWidth: 1,
        baseLineStyle: LineStyle.Solid,
      };
    });

    it('should render all components together', () => {
      const visibleRange = { from: 0, to: 3 };

      TrendFillRenderer.drawFills(ctx as any, bars, visibleRange, options);
      TrendFillRenderer.drawTrendLine(ctx as any, bars, visibleRange, options);
      TrendFillRenderer.drawBaseLine(ctx as any, bars, visibleRange, options);

      // Fills should be drawn (2 groups due to trend change)
      expect(ctx.fill).toHaveBeenCalledTimes(2);

      // Trend line should be drawn (2 colors)
      expect(ctx.stroke).toHaveBeenCalledTimes(3); // 2 trend + 1 base
    });

    it('should handle complex trend changes', () => {
      const complexBars = [
        { x: 10, trendLineY: 100, baseLineY: 150, trendDirection: 1, fillColor: 'green', lineColor: 'green' },
        { x: 20, trendLineY: 110, baseLineY: 150, trendDirection: 1, fillColor: 'green', lineColor: 'green' },
        { x: 30, trendLineY: 120, baseLineY: 150, trendDirection: 0, fillColor: 'gray', lineColor: 'gray' },
        { x: 40, trendLineY: 130, baseLineY: 150, trendDirection: -1, fillColor: 'red', lineColor: 'red' },
        { x: 50, trendLineY: 140, baseLineY: 150, trendDirection: -1, fillColor: 'red', lineColor: 'red' },
      ];

      TrendFillRenderer.drawFills(ctx as any, complexBars, { from: 0, to: 5 }, options);

      // Should have 2 groups: uptrend (0-1), downtrend (3-4), skipping neutral (2)
      expect(ctx.fill).toHaveBeenCalledTimes(2);
    });
  });
});
