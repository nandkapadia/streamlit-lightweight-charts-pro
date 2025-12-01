<!--
  Dashboard.vue - Multi-Chart Trading Dashboard

  Demonstrates a complete trading dashboard with:
  - Main price chart with volume
  - Technical indicator chart (RSI)
  - Multiple symbol comparison
  - Synchronized crosshairs
  - Real-time updates
-->
<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { createChart, type IChartApi, type ISeriesApi, CrosshairMode } from 'lightweight-charts';

// Types
interface ChartInstance {
  container: HTMLDivElement | null;
  chart: IChartApi | null;
  series: ISeriesApi<'Candlestick' | 'Line' | 'Histogram'> | null;
}

// Refs for main chart
const mainChartContainer = ref<HTMLDivElement | null>(null);
const mainChart = ref<IChartApi | null>(null);
const mainSeries = ref<ISeriesApi<'Candlestick'> | null>(null);
const volumeSeries = ref<ISeriesApi<'Histogram'> | null>(null);

// Refs for RSI chart
const rsiChartContainer = ref<HTMLDivElement | null>(null);
const rsiChart = ref<IChartApi | null>(null);
const rsiSeries = ref<ISeriesApi<'Line'> | null>(null);

// Refs for comparison chart
const compChartContainer = ref<HTMLDivElement | null>(null);
const compChart = ref<IChartApi | null>(null);
const compSeries1 = ref<ISeriesApi<'Line'> | null>(null);
const compSeries2 = ref<ISeriesApi<'Line'> | null>(null);

// State
const selectedSymbol = ref('AAPL');
const symbols = ['AAPL', 'GOOGL', 'MSFT', 'AMZN'];
const isLoading = ref(false);

// Crosshair sync state
const syncedTime = ref<number | null>(null);

