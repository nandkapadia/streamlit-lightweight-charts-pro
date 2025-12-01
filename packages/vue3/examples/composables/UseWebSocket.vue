<!--
  UseWebSocket.vue - WebSocket Real-time Updates Example

  Demonstrates the useChartWebSocket composable for:
  - Connecting to WebSocket endpoint
  - Receiving real-time data updates
  - Requesting history via WebSocket
  - Handling connection states
-->
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { createChart, type IChartApi, type ISeriesApi } from 'lightweight-charts';
import { useChartWebSocket, useChartApi } from '@lightweight-charts-pro/vue3';

// Configuration
const WS_BASE_URL = 'ws://localhost:8000';
const API_BASE_URL = 'http://localhost:8000/api/charts';
const CHART_ID = `ws-demo-${Date.now()}`;

// Refs
const chartContainer = ref<HTMLDivElement | null>(null);
const chart = ref<IChartApi | null>(null);
const series = ref<ISeriesApi<'Candlestick'> | null>(null);
const messageLog = ref<Array<{ time: string; type: string; data: unknown }>>([]);
const maxLogEntries = 50;

// API composable for initial setup
const { createChart: createChartApi, setSeriesData } = useChartApi({
  baseUrl: API_BASE_URL,
});

// WebSocket composable
const {
  connect,
  disconnect,
  send,
  connectionState,
  lastMessage,
  error: wsError,
} = useChartWebSocket({
  baseUrl: WS_BASE_URL,
  autoReconnect: true,
  reconnectInterval: 3000,
  maxReconnectAttempts: 5,
  onMessage: handleMessage,
  onConnected: handleConnected,
  onDisconnected: handleDisconnected,
  onError: handleError,
});

// Connection state label
const connectionLabel = computed(() => {
  switch (connectionState.value) {
    case 'connecting':
      return 'Connecting...';
    case 'connected':
      return 'Connected';
    case 'disconnected':
      return 'Disconnected';
    case 'error':
      return 'Error';
    default:
      return 'Unknown';
  }
});

// Connection state color
const connectionColor = computed(() => {
  switch (connectionState.value) {
    case 'connected':
      return '#26a69a';
    case 'connecting':
      return '#f0b90b';
    case 'error':
      return '#ef5350';
    default:
      return '#808a9d';
  }
});

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

// Log message
function logMessage(type: string, data: unknown) {
  const now = new Date();
  messageLog.value.unshift({
    time: now.toISOString().split('T')[1].slice(0, 12),
    type,
    data,
  });

  // Limit log size
  if (messageLog.value.length > maxLogEntries) {
    messageLog.value = messageLog.value.slice(0, maxLogEntries);
  }
}

// WebSocket event handlers
function handleConnected() {
  logMessage('connected', { chartId: CHART_ID });
}

function handleDisconnected() {
  logMessage('disconnected', { chartId: CHART_ID });
}

function handleError(err: Error) {
  logMessage('error', { message: err.message });
}

function handleMessage(msg: { type: string; [key: string]: unknown }) {
  logMessage(msg.type, msg);

  // Handle different message types
  switch (msg.type) {
    case 'initial_data_response':
      handleInitialData(msg);
      break;
    case 'history_response':
      handleHistoryData(msg);
      break;
    case 'data_update':
      handleDataUpdate(msg);
      break;
    case 'pong':
      // Ping response, no action needed
      break;
  }
}

function handleInitialData(msg: { panes?: Record<string, unknown>; [key: string]: unknown }) {
  if (!series.value || !msg.panes) return;

  const firstPane = msg.panes['0'] as Record<string, { data?: unknown[] }> | undefined;
  if (firstPane) {
    const firstSeriesKey = Object.keys(firstPane)[0];
    const seriesData = firstPane[firstSeriesKey];
    if (seriesData?.data) {
      series.value.setData(seriesData.data as Parameters<typeof series.value.setData>[0]);
      chart.value?.timeScale().fitContent();
    }
  }
}

function handleHistoryData(msg: { data?: unknown[]; seriesId?: string; [key: string]: unknown }) {
  if (!series.value || !msg.data) return;

  // Prepend history data to existing data
  const currentData = series.value.data();
  const newData = [...(msg.data as typeof currentData), ...currentData];
  series.value.setData(newData);
}

function handleDataUpdate(msg: { data?: unknown; [key: string]: unknown }) {
  if (!series.value || !msg.data) return;

  // Update with new data point
  series.value.update(msg.data as Parameters<typeof series.value.update>[0]);
}

// Actions
async function connectWebSocket() {
  await connect(CHART_ID);
}

function disconnectWebSocket() {
  disconnect();
}

function sendPing() {
  send({ type: 'ping' });
}

function requestInitialData() {
  send({
    type: 'get_initial_data',
    paneId: 0,
    seriesId: 'price',
  });
}

function requestHistory() {
  // Request data before a specific time
  const beforeTime = Math.floor(Date.now() / 1000) - 100 * 86400;
  send({
    type: 'request_history',
    paneId: 0,
    seriesId: 'price',
    beforeTime,
    count: 100,
  });
}

function clearLog() {
  messageLog.value = [];
}

// Initialize chart
async function initializeChart() {
  if (!chartContainer.value) return;

  // Create chart instance
  chart.value = createChart(chartContainer.value, {
    width: chartContainer.value.clientWidth,
    height: 300,
    layout: {
      background: { type: 'solid', color: '#1e222d' },
      textColor: '#d1d4dc',
    },
    grid: {
      vertLines: { color: '#2b2f3a' },
      horzLines: { color: '#2b2f3a' },
    },
  });

  series.value = chart.value.addCandlestickSeries({
    upColor: '#26a69a',
    downColor: '#ef5350',
    borderVisible: false,
    wickUpColor: '#26a69a',
    wickDownColor: '#ef5350',
  });

  // Create chart and set initial data via API
  try {
    await createChartApi(CHART_ID, { height: 300 });

    const data = generateData(200);
    await setSeriesData(CHART_ID, 'price', {
      pane_id: 0,
      series_type: 'candlestick',
      data,
    });

    series.value.setData(data);
    chart.value.timeScale().fitContent();
  } catch (err) {
    console.error('Failed to initialize chart:', err);
  }
}

