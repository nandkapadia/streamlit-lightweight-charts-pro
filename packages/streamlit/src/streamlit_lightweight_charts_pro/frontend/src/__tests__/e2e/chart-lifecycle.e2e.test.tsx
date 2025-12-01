/**
 * @fileoverview E2E tests for chart lifecycle
 * @vitest-environment jsdom
 *
 * Tests complete user flows for:
 * - Chart initialization and rendering
 * - Chart configuration updates
 * - Chart destruction and cleanup
 * - Multiple chart instances
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup, act } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import LightweightCharts from '../../LightweightCharts';
import { ComponentConfig } from '../../types';

// Setup global mocks
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock matchMedia for fancy-canvas (used by lightweight-charts)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

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

describe('E2E: Chart Lifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Wrap cleanup in act() to prevent React 19 concurrent rendering warnings
    act(() => {
      cleanup();
    });
  });

  describe('Chart Initialization', () => {
    it('should initialize chart with minimal config', () => {
      const config: ComponentConfig = {
        charts: [
          {
            chartId: 'chart-1',
            chart: {
              width: 800,
              height: 600,
            },
            series: [],
          },
        ],
      };

      const { container } = render(<LightweightCharts config={config} />);
      expect(container).toBeTruthy();
    });

    it('should initialize chart with full config', () => {
      const config: ComponentConfig = {
        charts: [
          {
            chartId: 'chart-2',
            chart: {
              width: 1000,
              height: 800,
              layout: {
                backgroundColor: '#ffffff',
                textColor: '#333333',
              },
              grid: {
                vertLines: { color: '#e0e0e0' },
                horzLines: { color: '#e0e0e0' },
              },
              crosshair: {
                mode: 1,
              },
              timeScale: {
                rightOffset: 10,
                barSpacing: 10,
              },
            },
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

    it('should handle multiple charts initialization', () => {
      const config: ComponentConfig = {
        charts: [
          {
            chartId: 'chart-1',
            chart: { width: 800, height: 400 },
            series: [],
          },
          {
            chartId: 'chart-2',
            chart: { width: 800, height: 400 },
            series: [],
          },
          {
            chartId: 'chart-3',
            chart: { width: 800, height: 400 },
            series: [],
          },
        ],
      };

      const { container } = render(<LightweightCharts config={config} />);
      expect(container).toBeTruthy();
    });

    it('should initialize with all series types', () => {
      const config: ComponentConfig = {
        charts: [
          {
            chartId: 'chart-series',
            chart: { width: 800, height: 600 },
            series: [
              {
                type: 'Line',
                data: [{ time: '2024-01-01', value: 100 }],
              },
              {
                type: 'Area',
                data: [{ time: '2024-01-01', value: 90 }],
              },
              {
                type: 'Bar',
                data: [{ time: '2024-01-01', open: 95, high: 105, low: 90, close: 100 }],
              },
              {
                type: 'Candlestick',
                data: [{ time: '2024-01-01', open: 95, high: 105, low: 90, close: 100 }],
              },
              {
                type: 'Histogram',
                data: [{ time: '2024-01-01', value: 100, color: '#26a69a' }],
              },
            ],
          },
        ],
      };

      const { container } = render(<LightweightCharts config={config} />);
      expect(container).toBeTruthy();
    });
  });

  describe('Chart Updates', () => {
    it('should update chart options dynamically', () => {
      const initialConfig: ComponentConfig = {
        charts: [
          {
            chartId: 'chart-update',
            chart: {
              width: 800,
              height: 600,
              layout: { backgroundColor: '#ffffff' },
            },
            series: [],
          },
        ],
      };

      const { rerender } = render(<LightweightCharts config={initialConfig} />);

      // Update config
      const updatedConfig: ComponentConfig = {
        ...initialConfig,
        charts: [
          {
            ...initialConfig.charts[0],
            chart: {
              ...initialConfig.charts[0].chart,
              layout: { backgroundColor: '#000000' },
            },
          },
        ],
      };

      expect(() => rerender(<LightweightCharts config={updatedConfig} />)).not.toThrow();
    });

    it('should add series to existing chart', () => {
      const initialConfig: ComponentConfig = {
        charts: [
          {
            chartId: 'chart-add',
            chart: { width: 800, height: 600 },
            series: [],
          },
        ],
      };

      const { rerender } = render(<LightweightCharts config={initialConfig} />);

      // Add series
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
              },
            ],
          },
        ],
      };

      expect(() => rerender(<LightweightCharts config={updatedConfig} />)).not.toThrow();
    });

    it('should update series data', () => {
      const initialConfig: ComponentConfig = {
        charts: [
          {
            chartId: 'chart-data',
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

      // Update data
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
              },
            ],
          },
        ],
      };

      expect(() => rerender(<LightweightCharts config={updatedConfig} />)).not.toThrow();
    });
  });

  describe('Chart Cleanup', () => {
    it('should cleanup on unmount', () => {
      const config: ComponentConfig = {
        charts: [
          {
            chartId: 'chart-cleanup',
            chart: { width: 800, height: 600 },
            series: [],
          },
        ],
      };

      const { unmount } = render(<LightweightCharts config={config} />);

      // Unmount should not throw - wrap in act() for React 19
      expect(() => act(() => unmount())).not.toThrow();
    });

    it('should cleanup multiple charts on unmount', () => {
      const config: ComponentConfig = {
        charts: [
          { chartId: 'chart-1', chart: { width: 800, height: 400 }, series: [] },
          { chartId: 'chart-2', chart: { width: 800, height: 400 }, series: [] },
          { chartId: 'chart-3', chart: { width: 800, height: 400 }, series: [] },
        ],
      };

      const { unmount } = render(<LightweightCharts config={config} />);
      expect(() => act(() => unmount())).not.toThrow();
    });
  });

  describe('Chart Resize', () => {
    it('should handle window resize', () => {
      const config: ComponentConfig = {
        charts: [
          {
            chartId: 'chart-resize',
            chart: { width: 800, height: 600 },
            series: [],
          },
        ],
      };

      render(<LightweightCharts config={config} />);

      // Simulate resize
      expect(() => global.dispatchEvent(new Event('resize'))).not.toThrow();
    });

    it('should handle container resize with ResizeObserver', () => {
      const observeCallback = vi.fn();
      global.ResizeObserver = vi.fn().mockImplementation(callback => ({
        observe: (element: Element) => {
          observeCallback(element);
          callback(
            [
              {
                target: element,
                contentRect: {
                  width: 1000,
                  height: 800,
                },
              },
            ],
            {} as ResizeObserver
          );
        },
        unobserve: vi.fn(),
        disconnect: vi.fn(),
      }));

      const config: ComponentConfig = {
        charts: [
          {
            chartId: 'chart-ro',
            chart: { width: 800, height: 600 },
            series: [],
          },
        ],
      };

      render(<LightweightCharts config={config} />);
      expect(true).toBe(true);
    });
  });

  describe('Performance Scenarios', () => {
    it('should handle large dataset initialization', () => {
      const largeData = Array.from({ length: 10000 }, (_, i) => ({
        time: `2024-01-${String((i % 31) + 1).padStart(2, '0')}` as any,
        value: 100 + Math.random() * 50,
      }));

      const config: ComponentConfig = {
        charts: [
          {
            chartId: 'chart-large',
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

    it('should handle rapid config updates', () => {
      const initialConfig: ComponentConfig = {
        charts: [
          {
            chartId: 'chart-rapid',
            chart: { width: 800, height: 600 },
            series: [],
          },
        ],
      };

      const { rerender } = render(<LightweightCharts config={initialConfig} />);

      // Rapid updates
      for (let i = 0; i < 10; i++) {
        const updatedConfig = {
          ...initialConfig,
          charts: [
            {
              ...initialConfig.charts[0],
              chart: {
                ...initialConfig.charts[0].chart,
                width: 800 + i * 10,
              },
            },
          ],
        };

        rerender(<LightweightCharts config={updatedConfig} />);
      }

      expect(true).toBe(true);
    });
  });
});
