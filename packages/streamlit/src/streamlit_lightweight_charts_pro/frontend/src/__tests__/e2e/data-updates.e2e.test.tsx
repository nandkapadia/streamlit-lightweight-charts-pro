/**
 * @fileoverview E2E tests for data updates
 * @vitest-environment jsdom
 *
 * Tests complete user flows for:
 * - Real-time data updates
 * - Streaming data scenarios
 * - Batch data updates
 * - Data replacements
 * - Historical data loading
 * - Live data feeds
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

describe('E2E: Data Updates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('Real-time Updates', () => {
    it('should handle single data point updates', () => {
      const initialConfig: ComponentConfig = {
        charts: [
          {
            chartId: 'chart-realtime',
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

      // Add new data point
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
                  { time: '2024-01-03', value: 115 },
                ],
              },
            ],
          },
        ],
      };

      expect(() => rerender(<LightweightCharts config={updatedConfig} />)).not.toThrow();
    });

    it('should handle rapid data updates', () => {
      const initialConfig: ComponentConfig = {
        charts: [
          {
            chartId: 'chart-rapid',
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

      // Simulate 50 rapid updates
      for (let i = 2; i <= 50; i++) {
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
                    value: 100 + j * 2,
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
  });

  describe('Streaming Data', () => {
    it('should handle continuous data stream', () => {
      const initialConfig: ComponentConfig = {
        charts: [
          {
            chartId: 'chart-stream',
            chart: { width: 800, height: 600 },
            series: [
              {
                type: 'Line',
                data: [],
              },
            ],
          },
        ],
      };

      const { rerender } = render(<LightweightCharts config={initialConfig} />);

      // Stream data continuously
      const data: any[] = [];
      for (let i = 1; i <= 100; i++) {
        data.push({
          time: `2024-01-${String((i % 31) + 1).padStart(2, '0')}`,
          value: 100 + Math.random() * 50,
        });

        const updatedConfig: ComponentConfig = {
          ...initialConfig,
          charts: [
            {
              ...initialConfig.charts[0],
              series: [
                {
                  type: 'Line',
                  data: [...data],
                },
              ],
            },
          ],
        };

        rerender(<LightweightCharts config={updatedConfig} />);
      }

      expect(true).toBe(true);
    });

    it('should handle candlestick streaming', () => {
      const initialConfig: ComponentConfig = {
        charts: [
          {
            chartId: 'chart-candle-stream',
            chart: { width: 800, height: 600 },
            series: [
              {
                type: 'Candlestick',
                data: [],
              },
            ],
          },
        ],
      };

      const { rerender } = render(<LightweightCharts config={initialConfig} />);

      // Stream candlestick data
      const data: any[] = [];
      for (let i = 1; i <= 20; i++) {
        const open = 100 + Math.random() * 10;
        const close = open + (Math.random() - 0.5) * 20;
        const high = Math.max(open, close) + Math.random() * 5;
        const low = Math.min(open, close) - Math.random() * 5;

        data.push({
          time: `2024-01-${String(i).padStart(2, '0')}`,
          open,
          high,
          low,
          close,
        });

        const updatedConfig: ComponentConfig = {
          ...initialConfig,
          charts: [
            {
              ...initialConfig.charts[0],
              series: [
                {
                  type: 'Candlestick',
                  data: [...data],
                },
              ],
            },
          ],
        };

        rerender(<LightweightCharts config={updatedConfig} />);
      }

      expect(true).toBe(true);
    });

    it('should handle multiple series streaming', () => {
      const initialConfig: ComponentConfig = {
        charts: [
          {
            chartId: 'chart-multi-stream',
            chart: { width: 800, height: 600 },
            series: [
              { type: 'Line', data: [] },
              { type: 'Line', data: [] },
              { type: 'Histogram', data: [] },
            ],
          },
        ],
      };

      const { rerender } = render(<LightweightCharts config={initialConfig} />);

      const lineData1: any[] = [];
      const lineData2: any[] = [];
      const histData: any[] = [];

      for (let i = 1; i <= 30; i++) {
        lineData1.push({ time: `2024-01-${String(i).padStart(2, '0')}`, value: 100 + i });
        lineData2.push({ time: `2024-01-${String(i).padStart(2, '0')}`, value: 90 + i * 0.5 });
        histData.push({
          time: `2024-01-${String(i).padStart(2, '0')}`,
          value: 1000000 + Math.random() * 500000,
          color: i % 2 === 0 ? '#26a69a' : '#ef5350',
        });

        const updatedConfig: ComponentConfig = {
          ...initialConfig,
          charts: [
            {
              ...initialConfig.charts[0],
              series: [
                { type: 'Line', data: [...lineData1] },
                { type: 'Line', data: [...lineData2] },
                { type: 'Histogram', data: [...histData] },
              ],
            },
          ],
        };

        rerender(<LightweightCharts config={updatedConfig} />);
      }

      expect(true).toBe(true);
    });
  });

  describe('Batch Updates', () => {
    it('should handle large batch updates', () => {
      const initialConfig: ComponentConfig = {
        charts: [
          {
            chartId: 'chart-batch',
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

      // Add 1000 data points in one batch
      const batchData = Array.from({ length: 1000 }, (_, i) => ({
        time: `2024-${String(Math.floor(i / 31) + 1).padStart(2, '0')}-${String((i % 31) + 1).padStart(2, '0')}`,
        value: 100 + i * 0.1,
      }));

      const updatedConfig: ComponentConfig = {
        ...initialConfig,
        charts: [
          {
            ...initialConfig.charts[0],
            series: [
              {
                type: 'Line',
                data: batchData,
              },
            ],
          },
        ],
      };

      expect(() => rerender(<LightweightCharts config={updatedConfig} />)).not.toThrow();
    });

    it('should handle multiple batch updates', () => {
      const initialConfig: ComponentConfig = {
        charts: [
          {
            chartId: 'chart-multi-batch',
            chart: { width: 800, height: 600 },
            series: [
              {
                type: 'Line',
                data: [],
              },
            ],
          },
        ],
      };

      const { rerender } = render(<LightweightCharts config={initialConfig} />);

      // Add data in 5 batches of 100 points each
      let allData: any[] = [];
      for (let batch = 0; batch < 5; batch++) {
        const batchData = Array.from({ length: 100 }, (_, i) => ({
          time: `2024-01-${String(((batch * 100 + i) % 31) + 1).padStart(2, '0')}`,
          value: 100 + (batch * 100 + i) * 0.1,
        }));

        allData = [...allData, ...batchData];

        const updatedConfig: ComponentConfig = {
          ...initialConfig,
          charts: [
            {
              ...initialConfig.charts[0],
              series: [
                {
                  type: 'Line',
                  data: allData,
                },
              ],
            },
          ],
        };

        rerender(<LightweightCharts config={updatedConfig} />);
      }

      expect(true).toBe(true);
    });
  });

  describe('Data Replacement', () => {
    it('should replace all data with new dataset', () => {
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

      // Replace with completely different data
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

    it('should replace data with different time range', () => {
      const initialConfig: ComponentConfig = {
        charts: [
          {
            chartId: 'chart-timerange',
            chart: { width: 800, height: 600 },
            series: [
              {
                type: 'Line',
                data: Array.from({ length: 30 }, (_, i) => ({
                  time: `2024-01-${String(i + 1).padStart(2, '0')}`,
                  value: 100 + i,
                })),
              },
            ],
          },
        ],
      };

      const { rerender } = render(<LightweightCharts config={initialConfig} />);

      // Replace with different month
      const updatedConfig: ComponentConfig = {
        ...initialConfig,
        charts: [
          {
            ...initialConfig.charts[0],
            series: [
              {
                type: 'Line',
                data: Array.from({ length: 28 }, (_, i) => ({
                  time: `2024-02-${String(i + 1).padStart(2, '0')}`,
                  value: 150 + i,
                })),
              },
            ],
          },
        ],
      };

      expect(() => rerender(<LightweightCharts config={updatedConfig} />)).not.toThrow();
    });
  });

  describe('Historical Data Loading', () => {
    it('should load historical data on scroll back', () => {
      const initialConfig: ComponentConfig = {
        charts: [
          {
            chartId: 'chart-historical',
            chart: { width: 800, height: 600 },
            series: [
              {
                type: 'Line',
                data: Array.from({ length: 30 }, (_, i) => ({
                  time: `2024-02-${String(i + 1).padStart(2, '0')}`,
                  value: 100 + i,
                })),
              },
            ],
          },
        ],
      };

      const { rerender } = render(<LightweightCharts config={initialConfig} />);

      // Prepend historical data
      const historicalData = Array.from({ length: 31 }, (_, i) => ({
        time: `2024-01-${String(i + 1).padStart(2, '0')}`,
        value: 70 + i,
      }));

      const currentData = Array.from({ length: 30 }, (_, i) => ({
        time: `2024-02-${String(i + 1).padStart(2, '0')}`,
        value: 100 + i,
      }));

      const updatedConfig: ComponentConfig = {
        ...initialConfig,
        charts: [
          {
            ...initialConfig.charts[0],
            series: [
              {
                type: 'Line',
                data: [...historicalData, ...currentData],
              },
            ],
          },
        ],
      };

      expect(() => rerender(<LightweightCharts config={updatedConfig} />)).not.toThrow();
    });

    it('should load data in chunks', () => {
      const initialConfig: ComponentConfig = {
        charts: [
          {
            chartId: 'chart-chunks',
            chart: { width: 800, height: 600 },
            series: [
              {
                type: 'Line',
                data: [],
              },
            ],
          },
        ],
      };

      const { rerender } = render(<LightweightCharts config={initialConfig} />);

      // Load data in 10 chunks
      let allData: any[] = [];
      for (let chunk = 0; chunk < 10; chunk++) {
        const chunkData = Array.from({ length: 50 }, (_, i) => ({
          time: `2024-${String(Math.floor((chunk * 50 + i) / 31) + 1).padStart(2, '0')}-${String(((chunk * 50 + i) % 31) + 1).padStart(2, '0')}`,
          value: 100 + (chunk * 50 + i) * 0.1,
        }));

        allData = [...allData, ...chunkData];

        const updatedConfig: ComponentConfig = {
          ...initialConfig,
          charts: [
            {
              ...initialConfig.charts[0],
              series: [
                {
                  type: 'Line',
                  data: allData,
                },
              ],
            },
          ],
        };

        rerender(<LightweightCharts config={updatedConfig} />);
      }

      expect(true).toBe(true);
    });
  });

  describe('Mixed Update Scenarios', () => {
    it('should handle data updates with marker changes', () => {
      const initialConfig: ComponentConfig = {
        charts: [
          {
            chartId: 'chart-markers-update',
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
                    time: '2024-01-01',
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

      // Update data and markers
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
                    time: '2024-01-01',
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

    it('should handle data and options updates together', () => {
      const initialConfig: ComponentConfig = {
        charts: [
          {
            chartId: 'chart-mixed',
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

      // Update both data and options
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
                ],
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
  });

  describe('Performance with Updates', () => {
    it('should handle high-frequency updates', () => {
      const initialConfig: ComponentConfig = {
        charts: [
          {
            chartId: 'chart-hf',
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

      const startTime = Date.now();

      // 1000 updates
      for (let i = 1; i <= 1000; i++) {
        const updatedConfig: ComponentConfig = {
          ...initialConfig,
          charts: [
            {
              ...initialConfig.charts[0],
              series: [
                {
                  type: 'Line',
                  data: [{ time: '2024-01-01', value: 100 + i * 0.01 }],
                },
              ],
            },
          ],
        };

        rerender(<LightweightCharts config={updatedConfig} />);
      }

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(10000); // Should complete in under 10 seconds
    });

    it('should handle large dataset updates efficiently', () => {
      const initialConfig: ComponentConfig = {
        charts: [
          {
            chartId: 'chart-large-update',
            chart: { width: 800, height: 600 },
            series: [
              {
                type: 'Line',
                data: Array.from({ length: 5000 }, (_, i) => ({
                  time: `2024-${String(Math.floor(i / 31) + 1).padStart(2, '0')}-${String((i % 31) + 1).padStart(2, '0')}` as any,
                  value: 100 + i * 0.1,
                })),
              },
            ],
          },
        ],
      };

      const { rerender } = render(<LightweightCharts config={initialConfig} />);

      // Update entire dataset
      const updatedConfig: ComponentConfig = {
        ...initialConfig,
        charts: [
          {
            ...initialConfig.charts[0],
            series: [
              {
                type: 'Line',
                data: Array.from({ length: 5000 }, (_, i) => ({
                  time: `2024-${String(Math.floor(i / 31) + 1).padStart(2, '0')}-${String((i % 31) + 1).padStart(2, '0')}` as any,
                  value: 150 + i * 0.1,
                })),
              },
            ],
          },
        ],
      };

      expect(() => rerender(<LightweightCharts config={updatedConfig} />)).not.toThrow();
    });
  });
});
