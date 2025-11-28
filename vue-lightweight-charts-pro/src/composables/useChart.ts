/**
 * @fileoverview useChart composable for creating and managing charts
 */

import { ref, shallowRef, onMounted, onUnmounted, watch, type Ref } from 'vue';
import { createChart, type IChartApi, type DeepPartial, type ChartOptions } from 'lightweight-charts';
import type { VueChartOptions } from '../types';

/**
 * Options for useChart composable
 */
export interface UseChartOptions extends VueChartOptions {
  /** Auto-resize chart when container size changes */
  autoSize?: boolean;
  /** Initial width (ignored if autoSize is true) */
  width?: number;
  /** Initial height (ignored if autoSize is true) */
  height?: number;
}

/**
 * Return type for useChart composable
 */
export interface UseChartReturn {
  /** Reference to the chart container element */
  containerRef: Ref<HTMLElement | undefined>;
  /** The chart API instance */
  chart: Ref<IChartApi | null>;
  /** Whether the chart is ready */
  isReady: Ref<boolean>;
  /** Manually resize the chart */
  resize: (width: number, height: number) => void;
  /** Fit content to view */
  fitContent: () => void;
  /** Get visible time range */
  getVisibleRange: () => { from: number; to: number } | null;
  /** Set visible time range */
  setVisibleRange: (from: number, to: number) => void;
}

/**
 * Composable for creating and managing a Lightweight Chart
 *
 * @param options - Chart configuration options
 * @returns Chart utilities and references
 *
 * @example
 * ```vue
 * <script setup>
 * import { useChart } from 'vue-lightweight-charts-pro'
 *
 * const { containerRef, chart, isReady } = useChart({
 *   autoSize: true,
 *   layout: { background: { color: '#1a1a1a' } }
 * })
 * </script>
 *
 * <template>
 *   <div ref="containerRef" style="width: 100%; height: 400px" />
 * </template>
 * ```
 */
export function useChart(options: UseChartOptions = {}): UseChartReturn {
  const containerRef = ref<HTMLElement>();
  const chart = shallowRef<IChartApi | null>(null);
  const isReady = ref(false);

  const { autoSize = true, width = 800, height = 400, ...chartOptions } = options;

  let resizeObserver: ResizeObserver | null = null;

  /**
   * Initialize the chart
   */
  const initChart = () => {
    if (!containerRef.value) return;

    // Create chart instance
    const chartInstance = createChart(containerRef.value, {
      width: autoSize ? containerRef.value.clientWidth : width,
      height: autoSize ? containerRef.value.clientHeight : height,
      ...chartOptions,
    });

    chart.value = chartInstance;
    isReady.value = true;

    // Setup auto-resize if enabled
    if (autoSize && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(entries => {
        if (!chart.value || !entries.length) return;
        const { width: newWidth, height: newHeight } = entries[0].contentRect;
        chart.value.resize(newWidth, newHeight);
      });
      resizeObserver.observe(containerRef.value);
    }
  };

  /**
   * Cleanup the chart
   */
  const cleanupChart = () => {
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
   * Manually resize the chart
   */
  const resize = (newWidth: number, newHeight: number) => {
    if (chart.value) {
      chart.value.resize(newWidth, newHeight);
    }
  };

  /**
   * Fit content to view
   */
  const fitContent = () => {
    if (chart.value) {
      chart.value.timeScale().fitContent();
    }
  };

  /**
   * Get visible time range
   */
  const getVisibleRange = () => {
    if (!chart.value) return null;
    const range = chart.value.timeScale().getVisibleRange();
    if (!range) return null;
    return { from: range.from as number, to: range.to as number };
  };

  /**
   * Set visible time range
   */
  const setVisibleRange = (from: number, to: number) => {
    if (chart.value) {
      chart.value.timeScale().setVisibleRange({ from: from as any, to: to as any });
    }
  };

  // Lifecycle hooks
  onMounted(() => {
    initChart();
  });

  onUnmounted(() => {
    cleanupChart();
  });

  // Watch for options changes
  watch(
    () => chartOptions,
    newOptions => {
      if (chart.value && newOptions) {
        chart.value.applyOptions(newOptions as DeepPartial<ChartOptions>);
      }
    },
    { deep: true }
  );

  return {
    containerRef,
    chart,
    isReady,
    resize,
    fitContent,
    getVisibleRange,
    setVisibleRange,
  };
}
