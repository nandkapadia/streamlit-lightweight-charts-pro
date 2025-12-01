/**
 * @fileoverview E2E tests for error scenarios
 * @vitest-environment jsdom
 *
 * Tests complete user flows for:
 * - Invalid configuration handling
 * - Malformed data handling
 * - Error recovery
 * - Edge cases
 * - Network failures
 * - Graceful degradation
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

describe('E2E: Error Scenarios', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Wrap cleanup in act() to prevent React 19 concurrent rendering warnings
    act(() => {
      cleanup();
    });
  });

  describe('Invalid Configuration', () => {
    it('should handle empty config gracefully', () => {
      const config: ComponentConfig = {
        charts: [],
      };

      expect(() => {
        render(<LightweightCharts config={config} />);
      }).not.toThrow();
    });

    it('should handle missing chart ID', () => {
      const config: ComponentConfig = {
        charts: [
          {
            chartId: '',
            chart: { width: 800, height: 600 },
            series: [],
          },
        ],
      };

      expect(() => {
        render(<LightweightCharts config={config} />);
      }).not.toThrow();
    });

    it('should handle missing dimensions', () => {
      const config: ComponentConfig = {
        charts: [
          {
            chartId: 'chart-1',
            chart: {} as any,
            series: [],
          },
        ],
      };

      expect(() => {
        render(<LightweightCharts config={config} />);
      }).not.toThrow();
    });

    it('should handle invalid chart options', () => {
      const config: ComponentConfig = {
        charts: [
          {
            chartId: 'chart-invalid',
            chart: {
              width: -100,
              height: -100,
            } as any,
            series: [],
          },
        ],
      };

      expect(() => {
        render(<LightweightCharts config={config} />);
      }).not.toThrow();
    });

    it('should handle null config values', () => {
      const config: ComponentConfig = {
        charts: [
          {
            chartId: 'chart-null',
            chart: {
              width: 800,
              height: 600,
              layout: null as any,
            },
            series: [],
          },
        ],
      };

      expect(() => {
        render(<LightweightCharts config={config} />);
      }).not.toThrow();
    });
  });

  describe('Invalid Series Data', () => {
    it('should handle empty data array', () => {
      const config: ComponentConfig = {
        charts: [
          {
            chartId: 'chart-empty',
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

      expect(() => {
        render(<LightweightCharts config={config} />);
      }).not.toThrow();
    });

    it('should handle malformed data points', () => {
      const config: ComponentConfig = {
        charts: [
          {
            chartId: 'chart-malformed',
            chart: { width: 800, height: 600 },
            series: [
              {
                type: 'Line',
                data: [
                  { time: 'invalid-time', value: 100 } as any,
                  { time: '2024-01-02', value: 'invalid' as any },
                  { time: null as any, value: null as any },
                ],
              },
            ],
          },
        ],
      };

      expect(() => {
        render(<LightweightCharts config={config} />);
      }).not.toThrow();
    });

    it('should handle missing required fields', () => {
      const config: ComponentConfig = {
        charts: [
          {
            chartId: 'chart-missing',
            chart: { width: 800, height: 600 },
            series: [
              {
                type: 'Candlestick',
                data: [
                  { time: '2024-01-01', open: 100 } as any, // Missing high, low, close
                  { time: '2024-01-02', high: 110, low: 90 } as any, // Missing open, close
                ],
              },
            ],
          },
        ],
      };

      expect(() => {
        render(<LightweightCharts config={config} />);
      }).not.toThrow();
    });

    it('should handle duplicate timestamps', () => {
      const config: ComponentConfig = {
        charts: [
          {
            chartId: 'chart-duplicate',
            chart: { width: 800, height: 600 },
            series: [
              {
                type: 'Line',
                data: [
                  { time: '2024-01-01', value: 100 },
                  { time: '2024-01-01', value: 110 },
                  { time: '2024-01-01', value: 105 },
                ],
              },
            ],
          },
        ],
      };

      expect(() => {
        render(<LightweightCharts config={config} />);
      }).not.toThrow();
    });

    it('should handle out-of-order timestamps', () => {
      const config: ComponentConfig = {
        charts: [
          {
            chartId: 'chart-unordered',
            chart: { width: 800, height: 600 },
            series: [
              {
                type: 'Line',
                data: [
                  { time: '2024-01-03', value: 105 },
                  { time: '2024-01-01', value: 100 },
                  { time: '2024-01-02', value: 110 },
                ],
              },
            ],
          },
        ],
      };

      expect(() => {
        render(<LightweightCharts config={config} />);
      }).not.toThrow();
    });

    it('should handle extremely large values', () => {
      const config: ComponentConfig = {
        charts: [
          {
            chartId: 'chart-large',
            chart: { width: 800, height: 600 },
            series: [
              {
                type: 'Line',
                data: [
                  { time: '2024-01-01', value: Number.MAX_SAFE_INTEGER },
                  { time: '2024-01-02', value: Number.MIN_SAFE_INTEGER },
                  { time: '2024-01-03', value: Infinity },
                  { time: '2024-01-04', value: -Infinity },
                ],
              },
            ],
          },
        ],
      };

      expect(() => {
        render(<LightweightCharts config={config} />);
      }).not.toThrow();
    });

    it('should handle NaN values', () => {
      const config: ComponentConfig = {
        charts: [
          {
            chartId: 'chart-nan',
            chart: { width: 800, height: 600 },
            series: [
              {
                type: 'Line',
                data: [
                  { time: '2024-01-01', value: 100 },
                  { time: '2024-01-02', value: NaN },
                  { time: '2024-01-03', value: 105 },
                ],
              },
            ],
          },
        ],
      };

      expect(() => {
        render(<LightweightCharts config={config} />);
      }).not.toThrow();
    });
  });

  describe('Invalid Series Types', () => {
    it('should handle unknown series type', () => {
      const config: ComponentConfig = {
        charts: [
          {
            chartId: 'chart-unknown',
            chart: { width: 800, height: 600 },
            series: [
              {
                type: 'unknown-type' as any,
                data: [{ time: '2024-01-01', value: 100 }],
              },
            ],
          },
        ],
      };

      expect(() => {
        render(<LightweightCharts config={config} />);
      }).not.toThrow();
    });

    it('should handle null series type', () => {
      const config: ComponentConfig = {
        charts: [
          {
            chartId: 'chart-null-type',
            chart: { width: 800, height: 600 },
            series: [
              {
                type: null as any,
                data: [{ time: '2024-01-01', value: 100 }],
              },
            ],
          },
        ],
      };

      expect(() => {
        render(<LightweightCharts config={config} />);
      }).not.toThrow();
    });

    it('should handle series with incompatible data', () => {
      const config: ComponentConfig = {
        charts: [
          {
            chartId: 'chart-incompatible',
            chart: { width: 800, height: 600 },
            series: [
              {
                type: 'Candlestick',
                data: [
                  { time: '2024-01-01', value: 100 }, // Line data for candlestick series
                ] as any,
              },
            ],
          },
        ],
      };

      expect(() => {
        render(<LightweightCharts config={config} />);
      }).not.toThrow();
    });
  });

  describe('Invalid Markers', () => {
    it('should handle invalid marker positions', () => {
      const config: ComponentConfig = {
        charts: [
          {
            chartId: 'chart-markers',
            chart: { width: 800, height: 600 },
            series: [
              {
                type: 'Line',
                data: [{ time: '2024-01-01', value: 100 }],
                markers: [
                  {
                    time: '2024-01-01',
                    position: 'invalid-position' as any,
                    color: '#2196F3',
                    shape: 'circle',
                  },
                ],
              },
            ],
          },
        ],
      };

      expect(() => {
        render(<LightweightCharts config={config} />);
      }).not.toThrow();
    });

    it('should handle markers with invalid timestamps', () => {
      const config: ComponentConfig = {
        charts: [
          {
            chartId: 'chart-marker-time',
            chart: { width: 800, height: 600 },
            series: [
              {
                type: 'Line',
                data: [{ time: '2024-01-01', value: 100 }],
                markers: [
                  {
                    time: '2024-12-31', // Date not in data
                    position: 'aboveBar',
                    color: '#2196F3',
                    shape: 'circle',
                  },
                ],
              },
            ],
          },
        ],
      };

      expect(() => {
        render(<LightweightCharts config={config} />);
      }).not.toThrow();
    });

    it('should handle markers with missing required fields', () => {
      const config: ComponentConfig = {
        charts: [
          {
            chartId: 'chart-marker-missing',
            chart: { width: 800, height: 600 },
            series: [
              {
                type: 'Line',
                data: [{ time: '2024-01-01', value: 100 }],
                markers: [
                  {
                    time: '2024-01-01',
                    // Missing position, color, shape
                  } as any,
                ],
              },
            ],
          },
        ],
      };

      expect(() => {
        render(<LightweightCharts config={config} />);
      }).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle single data point', () => {
      const config: ComponentConfig = {
        charts: [
          {
            chartId: 'chart-single',
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

      expect(() => {
        render(<LightweightCharts config={config} />);
      }).not.toThrow();
    });

    it('should handle chart with zero dimensions', () => {
      const config: ComponentConfig = {
        charts: [
          {
            chartId: 'chart-zero',
            chart: { width: 0, height: 0 },
            series: [],
          },
        ],
      };

      expect(() => {
        render(<LightweightCharts config={config} />);
      }).not.toThrow();
    });

    it('should handle extremely narrow chart', () => {
      const config: ComponentConfig = {
        charts: [
          {
            chartId: 'chart-narrow',
            chart: { width: 10, height: 600 },
            series: [
              {
                type: 'Line',
                data: [{ time: '2024-01-01', value: 100 }],
              },
            ],
          },
        ],
      };

      expect(() => {
        render(<LightweightCharts config={config} />);
      }).not.toThrow();
    });

    it('should handle extremely short chart', () => {
      const config: ComponentConfig = {
        charts: [
          {
            chartId: 'chart-short',
            chart: { width: 800, height: 10 },
            series: [
              {
                type: 'Line',
                data: [{ time: '2024-01-01', value: 100 }],
              },
            ],
          },
        ],
      };

      expect(() => {
        render(<LightweightCharts config={config} />);
      }).not.toThrow();
    });

    it('should handle chart with huge number of series', () => {
      const config: ComponentConfig = {
        charts: [
          {
            chartId: 'chart-many',
            chart: { width: 800, height: 600 },
            series: Array.from({ length: 100 }, (_, i) => ({
              type: 'Line' as const,
              data: [{ time: '2024-01-01', value: 100 + i }],
            })),
          },
        ],
      };

      expect(() => {
        render(<LightweightCharts config={config} />);
      }).not.toThrow();
    });
  });

  describe('Error Recovery', () => {
    it('should recover from invalid config update', () => {
      const validConfig: ComponentConfig = {
        charts: [
          {
            chartId: 'chart-recovery',
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

      const { rerender } = render(<LightweightCharts config={validConfig} />);

      // Apply invalid config
      const invalidConfig: ComponentConfig = {
        charts: [
          {
            chartId: 'chart-recovery',
            chart: { width: -100, height: -100 } as any,
            series: [
              {
                type: 'invalid' as any,
                data: null as any,
              },
            ],
          },
        ],
      };

      expect(() => {
        rerender(<LightweightCharts config={invalidConfig} />);
      }).not.toThrow();

      // Recover with valid config
      rerender(<LightweightCharts config={validConfig} />);
    });

    it('should handle alternating valid and invalid updates', () => {
      const validConfig: ComponentConfig = {
        charts: [
          {
            chartId: 'chart-alt',
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

      const invalidConfig: ComponentConfig = {
        charts: [
          {
            chartId: 'chart-alt',
            chart: { width: 800, height: 600 },
            series: [
              {
                type: 'Line',
                data: [{ time: 'invalid', value: NaN }] as any,
              },
            ],
          },
        ],
      };

      const { rerender } = render(<LightweightCharts config={validConfig} />);

      for (let i = 0; i < 5; i++) {
        rerender(<LightweightCharts config={i % 2 === 0 ? invalidConfig : validConfig} />);
      }
    });
  });

  describe('Stress Tests', () => {
    it('should handle rapid config changes', () => {
      const { rerender } = render(
        <LightweightCharts
          config={{
            charts: [
              {
                chartId: 'chart-stress',
                chart: { width: 800, height: 600 },
                series: [],
              },
            ],
          }}
        />
      );

      // 100 rapid config changes
      for (let i = 0; i < 100; i++) {
        const config: ComponentConfig = {
          charts: [
            {
              chartId: 'chart-stress',
              chart: { width: 800 + i, height: 600 },
              series: [
                {
                  type: 'Line',
                  data: [{ time: '2024-01-01', value: 100 + i }],
                },
              ],
            },
          ],
        };

        rerender(<LightweightCharts config={config} />);
      }
    });

    it('should handle mount/unmount cycles', () => {
      const config: ComponentConfig = {
        charts: [
          {
            chartId: 'chart-cycles',
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

      // 10 mount/unmount cycles
      for (let i = 0; i < 10; i++) {
        const { unmount } = render(<LightweightCharts config={config} />);

        expect(() => act(() => unmount())).not.toThrow();
      }
    });
  });

  describe('Custom Series Error Handling', () => {
    it('should handle invalid ribbon series data', () => {
      const config: ComponentConfig = {
        charts: [
          {
            chartId: 'chart-ribbon-error',
            chart: { width: 800, height: 600 },
            series: [
              {
                type: 'ribbon',
                data: [
                  { time: '2024-01-01', upper: 110 }, // Missing lower
                  { time: '2024-01-02', lower: 90 } as any, // Missing upper
                ],
              },
            ],
          },
        ],
      };

      expect(() => {
        render(<LightweightCharts config={config} />);
      }).not.toThrow();
    });

    it('should handle invalid band series data', () => {
      const config: ComponentConfig = {
        charts: [
          {
            chartId: 'chart-band-error',
            chart: { width: 800, height: 600 },
            series: [
              {
                type: 'Band',
                data: [
                  { time: '2024-01-01', upper: 110, middle: 100 }, // Missing lower
                  { time: '2024-01-02', middle: 100 } as any, // Missing upper and lower
                ],
              },
            ],
          },
        ],
      };

      expect(() => {
        render(<LightweightCharts config={config} />);
      }).not.toThrow();
    });

    it('should handle invalid signal series data', () => {
      const config: ComponentConfig = {
        charts: [
          {
            chartId: 'chart-signal-error',
            chart: { width: 800, height: 600 },
            series: [
              {
                type: 'signal',
                data: [
                  { time: '2024-01-01', value: 999 }, // Invalid signal value
                  { time: '2024-01-02', value: -1 }, // Invalid signal value
                ],
              },
            ],
          },
        ],
      };

      expect(() => {
        render(<LightweightCharts config={config} />);
      }).not.toThrow();
    });
  });
});
