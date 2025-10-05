/**
 * @fileoverview Tests for ChartMetadata Component
 *
 * Tests cover:
 * - Component structure and exports
 * - useChartMetadata hook
 * - Metadata presets (candlestick, line, area, histogram)
 * - Hook update functions
 * - Edge cases and validation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  ChartMetadata,
  useChartMetadata,
  ChartMetadataPresets,
} from '../../components/ChartMetadata';

describe('ChartMetadata', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock console methods
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Component Structure', () => {
    it('should be exported as a React component', () => {
      expect(ChartMetadata).toBeDefined();
      expect(typeof ChartMetadata).toBe('object'); // React.memo wraps as object
    });

    it('should have displayName', () => {
      expect(ChartMetadata.displayName).toBe('ChartMetadata');
    });

    it('should be a memo component', () => {
      expect((ChartMetadata as any).$$typeof).toBeDefined();
    });
  });

  describe('useChartMetadata Hook', () => {
    it('should initialize with provided metadata', () => {
      const initialMetadata = {
        title: 'Test Chart',
        description: 'Test Description',
      };

      const { result } = renderHook(() => useChartMetadata('chart-1', initialMetadata));

      expect(result.current.metadata.title).toBe('Test Chart');
      expect(result.current.metadata.description).toBe('Test Description');
    });

    it('should initialize with empty metadata', () => {
      const { result } = renderHook(() => useChartMetadata('chart-1', {}));

      expect(result.current.metadata).toEqual({});
    });

    it('should provide updateMetadata function', () => {
      const { result } = renderHook(() => useChartMetadata('chart-1', {}));

      expect(result.current.updateMetadata).toBeDefined();
      expect(typeof result.current.updateMetadata).toBe('function');
    });

    it('should provide updateTitle function', () => {
      const { result } = renderHook(() => useChartMetadata('chart-1', {}));

      expect(result.current.updateTitle).toBeDefined();
      expect(typeof result.current.updateTitle).toBe('function');
    });

    it('should update title when updateTitle is called', () => {
      const { result } = renderHook(() => useChartMetadata('chart-1', {}));

      act(() => {
        result.current.updateTitle('New Title');
      });

      expect(result.current.metadata.title).toBe('New Title');
    });

    it('should provide updateDescription function', () => {
      const { result } = renderHook(() => useChartMetadata('chart-1', {}));

      expect(result.current.updateDescription).toBeDefined();
      expect(typeof result.current.updateDescription).toBe('function');
    });

    it('should update description when updateDescription is called', () => {
      const { result } = renderHook(() => useChartMetadata('chart-1', {}));

      act(() => {
        result.current.updateDescription('New Description');
      });

      expect(result.current.metadata.description).toBe('New Description');
    });

    it('should provide updateDataInfo function', () => {
      const { result } = renderHook(() => useChartMetadata('chart-1', {}));

      expect(result.current.updateDataInfo).toBeDefined();
      expect(typeof result.current.updateDataInfo).toBe('function');
    });

    it('should update data points when updateDataInfo is called', () => {
      const { result } = renderHook(() => useChartMetadata('chart-1', {}));

      act(() => {
        result.current.updateDataInfo(100);
      });

      expect(result.current.metadata.dataPoints).toBe(100);
    });

    it('should update data points and date range when updateDataInfo is called', () => {
      const { result } = renderHook(() => useChartMetadata('chart-1', {}));

      const dateRange = { start: '2024-01-01', end: '2024-12-31' };
      act(() => {
        result.current.updateDataInfo(100, dateRange);
      });

      expect(result.current.metadata.dataPoints).toBe(100);
      expect(result.current.metadata.dateRange).toEqual(dateRange);
    });

    it('should provide updateTheme function', () => {
      const { result } = renderHook(() => useChartMetadata('chart-1', {}));

      expect(result.current.updateTheme).toBeDefined();
      expect(typeof result.current.updateTheme).toBe('function');
    });

    it('should update theme when updateTheme is called', () => {
      const { result } = renderHook(() => useChartMetadata('chart-1', {}));

      act(() => {
        result.current.updateTheme('dark');
      });

      expect(result.current.metadata.theme).toBe('dark');
    });

    it('should handle multiple updates', () => {
      const { result } = renderHook(() => useChartMetadata('chart-1', {}));

      act(() => {
        result.current.updateTitle('Title 1');
        result.current.updateDescription('Desc 1');
        result.current.updateTheme('light');
      });

      expect(result.current.metadata.title).toBe('Title 1');
      expect(result.current.metadata.description).toBe('Desc 1');
      expect(result.current.metadata.theme).toBe('light');
    });

    it('should merge updates with existing metadata', () => {
      const { result } = renderHook(() => useChartMetadata('chart-1', { title: 'Initial' }));

      act(() => {
        result.current.updateDescription('New Description');
      });

      expect(result.current.metadata.title).toBe('Initial');
      expect(result.current.metadata.description).toBe('New Description');
    });

    it('should allow overwriting metadata with updateMetadata', () => {
      const { result } = renderHook(() => useChartMetadata('chart-1', { title: 'Initial' }));

      act(() => {
        result.current.updateMetadata({ description: 'New Desc', keywords: ['test'] });
      });

      expect(result.current.metadata.title).toBe('Initial');
      expect(result.current.metadata.description).toBe('New Desc');
      expect(result.current.metadata.keywords).toEqual(['test']);
    });
  });

  describe('ChartMetadataPresets', () => {
    it('should provide candlestick preset', () => {
      const preset = ChartMetadataPresets.candlestick('chart-1');

      expect(preset).toBeDefined();
      expect(preset.title).toContain('Candlestick');
      expect(preset.chartType).toBe('candlestick');
      expect(preset.keywords).toContain('candlestick');
      expect(preset.keywords).toContain('OHLC');
      expect(preset.keywords).toContain('trading');
    });

    it('should provide line preset', () => {
      const preset = ChartMetadataPresets.line('chart-1');

      expect(preset).toBeDefined();
      expect(preset.title).toContain('Line');
      expect(preset.chartType).toBe('line');
      expect(preset.keywords).toContain('line chart');
      expect(preset.keywords).toContain('trend');
    });

    it('should provide area preset', () => {
      const preset = ChartMetadataPresets.area('chart-1');

      expect(preset).toBeDefined();
      expect(preset.title).toContain('Area');
      expect(preset.chartType).toBe('area');
      expect(preset.keywords).toContain('area chart');
      expect(preset.keywords).toContain('filled');
    });

    it('should provide histogram preset', () => {
      const preset = ChartMetadataPresets.histogram('chart-1');

      expect(preset).toBeDefined();
      expect(preset.title).toContain('Histogram');
      expect(preset.chartType).toBe('histogram');
      expect(preset.keywords).toContain('histogram');
      expect(preset.keywords).toContain('distribution');
    });

    it('should include chartId in all presets', () => {
      const chartId = 'my-chart-123';

      expect(ChartMetadataPresets.candlestick(chartId).title).toContain(chartId);
      expect(ChartMetadataPresets.line(chartId).title).toContain(chartId);
      expect(ChartMetadataPresets.area(chartId).title).toContain(chartId);
      expect(ChartMetadataPresets.histogram(chartId).title).toContain(chartId);
    });

    it('should provide unique keywords for each preset', () => {
      const candlestick = ChartMetadataPresets.candlestick('chart-1');
      const line = ChartMetadataPresets.line('chart-1');

      expect(candlestick.keywords).not.toEqual(line.keywords);
    });

    it('should include description in all presets', () => {
      expect(ChartMetadataPresets.candlestick('chart-1').description).toBeDefined();
      expect(ChartMetadataPresets.line('chart-1').description).toBeDefined();
      expect(ChartMetadataPresets.area('chart-1').description).toBeDefined();
      expect(ChartMetadataPresets.histogram('chart-1').description).toBeDefined();
    });

    it('should include chartType in all presets', () => {
      expect(ChartMetadataPresets.candlestick('chart-1').chartType).toBe('candlestick');
      expect(ChartMetadataPresets.line('chart-1').chartType).toBe('line');
      expect(ChartMetadataPresets.area('chart-1').chartType).toBe('area');
      expect(ChartMetadataPresets.histogram('chart-1').chartType).toBe('histogram');
    });

    it('should have appropriate keywords for candlestick', () => {
      const preset = ChartMetadataPresets.candlestick('chart-1');
      expect(preset.keywords).toContain('price action');
      expect(preset.keywords).toContain('technical analysis');
    });

    it('should have appropriate keywords for line chart', () => {
      const preset = ChartMetadataPresets.line('chart-1');
      expect(preset.keywords).toContain('time series');
      expect(preset.keywords).toContain('data visualization');
    });

    it('should have appropriate keywords for area chart', () => {
      const preset = ChartMetadataPresets.area('chart-1');
      expect(preset.keywords).toContain('volume');
      expect(preset.keywords).toContain('magnitude');
    });

    it('should have appropriate keywords for histogram', () => {
      const preset = ChartMetadataPresets.histogram('chart-1');
      expect(preset.keywords).toContain('frequency');
      expect(preset.keywords).toContain('statistical analysis');
    });
  });

  describe('Metadata Updates', () => {
    it('should allow incremental metadata updates', () => {
      const { result } = renderHook(() => useChartMetadata('chart-1', { title: 'Initial' }));

      act(() => {
        result.current.updateDescription('Description');
      });

      expect(result.current.metadata.title).toBe('Initial');
      expect(result.current.metadata.description).toBe('Description');
    });

    it('should allow overwriting metadata', () => {
      const { result } = renderHook(() => useChartMetadata('chart-1', { title: 'Initial' }));

      act(() => {
        result.current.updateTitle('Updated');
      });

      expect(result.current.metadata.title).toBe('Updated');
    });

    it('should handle rapid successive updates', () => {
      const { result } = renderHook(() => useChartMetadata('chart-1', {}));

      act(() => {
        result.current.updateTitle('Title 1');
        result.current.updateTitle('Title 2');
        result.current.updateTitle('Title 3');
      });

      expect(result.current.metadata.title).toBe('Title 3');
    });

    it('should update multiple fields at once with updateMetadata', () => {
      const { result } = renderHook(() => useChartMetadata('chart-1', {}));

      act(() => {
        result.current.updateMetadata({
          title: 'Title',
          description: 'Description',
          keywords: ['key1', 'key2'],
          theme: 'dark',
        });
      });

      expect(result.current.metadata.title).toBe('Title');
      expect(result.current.metadata.description).toBe('Description');
      expect(result.current.metadata.keywords).toEqual(['key1', 'key2']);
      expect(result.current.metadata.theme).toBe('dark');
    });
  });

  describe('Preset Integration', () => {
    it('should initialize with candlestick preset', () => {
      const preset = ChartMetadataPresets.candlestick('chart-1');
      const { result } = renderHook(() => useChartMetadata('chart-1', preset));

      expect(result.current.metadata.keywords).toContain('candlestick');
      expect(result.current.metadata.chartType).toBe('candlestick');
    });

    it('should allow updating preset metadata', () => {
      const preset = ChartMetadataPresets.line('chart-1');
      const { result } = renderHook(() => useChartMetadata('chart-1', preset));

      act(() => {
        result.current.updateTitle('Custom Line Chart');
      });

      expect(result.current.metadata.title).toBe('Custom Line Chart');
      expect(result.current.metadata.chartType).toBe('line');
    });

    it('should preserve preset keywords when updating title', () => {
      const preset = ChartMetadataPresets.histogram('chart-1');
      const { result } = renderHook(() => useChartMetadata('chart-1', preset));

      act(() => {
        result.current.updateTitle('My Histogram');
      });

      expect(result.current.metadata.keywords).toContain('histogram');
      expect(result.current.metadata.keywords).toContain('distribution');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty metadata object', () => {
      const { result } = renderHook(() => useChartMetadata('chart-1', {}));

      expect(result.current.metadata).toEqual({});
    });

    it('should handle very long titles', () => {
      const longTitle = 'A'.repeat(500);
      const { result } = renderHook(() => useChartMetadata('chart-1', {}));

      act(() => {
        result.current.updateTitle(longTitle);
      });

      expect(result.current.metadata.title).toBe(longTitle);
    });

    it('should handle very long descriptions', () => {
      const longDescription = 'B'.repeat(1000);
      const { result } = renderHook(() => useChartMetadata('chart-1', {}));

      act(() => {
        result.current.updateDescription(longDescription);
      });

      expect(result.current.metadata.description).toBe(longDescription);
    });

    it('should handle special characters in title', () => {
      const specialTitle = 'Chart <script>alert("xss")</script>';
      const { result } = renderHook(() => useChartMetadata('chart-1', {}));

      act(() => {
        result.current.updateTitle(specialTitle);
      });

      expect(result.current.metadata.title).toBe(specialTitle);
    });

    it('should handle many keywords', () => {
      const manyKeywords = Array.from({ length: 100 }, (_, i) => `keyword${i}`);
      const { result } = renderHook(() => useChartMetadata('chart-1', {}));

      act(() => {
        result.current.updateMetadata({ keywords: manyKeywords });
      });

      expect(result.current.metadata.keywords).toHaveLength(100);
    });

    it('should handle empty chartId', () => {
      const { result } = renderHook(() => useChartMetadata('', {}));

      expect(result.current.metadata).toBeDefined();
    });

    it('should handle both light and dark themes', () => {
      const { result } = renderHook(() => useChartMetadata('chart-1', {}));

      act(() => {
        result.current.updateTheme('light');
      });
      expect(result.current.metadata.theme).toBe('light');

      act(() => {
        result.current.updateTheme('dark');
      });
      expect(result.current.metadata.theme).toBe('dark');
    });

    it('should handle timestamp date ranges', () => {
      const { result } = renderHook(() => useChartMetadata('chart-1', {}));

      const dateRange = { start: 1704067200, end: 1735689600 };
      act(() => {
        result.current.updateDataInfo(100, dateRange);
      });

      expect(result.current.metadata.dateRange).toEqual(dateRange);
    });

    it('should handle string date ranges', () => {
      const { result } = renderHook(() => useChartMetadata('chart-1', {}));

      const dateRange = { start: '2024-01-01', end: '2024-12-31' };
      act(() => {
        result.current.updateDataInfo(100, dateRange);
      });

      expect(result.current.metadata.dateRange).toEqual(dateRange);
    });

    it('should handle data points without date range', () => {
      const { result } = renderHook(() => useChartMetadata('chart-1', {}));

      act(() => {
        result.current.updateDataInfo(500);
      });

      expect(result.current.metadata.dataPoints).toBe(500);
      expect(result.current.metadata.dateRange).toBeUndefined();
    });

    it('should handle zero data points', () => {
      const { result } = renderHook(() => useChartMetadata('chart-1', {}));

      act(() => {
        result.current.updateDataInfo(0);
      });

      expect(result.current.metadata.dataPoints).toBe(0);
    });

    it('should handle large number of data points', () => {
      const { result } = renderHook(() => useChartMetadata('chart-1', {}));

      act(() => {
        result.current.updateDataInfo(1000000);
      });

      expect(result.current.metadata.dataPoints).toBe(1000000);
    });
  });

  describe('Multiple Metadata Fields', () => {
    it('should support all metadata fields', () => {
      const fullMetadata = {
        title: 'Full Chart',
        description: 'Complete description',
        keywords: ['key1', 'key2'],
        author: 'Test Author',
        chartType: 'candlestick',
        dataPoints: 1000,
        dateRange: { start: '2024-01-01', end: '2024-12-31' },
        theme: 'dark' as const,
        language: 'en',
      };

      const { result } = renderHook(() => useChartMetadata('chart-1', fullMetadata));

      expect(result.current.metadata).toEqual(fullMetadata);
    });

    it('should update individual fields without affecting others', () => {
      const { result } = renderHook(() =>
        useChartMetadata('chart-1', {
          title: 'Title',
          description: 'Description',
          keywords: ['key1'],
        })
      );

      act(() => {
        result.current.updateTitle('New Title');
      });

      expect(result.current.metadata.title).toBe('New Title');
      expect(result.current.metadata.description).toBe('Description');
      expect(result.current.metadata.keywords).toEqual(['key1']);
    });

    it('should support custom author', () => {
      const { result } = renderHook(() => useChartMetadata('chart-1', { author: 'Custom Author' }));

      expect(result.current.metadata.author).toBe('Custom Author');
    });

    it('should support custom language', () => {
      const { result } = renderHook(() => useChartMetadata('chart-1', { language: 'fr' }));

      expect(result.current.metadata.language).toBe('fr');
    });

    it('should support custom chart type', () => {
      const { result } = renderHook(() => useChartMetadata('chart-1', { chartType: 'custom' }));

      expect(result.current.metadata.chartType).toBe('custom');
    });
  });
});
