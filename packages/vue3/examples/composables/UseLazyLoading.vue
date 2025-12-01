<!--
  UseLazyLoading.vue - Infinite History Loading Example

  Demonstrates the useLazyLoading composable for:
  - Automatic history loading on scroll
  - Threshold-based trigger detection
  - Loading state management
  - Chunked data handling
-->
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { createChart, type IChartApi, type ISeriesApi } from 'lightweight-charts';
import { useLazyLoading, useChartApi } from '@lightweight-charts-pro/vue3';
import type { SeriesConfig } from '@lightweight-charts-pro/vue3';

// Configuration
const API_BASE_URL = 'http://localhost:8000/api/charts';
const CHART_ID = `lazy-demo-${Date.now()}`;
const INITIAL_POINTS = 200;
const TOTAL_POINTS = 2000;

// Refs
const chartContainer = ref<HTMLDivElement | null>(null);
const chartApi = ref<IChartApi | null>(null);
const candlestickSeries = ref<ISeriesApi<'Candlestick'> | null>(null);
const loadedPoints = ref(0);
const historyRequests = ref(0);

// Series configuration for lazy loading
const seriesConfigs = ref<SeriesConfig[]>([
  {
    seriesId: 'price',
    seriesType: 'candlestick',
    data: [],
    lazyLoading: {
      enabled: true,
      chunkSize: 500,
      hasMoreBefore: true,
      hasMoreAfter: false,
    },
  },
]);

// API composable
const { createChart: createChartApi, setSeriesData, getHistory } = useChartApi({
  baseUrl: API_BASE_URL,
});

// History request handler
async function handleHistoryRequest(
  seriesId: string,
  paneId: number,
  beforeTime: number,
  direction: 'before' | 'after',
  count: number
) {
  console.log(`History request: ${seriesId}, direction: ${direction}, before: ${beforeTime}, count: ${count}`);
  historyRequests.value++;

  try {
    const history = await getHistory(CHART_ID, paneId, seriesId, beforeTime, count);

    if (history.data && candlestickSeries.value) {
      // Get current data
      const currentData = [...(seriesConfigs.value[0].data || [])];

      if (direction === 'before') {
        // Prepend history data
        const newData = [...history.data, ...currentData];
        seriesConfigs.value[0].data = newData;

        // Update chart
        candlestickSeries.value.setData(newData as Parameters<typeof candlestickSeries.value.setData>[0]);
      } else {
        // Append history data
        const newData = [...currentData, ...history.data];
        seriesConfigs.value[0].data = newData;
        candlestickSeries.value.setData(newData as Parameters<typeof candlestickSeries.value.setData>[0]);
      }

      loadedPoints.value = seriesConfigs.value[0].data?.length || 0;

      // Update lazy loading state
      handleHistoryResponse(
        seriesId,
        direction,
        history.hasMoreBefore ?? false,
        history.hasMoreAfter ?? false
      );
    }
  } catch (err) {
    console.error('Failed to load history:', err);
  }
}

// Lazy loading composable
const {
  isLoading: lazyIsLoading,
  loadingStates,
  pendingRequests,
  handleHistoryResponse,
} = useLazyLoading({
  chart: chartApi as typeof chartApi,
  seriesConfigs,
  loadThreshold: 50,
  debounceMs: 200,
  onRequestHistory: handleHistoryRequest,
});

// Loading state display
const loadingStateText = computed(() => {
  const state = loadingStates.value.get('price');
  if (!state) return 'Not initialized';

  const parts = [];
  if (state.isLoadingBefore) parts.push('Loading older data...');
  if (state.isLoadingAfter) parts.push('Loading newer data...');
  if (state.lazyLoading.hasMoreBefore) parts.push('More history available');
  if (!state.lazyLoading.hasMoreBefore) parts.push('Beginning of data reached');

  return parts.join(' | ') || 'Ready';
});

