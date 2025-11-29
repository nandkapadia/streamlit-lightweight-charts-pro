/**
 * @vitest-environment jsdom
 */
/**
 * Extended Visual Regression Tests for Custom Series, Widgets, and Multi-Pane Layouts
 *
 * This test suite covers:
 * - TrendFill and GradientRibbon per-point styling
 * - Legend visual rendering in all corners
 * - RangeSwitcher visual rendering in all corners
 * - Legend + RangeSwitcher same corner positioning
 * - Multi-pane chart rendering
 * - Multi-pane with Legend and RangeSwitcher
 * - Complex multi-widget multi-pane scenarios
 *
 * @group visual
 * @group extended
 */

import { describe, it, expect, afterEach } from 'vitest';
import {
  renderChart,
  cleanupChartRender,
  assertMatchesSnapshot,
  sanitizeTestName,
  generateTrendFillData,
  generateGradientRibbonData,
  TestColors,
  type ChartRenderResult,
} from '../utils';
import { createTrendFillSeries } from '../../../plugins/series/trendFillSeriesPlugin';
import { createGradientRibbonSeries } from '../../../plugins/series/gradientRibbonSeriesPlugin';
import { LineStyle } from '../../../utils/lineStyle';

// ============================================================================
// TrendFill Series Per-Point Styling Visual Tests
// ============================================================================