// Resize handler
function handleResize() {
  if (chart.value && chartContainer.value) {
    chart.value.applyOptions({ width: chartContainer.value.clientWidth });
  }
}

onMounted(async () => {
  await initializeChart();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  disconnect();
  chart.value?.remove();
});
</script>

<template>
  <div class="ws-demo">
    <header>
      <h1>useChartWebSocket Demo</h1>
      <p>Real-time WebSocket communication for live updates</p>
    </header>

    <div class="connection-status">
      <span class="status-dot" :style="{ background: connectionColor }" />
      <span class="status-label">{{ connectionLabel }}</span>
      <span v-if="wsError" class="error-text">{{ wsError }}</span>
    </div>

    <div class="controls">
      <button
        @click="connectWebSocket"
        :disabled="connectionState === 'connected' || connectionState === 'connecting'"
      >
        Connect
      </button>
      <button @click="disconnectWebSocket" :disabled="connectionState !== 'connected'">
        Disconnect
      </button>
      <button @click="sendPing" :disabled="connectionState !== 'connected'">Ping</button>
      <button @click="requestInitialData" :disabled="connectionState !== 'connected'">
        Get Initial Data
      </button>
      <button @click="requestHistory" :disabled="connectionState !== 'connected'">
        Request History
      </button>
    </div>

    <div class="main-content">
      <div class="chart-section">
        <h2>Chart</h2>
        <div ref="chartContainer" class="chart-container" />
      </div>

      <div class="log-section">
        <div class="log-header">
          <h2>Message Log</h2>
          <button @click="clearLog" class="clear-btn">Clear</button>
        </div>
        <div class="message-log">
          <div
            v-for="(msg, index) in messageLog"
            :key="index"
            class="log-entry"
            :class="msg.type"
          >
            <span class="log-time">{{ msg.time }}</span>
            <span class="log-type">{{ msg.type }}</span>
            <pre class="log-data">{{ JSON.stringify(msg.data, null, 2) }}</pre>
          </div>
          <div v-if="messageLog.length === 0" class="log-empty">
            No messages yet. Connect to start receiving messages.
          </div>
        </div>
      </div>
    </div>

    <section class="api-reference">
      <h2>WebSocket Messages</h2>
      <table>
        <thead>
          <tr>
            <th>Message Type</th>
            <th>Direction</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>ping</code></td>
            <td>Client → Server</td>
            <td>Health check ping</td>
          </tr>
          <tr>
            <td><code>pong</code></td>
            <td>Server → Client</td>
            <td>Ping response</td>
          </tr>
          <tr>
            <td><code>get_initial_data</code></td>
            <td>Client → Server</td>
            <td>Request initial chart data</td>
          </tr>
          <tr>
            <td><code>initial_data_response</code></td>
            <td>Server → Client</td>
            <td>Initial data response</td>
          </tr>
          <tr>
            <td><code>request_history</code></td>
            <td>Client → Server</td>
            <td>Request historical data chunk</td>
          </tr>
          <tr>
            <td><code>history_response</code></td>
            <td>Server → Client</td>
            <td>Historical data response</td>
          </tr>
          <tr>
            <td><code>data_update</code></td>
            <td>Server → Client</td>
            <td>Real-time data update (push)</td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>

<style scoped>
.ws-demo {
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

.connection-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding: 0.5rem 1rem;
  background: #f5f5f5;
  border-radius: 4px;
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.status-label {
  font-weight: 500;
}

.error-text {
  color: #ef5350;
  margin-left: 1rem;
}

.controls {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
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
  opacity: 0.5;
  cursor: not-allowed;
}

.main-content {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 1rem;
  margin-bottom: 2rem;
}

@media (max-width: 900px) {
  .main-content {
    grid-template-columns: 1fr;
  }
}

.chart-section h2,
.log-section h2 {
  margin: 0 0 0.5rem;
  font-size: 1rem;
}

.chart-container {
  width: 100%;
  height: 300px;
  background: #1e222d;
  border-radius: 8px;
}

.log-section {
  display: flex;
  flex-direction: column;
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.clear-btn {
  padding: 0.25rem 0.5rem;
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.75rem;
}

.message-log {
  flex: 1;
  max-height: 300px;
  overflow-y: auto;
  background: #1e222d;
  border-radius: 8px;
  padding: 0.5rem;
}

.log-entry {
  padding: 0.5rem;
  border-bottom: 1px solid #2b2f3a;
  font-size: 0.75rem;
}

.log-entry:last-child {
  border-bottom: none;
}

.log-entry.connected {
  border-left: 3px solid #26a69a;
}

.log-entry.disconnected {
  border-left: 3px solid #808a9d;
}

.log-entry.error {
  border-left: 3px solid #ef5350;
}

.log-entry.pong {
  border-left: 3px solid #f0b90b;
}

.log-time {
  color: #808a9d;
  margin-right: 0.5rem;
}

.log-type {
  color: #26a69a;
  font-weight: 500;
}

.log-data {
  margin: 0.25rem 0 0;
  color: #d1d4dc;
  font-size: 0.7rem;
  white-space: pre-wrap;
  word-break: break-all;
}

.log-empty {
  color: #808a9d;
  text-align: center;
  padding: 2rem;
}

.api-reference h2 {
  margin-bottom: 1rem;
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
