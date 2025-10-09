/**
 * @fileoverview Built-in Series Descriptors
 *
 * Descriptor definitions for LightweightCharts built-in series types.
 * Each descriptor is the single source of truth for that series type.
 */

import {
  LineSeriesOptions,
  AreaSeriesOptions,
  HistogramSeriesOptions,
  BarSeriesOptions,
  CandlestickSeriesOptions,
  BaselineSeriesOptions,
  LineStyle,
  LineSeries,
  AreaSeries,
  HistogramSeries,
  BarSeries,
  CandlestickSeries,
  BaselineSeries,
} from 'lightweight-charts';
import { UnifiedSeriesDescriptor, PropertyDescriptors } from '../core/UnifiedSeriesDescriptor';

/**
 * Line Series Descriptor
 */
export const LINE_SERIES_DESCRIPTOR: UnifiedSeriesDescriptor<LineSeriesOptions> = {
  type: 'Line',
  displayName: 'Line Series',
  isCustom: false,
  category: 'Basic',
  description: 'Standard line chart series',

  properties: {
    mainLine: PropertyDescriptors.line(
      'Line',
      '#2962FF', // default color
      2, // default lineWidth
      LineStyle.Solid, // default lineStyle
      {
        colorKey: 'color',
        widthKey: 'lineWidth',
        styleKey: 'lineStyle',
      }
    ),
  },

  defaultOptions: {
    color: '#2962FF',
    lineWidth: 2,
    lineStyle: LineStyle.Solid,
    lastValueVisible: true,
    priceLineVisible: true,
  },

  create: (chart, data, options, paneId = 0) => {
    const series = chart.addSeries(LineSeries, options, paneId);
    if (data && data.length > 0) {
      series.setData(data);
    }
    return series;
  },
};

/**
 * Area Series Descriptor
 */
export const AREA_SERIES_DESCRIPTOR: UnifiedSeriesDescriptor<AreaSeriesOptions> = {
  type: 'Area',
  displayName: 'Area Series',
  isCustom: false,
  category: 'Basic',
  description: 'Area chart series with fill',

  properties: {
    mainLine: PropertyDescriptors.line(
      'Line',
      '#2962FF', // default color
      2, // default lineWidth
      LineStyle.Solid, // default lineStyle
      {
        colorKey: 'lineColor',
        widthKey: 'lineWidth',
        styleKey: 'lineStyle',
      }
    ),
    lineVisible: PropertyDescriptors.boolean('Line Visible', true, 'Line'),
    topColor: PropertyDescriptors.color('Top Color', 'rgba(41, 98, 255, 0.28)', 'Fill'),
    bottomColor: PropertyDescriptors.color('Bottom Color', 'rgba(41, 98, 255, 0.05)', 'Fill'),
    invertFilledArea: PropertyDescriptors.boolean('Invert Filled Area', false, 'Fill'),
    relativeGradient: PropertyDescriptors.boolean('Relative Gradient', false, 'Fill'),
  },

  defaultOptions: {
    lineColor: '#2962FF',
    lineWidth: 2,
    lineStyle: LineStyle.Solid,
    lineVisible: true,
    topColor: 'rgba(41, 98, 255, 0.28)',
    bottomColor: 'rgba(41, 98, 255, 0.05)',
    invertFilledArea: false,
    relativeGradient: false,
    lastValueVisible: true,
    priceLineVisible: true,
  },

  create: (chart, data, options, paneId = 0) => {
    const series = chart.addSeries(AreaSeries, options, paneId);
    if (data && data.length > 0) {
      series.setData(data);
    }
    return series;
  },
};

/**
 * Histogram Series Descriptor
 */
export const HISTOGRAM_SERIES_DESCRIPTOR: UnifiedSeriesDescriptor<HistogramSeriesOptions> = {
  type: 'Histogram',
  displayName: 'Histogram Series',
  isCustom: false,
  category: 'Basic',
  description: 'Histogram chart series',

  properties: {
    color: PropertyDescriptors.color('Color', '#26a69a'),
    base: PropertyDescriptors.number('Base Value', 0, undefined, true), // hidden from dialog
  },

  defaultOptions: {
    color: '#26a69a',
    base: 0,
    lastValueVisible: true,
    priceLineVisible: true,
  },

  create: (chart, data, options, paneId = 0) => {
    const series = chart.addSeries(HistogramSeries, options, paneId);
    if (data && data.length > 0) {
      series.setData(data);
    }
    return series;
  },
};

/**
 * Bar Series Descriptor
 */
export const BAR_SERIES_DESCRIPTOR: UnifiedSeriesDescriptor<BarSeriesOptions> = {
  type: 'Bar',
  displayName: 'Bar Series',
  isCustom: false,
  category: 'Basic',
  description: 'OHLC bar chart series',

  properties: {
    upColor: PropertyDescriptors.color('Up Color', '#26a69a', 'Colors'),
    downColor: PropertyDescriptors.color('Down Color', '#ef5350', 'Colors'),
    openVisible: PropertyDescriptors.boolean('Show Open Tick', true, 'Display'),
    thinBars: PropertyDescriptors.boolean('Thin Bars', true, 'Display'),
  },

  defaultOptions: {
    upColor: '#26a69a',
    downColor: '#ef5350',
    openVisible: true,
    thinBars: true,
    lastValueVisible: true,
    priceLineVisible: true,
  },

  create: (chart, data, options, paneId = 0) => {
    const series = chart.addSeries(BarSeries, options, paneId);
    if (data && data.length > 0) {
      series.setData(data);
    }
    return series;
  },
};

