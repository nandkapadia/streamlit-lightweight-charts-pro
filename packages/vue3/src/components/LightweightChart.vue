<script setup lang="ts">
/**
 * @fileoverview Main chart component for Vue 3.
 *
 * This component creates and manages a TradingView Lightweight Chart
 * with optional backend API integration for data fetching and real-time updates.
 */

import {
  ref,
  shallowRef,
  triggerRef,
  computed,
  watch,
  onMounted,
  onUnmounted,
  provide,
  type PropType,
} from 'vue';
import {
  createChart,
  type IChartApi,
  type ISeriesApi,
  type SeriesType,
  type MouseEventParams,
  type LogicalRange,
} from 'lightweight-charts';
import type { ChartOptions, SeriesConfig, DataPoint } from '../types';
import { useChartApi } from '../composables/useChartApi';
import { useChartWebSocket } from '../composables/useChartWebSocket';
import { useLazyLoading } from '../composables/useLazyLoading';

// Define props
const props = defineProps({
  /** Unique chart identifier */
  chartId: {
    type: String,
    required: true,
  },
  /** Backend API URL */
  apiUrl: {
    type: String,
    default: '/api/charts',
  },
  /** WebSocket URL */
  wsUrl: {
    type: String,
    default: '',
  },
  /** Chart configuration options */
  options: {
    type: Object as PropType<ChartOptions>,
    default: () => ({}),
  },
  /** Initial series configurations */
  series: {
    type: Array as PropType<SeriesConfig[]>,
    default: () => [],
  },
  /** Whether to auto-connect to WebSocket */
  autoConnect: {
    type: Boolean,
    default: false,
  },
  /** Whether to auto-fit content after data changes */
  autoFit: {
    type: Boolean,
    default: true,
  },
  /** Whether to enable lazy loading */
  lazyLoading: {
    type: Boolean,
    default: true,
  },
  /** CSS class for container */
  containerClass: {
    type: String,
    default: '',
  },
});

// Define emits
const emit = defineEmits<{
  /** Emitted when chart is ready */
  (e: 'ready', chart: IChartApi): void;
  /** Emitted when crosshair moves */
  (e: 'crosshairMove', params: MouseEventParams): void;
  /** Emitted when time range changes */
  (e: 'visibleTimeRangeChange', range: LogicalRange | null): void;
  /** Emitted when series is clicked */
  (e: 'click', params: MouseEventParams): void;
  /** Emitted on WebSocket connection */
  (e: 'connected'): void;
  /** Emitted on WebSocket disconnection */
  (e: 'disconnected'): void;
  /** Emitted on error */
  (e: 'error', error: Error): void;
  /** Emitted when data is loaded */
  (e: 'dataLoaded', seriesId: string, count: number): void;
}>();

// Template refs
const containerRef = ref<HTMLElement | null>(null);

// Chart state
const chart = shallowRef<IChartApi | null>(null);
const seriesMap = shallowRef<Map<string, ISeriesApi<SeriesType>>>(new Map());
const seriesConfigs = ref<SeriesConfig[]>([...props.series]);
const isInitialized = ref(false);
const isLoading = ref(false);
const error = ref<string | null>(null);

// Cleanup references
let resizeObserver: ResizeObserver | null = null;
let unsubscribeCrosshairMove: (() => void) | null = null;
let unsubscribeClick: (() => void) | null = null;
let unsubscribeVisibleRangeChange: (() => void) | null = null;

// Computed
const hasWebSocket = computed(() => !!props.wsUrl);

// API composable
const api = useChartApi({ baseUrl: props.apiUrl });

// WebSocket composable (conditionally used)
const ws = props.wsUrl
  ? useChartWebSocket(
      {
        url: props.wsUrl,
        chartId: props.chartId,
        reconnect: { enabled: true },
      },
      {
        onConnected: () => emit('connected'),
        onDisconnected: () => emit('disconnected'),
        onError: (err) => emit('error', err),
        onHistoryResponse: (response) => {
          if (response.data) {
            mergeHistoryData(response.seriesId, response.data, response.hasMoreBefore ? 'before' : 'after');
            lazyLoadingState?.handleHistoryResponse(
              response.seriesId,
              response.hasMoreBefore ? 'before' : 'after',
              response.hasMoreBefore,
              response.hasMoreAfter
            );
          }
        },
        onDataUpdate: async (update) => {
          // Refetch series data on update notification
          await refreshSeriesData(update.paneId, update.seriesId);
        },
      }
    )
  : null;

