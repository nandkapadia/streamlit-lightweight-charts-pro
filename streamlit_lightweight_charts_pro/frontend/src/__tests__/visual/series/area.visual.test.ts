/**
 * @vitest-environment jsdom
 */
/**
 * Visual Regression Tests for Area Series
 *
 * Tests verify actual canvas rendering output, not just mock calls.
 * Each test renders a chart, extracts canvas pixel data, and compares
 * with baseline snapshots using pixel-by-pixel comparison.
 *
 * @group visual
 */

import { describe, it, expect, afterEach } from 'vitest';
import {
  renderChart,
  cleanupChartRender,
  assertMatchesSnapshot,
  sanitizeTestName,
  generateAreaData,
  TestColors,
  AreaSeries,
  LineStyle,
  LineType,
  type ChartRenderResult,
} from '../utils';

describe('Area Series Visual Rendering', () => {
  let renderResult: ChartRenderResult | null = null;

  afterEach(() => {
    if (renderResult) {
      cleanupChartRender(renderResult);
      renderResult = null;
    }
  });

  it('renders basic area series with solid color', async () => {
    renderResult = await renderChart(chart => {
      const series = chart.addSeries(AreaSeries, {
        lineColor: TestColors.BLUE,
        topColor: TestColors.BLUE,
        bottomColor: 'rgba(33, 150, 243, 0.0)',
        lineWidth: 2,
      });

      series.setData(generateAreaData(30, 100));
    });

    const comparisonResult = assertMatchesSnapshot(
      sanitizeTestName('area-basic-solid-color'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(comparisonResult.matches).toBe(true);
    if (!comparisonResult.matches) {
      console.error(
        `Visual mismatch: ${comparisonResult.diffPixels} pixels differ (${comparisonResult.diffPercentage}%)`
      );
    }
  });

  it('renders area series with gradient fill', async () => {
    renderResult = await renderChart(chart => {
      const series = chart.addSeries(AreaSeries, {
        lineColor: TestColors.GREEN,
        topColor: 'rgba(76, 175, 80, 0.8)',
        bottomColor: 'rgba(76, 175, 80, 0.0)',
        lineWidth: 2,
      });

      series.setData(generateAreaData(30, 100));
    });

    const comparisonResult = assertMatchesSnapshot(
      sanitizeTestName('area-gradient-fill'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(comparisonResult.matches).toBe(true);
  });

  it('renders area series with custom line width', async () => {
    renderResult = await renderChart(chart => {
      const series = chart.addSeries(AreaSeries, {
        lineColor: TestColors.ORANGE,
        topColor: 'rgba(255, 152, 0, 0.5)',
        bottomColor: 'rgba(255, 152, 0, 0.0)',
        lineWidth: 4,
      });

      series.setData(generateAreaData(30, 100));
    });

    const comparisonResult = assertMatchesSnapshot(
      sanitizeTestName('area-custom-line-width'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(comparisonResult.matches).toBe(true);
  });

  it('renders area series with price axis visible', async () => {
    renderResult = await renderChart(
      chart => {
        const series = chart.addSeries(AreaSeries, {
          lineColor: TestColors.PURPLE,
          topColor: 'rgba(156, 39, 176, 0.6)',
          bottomColor: 'rgba(156, 39, 176, 0.0)',
          lineWidth: 2,
          priceLineVisible: true,
          lastValueVisible: true,
        });

        series.setData(generateAreaData(30, 100));
      },
      {
        chartOptions: {
          rightPriceScale: {
            visible: true,
          },
        },
      }
    );

    const comparisonResult = assertMatchesSnapshot(
      sanitizeTestName('area-price-axis-visible'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(comparisonResult.matches).toBe(true);
  });

  it('renders area series with crosshair marker', async () => {
    renderResult = await renderChart(
      chart => {
        const series = chart.addSeries(AreaSeries, {
          lineColor: TestColors.RED,
          topColor: 'rgba(244, 67, 54, 0.7)',
          bottomColor: 'rgba(244, 67, 54, 0.0)',
          lineWidth: 2,
          crosshairMarkerVisible: true,
          crosshairMarkerRadius: 6,
        });

        series.setData(generateAreaData(30, 100));
      },
      {
        chartOptions: {
          crosshair: {
            mode: 1, // Normal
            vertLine: {
              visible: true,
            },
            horzLine: {
              visible: true,
            },
          },
        },
      }
    );

    const comparisonResult = assertMatchesSnapshot(
      sanitizeTestName('area-crosshair-marker'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(comparisonResult.matches).toBe(true);
  });

  it('renders area series with inverted scale', async () => {
    renderResult = await renderChart(
      chart => {
        const series = chart.addSeries(AreaSeries, {
          lineColor: TestColors.BLUE,
          topColor: 'rgba(33, 150, 243, 0.6)',
          bottomColor: 'rgba(33, 150, 243, 0.0)',
          lineWidth: 2,
        });

        series.setData(generateAreaData(30, 100));
      },
      {
        chartOptions: {
          rightPriceScale: {
            invertScale: true,
          },
        },
      }
    );

    const comparisonResult = assertMatchesSnapshot(
      sanitizeTestName('area-inverted-scale'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(comparisonResult.matches).toBe(true);
  });

  it('renders multiple area series with different colors', async () => {
    renderResult = await renderChart(chart => {
      const series1 = chart.addSeries(AreaSeries, {
        lineColor: TestColors.BLUE,
        topColor: 'rgba(33, 150, 243, 0.4)',
        bottomColor: 'rgba(33, 150, 243, 0.0)',
        lineWidth: 2,
      });

      const series2 = chart.addSeries(AreaSeries, {
        lineColor: TestColors.RED,
        topColor: 'rgba(244, 67, 54, 0.4)',
        bottomColor: 'rgba(244, 67, 54, 0.0)',
        lineWidth: 2,
      });

      series1.setData(generateAreaData(30, 100, '2024-01-01'));
      series2.setData(generateAreaData(30, 110, '2024-01-01'));
    });

    const comparisonResult = assertMatchesSnapshot(
      sanitizeTestName('area-multiple-series'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(comparisonResult.matches).toBe(true);
  });

  it('renders area series with custom background color', async () => {
    renderResult = await renderChart(
      chart => {
        const series = chart.addSeries(AreaSeries, {
          lineColor: TestColors.GREEN,
          topColor: 'rgba(76, 175, 80, 0.6)',
          bottomColor: 'rgba(76, 175, 80, 0.0)',
          lineWidth: 2,
        });

        series.setData(generateAreaData(30, 100));
      },
      {
        chartOptions: {
          layout: {
            background: { color: '#F5F5F5' },
            textColor: '#000000',
          },
        },
      }
    );

    const comparisonResult = assertMatchesSnapshot(
      sanitizeTestName('area-custom-background'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(comparisonResult.matches).toBe(true);
  });

  it('renders area series with relative gradient', async () => {
    renderResult = await renderChart(chart => {
      const series = chart.addSeries(AreaSeries, {
        lineColor: TestColors.BLUE,
        topColor: 'rgba(33, 150, 243, 0.8)',
        bottomColor: 'rgba(33, 150, 243, 0.0)',
        lineWidth: 2,
        lineType: LineType.Simple,
      });

      series.setData(generateAreaData(30, 100));
    });

    const comparisonResult = assertMatchesSnapshot(
      sanitizeTestName('area-relative-gradient'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(comparisonResult.matches).toBe(true);
  });

  it('renders area series with inverted fill (above line)', async () => {
    renderResult = await renderChart(chart => {
      const series = chart.addSeries(AreaSeries, {
        lineColor: TestColors.RED,
        topColor: 'rgba(244, 67, 54, 0.0)',
        bottomColor: 'rgba(244, 67, 54, 0.6)',
        lineWidth: 2,
        invertFilledArea: true,
      });

      series.setData(generateAreaData(30, 100));
    });

    const comparisonResult = assertMatchesSnapshot(
      sanitizeTestName('area-inverted-fill'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(comparisonResult.matches).toBe(true);
  });

  it('renders area series with dashed line style', async () => {
    renderResult = await renderChart(chart => {
      const series = chart.addSeries(AreaSeries, {
        lineColor: TestColors.PURPLE,
        topColor: 'rgba(156, 39, 176, 0.5)',
        bottomColor: 'rgba(156, 39, 176, 0.0)',
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
      });

      series.setData(generateAreaData(30, 100));
    });

    const comparisonResult = assertMatchesSnapshot(
      sanitizeTestName('area-dashed-line'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(comparisonResult.matches).toBe(true);
  });

  it('renders area series with dotted line style', async () => {
    renderResult = await renderChart(chart => {
      const series = chart.addSeries(AreaSeries, {
        lineColor: TestColors.ORANGE,
        topColor: 'rgba(255, 152, 0, 0.5)',
        bottomColor: 'rgba(255, 152, 0, 0.0)',
        lineWidth: 2,
        lineStyle: LineStyle.Dotted,
      });

      series.setData(generateAreaData(30, 100));
    });

    const comparisonResult = assertMatchesSnapshot(
      sanitizeTestName('area-dotted-line'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(comparisonResult.matches).toBe(true);
  });

  it('renders area series with stepped line type', async () => {
    renderResult = await renderChart(chart => {
      const series = chart.addSeries(AreaSeries, {
        lineColor: TestColors.BLUE,
        topColor: 'rgba(33, 150, 243, 0.5)',
        bottomColor: 'rgba(33, 150, 243, 0.0)',
        lineWidth: 2,
        lineType: LineType.WithSteps,
      });

      series.setData(generateAreaData(30, 100));
    });

    const comparisonResult = assertMatchesSnapshot(
      sanitizeTestName('area-stepped-line'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(comparisonResult.matches).toBe(true);
  });

  it('renders area series with line hidden (fill only)', async () => {
    renderResult = await renderChart(chart => {
      const series = chart.addSeries(AreaSeries, {
        lineColor: TestColors.GREEN,
        topColor: 'rgba(76, 175, 80, 0.6)',
        bottomColor: 'rgba(76, 175, 80, 0.0)',
        lineVisible: false,
      });

      series.setData(generateAreaData(30, 100));
    });

    const comparisonResult = assertMatchesSnapshot(
      sanitizeTestName('area-line-hidden'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(comparisonResult.matches).toBe(true);
  });

  it('renders area series with point markers', async () => {
    renderResult = await renderChart(chart => {
      const series = chart.addSeries(AreaSeries, {
        lineColor: TestColors.BLUE,
        topColor: 'rgba(33, 150, 243, 0.4)',
        bottomColor: 'rgba(33, 150, 243, 0.0)',
        lineWidth: 2,
        pointMarkersVisible: true,
        pointMarkersRadius: 5,
      });

      series.setData(generateAreaData(15, 100)); // Fewer points to see markers clearly
    });

    const comparisonResult = assertMatchesSnapshot(
      sanitizeTestName('area-point-markers'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(comparisonResult.matches).toBe(true);
  });

  it('renders area series with custom price line styling', async () => {
    renderResult = await renderChart(
      chart => {
        const series = chart.addSeries(AreaSeries, {
          lineColor: TestColors.BLUE,
          topColor: 'rgba(33, 150, 243, 0.5)',
          bottomColor: 'rgba(33, 150, 243, 0.0)',
          lineWidth: 2,
          priceLineVisible: true,
          priceLineColor: '#FF0000',
          priceLineWidth: 2,
          priceLineStyle: LineStyle.Solid,
          lastValueVisible: true,
        });

        series.setData(generateAreaData(30, 100));
      },
      {
        chartOptions: {
          rightPriceScale: { visible: true },
        },
      }
    );

    const comparisonResult = assertMatchesSnapshot(
      sanitizeTestName('area-custom-price-line'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(comparisonResult.matches).toBe(true);
  });

  it('renders area series with dotted price line', async () => {
    renderResult = await renderChart(
      chart => {
        const series = chart.addSeries(AreaSeries, {
          lineColor: TestColors.GREEN,
          topColor: 'rgba(76, 175, 80, 0.5)',
          bottomColor: 'rgba(76, 175, 80, 0.0)',
          lineWidth: 2,
          priceLineVisible: true,
          priceLineColor: TestColors.ORANGE,
          priceLineWidth: 3,
          priceLineStyle: LineStyle.Dotted,
          lastValueVisible: true,
        });

        series.setData(generateAreaData(30, 100));
      },
      {
        chartOptions: {
          rightPriceScale: { visible: true },
        },
      }
    );

    const comparisonResult = assertMatchesSnapshot(
      sanitizeTestName('area-dotted-price-line'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(comparisonResult.matches).toBe(true);
  });

  it('renders area series with title label', async () => {
    renderResult = await renderChart(
      chart => {
        const series = chart.addSeries(AreaSeries, {
          lineColor: TestColors.BLUE,
          topColor: 'rgba(33, 150, 243, 0.5)',
          bottomColor: 'rgba(33, 150, 243, 0.0)',
          lineWidth: 2,
          title: 'Price Area',
          lastValueVisible: true,
        });

        series.setData(generateAreaData(30, 100));
      },
      {
        chartOptions: {
          rightPriceScale: { visible: true },
        },
      }
    );

    const comparisonResult = assertMatchesSnapshot(
      sanitizeTestName('area-with-title'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(comparisonResult.matches).toBe(true);
  });

  it('renders chart with hidden area series', async () => {
    renderResult = await renderChart(chart => {
      const visibleSeries = chart.addSeries(AreaSeries, {
        lineColor: TestColors.BLUE,
        topColor: 'rgba(33, 150, 243, 0.4)',
        bottomColor: 'rgba(33, 150, 243, 0.0)',
        lineWidth: 2,
        visible: true,
      });

      const hiddenSeries = chart.addSeries(AreaSeries, {
        lineColor: TestColors.RED,
        topColor: 'rgba(244, 67, 54, 0.4)',
        bottomColor: 'rgba(244, 67, 54, 0.0)',
        lineWidth: 2,
        visible: false,
      });

      visibleSeries.setData(generateAreaData(30, 100, '2024-01-01'));
      hiddenSeries.setData(generateAreaData(30, 110, '2024-01-01'));
    });

    const comparisonResult = assertMatchesSnapshot(
      sanitizeTestName('area-visibility-toggle'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(comparisonResult.matches).toBe(true);
  });
});