/**
 * Candlestick Series Descriptor
 */
export const CANDLESTICK_SERIES_DESCRIPTOR: UnifiedSeriesDescriptor<CandlestickSeriesOptions> = {
  type: 'Candlestick',
  displayName: 'Candlestick Series',
  isCustom: false,
  category: 'Basic',
  description: 'Candlestick chart series',

  properties: {
    upColor: PropertyDescriptors.color('Up Color', '#26a69a', 'Body'),
    downColor: PropertyDescriptors.color('Down Color', '#ef5350', 'Body'),
    borderVisible: PropertyDescriptors.boolean('Border Visible', true, 'Border'),
    borderColor: PropertyDescriptors.color('Border Color', '#378658', 'Border'),
    borderUpColor: PropertyDescriptors.color('Border Up Color', '#26a69a', 'Border'),
    borderDownColor: PropertyDescriptors.color('Border Down Color', '#ef5350', 'Border'),
    wickVisible: PropertyDescriptors.boolean('Wick Visible', true, 'Wick'),
    wickColor: PropertyDescriptors.color('Wick Color', '#737375', 'Wick'),
    wickUpColor: PropertyDescriptors.color('Wick Up Color', '#26a69a', 'Wick'),
    wickDownColor: PropertyDescriptors.color('Wick Down Color', '#ef5350', 'Wick'),
  },

  defaultOptions: {
    upColor: '#26a69a',
    downColor: '#ef5350',
    borderVisible: true,
    borderColor: '#378658',
    borderUpColor: '#26a69a',
    borderDownColor: '#ef5350',
    wickVisible: true,
    wickColor: '#737375',
    wickUpColor: '#26a69a',
    wickDownColor: '#ef5350',
    lastValueVisible: true,
    priceLineVisible: true,
  },

  create: (chart, data, options, paneId = 0) => {
    const series = chart.addSeries(CandlestickSeries, options, paneId);
    if (data && data.length > 0) {
      series.setData(data);
    }
    return series;
  },
};

/**
 * Baseline Series Descriptor
 */
export const BASELINE_SERIES_DESCRIPTOR: UnifiedSeriesDescriptor<BaselineSeriesOptions> = {
  type: 'Baseline',
  displayName: 'Baseline Series',
  isCustom: false,
  category: 'Basic',
  description: 'Baseline chart series with above/below coloring',

  properties: {
    baseValue: PropertyDescriptors.number('Base Value', 0, 'Base', true), // hidden from dialog
    topLineColor: PropertyDescriptors.color('Top Line Color', '#26a69a', 'Top'),
    topFillColor1: PropertyDescriptors.color('Top Fill Color 1', 'rgba(38, 166, 154, 0.28)', 'Top'),
    topFillColor2: PropertyDescriptors.color('Top Fill Color 2', 'rgba(38, 166, 154, 0.05)', 'Top'),
    bottomLineColor: PropertyDescriptors.color('Bottom Line Color', '#ef5350', 'Bottom'),
    bottomFillColor1: PropertyDescriptors.color(
      'Bottom Fill Color 1',
      'rgba(239, 83, 80, 0.05)',
      'Bottom'
    ),
    bottomFillColor2: PropertyDescriptors.color(
      'Bottom Fill Color 2',
      'rgba(239, 83, 80, 0.28)',
      'Bottom'
    ),
    lineWidth: PropertyDescriptors.lineWidth('Line Width', 2, 'Base'),
    relativeGradient: PropertyDescriptors.boolean('Relative Gradient', false, 'Base'),
  },

  defaultOptions: {
    baseValue: { type: 'price', price: 0 },
    topLineColor: '#26a69a',
    topFillColor1: 'rgba(38, 166, 154, 0.28)',
    topFillColor2: 'rgba(38, 166, 154, 0.05)',
    bottomLineColor: '#ef5350',
    bottomFillColor1: 'rgba(239, 83, 80, 0.05)',
    bottomFillColor2: 'rgba(239, 83, 80, 0.28)',
    lineWidth: 2,
    relativeGradient: false,
    lastValueVisible: true,
    priceLineVisible: true,
  },

  create: (chart, data, options, paneId = 0) => {
    const series = chart.addSeries(BaselineSeries, options, paneId);
    if (data && data.length > 0) {
      series.setData(data);
    }
    return series;
  },
};

/**
 * Registry of all built-in series descriptors
 */
export const BUILTIN_SERIES_DESCRIPTORS = {
  Line: LINE_SERIES_DESCRIPTOR,
  Area: AREA_SERIES_DESCRIPTOR,
  Histogram: HISTOGRAM_SERIES_DESCRIPTOR,
  Bar: BAR_SERIES_DESCRIPTOR,
  Candlestick: CANDLESTICK_SERIES_DESCRIPTOR,
  Baseline: BASELINE_SERIES_DESCRIPTOR,
} as const;
