<!--
  StreamingData.vue - Real-time Streaming Data Example

  Demonstrates streaming real-time data:
  - Simulated WebSocket data stream
  - Live candlestick updates
  - Real-time volume updates
  - Auto-scroll to latest data
-->
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { createChart, type IChartApi, type ISeriesApi } from 'lightweight-charts';

// Refs
const chartContainer = ref<HTMLDivElement | null>(null);
const chart = ref<IChartApi | null>(null);
const candlestickSeries = ref<ISeriesApi<'Candlestick'> | null>(null);
const volumeSeries = ref<ISeriesApi<'Histogram'> | null>(null);

// State
const isStreaming = ref(false);
const updateCount = ref(0);
const lastPrice = ref(0);
const priceChange = ref(0);
const currentCandle = ref<{
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
} | null>(null);

let streamInterval: ReturnType<typeof setInterval> | null = null;
let basePrice = 100;

// Computed
const priceChangeClass = computed(() => {
  if (priceChange.value > 0) return 'positive';
  if (priceChange.value < 0) return 'negative';
  return '';
});

// Generate initial historical data
function generateHistoricalData(count: number) {
  const priceData = [];
  const volumeData = [];

  // Start from count days ago
  let time = Math.floor(Date.now() / 1000) - count * 60; // 1-minute candles
  let price = basePrice;

  for (let i = 0; i < count; i++) {
    const change = (Math.random() - 0.5) * 2;
    price = Math.max(50, price + change);

    const spread = price * 0.01;
    const open = price + (Math.random() - 0.5) * spread;
    const close = price + (Math.random() - 0.5) * spread;
    const high = Math.max(open, close) + Math.random() * spread;
    const low = Math.min(open, close) - Math.random() * spread;
    const volume = Math.floor(1000 + Math.random() * 5000);

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

    time += 60; // 1-minute intervals
    basePrice = price;
  }

  return { priceData, volumeData };
}

// Simulate streaming tick
function simulateTick() {
  if (!candlestickSeries.value || !volumeSeries.value || !chart.value) return;

  const now = Math.floor(Date.now() / 1000);
  const candleTime = Math.floor(now / 60) * 60; // Round to minute

  // Simulate price movement
  const tickChange = (Math.random() - 0.5) * 0.5;
  const newPrice = Math.max(50, basePrice + tickChange);
  const roundedPrice = Math.round(newPrice * 100) / 100;

  priceChange.value = roundedPrice - lastPrice.value;
  lastPrice.value = roundedPrice;
  basePrice = newPrice;
  updateCount.value++;

  // Check if we need a new candle or update existing
  if (!currentCandle.value || currentCandle.value.time !== candleTime) {
    // New candle
    currentCandle.value = {
      time: candleTime,
      open: roundedPrice,
      high: roundedPrice,
      low: roundedPrice,
      close: roundedPrice,
    };

    // Add volume for new candle
    volumeSeries.value.update({
      time: candleTime,
      value: Math.floor(1000 + Math.random() * 2000),
      color: 'rgba(38, 166, 154, 0.5)',
    });
  } else {
    // Update existing candle
    currentCandle.value = {
      ...currentCandle.value,
      high: Math.max(currentCandle.value.high, roundedPrice),
      low: Math.min(currentCandle.value.low, roundedPrice),
      close: roundedPrice,
    };

    // Update volume color based on candle direction
    const color =
      currentCandle.value.close >= currentCandle.value.open
        ? 'rgba(38, 166, 154, 0.5)'
        : 'rgba(239, 83, 80, 0.5)';

    volumeSeries.value.update({
      time: candleTime,
      value: Math.floor(1000 + Math.random() * 2000),
      color,
    });
  }

  // Update candlestick series
  candlestickSeries.value.update(currentCandle.value);
}

// Start streaming
function startStreaming() {
  if (isStreaming.value) return;

  isStreaming.value = true;
  streamInterval = setInterval(simulateTick, 200); // 5 updates per second
}

// Stop streaming
function stopStreaming() {
  if (!isStreaming.value) return;

  isStreaming.value = false;
  if (streamInterval) {
    clearInterval(streamInterval);
    streamInterval = null;
  }
}

// Toggle streaming
function toggleStreaming() {
  if (isStreaming.value) {
    stopStreaming();
  } else {
    startStreaming();
  }
}