// Generate sample data
function generateData(count: number, startTime?: number) {
  const data = [];
  let baseTime = startTime ?? Math.floor(Date.now() / 1000) - count * 86400;
  let price = 100;

  for (let i = 0; i < count; i++) {
    const change = (Math.random() - 0.5) * 4;
    price = Math.max(50, price + change);

    const spread = price * 0.02;
    const open = price + (Math.random() - 0.5) * spread;
    const close = price + (Math.random() - 0.5) * spread;

    data.push({
      time: baseTime + i * 86400,
      open: Math.round(open * 100) / 100,
      high: Math.round((Math.max(open, close) + Math.random() * spread) * 100) / 100,
      low: Math.round((Math.min(open, close) - Math.random() * spread) * 100) / 100,
      close: Math.round(close * 100) / 100,
    });
  }

  return data;
}

// Initialize chart
async function initializeChart() {
  if (!chartContainer.value) return;

  // Create chart
  chartApi.value = createChart(chartContainer.value, {
    width: chartContainer.value.clientWidth,
    height: 400,
    layout: {
      background: { type: 'solid', color: '#1e222d' },
      textColor: '#d1d4dc',
    },
    grid: {
      vertLines: { color: '#2b2f3a' },
      horzLines: { color: '#2b2f3a' },
    },
    timeScale: {
      borderColor: '#2b2f3a',
      timeVisible: true,
    },
    rightPriceScale: {
      borderColor: '#2b2f3a',
    },
  });

  // Add series
  candlestickSeries.value = chartApi.value.addCandlestickSeries({
    upColor: '#26a69a',
    downColor: '#ef5350',
    borderVisible: false,
    wickUpColor: '#26a69a',
    wickDownColor: '#ef5350',
  });

  try {
    // Create chart in backend
    await createChartApi(CHART_ID, { height: 400 });

    // Generate full dataset and store in backend
    const fullData = generateData(TOTAL_POINTS);
    await setSeriesData(CHART_ID, 'price', {
      pane_id: 0,
      series_type: 'candlestick',
      data: fullData,
    });

    // Load only initial chunk locally
    const initialData = fullData.slice(-INITIAL_POINTS);
    seriesConfigs.value[0].data = initialData;
    candlestickSeries.value.setData(initialData);
    loadedPoints.value = initialData.length;

    chartApi.value.timeScale().fitContent();
  } catch (err) {
    console.error('Failed to initialize:', err);
  }
}

// Handle resize
function handleResize() {
  if (chartApi.value && chartContainer.value) {
    chartApi.value.applyOptions({ width: chartContainer.value.clientWidth });
  }
}

// Reset chart
async function resetChart() {
  historyRequests.value = 0;

  if (candlestickSeries.value) {
    try {
      const fullData = generateData(TOTAL_POINTS);
      await setSeriesData(CHART_ID, 'price', {
        pane_id: 0,
        series_type: 'candlestick',
        data: fullData,
      });

      const initialData = fullData.slice(-INITIAL_POINTS);
      seriesConfigs.value[0].data = initialData;
      seriesConfigs.value[0].lazyLoading!.hasMoreBefore = true;
      candlestickSeries.value.setData(initialData);
      loadedPoints.value = initialData.length;

      chartApi.value?.timeScale().fitContent();
    } catch (err) {
      console.error('Failed to reset:', err);
    }
  }
}

onMounted(() => {
  initializeChart();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  chartApi.value?.remove();
});
</script>

