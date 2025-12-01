/**
 * @fileoverview Vue 3 composable for WebSocket communication with the chart backend.
 *
 * This composable manages a WebSocket connection for real-time chart updates,
 * including automatic reconnection, ping/pong health checks, and message handling.
 */

import { ref, computed, onUnmounted, type Ref, type ComputedRef } from 'vue';
import type {
  WebSocketState,
  WebSocketConfig,
  WebSocketEventHandlers,
  IncomingMessage,
  OutgoingMessage,
  HistoryResponseMessage,
  InitialDataResponseMessage,
  DataUpdateMessage,
} from '../types';

/**
 * WebSocket state returned by the composable.
 */
export interface UseChartWebSocketState {
  /** Current connection state */
  state: Ref<WebSocketState>;
  /** Whether connected */
  isConnected: ComputedRef<boolean>;
  /** Last error message */
  error: Ref<string | null>;
  /** Number of reconnection attempts */
  reconnectAttempts: Ref<number>;
}

/**
 * WebSocket methods returned by the composable.
 */
export interface UseChartWebSocketMethods {
  /** Connect to WebSocket server */
  connect: () => void;
  /** Disconnect from WebSocket server */
  disconnect: () => void;
  /** Send a message to the server */
  send: (message: OutgoingMessage) => boolean;
  /** Request initial chart data */
  requestInitialData: (paneId?: number, seriesId?: string) => void;
  /** Request historical data */
  requestHistory: (paneId: number, seriesId: string, beforeTime: number, count?: number) => void;
}

/**
 * Return type of the useChartWebSocket composable.
 */
export type UseChartWebSocketReturn = UseChartWebSocketState & UseChartWebSocketMethods;

/**
 * Default reconnection configuration.
 */
const DEFAULT_RECONNECT = {
  enabled: true,
  maxAttempts: 5,
  baseDelay: 1000,
  maxDelay: 30000,
};

/**
 * Default ping interval (30 seconds).
 */
const DEFAULT_PING_INTERVAL = 30000;

/**
 * Vue 3 composable for WebSocket communication with the chart backend.
 *
 * @param config - WebSocket configuration
 * @param handlers - Event handlers for WebSocket events
 * @returns WebSocket state and methods
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useChartWebSocket } from '@lightweight-charts-pro/vue3';
 *
 * const { state, isConnected, connect, disconnect, requestHistory } = useChartWebSocket(
 *   {
 *     url: 'ws://localhost:8000/ws',
 *     chartId: 'my-chart',
 *   },
 *   {
 *     onHistoryResponse: (data) => {
 *       console.log('History received:', data);
 *     },
 *     onDataUpdate: (data) => {
 *       console.log('Data updated:', data);
 *     },
 *   }
 * );
 *
 * // Connect on mount
 * connect();
 * </script>
 * ```
 */