// Initialize chart
function initializeChart() {
  if (!chartContainer.value) return;

  chart.value = createChart(chartContainer.value, {
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
      secondsVisible: true,
      rightOffset: 5, // Leave space for new candles
    },
    rightPriceScale: {
      borderColor: '#2b2f3a',
    },
    crosshair: {
      mode: 0,
    },
  });

  candlestickSeries.value = chart.value.addCandlestickSeries({
    upColor: '#26a69a',
    downColor: '#ef5350',
    borderVisible: false,
    wickUpColor: '#26a69a',
    wickDownColor: '#ef5350',
  });

  volumeSeries.value = chart.value.addHistogramSeries({
    color: '#26a69a',
    priceFormat: { type: 'volume' },
    priceScaleId: 'volume',
  });

  volumeSeries.value.priceScale().applyOptions({
    scaleMargins: { top: 0.8, bottom: 0 },
  });

  // Load historical data
  const { priceData, volumeData } = generateHistoricalData(100);
  candlestickSeries.value.setData(priceData);
  volumeSeries.value.setData(volumeData);

  // Set initial values
  const lastCandle = priceData[priceData.length - 1];
  lastPrice.value = lastCandle.close;
  currentCandle.value = null;

  chart.value.timeScale().scrollToRealTime();
}

// Handle resize
function handleResize() {
  if (chart.value && chartContainer.value) {
    chart.value.applyOptions({ width: chartContainer.value.clientWidth });
  }
}

onMounted(() => {
  initializeChart();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  stopStreaming();
  window.removeEventListener('resize', handleResize);
  chart.value?.remove();
});
</script>

<template>
  <div class="streaming-demo">
    <header>
      <h1>Real-time Streaming Data</h1>
      <p>Simulated live price feed with 1-minute candles</p>
    </header>

    <div class="ticker">
      <div class="price" :class="priceChangeClass">
        ${{ lastPrice.toFixed(2) }}
        <span class="change">
          {{ priceChange >= 0 ? '+' : '' }}{{ priceChange.toFixed(2) }}
        </span>
      </div>
      <div class="stats">
        <span>Updates: {{ updateCount }}</span>
        <span>Status: {{ isStreaming ? 'Live' : 'Paused' }}</span>
      </div>
    </div>

    <div class="controls">
      <button
        @click="toggleStreaming"
        :class="{ active: isStreaming }"
      >
        {{ isStreaming ? '⏸ Pause' : '▶ Start' }} Stream
      </button>
    </div>

    <div class="chart-wrapper">
      <div v-if="isStreaming" class="live-indicator">
        <span class="live-dot"></span>
        LIVE
      </div>
      <div ref="chartContainer" class="chart-container" />
    </div>

    <div class="info">
      <h3>How it works</h3>
      <ul>
        <li>Simulates a real-time price feed with 5 ticks per second</li>
        <li>Price ticks aggregate into 1-minute candles</li>
        <li>Each tick updates the current candle's high/low/close</li>
        <li>New candle starts at each minute boundary</li>
        <li>Volume updates with each tick, color changes with candle direction</li>
      </ul>

      <h3>In Production</h3>
      <ul>
        <li>Replace <code>simulateTick()</code> with WebSocket message handler</li>
        <li>Use <code>useChartWebSocket</code> composable for connection management</li>
        <li>Handle reconnection and data gaps</li>
        <li>Consider buffering for high-frequency data</li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.streaming-demo {
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

.ticker {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #1e222d;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.price {
  font-size: 2rem;
  font-weight: 700;
  color: #d1d4dc;
}

.price.positive {
  color: #26a69a;
}

.price.negative {
  color: #ef5350;
}

.change {
  font-size: 1rem;
  margin-left: 0.5rem;
}

.stats {
  display: flex;
  gap: 2rem;
  color: #808a9d;
  font-size: 0.875rem;
}

.controls {
  margin-bottom: 1rem;
}

.controls button {
  padding: 0.75rem 1.5rem;
  background: #26a69a;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
}

.controls button:hover {
  background: #2bbbad;
}

.controls button.active {
  background: #ef5350;
}

.controls button.active:hover {
  background: #f44336;
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

.live-indicator {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(239, 83, 80, 0.9);
  color: white;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  z-index: 10;
}

.live-dot {
  width: 8px;
  height: 8px;
  background: white;
  border-radius: 50%;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.info {
  background: #f5f5f5;
  padding: 1rem;
  border-radius: 8px;
}

.info h3 {
  margin: 0 0 0.5rem;
  font-size: 1rem;
}

.info h3:not(:first-child) {
  margin-top: 1rem;
}

.info ul {
  margin: 0;
  padding-left: 1.5rem;
}

.info li {
  margin-bottom: 0.25rem;
  color: #555;
}

.info code {
  background: #e8e8e8;
  padding: 0.125rem 0.25rem;
  border-radius: 3px;
  font-size: 0.875rem;
}
</style>
