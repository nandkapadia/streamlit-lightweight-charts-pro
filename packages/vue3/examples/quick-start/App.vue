<!--
  App.vue - Complete Vue3 application setup

  This example shows a complete application setup with:
  - Chart creation via API
  - Sample data generation
  - Error handling
  - Loading states

  Prerequisites:
  1. Backend server running at http://localhost:8000
-->
<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { createChart, type IChartApi, type ISeriesApi } from 'lightweight-charts';
import { useChartApi } from '@lightweight-charts-pro/vue3';

// Configuration
const BASE_URL = 'http://localhost:8000/api/charts';
const CHART_ID = `demo-chart-${Date.now()}`;

// Refs
const chartContainer = ref<HTMLDivElement | null>(null);
const chart = ref<IChartApi | null>(null);
const candlestickSeries = ref<ISeriesApi<'Candlestick'> | null>(null);
const volumeSeries = ref<ISeriesApi<'Histogram'> | null>(null);
const dataPoints = ref(100);
const initialized = ref(false);

// API composable
const { createChart: createChartApi, setSeriesData, isLoading, error, clearError } = useChartApi({
  baseUrl: BASE_URL,
});

// Generate sample OHLCV data
function generateOHLCV(points: number) {
  const data: Array<{
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }> = [];

  let baseTime = Math.floor(Date.now() / 1000) - points * 86400;
  let price = 100;

  for (let i = 0; i < points; i++) {
    const change = (Math.random() - 0.5) * 4;
    price = Math.max(50, price + change);

    const spread = price * 0.02;
    const open = price + (Math.random() - 0.5) * spread;
    const close = price + (Math.random() - 0.5) * spread;
    const high = Math.max(open, close) + Math.random() * spread;
    const low = Math.min(open, close) - Math.random() * spread;
    const volume = Math.floor(5000 + Math.random() * 10000);

    data.push({
      time: baseTime + i * 86400,
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
      volume,
    });
  }

  return data;
}

// Initialize chart
async function initializeChart() {
  if (!chartContainer.value) return;

  clearError();

  // Create lightweight-charts instance
  chart.value = createChart(chartContainer.value, {
    width: chartContainer.value.clientWidth,
    height: 500,
    layout: {
      background: { type: 'solid', color: '#1e222d' },
      textColor: '#d1d4dc',
    },
    grid: {
      vertLines: { color: '#2b2f3a' },
      horzLines: { color: '#2b2f3a' },
    },
    crosshair: {
      mode: 0, // Normal mode
    },
    rightPriceScale: {
      borderColor: '#2b2f3a',
    },
    timeScale: {
      borderColor: '#2b2f3a',
      timeVisible: true,
      secondsVisible: false,
    },
  });

  // Add candlestick series
  candlestickSeries.value = chart.value.addCandlestickSeries({
    upColor: '#26a69a',
    downColor: '#ef5350',
    borderVisible: false,
    wickUpColor: '#26a69a',
    wickDownColor: '#ef5350',
  });

  // Add volume series
  volumeSeries.value = chart.value.addHistogramSeries({
    color: '#26a69a',
    priceFormat: {
      type: 'volume',
    },
    priceScaleId: '',
  });

  volumeSeries.value.priceScale().applyOptions({
    scaleMargins: {
      top: 0.8,
      bottom: 0,
    },
  });

  try {
    // Create chart in backend
    await createChartApi(CHART_ID, { height: 500 });

    // Generate and set data
    const ohlcvData = generateOHLCV(dataPoints.value);

    // Set series data via API
    await setSeriesData(CHART_ID, 'price', {
      pane_id: 0,
      series_type: 'candlestick',
      data: ohlcvData,
    });

    // Set data locally
    candlestickSeries.value.setData(
      ohlcvData.map((d) => ({
        time: d.time,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
      }))
    );

    volumeSeries.value.setData(
      ohlcvData.map((d, i) => ({
        time: d.time,
        value: d.volume,
        color: d.close >= d.open ? 'rgba(38, 166, 154, 0.5)' : 'rgba(239, 83, 80, 0.5)',
      }))
    );

    chart.value.timeScale().fitContent();
    initialized.value = true;
  } catch (err) {
    console.error('Failed to initialize chart:', err);
  }
}

