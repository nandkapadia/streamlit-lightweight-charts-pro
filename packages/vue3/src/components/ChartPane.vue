<script setup lang="ts">
/**
 * @fileoverview Chart pane component for Vue 3.
 *
 * This component represents a single pane within a chart,
 * allowing for multi-pane layouts with independent series.
 */

import {
  ref,
  inject,
  watch,
  onUnmounted,
  type PropType,
  type ShallowRef,
} from 'vue';
import {
  LineSeries,
  AreaSeries,
  CandlestickSeries,
  BarSeries,
  HistogramSeries,
  BaselineSeries,
} from 'lightweight-charts';
import type {
  IChartApi,
  ISeriesApi,
  SeriesType,
  SeriesPartialOptionsMap,
} from 'lightweight-charts';
import type { SeriesConfig, DataPoint } from '../types';

// Define props
const props = defineProps({
  /** Pane identifier */
  paneId: {
    type: Number,
    default: 0,
  },
  /** Pane height as percentage or pixels */
  height: {
    type: [Number, String],
    default: '100%',
  },
  /** Whether the pane is collapsed */
  collapsed: {
    type: Boolean,
    default: false,
  },
  /** Series to render in this pane */
  series: {
    type: Array as PropType<SeriesConfig[]>,
    default: () => [],
  },
  /** Title for the pane */
  title: {
    type: String,
    default: '',
  },
});

// Define emits
const emit = defineEmits<{
  /** Emitted when series is added */
  (e: 'seriesAdded', seriesId: string, series: ISeriesApi<SeriesType>): void;
  /** Emitted when series is removed */
  (e: 'seriesRemoved', seriesId: string): void;
  /** Emitted when pane is collapsed/expanded */
  (e: 'toggleCollapse', collapsed: boolean): void;
}>();

// Inject chart from parent
const chart = inject<ShallowRef<IChartApi | null>>('chart');
const globalSeriesMap = inject<ShallowRef<Map<string, ISeriesApi<SeriesType>>>>('seriesMap');

// Local state
const localSeriesMap = ref<Map<string, ISeriesApi<SeriesType>>>(new Map());
const isCollapsed = ref(props.collapsed);
let seriesIdCounter = 0; // Counter for generating unique series IDs

/**
 * Create a series on the chart for this pane.
 */
function createSeries(config: SeriesConfig): ISeriesApi<SeriesType> | null {
  if (!chart?.value) return null;

  const seriesId = config.seriesId || config.name || `pane${props.paneId}_series_${seriesIdCounter++}`;

  // Check if series already exists
  if (localSeriesMap.value.has(seriesId)) {
    return localSeriesMap.value.get(seriesId) || null;
  }

  let series: ISeriesApi<SeriesType>;
  const seriesType = config.seriesType.toLowerCase();

  // Series options (paneId is passed as third parameter to addSeries)
  const options = {
    ...config.options,
  };

  switch (seriesType) {
    case 'line':
      series = chart.value.addSeries(
        LineSeries, options as SeriesPartialOptionsMap['Line'], props.paneId
      );
      break;
    case 'area':
      series = chart.value.addSeries(
        AreaSeries, options as SeriesPartialOptionsMap['Area'], props.paneId
      );
      break;
    case 'candlestick':
      series = chart.value.addSeries(
        CandlestickSeries, options as SeriesPartialOptionsMap['Candlestick'], props.paneId
      );
      break;
    case 'bar':
      series = chart.value.addSeries(
        BarSeries, options as SeriesPartialOptionsMap['Bar'], props.paneId
      );
      break;
    case 'histogram':
      series = chart.value.addSeries(
        HistogramSeries, options as SeriesPartialOptionsMap['Histogram'], props.paneId
      );
      break;
    case 'baseline':
      series = chart.value.addSeries(
        BaselineSeries, options as SeriesPartialOptionsMap['Baseline'], props.paneId
      );
      break;
    default:
      console.warn(`Unknown series type: ${config.seriesType}`);
      return null;
  }

  // Set data if available
  if (config.data?.length) {
    series.setData(config.data as Parameters<typeof series.setData>[0]);
  }

  // Store in local and global maps
  localSeriesMap.value.set(seriesId, series);
  if (globalSeriesMap?.value) {
    globalSeriesMap.value.set(seriesId, series);
  }

  emit('seriesAdded', seriesId, series);
  return series;
}

