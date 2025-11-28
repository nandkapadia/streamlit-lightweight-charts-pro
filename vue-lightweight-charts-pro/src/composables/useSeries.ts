/**
 * @fileoverview useSeries composable for adding series to charts
 */

import { ref, shallowRef, watch, onUnmounted, type Ref, type ShallowRef } from 'vue';
import type { IChartApi, ISeriesApi, SeriesType } from 'lightweight-charts';
import {
  BandSeriesPlugin,
  RibbonSeriesPlugin,
  GradientRibbonSeriesPlugin,
  SignalSeriesPlugin,
  TrendFillSeriesPlugin,
} from 'lightweight-charts-pro-core';
import type { AllSeriesType, SeriesDataMap, SeriesOptionsMapping } from '../types';

/**
 * Options for useSeries composable
 */
export interface UseSeriesOptions<T extends AllSeriesType> {
  /** The chart instance to add the series to */
  chart: Ref<IChartApi | null> | ShallowRef<IChartApi | null>;
  /** Series type */
  type: T;
  /** Initial data */
  data?: SeriesDataMap[T];
  /** Series options */
  options?: SeriesOptionsMapping[T];
  /** Enable reactive data updates */
  reactive?: boolean;
}

/**
 * Return type for useSeries composable
 */
export interface UseSeriesReturn<T extends AllSeriesType> {
  /** The series API instance */
  series: Ref<ISeriesApi<SeriesType> | null>;
  /** Whether the series is ready */
  isReady: Ref<boolean>;
  /** Set series data */
  setData: (data: SeriesDataMap[T]) => void;
  /** Update single data point */
  update: (data: SeriesDataMap[T][0]) => void;
  /** Apply options to series */
  applyOptions: (options: SeriesOptionsMapping[T]) => void;
  /** Remove the series from chart */
  remove: () => void;
}

/**
 * Built-in series type mapping
 */
const BUILTIN_SERIES_METHODS = {
  Line: 'addLineSeries',
  Area: 'addAreaSeries',
  Bar: 'addBarSeries',
  Candlestick: 'addCandlestickSeries',
  Histogram: 'addHistogramSeries',
  Baseline: 'addBaselineSeries',
} as const;

/**
 * Custom series plugin mapping
 */
const CUSTOM_SERIES_PLUGINS = {
  Band: BandSeriesPlugin,
  Ribbon: RibbonSeriesPlugin,
  GradientRibbon: GradientRibbonSeriesPlugin,
  Signal: SignalSeriesPlugin,
  TrendFill: TrendFillSeriesPlugin,
} as const;

/**
 * Check if series type is built-in
 */
function isBuiltInSeries(type: AllSeriesType): type is keyof typeof BUILTIN_SERIES_METHODS {
  return type in BUILTIN_SERIES_METHODS;
}

/**
 * Check if series type is custom
 */
function isCustomSeries(type: AllSeriesType): type is keyof typeof CUSTOM_SERIES_PLUGINS {
  return type in CUSTOM_SERIES_PLUGINS;
}

/**
 * Composable for adding and managing a series on a chart
 *
 * @param options - Series configuration options
 * @returns Series utilities and references
 *
 * @example Built-in series
 * ```vue
 * <script setup>
 * import { useChart, useSeries } from 'vue-lightweight-charts-pro'
 *
 * const { containerRef, chart } = useChart()
 *
 * const { series, setData } = useSeries({
 *   chart,
 *   type: 'Candlestick',
 *   options: { upColor: '#4CAF50', downColor: '#F44336' }
 * })
 *
 * // Set data when ready
 * setData([
 *   { time: '2024-01-01', open: 100, high: 105, low: 95, close: 102 },
 * ])
 * </script>
 * ```
 *
 * @example Custom series (Band)
 * ```vue
 * <script setup>
 * import { useChart, useSeries } from 'vue-lightweight-charts-pro'
 *
 * const { containerRef, chart } = useChart()
 *
 * const { series, setData } = useSeries({
 *   chart,
 *   type: 'Band',
 *   options: {
 *     upperLineColor: '#4CAF50',
 *     middleLineColor: '#2196F3',
 *     lowerLineColor: '#F44336'
 *   }
 * })
 *
 * setData([
 *   { time: '2024-01-01', upper: 105, middle: 100, lower: 95 },
 * ])
 * </script>
 * ```
 */
export function useSeries<T extends AllSeriesType>(
  options: UseSeriesOptions<T>
): UseSeriesReturn<T> {
  const { chart, type, data, options: seriesOptions, reactive = true } = options;

  const series = shallowRef<ISeriesApi<SeriesType> | null>(null);
  const isReady = ref(false);
  const currentData = ref<SeriesDataMap[T] | undefined>(data);

  /**
   * Create the series on the chart
   */
  const createSeries = (chartInstance: IChartApi) => {
    if (isBuiltInSeries(type)) {
      const method = BUILTIN_SERIES_METHODS[type];
      series.value = (chartInstance as any)[method](seriesOptions || {});
    } else if (isCustomSeries(type)) {
      const plugin = CUSTOM_SERIES_PLUGINS[type];
      series.value = chartInstance.addCustomSeries(plugin() as any, seriesOptions || {});
    }

    if (series.value && currentData.value) {
      series.value.setData(currentData.value as any);
    }

    isReady.value = true;
  };

  /**
   * Set series data
   */
  const setData = (newData: SeriesDataMap[T]) => {
    currentData.value = newData;
    if (series.value) {
      series.value.setData(newData as any);
    }
  };

  /**
   * Update single data point
   */
  const update = (dataPoint: SeriesDataMap[T][0]) => {
    if (series.value) {
      series.value.update(dataPoint as any);
    }
  };

  /**
   * Apply options to series
   */
  const applyOptions = (newOptions: SeriesOptionsMapping[T]) => {
    if (series.value) {
      series.value.applyOptions(newOptions as any);
    }
  };

  /**
   * Remove the series from chart
   */
  const remove = () => {
    if (chart.value && series.value) {
      chart.value.removeSeries(series.value);
      series.value = null;
      isReady.value = false;
    }
  };

  // Watch for chart instance
  watch(
    chart,
    newChart => {
      if (newChart && !series.value) {
        createSeries(newChart);
      }
    },
    { immediate: true }
  );

  // Watch for data changes if reactive
  if (reactive) {
    watch(
      () => data,
      newData => {
        if (newData && series.value) {
          setData(newData);
        }
      },
      { deep: true }
    );
  }

  // Watch for options changes
  watch(
    () => seriesOptions,
    newOptions => {
      if (newOptions && series.value) {
        applyOptions(newOptions);
      }
    },
    { deep: true }
  );

  // Cleanup on unmount
  onUnmounted(() => {
    remove();
  });

  return {
    series,
    isReady,
    setData,
    update,
    applyOptions,
    remove,
  };
}
