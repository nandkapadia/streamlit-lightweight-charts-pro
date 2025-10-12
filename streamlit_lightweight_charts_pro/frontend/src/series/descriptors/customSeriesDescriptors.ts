/**
 * @fileoverview Custom Series Descriptors
 *
 * Descriptor definitions for custom series types (Band, Ribbon, etc.).
 * Each descriptor is the single source of truth for that series type.
 */

import { LineStyle, IChartApi } from 'lightweight-charts';
import { UnifiedSeriesDescriptor, PropertyDescriptors } from '../core/UnifiedSeriesDescriptor';
import { createBandSeries, type BandData } from '../../plugins/series/bandSeriesPlugin';
import { createRibbonSeries, type RibbonData } from '../../plugins/series/ribbonSeriesPlugin';
import {
  createGradientRibbonSeries,
  type GradientRibbonData,
} from '../../plugins/series/gradientRibbonSeriesPlugin';
import { createSignalSeries, type SignalData } from '../../plugins/series/signalSeriesPlugin';
import { createTrendFillSeries } from '../../plugins/series/trendFillSeriesPlugin';

/**
 * Band Series Descriptor
 */
export const BAND_SERIES_DESCRIPTOR: UnifiedSeriesDescriptor<any> = {
  type: 'Band',
  displayName: 'Band Series',
  isCustom: true,
  category: 'Custom',
  description: 'Three-line band with filled areas (e.g., Bollinger Bands)',

  properties: {
    upperLine: PropertyDescriptors.line('Upper Line', '#2962FF', 2, LineStyle.Solid, {
      colorKey: 'upperLineColor',
      widthKey: 'upperLineWidth',
      styleKey: 'upperLineStyle',
    }),
    upperLineVisible: PropertyDescriptors.boolean('Upper Line Visible', true, 'Upper Line'),
    middleLine: PropertyDescriptors.line('Middle Line', '#F7931A', 2, LineStyle.Solid, {
      colorKey: 'middleLineColor',
      widthKey: 'middleLineWidth',
      styleKey: 'middleLineStyle',
    }),
    middleLineVisible: PropertyDescriptors.boolean('Middle Line Visible', true, 'Middle Line'),
    lowerLine: PropertyDescriptors.line('Lower Line', '#2962FF', 2, LineStyle.Solid, {
      colorKey: 'lowerLineColor',
      widthKey: 'lowerLineWidth',
      styleKey: 'lowerLineStyle',
    }),
    lowerLineVisible: PropertyDescriptors.boolean('Lower Line Visible', true, 'Lower Line'),
    upperFillColor: PropertyDescriptors.color('Upper Fill Color', 'rgba(41, 98, 255, 0.1)', 'Fill'),
    upperFillVisible: PropertyDescriptors.boolean('Upper Fill Visible', true, 'Fill'),
    lowerFillColor: PropertyDescriptors.color('Lower Fill Color', 'rgba(41, 98, 255, 0.1)', 'Fill'),
    lowerFillVisible: PropertyDescriptors.boolean('Lower Fill Visible', true, 'Fill'),
  },

  defaultOptions: {
    upperLineColor: '#2962FF',
    upperLineWidth: 2,
    upperLineStyle: LineStyle.Solid,
    upperLineVisible: true,
    middleLineColor: '#F7931A',
    middleLineWidth: 2,
    middleLineStyle: LineStyle.Solid,
    middleLineVisible: true,
    lowerLineColor: '#2962FF',
    lowerLineWidth: 2,
    lowerLineStyle: LineStyle.Solid,
    lowerLineVisible: true,
    upperFillColor: 'rgba(41, 98, 255, 0.1)',
    upperFillVisible: true,
    lowerFillColor: 'rgba(41, 98, 255, 0.1)',
    lowerFillVisible: true,
    lastValueVisible: false,
    priceLineVisible: false,
    usePrimitive: true, // Enable primitive rendering (factory-specific option)
  } as any, // Factory accepts additional options beyond primitive options

  create: (chart, data, options, _paneId = 0) => {
    return createBandSeries(chart as IChartApi, { ...options, data: data as BandData[] });
  },
};

/**
 * Ribbon Series Descriptor
 */
