/**
 * @vitest-environment jsdom
 */
/**
 * Visual Regression Tests for Custom Series (Plugins)
 *
 * Tests verify actual canvas rendering of custom series plugins including:
 * - TrendFill Series (uptrend/downtrend fills)
 * - Band Series (upper/middle/lower lines with fills)
 * - Ribbon Series (two lines with fill)
 * - Signal Series (vertical background bands)
 * - GradientRibbon Series (gradient fills between lines)
 *
 * @group visual
 */

import { describe, it, expect, afterEach } from 'vitest';
import {
  renderChart,
  cleanupChartRender,
  assertMatchesSnapshot,
  sanitizeTestName,
  generateTrendFillData,
  generateBandData2,
  generateRibbonData2,
  generateSignalData,
  generateGradientRibbonData,
  TestColors,
  type ChartRenderResult,
} from '../utils';
import { createTrendFillSeries } from '../../../plugins/series/trendFillSeriesPlugin';
import { createBandSeries } from '../../../plugins/series/bandSeriesPlugin';
import { createRibbonSeries } from '../../../plugins/series/ribbonSeriesPlugin';
import { createSignalSeries } from '../../../plugins/series/signalSeriesPlugin';
import { createGradientRibbonSeries } from '../../../plugins/series/gradientRibbonSeriesPlugin';
import { LineStyle } from '../../../utils/renderingUtils';