// Chart theme
const chartTheme = {
  layout: {
    background: { type: 'solid' as const, color: '#1e222d' },
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
  crosshair: {
    mode: CrosshairMode.Normal,
  },
};

// Generate sample data for a symbol
function generateData(symbol: string, count: number = 200) {
  const priceData = [];
  const volumeData = [];
  const rsiData = [];

  // Different base prices for different symbols
  const basePrices: Record<string, number> = {
    AAPL: 175,
    GOOGL: 140,
    MSFT: 380,
    AMZN: 180,
  };

  let baseTime = Math.floor(Date.now() / 1000) - count * 86400;
  let price = basePrices[symbol] || 100;

  for (let i = 0; i < count; i++) {
    const change = (Math.random() - 0.5) * (price * 0.02);
    price = Math.max(10, price + change);

    const spread = price * 0.01;
    const open = price + (Math.random() - 0.5) * spread;
    const close = price + (Math.random() - 0.5) * spread;
    const high = Math.max(open, close) + Math.random() * spread;
    const low = Math.min(open, close) - Math.random() * spread;
    const volume = Math.floor(1000000 + Math.random() * 5000000);

    const time = baseTime + i * 86400;

    priceData.push({
      time,
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
    });

    volumeData.push({
      time,
      value: volume,
      color: close >= open ? 'rgba(38, 166, 154, 0.5)' : 'rgba(239, 83, 80, 0.5)',
    });

    // Simulate RSI (14-period)
    rsiData.push({
      time,
      value: 30 + Math.random() * 40 + (close > open ? 10 : -10),
    });
  }

  return { priceData, volumeData, rsiData };
}

// Generate comparison data (normalized to percentage)
function generateComparisonData(count: number = 200) {
  const data1 = [];
  const data2 = [];

  let baseTime = Math.floor(Date.now() / 1000) - count * 86400;
  let price1 = 100;
  let price2 = 100;

  for (let i = 0; i < count; i++) {
    price1 = Math.max(80, price1 + (Math.random() - 0.48) * 2);
    price2 = Math.max(80, price2 + (Math.random() - 0.52) * 2);

    const time = baseTime + i * 86400;

    data1.push({ time, value: Math.round(price1 * 100) / 100 });
    data2.push({ time, value: Math.round(price2 * 100) / 100 });
  }

  return { data1, data2 };
}

// Sync crosshair across charts
function setupCrosshairSync() {
  const charts = [mainChart.value, rsiChart.value, compChart.value].filter(Boolean);

  charts.forEach((chart) => {
    if (!chart) return;

    chart.subscribeCrosshairMove((param) => {
      if (!param.time) return;

      syncedTime.value = param.time as number;

      // Sync to other charts
      charts.forEach((otherChart) => {
        if (otherChart && otherChart !== chart) {
          otherChart.setCrosshairPosition(
            0, // price (will be calculated)
            param.time!,
            otherChart.series()[0]
          );
        }
      });
    });
  });
}

// Load symbol data
async function loadSymbol(symbol: string) {
  isLoading.value = true;
  selectedSymbol.value = symbol;

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  const { priceData, volumeData, rsiData } = generateData(symbol);

  if (mainSeries.value && volumeSeries.value) {
    mainSeries.value.setData(priceData);
    volumeSeries.value.setData(volumeData);
    mainChart.value?.timeScale().fitContent();
  }

  if (rsiSeries.value) {
    rsiSeries.value.setData(rsiData);
    rsiChart.value?.timeScale().fitContent();
  }

  isLoading.value = false;
}

// Initialize all charts
function initializeCharts() {
  // Main price chart
  if (mainChartContainer.value) {
    mainChart.value = createChart(mainChartContainer.value, {
      ...chartTheme,
      width: mainChartContainer.value.clientWidth,
      height: 300,
    });

    mainSeries.value = mainChart.value.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    volumeSeries.value = mainChart.value.addHistogramSeries({
      color: '#26a69a',
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    });

    volumeSeries.value.priceScale().applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });
  }

  // RSI chart
  if (rsiChartContainer.value) {
    rsiChart.value = createChart(rsiChartContainer.value, {
      ...chartTheme,
      width: rsiChartContainer.value.clientWidth,
      height: 150,
    });

    rsiSeries.value = rsiChart.value.addLineSeries({
      color: '#f0b90b',
      lineWidth: 2,
    });

    // Add RSI levels
    rsiSeries.value.createPriceLine({
      price: 70,
      color: '#ef5350',
      lineWidth: 1,
      lineStyle: 2,
      title: 'Overbought',
    });

    rsiSeries.value.createPriceLine({
      price: 30,
      color: '#26a69a',
      lineWidth: 1,
      lineStyle: 2,
      title: 'Oversold',
    });
  }

  // Comparison chart
  if (compChartContainer.value) {
    compChart.value = createChart(compChartContainer.value, {
      ...chartTheme,
      width: compChartContainer.value.clientWidth,
      height: 200,
    });

    compSeries1.value = compChart.value.addLineSeries({
      color: '#26a69a',
      lineWidth: 2,
      title: 'AAPL',
    });

    compSeries2.value = compChart.value.addLineSeries({
      color: '#f0b90b',
      lineWidth: 2,
      title: 'GOOGL',
    });

    const { data1, data2 } = generateComparisonData();
    compSeries1.value.setData(data1);
    compSeries2.value.setData(data2);
    compChart.value.timeScale().fitContent();
  }

  // Load initial data
  loadSymbol(selectedSymbol.value);

  // Setup crosshair sync
  setTimeout(setupCrosshairSync, 100);
}

// Handle resize
function handleResize() {
  const containers = [
    { container: mainChartContainer.value, chart: mainChart.value },
    { container: rsiChartContainer.value, chart: rsiChart.value },
    { container: compChartContainer.value, chart: compChart.value },
  ];

  containers.forEach(({ container, chart }) => {
    if (container && chart) {
      chart.applyOptions({ width: container.clientWidth });
    }
  });
}

onMounted(() => {
  initializeCharts();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  mainChart.value?.remove();
  rsiChart.value?.remove();
  compChart.value?.remove();
});
</script>