export const RIBBON_SERIES_DESCRIPTOR: UnifiedSeriesDescriptor<any> = {
  type: 'Ribbon',
  displayName: 'Ribbon Series',
  isCustom: true,
  category: 'Custom',
  description: 'Two-line ribbon with filled area between lines',

  properties: {
    upperLine: PropertyDescriptors.line('Upper Line', '#2962FF', 2, LineStyle.Solid, {
      colorKey: 'upperLineColor',
      widthKey: 'upperLineWidth',
      styleKey: 'upperLineStyle',
    }),
    upperLineVisible: PropertyDescriptors.boolean('Upper Line Visible', true, 'Upper Line'),
    lowerLine: PropertyDescriptors.line('Lower Line', '#2962FF', 2, LineStyle.Solid, {
      colorKey: 'lowerLineColor',
      widthKey: 'lowerLineWidth',
      styleKey: 'lowerLineStyle',
    }),
    lowerLineVisible: PropertyDescriptors.boolean('Lower Line Visible', true, 'Lower Line'),
    fillColor: PropertyDescriptors.color('Fill Color', 'rgba(41, 98, 255, 0.1)', 'Fill'),
    fillVisible: PropertyDescriptors.boolean('Fill Visible', true, 'Fill'),
  },

  defaultOptions: {
    upperLineColor: '#2962FF',
    upperLineWidth: 2,
    upperLineStyle: LineStyle.Solid,
    upperLineVisible: true,
    lowerLineColor: '#2962FF',
    lowerLineWidth: 2,
    lowerLineStyle: LineStyle.Solid,
    lowerLineVisible: true,
    fillColor: 'rgba(41, 98, 255, 0.1)',
    fillVisible: true,
    lastValueVisible: false,
    priceLineVisible: false,
    usePrimitive: true, // Enable primitive rendering (factory-specific option)
  } as any, // Factory accepts additional options beyond primitive options

  create: (chart, data, options, _paneId = 0) => {
    return createRibbonSeries(chart as IChartApi, { ...options, data: data as RibbonData[] });
  },
};

/**
 * Gradient Ribbon Series Descriptor
 */
export const GRADIENT_RIBBON_SERIES_DESCRIPTOR: UnifiedSeriesDescriptor<any> = {
  type: 'GradientRibbon',
  displayName: 'Gradient Ribbon Series',
  isCustom: true,
  category: 'Custom',
  description: 'Two-line ribbon with gradient-filled area',

  properties: {
    upperLine: PropertyDescriptors.line('Upper Line', '#2962FF', 2, LineStyle.Solid, {
      colorKey: 'upperLineColor',
      widthKey: 'upperLineWidth',
      styleKey: 'upperLineStyle',
    }),
    upperLineVisible: PropertyDescriptors.boolean('Upper Line Visible', true, 'Upper Line'),
    lowerLine: PropertyDescriptors.line('Lower Line', '#2962FF', 2, LineStyle.Solid, {
      colorKey: 'lowerLineColor',
      widthKey: 'lowerLineWidth',
      styleKey: 'lowerLineStyle',
    }),
    lowerLineVisible: PropertyDescriptors.boolean('Lower Line Visible', true, 'Lower Line'),
    fillVisible: PropertyDescriptors.boolean('Fill Visible', true, 'Fill'),
    gradientStartColor: PropertyDescriptors.color(
      'Gradient Start Color',
      'rgba(41, 98, 255, 0.5)',
      'Gradient'
    ),
    gradientEndColor: PropertyDescriptors.color(
      'Gradient End Color',
      'rgba(239, 83, 80, 0.5)',
      'Gradient'
    ),
    normalizeGradients: {
      ...PropertyDescriptors.boolean('Normalize Gradients', false, 'Gradient'),
      hidden: true,
    },
  },

  defaultOptions: {
    upperLineColor: '#2962FF',
    upperLineWidth: 2,
    upperLineStyle: LineStyle.Solid,
    upperLineVisible: true,
    lowerLineColor: '#2962FF',
    lowerLineWidth: 2,
    lowerLineStyle: LineStyle.Solid,
    lowerLineVisible: true,
    fillVisible: true,
    gradientStartColor: 'rgba(41, 98, 255, 0.5)',
    gradientEndColor: 'rgba(239, 83, 80, 0.5)',
    normalizeGradients: false,
    lastValueVisible: false,
    priceLineVisible: false,
    usePrimitive: true, // Enable primitive rendering (factory-specific option)
  } as any, // Factory accepts additional options beyond primitive options

  create: (chart, data, options, _paneId = 0) => {
    return createGradientRibbonSeries(chart as IChartApi, {
      ...options,
      data: data as GradientRibbonData[],
    });
  },
};

/**
 * Signal Series Descriptor
 */