describe('TrendFill Series Per-Point Styling', () => {
  let renderResult: ChartRenderResult | null = null;

  afterEach(() => {
    if (renderResult) {
      cleanupChartRender(renderResult);
      renderResult = null;
    }
  });

  it('renders trendfill with per-point uptrend line color override', async () => {
    renderResult = await renderChart(chart => {
      const data = generateTrendFillData(30, 100).map((point, i) => ({
        ...point,
        ...(i === 15 && point.trendDirection === 1
          ? { styles: { uptrendLine: { color: '#FF00FF', width: 4 } } }
          : {}),
      }));
      const series = createTrendFillSeries(chart, {
        uptrendLineColor: TestColors.GREEN,
        downtrendLineColor: TestColors.RED,
      });
      series.setData(data);
    });

    const result = assertMatchesSnapshot(
      sanitizeTestName('trendfill-per-point-uptrend-color'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(result.matches).toBe(true);
  });

  it('renders trendfill with per-point downtrend line color override', async () => {
    renderResult = await renderChart(chart => {
      const data = generateTrendFillData(30, 100).map((point, i) => ({
        ...point,
        ...(i === 15 && point.trendDirection === -1
          ? { styles: { downtrendLine: { color: '#0000FF', width: 4 } } }
          : {}),
      }));
      const series = createTrendFillSeries(chart, {
        uptrendLineColor: TestColors.GREEN,
        downtrendLineColor: TestColors.RED,
      });
      series.setData(data);
    });

    const result = assertMatchesSnapshot(
      sanitizeTestName('trendfill-per-point-downtrend-color'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(result.matches).toBe(true);
  });

  it('renders trendfill with per-point fill color override', async () => {
    renderResult = await renderChart(chart => {
      const data = generateTrendFillData(30, 100).map((point, i) => ({
        ...point,
        ...(i >= 10 && i <= 15
          ? {
              styles: {
                uptrendFill: { color: 'rgba(255, 0, 255, 0.4)', visible: true },
                downtrendFill: { color: 'rgba(0, 255, 255, 0.4)', visible: true },
              },
            }
          : {}),
      }));
      const series = createTrendFillSeries(chart, {
        uptrendLineColor: TestColors.GREEN,
        downtrendLineColor: TestColors.RED,
        uptrendFillColor: 'rgba(76, 175, 80, 0.3)',
        downtrendFillColor: 'rgba(244, 67, 54, 0.3)',
      });
      series.setData(data);
    });

    const result = assertMatchesSnapshot(
      sanitizeTestName('trendfill-per-point-fill-colors'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(result.matches).toBe(true);
  });

  it('renders trendfill with per-point line width override', async () => {
    renderResult = await renderChart(chart => {
      const data = generateTrendFillData(30, 100).map((point, i) => ({
        ...point,
        ...(i >= 10 && i <= 15
          ? {
              styles: {
                uptrendLine: { width: 6 },
                downtrendLine: { width: 6 },
              },
            }
          : {}),
      }));
      const series = createTrendFillSeries(chart, {
        uptrendLineColor: TestColors.GREEN,
        downtrendLineColor: TestColors.RED,
        uptrendLineWidth: 2,
        downtrendLineWidth: 2,
      });
      series.setData(data);
    });

    const result = assertMatchesSnapshot(
      sanitizeTestName('trendfill-per-point-line-width'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(result.matches).toBe(true);
  });

  it('renders trendfill with per-point line style override (dotted/dashed)', async () => {
    renderResult = await renderChart(chart => {
      const data = generateTrendFillData(30, 100).map((point, i) => ({
        ...point,
        ...(i >= 10 && i <= 15
          ? {
              styles: {
                uptrendLine: { style: LineStyle.Dashed, width: 3 },
                downtrendLine: { style: LineStyle.Dotted, width: 3 },
              },
            }
          : {}),
      }));
      const series = createTrendFillSeries(chart, {
        uptrendLineColor: TestColors.GREEN,
        downtrendLineColor: TestColors.RED,
      });
      series.setData(data);
    });

    const result = assertMatchesSnapshot(
      sanitizeTestName('trendfill-per-point-line-styles'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(result.matches).toBe(true);
  });

  it('renders trendfill with complete per-point styling', async () => {
    renderResult = await renderChart(chart => {
      const data = generateTrendFillData(30, 100).map((point, i) => ({
        ...point,
        ...(i === 15
          ? {
              styles: {
                uptrendLine: { color: '#FF00FF', width: 5, style: LineStyle.Dashed },
                downtrendLine: { color: '#00FFFF', width: 5, style: LineStyle.Dotted },
                uptrendFill: { color: 'rgba(255, 0, 255, 0.5)', visible: true },
                downtrendFill: { color: 'rgba(0, 255, 255, 0.5)', visible: true },
                baseLine: { color: '#FFFF00', width: 3, style: LineStyle.Solid, visible: true },
              },
            }
          : {}),
      }));
      const series = createTrendFillSeries(chart, {
        uptrendLineColor: TestColors.GREEN,
        downtrendLineColor: TestColors.RED,
        baseLineVisible: false,
      });
      series.setData(data);
    });

    const result = assertMatchesSnapshot(
      sanitizeTestName('trendfill-per-point-complete'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(result.matches).toBe(true);
  });

  it('renders trendfill with mixed per-point styling', async () => {
    renderResult = await renderChart(chart => {
      const data = generateTrendFillData(30, 100).map((point, i) => ({
        ...point,
        ...(i % 5 === 0
          ? {
              styles: {
                uptrendLine: { color: '#FF0000' },
                downtrendLine: { color: '#0000FF' },
              },
            }
          : {}),
      }));
      const series = createTrendFillSeries(chart, {
        uptrendLineColor: TestColors.GREEN,
        downtrendLineColor: TestColors.RED,
      });
      series.setData(data);
    });

    const result = assertMatchesSnapshot(
      sanitizeTestName('trendfill-per-point-mixed'),
      renderResult.imageData,
      { threshold: 0.1, tolerance: 1.0 }
    );

    expect(result.matches).toBe(true);
  });
});

// ============================================================================
// GradientRibbon Series Per-Point Styling Visual Tests
// ============================================================================

describe('GradientRibbon Series Per-Point Styling', () => {
  let renderResult: ChartRenderResult | null = null;

  afterEach(() => {
    if (renderResult) {
      cleanupChartRender(renderResult);
      renderResult = null;
    }
  });

  it('renders gradient ribbon with per-point line color override', async () => {
    renderResult = await renderChart(chart => {
      const data = generateGradientRibbonData(30, 100).map((point, i) => ({
        ...point,
        ...(i === 15
          ? {
              styles: {
                upperLine: { color: '#FF0000', width: 4 },
                lowerLine: { color: '#0000FF', width: 4 },
              },
            }
          : {}),
      }));
      const series = createGradientRibbonSeries(chart, {
        upperLineColor: TestColors.GREEN,
        lowerLineColor: TestColors.RED,
        gradientStartColor: TestColors.GREEN,
        gradientEndColor: TestColors.RED,
      });
      series.setData(data);
    });

    const result = assertMatchesSnapshot(
      sanitizeTestName('gradient-ribbon-per-point-line-colors'),
      renderResult.imageData,
      { threshold: 0.2, tolerance: 2.5 }
    );

    expect(result.matches).toBe(true);
  });

  it('renders gradient ribbon with per-point gradient color override', async () => {
    renderResult = await renderChart(chart => {
      const data = generateGradientRibbonData(30, 100).map((point, i) => ({
        ...point,
        ...(i >= 10 && i <= 15
          ? {
              styles: {
                gradient: {
                  startColor: TestColors.PURPLE,
                  endColor: TestColors.ORANGE,
                },
              },
            }
          : {}),
      }));
      const series = createGradientRibbonSeries(chart, {
        upperLineColor: TestColors.GREEN,
        lowerLineColor: TestColors.RED,
        gradientStartColor: TestColors.GREEN,
        gradientEndColor: TestColors.RED,
      });
      series.setData(data);
    });

    const result = assertMatchesSnapshot(
      sanitizeTestName('gradient-ribbon-per-point-gradient'),
      renderResult.imageData,
      { threshold: 0.2, tolerance: 2.5 }
    );

    expect(result.matches).toBe(true);
  });

  it('renders gradient ribbon with per-point line width override', async () => {
    renderResult = await renderChart(chart => {
      const data = generateGradientRibbonData(30, 100).map((point, i) => ({
        ...point,
        ...(i >= 10 && i <= 15
          ? {
              styles: {
                upperLine: { width: 6 },
                lowerLine: { width: 6 },
              },
            }
          : {}),
      }));
      const series = createGradientRibbonSeries(chart, {
        upperLineColor: TestColors.GREEN,
        lowerLineColor: TestColors.RED,
        gradientStartColor: TestColors.GREEN,
        gradientEndColor: TestColors.RED,
        upperLineWidth: 2,
        lowerLineWidth: 2,
      });
      series.setData(data);
    });

    const result = assertMatchesSnapshot(
      sanitizeTestName('gradient-ribbon-per-point-line-width'),
      renderResult.imageData,
      { threshold: 0.2, tolerance: 2.5 }
    );

    expect(result.matches).toBe(true);
  });

  it('renders gradient ribbon with per-point line style override', async () => {
    renderResult = await renderChart(chart => {
      const data = generateGradientRibbonData(30, 100).map((point, i) => ({
        ...point,
        ...(i >= 10 && i <= 15
          ? {
              styles: {
                upperLine: { style: LineStyle.Dashed, width: 3 },
                lowerLine: { style: LineStyle.Dotted, width: 3 },
              },
            }
          : {}),
      }));
      const series = createGradientRibbonSeries(chart, {
        upperLineColor: TestColors.GREEN,
        lowerLineColor: TestColors.RED,
        gradientStartColor: TestColors.GREEN,
        gradientEndColor: TestColors.RED,
      });
      series.setData(data);
    });

    const result = assertMatchesSnapshot(
      sanitizeTestName('gradient-ribbon-per-point-line-styles'),
      renderResult.imageData,
      { threshold: 0.2, tolerance: 2.5 }
    );

    expect(result.matches).toBe(true);
  });

  it('renders gradient ribbon with complete per-point styling', async () => {
    renderResult = await renderChart(chart => {
      const data = generateGradientRibbonData(30, 100).map((point, i) => ({
        ...point,
        ...(i === 15
          ? {
              styles: {
                upperLine: { color: '#FF00FF', width: 5, style: LineStyle.Dashed },
                lowerLine: { color: '#FFFF00', width: 5, style: LineStyle.Dotted },
                gradient: {
                  startColor: '#FF00FF',
                  endColor: '#FFFF00',
                },
              },
            }
          : {}),
      }));
      const series = createGradientRibbonSeries(chart, {
        upperLineColor: TestColors.GREEN,
        lowerLineColor: TestColors.RED,
        gradientStartColor: TestColors.GREEN,
        gradientEndColor: TestColors.RED,
      });
      series.setData(data);
    });

    const result = assertMatchesSnapshot(
      sanitizeTestName('gradient-ribbon-per-point-complete'),
      renderResult.imageData,
      { threshold: 0.2, tolerance: 2.5 }
    );

    expect(result.matches).toBe(true);
  });
});

// ============================================================================
// NOTE: Legend, RangeSwitcher, and Multi-Pane Tests
// ============================================================================
//
// The following test sections are planned but require additional setup:
// - Legend primitive factory and rendering utilities
// - RangeSwitcher primitive factory and rendering utilities
// - Multi-pane chart creation utilities
//
// These will be implemented in a follow-up commit once the utility functions
// are available in the test utils.
//
// Planned test sections:
// 1. Legend Visual Rendering (all 4 corners, styling variations)
// 2. RangeSwitcher Visual Rendering (all 4 corners, time ranges)
// 3. Legend + RangeSwitcher Same Corner (single pane)
// 4. Multi-Pane Basic Rendering
// 5. Multi-Pane with Legend
// 6. Multi-Pane with RangeSwitcher
// 7. Multi-Pane Legend + RangeSwitcher (complex scenarios)
//
// Total planned additional tests: ~70
// ============================================================================