<template>
  <div class="lazy-demo">
    <header>
      <h1>useLazyLoading Demo</h1>
      <p>Scroll left to load more historical data automatically</p>
    </header>

    <div class="stats-bar">
      <div class="stat">
        <span class="stat-label">Loaded Points</span>
        <span class="stat-value">{{ loadedPoints }} / {{ TOTAL_POINTS }}</span>
      </div>
      <div class="stat">
        <span class="stat-label">History Requests</span>
        <span class="stat-value">{{ historyRequests }}</span>
      </div>
      <div class="stat">
        <span class="stat-label">Pending Requests</span>
        <span class="stat-value">{{ pendingRequests.size }}</span>
      </div>
      <div class="stat">
        <span class="stat-label">Status</span>
        <span class="stat-value" :class="{ loading: lazyIsLoading }">
          {{ loadingStateText }}
        </span>
      </div>
    </div>

    <div class="controls">
      <button @click="resetChart">Reset Chart</button>
    </div>

    <div class="chart-wrapper">
      <div v-if="lazyIsLoading" class="loading-indicator">
        Loading more data...
      </div>
      <div ref="chartContainer" class="chart-container" />
    </div>

    <div class="instructions">
      <h3>How it works</h3>
      <ol>
        <li>The chart starts with {{ INITIAL_POINTS }} data points (most recent)</li>
        <li>Total dataset has {{ TOTAL_POINTS }} points stored in the backend</li>
        <li>Scroll/drag left to move towards older data</li>
        <li>When you get within 50 bars of the start, more data loads automatically</li>
        <li>Data loads in chunks of 500 points</li>
        <li>Loading stops when all {{ TOTAL_POINTS }} points are loaded</li>
      </ol>
    </div>

    <section class="api-reference">
      <h2>useLazyLoading Options</h2>
      <table>
        <thead>
          <tr>
            <th>Option</th>
            <th>Type</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>chart</code></td>
            <td>Ref&lt;IChartApi&gt;</td>
            <td>Chart API instance ref</td>
          </tr>
          <tr>
            <td><code>seriesConfigs</code></td>
            <td>Ref&lt;SeriesConfig[]&gt;</td>
            <td>Series configurations with lazy loading settings</td>
          </tr>
          <tr>
            <td><code>loadThreshold</code></td>
            <td>number</td>
            <td>How close to edge (in bars) to trigger loading (default: 50)</td>
          </tr>
          <tr>
            <td><code>debounceMs</code></td>
            <td>number</td>
            <td>Debounce delay in milliseconds (default: 300)</td>
          </tr>
          <tr>
            <td><code>onRequestHistory</code></td>
            <td>Function</td>
            <td>Callback to fetch history from backend</td>
          </tr>
        </tbody>
      </table>

      <h3>SeriesConfig.lazyLoading</h3>
      <table>
        <thead>
          <tr>
            <th>Property</th>
            <th>Type</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>enabled</code></td>
            <td>boolean</td>
            <td>Enable lazy loading for this series</td>
          </tr>
          <tr>
            <td><code>chunkSize</code></td>
            <td>number</td>
            <td>Number of points to request per chunk</td>
          </tr>
          <tr>
            <td><code>hasMoreBefore</code></td>
            <td>boolean</td>
            <td>Whether more historical data exists</td>
          </tr>
          <tr>
            <td><code>hasMoreAfter</code></td>
            <td>boolean</td>
            <td>Whether more future data exists</td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>

<style scoped>
.lazy-demo {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
}

header {
  margin-bottom: 1rem;
}

header h1 {
  margin: 0 0 0.5rem;
}

header p {
  color: #666;
  margin: 0;
}

.stats-bar {
  display: flex;
  gap: 2rem;
  padding: 1rem;
  background: #f5f5f5;
  border-radius: 8px;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-label {
  font-size: 0.75rem;
  color: #666;
  text-transform: uppercase;
}

.stat-value {
  font-size: 1rem;
  font-weight: 600;
  color: #333;
}

.stat-value.loading {
  color: #f0b90b;
}

.controls {
  margin-bottom: 1rem;
}

.controls button {
  padding: 0.5rem 1rem;
  background: #26a69a;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.controls button:hover {
  background: #2bbbad;
}

.chart-wrapper {
  position: relative;
  margin-bottom: 1rem;
}

.chart-container {
  width: 100%;
  height: 400px;
  background: #1e222d;
  border-radius: 8px;
}

.loading-indicator {
  position: absolute;
  top: 10px;
  left: 10px;
  padding: 0.5rem 1rem;
  background: rgba(240, 185, 11, 0.9);
  color: #1e222d;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
  z-index: 10;
}

.instructions {
  background: #e3f2fd;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 2rem;
}

.instructions h3 {
  margin: 0 0 0.5rem;
  color: #1565c0;
}

.instructions ol {
  margin: 0;
  padding-left: 1.5rem;
  color: #333;
}

.instructions li {
  margin-bottom: 0.25rem;
}

.api-reference h2,
.api-reference h3 {
  margin: 1.5rem 0 1rem;
}

.api-reference table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1rem;
}

.api-reference th,
.api-reference td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
}

.api-reference th {
  background: #f5f5f5;
  font-weight: 600;
}

.api-reference code {
  background: #e8e8e8;
  padding: 0.125rem 0.25rem;
  border-radius: 3px;
  font-size: 0.875rem;
}
</style>