export const SIGNAL_SERIES_DESCRIPTOR: UnifiedSeriesDescriptor<any> = {
  type: 'Signal',
  displayName: 'Signal Series',
  isCustom: true,
  category: 'Custom',
  description: 'Vertical background bands for trading signals',

  properties: {
    neutralColor: PropertyDescriptors.color('Neutral Color', 'rgba(128, 128, 128, 0.3)', 'Colors'),
    signalColor: PropertyDescriptors.color('Signal Color', 'rgba(41, 98, 255, 0.3)', 'Colors'),
    alertColor: PropertyDescriptors.color('Alert Color', 'rgba(239, 83, 80, 0.3)', 'Colors'),
  },

  defaultOptions: {
    neutralColor: 'rgba(128, 128, 128, 0.3)',
    signalColor: 'rgba(41, 98, 255, 0.3)',
    alertColor: 'rgba(239, 83, 80, 0.3)',
    lastValueVisible: false,
    priceLineVisible: false,
    usePrimitive: true, // Enable primitive rendering (factory-specific option)
  } as any, // Factory accepts additional options beyond primitive options

  create: (chart, data, options, _paneId = 0) => {
    return createSignalSeries(chart as IChartApi, { ...options, data: data as SignalData[] });
  },
};

/**
 * TrendFill Series Descriptor
 */
export const TREND_FILL_SERIES_DESCRIPTOR: UnifiedSeriesDescriptor<any> = {
  type: 'TrendFill',
  displayName: 'Trend Fill Series',
  isCustom: true,
  category: 'Custom',
  description: 'Filled area between trend and base lines with direction-based coloring',

  properties: {
    uptrendFillColor: PropertyDescriptors.color(
      'Uptrend Fill Color',
      'rgba(76, 175, 80, 0.3)',
      'Fill'
    ),
    downtrendFillColor: PropertyDescriptors.color(
      'Downtrend Fill Color',
      'rgba(244, 67, 54, 0.3)',
      'Fill'
    ),
    fillVisible: PropertyDescriptors.boolean('Fill Visible', true, 'Fill'),
    uptrendLine: PropertyDescriptors.line('Uptrend Line', '#4CAF50', 2, LineStyle.Solid, {
      colorKey: 'uptrendLineColor',
      widthKey: 'uptrendLineWidth',
      styleKey: 'uptrendLineStyle',
    }),
    uptrendLineVisible: PropertyDescriptors.boolean('Uptrend Line Visible', true, 'Uptrend Line'),
    downtrendLine: PropertyDescriptors.line('Downtrend Line', '#F44336', 2, LineStyle.Solid, {
      colorKey: 'downtrendLineColor',
      widthKey: 'downtrendLineWidth',
      styleKey: 'downtrendLineStyle',
    }),
    downtrendLineVisible: PropertyDescriptors.boolean(
      'Downtrend Line Visible',
      true,
      'Downtrend Line'
    ),
    baseLine: PropertyDescriptors.line('Base Line', '#666666', 1, LineStyle.Dotted, {
      colorKey: 'baseLineColor',
      widthKey: 'baseLineWidth',
      styleKey: 'baseLineStyle',
    }),
    baseLineVisible: PropertyDescriptors.boolean('Base Line Visible', false, 'Base Line'),
  },

  defaultOptions: {
    uptrendFillColor: 'rgba(76, 175, 80, 0.3)',
    downtrendFillColor: 'rgba(244, 67, 54, 0.3)',
    fillVisible: true,
    uptrendLineColor: '#4CAF50',
    uptrendLineWidth: 2,
    uptrendLineStyle: LineStyle.Solid,
    uptrendLineVisible: true,
    downtrendLineColor: '#F44336',
    downtrendLineWidth: 2,
    downtrendLineStyle: LineStyle.Solid,
    downtrendLineVisible: true,
    baseLineColor: '#666666',
    baseLineWidth: 1,
    baseLineStyle: LineStyle.Dotted,
    baseLineVisible: false,
    lastValueVisible: false,
    priceLineVisible: false,
    usePrimitive: true, // Enable primitive rendering (factory-specific option)
  } as any, // Factory accepts additional options beyond primitive options

  create: (chart, data, options, _paneId = 0) => {
    return createTrendFillSeries(chart as IChartApi, { ...options, data: data as never });
  },
};

/**
 * Registry of all custom series descriptors
 */
export const CUSTOM_SERIES_DESCRIPTORS = {
  Band: BAND_SERIES_DESCRIPTOR,
  Ribbon: RIBBON_SERIES_DESCRIPTOR,
  GradientRibbon: GRADIENT_RIBBON_SERIES_DESCRIPTOR,
  Signal: SIGNAL_SERIES_DESCRIPTOR,
  TrendFill: TREND_FILL_SERIES_DESCRIPTOR,
} as const;
