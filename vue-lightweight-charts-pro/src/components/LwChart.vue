<script setup lang="ts">
/**
 * LwChart - Main chart component
 *
 * Provides a chart container with automatic sizing and context for child series components.
 *
 * @example Basic usage
 * ```vue
 * <LwChart :options="{ layout: { background: { color: '#1a1a1a' } } }">
 *   <LwSeries type="Candlestick" :data="ohlcData" />
 *   <LwSeries type="Band" :data="bandData" :options="bandOptions" />
 * </LwChart>
 * ```
 */
import { watch, onMounted, onUnmounted, ref, shallowRef } from 'vue';
import { createChart, type IChartApi, type DeepPartial, type ChartOptions, type Time } from 'lightweight-charts';
import { provideChartContext } from '../composables/useChartContext';

// ============================================================================
// Props
// ============================================================================

export interface LwChartProps {
  /** Chart options */
  options?: DeepPartial<ChartOptions>;
  /** Auto-resize to container */
  autoSize?: boolean;
  /** Fixed width (ignored if autoSize is true) */
  width?: number;
  /** Fixed height (ignored if autoSize is true) */
  height?: number;
}

const props = withDefaults(defineProps<LwChartProps>(), {
  autoSize: true,
  width: 800,
  height: 400,
});

// ============================================================================
// Emits
// ============================================================================

const emit = defineEmits<{
  /** Emitted when chart is ready */
  ready: [chart: IChartApi];
  /** Emitted on crosshair move */
  crosshairMove: [event: { time: Time | null; point: { x: number; y: number } | null }];
  /** Emitted on chart click */
  click: [event: { time: Time | null; point: { x: number; y: number } | null }];
}>();

// ============================================================================
// State
// ============================================================================

const containerRef = ref<HTMLElement>();
const chart = shallowRef<IChartApi | null>(null);
const isReady = ref(false);

let resizeObserver: ResizeObserver | null = null;

// ============================================================================
// Provide Context
// ============================================================================

provideChartContext(chart);

// ============================================================================
// Methods
// ============================================================================

/**
 * Initialize the chart
 */
const initChart = () => {
  if (!containerRef.value) return;

  const chartInstance = createChart(containerRef.value, {
    width: props.autoSize ? containerRef.value.clientWidth : props.width,
    height: props.autoSize ? containerRef.value.clientHeight : props.height,
    ...props.options,
  });

  // Subscribe to events
  chartInstance.subscribeCrosshairMove(param => {
    emit('crosshairMove', {
      time: param.time ?? null,
      point: param.point ?? null,
    });
  });

  chartInstance.subscribeClick(param => {
    emit('click', {
      time: param.time ?? null,
      point: param.point ?? null,
    });
  });

  chart.value = chartInstance;
  isReady.value = true;
  emit('ready', chartInstance);

  // Setup auto-resize
  if (props.autoSize && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(entries => {
      if (!chart.value || !entries.length) return;
      const { width, height } = entries[0].contentRect;
      chart.value.resize(width, height);
    });
    resizeObserver.observe(containerRef.value);
  }
};

/**
 * Cleanup the chart
 */
const cleanup = () => {
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
  if (chart.value) {
    chart.value.remove();
    chart.value = null;
  }
  isReady.value = false;
};

/**
 * Fit content to view
 */
const fitContent = () => {
  chart.value?.timeScale().fitContent();
};

/**
 * Resize chart manually
 */
const resize = (width: number, height: number) => {
  chart.value?.resize(width, height);
};

// ============================================================================
// Lifecycle
// ============================================================================

onMounted(() => {
  initChart();
});

onUnmounted(() => {
  cleanup();
});

// Watch options changes
watch(
  () => props.options,
  newOptions => {
    if (chart.value && newOptions) {
      chart.value.applyOptions(newOptions);
    }
  },
  { deep: true }
);

// ============================================================================
// Expose
// ============================================================================

defineExpose({
  chart,
  isReady,
  fitContent,
  resize,
});
</script>

<template>
  <div ref="containerRef" class="lw-chart">
    <slot v-if="isReady" />
  </div>
</template>

<style scoped>
.lw-chart {
  width: 100%;
  height: 100%;
  position: relative;
}
</style>
