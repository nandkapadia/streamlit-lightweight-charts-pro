/**
 * @fileoverview E2E tests for series operations
 * @vitest-environment jsdom
 *
 * Tests complete user flows for:
 * - Adding different series types
 * - Updating series data and options
 * - Removing series
 * - Multiple series on one chart
 * - Custom series (Ribbon, Band, Signal, etc.)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import LightweightCharts from '../../LightweightCharts';
import { ComponentConfig } from '../../types';

// Setup global mocks
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

Element.prototype.getBoundingClientRect = vi.fn(
  () =>
    ({
      width: 800,
      height: 600,
      top: 0,
      left: 0,
      right: 800,
      bottom: 600,
      x: 0,
      y: 0,
      toJSON: vi.fn(),
    }) as DOMRect
);

describe('E2E: Series Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('Adding Series', () => {
    it('should add line series', () => {
      const config: ComponentConfig = {
        charts: [
          {
            chartId: 'chart-1',
            chart: { width: 800, height: 600 },
            series: [
              {
                type: 'Line',
                data: [
                  { time: '2024-01-01', value: 100 },
                  { time: '2024-01-02', value: 110 },
                  { time: '2024-01-03', value: 105 },
                ],
                options: {
                  color: '#2196F3',
                  lineWidth: 2,
                },
              },
            ],
          },
        ],
      };

      const { container } = render(<LightweightCharts config={config} />);
      expect(container).toBeTruthy();
    });

    it('should add candlestick series', () => {
      const config: ComponentConfig = {
        charts: [
          {
            chartId: 'chart-candle',
            chart: { width: 800, height: 600 },
            series: [
              {
                type: 'Candlestick',
                data: [
                  { time: '2024-01-01', open: 95, high: 105, low: 90, close: 100 },
                  { time: '2024-01-02', open: 100, high: 115, low: 98, close: 110 },
                  { time: '2024-01-03', open: 110, high: 112, low: 100, close: 105 },
                ],
                options: {
                  upColor: '#26a69a',
                  downColor: '#ef5350',
                },
              },
            ],
          },
        ],
      };

      const { container } = render(<LightweightCharts config={config} />);
      expect(container).toBeTruthy();
    });

    it('should add multiple series to one chart', () => {
      const config: ComponentConfig = {
        charts: [
          {
            chartId: 'chart-multi',
            chart: { width: 800, height: 600 },
            series: [
              {
                type: 'Line',
                data: [
                  { time: '2024-01-01', value: 100 },
                  { time: '2024-01-02', value: 110 },
                ],
                options: { color: '#2196F3' },
              },
              {
                type: 'Line',
                data: [
                  { time: '2024-01-01', value: 90 },
                  { time: '2024-01-02', value: 95 },
                ],
                options: { color: '#FF5722' },
              },
              {
                type: 'Histogram',
                data: [
                  { time: '2024-01-01', value: 1000000, color: '#26a69a' },
                  { time: '2024-01-02', value: 1200000, color: '#ef5350' },
                ],
              },
            ],
          },
        ],
      };

      const { container } = render(<LightweightCharts config={config} />);
      expect(container).toBeTruthy();
    });

    it('should add custom ribbon series', () => {
      const config: ComponentConfig = {
        charts: [
          {
            chartId: 'chart-ribbon',
            chart: { width: 800, height: 600 },
            series: [
              {
                type: 'ribbon',
                data: [
                  { time: '2024-01-01', upper: 110, lower: 90 },
                  { time: '2024-01-02', upper: 115, lower: 95 },
                  { time: '2024-01-03', upper: 112, lower: 92 },
                ],
                options: {
                  color: '#4CAF50',
                },
              },
            ],
          },
        ],
      };

      const { container } = render(<LightweightCharts config={config} />);
      expect(container).toBeTruthy();
    });

    it('should add custom band series', () => {
      const config: ComponentConfig = {
        charts: [
          {
            chartId: 'chart-band',
            chart: { width: 800, height: 600 },
            series: [
              {
                type: 'Band',
                data: [
                  { time: '2024-01-01', upper: 110, lower: 90 },
                  { time: '2024-01-02', upper: 120, lower: 100 },
                  { time: '2024-01-03', upper: 115, lower: 95 },
                ],
                options: {
                  color: '#4CAF50',
                },
              },
            ],
          },
        ],
      };

      const { container } = render(<LightweightCharts config={config} />);
      expect(container).toBeTruthy();
    });
  });

  describe('Updating Series', () => {
    it('should update series data incrementally', () => {
      const initialConfig: ComponentConfig = {
        charts: [
          {
            chartId: 'chart-update',
            chart: { width: 800, height: 600 },
            series: [
              {
                type: 'Line',
                data: [{ time: '2024-01-01', value: 100 }],
              },
            ],
          },
        ],
      };

      const { rerender } = render(<LightweightCharts config={initialConfig} />);

      // Add more data
      for (let i = 2; i <= 5; i++) {
        const updatedConfig: ComponentConfig = {
          ...initialConfig,
          charts: [
            {
              ...initialConfig.charts[0],
              series: [
                {
                  type: 'Line',
                  data: Array.from({ length: i }, (_, j) => ({
                    time: `2024-01-${String(j + 1).padStart(2, '0')}`,
                    value: 100 + j * 10,
                  })),
                },
              ],
            },
          ],
        };

        rerender(<LightweightCharts config={updatedConfig} />);
      }

      expect(true).toBe(true);
    });

    it('should update series options', () => {
      const initialConfig: ComponentConfig = {
        charts: [
          {
            chartId: 'chart-options',
            chart: { width: 800, height: 600 },
            series: [
              {
                type: 'Line',
                data: [{ time: '2024-01-01', value: 100 }],
                options: {
                  color: '#2196F3',
                  lineWidth: 2,
                },
              },
            ],
          },
        ],
      };

      const { rerender } = render(<LightweightCharts config={initialConfig} />);

      // Update options
      const updatedConfig: ComponentConfig = {
        ...initialConfig,
        charts: [
          {
            ...initialConfig.charts[0],
            series: [
              {
                type: 'Line',
                data: [{ time: '2024-01-01', value: 100 }],
                options: {
                  color: '#FF5722',
                  lineWidth: 4,
                },
              },
            ],
          },
        ],
      };

      expect(() => rerender(<LightweightCharts config={updatedConfig} />)).not.toThrow();
    });

    it('should handle series data replacement', () => {
      const initialConfig: ComponentConfig = {
        charts: [
          {
            chartId: 'chart-replace',
            chart: { width: 800, height: 600 },
            series: [
              {
                type: 'Line',
                data: [
                  { time: '2024-01-01', value: 100 },
                  { time: '2024-01-02', value: 110 },
                ],
              },
            ],
          },
        ],
      };

      const { rerender } = render(<LightweightCharts config={initialConfig} />);

      // Replace with completely new data
      const updatedConfig: ComponentConfig = {
        ...initialConfig,
        charts: [
          {
            ...initialConfig.charts[0],
            series: [
              {
                type: 'Line',
                data: [
                  { time: '2024-02-01', value: 200 },
                  { time: '2024-02-02', value: 210 },
                  { time: '2024-02-03', value: 205 },
                ],
              },
            ],
          },
        ],
      };

      expect(() => rerender(<LightweightCharts config={updatedConfig} />)).not.toThrow();
    });
  });

  describe('Removing Series', () => {
    it('should remove series from chart', () => {
      const initialConfig: ComponentConfig = {
        charts: [
          {
            chartId: 'chart-remove',
            chart: { width: 800, height: 600 },
            series: [
              { type: 'Line', data: [{ time: '2024-01-01', value: 100 }] },
              { type: 'Line', data: [{ time: '2024-01-01', value: 90 }] },
            ],
          },
        ],
      };

      const { rerender } = render(<LightweightCharts config={initialConfig} />);

      // Remove one series
      const updatedConfig: ComponentConfig = {
        ...initialConfig,
        charts: [
          {
            ...initialConfig.charts[0],
            series: [{ type: 'Line', data: [{ time: '2024-01-01', value: 100 }] }],
          },
        ],
      };

      expect(() => rerender(<LightweightCharts config={updatedConfig} />)).not.toThrow();
    });

    it('should remove all series', () => {
      const initialConfig: ComponentConfig = {
        charts: [
          {
            chartId: 'chart-remove-all',
            chart: { width: 800, height: 600 },
            series: [
              { type: 'Line', data: [{ time: '2024-01-01', value: 100 }] },
              { type: 'Line', data: [{ time: '2024-01-01', value: 90 }] },
            ],
          },
        ],
      };

      const { rerender } = render(<LightweightCharts config={initialConfig} />);

      // Remove all series
      const updatedConfig: ComponentConfig = {
        ...initialConfig,
        charts: [
          {
            ...initialConfig.charts[0],
            series: [],
          },
        ],
      };

      expect(() => rerender(<LightweightCharts config={updatedConfig} />)).not.toThrow();
    });
  });

  describe('Series with Markers', () => {
    it('should add series with markers', () => {
      const config: ComponentConfig = {
        charts: [
          {
            chartId: 'chart-markers',
            chart: { width: 800, height: 600 },
            series: [
              {
                type: 'Line',
                data: [
                  { time: '2024-01-01', value: 100 },
                  { time: '2024-01-02', value: 110 },
                  { time: '2024-01-03', value: 105 },
                ],
                markers: [
                  {
                    time: '2024-01-02',
                    position: 'aboveBar',
                    color: '#2196F3',
                    shape: 'circle',
                    text: 'Buy',
                  },
                ],
              },
            ],
          },
        ],
      };

      const { container } = render(<LightweightCharts config={config} />);
      expect(container).toBeTruthy();
    });

    it('should update markers', () => {
      const initialConfig: ComponentConfig = {
        charts: [
          {
            chartId: 'chart-update-markers',
            chart: { width: 800, height: 600 },
            series: [
              {
                type: 'Line',
                data: [
                  { time: '2024-01-01', value: 100 },
                  { time: '2024-01-02', value: 110 },
                ],
                markers: [
                  {
                    time: '2024-01-02',
                    position: 'aboveBar',
                    color: '#2196F3',
                    shape: 'circle',
                    text: 'Buy',
                  },
                ],
              },
            ],
          },
        ],
      };

      const { rerender } = render(<LightweightCharts config={initialConfig} />);

      // Add more markers
      const updatedConfig: ComponentConfig = {
        ...initialConfig,
        charts: [
          {
            ...initialConfig.charts[0],
            series: [
              {
                type: 'Line',
                data: [
                  { time: '2024-01-01', value: 100 },
                  { time: '2024-01-02', value: 110 },
                  { time: '2024-01-03', value: 105 },
                ],
                markers: [
                  {
                    time: '2024-01-02',
                    position: 'aboveBar',
                    color: '#2196F3',
                    shape: 'circle',
                    text: 'Buy',
                  },
                  {
                    time: '2024-01-03',
                    position: 'belowBar',
                    color: '#F44336',
                    shape: 'circle',
                    text: 'Sell',
                  },
                ],
              },
            ],
          },
        ],
      };

      expect(() => rerender(<LightweightCharts config={updatedConfig} />)).not.toThrow();
    });
  });

  describe('Performance with Series', () => {
    it('should handle many series on one chart', () => {
      const series = Array.from({ length: 20 }, (_, i) => ({
        type: 'Line' as const,
        data: [
          { time: '2024-01-01', value: 100 + i * 5 },
          { time: '2024-01-02', value: 110 + i * 5 },
        ],
        options: {
          color: `hsl(${i * 18}, 70%, 50%)`,
          lineWidth: 1,
        },
      }));

      const config: ComponentConfig = {
        charts: [
          {
            chartId: 'chart-many',
            chart: { width: 800, height: 600 },
            series,
          },
        ],
      };

      const { container } = render(<LightweightCharts config={config} />);
      expect(container).toBeTruthy();
    });

    it('should handle large dataset per series', () => {
      const largeData = Array.from({ length: 5000 }, (_, i) => ({
        time: `2024-${String(Math.floor(i / 31) + 1).padStart(2, '0')}-${String((i % 31) + 1).padStart(2, '0')}` as any,
        value: 100 + Math.sin(i / 10) * 20,
      }));

      const config: ComponentConfig = {
        charts: [
          {
            chartId: 'chart-large-series',
            chart: { width: 800, height: 600 },
            series: [
              {
                type: 'Line',
                data: largeData,
              },
            ],
          },
        ],
      };

      const { container } = render(<LightweightCharts config={config} />);
      expect(container).toBeTruthy();
    });
  });
});
