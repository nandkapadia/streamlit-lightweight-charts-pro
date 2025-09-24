import { createSeries } from '../../utils/seriesFactory';
import { createChart } from 'lightweight-charts';
import { resetMocks } from '../../test-utils/lightweightChartsMocks';

// Use unified mock system
vi.mock('lightweight-charts', async () => {
  const mocks = await import('../../test-utils/lightweightChartsMocks');
  return mocks.default;
});

describe('Series Factory', () => {
  let chart: any;
  let container: HTMLElement;

  beforeEach(() => {
    resetMocks();
    container = document.createElement('div');
    container.style.width = '800px';
    container.style.height = '400px';
    document.body.appendChild(container);

    chart = createChart(container, {
      layout: {
        attributionLogo: false,
      },
    });
  });

  afterEach(() => {
    if (chart) {
      chart.remove();
    }
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  describe('Line Series', () => {
    it('should create line series with basic data', () => {
      const seriesConfig = {
        type: 'Line' as const,
        data: [
          { time: '2024-01-01', value: 100 },
          { time: '2024-01-02', value: 110 },
          { time: '2024-01-03', value: 105 },
        ],
        options: {
          color: '#ff0000',
          lineWidth: 2,
        },
      };

      const series = createSeries(chart, seriesConfig);
      expect(series).toBeDefined();
      expect(series.setData).toHaveBeenCalledWith(seriesConfig.data);
    });

    it('should create line series with custom options', () => {
      const seriesConfig = {
        type: 'Line' as const,
        data: [
          { time: '2024-01-01', value: 100 },
          { time: '2024-01-02', value: 110 },
        ],
        options: {
          color: '#00ff00',
          lineWidth: 3,
          lineStyle: 1, // Dashed
          crosshairMarkerVisible: true,
          lastValueVisible: true,
          priceLineVisible: true,
        },
      };

      const series = createSeries(chart, seriesConfig);
      expect(series).toBeDefined();
    });

    it('should handle empty line series data', () => {
      const seriesConfig = {
        type: 'Line' as const,
        data: [],
        options: {},
      };

      const series = createSeries(chart, seriesConfig);
      expect(series).toBeDefined();
    });
  });

  describe('Candlestick Series', () => {
    it('should create candlestick series with OHLC data', () => {
      const seriesConfig = {
        type: 'Candlestick' as const,
        data: [
          {
            time: '2024-01-01',
            open: 100,
            high: 110,
            low: 95,
            close: 105,
          },
          {
            time: '2024-01-02',
            open: 105,
            high: 115,
            low: 100,
            close: 110,
          },
        ],
        options: {
          upColor: '#00ff00',
          downColor: '#ff0000',
          borderVisible: true,
          wickVisible: true,
        },
      };

      const series = createSeries(chart, seriesConfig);
      expect(series).toBeDefined();
    });

    it('should create candlestick series with custom styling', () => {
      const seriesConfig = {
        type: 'Candlestick' as const,
        data: [
          {
            time: '2024-01-01',
            open: 100,
            high: 110,
            low: 95,
            close: 105,
          },
        ],
        options: {
          upColor: '#00ff00',
          downColor: '#ff0000',
          borderUpColor: '#008000',
          borderDownColor: '#800000',
          wickUpColor: '#00ff00',
          wickDownColor: '#ff0000',
        },
      };

      const series = createSeries(chart, seriesConfig);
      expect(series).toBeDefined();
    });
  });

  describe('Area Series', () => {
    it('should create area series with basic data', () => {
      const seriesConfig = {
        type: 'Area' as const,
        data: [
          { time: '2024-01-01', value: 100 },
          { time: '2024-01-02', value: 110 },
          { time: '2024-01-03', value: 105 },
        ],
        options: {
          topColor: 'rgba(255, 0, 0, 0.5)',
          bottomColor: 'rgba(255, 0, 0, 0.1)',
          lineColor: '#ff0000',
          lineWidth: 2,
        },
      };

      const series = createSeries(chart, seriesConfig);
      expect(series).toBeDefined();
    });

    it('should create area series with gradient', () => {
      const seriesConfig = {
        type: 'Area' as const,
        data: [
          { time: '2024-01-01', value: 100 },
          { time: '2024-01-02', value: 110 },
        ],
        options: {
          topColor: 'rgba(0, 255, 0, 0.8)',
          bottomColor: 'rgba(0, 255, 0, 0.2)',
          lineColor: '#00ff00',
          lineWidth: 1,
          crosshairMarkerVisible: true,
        },
      };

      const series = createSeries(chart, seriesConfig);
      expect(series).toBeDefined();
    });
  });

  describe('Histogram Series', () => {
    it('should create histogram series with volume data', () => {
      const seriesConfig = {
        type: 'Histogram' as const,
        data: [
          { time: '2024-01-01', value: 1000000, color: '#00ff00' },
          { time: '2024-01-02', value: 1500000, color: '#ff0000' },
          { time: '2024-01-03', value: 800000, color: '#00ff00' },
        ],
        options: {
          color: '#888888',
          priceFormat: {
            type: 'volume',
          },
          priceScaleId: 'volume',
        },
      };

      const series = createSeries(chart, seriesConfig);
      expect(series).toBeDefined();
    });

    it('should create histogram series with custom colors', () => {
      const seriesConfig = {
        type: 'Histogram' as const,
        data: [
          { time: '2024-01-01', value: 1000000, color: '#00ff00' },
          { time: '2024-01-02', value: 1500000, color: '#ff0000' },
        ],
        options: {
          color: '#888888',
          priceFormat: {
            type: 'volume',
          },
          priceScaleId: 'volume',
          scaleMargins: {
            top: 0.8,
            bottom: 0,
          },
        },
      };

      const series = createSeries(chart, seriesConfig);
      expect(series).toBeDefined();
    });
  });

  describe('Baseline Series', () => {
    it('should create baseline series with reference data', () => {
      const seriesConfig = {
        type: 'Baseline' as const,
        data: [
          { time: '2024-01-01', value: 100 },
          { time: '2024-01-02', value: 110 },
          { time: '2024-01-03', value: 105 },
        ],
        options: {
          baseValue: { price: 100 },
          topFillColor: 'rgba(0, 255, 0, 0.3)',
          bottomFillColor: 'rgba(255, 0, 0, 0.3)',
          topLineColor: '#00ff00',
          bottomLineColor: '#ff0000',
          lineWidth: 2,
        },
      };

      const series = createSeries(chart, seriesConfig);
      expect(series).toBeDefined();
    });

    it('should create baseline series with custom baseline', () => {
      const seriesConfig = {
        type: 'Baseline' as const,
        data: [
          { time: '2024-01-01', value: 100 },
          { time: '2024-01-02', value: 110 },
        ],
        options: {
          baseValue: { price: 105 },
          topFillColor: 'rgba(0, 255, 0, 0.5)',
          bottomFillColor: 'rgba(255, 0, 0, 0.5)',
          topLineColor: '#00ff00',
          bottomLineColor: '#ff0000',
          lineWidth: 1,
        },
      };

      const series = createSeries(chart, seriesConfig);
      expect(series).toBeDefined();
    });
  });

  describe('Band Series', () => {
    it('should create band series with upper and lower data', () => {
      const seriesConfig = {
        type: 'Band' as const,
        data: [
          {
            time: '2024-01-01',
            upper: 110,
            lower: 90,
          },
          {
            time: '2024-01-02',
            upper: 115,
            lower: 95,
          },
        ],
        options: {
          upperColor: 'rgba(0, 255, 0, 0.3)',
          lowerColor: 'rgba(255, 0, 0, 0.3)',
          lineColor: '#888888',
          lineWidth: 1,
        },
      };

      const series = createSeries(chart, seriesConfig);
      expect(series).toBeDefined();
    });

    it('should create band series with custom styling', () => {
      const seriesConfig = {
        type: 'Band' as const,
        data: [
          {
            time: '2024-01-01',
            upper: 110,
            lower: 90,
          },
        ],
        options: {
          upperColor: 'rgba(0, 255, 0, 0.5)',
          lowerColor: 'rgba(255, 0, 0, 0.5)',
          lineColor: '#888888',
          lineWidth: 2,
          crosshairMarkerVisible: true,
        },
      };

      const series = createSeries(chart, seriesConfig);
      expect(series).toBeDefined();
    });
  });

  describe('Series Configuration', () => {
    it('should handle series with price scale configuration', () => {
      const seriesConfig = {
        type: 'Line' as const,
        data: [
          { time: '2024-01-01', value: 100 },
          { time: '2024-01-02', value: 110 },
        ],
        options: {
          color: '#ff0000',
          priceScaleId: 'right',
        },
      };

      const series = createSeries(chart, seriesConfig);
      expect(series).toBeDefined();
    });

    it('should handle series with time scale configuration', () => {
      const seriesConfig = {
        type: 'Line' as const,
        data: [
          { time: '2024-01-01', value: 100 },
          { time: '2024-01-02', value: 110 },
        ],
        options: {
          color: '#ff0000',
          timeScaleId: 'time',
        },
      };

      const series = createSeries(chart, seriesConfig);
      expect(series).toBeDefined();
    });

    it('should handle series with autoscale info', () => {
      const seriesConfig = {
        type: 'Line' as const,
        data: [
          { time: '2024-01-01', value: 100 },
          { time: '2024-01-02', value: 110 },
        ],
        options: {
          color: '#ff0000',
          autoscaleInfoProvider: () => ({
            priceRange: { minValue: 90, maxValue: 120 },
            margins: { above: 0.1, below: 0.1 },
          }),
        },
      };

      const series = createSeries(chart, seriesConfig);
      expect(series).toBeDefined();
    });
  });

  describe('Data Validation', () => {
    it('should handle invalid series type', () => {
      const seriesConfig = {
        type: 'invalid' as any,
        data: [{ time: '2024-01-01', value: 100 }],
        options: {},
      };

      expect(() => {
        createSeries(chart, seriesConfig);
      }).toThrow();
    });

    it('should handle null data', () => {
      const seriesConfig = {
        type: 'Line' as const,
        data: null,
        options: {},
      };

      const series = createSeries(chart, seriesConfig);
      expect(series).toBeDefined();
    });

    it('should handle undefined data', () => {
      const seriesConfig = {
        type: 'Line' as const,
        data: undefined,
        options: {},
      };

      const series = createSeries(chart, seriesConfig);
      expect(series).toBeDefined();
    });

    it('should handle malformed data', () => {
      const seriesConfig = {
        type: 'Line' as const,
        data: [
          { time: '2024-01-01', value: 100 },
          { time: '2024-01-02', value: 200 },
          { time: '2024-01-03', value: 300 },
        ],
        options: {},
      };

      const series = createSeries(chart, seriesConfig);
      expect(series).toBeDefined();
    });
  });

  describe('Performance', () => {
    it('should handle large datasets efficiently', () => {
      const largeData = Array.from({ length: 10000 }, (_, i) => ({
        time: `2024-01-${String(i + 1).padStart(2, '0')}`,
        value: 100 + Math.random() * 20,
      }));

      const seriesConfig = {
        type: 'Line' as const,
        data: largeData,
        options: {
          color: '#ff0000',
        },
      };

      const series = createSeries(chart, seriesConfig);
      expect(series).toBeDefined();
    });

    it('should handle multiple series creation', () => {
      const seriesConfigs = [
        {
          type: 'Line' as const,
          data: [
            { time: '2024-01-01', value: 100 },
            { time: '2024-01-02', value: 110 },
          ],
          options: { color: '#ff0000' },
        },
        {
          type: 'Area' as const,
          data: [
            { time: '2024-01-01', value: 90 },
            { time: '2024-01-02', value: 100 },
          ],
          options: { color: '#00ff00' },
        },
        {
          type: 'Histogram' as const,
          data: [
            { time: '2024-01-01', value: 1000000 },
            { time: '2024-01-02', value: 1500000 },
          ],
          options: { color: '#0000ff' },
        },
      ];

      seriesConfigs.forEach(config => {
        const series = createSeries(chart, config);
        expect(series).toBeDefined();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle missing chart', () => {
      const seriesConfig = {
        type: 'Line' as const,
        data: [{ time: '2024-01-01', value: 100 }],
        options: {},
      };

      expect(() => {
        createSeries(null as any, seriesConfig);
      }).toThrow();
    });

    it('should handle missing series configuration', () => {
      expect(() => {
        createSeries(chart, null as any);
      }).toThrow();
    });

    it('should handle missing series type', () => {
      const seriesConfig = {
        data: [{ time: '2024-01-01', value: 100 }],
        options: {},
      } as any;

      expect(() => {
        createSeries(chart, seriesConfig);
      }).toThrow();
    });

    it('should handle chart without required methods', () => {
      const invalidChart = {
        // Missing required methods
      };

      const seriesConfig = {
        type: 'Line' as const,
        data: [{ time: '2024-01-01', value: 100 }],
        options: {},
      };

      expect(() => {
        createSeries(invalidChart as any, seriesConfig);
      }).toThrow();
    });
  });
});
