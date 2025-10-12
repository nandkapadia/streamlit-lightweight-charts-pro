/**
 * @fileoverview Coordinate Validation Test Suite
 *
 * Tests for coordinate validation utilities.
 */

// Unmock coordinate validation and its dependencies for this test file since we want to test the actual implementation
import { vi, describe, it, expect } from 'vitest';
vi.unmock('../../utils/coordinateValidation');
vi.unmock('../../config/positioningConfig');

import {
  validateChartCoordinates,
  validatePaneCoordinates,
  validateScaleDimensions,
  validateBoundingBox,
  sanitizeCoordinates,
  getCoordinateDebugInfo,
} from '../../utils/coordinateValidation';
import type {
  ChartCoordinates,
  PaneCoordinates,
  ScaleDimensions,
  BoundingBox,
} from '../../types/coordinates';

describe('coordinateValidation', () => {
  describe('validateChartCoordinates', () => {
    it('should validate complete chart coordinates successfully', () => {
      const validCoordinates: ChartCoordinates = {
        container: { width: 800, height: 400, offsetTop: 0, offsetLeft: 0 },
        timeScale: { x: 0, y: 370, width: 800, height: 30 },
        panes: [
          {
            width: 800,
            height: 370,
            x: 0,
            y: 0,
            paneId: 0,
            absoluteX: 0,
            absoluteY: 0,
            contentArea: { top: 0, left: 0, width: 800, height: 370 },
            margins: { top: 0, right: 0, bottom: 0, left: 0 },
            isMainPane: true,
            isLastPane: false,
          },
        ],
        priceScaleLeft: { x: 0, y: 0, width: 60, height: 370 },
        priceScaleRight: { x: 740, y: 0, width: 60, height: 370 },
        contentArea: { x: 60, y: 0, width: 680, height: 370 },
        timestamp: Date.now(),
        isValid: true,
      };

      const result = validateChartCoordinates(validCoordinates);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should detect missing container dimensions', () => {
      const invalidCoordinates = {
        timeScale: { x: 0, y: 370, width: 800, height: 30 },
        panes: [],
        priceScaleLeft: { x: 0, y: 0, width: 60, height: 370 },
        priceScaleRight: { x: 740, y: 0, width: 60, height: 370 },
        contentArea: { x: 60, y: 0, width: 680, height: 370 },
        timestamp: Date.now(),
        isValid: true,
      } as any;

      const result = validateChartCoordinates(invalidCoordinates);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing container dimensions');
    });

    it('should detect invalid container dimensions', () => {
      const invalidCoordinates: ChartCoordinates = {
        container: { width: 0, height: -100, offsetTop: 0, offsetLeft: 0 },
        timeScale: { x: 0, y: 370, width: 800, height: 30 },
        panes: [],
        priceScaleLeft: { x: 0, y: 0, width: 60, height: 370 },
        priceScaleRight: { x: 740, y: 0, width: 60, height: 370 },
        contentArea: { x: 60, y: 0, width: 680, height: 370 },
        timestamp: Date.now(),
        isValid: true,
      };

      const result = validateChartCoordinates(invalidCoordinates);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid container width: 0');
      expect(result.errors).toContain('Invalid container height: -100');
    });

    it('should warn about small container dimensions', () => {
      const smallCoordinates: ChartCoordinates = {
        container: { width: 100, height: 50, offsetTop: 0, offsetLeft: 0 },
        timeScale: { x: 0, y: 20, width: 100, height: 30 },
        panes: [],
        priceScaleLeft: { x: 0, y: 0, width: 60, height: 370 },
        priceScaleRight: { x: 740, y: 0, width: 60, height: 370 },
        contentArea: { x: 60, y: 0, width: 680, height: 370 },
        timestamp: Date.now(),
        isValid: true,
      };

      const result = validateChartCoordinates(smallCoordinates);

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.includes('below recommended minimum'))).toBe(true);
    });

    it('should detect missing time scale', () => {
      const invalidCoordinates = {
        container: { width: 800, height: 400, offsetTop: 0, offsetLeft: 0 },
        timeScale: null, // Explicitly set to null
        panes: [],
        priceScaleLeft: { x: 0, y: 0, width: 60, height: 370 },
        priceScaleRight: { x: 740, y: 0, width: 60, height: 370 },
        contentArea: { x: 60, y: 0, width: 680, height: 370 },
        timestamp: Date.now(),
        isValid: true,
      } as any;

      const result = validateChartCoordinates(invalidCoordinates);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing time scale dimensions');
    });
  });

  describe('validatePaneCoordinates', () => {
    it('should validate pane coordinates successfully', () => {
      const validPane: PaneCoordinates = {
        width: 800,
        height: 370,
        x: 0,
        y: 0,
        paneId: 0,
        absoluteX: 0,
        absoluteY: 0,
        contentArea: { top: 0, left: 0, width: 800, height: 370 },
        margins: { top: 0, right: 0, bottom: 0, left: 0 },
        isMainPane: true,
        isLastPane: false,
      };

      const result = validatePaneCoordinates(validPane, 0);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid pane dimensions', () => {
      const invalidPane: PaneCoordinates = {
        width: -100,
        height: 0,
        x: 0,
        y: 0,
        paneId: 0,
        absoluteX: 0,
        absoluteY: 0,
        contentArea: { top: 0, left: 0, width: -100, height: 0 },
        margins: { top: 0, right: 0, bottom: 0, left: 0 },
        isMainPane: true,
        isLastPane: false,
      };

      const result = validatePaneCoordinates(invalidPane, 0);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Pane 0: Invalid width (-100)');
      expect(result.errors).toContain('Pane 0: Invalid height (0)');
    });

    it('should detect invalid pane positioning', () => {
      const invalidPane: PaneCoordinates = {
        width: 800,
        height: 370,
        x: -5,
        y: -10,
        paneId: 1,
        absoluteX: -5,
        absoluteY: -10,
        contentArea: { top: -10, left: -5, width: 800, height: 370 },
        margins: { top: 0, right: 0, bottom: 0, left: 0 },
        isMainPane: true,
        isLastPane: false,
      };

      const result = validatePaneCoordinates(invalidPane, 1);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Pane 1: Invalid top position (-10)');
      expect(result.errors).toContain('Pane 1: Invalid left position (-5)');
    });
  });

  describe('validateScaleDimensions', () => {
    it('should validate scale dimensions successfully', () => {
      const validScale: ScaleDimensions = {
        x: 0,
        y: 0,
        width: 60,
        height: 370,
      };

      const result = validateScaleDimensions(validScale, 'priceScale');

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid scale dimensions', () => {
      const invalidScale: ScaleDimensions = {
        x: 0,
        y: 0,
        width: 0,
        height: -100,
      };

      const result = validateScaleDimensions(invalidScale, 'timeScale');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('timeScale: Invalid width (0)');
      expect(result.errors).toContain('timeScale: Invalid height (-100)');
    });

    it('should handle missing scale dimensions', () => {
      const result = validateScaleDimensions(null as any, 'priceScale');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('priceScale: Missing scale dimensions');
    });
  });

  describe('validateBoundingBox', () => {
    it('should validate bounding box successfully', () => {
      const validBox: BoundingBox = {
        x: 10,
        y: 20,
        width: 100,
        height: 50,
        top: 20,
        left: 10,
        right: 110,
        bottom: 70,
      };

      const result = validateBoundingBox(validBox);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid bounding box dimensions', () => {
      const invalidBox: BoundingBox = {
        x: 10,
        y: 20,
        width: 0,
        height: -50,
        top: 20,
        left: 10,
        right: 10,
        bottom: -30,
      };

      const result = validateBoundingBox(invalidBox);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('BoundingBox: Invalid width (0)');
      expect(result.errors).toContain('BoundingBox: Invalid height (-50)');
    });

    it('should handle missing bounding box', () => {
      const result = validateBoundingBox(null as any);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('BoundingBox: Missing bounding box data');
    });
  });

  describe('sanitizeCoordinates', () => {
    it('should sanitize and fallback invalid coordinates', () => {
      const invalidCoordinates: ChartCoordinates = {
        container: { width: -100, height: 0, offsetTop: 0, offsetLeft: 0 },
        timeScale: { x: 0, y: 0, width: -50, height: 0 },
        panes: [
          {
            width: 0,
            height: -100,
            x: -5,
            y: -10,
            paneId: 0,
            absoluteX: 0,
            absoluteY: 0,
            contentArea: { top: 0, left: 0, width: 0, height: 0 },
            margins: { top: 0, right: 0, bottom: 0, left: 0 },
            isMainPane: true,
            isLastPane: false,
          },
        ],
        priceScaleLeft: { x: 0, y: 0, width: 0, height: -100 },
        priceScaleRight: { x: 0, y: 0, width: 0, height: -100 },
        contentArea: { x: 0, y: 0, width: 0, height: 0 },
        timestamp: Date.now(),
        isValid: false,
      };

      const sanitized = sanitizeCoordinates(invalidCoordinates);

      expect(sanitized.container.width).toBeGreaterThan(0);
      expect(sanitized.container.height).toBeGreaterThan(0);
      expect(sanitized.timeScale.width).toBeGreaterThan(0);
      expect(sanitized.timeScale.height).toBeGreaterThan(0);
      expect(sanitized.panes[0].width).toBeGreaterThan(0);
      expect(sanitized.panes[0].height).toBeGreaterThan(0);
      expect(sanitized.panes[0].x).toBeGreaterThanOrEqual(0);
      expect(sanitized.panes[0].y).toBeGreaterThanOrEqual(0);
    });

    it('should preserve valid coordinates', () => {
      const validCoordinates: ChartCoordinates = {
        container: { width: 800, height: 400, offsetTop: 0, offsetLeft: 0 },
        timeScale: { x: 0, y: 370, width: 800, height: 30 },
        panes: [
          {
            width: 800,
            height: 370,
            x: 0,
            y: 0,
            paneId: 0,
            absoluteX: 0,
            absoluteY: 0,
            contentArea: { top: 0, left: 0, width: 800, height: 370 },
            margins: { top: 0, right: 0, bottom: 0, left: 0 },
            isMainPane: true,
            isLastPane: false,
          },
        ],
        priceScaleLeft: { x: 0, y: 0, width: 60, height: 370 },
        priceScaleRight: { x: 740, y: 0, width: 60, height: 370 },
        contentArea: { x: 60, y: 0, width: 680, height: 370 },
        timestamp: Date.now(),
        isValid: true,
      };

      const sanitized = sanitizeCoordinates(validCoordinates);

      expect(sanitized).toEqual(validCoordinates);
    });
  });

  describe('getCoordinateDebugInfo', () => {
    it('should provide comprehensive debug information', () => {
      const coordinates: ChartCoordinates = {
        container: { width: 800, height: 400, offsetTop: 0, offsetLeft: 0 },
        timeScale: { x: 0, y: 370, width: 800, height: 30 },
        panes: [
          {
            width: 800,
            height: 370,
            x: 0,
            y: 0,
            paneId: 0,
            absoluteX: 0,
            absoluteY: 0,
            contentArea: { top: 0, left: 0, width: 800, height: 370 },
            margins: { top: 0, right: 0, bottom: 0, left: 0 },
            isMainPane: true,
            isLastPane: false,
          },
        ],
        priceScaleLeft: { x: 0, y: 0, width: 60, height: 370 },
        priceScaleRight: { x: 740, y: 0, width: 60, height: 370 },
        contentArea: { x: 60, y: 0, width: 680, height: 370 },
        timestamp: Date.now(),
        isValid: true,
      };

      const debugInfo = getCoordinateDebugInfo(coordinates);

      expect(debugInfo).toHaveProperty('container');
      expect(debugInfo).toHaveProperty('timeScale');
      expect(debugInfo).toHaveProperty('panes');
      expect(debugInfo).toHaveProperty('priceScales');
      expect(debugInfo).toHaveProperty('validation');
      expect(debugInfo).toHaveProperty('summary');

      expect(debugInfo.summary).toContain('Container: 800x400');
      expect(debugInfo.summary).toContain('TimeScale: 800x30');
      expect(debugInfo.summary).toContain('Panes: 1');
      expect(debugInfo.summary).toContain('PriceScales: 2');
    });

    it('should handle invalid coordinates in debug info', () => {
      const invalidCoordinates = {
        container: null,
        timeScale: null,
        panes: [],
        priceScaleLeft: { x: 0, y: 0, width: 60, height: 370 },
        priceScaleRight: { x: 740, y: 0, width: 60, height: 370 },
        contentArea: { x: 60, y: 0, width: 680, height: 370 },
        timestamp: Date.now(),
        isValid: true,
      } as any;

      const debugInfo = getCoordinateDebugInfo(invalidCoordinates);

      expect(debugInfo.validation.isValid).toBe(false);
      expect(debugInfo.validation.errors.length).toBeGreaterThan(0);
    });
  });
});