// Lazy loading composable
const lazyLoadingState = props.lazyLoading
  ? useLazyLoading({
      chart,
      seriesConfigs,
      onRequestHistory: (seriesId, paneId, beforeTime, direction, count) => {
        if (ws) {
          ws.requestHistory(paneId, seriesId, beforeTime, count);
        } else {
          // Use REST API for history
          api.getHistory(props.chartId, paneId, seriesId, beforeTime, count)
            .then((response) => {
              mergeHistoryData(seriesId, response.data, direction);
              lazyLoadingState?.handleHistoryResponse(
                seriesId,
                direction,
                response.hasMoreBefore,
                response.hasMoreAfter
              );
            })
            .catch((err) => {
              error.value = err instanceof Error ? err.message : 'Failed to load history';
              emit('error', err instanceof Error ? err : new Error(String(err)));
            });
        }
      },
    })
  : null;

// Provide chart instance to child components
provide('chart', chart);
provide('seriesMap', seriesMap);

/**
 * Create and initialize the chart.
 */
function initializeChart(): void {
  if (!containerRef.value || chart.value) return;

  const chartOptions = {
    width: containerRef.value.clientWidth,
    height: props.options?.height || 400,
    ...props.options,
  };

  chart.value = createChart(containerRef.value, chartOptions);

  // Subscribe to events and store unsubscribe functions
  unsubscribeCrosshairMove = chart.value.subscribeCrosshairMove((params) => {
    emit('crosshairMove', params);
  });

  unsubscribeClick = chart.value.subscribeClick((params) => {
    emit('click', params);
  });

  unsubscribeVisibleRangeChange = chart.value.timeScale().subscribeVisibleLogicalRangeChange((range) => {
    emit('visibleTimeRangeChange', range);
  });

  isInitialized.value = true;
  emit('ready', chart.value);
}

/**
 * Create a series on the chart.
 */
function createSeries(config: SeriesConfig): ISeriesApi<SeriesType> | null {
  if (!chart.value) return null;

  const seriesId = config.seriesId || config.name || `series_${seriesMap.value.size}`;
  let series: ISeriesApi<SeriesType>;

  // Create series based on type
  const seriesType = config.seriesType.toLowerCase();
  switch (seriesType) {
    case 'line':
      series = chart.value.addSeries({ type: 'Line', ...config.options });
      break;
    case 'area':
      series = chart.value.addSeries({ type: 'Area', ...config.options });
      break;
    case 'candlestick':
      series = chart.value.addSeries({ type: 'Candlestick', ...config.options });
      break;
    case 'bar':
      series = chart.value.addSeries({ type: 'Bar', ...config.options });
      break;
    case 'histogram':
      series = chart.value.addSeries({ type: 'Histogram', ...config.options });
      break;
    case 'baseline':
      series = chart.value.addSeries({ type: 'Baseline', ...config.options });
      break;
    default:
      console.warn(`Unknown series type: ${config.seriesType}`);
      return null;
  }

  // Set data if available
  if (config.data?.length) {
    series.setData(config.data as Parameters<typeof series.setData>[0]);
  }

  seriesMap.value.set(seriesId, series);
  // Trigger reactivity for shallowRef Map mutation
  triggerRef(seriesMap);
  return series;
}

/**
 * Remove a series from the chart.
 */
function removeSeries(seriesId: string): void {
  const series = seriesMap.value.get(seriesId);
  if (series && chart.value) {
    chart.value.removeSeries(series);
    seriesMap.value.delete(seriesId);
    // Trigger reactivity for shallowRef Map mutation
    triggerRef(seriesMap);
  }
}

/**
 * Update series data.
 */
function updateSeriesData(seriesId: string, data: DataPoint[]): void {
  const series = seriesMap.value.get(seriesId);
  if (series) {
    series.setData(data as Parameters<typeof series.setData>[0]);

    // Update config
    const configIndex = seriesConfigs.value.findIndex(
      (c) => (c.seriesId || c.name) === seriesId
    );
    if (configIndex >= 0) {
      seriesConfigs.value[configIndex].data = data;
    }

    emit('dataLoaded', seriesId, data.length);

    if (props.autoFit) {
      chart.value?.timeScale().fitContent();
    }
  }
}

/**
 * Merge history data into existing series data.
 */
function mergeHistoryData(
  seriesId: string,
  newData: DataPoint[],
  direction: 'before' | 'after'
): void {
  const configIndex = seriesConfigs.value.findIndex(
    (c) => (c.seriesId || c.name) === seriesId
  );
  if (configIndex < 0) return;

  const config = seriesConfigs.value[configIndex];
  let mergedData: DataPoint[];

  if (direction === 'before') {
    mergedData = [...newData, ...config.data];
  } else {
    mergedData = [...config.data, ...newData];
  }

  // Sort by time
  mergedData.sort((a, b) => {
    const timeA = typeof a.time === 'number' ? a.time : Date.parse(String(a.time));
    const timeB = typeof b.time === 'number' ? b.time : Date.parse(String(b.time));
    return timeA - timeB;
  });

  // Remove duplicates
  const seen = new Set<number | string>();
  mergedData = mergedData.filter((d) => {
    if (seen.has(d.time)) return false;
    seen.add(d.time);
    return true;
  });

  updateSeriesData(seriesId, mergedData);
}

