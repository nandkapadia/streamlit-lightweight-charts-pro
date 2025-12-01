<!--
  MultiPane.vue - Multi-Pane Chart Example

  Demonstrates creating charts with multiple panes:
  - Price chart in pane 0
  - Volume histogram in pane 1
  - Indicator in pane 2
  - Custom pane heights
-->
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import {
  createChart,
  type IChartApi,
  type ISeriesApi,
} from 'lightweight-charts';

// Refs
const chartContainer = ref<HTMLDivElement | null>(null);
const chart = ref<IChartApi | null>(null);
const priceSeries = ref<ISeriesApi<'Candlestick'> | null>(null);
const volumeSeries = ref<ISeriesApi<'Histogram'> | null>(null);
const rsiSeries = ref<ISeriesApi<'Line'> | null>(null);

// Generate sample data
function generateData(count: number) {
  const priceData = [];
  const volumeData = [];
  const rsiData = [];

  let baseTime = Math.floor(Date.now() / 1000) - count * 86400;
  let price = 100;

  for (let i = 0; i < count; i++) {
    const change = (Math.random() - 0.5) * 4;
    price = Math.max(50, price + change);

    const spread = price * 0.02;
    const open = price + (Math.random() - 0.5) * spread;
    const close = price + (Math.random() - 0.5) * spread;
    const high = Math.max(open, close) + Math.random() * spread;
    const low = Math.min(open, close) - Math.random() * spread;
    const volume = Math.floor(5000 + Math.random() * 10000);

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

    // Fake RSI calculation (random for demo)
    rsiData.push({
      time,
      value: 30 + Math.random() * 40,
    });
  }

  return { priceData, volumeData, rsiData };
}

// Initialize chart with multiple panes
function initializeChart() {
  if (!chartContainer.value) return;

  // Create chart
  chart.value = createChart(chartContainer.value, {
    width: chartContainer.value.clientWidth,
    height: 600,
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

  // Pane 0: Candlestick (main price chart)
  priceSeries.value = chart.value.addCandlestickSeries({
    upColor: '#26a69a',
    downColor: '#ef5350',
    borderVisible: false,
    wickUpColor: '#26a69a',
    wickDownColor: '#ef5350',
  });

  // Pane 1: Volume histogram
  volumeSeries.value = chart.value.addHistogramSeries({
    color: '#26a69a',
    priceFormat: {
      type: 'volume',
    },
    priceScaleId: 'volume',
  });

  // Configure volume pane
  volumeSeries.value.priceScale().applyOptions({
    scaleMargins: {
      top: 0.7,
      bottom: 0,
    },
  });

  // Pane 2: RSI indicator
  rsiSeries.value = chart.value.addLineSeries({
    color: '#f0b90b',
    lineWidth: 2,
    priceScaleId: 'rsi',
    priceFormat: {
      type: 'price',
      precision: 2,
      minMove: 0.01,
    },
  });

  // Configure RSI pane
  rsiSeries.value.priceScale().applyOptions({
    scaleMargins: {
      top: 0.85,
      bottom: 0,
    },
  });

  // Add RSI levels
  const rsiOverbought = {
    price: 70,
    color: '#ef5350',
    lineWidth: 1,
    lineStyle: 2, // Dashed
    axisLabelVisible: true,
    title: 'Overbought',
  };

  const rsiOversold = {
    price: 30,
    color: '#26a69a',
    lineWidth: 1,
    lineStyle: 2,
    axisLabelVisible: true,
    title: 'Oversold',
  };

  rsiSeries.value.createPriceLine(rsiOverbought);
  rsiSeries.value.createPriceLine(rsiOversold);

  // Generate and set data
  const { priceData, volumeData, rsiData } = generateData(200);

  priceSeries.value.setData(priceData);
  volumeSeries.value.setData(volumeData);
  rsiSeries.value.setData(rsiData);

  chart.value.timeScale().fitContent();
}

// Handle resize
function handleResize() {
  if (chart.value && chartContainer.value) {
    chart.value.applyOptions({ width: chartContainer.value.clientWidth });
  }
}

// Regenerate data
function regenerateData() {
  if (!priceSeries.value || !volumeSeries.value || !rsiSeries.value) return;

  const { priceData, volumeData, rsiData } = generateData(200);

  priceSeries.value.setData(priceData);
  volumeSeries.value.setData(volumeData);
  rsiSeries.value.setData(rsiData);

  chart.value?.timeScale().fitContent();
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
  <div class="multi-pane-demo">
    <header>
      <h1>Multi-Pane Chart</h1>
      <p>Price, Volume, and RSI in separate panes</p>
    </header>

    <div class="controls">
      <button @click="regenerateData">Regenerate Data</button>
    </div>

    <div class="chart-wrapper">
      <div ref="chartContainer" class="chart-container" />

      <div class="pane-labels">
        <div class="pane-label" style="top: 20%">Price</div>
        <div class="pane-label" style="top: 75%">Volume</div>
        <div class="pane-label" style="top: 90%">RSI</div>
      </div>
    </div>

    <div class="legend">
      <div class="legend-item">
        <span class="legend-color" style="background: #26a69a"></span>
        <span>Bullish</span>
      </div>
      <div class="legend-item">
        <span class="legend-color" style="background: #ef5350"></span>
        <span>Bearish</span>
      </div>
      <div class="legend-item">
        <span class="legend-color" style="background: #f0b90b"></span>
        <span>RSI</span>
      </div>
    </div>

    <section class="code-example">
      <h2>Implementation</h2>
      <pre><code>// Create chart with multiple panes using priceScaleId

// Main price series (default scale)
const priceSeries = chart.addCandlestickSeries({...});

// Volume in separate pane
const volumeSeries = chart.addHistogramSeries({
  priceScaleId: 'volume',  // Custom scale ID
});
volumeSeries.priceScale().applyOptions({
  scaleMargins: { top: 0.7, bottom: 0 },  // 30% height at bottom
});

// RSI in separate pane
const rsiSeries = chart.addLineSeries({
  priceScaleId: 'rsi',  // Another custom scale
});
rsiSeries.priceScale().applyOptions({
  scaleMargins: { top: 0.85, bottom: 0 },  // 15% height at very bottom
});</code></pre>
    </section>
  </div>
</template>

<style scoped>
.multi-pane-demo {
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
  height: 600px;
  background: #1e222d;
  border-radius: 8px;
}

.pane-labels {
  position: absolute;
  left: 10px;
  top: 0;
  bottom: 0;
  pointer-events: none;
}

.pane-label {
  position: absolute;
  transform: translateY(-50%);
  padding: 0.25rem 0.5rem;
  background: rgba(30, 34, 45, 0.8);
  color: #808a9d;
  font-size: 0.75rem;
  border-radius: 4px;
}

.legend {
  display: flex;
  gap: 2rem;
  padding: 1rem;
  background: #f5f5f5;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 4px;
}

.code-example h2 {
  margin-bottom: 1rem;
}

.code-example pre {
  background: #1e222d;
  color: #d1d4dc;
  padding: 1rem;
  border-radius: 8px;
  overflow-x: auto;
}

.code-example code {
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 0.875rem;
}
</style>
