/**
 * @vitest-environment jsdom
 */
/**
 * Visual Regression Tests for Bar and Histogram Series
 *
 * Tests verify actual canvas rendering of bar and histogram charts including:
 * - Bar colors (up/down)
 * - Histogram colors and values
 * - Open tick visibility
 * - Base value rendering
 *
 * @group visual
 */

import { describe, it, expect, afterEach } from 'vitest';
import {
  renderChart,
  cleanupChartRender,
  assertMatchesSnapshot,
  sanitizeTestName,
  generateBarData,
  generateHistogramData,
  TestColors,
  BarSeries,
  HistogramSeries,
  LineStyle,
  type ChartRenderResult,
} from '../utils';

describe('Bar Series Visual Rendering', () => {
  let renderResult: ChartRenderResult | null = null;

  afterEach(() => {
    if (renderResult) {
      cleanupChartRender(renderResult);
      renderResult = null;
    }
  });

  it('renders basic bar series', async () => {
    renderResult = await renderChart(chart => {
      const series = chart.addSeries(BarSeries, {
        upColor: TestColors.UP_COLOR,
        downColor: TestColors.DOWN_COLOR,
      });

      series.setData(generateBarData(30, 100));
    });

    const comparisonResult = assertMatchesSnapshot(
      sanitizeTestName('bar-basic'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(comparisonResult.matches).toBe(true);
  });

  it('renders bar series with open tick visible', async () => {
    renderResult = await renderChart(chart => {
      const series = chart.addSeries(BarSeries, {
        upColor: TestColors.UP_COLOR,
        downColor: TestColors.DOWN_COLOR,
        thinBars: false,
        openVisible: true,
      });

      series.setData(generateBarData(30, 100));
    });

    const comparisonResult = assertMatchesSnapshot(
      sanitizeTestName('bar-open-tick-visible'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(comparisonResult.matches).toBe(true);
  });

  it('renders bar series with thin bars', async () => {
    renderResult = await renderChart(chart => {
      const series = chart.addSeries(BarSeries, {
        upColor: TestColors.UP_COLOR,
        downColor: TestColors.DOWN_COLOR,
        thinBars: true,
      });

      series.setData(generateBarData(30, 100));
    });

    const comparisonResult = assertMatchesSnapshot(
      sanitizeTestName('bar-thin-bars'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(comparisonResult.matches).toBe(true);
  });

  it('renders bar series with custom colors', async () => {
    renderResult = await renderChart(chart => {
      const series = chart.addSeries(BarSeries, {
        upColor: '#4CAF50',
        downColor: '#F44336',
      });

      series.setData(generateBarData(30, 100));
    });

    const comparisonResult = assertMatchesSnapshot(
      sanitizeTestName('bar-custom-colors'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(comparisonResult.matches).toBe(true);
  });

  it('renders bar series with custom price line styling', async () => {
    renderResult = await renderChart(
      chart => {
        const series = chart.addSeries(BarSeries, {
          upColor: TestColors.UP_COLOR,
          downColor: TestColors.DOWN_COLOR,
          priceLineVisible: true,
          priceLineColor: '#FF0000',
          priceLineWidth: 2,
          priceLineStyle: LineStyle.Solid,
          lastValueVisible: true,
        });

        series.setData(generateBarData(30, 100));
      },
      {
        chartOptions: {
          rightPriceScale: { visible: true },
        },
      }
    );

    const comparisonResult = assertMatchesSnapshot(
      sanitizeTestName('bar-custom-price-line'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(comparisonResult.matches).toBe(true);
  });

  it('renders bar series with title label', async () => {
    renderResult = await renderChart(
      chart => {
        const series = chart.addSeries(BarSeries, {
          upColor: TestColors.UP_COLOR,
          downColor: TestColors.DOWN_COLOR,
          title: 'OHLC Bars',
          lastValueVisible: true,
        });

        series.setData(generateBarData(30, 100));
      },
      {
        chartOptions: {
          rightPriceScale: { visible: true },
        },
      }
    );

    const comparisonResult = assertMatchesSnapshot(
      sanitizeTestName('bar-with-title'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(comparisonResult.matches).toBe(true);
  });

  it('renders chart with hidden bar series', async () => {
    renderResult = await renderChart(chart => {
      const visibleSeries = chart.addSeries(BarSeries, {
        upColor: TestColors.UP_COLOR,
        downColor: TestColors.DOWN_COLOR,
        visible: true,
      });

      const hiddenSeries = chart.addSeries(BarSeries, {
        upColor: '#4CAF50',
        downColor: '#F44336',
        visible: false,
      });

      const baseData = generateBarData(30, 100, '2024-01-01');
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
      sanitizeTestName('bar-visibility-toggle'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(comparisonResult.matches).toBe(true);
  });
});

describe('Histogram Series Visual Rendering', () => {
  let renderResult: ChartRenderResult | null = null;

  afterEach(() => {
    if (renderResult) {
      cleanupChartRender(renderResult);
      renderResult = null;
    }
  });

  it('renders basic histogram series', async () => {
    renderResult = await renderChart(chart => {
      const series = chart.addSeries(HistogramSeries, {
        color: TestColors.BLUE,
      });

      series.setData(generateHistogramData(30, 0));
    });

    const comparisonResult = assertMatchesSnapshot(
      sanitizeTestName('histogram-basic'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(comparisonResult.matches).toBe(true);
  });

  it('renders histogram with base value', async () => {
    renderResult = await renderChart(chart => {
      const series = chart.addSeries(HistogramSeries, {
        color: TestColors.GREEN,
        base: 0,
      });

      series.setData(generateHistogramData(30, 0));
    });

    const comparisonResult = assertMatchesSnapshot(
      sanitizeTestName('histogram-base-value'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(comparisonResult.matches).toBe(true);
  });

  it('renders histogram with color variation', async () => {
    renderResult = await renderChart(chart => {
      const series = chart.addSeries(HistogramSeries);

      // Data with varying colors (generated with colors)
      series.setData(generateHistogramData(30, 0));
    });

    const comparisonResult = assertMatchesSnapshot(
      sanitizeTestName('histogram-color-variation'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(comparisonResult.matches).toBe(true);
  });

  it('renders histogram with price axis visible', async () => {
    renderResult = await renderChart(
      chart => {
        const series = chart.addSeries(HistogramSeries, {
          color: TestColors.ORANGE,
          priceLineVisible: true,
          lastValueVisible: true,
        });

        series.setData(generateHistogramData(30, 0));
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
      sanitizeTestName('histogram-price-axis-visible'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(comparisonResult.matches).toBe(true);
  });

  it('renders histogram on dark background', async () => {
    renderResult = await renderChart(
      chart => {
        const series = chart.addSeries(HistogramSeries);

        series.setData(generateHistogramData(30, 0));
      },
      {
        chartOptions: {
          layout: {
            background: { color: '#1E1E1E' },
            textColor: '#FFFFFF',
          },
        },
      }
    );

    const comparisonResult = assertMatchesSnapshot(
      sanitizeTestName('histogram-dark-background'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(comparisonResult.matches).toBe(true);
  });

  it('renders histogram with custom price line styling', async () => {
    renderResult = await renderChart(
      chart => {
        const series = chart.addSeries(HistogramSeries, {
          color: TestColors.BLUE,
          priceLineVisible: true,
          priceLineColor: '#FF0000',
          priceLineWidth: 2,
          priceLineStyle: LineStyle.Solid,
          lastValueVisible: true,
        });

        series.setData(generateHistogramData(30, 0));
      },
      {
        chartOptions: {
          rightPriceScale: { visible: true },
        },
      }
    );

    const comparisonResult = assertMatchesSnapshot(
      sanitizeTestName('histogram-custom-price-line'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(comparisonResult.matches).toBe(true);
  });

  it('renders histogram with title label', async () => {
    renderResult = await renderChart(
      chart => {
        const series = chart.addSeries(HistogramSeries, {
          color: TestColors.GREEN,
          title: 'Volume',
          lastValueVisible: true,
        });

        series.setData(generateHistogramData(30, 0));
      },
      {
        chartOptions: {
          rightPriceScale: { visible: true },
        },
      }
    );

    const comparisonResult = assertMatchesSnapshot(
      sanitizeTestName('histogram-with-title'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(comparisonResult.matches).toBe(true);
  });

  it('renders chart with hidden histogram series', async () => {
    renderResult = await renderChart(chart => {
      const visibleSeries = chart.addSeries(HistogramSeries, {
        color: TestColors.BLUE,
        visible: true,
      });

      const hiddenSeries = chart.addSeries(HistogramSeries, {
        color: TestColors.RED,
        visible: false,
      });

      visibleSeries.setData(generateHistogramData(30, 0, '2024-01-01'));
      hiddenSeries.setData(
        generateHistogramData(30, 0, '2024-01-01').map(d => ({
          ...d,
          value: d.value + 10,
        }))
      );
    });

    const comparisonResult = assertMatchesSnapshot(
      sanitizeTestName('histogram-visibility-toggle'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(comparisonResult.matches).toBe(true);
  });
});
