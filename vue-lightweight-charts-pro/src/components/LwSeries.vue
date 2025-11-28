<script setup lang="ts" generic="T extends AllSeriesType">
/**
 * LwSeries - Generic series component
 *
 * Adds a series to the parent chart. Must be used within an LwChart component.
 *
 * @example Candlestick series
 * ```vue
 * <LwSeries type="Candlestick" :data="ohlcData" :options="{ upColor: '#4CAF50' }" />
 * ```
 *
 * @example Band series (Bollinger Bands)
 * ```vue
 * <LwSeries
 *   type="Band"
 *   :data="bandData"
 *   :options="{
 *     upperLineColor: '#4CAF50',
 *     middleLineColor: '#2196F3',
 *     lowerLineColor: '#F44336'
 *   }"
 * />
 * ```
 */
import { watch, onMounted, onUnmounted, shallowRef, ref } from 'vue';
import type { ISeriesApi, SeriesType } from 'lightweight-charts';
import {
  BandSeriesPlugin,
  RibbonSeriesPlugin,
  GradientRibbonSeriesPlugin,
  SignalSeriesPlugin,
  TrendFillSeriesPlugin,
} from 'lightweight-charts-pro-core';
import { useChartContext } from '../composables/useChartContext';
import type { AllSeriesType, SeriesDataMap, SeriesOptionsMapping } from '../types';

// ============================================================================
// Props
// ============================================================================

export interface LwSeriesProps<T extends AllSeriesType> {
  /** Series type */
  type: T;
  /** Series data */
  data: SeriesDataMap[T];
  /** Series options */
  options?: SeriesOptionsMapping[T];
  /** Enable reactive data updates */
  reactive?: boolean;
}

const props = withDefaults(defineProps<LwSeriesProps<T>>(), {
  reactive: true,
});

// ============================================================================
// Emits
// ============================================================================

const emit = defineEmits<{
  /** Emitted when series is ready */
  ready: [series: ISeriesApi<SeriesType>];
}>();

// ============================================================================
// State
// ============================================================================

const series = shallowRef<ISeriesApi<SeriesType> | null>(null);
const isReady = ref(false);

// ============================================================================
// Context
// ============================================================================

const context = useChartContext();

// ============================================================================
// Series Creation
// ============================================================================

const BUILTIN_SERIES_METHODS = {
  Line: 'addLineSeries',
  Area: 'addAreaSeries',
  Bar: 'addBarSeries',
  Candlestick: 'addCandlestickSeries',
  Histogram: 'addHistogramSeries',
  Baseline: 'addBaselineSeries',
} as const;

const CUSTOM_SERIES_PLUGINS = {
  Band: BandSeriesPlugin,
  Ribbon: RibbonSeriesPlugin,
  GradientRibbon: GradientRibbonSeriesPlugin,
  Signal: SignalSeriesPlugin,
  TrendFill: TrendFillSeriesPlugin,
} as const;

/**
 * Create the series on the chart
 */
const createSeries = () => {
  if (!context?.chart) return;

  const chart = context.chart;
  const type = props.type as AllSeriesType;

  if (type in BUILTIN_SERIES_METHODS) {
    const method = BUILTIN_SERIES_METHODS[type as keyof typeof BUILTIN_SERIES_METHODS];
    series.value = (chart as any)[method](props.options || {});
  } else if (type in CUSTOM_SERIES_PLUGINS) {
    const plugin = CUSTOM_SERIES_PLUGINS[type as keyof typeof CUSTOM_SERIES_PLUGINS];
    series.value = chart.addCustomSeries(plugin() as any, props.options || {});
  }

  if (series.value) {
    series.value.setData(props.data as any);
    isReady.value = true;
    emit('ready', series.value);
  }
};

/**
 * Remove the series
 */
const removeSeries = () => {
  if (context?.chart && series.value) {
    context.chart.removeSeries(series.value);
    series.value = null;
    isReady.value = false;
  }
};

// ============================================================================
// Lifecycle
// ============================================================================

onMounted(() => {
  createSeries();
});

onUnmounted(() => {
  removeSeries();
});

// Watch data changes
watch(
  () => props.data,
  newData => {
    if (props.reactive && series.value && newData) {
      series.value.setData(newData as any);
    }
  },
  { deep: true }
);

// Watch options changes
watch(
  () => props.options,
  newOptions => {
    if (series.value && newOptions) {
      series.value.applyOptions(newOptions as any);
    }
  },
  { deep: true }
);

// ============================================================================
// Expose
// ============================================================================

defineExpose({
  series,
  isReady,
});
</script>

<template>
  <!-- Series is a renderless component -->
  <slot v-if="isReady" />
</template>