// Regenerate data
async function regenerateData() {
  if (!candlestickSeries.value || !volumeSeries.value) return;

  clearError();

  try {
    const ohlcvData = generateOHLCV(dataPoints.value);

    // Update backend
    await setSeriesData(CHART_ID, 'price', {
      pane_id: 0,
      series_type: 'candlestick',
      data: ohlcvData,
    });

    // Update local chart
    candlestickSeries.value.setData(
      ohlcvData.map((d) => ({
        time: d.time,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
      }))
    );

    volumeSeries.value.setData(
      ohlcvData.map((d) => ({
        time: d.time,
        value: d.volume,
        color: d.close >= d.open ? 'rgba(38, 166, 154, 0.5)' : 'rgba(239, 83, 80, 0.5)',
      }))
    );

    chart.value?.timeScale().fitContent();
  } catch (err) {
    console.error('Failed to regenerate data:', err);
  }
}

// Handle resize
function handleResize() {
  if (chart.value && chartContainer.value) {
    chart.value.applyOptions({
      width: chartContainer.value.clientWidth,
    });
  }
}

onMounted(() => {
  initializeChart();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  chart.value?.remove();
});
</script>

<template>
  <div class="app">
    <header class="header">
      <h1>Vue3 Lightweight Charts Demo</h1>
      <div class="controls">
        <label>
          Data Points:
          <input
            v-model.number="dataPoints"
            type="range"
            min="50"
            max="500"
            step="50"
          />
          <span>{{ dataPoints }}</span>
        </label>
        <button @click="regenerateData" :disabled="isLoading">
          {{ isLoading ? 'Loading...' : 'Regenerate Data' }}
        </button>
      </div>
    </header>

    <main class="main">
      <div v-if="error" class="error-banner">
        {{ error }}
        <button @click="clearError">Dismiss</button>
      </div>

      <div class="chart-wrapper">
        <div v-if="isLoading && !initialized" class="loading-overlay">
          <div class="spinner"></div>
          <span>Loading chart...</span>
        </div>
        <div ref="chartContainer" class="chart-container" />
      </div>

      <div class="info">
        <p>
          <strong>Chart ID:</strong> {{ CHART_ID }}
        </p>
        <p>
          <strong>Backend:</strong> {{ BASE_URL }}
        </p>
        <p>
          <strong>Status:</strong>
          <span :class="initialized ? 'status-ok' : 'status-pending'">
            {{ initialized ? 'Connected' : 'Initializing...' }}
          </span>
        </p>
      </div>
    </main>
  </div>
</template>

<style scoped>
.app {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.header h1 {
  margin: 0;
  font-size: 1.5rem;
  color: #333;
}

.controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.controls label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.controls input[type='range'] {
  width: 100px;
}

.controls button {
  padding: 0.5rem 1rem;
  background: #26a69a;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
}

.controls button:hover:not(:disabled) {
  background: #2bbbad;
}

.controls button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.main {
  background: #1e222d;
  border-radius: 8px;
  overflow: hidden;
}

.error-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: #ef5350;
  color: white;
}

.error-banner button {
  padding: 0.25rem 0.5rem;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.chart-wrapper {
  position: relative;
}

.chart-container {
  width: 100%;
  height: 500px;
}

.loading-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(30, 34, 45, 0.9);
  color: #d1d4dc;
  gap: 1rem;
  z-index: 10;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #2b2f3a;
  border-top-color: #26a69a;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.info {
  padding: 1rem;
  border-top: 1px solid #2b2f3a;
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
}

.info p {
  margin: 0;
  font-size: 0.75rem;
  color: #808a9d;
}

.info strong {
  color: #d1d4dc;
}

.status-ok {
  color: #26a69a;
}

.status-pending {
  color: #f0b90b;
}
</style>
