/**
 * @vitest-environment jsdom
 */
/**
 * Visual Regression Tests for Candlestick Series
 *
 * Tests verify actual canvas rendering of candlestick charts including:
 * - Up/down candle colors
 * - Wick rendering
 * - Border colors
 * - Candlestick body rendering
 *
 * @group visual
 */

import { describe, it, expect, afterEach } from 'vitest';
import {
  renderChart,
  cleanupChartRender,
  assertMatchesSnapshot,
  sanitizeTestName,
  generateCandlestickData,
  TestColors,
  CandlestickSeries,
  LineStyle,
  type ChartRenderResult,
} from '../utils';

describe('Candlestick Series Visual Rendering', () => {
  let renderResult: ChartRenderResult | null = null;

  afterEach(() => {
    if (renderResult) {
      cleanupChartRender(renderResult);
      renderResult = null;
    }
  });

  it('renders basic candlestick series with default colors', async () => {
    renderResult = await renderChart(chart => {
      const series = chart.addSeries(CandlestickSeries, {
        upColor: TestColors.UP_COLOR,
        downColor: TestColors.DOWN_COLOR,
        wickUpColor: TestColors.UP_WICK,
        wickDownColor: TestColors.DOWN_WICK,
        borderVisible: false,
      });

      series.setData(generateCandlestickData(30, 100));
    });

    const comparisonResult = assertMatchesSnapshot(
      sanitizeTestName('candlestick-basic-default-colors'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(comparisonResult.matches).toBe(true);
  });

  it('renders candlestick series with borders', async () => {
    renderResult = await renderChart(chart => {
      const series = chart.addSeries(CandlestickSeries, {
        upColor: TestColors.UP_COLOR,
        downColor: TestColors.DOWN_COLOR,
        wickUpColor: TestColors.UP_WICK,
        wickDownColor: TestColors.DOWN_WICK,
        borderVisible: true,
        borderUpColor: '#1B5E20',
        borderDownColor: '#B71C1C',
      });

      series.setData(generateCandlestickData(30, 100));
    });

    const comparisonResult = assertMatchesSnapshot(
      sanitizeTestName('candlestick-with-borders'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(comparisonResult.matches).toBe(true);
  });

  it('renders candlestick series with custom colors', async () => {
    renderResult = await renderChart(chart => {
      const series = chart.addSeries(CandlestickSeries, {
        upColor: '#4CAF50',
        downColor: '#F44336',
        wickUpColor: '#2E7D32',
        wickDownColor: '#C62828',
        borderVisible: false,
      });

      series.setData(generateCandlestickData(30, 100));
    });

    const comparisonResult = assertMatchesSnapshot(
      sanitizeTestName('candlestick-custom-colors'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(comparisonResult.matches).toBe(true);
  });

  it('renders candlestick series with visible wicks', async () => {
    renderResult = await renderChart(chart => {
      const series = chart.addSeries(CandlestickSeries, {
        upColor: TestColors.UP_COLOR,
        downColor: TestColors.DOWN_COLOR,
        wickUpColor: TestColors.UP_WICK,
        wickDownColor: TestColors.DOWN_WICK,
        wickVisible: true,
        borderVisible: false,
      });

      series.setData(generateCandlestickData(30, 100));
    });

    const comparisonResult = assertMatchesSnapshot(
      sanitizeTestName('candlestick-visible-wicks'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(comparisonResult.matches).toBe(true);
  });

  it('renders candlestick series with price axis labels', async () => {
    renderResult = await renderChart(
      chart => {
        const series = chart.addSeries(CandlestickSeries, {
          upColor: TestColors.UP_COLOR,
          downColor: TestColors.DOWN_COLOR,
          wickUpColor: TestColors.UP_WICK,
          wickDownColor: TestColors.DOWN_WICK,
          priceLineVisible: true,
          lastValueVisible: true,
        });

        series.setData(generateCandlestickData(30, 100));
      },
      {
        chartOptions: {
          rightPriceScale: {
            visible: true,
            borderVisible: true,
          },
        },
      }
    );

    const comparisonResult = assertMatchesSnapshot(
      sanitizeTestName('candlestick-price-axis-labels'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(comparisonResult.matches).toBe(true);
  });

  it('renders candlestick series with crosshair', async () => {
    renderResult = await renderChart(
      chart => {
        const series = chart.addSeries(CandlestickSeries, {
          upColor: TestColors.UP_COLOR,
          downColor: TestColors.DOWN_COLOR,
          wickUpColor: TestColors.UP_WICK,
          wickDownColor: TestColors.DOWN_WICK,
        });

        series.setData(generateCandlestickData(30, 100));
      },
      {
        chartOptions: {
          crosshair: {
            mode: 1, // Normal
            vertLine: {
              visible: true,
              width: 1,
              color: '#758696',
              style: 0, // Solid
            },
            horzLine: {
              visible: true,
              width: 1,
              color: '#758696',
              style: 0, // Solid
            },
          },
        },
      }
    );

    const comparisonResult = assertMatchesSnapshot(
      sanitizeTestName('candlestick-crosshair'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(comparisonResult.matches).toBe(true);
  });

  it('renders candlestick series with grid lines', async () => {
    renderResult = await renderChart(
      chart => {
        const series = chart.addSeries(CandlestickSeries, {
          upColor: TestColors.UP_COLOR,
          downColor: TestColors.DOWN_COLOR,
          wickUpColor: TestColors.UP_WICK,
          wickDownColor: TestColors.DOWN_WICK,
        });

        series.setData(generateCandlestickData(30, 100));
      },
      {
        chartOptions: {
          grid: {
            vertLines: { visible: true, color: '#E0E0E0' },
            horzLines: { visible: true, color: '#E0E0E0' },
          },
        },
      }
    );

    const comparisonResult = assertMatchesSnapshot(
      sanitizeTestName('candlestick-grid-lines'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(comparisonResult.matches).toBe(true);
  });

  it('renders candlestick series on dark background', async () => {
    renderResult = await renderChart(
      chart => {
        const series = chart.addSeries(CandlestickSeries, {
          upColor: '#26A69A',
          downColor: '#EF5350',
          wickUpColor: '#26A69A',
          wickDownColor: '#EF5350',
          borderVisible: false,
        });

        series.setData(generateCandlestickData(30, 100));
      },
      {
        chartOptions: {
          layout: {
            background: { color: '#1E1E1E' },
            textColor: '#FFFFFF',
          },
          grid: {
            vertLines: { visible: false },
            horzLines: { visible: false },
          },
        },
      }
    );

    const comparisonResult = assertMatchesSnapshot(
      sanitizeTestName('candlestick-dark-background'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(comparisonResult.matches).toBe(true);
  });

  it('renders candlestick series with general border color', async () => {
    renderResult = await renderChart(chart => {
      const series = chart.addSeries(CandlestickSeries, {
        upColor: TestColors.UP_COLOR,
        downColor: TestColors.DOWN_COLOR,
        wickUpColor: TestColors.UP_WICK,
        wickDownColor: TestColors.DOWN_WICK,
        borderVisible: true,
        borderColor: '#000000',
      });

      series.setData(generateCandlestickData(30, 100));
    });

    const comparisonResult = assertMatchesSnapshot(
      sanitizeTestName('candlestick-general-border-color'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(comparisonResult.matches).toBe(true);
  });

  it('renders candlestick series with general wick color', async () => {
    renderResult = await renderChart(chart => {
      const series = chart.addSeries(CandlestickSeries, {
        upColor: TestColors.UP_COLOR,
        downColor: TestColors.DOWN_COLOR,
        wickVisible: true,
        wickColor: '#757575',
      });

      series.setData(generateCandlestickData(30, 100));
    });

    const comparisonResult = assertMatchesSnapshot(
      sanitizeTestName('candlestick-general-wick-color'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(comparisonResult.matches).toBe(true);
  });

  it('renders candlestick series with custom price line styling', async () => {
    renderResult = await renderChart(
      chart => {
        const series = chart.addSeries(CandlestickSeries, {
          upColor: TestColors.UP_COLOR,
          downColor: TestColors.DOWN_COLOR,
          wickUpColor: TestColors.UP_WICK,
          wickDownColor: TestColors.DOWN_WICK,
          priceLineVisible: true,
          priceLineColor: '#FF0000',
          priceLineWidth: 2,
          priceLineStyle: LineStyle.Solid,
          lastValueVisible: true,
        });

        series.setData(generateCandlestickData(30, 100));
      },
      {
        chartOptions: {
          rightPriceScale: { visible: true },
        },
      }
    );

    const comparisonResult = assertMatchesSnapshot(
      sanitizeTestName('candlestick-custom-price-line'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(comparisonResult.matches).toBe(true);
  });

  it('renders candlestick series with title label', async () => {
    renderResult = await renderChart(
      chart => {
        const series = chart.addSeries(CandlestickSeries, {
          upColor: TestColors.UP_COLOR,
          downColor: TestColors.DOWN_COLOR,
          wickUpColor: TestColors.UP_WICK,
          wickDownColor: TestColors.DOWN_WICK,
          title: 'BTC/USD',
          lastValueVisible: true,
        });

        series.setData(generateCandlestickData(30, 100));
      },
      {
        chartOptions: {
          rightPriceScale: { visible: true },
        },
      }
    );

    const comparisonResult = assertMatchesSnapshot(
      sanitizeTestName('candlestick-with-title'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(comparisonResult.matches).toBe(true);
  });

  it('renders chart with hidden candlestick series', async () => {
    renderResult = await renderChart(chart => {
      const visibleSeries = chart.addSeries(CandlestickSeries, {
        upColor: TestColors.UP_COLOR,
        downColor: TestColors.DOWN_COLOR,
        wickUpColor: TestColors.UP_WICK,
        wickDownColor: TestColors.DOWN_WICK,
        visible: true,
      });

      const hiddenSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#4CAF50',
        downColor: '#F44336',
        wickUpColor: '#2E7D32',
        wickDownColor: '#C62828',
        visible: false,
      });

      const baseData = generateCandlestickData(30, 100, '2024-01-01');
      visibleSeries.setData(baseData);
      hiddenSeries.setData(
        baseData.map(d => ({
          ...d,
          open: d.open + 5,
          high: d.high + 5,
          low: d.low + 5,
          close: d.close + 5,
        }))
      );
    });

    const comparisonResult = assertMatchesSnapshot(
      sanitizeTestName('candlestick-visibility-toggle'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(comparisonResult.matches).toBe(true);
  });
});
