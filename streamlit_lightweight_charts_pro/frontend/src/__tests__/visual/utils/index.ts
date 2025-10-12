/**
 * Visual Testing Utilities
 *
 * Exports all utilities needed for visual regression testing.
 *
 * @module visual/utils
 */

// Series type exports from lightweight-charts v5
export {
  LineSeries,
  AreaSeries,
  BarSeries,
  CandlestickSeries,
  HistogramSeries,
  BaselineSeries,
  LineStyle,
  LineType,
} from 'lightweight-charts';

// Chart rendering utilities
export {
  renderChart,
  cleanupChartRender,
  createChartContainer,
  waitForChartRender,
  extractCanvasFromContainer,
  extractImageData,
  getPixelColor,
  hexToRgba,
  colorsMatch,
  DEFAULT_CHART_WIDTH,
  DEFAULT_CHART_HEIGHT,
  type ChartRenderConfig,
  type ChartRenderResult,
} from './chartRenderer';

// Test data generators
export {
  generateLineData,
  generateAreaData,
  generateHistogramData,
  generateBarData,
  generateCandlestickData,
  generateBaselineData,
  generateBandData,
  generateRibbonData,
  generateTrendFillData,
  generateBandData2,
  generateRibbonData2,
  generateSignalData,
  generateGradientRibbonData,
  TestColors,
} from './testData';

// Image comparison utilities
export {
  assertMatchesSnapshot,
  compareImages,
  imageDataToPNG,
  loadPNG,
  savePNG,
  getSnapshotDir,
  getDiffDir,
  getBaselinePath,
  getDiffPath,
  ensureSnapshotDir,
  sanitizeTestName,
  type ComparisonResult,
  type ComparisonOptions,
} from './imageComparison';
