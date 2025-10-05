/**
 * @jest-environment jsdom
 */

import { describe, it, expect, vi } from 'vitest';

// Ensure we're using the actual module, not a mock
vi.unmock('../../config/positioningConfig');

import {
  MARGINS,
  DIMENSIONS,
  FALLBACKS,
  Z_INDEX,
  TIMING,
  getMargins,
  getDimensions,
  getFallback,
  validateConfiguration,
} from '../../config/positioningConfig';

describe('positioningConfig', () => {
  // ============================================================================
  // Constants Tests
  // ============================================================================

  describe('MARGINS', () => {
    it('should have legend margins defined', () => {
      expect(MARGINS.legend).toBeDefined();
      expect(MARGINS.legend.top).toBeDefined();
      expect(MARGINS.legend.right).toBeDefined();
      expect(MARGINS.legend.bottom).toBeDefined();
      expect(MARGINS.legend.left).toBeDefined();
    });

    it('should have pane margins defined', () => {
      expect(MARGINS.pane).toBeDefined();
      expect(MARGINS.pane.top).toBeDefined();
      expect(MARGINS.pane.right).toBeDefined();
      expect(MARGINS.pane.bottom).toBeDefined();
      expect(MARGINS.pane.left).toBeDefined();
    });

    it('should have content margins defined', () => {
      expect(MARGINS.content).toBeDefined();
      expect(MARGINS.content.top).toBeDefined();
      expect(MARGINS.content.right).toBeDefined();
      expect(MARGINS.content.bottom).toBeDefined();
      expect(MARGINS.content.left).toBeDefined();
    });

    it('should have tooltip margins defined', () => {
      expect(MARGINS.tooltip).toBeDefined();
      expect(MARGINS.tooltip.top).toBeDefined();
      expect(MARGINS.tooltip.right).toBeDefined();
      expect(MARGINS.tooltip.bottom).toBeDefined();
      expect(MARGINS.tooltip.left).toBeDefined();
    });

    it('should have all margins as numbers', () => {
      Object.values(MARGINS).forEach(margin => {
        expect(typeof margin.top).toBe('number');
        expect(typeof margin.right).toBe('number');
        expect(typeof margin.bottom).toBe('number');
        expect(typeof margin.left).toBe('number');
      });
    });

    it('should have non-negative margins', () => {
      Object.values(MARGINS).forEach(margin => {
        expect(margin.top).toBeGreaterThanOrEqual(0);
        expect(margin.right).toBeGreaterThanOrEqual(0);
        expect(margin.bottom).toBeGreaterThanOrEqual(0);
        expect(margin.left).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('DIMENSIONS', () => {
    describe('timeAxis', () => {
      it('should have timeAxis dimensions defined', () => {
        expect(DIMENSIONS.timeAxis).toBeDefined();
        expect(DIMENSIONS.timeAxis.defaultHeight).toBeDefined();
        expect(DIMENSIONS.timeAxis.minHeight).toBeDefined();
        expect(DIMENSIONS.timeAxis.maxHeight).toBeDefined();
      });

      it('should have valid timeAxis dimension values', () => {
        expect(DIMENSIONS.timeAxis.defaultHeight).toBeGreaterThan(0);
        expect(DIMENSIONS.timeAxis.minHeight).toBeGreaterThan(0);
        expect(DIMENSIONS.timeAxis.maxHeight).toBeGreaterThan(0);
      });

      it('should have timeAxis min < default < max', () => {
        expect(DIMENSIONS.timeAxis.minHeight).toBeLessThanOrEqual(
          DIMENSIONS.timeAxis.defaultHeight
        );
        expect(DIMENSIONS.timeAxis.defaultHeight).toBeLessThanOrEqual(
          DIMENSIONS.timeAxis.maxHeight
        );
      });
    });

    describe('priceScale', () => {
      it('should have priceScale dimensions defined', () => {
        expect(DIMENSIONS.priceScale).toBeDefined();
        expect(DIMENSIONS.priceScale.defaultWidth).toBeDefined();
        expect(DIMENSIONS.priceScale.minWidth).toBeDefined();
        expect(DIMENSIONS.priceScale.maxWidth).toBeDefined();
        expect(DIMENSIONS.priceScale.rightScaleDefaultWidth).toBeDefined();
      });

      it('should have valid priceScale dimension values', () => {
        expect(DIMENSIONS.priceScale.defaultWidth).toBeGreaterThan(0);
        expect(DIMENSIONS.priceScale.minWidth).toBeGreaterThan(0);
        expect(DIMENSIONS.priceScale.maxWidth).toBeGreaterThan(0);
        expect(DIMENSIONS.priceScale.rightScaleDefaultWidth).toBeGreaterThanOrEqual(0);
      });

      it('should have priceScale min < default < max', () => {
        expect(DIMENSIONS.priceScale.minWidth).toBeLessThanOrEqual(
          DIMENSIONS.priceScale.defaultWidth
        );
        expect(DIMENSIONS.priceScale.defaultWidth).toBeLessThanOrEqual(
          DIMENSIONS.priceScale.maxWidth
        );
      });
    });

    describe('legend', () => {
      it('should have legend dimensions defined', () => {
        expect(DIMENSIONS.legend).toBeDefined();
        expect(DIMENSIONS.legend.defaultHeight).toBeDefined();
        expect(DIMENSIONS.legend.minHeight).toBeDefined();
        expect(DIMENSIONS.legend.maxHeight).toBeDefined();
        expect(DIMENSIONS.legend.defaultWidth).toBeDefined();
        expect(DIMENSIONS.legend.minWidth).toBeDefined();
      });

      it('should have valid legend dimension values', () => {
        expect(DIMENSIONS.legend.defaultHeight).toBeGreaterThan(0);
        expect(DIMENSIONS.legend.minHeight).toBeGreaterThan(0);
        expect(DIMENSIONS.legend.maxHeight).toBeGreaterThan(0);
        expect(DIMENSIONS.legend.defaultWidth).toBeGreaterThan(0);
        expect(DIMENSIONS.legend.minWidth).toBeGreaterThan(0);
      });

      it('should have legend min dimensions < default dimensions', () => {
        expect(DIMENSIONS.legend.minHeight).toBeLessThanOrEqual(DIMENSIONS.legend.defaultHeight);
        expect(DIMENSIONS.legend.minWidth).toBeLessThanOrEqual(DIMENSIONS.legend.defaultWidth);
      });
    });

    describe('pane', () => {
      it('should have pane dimensions defined', () => {
        expect(DIMENSIONS.pane).toBeDefined();
        expect(DIMENSIONS.pane.defaultHeight).toBeDefined();
        expect(DIMENSIONS.pane.minHeight).toBeDefined();
        expect(DIMENSIONS.pane.maxHeight).toBeDefined();
        expect(DIMENSIONS.pane.minWidth).toBeDefined();
        expect(DIMENSIONS.pane.maxWidth).toBeDefined();
      });

      it('should have valid pane dimension values', () => {
        expect(DIMENSIONS.pane.defaultHeight).toBeGreaterThan(0);
        expect(DIMENSIONS.pane.minHeight).toBeGreaterThan(0);
        expect(DIMENSIONS.pane.maxHeight).toBeGreaterThan(0);
        expect(DIMENSIONS.pane.minWidth).toBeGreaterThan(0);
        expect(DIMENSIONS.pane.maxWidth).toBeGreaterThan(0);
      });

      it('should have pane min < default < max', () => {
        expect(DIMENSIONS.pane.minHeight).toBeLessThanOrEqual(DIMENSIONS.pane.defaultHeight);
        expect(DIMENSIONS.pane.defaultHeight).toBeLessThanOrEqual(DIMENSIONS.pane.maxHeight);
        expect(DIMENSIONS.pane.minWidth).toBeLessThanOrEqual(DIMENSIONS.pane.maxWidth);
      });
    });

    describe('chart', () => {
      it('should have chart dimensions defined', () => {
        expect(DIMENSIONS.chart).toBeDefined();
        expect(DIMENSIONS.chart.defaultWidth).toBeDefined();
        expect(DIMENSIONS.chart.defaultHeight).toBeDefined();
        expect(DIMENSIONS.chart.minWidth).toBeDefined();
        expect(DIMENSIONS.chart.minHeight).toBeDefined();
      });

      it('should have valid chart dimension values', () => {
        expect(DIMENSIONS.chart.defaultWidth).toBeGreaterThan(0);
        expect(DIMENSIONS.chart.defaultHeight).toBeGreaterThan(0);
        expect(DIMENSIONS.chart.minWidth).toBeGreaterThan(0);
        expect(DIMENSIONS.chart.minHeight).toBeGreaterThan(0);
      });

      it('should have chart min dimensions < default dimensions', () => {
        expect(DIMENSIONS.chart.minWidth).toBeLessThanOrEqual(DIMENSIONS.chart.defaultWidth);
        expect(DIMENSIONS.chart.minHeight).toBeLessThanOrEqual(DIMENSIONS.chart.defaultHeight);
      });
    });
  });

  describe('FALLBACKS', () => {
    it('should have all fallback values defined', () => {
      expect(FALLBACKS.paneHeight).toBeDefined();
      expect(FALLBACKS.paneWidth).toBeDefined();
      expect(FALLBACKS.chartWidth).toBeDefined();
      expect(FALLBACKS.chartHeight).toBeDefined();
      expect(FALLBACKS.timeScaleHeight).toBeDefined();
      expect(FALLBACKS.priceScaleWidth).toBeDefined();
      expect(FALLBACKS.containerWidth).toBeDefined();
      expect(FALLBACKS.containerHeight).toBeDefined();
    });

    it('should have all fallbacks as numbers', () => {
      Object.values(FALLBACKS).forEach(value => {
        expect(typeof value).toBe('number');
      });
    });

    it('should have all fallbacks > 0', () => {
      Object.values(FALLBACKS).forEach(value => {
        expect(value).toBeGreaterThan(0);
      });
    });

    it('should match corresponding default dimensions', () => {
      expect(FALLBACKS.chartWidth).toBe(DIMENSIONS.chart.defaultWidth);
      expect(FALLBACKS.chartHeight).toBe(DIMENSIONS.chart.defaultHeight);
      expect(FALLBACKS.timeScaleHeight).toBe(DIMENSIONS.timeAxis.defaultHeight);
      expect(FALLBACKS.priceScaleWidth).toBe(DIMENSIONS.priceScale.defaultWidth);
    });
  });

  describe('Z_INDEX', () => {
    it('should have all z-index values defined', () => {
      expect(Z_INDEX.background).toBeDefined();
      expect(Z_INDEX.chart).toBeDefined();
      expect(Z_INDEX.pane).toBeDefined();
      expect(Z_INDEX.series).toBeDefined();
      expect(Z_INDEX.overlay).toBeDefined();
      expect(Z_INDEX.legend).toBeDefined();
      expect(Z_INDEX.tooltip).toBeDefined();
      expect(Z_INDEX.modal).toBeDefined();
    });

    it('should have all z-index values as numbers', () => {
      Object.values(Z_INDEX).forEach(value => {
        expect(typeof value).toBe('number');
      });
    });

    it('should have all z-index values >= 0', () => {
      Object.values(Z_INDEX).forEach(value => {
        expect(value).toBeGreaterThanOrEqual(0);
      });
    });

    it('should have z-index values in correct stacking order', () => {
      expect(Z_INDEX.background).toBeLessThan(Z_INDEX.chart);
      expect(Z_INDEX.chart).toBeLessThan(Z_INDEX.pane);
      expect(Z_INDEX.pane).toBeLessThan(Z_INDEX.series);
      expect(Z_INDEX.series).toBeLessThan(Z_INDEX.overlay);
      expect(Z_INDEX.overlay).toBeLessThan(Z_INDEX.legend);
      expect(Z_INDEX.legend).toBeLessThan(Z_INDEX.tooltip);
      expect(Z_INDEX.tooltip).toBeLessThan(Z_INDEX.modal);
    });
  });

  describe('TIMING', () => {
    it('should have all timing values defined', () => {
      expect(TIMING.cacheExpiration).toBeDefined();
      expect(TIMING.cacheCleanupInterval).toBeDefined();
      expect(TIMING.debounceDelay).toBeDefined();
      expect(TIMING.throttleDelay).toBeDefined();
      expect(TIMING.animationDuration).toBeDefined();
    });

    it('should have all timing values as numbers', () => {
      Object.values(TIMING).forEach(value => {
        expect(typeof value).toBe('number');
      });
    });

    it('should have all timing values > 0', () => {
      Object.values(TIMING).forEach(value => {
        expect(value).toBeGreaterThan(0);
      });
    });

    it('should have cache cleanup interval > cache expiration', () => {
      expect(TIMING.cacheCleanupInterval).toBeGreaterThan(TIMING.cacheExpiration);
    });

    it('should have reasonable timing values', () => {
      expect(TIMING.debounceDelay).toBeLessThan(1000); // < 1 second
      expect(TIMING.throttleDelay).toBeLessThan(1000); // < 1 second
      expect(TIMING.animationDuration).toBeLessThan(1000); // < 1 second
      expect(TIMING.cacheExpiration).toBeLessThan(60000); // < 1 minute
    });
  });

  // ============================================================================
  // Helper Functions Tests
  // ============================================================================

  describe('getMargins()', () => {
    it('should return legend margins', () => {
      const margins = getMargins('legend');
      expect(margins).toEqual(MARGINS.legend);
    });

    it('should return pane margins', () => {
      const margins = getMargins('pane');
      expect(margins).toEqual(MARGINS.pane);
    });

    it('should return content margins', () => {
      const margins = getMargins('content');
      expect(margins).toEqual(MARGINS.content);
    });

    it('should return tooltip margins', () => {
      const margins = getMargins('tooltip');
      expect(margins).toEqual(MARGINS.tooltip);
    });

    it('should return content margins for unknown feature', () => {
      const margins = getMargins('unknown' as any);
      expect(margins).toEqual(MARGINS.content);
    });
  });

  describe('getDimensions()', () => {
    it('should return timeAxis dimensions', () => {
      const dims = getDimensions('timeAxis');
      expect(dims).toEqual(DIMENSIONS.timeAxis);
    });

    it('should return priceScale dimensions', () => {
      const dims = getDimensions('priceScale');
      expect(dims).toEqual(DIMENSIONS.priceScale);
    });

    it('should return legend dimensions', () => {
      const dims = getDimensions('legend');
      expect(dims).toEqual(DIMENSIONS.legend);
    });

    it('should return pane dimensions', () => {
      const dims = getDimensions('pane');
      expect(dims).toEqual(DIMENSIONS.pane);
    });

    it('should return chart dimensions', () => {
      const dims = getDimensions('chart');
      expect(dims).toEqual(DIMENSIONS.chart);
    });

    it('should return chart dimensions for unknown component', () => {
      const dims = getDimensions('unknown' as any);
      expect(dims).toEqual(DIMENSIONS.chart);
    });
  });

  describe('getFallback()', () => {
    it('should return paneHeight fallback', () => {
      expect(getFallback('paneHeight')).toBe(FALLBACKS.paneHeight);
    });

    it('should return paneWidth fallback', () => {
      expect(getFallback('paneWidth')).toBe(FALLBACKS.paneWidth);
    });

    it('should return chartWidth fallback', () => {
      expect(getFallback('chartWidth')).toBe(FALLBACKS.chartWidth);
    });

    it('should return chartHeight fallback', () => {
      expect(getFallback('chartHeight')).toBe(FALLBACKS.chartHeight);
    });

    it('should return timeScaleHeight fallback', () => {
      expect(getFallback('timeScaleHeight')).toBe(FALLBACKS.timeScaleHeight);
    });

    it('should return priceScaleWidth fallback', () => {
      expect(getFallback('priceScaleWidth')).toBe(FALLBACKS.priceScaleWidth);
    });

    it('should return containerWidth fallback', () => {
      expect(getFallback('containerWidth')).toBe(FALLBACKS.containerWidth);
    });

    it('should return containerHeight fallback', () => {
      expect(getFallback('containerHeight')).toBe(FALLBACKS.containerHeight);
    });

    it('should return 0 for unknown fallback type', () => {
      expect(getFallback('unknown' as any)).toBe(0);
    });
  });

  describe('validateConfiguration()', () => {
    it('should return true for valid configuration', () => {
      expect(validateConfiguration()).toBe(true);
    });

    it('should validate all dimensions are positive', () => {
      // This test verifies the validation logic itself
      // All actual dimensions should be positive
      expect(validateConfiguration()).toBe(true);
    });

    it('should validate min < max for timeAxis', () => {
      expect(DIMENSIONS.timeAxis.minHeight).toBeLessThanOrEqual(DIMENSIONS.timeAxis.maxHeight);
    });

    it('should validate min < max for priceScale', () => {
      expect(DIMENSIONS.priceScale.minWidth).toBeLessThanOrEqual(DIMENSIONS.priceScale.maxWidth);
    });
  });

  // ============================================================================
  // Type Safety Tests
  // ============================================================================

  describe('Type Safety', () => {
    it('should have readonly MARGINS type', () => {
      // TypeScript should prevent modification, but runtime doesn't enforce
      // Just verify the constants exist and are accessible
      expect(MARGINS).toBeDefined();
      expect(Object.keys(MARGINS).length).toBeGreaterThan(0);
    });

    it('should have readonly DIMENSIONS type', () => {
      expect(DIMENSIONS).toBeDefined();
      expect(Object.keys(DIMENSIONS).length).toBeGreaterThan(0);
    });

    it('should have readonly FALLBACKS type', () => {
      expect(FALLBACKS).toBeDefined();
      expect(Object.keys(FALLBACKS).length).toBeGreaterThan(0);
    });

    it('should have readonly Z_INDEX type', () => {
      expect(Z_INDEX).toBeDefined();
      expect(Object.keys(Z_INDEX).length).toBeGreaterThan(0);
    });

    it('should have readonly TIMING type', () => {
      expect(TIMING).toBeDefined();
      expect(Object.keys(TIMING).length).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // Edge Cases Tests
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle getMargins with undefined', () => {
      const margins = getMargins(undefined as any);
      expect(margins).toEqual(MARGINS.content);
    });

    it('should handle getDimensions with undefined', () => {
      const dims = getDimensions(undefined as any);
      expect(dims).toEqual(DIMENSIONS.chart);
    });

    it('should handle getDimensions with null', () => {
      const dims = getDimensions(null as any);
      expect(dims).toEqual(DIMENSIONS.chart);
    });

    it('should handle getFallback with undefined', () => {
      expect(getFallback(undefined as any)).toBe(0);
    });

    it('should handle getFallback with null', () => {
      expect(getFallback(null as any)).toBe(0);
    });
  });
});
