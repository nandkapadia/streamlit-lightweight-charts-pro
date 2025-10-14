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
        upperFillVisible: false,
        lowerFillVisible: false,
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