<template>
  <div class="dashboard">
    <header class="dashboard-header">
      <h1>Trading Dashboard</h1>
      <div class="symbol-selector">
        <button
          v-for="symbol in symbols"
          :key="symbol"
          @click="loadSymbol(symbol)"
          :class="{ active: selectedSymbol === symbol }"
          :disabled="isLoading"
        >
          {{ symbol }}
        </button>
      </div>
    </header>

    <div class="dashboard-grid">
      <!-- Main Chart -->
      <div class="chart-card main-chart">
        <div class="card-header">
          <span class="card-title">{{ selectedSymbol }} - Price & Volume</span>
          <span v-if="isLoading" class="loading-badge">Loading...</span>
        </div>
        <div ref="mainChartContainer" class="chart-container" />
      </div>

      <!-- RSI Chart -->
      <div class="chart-card rsi-chart">
        <div class="card-header">
          <span class="card-title">RSI (14)</span>
        </div>
        <div ref="rsiChartContainer" class="chart-container" />
      </div>

      <!-- Comparison Chart -->
      <div class="chart-card comparison-chart">
        <div class="card-header">
          <span class="card-title">Performance Comparison</span>
          <div class="legend">
            <span class="legend-item">
              <span class="dot" style="background: #26a69a"></span>
              AAPL
            </span>
            <span class="legend-item">
              <span class="dot" style="background: #f0b90b"></span>
              GOOGL
            </span>
          </div>
        </div>
        <div ref="compChartContainer" class="chart-container" />
      </div>

      <!-- Stats Panel -->
      <div class="chart-card stats-panel">
        <div class="card-header">
          <span class="card-title">Quick Stats</span>
        </div>
        <div class="stats-content">
          <div class="stat-row">
            <span class="stat-label">Symbol</span>
            <span class="stat-value">{{ selectedSymbol }}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Crosshair Time</span>
            <span class="stat-value">
              {{ syncedTime ? new Date(syncedTime * 1000).toLocaleDateString() : '-' }}
            </span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Charts</span>
            <span class="stat-value">3</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Sync</span>
            <span class="stat-value status-ok">Active</span>
          </div>
        </div>
      </div>
    </div>

    <footer class="dashboard-footer">
      <p>Crosshair synced across all charts • Click a symbol to load data</p>
    </footer>
  </div>
</template>

<style scoped>
.dashboard {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  max-width: 1400px;
  margin: 0 auto;
  padding: 1rem;
  background: #131722;
  min-height: 100vh;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.dashboard-header h1 {
  margin: 0;
  color: #d1d4dc;
  font-size: 1.5rem;
}

.symbol-selector {
  display: flex;
  gap: 0.5rem;
}

.symbol-selector button {
  padding: 0.5rem 1rem;
  background: #2b2f3a;
  color: #808a9d;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.symbol-selector button:hover:not(:disabled) {
  background: #363c4e;
  color: #d1d4dc;
}

.symbol-selector button.active {
  background: #26a69a;
  color: white;
}

.symbol-selector button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  grid-template-rows: auto auto auto;
  gap: 1rem;
}

@media (max-width: 900px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}

.chart-card {
  background: #1e222d;
  border-radius: 8px;
  overflow: hidden;
}

.main-chart {
  grid-column: 1 / 2;
  grid-row: 1 / 2;
}

.rsi-chart {
  grid-column: 1 / 2;
  grid-row: 2 / 3;
}

.comparison-chart {
  grid-column: 1 / 2;
  grid-row: 3 / 4;
}

.stats-panel {
  grid-column: 2 / 3;
  grid-row: 1 / 4;
}

@media (max-width: 900px) {
  .main-chart,
  .rsi-chart,
  .comparison-chart,
  .stats-panel {
    grid-column: 1;
    grid-row: auto;
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #2b2f3a;
}

.card-title {
  color: #d1d4dc;
  font-weight: 500;
  font-size: 0.875rem;
}

.loading-badge {
  padding: 0.25rem 0.5rem;
  background: #f0b90b;
  color: #1e222d;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.legend {
  display: flex;
  gap: 1rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: #808a9d;
  font-size: 0.75rem;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.chart-container {
  width: 100%;
}

.main-chart .chart-container {
  height: 300px;
}

.rsi-chart .chart-container {
  height: 150px;
}

.comparison-chart .chart-container {
  height: 200px;
}

.stats-content {
  padding: 1rem;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 1px solid #2b2f3a;
}

.stat-row:last-child {
  border-bottom: none;
}

.stat-label {
  color: #808a9d;
  font-size: 0.875rem;
}

.stat-value {
  color: #d1d4dc;
  font-weight: 500;
  font-size: 0.875rem;
}

.status-ok {
  color: #26a69a;
}

.dashboard-footer {
  margin-top: 1rem;
  text-align: center;
}

.dashboard-footer p {
  color: #808a9d;
  font-size: 0.75rem;
  margin: 0;
}
</style>
