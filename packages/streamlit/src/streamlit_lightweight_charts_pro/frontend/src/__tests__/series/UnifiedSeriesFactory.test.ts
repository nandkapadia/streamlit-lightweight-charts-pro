/**
 * @fileoverview Tests for UnifiedSeriesFactory - Series Title Handling
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createSeries,
  createSeriesWithConfig,
  ExtendedSeriesConfig,
} from '../../series/UnifiedSeriesFactory';
import { IChartApi } from 'lightweight-charts';

// Mock the logger
vi.mock('../../utils/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock cleanLineStyleOptions
vi.mock('../../utils/lineStyle', () => ({
  cleanLineStyleOptions: (options: any) => options,
}));

// Mock createSeriesMarkers
vi.mock('lightweight-charts', async () => {
  const actual = await vi.importActual('lightweight-charts');
  return {
    ...actual,
    createSeriesMarkers: vi.fn(),
  };
});

// Mock trade visualization
vi.mock('../../services/tradeVisualization', () => ({
  createTradeVisualElements: vi.fn(() => ({
    markers: [],
    rectangles: [],
  })),
}));

describe('UnifiedSeriesFactory - Title Handling', () => {
  let mockChart: IChartApi;
  let mockSeries: any;
  let capturedOptions: any = null;

  beforeEach(() => {
    mockSeries = {
      setData: vi.fn(),
      applyOptions: vi.fn(),
      options: vi.fn(() => ({})),
      createPriceLine: vi.fn(),
      priceScale: vi.fn(() => ({
        applyOptions: vi.fn(),
      })),
    };

    mockChart = {
      // New LightweightCharts v5+ API: addSeries(SeriesClass, options, paneId)
      addSeries: vi.fn((seriesClass: any, options: any, paneId?: number) => {
        capturedOptions = options; // Capture options for assertions
        return mockSeries;
      }),
      panes: vi.fn(() => []),
    } as unknown as IChartApi;

    capturedOptions = null;
    vi.clearAllMocks();
  });

  describe('createSeries - Basic Title Handling', () => {
    it('should pass title from options to series', () => {
      const options = {
        title: 'Custom Line Title',
        color: '#2196F3',
      };

      createSeries(mockChart, 'Line', [], options);

      expect(mockChart.addSeries).toHaveBeenCalled();
      expect(capturedOptions).toMatchObject({
        title: 'Custom Line Title',
        color: '#2196F3',
        _seriesType: 'Line',
      });
    });

    it('should work without title in options', () => {
      const options: Record<string, unknown> = {
        color: '#2196F3',
      };

      createSeries(mockChart, 'Line', [], options);

      expect(mockChart.addSeries).toHaveBeenCalled();
      expect(capturedOptions).toMatchObject({
        color: '#2196F3',
        _seriesType: 'Line',
      });
      expect(capturedOptions.title).toBeUndefined();
    });

    it('should handle empty string title', () => {
      const options = {
        title: '',
        color: '#2196F3',
      };

      createSeries(mockChart, 'Line', [], options);

      expect(capturedOptions).toMatchObject({
        title: '',
        color: '#2196F3',
      });
    });

    it('should handle title for different series types', () => {
      const seriesTypes = ['Area', 'Candlestick', 'Bar', 'Histogram'];

      seriesTypes.forEach(type => {
        vi.clearAllMocks();
        capturedOptions = null;

        const options = {
          title: `${type} Custom Title`,
        };

        createSeries(mockChart, type, [], options);

        expect(mockChart.addSeries).toHaveBeenCalled();
        expect(capturedOptions).toMatchObject({
          title: `${type} Custom Title`,
          _seriesType: type,
        });
      });
    });
  });

  describe('createSeriesWithConfig - Title Extraction', () => {
    it('should extract title from top-level config and merge into options', () => {
      const config: ExtendedSeriesConfig = {
        type: 'Line',
        data: [],
        options: {
          color: '#2196F3',
          lineWidth: 2,
        },
        title: 'NIFTY50 OHLC', // Top-level title (sent from Python)
      };

      createSeriesWithConfig(mockChart, config);

      // Title should be merged into options before passing to createSeries
      expect(mockChart.addSeries).toHaveBeenCalled();
      expect(capturedOptions).toMatchObject({
        title: 'NIFTY50 OHLC',
        color: '#2196F3',
        lineWidth: 2,
        _seriesType: 'Line',
      });
    });

    it('should prefer top-level title over options title', () => {
      const config: ExtendedSeriesConfig = {
        type: 'Line',
        data: [],
        options: {
          title: 'Options Title',
          color: '#2196F3',
        },
        title: 'Top Level Title', // Top-level title takes precedence (merged after options)
      };

      createSeriesWithConfig(mockChart, config);

      // Top-level title should take precedence (spread order: {...options, title})
      expect(capturedOptions.title).toBe('Top Level Title');
    });

    it('should handle missing title gracefully', () => {
      const config: ExtendedSeriesConfig = {
        type: 'Line',
        data: [],
        options: {
          color: '#2196F3',
        },
        // No title property
      };

      const series = createSeriesWithConfig(mockChart, config);

      expect(series).not.toBeNull();
      expect(mockChart.addSeries).toHaveBeenCalled();
    });

    it('should handle undefined title', () => {
      const config: ExtendedSeriesConfig = {
        type: 'Line',
        data: [],
        options: {
          color: '#2196F3',
        },
        title: undefined,
      };

      createSeriesWithConfig(mockChart, config);

      expect(mockChart.addSeries).toHaveBeenCalled();
      expect(capturedOptions).toMatchObject({
        color: '#2196F3',
      });
      // Should not include title if undefined
      expect(capturedOptions.title).toBeUndefined();
    });

    it('should work with empty options object', () => {
      const config: ExtendedSeriesConfig = {
        type: 'Line',
        data: [],
        options: {},
        title: 'Custom Title',
      };

      createSeriesWithConfig(mockChart, config);

      expect(capturedOptions).toMatchObject({
        title: 'Custom Title',
      });
    });

    it('should work without options object', () => {
      const config: ExtendedSeriesConfig = {
        type: 'Line',
        data: [],
        title: 'Custom Title',
      };

      createSeriesWithConfig(mockChart, config);

      expect(capturedOptions).toMatchObject({
        title: 'Custom Title',
      });
    });
  });

  describe('Python Integration - Title Flow', () => {
    it('should handle Python-serialized candlestick series with title', () => {
      // Simulates Python sending: candlestick_series.title = "NIFTY50 OHLC"
      const config: ExtendedSeriesConfig = {
        type: 'Candlestick',
        title: 'NIFTY50 OHLC', // Python sends title at top level
        data: [
          { time: '2024-01-01', open: 100, high: 105, low: 95, close: 102 },
          { time: '2024-01-02', open: 102, high: 108, low: 100, close: 107 },
        ],
        options: {
          upColor: '#26a69a',
          downColor: '#ef5350',
        },
      };

      createSeriesWithConfig(mockChart, config);

      expect(capturedOptions).toMatchObject({
        title: 'NIFTY50 OHLC',
        upColor: '#26a69a',
        downColor: '#ef5350',
        _seriesType: 'Candlestick',
      });
    });

    it('should handle Python-serialized line series with title', () => {
      // Simulates Python sending: line_series.title = "SMA 20"
      const config: ExtendedSeriesConfig = {
        type: 'Line',
        title: 'SMA 20',
        data: [
          { time: '2024-01-01', value: 100 },
          { time: '2024-01-02', value: 102 },
        ],
        options: {
          color: '#2196F3',
          lineWidth: 2,
        },
      };

      createSeriesWithConfig(mockChart, config);

      expect(capturedOptions).toMatchObject({
        title: 'SMA 20',
        color: '#2196F3',
        lineWidth: 2,
      });
    });

    it('should handle multiple series with different titles', () => {
      const configs: ExtendedSeriesConfig[] = [
        {
          type: 'Line',
          title: 'Price',
          data: [],
          options: { color: '#000000' },
        },
        {
          type: 'Line',
          title: 'SMA 50',
          data: [],
          options: { color: '#FF0000' },
        },
        {
          type: 'Line',
          title: 'EMA 20',
          data: [],
          options: { color: '#00FF00' },
        },
      ];

      configs.forEach(config => {
        vi.clearAllMocks();
        capturedOptions = null;
        createSeriesWithConfig(mockChart, config);

        expect(mockChart.addSeries).toHaveBeenCalled();
        expect(capturedOptions).toMatchObject({
          title: config.title,
          color: (config.options as any).color,
        });
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle title with special characters', () => {
      const config: ExtendedSeriesConfig = {
        type: 'Line',
        title: 'Price @ $100.50 (USD)',
        data: [],
      };

      createSeriesWithConfig(mockChart, config);

      expect(capturedOptions).toMatchObject({
        title: 'Price @ $100.50 (USD)',
      });
    });

    it('should handle very long title', () => {
      const longTitle = 'A'.repeat(200);
      const config: ExtendedSeriesConfig = {
        type: 'Line',
        title: longTitle,
        data: [],
      };

      createSeriesWithConfig(mockChart, config);

      expect(capturedOptions).toMatchObject({
        title: longTitle,
      });
    });

    it('should handle title with unicode characters', () => {
      const config: ExtendedSeriesConfig = {
        type: 'Line',
        title: '日本株価 📈',
        data: [],
      };

      createSeriesWithConfig(mockChart, config);

      expect(capturedOptions).toMatchObject({
        title: '日本株価 📈',
      });
    });

    it('should handle whitespace-only title', () => {
      const config: ExtendedSeriesConfig = {
        type: 'Line',
        title: '   ',
        data: [],
      };

      createSeriesWithConfig(mockChart, config);

      expect(capturedOptions).toMatchObject({
        title: '   ',
      });
    });
  });

  describe('Type Safety', () => {
    it('should handle title as string type', () => {
      const config: ExtendedSeriesConfig = {
        type: 'Line',
        title: 'String Title' as string,
        data: [],
      };

      createSeriesWithConfig(mockChart, config);

      expect(capturedOptions).toMatchObject({
        title: 'String Title',
      });
    });

    it('should handle title in ExtendedSeriesConfig type correctly', () => {
      // This test validates that title is properly typed in ExtendedSeriesConfig
      const config: ExtendedSeriesConfig = {
        type: 'Candlestick',
        title: 'Type Safe Title',
        data: [],
        options: {},
      };

      // TypeScript should not complain about title property
      expect(config.title).toBe('Type Safe Title');

      createSeriesWithConfig(mockChart, config);

      expect(capturedOptions).toMatchObject({
        title: 'Type Safe Title',
      });
    });
  });
});