export function useChartWebSocket(
  config: WebSocketConfig,
  handlers: WebSocketEventHandlers = {}
): UseChartWebSocketReturn {
  const {
    url,
    chartId,
    reconnect = DEFAULT_RECONNECT,
    pingInterval = DEFAULT_PING_INTERVAL,
  } = config;

  // Reactive state
  const state = ref<WebSocketState>('disconnected');
  const error = ref<string | null>(null);
  const reconnectAttempts = ref(0);

  // Computed
  const isConnected = computed(() => state.value === 'connected');

  // Internal state
  let socket: WebSocket | null = null;
  let pingTimer: ReturnType<typeof setInterval> | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let isManualDisconnect = false;

  /**
   * Calculate reconnection delay with exponential backoff.
   */
  function getReconnectDelay(): number {
    const { baseDelay = 1000, maxDelay = 30000 } = reconnect;
    const delay = Math.min(
      baseDelay * Math.pow(2, reconnectAttempts.value),
      maxDelay
    );
    // Add jitter (0-500ms)
    return delay + Math.random() * 500;
  }

  /**
   * Handle incoming WebSocket messages.
   */
  function handleMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data) as IncomingMessage;

      switch (message.type) {
        case 'connected':
          state.value = 'connected';
          reconnectAttempts.value = 0;
          handlers.onConnected?.(message.chartId);
          break;

        case 'pong':
          // Connection health confirmed
          break;

        case 'initial_data_response':
          handlers.onInitialData?.(message as InitialDataResponseMessage);
          break;

        case 'history_response':
          handlers.onHistoryResponse?.(message as HistoryResponseMessage);
          break;

        case 'data_update':
          handlers.onDataUpdate?.(message as DataUpdateMessage);
          break;

        default:
          console.warn('Unknown message type:', (message as { type: string }).type);
      }
    } catch (err) {
      console.error('Failed to parse WebSocket message:', err);
    }
  }

  /**
   * Handle WebSocket connection open.
   */
  function handleOpen(): void {
    state.value = 'connecting';
    startPingInterval();
  }

  /**
   * Handle WebSocket connection close.
   */
  function handleClose(): void {
    state.value = 'disconnected';
    stopPingInterval();
    handlers.onDisconnected?.();

    // Attempt reconnection if not manually disconnected
    if (!isManualDisconnect && reconnect.enabled) {
      const maxAttempts = reconnect.maxAttempts ?? DEFAULT_RECONNECT.maxAttempts;
      if (reconnectAttempts.value < maxAttempts) {
        scheduleReconnect();
      } else {
        error.value = `Max reconnection attempts (${maxAttempts}) reached`;
      }
    }
  }

  /**
   * Handle WebSocket errors.
   */
  function handleError(event: Event): void {
    state.value = 'error';
    const errorMessage = 'WebSocket connection error';
    error.value = errorMessage;
    handlers.onError?.(new Error(errorMessage));
  }

  /**
   * Start ping interval for connection health.
   */
  function startPingInterval(): void {
    stopPingInterval();
    pingTimer = setInterval(() => {
      if (socket?.readyState === WebSocket.OPEN) {
        send({ type: 'ping' });
      }
    }, pingInterval);
  }

  /**
   * Stop ping interval.
   */
  function stopPingInterval(): void {
    if (pingTimer) {
      clearInterval(pingTimer);
      pingTimer = null;
    }
  }

  /**
   * Schedule reconnection attempt.
   */
  function scheduleReconnect(): void {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
    }

    const delay = getReconnectDelay();
    reconnectAttempts.value++;

    console.log(
      `Scheduling reconnect attempt ${reconnectAttempts.value} in ${delay}ms`
    );

    reconnectTimer = setTimeout(() => {
      connect();
    }, delay);
  }

  /**
   * Connect to the WebSocket server.
   */
  function connect(): void {
    // Clean up existing connection
    if (socket) {
      socket.close();
      socket = null;
    }

    isManualDisconnect = false;
    state.value = 'connecting';
    error.value = null;

    try {
      const wsUrl = `${url}/charts/${chartId}`;
      socket = new WebSocket(wsUrl);

      socket.onopen = handleOpen;
      socket.onmessage = handleMessage;
      socket.onclose = handleClose;
      socket.onerror = handleError;
    } catch (err) {
      state.value = 'error';
      error.value = err instanceof Error ? err.message : 'Failed to connect';
      handlers.onError?.(err instanceof Error ? err : new Error(String(err)));
    }
  }

  /**
   * Disconnect from the WebSocket server.
   */
  function disconnect(): void {
    isManualDisconnect = true;
    stopPingInterval();

    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }

    if (socket) {
      socket.close();
      socket = null;
    }

    state.value = 'disconnected';
    reconnectAttempts.value = 0;
  }

  /**
   * Send a message to the WebSocket server.
   *
   * @returns true if message was sent, false otherwise
   */
  function send(message: OutgoingMessage): boolean {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected, cannot send message');
      return false;
    }

    try {
      socket.send(JSON.stringify(message));
      return true;
    } catch (err) {
      console.error('Failed to send WebSocket message:', err);
      return false;
    }
  }

  /**
   * Request initial chart data via WebSocket.
   */
  function requestInitialData(paneId?: number, seriesId?: string): void {
    send({
      type: 'get_initial_data',
      paneId,
      seriesId,
    });
  }

  /**
   * Request historical data via WebSocket.
   */
  function requestHistory(
    paneId: number,
    seriesId: string,
    beforeTime: number,
    count: number = 500
  ): void {
    send({
      type: 'request_history',
      paneId,
      seriesId,
      beforeTime,
      count,
    });
  }

  // Cleanup on component unmount
  onUnmounted(() => {
    disconnect();
  });

  return {
    // State
    state,
    isConnected,
    error,
    reconnectAttempts,
    // Methods
    connect,
    disconnect,
    send,
    requestInitialData,
    requestHistory,
  };
}

export default useChartWebSocket;
