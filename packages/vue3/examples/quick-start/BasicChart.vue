<!--
  BasicChart.vue - Minimal Vue3 chart example

  This example shows the simplest way to display a chart using
  the Vue3 composables and components.

  Prerequisites:
  1. Backend server running at http://localhost:8000
  2. Chart data available at the specified chart_id
-->
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { createChart, type IChartApi, type ISeriesApi } from 'lightweight-charts';
import { useChartApi } from '@lightweight-charts-pro/vue3';

// Props
const props = defineProps<{
  chartId?: string;
  baseUrl?: string;
}>();

// Defaults
const chartId = props.chartId ?? 'demo-chart';
const baseUrl = props.baseUrl ?? 'http://localhost:8000/api/charts';

// Refs
const chartContainer = ref<HTMLDivElement | null>(null);
const chart = ref<IChartApi | null>(null);
const series = ref<ISeriesApi<'Candlestick'> | null>(null);

// API composable
const { getChart, isLoading, error } = useChartApi({ baseUrl });

// Initialize chart
onMounted(async () => {
  if (!chartContainer.value) return;

  // Create chart instance
  chart.value = createChart(chartContainer.value, {
    width: chartContainer.value.clientWidth,
    height: 400,
    layout: {
      background: { type: 'solid', color: '#ffffff' },
      textColor: '#333',
    },
    grid: {
      vertLines: { color: '#f0f0f0' },
      horzLines: { color: '#f0f0f0' },
    },
  });

  // Add candlestick series
  series.value = chart.value.addCandlestickSeries({
    upColor: '#26a69a',
    downColor: '#ef5350',
    borderVisible: false,
    wickUpColor: '#26a69a',
    wickDownColor: '#ef5350',
  });

  try {
    // Fetch chart data from backend
    const data = await getChart(chartId);

    if (data?.panes) {
      // Get first series from first pane
      const firstPane = data.panes['0'];
      if (firstPane) {
        const firstSeriesKey = Object.keys(firstPane)[0];
        const seriesData = firstPane[firstSeriesKey];
        if (seriesData?.data) {
          series.value.setData(seriesData.data);
          chart.value.timeScale().fitContent();
        }
      }
    }
  } catch (err) {
    console.error('Failed to load chart data:', err);
  }
});
</script>

<template>
  <div class="chart-wrapper">
    <div v-if="isLoading" class="loading">
      Loading chart data...
    </div>
    <div v-else-if="error" class="error">
      Error: {{ error }}
    </div>
    <div ref="chartContainer" class="chart-container" />
  </div>
</template>

<style scoped>
.chart-wrapper {
  width: 100%;
  position: relative;
}

.chart-container {
  width: 100%;
  height: 400px;
}

.loading,
.error {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: 1rem 2rem;
  border-radius: 4px;
}

.loading {
  background: #f5f5f5;
  color: #666;
}

.error {
  background: #ffebee;
  color: #c62828;
}
</style>
