<!--
  UseChartApi.vue - REST API Integration Example

  Demonstrates the useChartApi composable for:
  - Health checks
  - Creating charts
  - Setting/getting series data
  - Fetching history chunks
  - Smart chunking behavior
-->
<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useChartApi } from '@lightweight-charts-pro/vue3';

// Configuration
const BASE_URL = 'http://localhost:8000/api/charts';
const CHART_ID = `api-demo-${Date.now()}`;

// API composable with all methods
const {
  healthCheck,
  createChart,
  getChart,
  getSeriesData,
  setSeriesData,
  getHistory,
  isLoading,
  error,
  clearError,
} = useChartApi({ baseUrl: BASE_URL });

// State
const results = reactive<Record<string, unknown>>({});
const dataPointCount = ref(1000);

// Generate sample data
function generateData(count: number) {
  const data = [];
  let baseTime = Math.floor(Date.now() / 1000) - count * 86400;
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

// Test functions
async function runHealthCheck() {
  try {
    const health = await healthCheck();
    results.healthCheck = { status: 'PASS', data: health };
  } catch (err) {
    results.healthCheck = { status: 'FAIL', error: String(err) };
  }
}

async function runCreateChart() {
  try {
    const chart = await createChart(CHART_ID, { height: 400 });
    results.createChart = { status: 'PASS', data: chart };
  } catch (err) {
    results.createChart = { status: 'FAIL', error: String(err) };
  }
}

async function runSetSeriesData() {
  try {
    const data = generateData(dataPointCount.value);
    const result = await setSeriesData(CHART_ID, 'price', {
      pane_id: 0,
      series_type: 'candlestick',
      data,
    });
    results.setSeriesData = { status: 'PASS', data: result, pointCount: data.length };
  } catch (err) {
    results.setSeriesData = { status: 'FAIL', error: String(err) };
  }
}

async function runGetChart() {
  try {
    const chart = await getChart(CHART_ID);
    results.getChart = {
      status: 'PASS',
      chartId: chart.chartId,
      hasPanes: 'panes' in chart,
    };
  } catch (err) {
    results.getChart = { status: 'FAIL', error: String(err) };
  }
}

async function runGetSeriesData() {
  try {
    const series = await getSeriesData(CHART_ID, 0, 'price');
    results.getSeriesData = {
      status: 'PASS',
      chunked: series.chunked,
      totalCount: series.totalCount,
      dataCount: series.data?.length,
      hasMoreBefore: series.hasMoreBefore,
      hasMoreAfter: series.hasMoreAfter,
    };
  } catch (err) {
    results.getSeriesData = { status: 'FAIL', error: String(err) };
  }
}

async function runGetHistory() {
  try {
    // Get first data point time for history request
    const series = await getSeriesData(CHART_ID, 0, 'price');
    if (!series.data?.length) {
      throw new Error('No data available');
    }

    const firstTime = series.data[0].time as number;
    const history = await getHistory(CHART_ID, 0, 'price', firstTime, 100);

    results.getHistory = {
      status: 'PASS',
      dataCount: history.data?.length,
      hasMoreBefore: history.hasMoreBefore,
      hasMoreAfter: history.hasMoreAfter,
    };
  } catch (err) {
    results.getHistory = { status: 'FAIL', error: String(err) };
  }
}

async function runAllTests() {
  await runHealthCheck();
  await runCreateChart();
  await runSetSeriesData();
  await runGetChart();
  await runGetSeriesData();
  await runGetHistory();
}

// Test smart chunking behavior
async function testSmartChunking() {
  const smallChartId = `small-${Date.now()}`;
  const largeChartId = `large-${Date.now()}`;

  try {
    // Create charts
    await createChart(smallChartId, {});
    await createChart(largeChartId, {});

    // Small dataset (< 500 points) - should NOT be chunked
    await setSeriesData(smallChartId, 'price', {
      pane_id: 0,
      series_type: 'candlestick',
      data: generateData(100),
    });

    // Large dataset (>= 500 points) - SHOULD be chunked
    await setSeriesData(largeChartId, 'price', {
      pane_id: 0,
      series_type: 'candlestick',
      data: generateData(1000),
    });

    const smallResult = await getSeriesData(smallChartId, 0, 'price');
    const largeResult = await getSeriesData(largeChartId, 0, 'price');

    results.smartChunking = {
      status: !smallResult.chunked && largeResult.chunked ? 'PASS' : 'FAIL',
      small: {
        count: 100,
        chunked: smallResult.chunked,
        expectedChunked: false,
      },
      large: {
        count: 1000,
        chunked: largeResult.chunked,
        expectedChunked: true,
        hasMoreBefore: largeResult.hasMoreBefore,
      },
    };
  } catch (err) {
    results.smartChunking = { status: 'FAIL', error: String(err) };
  }
}
</script>

<template>
  <div class="api-demo">
    <header>
      <h1>useChartApi Demo</h1>
      <p>REST API integration for chart data management</p>
    </header>

    <div class="controls">
      <label>
        Data Points:
        <input v-model.number="dataPointCount" type="number" min="100" max="5000" step="100" />
      </label>
      <button @click="runAllTests" :disabled="isLoading">
        {{ isLoading ? 'Running...' : 'Run All Tests' }}
      </button>
      <button @click="testSmartChunking" :disabled="isLoading">
        Test Smart Chunking
      </button>
    </div>

    <div v-if="error" class="error">
      {{ error }}
      <button @click="clearError">Clear</button>
    </div>

    <section class="results">
      <h2>Test Results</h2>

      <div class="result-grid">
        <!-- Health Check -->
        <div class="result-card" :class="results.healthCheck?.status?.toLowerCase()">
          <h3>Health Check</h3>
          <div class="status">{{ results.healthCheck?.status ?? 'Not run' }}</div>
          <pre v-if="results.healthCheck">{{ JSON.stringify(results.healthCheck, null, 2) }}</pre>
        </div>

        <!-- Create Chart -->
        <div class="result-card" :class="results.createChart?.status?.toLowerCase()">
          <h3>Create Chart</h3>
          <div class="status">{{ results.createChart?.status ?? 'Not run' }}</div>
          <pre v-if="results.createChart">{{ JSON.stringify(results.createChart, null, 2) }}</pre>
        </div>

        <!-- Set Series Data -->
        <div class="result-card" :class="results.setSeriesData?.status?.toLowerCase()">
          <h3>Set Series Data</h3>
          <div class="status">{{ results.setSeriesData?.status ?? 'Not run' }}</div>
          <pre v-if="results.setSeriesData">{{ JSON.stringify(results.setSeriesData, null, 2) }}</pre>
        </div>

        <!-- Get Chart -->
        <div class="result-card" :class="results.getChart?.status?.toLowerCase()">
          <h3>Get Chart</h3>
          <div class="status">{{ results.getChart?.status ?? 'Not run' }}</div>
          <pre v-if="results.getChart">{{ JSON.stringify(results.getChart, null, 2) }}</pre>
        </div>

        <!-- Get Series Data -->
        <div class="result-card" :class="results.getSeriesData?.status?.toLowerCase()">
          <h3>Get Series Data</h3>
          <div class="status">{{ results.getSeriesData?.status ?? 'Not run' }}</div>
          <pre v-if="results.getSeriesData">{{ JSON.stringify(results.getSeriesData, null, 2) }}</pre>
        </div>

        <!-- Get History -->
        <div class="result-card" :class="results.getHistory?.status?.toLowerCase()">
          <h3>Get History</h3>
          <div class="status">{{ results.getHistory?.status ?? 'Not run' }}</div>
          <pre v-if="results.getHistory">{{ JSON.stringify(results.getHistory, null, 2) }}</pre>
        </div>

        <!-- Smart Chunking -->
        <div class="result-card wide" :class="results.smartChunking?.status?.toLowerCase()">
          <h3>Smart Chunking Test</h3>
          <div class="status">{{ results.smartChunking?.status ?? 'Not run' }}</div>
          <pre v-if="results.smartChunking">{{ JSON.stringify(results.smartChunking, null, 2) }}</pre>
        </div>
      </div>
    </section>

    <section class="api-reference">
      <h2>API Reference</h2>
      <table>
        <thead>
          <tr>
            <th>Method</th>
            <th>Description</th>
            <th>Endpoint</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>healthCheck()</code></td>
            <td>Check backend health</td>
            <td>GET /health</td>
          </tr>
          <tr>
            <td><code>createChart(id, options)</code></td>
            <td>Create a new chart</td>
            <td>POST /api/charts/{id}</td>
          </tr>
          <tr>
            <td><code>getChart(id)</code></td>
            <td>Get full chart data</td>
            <td>GET /api/charts/{id}</td>
          </tr>
          <tr>
            <td><code>setSeriesData(chartId, seriesId, data)</code></td>
            <td>Set series data</td>
            <td>POST /api/charts/{id}/data/{series}</td>
          </tr>
          <tr>
            <td><code>getSeriesData(chartId, paneId, seriesId)</code></td>
            <td>Get series data (with smart chunking)</td>
            <td>GET /api/charts/{id}/data/{pane}/{series}</td>
          </tr>
          <tr>
            <td><code>getHistory(chartId, paneId, seriesId, beforeTime, count)</code></td>
            <td>Get history chunk for lazy loading</td>
            <td>GET /api/charts/{id}/history/{pane}/{series}</td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>

<style scoped>
.api-demo {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
}

header {
  margin-bottom: 2rem;
}

header h1 {
  margin: 0 0 0.5rem;
}

header p {
  color: #666;
  margin: 0;
}

.controls {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.controls label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.controls input {
  width: 100px;
  padding: 0.25rem 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.controls button {
  padding: 0.5rem 1rem;
  background: #26a69a;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.controls button:hover:not(:disabled) {
  background: #2bbbad;
}

.controls button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: #ffebee;
  color: #c62828;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.error button {
  padding: 0.25rem 0.5rem;
  background: #c62828;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.results h2 {
  margin-bottom: 1rem;
}

.result-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.result-card {
  background: #f5f5f5;
  border-radius: 8px;
  padding: 1rem;
  border-left: 4px solid #ccc;
}

.result-card.wide {
  grid-column: 1 / -1;
}

.result-card.pass {
  border-left-color: #26a69a;
  background: #e8f5e9;
}

.result-card.fail {
  border-left-color: #ef5350;
  background: #ffebee;
}

.result-card h3 {
  margin: 0 0 0.5rem;
  font-size: 1rem;
}

.result-card .status {
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.result-card pre {
  margin: 0;
  font-size: 0.75rem;
  background: rgba(0, 0, 0, 0.05);
  padding: 0.5rem;
  border-radius: 4px;
  overflow-x: auto;
}

.api-reference {
  margin-top: 2rem;
}

.api-reference table {
  width: 100%;
  border-collapse: collapse;
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
