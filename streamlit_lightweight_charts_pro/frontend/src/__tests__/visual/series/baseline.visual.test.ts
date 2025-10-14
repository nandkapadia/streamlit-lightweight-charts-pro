/**
 * @vitest-environment jsdom
 */
/**
 * Visual Regression Tests for Baseline Series
 *
 * Tests verify actual canvas rendering of baseline charts including:
 * - Above/below baseline fills
 * - Baseline value rendering
 * - Line and fill colors
 * - Baseline position
 *
 * @group visual
 */

import { describe, it, expect, afterEach } from 'vitest';
import {
  renderChart,
  cleanupChartRender,
  assertMatchesSnapshot,
  sanitizeTestName,
  generateBaselineData,
  TestColors,
  BaselineSeries,
  LineStyle,
  LineType,
  type ChartRenderResult,
} from '../utils';

describe('Baseline Series Visual Rendering', () => {
  let renderResult: ChartRenderResult | null = null;

  afterEach(() => {
    if (renderResult) {
      cleanupChartRender(renderResult);
      renderResult = null;
    }
  });

  it('renders basic baseline series', async () => {
    renderResult = await renderChart(chart => {
      const series = chart.addSeries(BaselineSeries, {
        baseValue: { type: 'price', price: 100 },
        topLineColor: TestColors.GREEN,
        topFillColor1: 'rgba(76, 175, 80, 0.28)',
        topFillColor2: 'rgba(76, 175, 80, 0.05)',
        bottomLineColor: TestColors.RED,
        bottomFillColor1: 'rgba(244, 67, 54, 0.05)',
        bottomFillColor2: 'rgba(244, 67, 54, 0.28)',
      });

      series.setData(generateBaselineData(30, 100));
    });

    const comparisonResult = assertMatchesSnapshot(
      sanitizeTestName('baseline-basic'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(comparisonResult.matches).toBe(true);
  });

  it('renders baseline series with custom colors', async () => {
    renderResult = await renderChart(chart => {
      const series = chart.addSeries(BaselineSeries, {
        baseValue: { type: 'price', price: 100 },
        topLineColor: '#2196F3',
        topFillColor1: 'rgba(33, 150, 243, 0.4)',
        topFillColor2: 'rgba(33, 150, 243, 0.1)',
        bottomLineColor: '#FF9800',
        bottomFillColor1: 'rgba(255, 152, 0, 0.1)',
        bottomFillColor2: 'rgba(255, 152, 0, 0.4)',
        lineWidth: 2,
      });

      series.setData(generateBaselineData(30, 100));
    });

    const comparisonResult = assertMatchesSnapshot(
      sanitizeTestName('baseline-custom-colors'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(comparisonResult.matches).toBe(true);
  });

  it('renders baseline series with different baseline value', async () => {
    renderResult = await renderChart(chart => {
      const series = chart.addSeries(BaselineSeries, {
        baseValue: { type: 'price', price: 110 },
        topLineColor: TestColors.GREEN,
        topFillColor1: 'rgba(76, 175, 80, 0.28)',
        topFillColor2: 'rgba(76, 175, 80, 0.05)',
        bottomLineColor: TestColors.RED,
        bottomFillColor1: 'rgba(244, 67, 54, 0.05)',
        bottomFillColor2: 'rgba(244, 67, 54, 0.28)',
      });

      series.setData(generateBaselineData(30, 100));
    });

    const comparisonResult = assertMatchesSnapshot(
      sanitizeTestName('baseline-different-value'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(comparisonResult.matches).toBe(true);
  });

  it('renders baseline series with price axis visible', async () => {
    renderResult = await renderChart(
      chart => {
        const series = chart.addSeries(BaselineSeries, {
          baseValue: { type: 'price', price: 100 },
          topLineColor: TestColors.GREEN,
          topFillColor1: 'rgba(76, 175, 80, 0.28)',
          topFillColor2: 'rgba(76, 175, 80, 0.05)',
          bottomLineColor: TestColors.RED,
          bottomFillColor1: 'rgba(244, 67, 54, 0.05)',
          bottomFillColor2: 'rgba(244, 67, 54, 0.28)',
          priceLineVisible: true,
          lastValueVisible: true,
        });

        series.setData(generateBaselineData(30, 100));
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
      sanitizeTestName('baseline-price-axis-visible'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(comparisonResult.matches).toBe(true);
  });

  it('renders baseline series on dark background', async () => {
    renderResult = await renderChart(
      chart => {
        const series = chart.addSeries(BaselineSeries, {
          baseValue: { type: 'price', price: 100 },
          topLineColor: '#26A69A',
          topFillColor1: 'rgba(38, 166, 154, 0.28)',
          topFillColor2: 'rgba(38, 166, 154, 0.05)',
          bottomLineColor: '#EF5350',
          bottomFillColor1: 'rgba(239, 83, 80, 0.05)',
          bottomFillColor2: 'rgba(239, 83, 80, 0.28)',
        });

        series.setData(generateBaselineData(30, 100));
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
      sanitizeTestName('baseline-dark-background'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(comparisonResult.matches).toBe(true);
  });

  it('renders baseline series with crosshair', async () => {
    renderResult = await renderChart(
      chart => {
        const series = chart.addSeries(BaselineSeries, {
          baseValue: { type: 'price', price: 100 },
          topLineColor: TestColors.GREEN,
          topFillColor1: 'rgba(76, 175, 80, 0.28)',
          topFillColor2: 'rgba(76, 175, 80, 0.05)',
          bottomLineColor: TestColors.RED,
          bottomFillColor1: 'rgba(244, 67, 54, 0.05)',
          bottomFillColor2: 'rgba(244, 67, 54, 0.28)',
          crosshairMarkerVisible: true,
        });

        series.setData(generateBaselineData(30, 100));
      },
      {
        chartOptions: {
          crosshair: {
            mode: 1,
            vertLine: { visible: true },
            horzLine: { visible: true },
          },
        },
      }
    );

    const comparisonResult = assertMatchesSnapshot(
      sanitizeTestName('baseline-crosshair'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(comparisonResult.matches).toBe(true);
  });

  it('renders baseline series with thin line width', async () => {
    renderResult = await renderChart(chart => {
      const series = chart.addSeries(BaselineSeries, {
        baseValue: { type: 'price', price: 100 },
        topLineColor: TestColors.GREEN,
        topFillColor1: 'rgba(76, 175, 80, 0.28)',
        topFillColor2: 'rgba(76, 175, 80, 0.05)',
        bottomLineColor: TestColors.RED,
        bottomFillColor1: 'rgba(244, 67, 54, 0.05)',
        bottomFillColor2: 'rgba(244, 67, 54, 0.28)',
        lineWidth: 1,
      });

      series.setData(generateBaselineData(30, 100));
    });

    const comparisonResult = assertMatchesSnapshot(
      sanitizeTestName('baseline-thin-line'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(comparisonResult.matches).toBe(true);
  });

  it('renders baseline series with thick line width', async () => {
    renderResult = await renderChart(chart => {
      const series = chart.addSeries(BaselineSeries, {
        baseValue: { type: 'price', price: 100 },
        topLineColor: TestColors.GREEN,
        topFillColor1: 'rgba(76, 175, 80, 0.28)',
        topFillColor2: 'rgba(76, 175, 80, 0.05)',
        bottomLineColor: TestColors.RED,
        bottomFillColor1: 'rgba(244, 67, 54, 0.05)',
        bottomFillColor2: 'rgba(244, 67, 54, 0.28)',
        lineWidth: 4,
      });

      series.setData(generateBaselineData(30, 100));
    });

    const comparisonResult = assertMatchesSnapshot(
      sanitizeTestName('baseline-thick-line'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(comparisonResult.matches).toBe(true);
  });

  it('renders baseline series with dashed line style', async () => {
    renderResult = await renderChart(chart => {
      const series = chart.addSeries(BaselineSeries, {
        baseValue: { type: 'price', price: 100 },
        topLineColor: TestColors.GREEN,
        topFillColor1: 'rgba(76, 175, 80, 0.28)',
        topFillColor2: 'rgba(76, 175, 80, 0.05)',
        bottomLineColor: TestColors.RED,
        bottomFillColor1: 'rgba(244, 67, 54, 0.05)',
        bottomFillColor2: 'rgba(244, 67, 54, 0.28)',
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
      });

      series.setData(generateBaselineData(30, 100));
    });

    const comparisonResult = assertMatchesSnapshot(
      sanitizeTestName('baseline-dashed-line'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(comparisonResult.matches).toBe(true);
  });

  it('renders baseline series with dotted line style', async () => {
    renderResult = await renderChart(chart => {
      const series = chart.addSeries(BaselineSeries, {
        baseValue: { type: 'price', price: 100 },
        topLineColor: TestColors.GREEN,
        topFillColor1: 'rgba(76, 175, 80, 0.28)',
        topFillColor2: 'rgba(76, 175, 80, 0.05)',
        bottomLineColor: TestColors.RED,
        bottomFillColor1: 'rgba(244, 67, 54, 0.05)',
        bottomFillColor2: 'rgba(244, 67, 54, 0.28)',
        lineWidth: 2,
        lineStyle: LineStyle.Dotted,
      });

      series.setData(generateBaselineData(30, 100));
    });

    const comparisonResult = assertMatchesSnapshot(
      sanitizeTestName('baseline-dotted-line'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(comparisonResult.matches).toBe(true);
  });

  it('renders baseline series with stepped line type', async () => {
    renderResult = await renderChart(chart => {
      const series = chart.addSeries(BaselineSeries, {
        baseValue: { type: 'price', price: 100 },
        topLineColor: TestColors.GREEN,
        topFillColor1: 'rgba(76, 175, 80, 0.28)',
        topFillColor2: 'rgba(76, 175, 80, 0.05)',
        bottomLineColor: TestColors.RED,
        bottomFillColor1: 'rgba(244, 67, 54, 0.05)',
        bottomFillColor2: 'rgba(244, 67, 54, 0.28)',
        lineWidth: 2,
        lineType: LineType.WithSteps,
      });

      series.setData(generateBaselineData(30, 100));
    });

    const comparisonResult = assertMatchesSnapshot(
      sanitizeTestName('baseline-stepped-line'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(comparisonResult.matches).toBe(true);
  });

  it('renders baseline series with custom price line styling', async () => {
    renderResult = await renderChart(
      chart => {
        const series = chart.addSeries(BaselineSeries, {
          baseValue: { type: 'price', price: 100 },
          topLineColor: TestColors.GREEN,
          topFillColor1: 'rgba(76, 175, 80, 0.28)',
          topFillColor2: 'rgba(76, 175, 80, 0.05)',
          bottomLineColor: TestColors.RED,
          bottomFillColor1: 'rgba(244, 67, 54, 0.05)',
          bottomFillColor2: 'rgba(244, 67, 54, 0.28)',
          priceLineVisible: true,
          priceLineColor: '#FF0000',
          priceLineWidth: 2,
          priceLineStyle: LineStyle.Solid,
          lastValueVisible: true,
        });

        series.setData(generateBaselineData(30, 100));
      },
      {
        chartOptions: {
          rightPriceScale: { visible: true },
        },
      }
    );

    const comparisonResult = assertMatchesSnapshot(
      sanitizeTestName('baseline-custom-price-line'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(comparisonResult.matches).toBe(true);
  });

  it('renders baseline series with title label', async () => {
    renderResult = await renderChart(
      chart => {
        const series = chart.addSeries(BaselineSeries, {
          baseValue: { type: 'price', price: 100 },
          topLineColor: TestColors.GREEN,
          topFillColor1: 'rgba(76, 175, 80, 0.28)',
          topFillColor2: 'rgba(76, 175, 80, 0.05)',
          bottomLineColor: TestColors.RED,
          bottomFillColor1: 'rgba(244, 67, 54, 0.05)',
          bottomFillColor2: 'rgba(244, 67, 54, 0.28)',
          title: 'Baseline Series',
          lastValueVisible: true,
        });

        series.setData(generateBaselineData(30, 100));
      },
      {
        chartOptions: {
          rightPriceScale: { visible: true },
        },
      }
    );

    const comparisonResult = assertMatchesSnapshot(
      sanitizeTestName('baseline-with-title'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(comparisonResult.matches).toBe(true);
  });

  it('renders chart with hidden baseline series', async () => {
    renderResult = await renderChart(chart => {
      const visibleSeries = chart.addSeries(BaselineSeries, {
        baseValue: { type: 'price', price: 100 },
        topLineColor: TestColors.GREEN,
        topFillColor1: 'rgba(76, 175, 80, 0.28)',
        topFillColor2: 'rgba(76, 175, 80, 0.05)',
        bottomLineColor: TestColors.RED,
        bottomFillColor1: 'rgba(244, 67, 54, 0.05)',
        bottomFillColor2: 'rgba(244, 67, 54, 0.28)',
        visible: true,
      });

      const hiddenSeries = chart.addSeries(BaselineSeries, {
        baseValue: { type: 'price', price: 100 },
        topLineColor: '#2196F3',
        topFillColor1: 'rgba(33, 150, 243, 0.28)',
        topFillColor2: 'rgba(33, 150, 243, 0.05)',
        bottomLineColor: '#FF9800',
        bottomFillColor1: 'rgba(255, 152, 0, 0.05)',
        bottomFillColor2: 'rgba(255, 152, 0, 0.28)',
        visible: false,
      });

      visibleSeries.setData(generateBaselineData(30, 100, '2024-01-01'));
      hiddenSeries.setData(generateBaselineData(30, 105, '2024-01-01'));
    });

    const comparisonResult = assertMatchesSnapshot(
      sanitizeTestName('baseline-visibility-toggle'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(comparisonResult.matches).toBe(true);
  });
});
