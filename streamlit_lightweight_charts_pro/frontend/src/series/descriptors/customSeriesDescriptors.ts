/**
 * @fileoverview Custom Series Descriptors
 *
 * Descriptor definitions for custom series types (Band, Ribbon, etc.).
 * Each descriptor is the single source of truth for that series type.
 */

import { SeriesOptionsCommon, LineStyle } from 'lightweight-charts';
import { UnifiedSeriesDescriptor, PropertyDescriptors } from '../core/UnifiedSeriesDescriptor';
import { BandPrimitiveOptions } from '../../primitives/BandPrimitive';
import { RibbonPrimitiveOptions } from '../../primitives/RibbonPrimitive';
import { GradientRibbonPrimitiveOptions } from '../../primitives/GradientRibbonPrimitive';
import { SignalPrimitiveOptions } from '../../primitives/SignalPrimitive';

/**
 * Band Series Descriptor
 */
export const BAND_SERIES_DESCRIPTOR: UnifiedSeriesDescriptor<
  BandPrimitiveOptions & SeriesOptionsCommon
> = {
  type: 'Band',
  displayName: 'Band Series',
  isCustom: true,
  category: 'Custom',
  description: 'Three-line band with filled areas (e.g., Bollinger Bands)',

  properties: {
    upperLine: PropertyDescriptors.line(
      'Upper Line',
      '#2962FF',
      2,
      LineStyle.Solid,
      {
        colorKey: 'upperLineColor',
        widthKey: 'upperLineWidth',
        styleKey: 'upperLineStyle',
      }
    ),
    middleLine: PropertyDescriptors.line(
      'Middle Line',
      '#F7931A',
      2,
      LineStyle.Solid,
      {
        colorKey: 'middleLineColor',
        widthKey: 'middleLineWidth',
        styleKey: 'middleLineStyle',
      }
    ),
    lowerLine: PropertyDescriptors.line(
      'Lower Line',
      '#2962FF',
      2,
      LineStyle.Solid,
      {
        colorKey: 'lowerLineColor',
        widthKey: 'lowerLineWidth',
        styleKey: 'lowerLineStyle',
      }
    ),
    upperFillColor: PropertyDescriptors.color(
      'Upper Fill Color',
      'rgba(41, 98, 255, 0.1)',
      'Fill'
    ),
    upperFillVisible: PropertyDescriptors.boolean('Upper Fill Visible', true, 'Fill'),
    lowerFillColor: PropertyDescriptors.color(
      'Lower Fill Color',
      'rgba(41, 98, 255, 0.1)',
      'Fill'
    ),
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
  },

  create: (chart, data, options) => {
    // Import dynamically to avoid circular dependencies
    const { createBandSeries } = require('../../plugins/series/bandSeriesPlugin');
    return createBandSeries(chart, data, options);
  },
};

/**
 * Ribbon Series Descriptor
 */
export const RIBBON_SERIES_DESCRIPTOR: UnifiedSeriesDescriptor<
  RibbonPrimitiveOptions & SeriesOptionsCommon
> = {
  type: 'Ribbon',
  displayName: 'Ribbon Series',
  isCustom: true,
  category: 'Custom',
  description: 'Two-line ribbon with filled area between lines',

  properties: {
    upperLine: PropertyDescriptors.line(
      'Upper Line',
      '#2962FF',
      2,
      LineStyle.Solid,
      {
        colorKey: 'upperLineColor',
        widthKey: 'upperLineWidth',
        styleKey: 'upperLineStyle',
      }
    ),
    lowerLine: PropertyDescriptors.line(
      'Lower Line',
      '#2962FF',
      2,
      LineStyle.Solid,
      {
        colorKey: 'lowerLineColor',
        widthKey: 'lowerLineWidth',
        styleKey: 'lowerLineStyle',
      }
    ),
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
  },

  create: (chart, data, options) => {
    const { createRibbonSeries } = require('../../plugins/series/ribbonSeriesPlugin');
    return createRibbonSeries(chart, data, options);
  },
};

/**
 * Gradient Ribbon Series Descriptor
 */
export const GRADIENT_RIBBON_SERIES_DESCRIPTOR: UnifiedSeriesDescriptor<
  GradientRibbonPrimitiveOptions & SeriesOptionsCommon
> = {
  type: 'GradientRibbon',
  displayName: 'Gradient Ribbon Series',
  isCustom: true,
  category: 'Custom',
  description: 'Two-line ribbon with gradient-filled area',

  properties: {
    upperLine: PropertyDescriptors.line(
      'Upper Line',
      '#2962FF',
      2,
      LineStyle.Solid,
      {
        colorKey: 'upperLineColor',
        widthKey: 'upperLineWidth',
        styleKey: 'upperLineStyle',
      }
    ),
    lowerLine: PropertyDescriptors.line(
      'Lower Line',
      '#2962FF',
      2,
      LineStyle.Solid,
      {
        colorKey: 'lowerLineColor',
        widthKey: 'lowerLineWidth',
        styleKey: 'lowerLineStyle',
      }
    ),
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
    normalizeGradients: PropertyDescriptors.boolean('Normalize Gradients', false, 'Gradient'),
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
    gradientStartColor: 'rgba(41, 98, 255, 0.5)',
    gradientEndColor: 'rgba(239, 83, 80, 0.5)',
    normalizeGradients: false,
    lastValueVisible: false,
    priceLineVisible: false,
  },

  create: (chart, data, options) => {
    const { createGradientRibbonSeries } = require('../../plugins/series/gradientRibbonSeriesPlugin');
    return createGradientRibbonSeries(chart, data, options);
  },
};

/**
 * Signal Series Descriptor
 */
export const SIGNAL_SERIES_DESCRIPTOR: UnifiedSeriesDescriptor<
  SignalPrimitiveOptions & SeriesOptionsCommon
> = {
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
  },

  create: (chart, data, options) => {
    const { createSignalSeries } = require('../../plugins/series/signalSeriesPlugin');
    return createSignalSeries(chart, data, options);
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
} as const;