/**
 * Refresh series data from API.
 */
async function refreshSeriesData(paneId: number, seriesId: string): Promise<void> {
  try {
    const response = await api.getSeriesData(props.chartId, paneId, seriesId);
    updateSeriesData(seriesId, response.data);

    // Update lazy loading state if chunked
    if (response.chunked && lazyLoadingState) {
      const configIndex = seriesConfigs.value.findIndex(
        (c) => (c.seriesId || c.name) === seriesId
      );
      if (configIndex >= 0) {
        seriesConfigs.value[configIndex].lazyLoading = {
          enabled: true,
          chunkSize: response.chunkInfo?.count || 500,
          hasMoreBefore: response.hasMoreBefore,
          hasMoreAfter: response.hasMoreAfter,
          chunkInfo: response.chunkInfo,
        };
      }
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to refresh series data';
    emit('error', err instanceof Error ? err : new Error(String(err)));
  }
}

/**
 * Initialize all series from props.
 */
function initializeSeries(): void {
  if (!chart.value) return;

  // Clear existing series
  seriesMap.value.forEach((_, seriesId) => removeSeries(seriesId));

  // Create new series
  seriesConfigs.value.forEach((config) => {
    createSeries(config);
  });

  if (props.autoFit && seriesConfigs.value.some((c) => c.data?.length)) {
    chart.value.timeScale().fitContent();
  }
}

/**
 * Handle resize.
 */
function handleResize(): void {
  if (chart.value && containerRef.value) {
    chart.value.resize(containerRef.value.clientWidth, props.options?.height || 400);
  }
}

// Watch for option changes using JSON comparison to avoid unnecessary deep watching
// This is more performant than deep: true for large option objects
let lastOptionsJson = '';
watch(
  () => JSON.stringify(props.options),
  (newOptionsJson) => {
    if (newOptionsJson !== lastOptionsJson) {
      lastOptionsJson = newOptionsJson;
      if (chart.value && props.options) {
        chart.value.applyOptions(props.options);
      }
    }
  }
);

// Watch for series changes using JSON comparison
// Avoids unnecessary re-renders when series data hasn't actually changed
let lastSeriesJson = '';
watch(
  () => JSON.stringify(props.series),
  (newSeriesJson) => {
    if (newSeriesJson !== lastSeriesJson) {
      lastSeriesJson = newSeriesJson;
      seriesConfigs.value = [...props.series];
      initializeSeries();
    }
  }
);

// Lifecycle hooks
onMounted(() => {
  initializeChart();
  initializeSeries();

  // Auto-connect to WebSocket if enabled
  if (props.autoConnect && ws) {
    ws.connect();
  }

  // Set up resize observer
  if (containerRef.value) {
    resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(containerRef.value);
  }
});

onUnmounted(() => {
  // Unsubscribe from chart events
  if (unsubscribeCrosshairMove) {
    unsubscribeCrosshairMove();
    unsubscribeCrosshairMove = null;
  }
  if (unsubscribeClick) {
    unsubscribeClick();
    unsubscribeClick = null;
  }
  if (unsubscribeVisibleRangeChange) {
    unsubscribeVisibleRangeChange();
    unsubscribeVisibleRangeChange = null;
  }

  // Disconnect resize observer
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }

  // Remove chart
  if (chart.value) {
    chart.value.remove();
    chart.value = null;
  }
  seriesMap.value.clear();
});

// Expose public API
defineExpose({
  /** Chart API instance */
  chart,
  /** Map of series */
  seriesMap,
  /** Create a new series */
  createSeries,
  /** Remove a series */
  removeSeries,
  /** Update series data */
  updateSeriesData,
  /** Merge history data */
  mergeHistoryData,
  /** Refresh series from API */
  refreshSeriesData,
  /** API client */
  api,
  /** WebSocket client */
  ws,
  /** Loading state */
  isLoading: computed(() => api.isLoading.value || (lazyLoadingState?.isLoading.value ?? false)),
  /** Error state */
  error: computed(() => api.error.value || error.value),
});
</script>

<template>
  <div
    ref="containerRef"
    class="lightweight-chart-container"
    :class="containerClass"
  >
    <slot />
  </div>
</template>

<style scoped>
.lightweight-chart-container {
  width: 100%;
  position: relative;
}
</style>