describe('TrendFill Series Visual Rendering', () => {
  let renderResult: ChartRenderResult | null = null;

  afterEach(() => {
    if (renderResult) {
      cleanupChartRender(renderResult);
      renderResult = null;
    }
  });

  it('renders basic trendfill with uptrend and downtrend', async () => {
    renderResult = await renderChart(chart => {
      const data = generateTrendFillData(30, 100);
      const series = createTrendFillSeries(chart, {
        uptrendFillColor: 'rgba(76, 175, 80, 0.3)',
        downtrendFillColor: 'rgba(244, 67, 54, 0.3)',
        uptrendLineColor: TestColors.GREEN,
        downtrendLineColor: TestColors.RED,
      });
      series.setData(data);
    });

    const result = assertMatchesSnapshot(
      sanitizeTestName('trendfill-basic'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(result.matches).toBe(true);
  });

  it('renders trendfill with fill hidden', async () => {
    renderResult = await renderChart(chart => {
      const data = generateTrendFillData(30, 100);
      const series = createTrendFillSeries(chart, {
        fillVisible: false,
        uptrendLineColor: TestColors.GREEN,
        downtrendLineColor: TestColors.RED,
      });
      series.setData(data);
    });

    const result = assertMatchesSnapshot(
      sanitizeTestName('trendfill-no-fill'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(result.matches).toBe(true);
  });

  it('renders trendfill with dashed line style', async () => {
    renderResult = await renderChart(chart => {
      const data = generateTrendFillData(30, 100);
      const series = createTrendFillSeries(chart, {
        uptrendLineStyle: LineStyle.Dashed,
        downtrendLineStyle: LineStyle.Dashed,
        uptrendLineColor: TestColors.GREEN,
        downtrendLineColor: TestColors.RED,
      });
      series.setData(data);
    });

    const result = assertMatchesSnapshot(
      sanitizeTestName('trendfill-dashed'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(result.matches).toBe(true);
  });

  it('renders trendfill with base line visible', async () => {
    renderResult = await renderChart(chart => {
      const data = generateTrendFillData(30, 100);
      const series = createTrendFillSeries(chart, {
        baseLineVisible: true,
        baseLineColor: '#666666',
        baseLineStyle: LineStyle.Dotted,
        uptrendLineColor: TestColors.GREEN,
        downtrendLineColor: TestColors.RED,
      });
      series.setData(data);
    });

    const result = assertMatchesSnapshot(
      sanitizeTestName('trendfill-with-baseline'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(result.matches).toBe(true);
  });

  it('renders trendfill with custom colors', async () => {
    renderResult = await renderChart(chart => {
      const data = generateTrendFillData(30, 100);
      const series = createTrendFillSeries(chart, {
        uptrendFillColor: 'rgba(33, 150, 243, 0.3)',
        downtrendFillColor: 'rgba(255, 152, 0, 0.3)',
        uptrendLineColor: TestColors.BLUE,
        downtrendLineColor: TestColors.ORANGE,
      });
      series.setData(data);
    });

    const result = assertMatchesSnapshot(
      sanitizeTestName('trendfill-custom-colors'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(result.matches).toBe(true);
  });

  it('renders trendfill with thick line widths', async () => {
    renderResult = await renderChart(chart => {
      const data = generateTrendFillData(30, 100);
      const series = createTrendFillSeries(chart, {
        uptrendLineWidth: 4,
        downtrendLineWidth: 4,
        uptrendLineColor: TestColors.GREEN,
        downtrendLineColor: TestColors.RED,
      });
      series.setData(data);
    });

    const result = assertMatchesSnapshot(
      sanitizeTestName('trendfill-thick-lines'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(result.matches).toBe(true);
  });

  it('renders trendfill with thin line widths (line_width=1)', async () => {
    renderResult = await renderChart(chart => {
      const data = generateTrendFillData(30, 100);
      const series = createTrendFillSeries(chart, {
        uptrendLineWidth: 1,
        downtrendLineWidth: 1,
        uptrendLineColor: TestColors.GREEN,
        downtrendLineColor: TestColors.RED,
      });
      series.setData(data);
    });

    const result = assertMatchesSnapshot(
      sanitizeTestName('trendfill-thin-lines'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(result.matches).toBe(true);
  });

  it('renders trendfill with lines hidden', async () => {
    renderResult = await renderChart(chart => {
      const data = generateTrendFillData(30, 100);
      const series = createTrendFillSeries(chart, {
        uptrendLineVisible: false,
        downtrendLineVisible: false,
        uptrendFillColor: 'rgba(76, 175, 80, 0.3)',
        downtrendFillColor: 'rgba(244, 67, 54, 0.3)',
      });
      series.setData(data);
    });

    const result = assertMatchesSnapshot(
      sanitizeTestName('trendfill-lines-hidden'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(result.matches).toBe(true);
  });
});

describe('Band Series Visual Rendering', () => {
  let renderResult: ChartRenderResult | null = null;

  afterEach(() => {
    if (renderResult) {
      cleanupChartRender(renderResult);
      renderResult = null;
    }
  });

  it('renders basic band series with three lines and fills', async () => {
    renderResult = await renderChart(chart => {
      const data = generateBandData2(30, 100, 20);
      const series = createBandSeries(chart, {
        upperLineColor: TestColors.GREEN,
        middleLineColor: TestColors.BLUE,
        lowerLineColor: TestColors.RED,
        upperFillColor: 'rgba(76, 175, 80, 0.1)',
        lowerFillColor: 'rgba(244, 67, 54, 0.1)',
      });
      series.setData(data);
    });

    const result = assertMatchesSnapshot(sanitizeTestName('band-basic'), renderResult.imageData, {
      threshold: 0.1,
      tolerance: 1.0,
    });

    expect(result.matches).toBe(true);
  });

  it('renders band series with middle line hidden', async () => {
    renderResult = await renderChart(chart => {
      const data = generateBandData2(30, 100, 20);
      const series = createBandSeries(chart, {
        upperLineColor: TestColors.GREEN,
        middleLineVisible: false,
        lowerLineColor: TestColors.RED,
      });
      series.setData(data);
    });

    const result = assertMatchesSnapshot(
      sanitizeTestName('band-no-middle-line'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(result.matches).toBe(true);
  });

  it('renders band series with fills hidden', async () => {
    renderResult = await renderChart(chart => {
      const data = generateBandData2(30, 100, 20);
      const series = createBandSeries(chart, {
        upperFill: false,
        lowerFill: false,
        upperLineColor: TestColors.GREEN,
        middleLineColor: TestColors.BLUE,
        lowerLineColor: TestColors.RED,
      });
      series.setData(data);
    });

    const result = assertMatchesSnapshot(
      sanitizeTestName('band-no-fills'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(result.matches).toBe(true);
  });

  it('renders band series with dashed line styles', async () => {
    renderResult = await renderChart(chart => {
      const data = generateBandData2(30, 100, 20);
      const series = createBandSeries(chart, {
        upperLineStyle: LineStyle.Dashed,
        middleLineStyle: LineStyle.Dotted,
        lowerLineStyle: LineStyle.Dashed,
        upperLineColor: TestColors.GREEN,
        middleLineColor: TestColors.BLUE,
        lowerLineColor: TestColors.RED,
      });
      series.setData(data);
    });

    const result = assertMatchesSnapshot(
      sanitizeTestName('band-dashed-styles'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(result.matches).toBe(true);
  });

  it('renders band series with custom colors', async () => {
    renderResult = await renderChart(chart => {
      const data = generateBandData2(30, 100, 20);
      const series = createBandSeries(chart, {
        upperLineColor: TestColors.PURPLE,
        middleLineColor: TestColors.ORANGE,
        lowerLineColor: TestColors.PURPLE,
        upperFillColor: 'rgba(156, 39, 176, 0.1)',
        lowerFillColor: 'rgba(156, 39, 176, 0.1)',
      });
      series.setData(data);
    });

    const result = assertMatchesSnapshot(
      sanitizeTestName('band-custom-colors'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(result.matches).toBe(true);
  });

  it('renders band series with thin line widths (line_width=1)', async () => {
    renderResult = await renderChart(chart => {
      const data = generateBandData2(30, 100, 20);
      const series = createBandSeries(chart, {
        upperLineWidth: 1,
        middleLineWidth: 1,
        lowerLineWidth: 1,
        upperLineColor: TestColors.GREEN,
        middleLineColor: TestColors.BLUE,
        lowerLineColor: TestColors.RED,
      });
      series.setData(data);
    });

    const result = assertMatchesSnapshot(
      sanitizeTestName('band-thin-lines'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(result.matches).toBe(true);
  });

  it('renders band series with thick line widths (line_width=4)', async () => {
    renderResult = await renderChart(chart => {
      const data = generateBandData2(30, 100, 20);
      const series = createBandSeries(chart, {
        upperLineWidth: 4,
        middleLineWidth: 4,
        lowerLineWidth: 4,
        upperLineColor: TestColors.GREEN,
        middleLineColor: TestColors.BLUE,
        lowerLineColor: TestColors.RED,
      });
      series.setData(data);
    });

    const result = assertMatchesSnapshot(
      sanitizeTestName('band-thick-lines'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(result.matches).toBe(true);
  });

  it('renders band series with only upper fill visible', async () => {
    renderResult = await renderChart(chart => {
      const data = generateBandData2(30, 100, 20);
      const series = createBandSeries(chart, {
        upperFill: true,
        lowerFill: false,
        upperLineColor: TestColors.GREEN,
        middleLineColor: TestColors.BLUE,
        lowerLineColor: TestColors.RED,
        upperFillColor: 'rgba(76, 175, 80, 0.2)',
      });
      series.setData(data);
    });

    const result = assertMatchesSnapshot(
      sanitizeTestName('band-upper-fill-only'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(result.matches).toBe(true);
  });

  it('renders band series with only lower fill visible', async () => {
    renderResult = await renderChart(chart => {
      const data = generateBandData2(30, 100, 20);
      const series = createBandSeries(chart, {
        upperFill: false,
        lowerFill: true,
        upperLineColor: TestColors.GREEN,
        middleLineColor: TestColors.BLUE,
        lowerLineColor: TestColors.RED,
        lowerFillColor: 'rgba(244, 67, 54, 0.2)',
      });
      series.setData(data);
    });

    const result = assertMatchesSnapshot(
      sanitizeTestName('band-lower-fill-only'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(result.matches).toBe(true);
  });
});

describe('Ribbon Series Visual Rendering', () => {
  let renderResult: ChartRenderResult | null = null;

  afterEach(() => {
    if (renderResult) {
      cleanupChartRender(renderResult);
      renderResult = null;
    }
  });

  it('renders basic ribbon series with two lines and fill', async () => {
    renderResult = await renderChart(chart => {
      const data = generateRibbonData2(30, 100, 10);
      const series = createRibbonSeries(chart, {
        upperLineColor: TestColors.GREEN,
        lowerLineColor: TestColors.RED,
        fillColor: 'rgba(76, 175, 80, 0.1)',
      });
      series.setData(data);
    });

    const result = assertMatchesSnapshot(sanitizeTestName('ribbon-basic'), renderResult.imageData, {
      threshold: 0.1,
      tolerance: 1.0,
    });

    expect(result.matches).toBe(true);
  });

  it('renders ribbon series with fill hidden', async () => {
    renderResult = await renderChart(chart => {
      const data = generateRibbonData2(30, 100, 10);
      const series = createRibbonSeries(chart, {
        fillVisible: false,
        upperLineColor: TestColors.GREEN,
        lowerLineColor: TestColors.RED,
      });
      series.setData(data);
    });

    const result = assertMatchesSnapshot(
      sanitizeTestName('ribbon-no-fill'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(result.matches).toBe(true);
  });

  it('renders ribbon series with dashed lines', async () => {
    renderResult = await renderChart(chart => {
      const data = generateRibbonData2(30, 100, 10);
      const series = createRibbonSeries(chart, {
        upperLineStyle: LineStyle.Dashed,
        lowerLineStyle: LineStyle.Dotted,
        upperLineColor: TestColors.GREEN,
        lowerLineColor: TestColors.RED,
      });
      series.setData(data);
    });

    const result = assertMatchesSnapshot(
      sanitizeTestName('ribbon-dashed-lines'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(result.matches).toBe(true);
  });

  it('renders ribbon series with custom colors', async () => {
    renderResult = await renderChart(chart => {
      const data = generateRibbonData2(30, 100, 10);
      const series = createRibbonSeries(chart, {
        upperLineColor: TestColors.BLUE,
        lowerLineColor: TestColors.ORANGE,
        fillColor: 'rgba(33, 150, 243, 0.1)',
      });
      series.setData(data);
    });

    const result = assertMatchesSnapshot(
      sanitizeTestName('ribbon-custom-colors'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(result.matches).toBe(true);
  });

  it('renders ribbon series with thin line widths (line_width=1)', async () => {
    renderResult = await renderChart(chart => {
      const data = generateRibbonData2(30, 100, 10);
      const series = createRibbonSeries(chart, {
        upperLineWidth: 1,
        lowerLineWidth: 1,
        upperLineColor: TestColors.GREEN,
        lowerLineColor: TestColors.RED,
      });
      series.setData(data);
    });

    const result = assertMatchesSnapshot(
      sanitizeTestName('ribbon-thin-lines'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(result.matches).toBe(true);
  });

  it('renders ribbon series with thick line widths (line_width=4)', async () => {
    renderResult = await renderChart(chart => {
      const data = generateRibbonData2(30, 100, 10);
      const series = createRibbonSeries(chart, {
        upperLineWidth: 4,
        lowerLineWidth: 4,
        upperLineColor: TestColors.GREEN,
        lowerLineColor: TestColors.RED,
      });
      series.setData(data);
    });

    const result = assertMatchesSnapshot(
      sanitizeTestName('ribbon-thick-lines'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(result.matches).toBe(true);
  });

  it('renders ribbon series with upper line hidden', async () => {
    renderResult = await renderChart(chart => {
      const data = generateRibbonData2(30, 100, 10);
      const series = createRibbonSeries(chart, {
        upperLineVisible: false,
        lowerLineColor: TestColors.RED,
        fillColor: 'rgba(244, 67, 54, 0.1)',
      });
      series.setData(data);
    });

    const result = assertMatchesSnapshot(
      sanitizeTestName('ribbon-upper-line-hidden'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(result.matches).toBe(true);
  });

  it('renders ribbon series with lower line hidden', async () => {
    renderResult = await renderChart(chart => {
      const data = generateRibbonData2(30, 100, 10);
      const series = createRibbonSeries(chart, {
        lowerLineVisible: false,
        upperLineColor: TestColors.GREEN,
        fillColor: 'rgba(76, 175, 80, 0.1)',
      });
      series.setData(data);
    });

    const result = assertMatchesSnapshot(
      sanitizeTestName('ribbon-lower-line-hidden'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(result.matches).toBe(true);
  });

  it('renders ribbon series with both lines hidden (fill only)', async () => {
    renderResult = await renderChart(chart => {
      const data = generateRibbonData2(30, 100, 10);
      const series = createRibbonSeries(chart, {
        upperLineVisible: false,
        lowerLineVisible: false,
        fillColor: 'rgba(76, 175, 80, 0.2)',
      });
      series.setData(data);
    });

    const result = assertMatchesSnapshot(
      sanitizeTestName('ribbon-lines-hidden'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(result.matches).toBe(true);
  });
});

describe('Signal Series Visual Rendering', () => {
  let renderResult: ChartRenderResult | null = null;

  afterEach(() => {
    if (renderResult) {
      cleanupChartRender(renderResult);
      renderResult = null;
    }
  });

  it('renders basic signal series with neutral/signal/alert bands', async () => {
    renderResult = await renderChart(chart => {
      const data = generateSignalData(30);
      const series = createSignalSeries(chart, {
        neutralColor: 'rgba(128, 128, 128, 0.1)',
        signalColor: 'rgba(76, 175, 80, 0.2)',
        alertColor: 'rgba(244, 67, 54, 0.2)',
      });
      series.setData(data);
    });

    const result = assertMatchesSnapshot(sanitizeTestName('signal-basic'), renderResult.imageData, {
      threshold: 0.1,
      tolerance: 1.0,
    });

    expect(result.matches).toBe(true);
  });

  it('renders signal series with custom colors', async () => {
    renderResult = await renderChart(chart => {
      const data = generateSignalData(30);
      const series = createSignalSeries(chart, {
        neutralColor: 'rgba(200, 200, 200, 0.2)',
        signalColor: 'rgba(33, 150, 243, 0.3)',
        alertColor: 'rgba(255, 152, 0, 0.3)',
      });
      series.setData(data);
    });

    const result = assertMatchesSnapshot(
      sanitizeTestName('signal-custom-colors'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(result.matches).toBe(true);
  });

  it('renders signal series with per-point color overrides', async () => {
    renderResult = await renderChart(chart => {
      const data = generateSignalData(30).map((point, i) => ({
        ...point,
        color: i % 10 === 5 ? 'rgba(156, 39, 176, 0.3)' : undefined,
      }));
      const series = createSignalSeries(chart, {
        neutralColor: 'rgba(128, 128, 128, 0.1)',
        signalColor: 'rgba(76, 175, 80, 0.2)',
        alertColor: 'rgba(244, 67, 54, 0.2)',
      });
      series.setData(data);
    });

    const result = assertMatchesSnapshot(
      sanitizeTestName('signal-color-overrides'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(result.matches).toBe(true);
  });

  it('renders signal series with high opacity colors', async () => {
    renderResult = await renderChart(chart => {
      const data = generateSignalData(30);
      const series = createSignalSeries(chart, {
        neutralColor: 'rgba(128, 128, 128, 0.5)',
        signalColor: 'rgba(76, 175, 80, 0.6)',
        alertColor: 'rgba(244, 67, 54, 0.6)',
      });
      series.setData(data);
    });

    const result = assertMatchesSnapshot(
      sanitizeTestName('signal-high-opacity'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(result.matches).toBe(true);
  });

  it('renders signal series with low opacity colors', async () => {
    renderResult = await renderChart(chart => {
      const data = generateSignalData(30);
      const series = createSignalSeries(chart, {
        neutralColor: 'rgba(128, 128, 128, 0.05)',
        signalColor: 'rgba(76, 175, 80, 0.05)',
        alertColor: 'rgba(244, 67, 54, 0.05)',
      });
      series.setData(data);
    });

    const result = assertMatchesSnapshot(
      sanitizeTestName('signal-low-opacity'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(result.matches).toBe(true);
  });

  it('renders signal series with monochrome palette', async () => {
    renderResult = await renderChart(chart => {
      const data = generateSignalData(30);
      const series = createSignalSeries(chart, {
        neutralColor: 'rgba(100, 100, 100, 0.2)',
        signalColor: 'rgba(150, 150, 150, 0.3)',
        alertColor: 'rgba(50, 50, 50, 0.4)',
      });
      series.setData(data);
    });

    const result = assertMatchesSnapshot(
      sanitizeTestName('signal-monochrome'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(result.matches).toBe(true);
  });
});

describe('GradientRibbon Series Visual Rendering', () => {
  let renderResult: ChartRenderResult | null = null;

  afterEach(() => {
    if (renderResult) {
      cleanupChartRender(renderResult);
      renderResult = null;
    }
  });

  it('renders basic gradient ribbon with color interpolation', async () => {
    renderResult = await renderChart(chart => {
      const data = generateGradientRibbonData(30, 100);
      const series = createGradientRibbonSeries(chart, {
        upperLineColor: TestColors.GREEN,
        lowerLineColor: TestColors.RED,
        gradientStartColor: TestColors.GREEN,
        gradientEndColor: TestColors.RED,
        normalizeGradients: true,
      });
      series.setData(data);
    });

    const result = assertMatchesSnapshot(
      sanitizeTestName('gradient-ribbon-basic'),
      renderResult.imageData,
      { threshold: 0.2, tolerance: 2.5 }
    );

    expect(result.matches).toBe(true);
  });

  it('renders gradient ribbon with blue-orange gradient', async () => {
    renderResult = await renderChart(chart => {
      const data = generateGradientRibbonData(30, 100);
      const series = createGradientRibbonSeries(chart, {
        upperLineColor: TestColors.BLUE,
        lowerLineColor: TestColors.ORANGE,
        gradientStartColor: TestColors.BLUE,
        gradientEndColor: TestColors.ORANGE,
        normalizeGradients: true,
      });
      series.setData(data);
    });

    const result = assertMatchesSnapshot(
      sanitizeTestName('gradient-ribbon-blue-orange'),
      renderResult.imageData,
      { threshold: 0.2, tolerance: 2.5 }
    );

    expect(result.matches).toBe(true);
  });

  it('renders gradient ribbon without normalization', async () => {
    renderResult = await renderChart(chart => {
      const data = generateGradientRibbonData(30, 100);
      const series = createGradientRibbonSeries(chart, {
        upperLineColor: TestColors.GREEN,
        lowerLineColor: TestColors.RED,
        gradientStartColor: TestColors.GREEN,
        gradientEndColor: TestColors.RED,
        normalizeGradients: false,
      });
      series.setData(data);
    });

    const result = assertMatchesSnapshot(
      sanitizeTestName('gradient-ribbon-no-normalize'),
      renderResult.imageData,
      { threshold: 0.2, tolerance: 2.5 }
    );

    expect(result.matches).toBe(true);
  });

  it('renders gradient ribbon with fill hidden', async () => {
    renderResult = await renderChart(chart => {
      const data = generateGradientRibbonData(30, 100);
      const series = createGradientRibbonSeries(chart, {
        fillVisible: false,
        upperLineColor: TestColors.GREEN,
        lowerLineColor: TestColors.RED,
      });
      series.setData(data);
    });

    const result = assertMatchesSnapshot(
      sanitizeTestName('gradient-ribbon-no-fill'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(result.matches).toBe(true);
  });

  it('renders gradient ribbon with dashed lines', async () => {
    renderResult = await renderChart(chart => {
      const data = generateGradientRibbonData(30, 100);
      const series = createGradientRibbonSeries(chart, {
        upperLineStyle: LineStyle.Dashed,
        lowerLineStyle: LineStyle.Dotted,
        upperLineColor: TestColors.GREEN,
        lowerLineColor: TestColors.RED,
        gradientStartColor: TestColors.GREEN,
        gradientEndColor: TestColors.RED,
      });
      series.setData(data);
    });

    const result = assertMatchesSnapshot(
      sanitizeTestName('gradient-ribbon-dashed-lines'),
      renderResult.imageData,
      { threshold: 0.2, tolerance: 2.5 }
    );

    expect(result.matches).toBe(true);
  });

  it('renders gradient ribbon with thin line widths (line_width=1)', async () => {
    renderResult = await renderChart(chart => {
      const data = generateGradientRibbonData(30, 100);
      const series = createGradientRibbonSeries(chart, {
        upperLineWidth: 1,
        lowerLineWidth: 1,
        upperLineColor: TestColors.GREEN,
        lowerLineColor: TestColors.RED,
        gradientStartColor: TestColors.GREEN,
        gradientEndColor: TestColors.RED,
      });
      series.setData(data);
    });

    const result = assertMatchesSnapshot(
      sanitizeTestName('gradient-ribbon-thin-lines'),
      renderResult.imageData,
      { threshold: 0.2, tolerance: 2.5 }
    );

    expect(result.matches).toBe(true);
  });

  it('renders gradient ribbon with thick line widths (line_width=4)', async () => {
    renderResult = await renderChart(chart => {
      const data = generateGradientRibbonData(30, 100);
      const series = createGradientRibbonSeries(chart, {
        upperLineWidth: 4,
        lowerLineWidth: 4,
        upperLineColor: TestColors.GREEN,
        lowerLineColor: TestColors.RED,
        gradientStartColor: TestColors.GREEN,
        gradientEndColor: TestColors.RED,
      });
      series.setData(data);
    });

    const result = assertMatchesSnapshot(
      sanitizeTestName('gradient-ribbon-thick-lines'),
      renderResult.imageData,
      { threshold: 0.2, tolerance: 2.5 }
    );

    expect(result.matches).toBe(true);
  });

  it('renders gradient ribbon with upper line hidden', async () => {
    renderResult = await renderChart(chart => {
      const data = generateGradientRibbonData(30, 100);
      const series = createGradientRibbonSeries(chart, {
        upperLineVisible: false,
        lowerLineColor: TestColors.RED,
        gradientStartColor: TestColors.GREEN,
        gradientEndColor: TestColors.RED,
      });
      series.setData(data);
    });

    const result = assertMatchesSnapshot(
      sanitizeTestName('gradient-ribbon-upper-line-hidden'),
      renderResult.imageData,
      { threshold: 0.2, tolerance: 2.5 }
    );

    expect(result.matches).toBe(true);
  });

  it('renders gradient ribbon with lower line hidden', async () => {
    renderResult = await renderChart(chart => {
      const data = generateGradientRibbonData(30, 100);
      const series = createGradientRibbonSeries(chart, {
        lowerLineVisible: false,
        upperLineColor: TestColors.GREEN,
        gradientStartColor: TestColors.GREEN,
        gradientEndColor: TestColors.RED,
      });
      series.setData(data);
    });

    const result = assertMatchesSnapshot(
      sanitizeTestName('gradient-ribbon-lower-line-hidden'),
      renderResult.imageData,
      { threshold: 0.2, tolerance: 2.5 }
    );

    expect(result.matches).toBe(true);
  });

  it('renders gradient ribbon with both lines hidden (fill only)', async () => {
    renderResult = await renderChart(chart => {
      const data = generateGradientRibbonData(30, 100);
      const series = createGradientRibbonSeries(chart, {
        upperLineVisible: false,
        lowerLineVisible: false,
        gradientStartColor: TestColors.GREEN,
        gradientEndColor: TestColors.RED,
      });
      series.setData(data);
    });

    const result = assertMatchesSnapshot(
      sanitizeTestName('gradient-ribbon-lines-hidden'),
      renderResult.imageData,
      { threshold: 0.2, tolerance: 2.5 }
    );

    expect(result.matches).toBe(true);
  });
});

describe('Band Series Per-Point Styling Visual Tests', () => {
  let renderResult: ChartRenderResult | null = null;

  afterEach(() => {
    if (renderResult) {
      cleanupChartRender(renderResult);
      renderResult = null;
    }
  });

  it('renders band series with per-point upper line color override', async () => {
    renderResult = await renderChart(chart => {
      const data = generateBandData2(30, 100, 20).map((point, i) => ({
        ...point,
        ...(i === 15 ? { styles: { upperLine: { color: '#FF0000', width: 4 } } } : {}),
      }));
      const series = createBandSeries(chart, {
        upperLineColor: TestColors.GREEN,
        middleLineColor: TestColors.BLUE,
        lowerLineColor: TestColors.RED,
      });
      series.setData(data);
    });

    const result = assertMatchesSnapshot(
      sanitizeTestName('band-per-point-upper-line'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(result.matches).toBe(true);
  });

  it('renders band series with per-point fill color override', async () => {
    renderResult = await renderChart(chart => {
      const data = generateBandData2(30, 100, 20).map((point, i) => ({
        ...point,
        ...(i >= 10 && i <= 15
          ? {
              styles: {
                upperFill: { color: 'rgba(255, 0, 0, 0.3)', visible: true },
                lowerFill: { color: 'rgba(0, 0, 255, 0.3)', visible: true },
              },
            }
          : {}),
      }));
      const series = createBandSeries(chart, {
        upperLineColor: TestColors.GREEN,
        middleLineColor: TestColors.BLUE,
        lowerLineColor: TestColors.RED,
        upperFillColor: 'rgba(76, 175, 80, 0.1)',
        lowerFillColor: 'rgba(244, 67, 54, 0.1)',
      });
      series.setData(data);
    });

    const result = assertMatchesSnapshot(
      sanitizeTestName('band-per-point-fills'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(result.matches).toBe(true);
  });

  it('renders band series with per-point line style override (dotted/dashed)', async () => {
    renderResult = await renderChart(chart => {
      const data = generateBandData2(30, 100, 20).map((point, i) => ({
        ...point,
        ...(i >= 10 && i <= 15
          ? {
              styles: {
                upperLine: { style: 1, width: 3 }, // Dotted
                middleLine: { style: 2, width: 3 }, // Dashed
                lowerLine: { style: 1, width: 3 }, // Dotted
              },
            }
          : {}),
      }));
      const series = createBandSeries(chart, {
        upperLineColor: TestColors.GREEN,
        middleLineColor: TestColors.BLUE,
        lowerLineColor: TestColors.RED,
      });
      series.setData(data);
    });

    const result = assertMatchesSnapshot(
      sanitizeTestName('band-per-point-line-styles'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(result.matches).toBe(true);
  });

  it('renders band series with complete per-point styling', async () => {
    renderResult = await renderChart(chart => {
      const data = generateBandData2(30, 100, 20).map((point, i) => ({
        ...point,
        ...(i === 15
          ? {
              styles: {
                upperLine: { color: '#FF00FF', width: 4, style: 2 },
                middleLine: { color: '#00FFFF', width: 4, style: 0 },
                lowerLine: { color: '#FFFF00', width: 4, style: 1 },
                upperFill: { color: 'rgba(255, 0, 255, 0.4)', visible: true },
                lowerFill: { color: 'rgba(255, 255, 0, 0.4)', visible: true },
              },
            }
          : {}),
      }));
      const series = createBandSeries(chart, {
        upperLineColor: TestColors.GREEN,
        middleLineColor: TestColors.BLUE,
        lowerLineColor: TestColors.RED,
      });
      series.setData(data);
    });

    const result = assertMatchesSnapshot(
      sanitizeTestName('band-per-point-complete'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(result.matches).toBe(true);
  });
});

describe('Ribbon Series Per-Point Styling Visual Tests', () => {
  let renderResult: ChartRenderResult | null = null;

  afterEach(() => {
    if (renderResult) {
      cleanupChartRender(renderResult);
      renderResult = null;
    }
  });

  it('renders ribbon series with per-point line color override', async () => {
    renderResult = await renderChart(chart => {
      const data = generateRibbonData2(30, 100, 10).map((point, i) => ({
        ...point,
        ...(i === 15
          ? { styles: { upperLine: { color: '#FF0000', width: 4 }, lowerLine: { color: '#0000FF', width: 4 } } }
          : {}),
      }));
      const series = createRibbonSeries(chart, {
        upperLineColor: TestColors.GREEN,
        lowerLineColor: TestColors.RED,
      });
      series.setData(data);
    });

    const result = assertMatchesSnapshot(
      sanitizeTestName('ribbon-per-point-lines'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(result.matches).toBe(true);
  });

  it('renders ribbon series with per-point fill color override', async () => {
    renderResult = await renderChart(chart => {
      const data = generateRibbonData2(30, 100, 10).map((point, i) => ({
        ...point,
        ...(i >= 10 && i <= 15 ? { styles: { fill: { color: 'rgba(255, 0, 255, 0.4)', visible: true } } } : {}),
      }));
      const series = createRibbonSeries(chart, {
        upperLineColor: TestColors.GREEN,
        lowerLineColor: TestColors.RED,
        fillColor: 'rgba(76, 175, 80, 0.1)',
      });
      series.setData(data);
    });

    const result = assertMatchesSnapshot(
      sanitizeTestName('ribbon-per-point-fill'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(result.matches).toBe(true);
  });

  it('renders ribbon series with per-point line style override', async () => {
    renderResult = await renderChart(chart => {
      const data = generateRibbonData2(30, 100, 10).map((point, i) => ({
        ...point,
        ...(i >= 10 && i <= 15
          ? {
              styles: {
                upperLine: { style: 1, width: 3 }, // Dotted
                lowerLine: { style: 2, width: 3 }, // Dashed
              },
            }
          : {}),
      }));
      const series = createRibbonSeries(chart, {
        upperLineColor: TestColors.GREEN,
        lowerLineColor: TestColors.RED,
      });
      series.setData(data);
    });

    const result = assertMatchesSnapshot(
      sanitizeTestName('ribbon-per-point-line-styles'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(result.matches).toBe(true);
  });

  it('renders ribbon series with complete per-point styling', async () => {
    renderResult = await renderChart(chart => {
      const data = generateRibbonData2(30, 100, 10).map((point, i) => ({
        ...point,
        ...(i === 15
          ? {
              styles: {
                upperLine: { color: '#FF00FF', width: 4, style: 2 },
                lowerLine: { color: '#FFFF00', width: 4, style: 1 },
                fill: { color: 'rgba(0, 255, 255, 0.4)', visible: true },
              },
            }
          : {}),
      }));
      const series = createRibbonSeries(chart, {
        upperLineColor: TestColors.GREEN,
        lowerLineColor: TestColors.RED,
        fillColor: 'rgba(76, 175, 80, 0.1)',
      });
      series.setData(data);
    });

    const result = assertMatchesSnapshot(
      sanitizeTestName('ribbon-per-point-complete'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(result.matches).toBe(true);
  });

  it('renders ribbon series with mixed per-point styling', async () => {
    renderResult = await renderChart(chart => {
      const data = generateRibbonData2(30, 100, 10).map((point, i) => ({
        ...point,
        ...(i % 5 === 0
          ? {
              styles: {
                upperLine: { color: '#FF0000' },
                lowerLine: { color: '#0000FF' },
              },
            }
          : {}),
      }));
      const series = createRibbonSeries(chart, {
        upperLineColor: TestColors.GREEN,
        lowerLineColor: TestColors.RED,
        fillColor: 'rgba(76, 175, 80, 0.1)',
      });
      series.setData(data);
    });

    const result = assertMatchesSnapshot(
      sanitizeTestName('ribbon-per-point-mixed'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(result.matches).toBe(true);
  });
});
describe('Custom Series Data Validation', () => {
  it('validates TrendFill data generator', () => {
    const data = generateTrendFillData(10, 100);
    expect(data.length).toBe(10);
    expect(data[0]).toHaveProperty('baseLine');
    expect(data[0]).toHaveProperty('trendLine');
    expect(data[0]).toHaveProperty('trendDirection');
  });

  it('validates Band data generator', () => {
    const data = generateBandData2(10, 100, 10);
    expect(data.length).toBe(10);
    expect(data[0]).toHaveProperty('upper');
    expect(data[0]).toHaveProperty('middle');
    expect(data[0]).toHaveProperty('lower');
    expect(data[0].upper).toBeGreaterThan(data[0].middle);
    expect(data[0].middle).toBeGreaterThan(data[0].lower);
  });

  it('validates Ribbon data generator', () => {
    const data = generateRibbonData2(10, 100, 10);
    expect(data.length).toBe(10);
    expect(data[0]).toHaveProperty('upper');
    expect(data[0]).toHaveProperty('lower');
    expect(data[0].upper).toBeGreaterThan(data[0].lower);
  });

  it('validates Signal data generator', () => {
    const data = generateSignalData(30);
    expect(data.length).toBe(30);
    expect(data[0]).toHaveProperty('value');
    // Check pattern: neutral, signal, alert
    expect(data[0].value).toBe(0); // First segment neutral
    expect(data[10].value).toBe(1); // Second segment signal
    expect(data[20].value).toBe(-1); // Third segment alert
  });

  it('validates GradientRibbon data generator', () => {
    const data = generateGradientRibbonData(10, 100);
    expect(data.length).toBe(10);
    expect(data[0]).toHaveProperty('upper');
    expect(data[0]).toHaveProperty('lower');
    expect(data[0]).toHaveProperty('gradient');
    expect(data[0].upper).toBeGreaterThan(data[0].lower);
    expect(data[0].gradient).toBeGreaterThanOrEqual(0);
    expect(data[0].gradient).toBeLessThanOrEqual(1);
  });
});