/**
 * Remove a series from the chart.
 */
function removeSeries(seriesId: string): void {
  const series = localSeriesMap.value.get(seriesId);
  if (series && chart?.value) {
    chart.value.removeSeries(series);
    localSeriesMap.value.delete(seriesId);
    if (globalSeriesMap?.value) {
      globalSeriesMap.value.delete(seriesId);
    }
    emit('seriesRemoved', seriesId);
  }
}

/**
 * Update data for a series in this pane.
 */
function updateSeriesData(seriesId: string, data: DataPoint[]): void {
  const series = localSeriesMap.value.get(seriesId);
  if (series) {
    series.setData(data as Parameters<typeof series.setData>[0]);
  }
}

/**
 * Get a series by ID.
 */
function getSeries(seriesId: string): ISeriesApi<SeriesType> | undefined {
  return localSeriesMap.value.get(seriesId);
}

/**
 * Toggle pane collapsed state.
 */
function toggleCollapse(): void {
  isCollapsed.value = !isCollapsed.value;
  emit('toggleCollapse', isCollapsed.value);
}

/**
 * Initialize all series from props.
 */
function initializeSeries(): void {
  if (!chart?.value) return;

  // Remove existing series
  localSeriesMap.value.forEach((_, seriesId) => {
    removeSeries(seriesId);
  });

  // Create new series
  props.series.forEach((config) => {
    createSeries({
      ...config,
      paneId: props.paneId,
    });
  });
}

// Watch for chart initialization
watch(
  () => chart?.value,
  (newChart) => {
    if (newChart) {
      initializeSeries();
    }
  },
  { immediate: true }
);

// Watch for series prop changes
watch(
  () => props.series,
  () => {
    initializeSeries();
  },
  { deep: true }
);

// Watch for collapsed prop changes
watch(
  () => props.collapsed,
  (newCollapsed) => {
    isCollapsed.value = newCollapsed;
  }
);

// Cleanup on unmount
onUnmounted(() => {
  localSeriesMap.value.forEach((_, seriesId) => {
    removeSeries(seriesId);
  });
});

// Expose public API
defineExpose({
  /** Pane ID */
  paneId: props.paneId,
  /** Local series map */
  seriesMap: localSeriesMap,
  /** Create a series */
  createSeries,
  /** Remove a series */
  removeSeries,
  /** Update series data */
  updateSeriesData,
  /** Get a series */
  getSeries,
  /** Toggle collapse */
  toggleCollapse,
  /** Collapsed state */
  isCollapsed,
});
</script>

<template>
  <div
    class="chart-pane"
    :class="{ collapsed: isCollapsed }"
    :style="{ height: typeof height === 'number' ? `${height}px` : height }"
  >
    <div
      v-if="title"
      class="pane-header"
    >
      <span class="pane-title">{{ title }}</span>
      <button
        v-if="!isCollapsed"
        class="collapse-btn"
        title="Collapse pane"
        @click="toggleCollapse"
      >
        −
      </button>
      <button
        v-else
        class="collapse-btn"
        title="Expand pane"
        @click="toggleCollapse"
      >
        +
      </button>
    </div>
    <div
      v-if="!isCollapsed"
      class="pane-content"
    >
      <slot />
    </div>
  </div>
</template>

<style scoped>
.chart-pane {
  position: relative;
  width: 100%;
  border-bottom: 1px solid #e0e0e0;
}

.chart-pane.collapsed {
  height: 30px !important;
  min-height: 30px;
  overflow: hidden;
}

.pane-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 8px;
  background: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
  font-size: 12px;
}

.pane-title {
  font-weight: 500;
  color: #333;
}

.collapse-btn {
  width: 20px;
  height: 20px;
  border: 1px solid #ccc;
  border-radius: 3px;
  background: white;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.collapse-btn:hover {
  background: #e0e0e0;
}

.pane-content {
  width: 100%;
  height: calc(100% - 30px);
}

.chart-pane:not(:has(.pane-header)) .pane-content {
  height: 100%;
}
</style>
