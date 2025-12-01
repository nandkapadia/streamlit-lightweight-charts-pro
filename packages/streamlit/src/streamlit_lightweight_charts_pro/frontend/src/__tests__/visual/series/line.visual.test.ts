/**
 * @vitest-environment jsdom
 */
/**
 * Visual Regression Tests for Line Series
 *
 * Tests verify actual canvas rendering of line charts including:
 * - Line colors and styles
 * - Line width
 * - Markers and points
 * - Multiple lines
 *
 * @group visual
 */

import { describe, it, expect, afterEach } from 'vitest';
import {
  renderChart,
  cleanupChartRender,
  assertMatchesSnapshot,
  sanitizeTestName,
  generateLineData,
  TestColors,
  LineSeries,
  LineStyle,
  LineType,
  type ChartRenderResult,
} from '../utils';

describe('Line Series Visual Rendering', () => {
  let renderResult: ChartRenderResult | null = null;

  afterEach(() => {
    if (renderResult) {
      cleanupChartRender(renderResult);
      renderResult = null;
    }
  });

  it('renders basic line series with solid line', async () => {
    renderResult = await renderChart(chart => {
      const series = chart.addSeries(LineSeries, {
        color: TestColors.BLUE,
        lineWidth: 2,
        lineStyle: LineStyle.Solid,
      });

      series.setData(generateLineData(30, 100));
    });

    const comparisonResult = assertMatchesSnapshot(
      sanitizeTestName('line-basic-solid'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(comparisonResult.matches).toBe(true);
  });

  it('renders line series with dashed style', async () => {
    renderResult = await renderChart(chart => {
      const series = chart.addSeries(LineSeries, {
        color: TestColors.RED,
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
      });

      series.setData(generateLineData(30, 100));
    });

    const comparisonResult = assertMatchesSnapshot(
      sanitizeTestName('line-dashed-style'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(comparisonResult.matches).toBe(true);
  });

  it('renders line series with dotted style', async () => {
    renderResult = await renderChart(chart => {
      const series = chart.addSeries(LineSeries, {
        color: TestColors.GREEN,
        lineWidth: 2,
        lineStyle: LineStyle.Dotted,
      });

      series.setData(generateLineData(30, 100));
    });

    const comparisonResult = assertMatchesSnapshot(
      sanitizeTestName('line-dotted-style'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(comparisonResult.matches).toBe(true);
  });

  it('renders line series with thick line width', async () => {
    renderResult = await renderChart(chart => {
      const series = chart.addSeries(LineSeries, {
        color: TestColors.ORANGE,
        lineWidth: 5 as any,
        lineStyle: LineStyle.Solid,
      });

      series.setData(generateLineData(30, 100));
    });

    const comparisonResult = assertMatchesSnapshot(
      sanitizeTestName('line-thick-width'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(comparisonResult.matches).toBe(true);
  });

  it('renders line series with crosshair marker', async () => {
    renderResult = await renderChart(
      chart => {
        const series = chart.addSeries(LineSeries, {
          color: TestColors.PURPLE,
          lineWidth: 2,
          crosshairMarkerVisible: true,
          crosshairMarkerRadius: 5,
        });

        series.setData(generateLineData(30, 100));
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
      sanitizeTestName('line-crosshair-marker'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(comparisonResult.matches).toBe(true);
  });

  it('renders multiple line series with different colors', async () => {
    renderResult = await renderChart(chart => {
      const series1 = chart.addSeries(LineSeries, {
        color: TestColors.BLUE,
        lineWidth: 2,
      });

      const series2 = chart.addSeries(LineSeries, {
        color: TestColors.RED,
        lineWidth: 2,
      });

      const series3 = chart.addSeries(LineSeries, {
        color: TestColors.GREEN,
        lineWidth: 2,
      });

      series1.setData(generateLineData(30, 100, '2024-01-01'));
      series2.setData(generateLineData(30, 105, '2024-01-01'));
      series3.setData(generateLineData(30, 95, '2024-01-01'));
    });

    const comparisonResult = assertMatchesSnapshot(
      sanitizeTestName('line-multiple-series'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(comparisonResult.matches).toBe(true);
  });

  it('renders line series with price axis visible', async () => {
    renderResult = await renderChart(
      chart => {
        const series = chart.addSeries(LineSeries, {
          color: TestColors.BLUE,
          lineWidth: 2,
          priceLineVisible: true,
          lastValueVisible: true,
        });

        series.setData(generateLineData(30, 100));
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
      sanitizeTestName('line-price-axis-visible'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(comparisonResult.matches).toBe(true);
  });

  it('renders line series on dark background', async () => {
    renderResult = await renderChart(
      chart => {
        const series = chart.addSeries(LineSeries, {
          color: '#00E676',
          lineWidth: 2,
        });

        series.setData(generateLineData(30, 100));
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
      sanitizeTestName('line-dark-background'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(comparisonResult.matches).toBe(true);
  });

  it('renders line series with stepped line type', async () => {
    renderResult = await renderChart(chart => {
      const series = chart.addSeries(LineSeries, {
        color: TestColors.BLUE,
        lineWidth: 2,
        lineType: LineType.WithSteps,
      });
      series.setData(generateLineData(30, 100));
    });

    const comparisonResult = assertMatchesSnapshot(
      sanitizeTestName('line-stepped-type'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(comparisonResult.matches).toBe(true);
  });

  it('renders line series with line hidden (markers only)', async () => {
    renderResult = await renderChart(chart => {
      const series = chart.addSeries(LineSeries, {
        color: TestColors.BLUE,
        lineVisible: false,
        pointMarkersVisible: true,
        pointMarkersRadius: 4,
      });
      series.setData(generateLineData(30, 100));
    });

    const comparisonResult = assertMatchesSnapshot(
      sanitizeTestName('line-hidden-markers-only'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(comparisonResult.matches).toBe(true);
  });

  it('renders line series with point markers', async () => {
    renderResult = await renderChart(chart => {
      const series = chart.addSeries(LineSeries, {
        color: TestColors.BLUE,
        lineWidth: 2,
        pointMarkersVisible: true,
        pointMarkersRadius: 5,
      });
      series.setData(generateLineData(15, 100));
    });

    const comparisonResult = assertMatchesSnapshot(
      sanitizeTestName('line-point-markers'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(comparisonResult.matches).toBe(true);
  });

  it('renders line series with large point markers', async () => {
    renderResult = await renderChart(chart => {
      const series = chart.addSeries(LineSeries, {
        color: TestColors.ORANGE,
        lineWidth: 1,
        pointMarkersVisible: true,
        pointMarkersRadius: 8,
      });
      series.setData(generateLineData(15, 100));
    });

    const comparisonResult = assertMatchesSnapshot(
      sanitizeTestName('line-large-point-markers'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(comparisonResult.matches).toBe(true);
  });

  it('renders line series with custom price line styling', async () => {
    renderResult = await renderChart(
      chart => {
        const series = chart.addSeries(LineSeries, {
          color: TestColors.BLUE,
          lineWidth: 2,
          priceLineVisible: true,
          priceLineColor: '#FF0000',
          priceLineWidth: 2,
          priceLineStyle: LineStyle.Solid,
          lastValueVisible: true,
        });
        series.setData(generateLineData(30, 100));
      },
      {
        chartOptions: {
          rightPriceScale: { visible: true },
        },
      }
    );

    const comparisonResult = assertMatchesSnapshot(
      sanitizeTestName('line-custom-price-line'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(comparisonResult.matches).toBe(true);
  });

  it('renders line series with dotted price line', async () => {
    renderResult = await renderChart(
      chart => {
        const series = chart.addSeries(LineSeries, {
          color: TestColors.GREEN,
          lineWidth: 2,
          priceLineVisible: true,
          priceLineColor: TestColors.ORANGE,
          priceLineWidth: 3,
          priceLineStyle: LineStyle.Dotted,
          lastValueVisible: true,
        });
        series.setData(generateLineData(30, 100));
      },
      {
        chartOptions: {
          rightPriceScale: { visible: true },
        },
      }
    );

    const comparisonResult = assertMatchesSnapshot(
      sanitizeTestName('line-dotted-price-line'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(comparisonResult.matches).toBe(true);
  });

  it('renders line series with title label', async () => {
    renderResult = await renderChart(
      chart => {
        const series = chart.addSeries(LineSeries, {
          color: TestColors.BLUE,
          lineWidth: 2,
          title: 'Price Series',
          lastValueVisible: true,
        });
        series.setData(generateLineData(30, 100));
      },
      {
        chartOptions: {
          rightPriceScale: { visible: true },
        },
      }
    );

    const comparisonResult = assertMatchesSnapshot(
      sanitizeTestName('line-with-title'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(comparisonResult.matches).toBe(true);
  });

  it('renders chart with hidden line series', async () => {
    renderResult = await renderChart(chart => {
      const visibleSeries = chart.addSeries(LineSeries, {
        color: TestColors.BLUE,
        lineWidth: 2,
        visible: true,
      });

      const hiddenSeries = chart.addSeries(LineSeries, {
        color: TestColors.RED,
        lineWidth: 2,
        visible: false,
      });

      visibleSeries.setData(generateLineData(30, 100, '2024-01-01'));
      hiddenSeries.setData(generateLineData(30, 110, '2024-01-01'));
    });

    const comparisonResult = assertMatchesSnapshot(
      sanitizeTestName('line-visibility-toggle'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(comparisonResult.matches).toBe(true);
  });
});
